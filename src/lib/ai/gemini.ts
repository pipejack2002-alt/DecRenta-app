import { ARTICLES } from "@/lib/legal/articles";
import { etMapForPrompt } from "@/lib/legal/estatuto-index";
import { generateExpertTaxResponse } from "./tax-expert-engine";

export const GEMINI_MODELS = [
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash (Ultra Rápido)",
    desc: "Modelo oficial de alta velocidad, máxima compatibilidad y bajo consumo de cuota",
    badge: "Recomendado",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    desc: "Nueva generación 2.0: ultra precisa para análisis tributario",
    badge: "2.0 Flash",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    desc: "Versión 2.5 para análisis documental avanzado",
    badge: "2.5 Flash",
  },
  {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    desc: "Razonamiento profundo para casos tributarios complejos",
    badge: "Pro",
  },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

const CANDIDATE_MODELS: string[] = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

function getRelevantArticlesSummary(question: string): string {
  const q = question.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 3);

  const scored = ARTICLES.map((a) => {
    let score = 0;
    const full = `${a.citation} ${a.title} ${a.tags.join(" ")} ${a.summary}`.toLowerCase();
    for (const t of tokens) {
      if (full.includes(t)) score += 3;
    }
    if (q.includes("25%") || q.includes("exenta") || q.includes("honorarios") || q.includes("costos")) {
      if (a.id === "et-206" || a.id === "et-336" || a.id === "et-103") score += 15;
    }
    if (q.includes("uvt") || q.includes("tope") || q.includes("1340") || q.includes("40%")) {
      if (a.id === "et-336" || a.id === "et-868") score += 15;
    }
    if (q.includes("dependiente") || q.includes("vivienda") || q.includes("salud") || q.includes("pension")) {
      if (a.id === "et-387" || a.id === "et-119" || a.id === "et-55" || a.id === "et-56") score += 15;
    }
    if (q.includes("ganancia") || q.includes("ocasional") || q.includes("loter") || q.includes("herencia")) {
      if (a.id === "et-300" || a.id === "et-307") score += 15;
    }
    return { a, score };
  });

  const top = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (top.length === 0) {
    return [
      "[Art. 206 Num 10 E.T.] Renta exenta laboral del 25 % (máximo 790 UVT anuales). Para independientes/honorarios aplica si no imputan costos y deducciones.",
      "[Art. 336 E.T.] Límite legal conjunto de rentas exentas y deducciones: 40 % de la renta líquida cedular o máximo 1.340 UVT.",
      "[Art. 241 E.T.] Tabla progresiva de tarifas del impuesto de renta (0 %, 19 %, 28 %, 33 %, 35 %, 37 %, 39 %).",
      "[Art. 103 / 336 E.T.] Cédula general: Rentas de trabajo, de capital y no laborales.",
    ].join("\n");
  }

  return top
    .map(
      (x) =>
        `[${x.a.citation}] ${x.a.title}: ${x.a.summary} (Norma: ${x.a.text.slice(0, 300)}...)`,
    )
    .join("\n\n");
}

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
          .map((m) => m.name.replace(/^models\//, ""))
          .filter(
            (name) =>
              !name.includes("tts") &&
              !name.includes("audio") &&
              !name.includes("embed") &&
              !name.includes("vision") &&
              !name.includes("imagen") &&
              !name.includes("realtime"),
          );
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

  // Normalizar nombres de modelos
  const rawModel = model.replace("-latest", "");
  const modelsToTry = [
    rawModel,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastErrorMsg = "Error en la API de Google Gemini";

  const fullPromptText = systemPrompt
    ? `${systemPrompt}\n\n========================================\nCONSULTA / PREGUNTA DEL DECLARANTE:\n${userPrompt}`
    : userPrompt;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: fullPromptText }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          (errBody as { error?: { message?: string } })?.error?.message ||
          `Error en la API de Gemini (${res.status})`;
        lastErrorMsg = msg;

        const isRetryableModelError =
          res.status === 404 ||
          res.status === 400 ||
          res.status === 429 ||
          res.status === 503 ||
          res.status === 500 ||
          msg.toLowerCase().includes("high demand") ||
          msg.toLowerCase().includes("overloaded") ||
          msg.toLowerCase().includes("capacity") ||
          msg.toLowerCase().includes("quota") ||
          msg.toLowerCase().includes("rate limit") ||
          msg.toLowerCase().includes("try again later") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("not supported") ||
          msg.toLowerCase().includes("no longer available") ||
          msg.toLowerCase().includes("deprecated") ||
          msg.toLowerCase().includes("is not available") ||
          msg.toLowerCase().includes("does not exist") ||
          msg.toLowerCase().includes("update your code") ||
          msg.toLowerCase().includes("unknown model");

        if (isRetryableModelError) {
          console.warn(`[Gemini Fallback] ${currentModel} ocupado o no disponible (${msg}), probando siguiente modelo...`);
          continue;
        }

        return { ok: false, error: msg };
      }

      const data = (await res.json()) as {
        candidates?: {
          content?: { parts?: { text?: string }[] };
          groundingMetadata?: {
            groundingChunks?: { web?: { uri?: string; title?: string } }[];
          };
        }[];
      };

      const candidate = data.candidates?.[0];
      let text = candidate?.content?.parts?.[0]?.text ?? "";

      // Si Google Search Grounding devolvió fuentes web, agregarlas
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
      if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        const webSources: { title: string; uri: string }[] = [];
        for (const chunk of groundingChunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            webSources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        }
        if (webSources.length > 0) {
          const unique = Array.from(new Map(webSources.map((s) => [s.uri, s])).values());
          text +=
            `\n\n---\n### 🌐 Fuentes Web Consultadas:\n` +
            unique.map((s) => `- [${s.title}](${s.uri})`).join("\n");
        }
      }

      return { ok: true, text };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastErrorMsg = "Tiempo de espera agotado al conectar con Gemini. Reintentando...";
      } else {
        lastErrorMsg = err instanceof Error ? err.message : "Error de red al conectar con Google Gemini.";
      }
    }
  }

  return { ok: false, error: lastErrorMsg };
}

export type KeyValidationResult =
  | {
      ok: true;
      detectedModel: string;
      availableModels: string[];
      modelLabel: string;
      quotaTier: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Calcula e identifica el modelo exacto que aplica según la API Key del usuario
 * consultando la lista oficial de modelos autorizados por Google AI Studio.
 */
export async function detectAndValidateApiKey(apiKey: string): Promise<KeyValidationResult> {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, error: "Por favor ingrese una clave de API de Google Gemini." };
  }

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!listRes.ok) {
      const errBody = await listRes.json().catch(() => ({}));
      const msg =
        (errBody as { error?: { message?: string } })?.error?.message ||
        `Error al validar API Key (${listRes.status}). Verifique que la clave sea correcta.`;
      return { ok: false, error: msg };
    }

    const data = (await listRes.json()) as {
      models?: { name: string; supportedGenerationMethods?: string[] }[];
    };

    const validModels = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter(
        (name) =>
          !name.includes("tts") &&
          !name.includes("audio") &&
          !name.includes("embed") &&
          !name.includes("vision") &&
          !name.includes("imagen") &&
          !name.includes("realtime"),
      );

    if (validModels.length === 0) {
      return {
        ok: false,
        error: "Esta API Key no tiene modelos de generación de texto habilitados en Google AI Studio.",
      };
    }

    // Orden de preferencia para el cálculo del modelo óptimo
    const priorityOrder = [
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];

    let chosenModel = priorityOrder.find((pm) => validModels.includes(pm)) || validModels[0];

    // Prueba ligera con el modelo calculado
    const testRes = await callGeminiApi({
      apiKey: key,
      model: chosenModel,
      userPrompt: "Responde únicamente 'OK'",
    });

    if (!testRes.ok) {
      // Probar los demás modelos disponibles hasta encontrar el funcional
      for (const fallbackModel of validModels) {
        if (fallbackModel === chosenModel) continue;
        const retryRes = await callGeminiApi({
          apiKey: key,
          model: fallbackModel,
          userPrompt: "Responde únicamente 'OK'",
        });
        if (retryRes.ok) {
          chosenModel = fallbackModel;
          break;
        }
      }
    }

    // Guardar en caché
    discoveredModelsCache = { key, models: validModels, timestamp: Date.now() };

    const meta = GEMINI_MODELS.find((m) => m.id === chosenModel);
    const modelLabel = meta?.label || chosenModel;

    return {
      ok: true,
      detectedModel: chosenModel,
      availableModels: validModels,
      modelLabel,
      quotaTier: chosenModel.includes("flash") ? "Flash Alta Velocidad (Gratuito y Pago)" : "Pro Razonamiento Avanzado",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red al conectar con Google AI Studio.",
    };
  }
}

export async function testGeminiKey(
  apiKey: string,
  model = "gemini-2.0-flash",
): Promise<{ ok: true; detectedModel?: string } | { ok: false; error: string }> {
  const detectResult = await detectAndValidateApiKey(apiKey);
  if (detectResult.ok) {
    return { ok: true, detectedModel: detectResult.detectedModel };
  }
  return { ok: false, error: detectResult.error };
}

export async function askGeminiTributario({
  apiKey,
  model = "gemini-1.5-flash",
  question,
  context,
  normas,
}: {
  apiKey?: string;
  model?: string;
  question: string;
  context?: string;
  normas?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
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
8. FUENTES OFICIALES Y CITAS EN INTERNET: Al final de tu respuesta, crea obligatoriamente una sección con el encabezado '### 📚 Fuentes y Referencias Oficiales:' donde listes con viñetas los artículos del Estatuto Tributario citados, conceptos DIAN, leyes y decretos reglamentarios con enlaces directos (por ejemplo: Estatuto Tributario https://estatuto.co/, Portal DIAN https://www.dian.gov.co, Ley 2277 de 2022).

Normas y Artículos Aplicables del Estatuto Tributario:
${getRelevantArticlesSummary(question)}

${normas ? `Normas aportadas al expediente:\n${normas}` : ""}`;

  const userPrompt = [
    context ? `Contexto del Declarante y Cifras Actuales:\n${context}` : "",
    `Pregunta / Instrucción del Usuario:\n${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (apiKey?.trim()) {
    const res = await callGeminiApi({
      apiKey: apiKey.trim(),
      model,
      systemPrompt,
      userPrompt,
    });
    if (res.ok) return res;
    console.warn(`[Gemini API Error] Fallback a motor experto tributario: ${res.error}`);
  }

  // Motor Experto Tributario de Respaldo Inmediato (100% disponibilidad con fuentes oficiales)
  const expertText = generateExpertTaxResponse({ question, context, normas });
  return { ok: true as const, text: expertText };
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
