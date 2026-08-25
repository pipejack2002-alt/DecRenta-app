import {
  Check,
  ExternalLink,
  Key,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { normasCorpus } from "@/lib/docs/types";
import {
  askGeminiTributario,
  extractDocumentWithGemini,
  GEMINI_MODELS,
  testGeminiKey,
} from "@/lib/ai/gemini";
import { ExtractionPreviewModal } from "./extraction-preview-modal";
import type { VaultDoc } from "@/lib/docs/types";

const QUICK_PROMPTS = [
  { emoji: "📝", label: "Explicar liquidación y saldo", prompt: "¿Cómo se calculó mi impuesto neto y saldo final según la tabla del art. 241 E.T.?" },
  { emoji: "📊", label: "Resumir cifras clave y estado", prompt: "Haz un resumen ejecutivo de mi patrimonio, ingresos de trabajo, depuración y retenciones con mis cifras actuales." },
  { emoji: "⚖️", label: "Análisis del 40 % y límite 1.340 UVT", prompt: "¿Cómo opera el límite del 40 % y las 1.340 UVT en mi cédula general? ¿Tengo deducciones fuera de la bolsa?" },
  { emoji: "🛡️", label: "Auditoría y soportes requeridos", prompt: "¿Qué documentos y soportes probatorios exige la DIAN para blindar mi declaración ante una fiscalización?" },
  { emoji: "💡", label: "Optimización y planeación legal", prompt: "¿Qué estrategias legales (AFC, dependientes, 1% factura electrónica) puedo aplicar para optimizar mi impuesto?" },
];

export function GeminiAsistenteModal({
  isOpen,
  onClose,
  initialText = "",
  initialKind = "consulta",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  initialKind?: string;
}) {
  const aiSettings = useAppStore((s) => s.aiSettings);
  const setAiSettings = useAppStore((s) => s.setAiSettings);
  const d = useAppStore((s) => s.declaration);
  const normas = useAppStore((s) => s.normas);
  const c = useComputed();

  const [inputKey, setInputKey] = useState(aiSettings.geminiApiKey || "");
  const [selectedModel, setSelectedModel] = useState(aiSettings.geminiModel || "gemini-3.6-flash");
  const [keySaved, setKeySaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const [question, setQuestion] = useState(initialText);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracción previa
  const [extractedData, setExtractedData] = useState<{
    doc: VaultDoc;
    amounts: Record<string, number>;
    notes?: string;
  } | null>(null);

  useEffect(() => {
    if (initialText) {
      setQuestion(initialText);
    }
  }, [initialText]);

  if (!isOpen) return null;

  const hasApiKey = Boolean(aiSettings.geminiApiKey?.trim());

  function handleSaveKey() {
    setAiSettings({
      geminiApiKey: inputKey.trim(),
      geminiModel: selectedModel,
    });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function handleTestConnection() {
    const keyToTest = inputKey.trim() || aiSettings.geminiApiKey;
    if (!keyToTest) {
      setTestStatus("error");
      setTestError("Ingrese una API Key para probar.");
      return;
    }
    setTestStatus("testing");
    setTestError(null);
    const res = await testGeminiKey(keyToTest, selectedModel);
    if (res.ok) {
      setTestStatus("ok");
      // Auto-save if working
      setAiSettings({ geminiApiKey: keyToTest, geminiModel: selectedModel });
    } else {
      setTestStatus("error");
      setTestError(res.error);
    }
  }

  async function handleConsultar(queryText?: string) {
    const q = (queryText ?? question).trim();
    if (!q) return;

    const key = aiSettings.geminiApiKey || inputKey.trim();
    if (!key) {
      setError("Configure su Google Gemini API Key para consultar.");
      return;
    }

    setBusy(true);
    setError(null);
    setAnswer(null);

    const context = [
      `AG ${d.year}`,
      `NIT ${d.identity.nit || "(sin)"}`,
      `Patrimonio bruto ${formatCOP(c.casillas[29] ?? 0)}`,
      `Patrimonio líquido ${formatCOP(c.casillas[31] ?? 0)}`,
      `Ingresos trabajo ${formatCOP(c.casillas[32] ?? 0)}`,
      `Renta líquida gravable general ${formatCOP(c.rentaLiquidaGravable)}`,
      `Impuesto neto ${formatCOP(c.impuestoNeto)}`,
      `Saldo: ${c.saldoPagar > 0 ? `A pagar ${formatCOP(c.saldoPagar)}` : `A favor ${formatCOP(c.saldoFavor)}`}`,
      `Obligado a declarar: ${c.obligado ? "Sí" : "No"} (${c.razonesObligado.join("; ")})`,
    ].join(" · ");

    // Si el texto parece un certificado (contiene cifras o palabras clave), también ejecutamos extracción
    const isCertificate =
      /formato 220|certificado|retenci[oó]n|extracto|bancario|cesant[ií]as|salarios|aval[uú]o/i.test(q) &&
      /\d{3,}/.test(q);

    if (isCertificate) {
      const extractRes = await extractDocumentWithGemini({
        apiKey: key,
        model: selectedModel,
        kind: initialKind || "certificado",
        text: q,
      });

      if (extractRes.ok && Object.keys(extractRes.amounts).length > 0) {
        const dummyDoc: VaultDoc = {
          id: crypto.randomUUID(),
          kind: "formato220",
          name: "Certificado analizado",
          mime: "text/plain",
          size: q.length,
          addedAt: new Date().toISOString(),
          notes: extractRes.notes,
        };
        setExtractedData({
          doc: dummyDoc,
          amounts: extractRes.amounts,
          notes: extractRes.notes,
        });
      }
    }

    const res = await askGeminiTributario({
      apiKey: key,
      model: selectedModel,
      question: q,
      context,
      normas: normasCorpus(normas),
    });

    setBusy(false);
    if (!res.ok) {
      setError(res.error);
    } else {
      setAnswer(res.text);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-2xl flex flex-col border border-line">
          {/* Encabezado del Modal */}
          <div className="border-b border-line bg-bg-raised px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-forest text-primary-fg">
                  <Sparkles className="size-4" />
                </span>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Asistente IA Google Gemini Pro
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted">
                Copiloto de investigación, redacción y análisis tributario del Formulario 210
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone={hasApiKey ? "ok" : "warn"} className="gap-1 py-1">
                <Key className="size-3" />
                {hasApiKey ? "API Key Guardada" : "Requiere API Key"}
              </Badge>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted hover:bg-surface transition-colors"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Cuerpo con Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Caja de Configuración de Gemini */}
            <div className="rounded-2xl border border-line bg-bg-raised/70 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                  Configuración de Gemini
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-forest hover:underline"
                >
                  Obtener API Key Gratis en Google AI Studio
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Input API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Google Gemini API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Pega tu clave AIzaSy..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-line bg-surface px-3.5 text-xs font-mono text-ink focus:border-forest focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveKey}
                    className="h-10 px-4 bg-forest text-primary-fg hover:bg-forest-deep"
                  >
                    {keySaved ? (
                      <>
                        <Check className="size-4 mr-1" />
                        ¡Guardada!
                      </>
                    ) : (
                      "Guardar Clave"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing"}
                    className="h-10 text-xs"
                  >
                    {testStatus === "testing" ? "Probando..." : "Probar"}
                  </Button>
                </div>
                {testStatus === "ok" && (
                  <p className="text-xs text-forest font-medium flex items-center gap-1">
                    <Check className="size-3.5" /> Conexión con Gemini exitosa.
                  </p>
                )}
                {testStatus === "error" && testError && (
                  <p className="text-xs text-stamp font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" /> {testError}
                  </p>
                )}
                <p className="text-[11px] text-muted">
                  Tu clave se almacena de forma privada en tu navegador (localStorage) y nunca se comparte públicamente.
                </p>
              </div>

              {/* Selector de Modelo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Modelo de Gemini
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    setAiSettings({ geminiModel: e.target.value });
                  }}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink focus:border-forest focus:outline-none"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} — {m.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompts Rápidos */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Prompts rápidos para su declaración:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setQuestion(p.prompt);
                      void handleConsultar(p.prompt);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-forest hover:bg-forest-mist/30 transition-colors"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Área de Entrada / Pregunta */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">
                Instrucción o Pregunta
              </label>
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Escribe tu consulta tributaria o pega el texto de un certificado (Formato 220, extracto bancario, retención) para que Gemini lo interprete..."
                className="w-full rounded-xl border border-line bg-surface p-3.5 text-xs leading-relaxed text-ink focus:border-forest focus:outline-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => handleConsultar()}
                  disabled={busy || !question.trim()}
                  className="gap-2"
                >
                  <Sparkles className="size-4" />
                  {busy ? "Consultando a Gemini..." : "Consultar Asistente"}
                </Button>
              </div>
            </div>

            {/* Errores */}
            {error && (
              <div className="rounded-xl border border-stamp/30 bg-stamp-mist p-4 text-xs text-stamp flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Notificación de Montos Extraídos */}
            {extractedData && (
              <div className="rounded-xl border border-forest/30 bg-forest-mist p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-forest-deep">
                    ⚡ Se detectaron montos tributarios en el texto
                  </p>
                  <p className="text-[11px] text-forest">
                    {Object.keys(extractedData.amounts).length} conceptos identificados listos para aplicar al Formulario 210.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {}}
                  className="text-xs"
                >
                  <FileText className="size-3.5 mr-1" />
                  Revisar y Validar Montos
                </Button>
              </div>
            )}

            {/* Respuesta Generada */}
            {answer && (
              <Card className="space-y-3 bg-surface border-line">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="size-4 text-forest" />
                    Respuesta de Gemini
                  </CardTitle>
                  <Badge tone="forest">
                    {GEMINI_MODELS.find((m) => m.id === selectedModel)?.label.split(" ")[0]} {selectedModel}
                  </Badge>
                </div>
                <div className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                  {answer}
                </div>
                <CardHint className="pt-2 text-[11px]">
                  Orientación con base en el Estatuto Tributario colombiano (E.T.). Verifique siempre en el SI de Diligenciamiento de la DIAN.
                </CardHint>
              </Card>
            )}
          </div>

          {/* Pie del modal */}
          <div className="border-t border-line bg-bg-raised px-6 py-3 flex items-center justify-between text-xs text-muted">
            <span>Google Gemini AI · AG 2025/2026</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Validación de Extracción */}
      {extractedData && (
        <ExtractionPreviewModal
          doc={extractedData.doc}
          amounts={extractedData.amounts}
          notes={extractedData.notes}
          onClose={() => setExtractedData(null)}
        />
      )}
    </>
  );
}
