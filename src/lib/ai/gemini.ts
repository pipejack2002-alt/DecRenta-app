import { ARTICLES } from "@/lib/legal/articles";
import { etMapForPrompt } from "@/lib/legal/estatuto-index";

export const GEMINI_MODELS = [
  {
    id: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash (Recomendado)",
    desc: "Alta velocidad, máxima estabilidad y análisis formal de la declaración",
    badge: "Recomendado",
  },
  {
    id: "gemini-3.7-flash",
    label: "Gemini 3.7 Flash",
    desc: "Última generación con razonamiento tributario avanzado",
    badge: "Avanzado",
  },
  {
    id: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    desc: "Rendimiento balanceado y respuestas rápidas",
    badge: "Rápido",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    desc: "Modo ultra ligero para consultas directas",
    badge: "Ultra Ligero",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    desc: "Generación 2.5 de alta velocidad y precisión",
    badge: "Estable",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    desc: "Razonamiento profundo para expedientes complejos",
    badge: "Pro",
  },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

const CORPUS = ARTICLES.map(
  (a) => `[${a.citation}] ${a.title}\n${a.text}\nFuente: ${a.url}`,
).join("\n\n");

const ET_MAP = etMapForPrompt();

export async function callGeminiApi({
  apiKey,
  model = "gemini-3.6-flash",
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
      maxOutputTokens: 2048,
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
      // Si el modelo seleccionado no existe en los endpoints actuales de Google (404),
      // reintentamos automáticamente con el modelo activo más reciente (gemini-2.5-flash / gemini-2.5-pro)
      if (res.status === 404 && model !== "gemini-2.5-flash" && model !== "gemini-1.5-flash") {
        const fallbackModel = model.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
        return callGeminiApi({
          apiKey,
          model: fallbackModel,
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
  model = "gemini-3.6-flash",
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
  model = "gemini-3.6-flash",
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
1. Responde en español, claro, profesional y estructurado.
2. CITA SIEMPRE los artículos aplicables del Estatuto Tributario (ej: Art. 103, Art. 206, Art. 336, Art. 241, Art. 115, Art. 119).
3. Si el usuario pregunta por cifras o depuración, explica la fórmula (ej: Ingresos Brutos - INCRNGO - Exentas/Deducciones con tope del 40 % o 1.340 UVT).
4. No des consejos ilegales ni inventes normas. Si una deducción requiere factura electrónica o pago bancarizado, recuérdalo (Art. 771-2 y 771-5).
5. Concluye siempre con una nota breve de que la orientación se basa en el Estatuto Tributario y no sustituye la asesoría formal de un contador público.

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
  model = "gemini-3.6-flash",
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
    const raw = res.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? raw) as {
      amounts?: Record<string, number>;
      notes?: string;
    };
    return {
      ok: true,
      amounts: parsed.amounts ?? {},
      notes: parsed.notes ?? "Extracción completada con éxito.",
    };
  } catch {
    return {
      ok: false,
      error: "No se pudo estructurar la respuesta JSON de Gemini.",
    };
  }
}
