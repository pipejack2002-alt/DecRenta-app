import { ARTICLES } from "@/lib/legal/articles";
import { etMapForPrompt } from "@/lib/legal/estatuto-index";

export const GEMINI_MODELS = [
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash (Recomendado)",
    desc: "Máxima velocidad, 100% estable y compatible con todas las claves de Google",
    badge: "Recomendado",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    desc: "Nueva generación 2.0 de alta velocidad y precisión tributaria",
    badge: "Nuevo 2.0",
  },
  {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    desc: "Razonamiento tributario profundo y auditoría exhaustiva del Formulario 210",
    badge: "Pro",
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash Lite",
    desc: "Modo ultra ligero optimizado para bajo consumo de cuota",
    badge: "Ligero",
  },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

const CORPUS = ARTICLES.map(
  (a) => `[${a.citation}] ${a.title}\n${a.text}\nFuente: ${a.url}`,
).join("\n\n");

const ET_MAP = etMapForPrompt();

export async function callGeminiApi({
  apiKey,
  model = "gemini-1.5-flash",
  systemPrompt,
  userPrompt,
  jsonMode = false,
}: {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) {
    return {
      ok: false,
      error: "Por favor configure su Google Gemini API Key para continuar.",
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const payload: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Si el modelo específico falla o no está disponible en la cuenta del usuario,
      // reintentamos automáticamente con gemini-1.5-flash que es universal
      if (model !== "gemini-1.5-flash") {
        return callGeminiApi({
          apiKey: key,
          model: "gemini-1.5-flash",
          systemPrompt,
          userPrompt,
          jsonMode,
        });
      }

      const errBody = await res.json().catch(() => ({}));
      const msg =
        (errBody as { error?: { message?: string } })?.error?.message ||
        `Error en la API de Gemini (${res.status})`;
      return { ok: false, error: msg };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { ok: true, text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red al conectar con Google Gemini.",
    };
  }
}

export async function testGeminiKey(
  apiKey: string,
  model = "gemini-1.5-flash",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await callGeminiApi({
    apiKey,
    model,
    userPrompt: "Responde únicamente 'OK'",
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: res.error };
}

export async function askGeminiTributario({
  apiKey,
  model = "gemini-1.5-flash",
  question,
  context,
  normas,
}: {
  apiKey: string;
  model?: string;
  question: string;
  context?: string;
  normas?: string;
}) {
  const systemPrompt = `Eres el Asistente Experto en Tributación Colombiana y Formulario 210 (Personas Naturales, AG 2025/2026).
Tu labor es orientar al usuario con base estricta en el Estatuto Tributario (E.T.), la Ley 2277 de 2022, decretos reglamentarios (DUR 1625 de 2016) y conceptos de la DIAN.

REGLAS DE RESPUESTA:
1. Responde en español, de forma clara, detallada, completa, profesional y elegantemente estructurada.
2. FORMATO LIMPIO: NUNCA uses sintaxis LaTeX como \\text{...}, $$...$$ o $...$. Para fórmulas matemáticas usa texto natural legible, por ejemplo: Base = Ingresos Brutos − INCRNGO.
3. Organiza la respuesta con títulos claros, listas con viñetas limpias y párrafos legibles bien desarrollados.
4. CITA SIEMPRE los artículos aplicables del Estatuto Tributario (ej: Art. 103, Art. 206, Art. 336, Art. 241, Art. 115, Art. 119).
5. Si el usuario pregunta por cifras o depuración, explica la fórmula paso a paso con las cifras reales del contexto y desarrolla la explicación completa sin dejar ideas a medias.
6. No des consejos ilegales ni inventes normas. Si una deducción requiere factura electrónica o pago bancarizado, recuérdalo (Art. 771-2 y 771-5).
7. Concluye siempre con una nota breve de que la orientación se basa en el Estatuto Tributario y no sustituye la asesoría formal de un contador público.

Índice del Estatuto Tributario:
${ET_MAP}

Corpus del Formulario 210:
${CORPUS}

${normas ? `Normas aportadas al expediente:\n${normas}` : ""}`;

  const userPrompt = [
    context ? `Contexto del Declarante y Cifras Actuales:\n${context}` : "",
    `Pregunta / Instrucción del Usuario:\n${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return callGeminiApi({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
  });
}

export async function extractDocumentWithGemini({
  apiKey,
  model = "gemini-1.5-flash",
  kind,
  text,
}: {
  apiKey: string;
  model?: string;
  kind: string;
  text: string;
}): Promise<{
  ok: true;
  amounts: Record<string, number>;
  notes: string;
} | { ok: false; error: string }> {
  const systemPrompt = `Eres un extractor experto de certificados tributarios colombianos para la Declaración de Renta Persona Natural (Formulario 210).
Extrae todos los montos en pesos colombianos ($ COP) detectados en el texto.
Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:
{
  "amounts": {
    "<path>": number
  },
  "notes": "<resumen explicativo de lo que se extrajo, conceptos encontrados y artículos del E.T. aplicables>"
}

Paths permitidos y mapeo de casillas oficiales:
- Formato 220 (Ingresos y Retenciones de Trabajo):
  - "trabajo.salarios": Pagos por salarios, emolumentos, horas extras, comisiones (Casilla 36 a 38)
  - "trabajo.cesantiasPagadas": Cesantías e intereses de cesantías efectivamente pagadas o consignadas (Casilla 39)
  - "trabajo.otrasPrestaciones": Gastos de representación, primas, otros pagos (Casilla 40)
  - "trabajo.aportesSaludObligatorios": Aportes obligatorios a salud (Casilla 45)
  - "trabajo.aportesPensionObligatorios": Aportes obligatorios a fondo de pensiones (Casilla 46)
  - "trabajo.aportesVoluntariosRais": Cotizaciones voluntarias al régimen de ahorro individual (Casilla 47)
  - "trabajo.aportesAfcFvpAvc": Aportes a cuentas AFC, fondos de pensiones voluntarias o AVC (Casilla 48)
  - "extra.retenciones": Retenciones en la fuente practicadas en el año (Casillas 50 a 53)
  - "trabajo.cesantiasAcumuladas2016": Cesantías acumuladas a 31 dic 2016 (Casilla 44)
  - "pensiones.ingresos": Pagos por pensiones de jubilación/invalidez (Casilla 42)

- Certificados Bancarios y Financieros:
  - "patrimonio.cuentas": Saldo de cuentas de ahorros, corrientes, fiducias o CDTs a 31 de diciembre
  - "capital.intereses": Rendimientos financieros e intereses abonados en el año gravable
  - "trabajo.interesesVivienda": Intereses y corrección monetaria pagados en créditos de vivienda / leasing habitacional (Art. 119 E.T.)
  - "trabajo.gmf": 4x1000 (GMF) pagado durante el año (100% pagado, el sistema calcula el 50% deducible según Art. 115 E.T.)
  - "patrimonio.obligacionesFinancieras": Saldo de obligaciones y deudas a 31 de diciembre
  - "extra.retenciones": Retención en la fuente practicada por el banco

- Certificados de Retención en la Fuente (Art. 381 E.T.):
  - "honorarios.ingresos": Base bruta de honorarios, comisiones y servicios
  - "capital.arrendamientos": Base bruta de arrendamientos
  - "noLaborales.ingresos": Base bruta de compras o servicios comerciales
  - "extra.retenciones": Valor total retenido en la fuente

- Impuesto Predial y Avalúos:
  - "patrimonio.inmuebles": Avalúo catastral o autoavalúo al 31 de diciembre

Todos los montos deben ser números enteros en pesos (sin comas ni puntos decimales). Si un valor no está presente, no lo incluyas en "amounts".`;

  const userPrompt = `Tipo de documento: ${kind}\n\nTexto del certificado o documento:\n${text.slice(0, 15000)}`;

  const res = await callGeminiApi({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  if (!res.ok) return { ok: false, error: res.error };

  try {
    const raw = JSON.parse(res.text);
    const amounts: Record<string, number> = {};
    if (raw && typeof raw.amounts === "object" && raw.amounts !== null) {
      for (const [k, v] of Object.entries(raw.amounts)) {
        const num = typeof v === "number" ? v : parseInt(String(v).replace(/\D/g, ""), 10);
        if (Number.isFinite(num) && num > 0) {
          amounts[k] = num;
        }
      }
    }
    return {
      ok: true,
      amounts,
      notes: typeof raw?.notes === "string" ? raw.notes : "Extracción automática completada.",
    };
  } catch (err) {
    return {
      ok: false,
      error: "No se pudo interpretar la respuesta estructurada de Gemini. Intente nuevamente.",
    };
  }
}
