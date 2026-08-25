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
  Eye,
  EyeOff,
  Trash2,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  type GeminiModelId,
} from "@/lib/ai/gemini";
import { ExtractionPreviewModal } from "./extraction-preview-modal";
import { FormattedMarkdown } from "@/components/ui/formatted-markdown";
import type { VaultDoc } from "@/lib/docs/types";

const QUICK_PROMPTS = [
  { emoji: "📝", label: "Explicar cálculo del impuesto y saldo", prompt: "¿Cómo se calculó mi impuesto neto y saldo final según la tabla del art. 241 E.T.?" },
  { emoji: "📊", label: "Resumen de cifras clave y estado", prompt: "Haz un resumen ejecutivo de mi patrimonio, ingresos de trabajo, depuración y retenciones con mis cifras actuales." },
  { emoji: "⚖️", label: "Tope del 40 % (1.340 UVT) y deducciones", prompt: "¿Cómo se calcula el límite conjunto del 40 % y las 1.340 UVT en la cédula general? ¿Cuáles deducciones y rentas exentas aplican de forma independiente?" },
  { emoji: "🛡️", label: "Soportes y auditoría DIAN", prompt: "¿Qué documentos y soportes probatorios exige la DIAN para blindar mi declaración ante una fiscalización?" },
  { emoji: "💡", label: "Optimización y beneficios tributarios", prompt: "¿Qué estrategias legales (cuentas AFC, dependientes económicos, 1 % de compras con factura electrónica) puedo aplicar para optimizar mi impuesto?" },
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const aiSettings = useAppStore((s) => s.aiSettings);
  const setAiSettings = useAppStore((s) => s.setAiSettings);
  const d = useAppStore((s) => s.declaration);
  const normas = useAppStore((s) => s.normas);
  const c = useComputed();

  const savedKey =
    aiSettings.geminiApiKey ||
    (typeof window !== "undefined" ? localStorage.getItem("tributoapp_gemini_api_key") || "" : "");

  const [inputKey, setInputKey] = useState(savedKey);
  const [selectedModel, setSelectedModel] = useState<string>(aiSettings.geminiModel || "gemini-1.5-flash");
  const [showKeyText, setShowKeyText] = useState(false);
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

  // Sincronizar al abrir o cambiar la clave
  useEffect(() => {
    if (isOpen) {
      const currentKey =
        aiSettings.geminiApiKey ||
        (typeof window !== "undefined" ? localStorage.getItem("tributoapp_gemini_api_key") || "" : "");
      setInputKey(currentKey);
      setSelectedModel(aiSettings.geminiModel || "gemini-1.5-flash");
      setTestStatus(currentKey ? "ok" : "idle");
      setTestError(null);
    }
  }, [isOpen, aiSettings.geminiApiKey, aiSettings.geminiModel]);

  useEffect(() => {
    if (initialText) {
      setQuestion(initialText);
    }
  }, [initialText]);

  if (!isOpen || !mounted) return null;

  const hasApiKey = Boolean(inputKey.trim() || aiSettings.geminiApiKey?.trim());

  function handleSaveKey() {
    const key = inputKey.trim();
    if (!key) return;
    setAiSettings({
      geminiApiKey: key,
      geminiModel: selectedModel,
    });
    setKeySaved(true);
    setTestStatus("ok");
    setTimeout(() => setKeySaved(false), 2500);
  }

  function handleClearKey() {
    if (confirm("¿Desea borrar la clave API Key guardada de Google Gemini?")) {
      setInputKey("");
      setAiSettings({ geminiApiKey: "" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("tributoapp_gemini_api_key");
      }
      setTestStatus("idle");
    }
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
      // Guardar automáticamente si pasa la prueba
      setAiSettings({ geminiApiKey: keyToTest, geminiModel: selectedModel });
    } else {
      setTestStatus("error");
      setTestError(res.error);
    }
  }

  async function handleConsultar(queryText?: string) {
    const q = (queryText ?? question).trim();
    if (!q) return;

    const key = inputKey.trim() || aiSettings.geminiApiKey;
    if (!key) {
      setError("Por favor configure y guarde su Google Gemini API Key para continuar.");
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

    // Extracción si parece un certificado
    const isCertificate =
      /formato 220|certificado|retenci[oó]n|extracto|bancario|cesant[ií]as|salarios|aval[uú]o/i.test(q) &&
      /\d{3,}/.test(q);

    if (isCertificate) {
      try {
        const ext = await extractDocumentWithGemini({
          text: q,
          kind: "formato220",
          apiKey: key,
          model: selectedModel,
        });

        if (ext.ok && Object.keys(ext.amounts).length > 0) {
          setExtractedData({
            doc: {
              id: `doc-ai-${Date.now()}`,
              name: `Certificado Extraído IA`,
              kind: "formato220",
              mime: "text/plain",
              size: q.length,
              addedAt: new Date().toISOString(),
              notes: ext.notes || "",
            },
            amounts: ext.amounts,
            notes: ext.notes,
          });
        }
      } catch (err) {
        console.error("Fallo la extracción automática", err);
      }
    }

    // Consulta tributaria normal con RAG
    const normasTexto = normasCorpus(normas);
    const res = await askGeminiTributario({
      question: q,
      context,
      normas: normasTexto,
      apiKey: key,
      model: selectedModel,
    });

    setBusy(false);
    if (res.ok) {
      setAnswer(res.text);
    } else {
      setError(res.error);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Encabezado del Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-bg/60 px-6 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-forest text-primary-fg shadow-sm">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink leading-tight">
                  Asistente IA Google Gemini
                </h2>
                <p className="text-xs text-muted">
                  Copiloto de investigación, auditoría y análisis tributario del Formulario 210
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone={hasApiKey ? "ok" : "warn"} className="gap-1 py-1">
              <Key className="size-3" />
              {hasApiKey ? "API Key Activa y Guardada" : "Requiere API Key"}
            </Badge>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-forest transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Caja de Configuración de Gemini */}
          <div className="rounded-2xl border border-line bg-bg/50 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted flex items-center gap-1.5">
                <Lock className="size-3 text-forest" /> Configuración de Google Gemini
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">
                  Google Gemini API Key
                </label>
                {hasApiKey && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Guardada permanentemente en su navegador
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeyText ? "text" : "password"}
                    placeholder="Pega tu clave AIzaSy..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="h-10 w-full rounded-xl border border-line bg-surface px-3.5 pr-10 text-xs font-mono text-ink focus:border-forest focus:outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1"
                    title={showKeyText ? "Ocultar clave" : "Mostrar clave"}
                  >
                    {showKeyText ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveKey}
                  disabled={!inputKey.trim()}
                  className="h-10 px-4 bg-forest text-primary-fg hover:bg-forest-deep shadow-sm text-xs font-semibold"
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
                  disabled={testStatus === "testing" || !inputKey.trim()}
                  className="h-10 text-xs"
                >
                  {testStatus === "testing"
                    ? "Probando..."
                    : testStatus === "ok"
                      ? "✓ Conectado"
                      : "Probar"}
                </Button>
                {hasApiKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearKey}
                    title="Borrar API Key"
                    className="h-10 px-2.5 text-muted hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              {testError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {testError}
                </p>
              )}
            </div>

            {/* Selector de Modelo Gemini */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Modelo de Gemini
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const m = e.target.value as GeminiModelId;
                  setSelectedModel(m);
                  setAiSettings({ geminiModel: m });
                }}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-xs text-ink focus:border-forest focus:outline-none shadow-sm"
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
              Prompts Rápidos para su Declaración:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setQuestion(p.prompt);
                    handleConsultar(p.prompt);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-forest hover:bg-forest-mist hover:text-forest transition-colors shadow-sm"
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input de Pregunta / Certificado */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">
              Instrucción, Pregunta o Texto de Certificado
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escriba su consulta tributaria o pegue el texto de un certificado para que Gemini lo interprete y auto-rellene la declaración..."
              className="w-full rounded-xl border border-line bg-surface p-3.5 text-xs text-ink focus:border-forest focus:outline-none shadow-sm resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => handleConsultar()}
                disabled={busy || !question.trim()}
                className="gap-2 bg-forest text-primary-fg hover:bg-forest-deep px-5 shadow-sm font-semibold text-xs"
              >
                <Sparkles className="size-4" />
                {busy ? "Consultando con Gemini..." : "Analizar con IA"}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al consultar</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Respuesta */}
          {answer && (
            <div className="rounded-2xl border border-forest/30 bg-forest-mist/30 p-5 space-y-3 animate-in fade-in shadow-sm">
              <div className="flex items-center justify-between border-b border-forest/20 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-forest" />
                  <h4 className="font-display font-bold text-ink text-sm">
                    Análisis Tributario Asistido por Gemini
                  </h4>
                </div>
                <Badge tone="neutral" className="text-[10px]">
                  {selectedModel}
                </Badge>
              </div>

              <div className="bg-surface/90 rounded-xl p-4 border border-line/70 shadow-sm">
                <FormattedMarkdown content={answer} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-bg/40 px-6 py-3.5 flex items-center justify-between text-xs text-muted">
          <span>Google Gemini AI · AG 2025/2026</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {/* Modal de confirmación de extracción si aplica */}
      {extractedData && (
        <ExtractionPreviewModal
          doc={extractedData.doc}
          amounts={extractedData.amounts}
          notes={extractedData.notes}
          onClose={() => setExtractedData(null)}
        />
      )}
    </div>,
    document.body
  );
}
