import { createServerFn } from "@tanstack/react-start";
import { ARTICLES } from "@/lib/legal/articles";
import { etMapForPrompt } from "@/lib/legal/estatuto-index";

const CORPUS = ARTICLES.map(
  (a) => `[${a.citation}] ${a.title}\n${a.text}\nFuente: ${a.url}`,
).join("\n\n");

const ET_MAP = etMapForPrompt();

export const askNorma = createServerFn({ method: "POST" })
  .validator((input: { question: string; context?: string; normas?: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "El asistente no está disponible en este entorno." };

    const extra = (data.normas ?? "").slice(0, 24_000);
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: `Eres un asistente de orientación tributaria colombiana para el Formulario 210 (persona natural residente, AG 2025). Responde en español, con citas a artículos. No eres contador ni la DIAN. Si hay duda, dilo.

Mapa del Estatuto Tributario (Decreto 624 de 1989). El texto íntegro está en Secretaría del Senado:
${ET_MAP}

Corpus operativo del 210 (resúmenes de trabajo; contraste con la norma vigente):
${CORPUS}

${extra ? `Normas que el usuario subió a su expediente (pueden ser resoluciones, decretos, conceptos). Úsalas si aplican, y dilo si contradicen el corpus:\n${extra}` : ""}

Siempre indica la fuente (artículo y URL oficial) y aclara que debe verificarse en el SI de Diligenciamiento DIAN.`,
          },
          {
            role: "user",
            content: data.context
              ? `Contexto de la declaración del usuario:\n${data.context}\n\nPregunta: ${data.question}`
              : data.question,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `No se pudo consultar la norma (${res.status}).` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    return { ok: true as const, text: body.choices[0]?.message.content ?? "" };
  });

export const extractDocument = createServerFn({ method: "POST" })
  .validator((input: { kind: string; text: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "La lectura automática no está disponible." };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "Extrae montos en pesos colombianos de un certificado tributario. Devuelve SOLO JSON válido: {\"amounts\": {\"path\": number}, \"notes\": string}. Paths permitidos: trabajo.salarios, trabajo.cesantiasPagadas, trabajo.aportesPensionObligatorios, trabajo.aportesSaludObligatorios, trabajo.interesesVivienda, trabajo.medicinaPrepagada, trabajo.gmf, trabajo.aportesAfcFvpAvc, extra.retenciones, patrimonio.cuentas, patrimonio.inmuebles, capital.intereses, capital.arrendamientos, dividendos.subcedula1, honorarios.ingresos, pensiones.ingresos, topes.consignaciones. Números enteros sin puntos.",
          },
          {
            role: "user",
            content: `Tipo de documento: ${data.kind}\n\nTexto:\n${data.text.slice(0, 8000)}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `No se pudo leer el documento (${res.status}).` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    const raw = body.choices[0]?.message.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(jsonMatch?.[0] ?? raw) as {
        amounts?: Record<string, number>;
        notes?: string;
      };
      return { ok: true as const, amounts: parsed.amounts ?? {}, notes: parsed.notes ?? "" };
    } catch {
      return { ok: false as const, error: "No se pudo interpretar la respuesta." };
    }
  });

export const revisarDocumento = createServerFn({ method: "POST" })
  .validator(
    (input: { kind: string; text: string; context?: string; normas?: string; findings?: string }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "La revisión no está disponible en este entorno." };

    const extra = (data.normas ?? "").slice(0, 24_000);
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: `Revisas soportes y normas de un expediente de renta colombiano (Formulario 210, AG 2025). Responde en español. No eres la DIAN ni un contador.

Di, en este orden:
1. Qué es el texto (certificado, resolución, decreto, concepto, escritura…).
2. Qué está mal, incompleto o no cuadra con el E.T. o con la declaración.
3. Qué documento falta o qué hay que pedirle al proveedor.
4. Artículos citados (número + idea) y enlace a Secretaría del Senado cuando aplique.

Mapa del E.T.:
${ET_MAP}

Corpus 210:
${CORPUS}

${extra ? `Normas del expediente:\n${extra}` : ""}`,
          },
          {
            role: "user",
            content: [
              data.context ? `Declaración:\n${data.context}` : "",
              data.findings ? `Hallazgos automáticos:\n${data.findings}` : "",
              `Tipo: ${data.kind}`,
              `Texto:\n${data.text.slice(0, 10_000)}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `No se pudo revisar (${res.status}).` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    return { ok: true as const, text: body.choices[0]?.message.content ?? "" };
  });
