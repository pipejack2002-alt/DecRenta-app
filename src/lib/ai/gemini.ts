import { ARTICLES } from "@/lib/legal/articles";
import { etMapForPrompt } from "@/lib/legal/estatuto-index";

export const GEMINI_MODELS = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash (Recomendado)",
    desc: "Última generación oficial Google AI: máxima velocidad, análisis documental y precisión tributaria",
    badge: "Recomendado 2.5",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    desc: "Modelo rápido de alta eficiencia para consultas y cálculos tributarios",
    badge: "2.0 Flash",
  },
  {
    id: "gemini-1.5-flash-latest",
    label: "Gemini 1.5 Flash (Latest)",
    desc: "Versión estable 1.5 actualizada compatible universalmente",
    badge: "Estable",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    desc: "Razonamiento tributario profundo y auditoría exhaustiva del Formulario 210",
    badge: "Pro 2.5",
  },
  {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    desc: "Auditoría experta y análisis de normas del Estatuto Tributario",
    badge: "Pro",
  },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

const CANDIDATE_MODELS: string[] = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
  "gemini-3.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-pro",
];

const CORPUS = ARTICLES.map(
  (a) => `[${a.citation}] ${a.title}\n${a.text}\nFuente: ${a.url}`,
).join("\n\n");

const ET_MAP = etMapForPrompt();

let discoveredModelsCache: { key: string; models: string[]; timestamp: number } | null = null;

async function getAvailableModelsForApiKey(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (discoveredModelsCache && discoveredModelsCache.key === apiKey && now - discoveredModelsCache.timestamp < 300000) {
    return discoveredModelsCache.models;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = (await res.json()) as {
        models?: { name: string; supportedGenerationMethods?: string[] }[];
      };
      if (Array.isArray(data.models)) {
        const valid = data.models
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => m.name.replace(/^models\//, ""));
        if (valid.length > 0) {
          discoveredModelsCache = { key: apiKey, models: valid, timestamp: now };
          return valid;
        }
      }
    }
  } catch (err) {
    console.warn("[Gemini Models Discovery] Error listing models:", err);
  }

  return CANDIDATE_MODELS;
}

export async function callGeminiApi({
  apiKey,
  model = "gemini-2.5-flash",
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

  // Descubrir modelos activos si es posible, o usar lista de candidatos
  const discovered = await getAvailableModelsForApiKey(key);
  const preferredModel = discovered.includes(model) ? model : discovered[0] || model;

  const modelsToTry = [
    preferredModel,
    ...discovered.filter((m) => m !== preferredModel),
    ...CANDIDATE_MODELS.filter((m) => m !== preferredModel && !discovered.includes(m)),
  ];

  let lastErrorMsg = "Error en la API de Google Gemini";

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;

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
        const errBody = await res.json().catch(() => ({}));
        const msg =
          (errBody as { error?: { message?: string } })?.error?.message ||
          `Error en la API de Gemini (${res.status})`;
        lastErrorMsg = msg;

        const isModelAvailabilityError =
          res.status === 404 ||
          res.status === 400 ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported") ||
          msg.toLowerCase().includes("no longer available") ||
          msg.toLowerCase().includes("deprecated") ||
          msg.toLowerCase().includes("is not available") ||
          msg.toLowerCase().includes("does not exist") ||
          msg.toLowerCase().includes("update your code") ||
          msg.toLowerCase().includes("unknown model");

        // Si el modelo falló por disponibilidad, probar inmediatamente el siguiente candidato
        if (isModelAvailabilityError) {
          console.warn(`[Gemini Fallback] ${currentModel} no disponible (${msg}), probando siguiente modelo...`);
          continue;
        }

        return { ok: false, error: msg };
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return { ok: true, text };
    } catch (err) {
      lastErrorMsg = err instanceof Error ? err.message : "Error de red al conectar con Google Gemini.";
    }
  }

  return { ok: false, error: lastErrorMsg };
}

export async function testGeminiKey(
  apiKey: string,
  model = "gemini-2.0-flash",
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
  model = "gemini-2.0-flash",
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

REGLAS DE RESPUESTA (LENGUAJE PROFESIONAL Y 100% COLOMBIANO):
1. Responde en español formal, claro, pedagógico, directo y elegantemente estructurado.
2. TERMINOLOGÍA CLARA Y NATURAL EN COLOMBIA:
   - NUNCA uses la sigla técnica "INCRNGO" de forma aislada o cruda. Escribe siempre la expresión completa y clara: "Ingresos No Constitutivos de Renta (como aportes obligatorios a Salud y Pensión)".
   - NUNCA uses términos coloquiales o informales como "bolsa", "meter en la bolsa" o "bolsa general". Emplea siempre la terminología legal oficial: "Límite legal conjunto del 40 % o 1.340 UVT (Art. 336 E.T.)", "Tope global unificado" o "Cómputo conjunto de deducciones y rentas exentas".
   - Explica los conceptos en términos cotidianos que cualquier colombiano comprenda (aportes de nómina o PILA, dependientes a cargo, intereses de vivienda, medicina prepagada, ahorro en AFC, 1 % de compras con factura electrónica, retenciones practicadas).
3. FORMATO LIMPIO: NUNCA uses sintaxis LaTeX como \\text{...}, $$...$$ o $...$. Para fórmulas matemáticas usa texto natural legible, por ejemplo:
   Base gravable = Ingresos Brutos − Ingresos No Constitutivos de Renta (Salud y Pensión).
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
  model = "gemini-2.0-flash",
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
