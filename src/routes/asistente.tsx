import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Check, ExternalLink, Key, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { askNorma } from "@/lib/ai/ask";
import { askGeminiTributario, GEMINI_MODELS, testGeminiKey } from "@/lib/ai/gemini";
import { normasCorpus } from "@/lib/docs/types";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";

export const Route = createFileRoute("/asistente")({ component: AsistentePage });

const PROMPTS = [
  { emoji: "📝", label: "Explicar liquidación y saldo", prompt: "¿Cómo se calculó mi impuesto neto y saldo final según la tabla del art. 241 E.T.?" },
  { emoji: "📊", label: "Resumir cifras clave y estado", prompt: "Haz un resumen ejecutivo de mi patrimonio, ingresos de trabajo, depuración y retenciones con mis cifras actuales." },
  { emoji: "⚖️", label: "Análisis del 40 % y límite 1.340 UVT", prompt: "¿Cómo opera el límite del 40 % y las 1.340 UVT en mi cédula general? ¿Tengo deducciones fuera de la bolsa?" },
  { emoji: "🛡️", label: "Auditoría y soportes requeridos", prompt: "¿Qué documentos y soportes probatorios exige la DIAN para blindar mi declaración ante una fiscalización?" },
  { emoji: "💡", label: "Optimización y planeación legal", prompt: "¿Qué estrategias legales (AFC, dependientes, 1% factura electrónica) puedo aplicar para optimizar mi impuesto?" },
  { emoji: "💼", label: "25 % exención vs. costos en honorarios", prompt: "¿Por qué no puedo tomar el 25 % de renta exenta sobre honorarios si también imputo costos y gastos?" },
];

function AsistentePage() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      setAiSettings({ geminiApiKey: keyToTest, geminiModel: selectedModel });
    } else {
      setTestStatus("error");
      setTestError(res.error);
    }
  }

  async function run(question: string) {
    setBusy(true);
    setErr(null);
    setA(null);
    const context = [
      `AG ${d.year}`,
      `NIT ${d.identity.nit || "(sin)"}`,
      `Patrimonio bruto ${formatCOP(c.casillas[29] ?? 0)}`,
      `Patrimonio líquido ${formatCOP(c.casillas[31] ?? 0)}`,
      `Ingresos trabajo ${formatCOP(c.casillas[32] ?? 0)}`,
      `Renta líquida gravable ${formatCOP(c.rentaLiquidaGravable)}`,
      `Impuesto neto ${formatCOP(c.impuestoNeto)}`,
      `Saldo: ${c.saldoPagar > 0 ? `A pagar ${formatCOP(c.saldoPagar)}` : `A favor ${formatCOP(c.saldoFavor)}`}`,
      `Obligado: ${c.obligado ? "sí" : "no"}`,
      c.razonesObligado.join("; "),
    ].join(" · ");

    if (aiSettings.geminiApiKey) {
      const res = await askGeminiTributario({
        apiKey: aiSettings.geminiApiKey,
        model: selectedModel,
        question,
        context,
        normas: normasCorpus(normas),
      });
      setBusy(false);
      if (!res.ok) setErr(res.error);
      else setA(res.text);
    } else {
      const res = await askNorma({ data: { question, context, normas: normasCorpus(normas) } });
      setBusy(false);
      if (!res.ok) setErr(res.error);
      else setA(res.text);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Asistente Tributario</p>
          <h1 className="mt-1 font-display text-4xl">Asistente IA Google Gemini</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Copiloto tributario anclado al Estatuto Tributario, la Ley 2277 de 2022 y las cifras en tiempo real de su Formulario 210.
          </p>
        </div>
        <Badge tone={hasApiKey ? "ok" : "warn"} className="gap-1.5 py-1 text-xs">
          <Key className="size-3.5" />
          {hasApiKey ? "Gemini Conectado" : "Requiere API Key"}
        </Badge>
      </header>

      {/* Caja de Configuración de Gemini */}
      <div className="rounded-2xl border border-line bg-bg-raised/70 p-5 space-y-4 shadow-sm">
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
          Prompts rápidos para la declaración:
        </p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-forest hover:bg-forest-mist/30 transition-colors"
              onClick={() => {
                setQ(p.prompt);
                void run(p.prompt);
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card de Consulta */}
      <Card className="space-y-3">
        <label className="text-xs font-semibold text-ink">
          Instrucción o Pregunta
        </label>
        <textarea
          className="min-h-28 w-full rounded-xl border border-line bg-bg-raised p-3.5 text-xs leading-relaxed text-ink focus:border-forest focus:outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej. ¿Cómo aplico el beneficio de deducción del 1 % en compras con factura electrónica según el Art. 336?"
        />
        <div className="flex justify-end">
          <Button disabled={busy || !q.trim()} onClick={() => run(q.trim())} className="gap-1.5">
            <Sparkles className="size-4" />
            {busy ? "Consultando a Gemini…" : "Consultar Asistente"}
          </Button>
        </div>
      </Card>

      {err ? (
        <div className="rounded-xl border border-stamp/30 bg-stamp-mist p-4 text-xs text-stamp flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      ) : null}

      {a ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="size-4 text-forest" />
              Respuesta del Asistente
            </CardTitle>
            <Badge tone="forest">
              {GEMINI_MODELS.find((m) => m.id === selectedModel)?.label.split(" ")[0]} {selectedModel}
            </Badge>
          </div>
          <div className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">{a}</div>
          <CardHint className="mt-4 pt-2">
            Orientación con base en el Estatuto Tributario y fuentes oficiales. Verifique siempre en el SI de Diligenciamiento de la DIAN.
          </CardHint>
        </Card>
      ) : null}
    </div>
  );
}
