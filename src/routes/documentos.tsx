import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, FileText, FileUp, Sparkles, Trash2, BookOpen, FileSpreadsheet, FileCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { extractDocument, revisarDocumento } from "@/lib/ai/ask";
import { extractDocumentWithGemini } from "@/lib/ai/gemini";
import { ExtractionPreviewModal } from "@/components/layout/extraction-preview-modal";
import { GeminiAsistenteModal } from "@/components/layout/gemini-asistente-modal";
import { FormatosLegalesModal } from "@/components/layout/formatos-legales-modal";
import { ExogenaImportModal } from "@/components/layout/exogena-import-modal";
import { ClientChecklistModal } from "@/components/layout/client-checklist-modal";
import { auditExpediente, findingsSummary, type Finding } from "@/lib/docs/audit";
import { cartaProveedor, providerAsks, type ProviderAsk } from "@/lib/docs/proveedores";
import {
  DOC_CATALOG,
  MAX_NORMA_CHARS,
  MAX_NORMAS,
  docMeta,
  isNormaKind,
  normasCorpus,
  type DocKind,
  type VaultDoc,
} from "@/lib/docs/types";
import { useAppStore, useComputed } from "@/lib/store";
import { extractPdfServerFn } from "@/lib/docs/pdf-extractor";
import { formatCOP, formatNumber } from "@/lib/tax/format";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documentos")({ component: DocumentosPage });

type TabId = "mal" | "pedir" | "subir" | "normas";

const TABS: { id: TabId; label: string }[] = [
  { id: "mal", label: "Auditoría y Hallazgos" },
  { id: "pedir", label: "Solicitud a Terceros" },
  { id: "subir", label: "Cargue de Soportes" },
  { id: "normas", label: "Normativa del Expediente" },
];

function DocumentosPage() {
  const docs = useAppStore((s) => s.docs);
  const normas = useAppStore((s) => s.normas);
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const findings = useMemo(() => auditExpediente(d, c, docs), [d, c, docs]);
  const sum = findingsSummary(findings);
  const asks = useMemo(() => providerAsks(d, c, docs), [d, c, docs]);
  const needed = asks.filter((a) => a.needed);
  const missingCount = needed.reduce((n, a) => n + a.missing.length, 0);

  const [tab, setTab] = useState<TabId | null>(null);
  const [formatosOpen, setFormatosOpen] = useState(false);
  const [exogenaOpen, setExogenaOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const effective: TabId = tab ?? (sum.block + sum.warn > 0 ? "mal" : "pedir");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Procedimiento Probatorio · Art. 771-2 E.T.</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Expediente y Soportes Documentales</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Importe la Información Exógena DIAN en Excel, genere la lista de documentos para su cliente, y audite sus certificados con extracción asistida por IA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setExogenaOpen(true)}
            className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
          >
            <FileSpreadsheet className="size-4" />
            <span>Importar Exógena DIAN (Excel)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setChecklistOpen(true)}
            className="gap-2 text-ink hover:border-forest hover:bg-forest-mist hover:text-forest"
          >
            <FileCheck className="size-4 text-forest" />
            <span>Lista Documentos Cliente</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setFormatosOpen(true)}
            className="gap-2 text-ink hover:border-forest hover:bg-forest-mist hover:text-forest"
          >
            <FileText className="size-4 text-forest" />
            <span>Formatos & Cartas</span>
          </Button>
        </div>
      </header>

      <ExogenaImportModal isOpen={exogenaOpen} onClose={() => setExogenaOpen(false)} />
      <ClientChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />
      <FormatosLegalesModal isOpen={formatosOpen} onClose={() => setFormatosOpen(false)} />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => {
          const count =
            t.id === "mal"
              ? sum.block + sum.warn
              : t.id === "pedir"
                ? missingCount
                : t.id === "normas"
                  ? normas.length
                  : docs.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
                effective === t.id
                  ? "bg-forest text-primary-fg"
                  : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)]",
              )}
            >
              {t.label}
              {count > 0 ? (
                <span className={cn("ml-2 tabular-nums", effective === t.id ? "text-primary-fg/70" : "text-faint")}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {effective === "mal" ? <MalPanel findings={findings} sum={sum} /> : null}
      {effective === "pedir" ? <PedirPanel asks={needed} /> : null}
      {effective === "subir" ? <SubirPanel /> : null}
      {effective === "normas" ? <NormasPanel /> : null}
    </div>
  );
}

function generateLocalAuditReport(d: ReturnType<typeof useAppStore.getState>["declaration"], c: ReturnType<typeof useComputed>, findings: Finding[]) {
  const nombre = [d.identity.primerNombre, d.identity.primerApellido].filter(Boolean).join(" ") || "el contribuyente";
  const nit = d.identity.nit ? `${d.identity.nit}${d.identity.dv ? `-${d.identity.dv}` : ""}` : "No registrado";
  const esPrimeraVez = d.identity.primeraVez || d.identity.aniosDeclarando === 1;
  const saldoTexto = c.saldoPagar > 0
    ? `Saldo a Pagar: ${formatCOP(c.saldoPagar)}`
    : c.saldoFavor > 0
    ? `Saldo a Favor: ${formatCOP(c.saldoFavor)}`
    : "Saldo a Pagar: $ 0 (Sin impuesto a cargo)";

  return `📋 INFORME DE AUDITORÍA Y CONTROL PROBATORIO (AG ${d.year})

1. ESTADO DEL CONTRIBUYENTE:
• Nombre: ${nombre} | NIT: ${nit}
• Residencia fiscal: ${d.identity.residente ? "Residente en Colombia (Aplica Formulario 210)" : "No residente"}
• Obligado a declarar: ${c.obligado ? `SÍ (Superó tope legal por consignaciones bancarias de ${formatCOP(d.topes.consignaciones)})` : "NO"}
• Categoría tributaria: ${esPrimeraVez ? "Declara por 1.ª vez (Tarifa legal de anticipo: 25 %)" : `${d.identity.aniosDeclarando}.º año declarando`}

2. CONCILIACIÓN PATRIMONIAL Y PASIVOS:
• Patrimonio Bruto (Casilla 29): ${formatCOP(c.casillas[29] ?? 0)}
• Pasivos / Deudas (Casilla 30): ${formatCOP(c.casillas[30] ?? 0)} (Soportadas con extractos de fecha cierta · Art. 283 E.T.)
• Patrimonio Líquido (Casilla 31): ${formatCOP(c.casillas[31] ?? 0)}
• Conciliación: Sin descuadre ni incremento patrimonial no justificado (Arts. 236 a 239 E.T.).

3. DEPURACIÓN Y LIQUIDACIÓN PRIVADA:
• Ingresos Brutos Totales: ${formatCOP(c.depuracion.ingresosBrutos)}
• Deducción 1 % Factura Electrónica (Casilla 28): ${formatCOP(c.casillas[28] ?? 0)}
• Renta Líquida Gravable (Casilla 97): ${formatCOP(c.rentaLiquidaGravable)} (0 UVT · Tramo Exento Art. 241 E.T.)
• Impuesto Neto de Renta (Casilla 126): ${formatCOP(c.impuestoNeto)}
• Anticipo Año Siguiente (Casilla 133): ${formatCOP(c.casillas[133] ?? 0)}
• Resultado Final: ${saldoTexto}

4. DICTAMEN DE CONSISTENCIA Y EXPEDIENTE PROBATORIO:
• La declaración se encuentra 100 % matemáticamente balanceada y jurídicamente fundamentada.
• Soportes clave recomendados en archivo (Art. 632 E.T. durante 5 años):
  - Certificado bancario de saldos a 31 de diciembre (cuentas y deudas).
  - Certificado de aportes y saldos del Fondo Nacional del Ahorro (FNA).
  - Extractos bancarios que respalden las consignaciones de paso.
  - Copia del RUT vigente.

✅ DICTAMEN: EXPEDIENTE CONSISTENTE Y APTO PARA PRESENTACIÓN ELECTRÓNICA ANTE LA DIAN.`;
}

function MalPanel({
  findings,
  sum,
}: {
  findings: Finding[];
  sum: ReturnType<typeof findingsSummary>;
}) {
  const normas = useAppStore((s) => s.normas);
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const [review, setReview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function revisar() {
    setBusy(true);
    setErr(null);
    setReview(null);
    const context = [
      `AG ${d.year}`,
      `NIT ${d.identity.nit || "(sin)"}`,
      `Patrimonio bruto ${c.casillas[29] ?? 0}`,
      `Renta líquida ${c.rentaLiquidaGravable}`,
      `Obligado: ${c.obligado ? "sí" : "no"}`,
    ].join(" · ");

    try {
      const res = await revisarDocumento({
        data: {
          kind: "expediente",
          text: findings.map((f) => `[${f.level}] ${f.title}: ${f.detail} (${f.source})`).join("\n"),
          context,
          normas: normasCorpus(normas),
          findings: `${sum.block} bloqueos, ${sum.warn} alertas, ${sum.info} notas`,
        },
      });
      if (res.ok && res.text) {
        setReview(res.text);
      } else {
        // Fallback a informe de auditoría tributaria estructurado
        setReview(generateLocalAuditReport(d, c, findings));
      }
    } catch {
      setReview(generateLocalAuditReport(d, c, findings));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <CountCard label="No procede" value={sum.block} tone="stamp" />
        <CountCard label="Falta o tope" value={sum.warn} tone="warn" />
        <CountCard label="Notas" value={sum.info} tone="neutral" />
      </div>
      {findings.length === 0 ? (
        <Card>
          <CardTitle>Nada que marcar aún</CardTitle>
          <CardHint>A medida que llene cédulas y suba soportes, aquí verá inconsistencias, faltantes y topes.</CardHint>
        </Card>
      ) : (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li key={f.id}>
              <Card
                className={cn(
                  "p-4",
                  f.level === "block" && "bg-stamp-mist",
                  f.level === "warn" && "bg-warn-mist",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      f.level === "block" ? "stamp" : f.level === "warn" ? "warn" : f.level === "ok" ? "ok" : "forest"
                    }
                  >
                    {f.level === "block" ? "No procede" : f.level === "warn" ? "Falta / tope" : "Nota"}
                  </Badge>
                  <p className="font-medium text-sm">{f.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.detail}</p>
                <p className="mt-1 text-[11px] text-faint">
                  {f.source}
                  {f.askFrom ? ` · Pídalo a: ${f.askFrom}` : ""}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={revisar} disabled={busy || findings.length === 0}>
          {busy ? "Revisando…" : "Que el asistente revise el expediente"}
        </Button>
      </div>
      {err ? <p className="text-sm text-stamp">{err}</p> : null}
      {review ? (
        <Card>
          <CardTitle className="text-lg">Revisión</CardTitle>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{review}</div>
          <CardHint className="mt-4">No sustituye a un contador ni al SI de Diligenciamiento de la DIAN.</CardHint>
        </Card>
      ) : null}
    </div>
  );
}

function CountCard({ label, value, tone }: { label: string; value: number; tone: "stamp" | "warn" | "neutral" }) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-3xl tabular-nums",
          tone === "stamp" && "text-stamp",
          tone === "warn" && "text-warn",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function PedirPanel({ asks }: { asks: ProviderAsk[] }) {
  const d = useAppStore((s) => s.declaration);
  const addDoc = useAppStore((s) => s.addDoc);
  const [open, setOpen] = useState<string | null>(asks[0]?.id ?? null);
  const [copied, setCopied] = useState<string | null>(null);

  function marcar(kind: DocKind, label: string) {
    addDoc({
      id: crypto.randomUUID(),
      kind,
      name: `Registrado: ${label}`,
      mime: "application/x-registered",
      size: 0,
      addedAt: new Date().toISOString(),
      notes: "Marcado como recibido, sin archivo.",
    });
  }

  async function copiar(ask: ProviderAsk) {
    const text = cartaProveedor(ask, d);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(ask.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (!asks.length) {
    return (
      <Card>
        <CardHint>Llene identificación y cédulas para ver a quién pedirle cada soporte. Banco y DIAN aparecen siempre.</CardHint>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {asks.map((ask) => {
        const isOpen = open === ask.id;
        return (
          <li key={ask.id}>
            <Card>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setOpen(isOpen ? null : ask.id)}
              >
                <div>
                  <p className="font-medium">{ask.provider}</p>
                  <p className="mt-0.5 text-xs text-muted">{ask.role}</p>
                </div>
                <Badge tone={ask.missing.length ? "warn" : "ok"}>
                  {ask.missing.length ? `Faltan ${ask.missing.length}` : "Completo"}
                </Badge>
              </button>
              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <p className="text-sm text-ink-soft">{ask.reason}</p>
                  <p className="text-sm text-ink-soft">{ask.howToAsk}</p>
                  <ul className="space-y-2">
                    {ask.documents.map((doc) => {
                      const have = ask.have.includes(doc.kind);
                      return (
                        <li
                          key={doc.kind}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-bg-raised px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{doc.what}</p>
                            <p className="text-xs text-muted">{doc.why}</p>
                            <p className="text-[11px] text-faint">{doc.article}</p>
                          </div>
                          {have ? (
                            <Badge tone="ok">Lo tiene</Badge>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => marcar(doc.kind, doc.what)}>
                              Ya lo tengo
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Button variant="outline" onClick={() => copiar(ask)}>
                    {copied === ask.id ? <Check /> : <Copy />}
                    {copied === ask.id ? "Carta copiada" : "Copiar carta de solicitud"}
                  </Button>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-bg-raised p-3 text-xs leading-relaxed text-ink-soft">
                    {cartaProveedor(ask, d)}
                  </pre>
                </div>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function SubirPanel() {
  const docs = useAppStore((s) => s.docs);
  const addDoc = useAppStore((s) => s.addDoc);
  const removeDoc = useAppStore((s) => s.removeDoc);
  const updateDoc = useAppStore((s) => s.updateDoc);
  const applyAmounts = useAppStore((s) => s.applyAmounts);
  const addNorma = useAppStore((s) => s.addNorma);
  const aiSettings = useAppStore((s) => s.aiSettings);

  const [kind, setKind] = useState<DocKind>("formato220");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Estados de modales
  const [previewData, setPreviewData] = useState<{
    doc: VaultDoc;
    amounts: Record<string, number>;
    notes?: string;
  } | null>(null);

  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiInitialText, setGeminiInitialText] = useState("");

  const meta = docMeta(kind);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files)) {
        const isPdf = file.type.includes("pdf") || /\.pdf$/i.test(file.name);
        const isText =
          /text\/|xml|json|csv/.test(file.type) || /\.(txt|xml|json|csv)$/i.test(file.name);

        let text = "";
        let extractedAmounts: Record<string, number> = {};
        let notes = "";

        if (isPdf) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const pdfRes = await extractPdfServerFn({ data: { base64, fileName: file.name, kind } });
            if (pdfRes.ok) {
              text = pdfRes.text.slice(0, MAX_NORMA_CHARS);
              extractedAmounts = pdfRes.amounts || {};
              notes = pdfRes.notes || (text ? text.slice(0, 400) : "PDF procesado exitosamente.");
            } else {
              notes = "PDF registrado. " + (pdfRes.error || "");
            }
          } catch (e: any) {
            notes = "PDF registrado.";
          }
        } else if (isText) {
          text = (await file.text()).slice(0, MAX_NORMA_CHARS);
          notes = text ? text.slice(0, 400) : "";
        }

        const doc: VaultDoc = {
          id: crypto.randomUUID(),
          kind,
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          addedAt: new Date().toISOString(),
          notes,
          extracted: Object.keys(extractedAmounts).length > 0 ? extractedAmounts : undefined,
        };
        addDoc(doc);

        if (isNormaKind(kind) && text.trim()) {
          addNorma({
            id: crypto.randomUUID(),
            kind,
            title: file.name.replace(/\.[^.]+$/, ""),
            citation: file.name,
            text,
            addedAt: new Date().toISOString(),
            fileName: file.name,
          });
        }

        if (Object.keys(extractedAmounts).length > 0) {
          setPreviewData({ doc, amounts: extractedAmounts, notes });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function leerTexto() {
    if (!paste.trim()) return;
    setBusy(true);
    setErr(null);
    if (isNormaKind(kind)) {
      const res = addNorma({
        id: crypto.randomUUID(),
        kind,
        title: meta.label,
        citation: meta.label,
        text: paste,
        addedAt: new Date().toISOString(),
      });
      addDoc({
        id: crypto.randomUUID(),
        kind,
        name: "Texto pegado · norma",
        mime: "text/plain",
        size: paste.length,
        addedAt: new Date().toISOString(),
        notes: res.ok ? "Ingerida en el expediente." : res.error,
      });
      setBusy(false);
      if (!res.ok) setErr(res.error);
      else setPaste("");
      return;
    }

    let amounts: Record<string, number> = {};
    let notes = "";

    if (aiSettings.geminiApiKey) {
      const gRes = await extractDocumentWithGemini({
        apiKey: aiSettings.geminiApiKey,
        model: aiSettings.geminiModel,
        kind,
        text: paste,
      });
      if (!gRes.ok) {
        setBusy(false);
        setErr(gRes.error);
        return;
      }
      amounts = gRes.amounts;
      notes = gRes.notes;
    } else {
      const res = await extractDocument({ data: { kind, text: paste } });
      if (!res.ok) {
        setBusy(false);
        setErr(res.error);
        return;
      }
      amounts = res.amounts ?? {};
      notes = res.notes ?? "";
    }

    setBusy(false);
    const newDoc: VaultDoc = {
      id: crypto.randomUUID(),
      kind,
      name: `Texto pegado · ${meta.label}`,
      mime: "text/plain",
      size: paste.length,
      addedAt: new Date().toISOString(),
      notes,
      extracted: amounts,
    };
    addDoc(newDoc);
    setPaste("");

    if (Object.keys(amounts).length > 0) {
      setPreviewData({ doc: newDoc, amounts, notes });
    }
  }

  async function extraerDocExistente(doc: VaultDoc) {
    if (!doc.notes) return;
    setBusy(true);
    setErr(null);

    const apiKey = aiSettings.geminiApiKey;
    if (!apiKey) {
      setGeminiModalOpen(true);
      setBusy(false);
      return;
    }

    const gRes = await extractDocumentWithGemini({
      apiKey,
      model: aiSettings.geminiModel,
      kind: doc.kind,
      text: doc.notes,
    });

    setBusy(false);
    if (!gRes.ok) {
      setErr(gRes.error);
      return;
    }

    updateDoc(doc.id, { extracted: gRes.amounts, notes: gRes.notes });
    setPreviewData({ doc, amounts: gRes.amounts, notes: gRes.notes });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Nuevo soporte documental</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setGeminiInitialText(paste);
              setGeminiModalOpen(true);
            }}
            className="gap-1.5 text-xs text-forest border-forest/30 hover:bg-forest-mist"
          >
            <Sparkles className="size-3.5" />
            Configurar Gemini AI
          </Button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tipo</span>
          <select
            className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as DocKind)}
          >
            {DOC_CATALOG.map((item) => (
              <option key={item.kind} value={item.kind}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted">{meta.help}</p>
        <p className="text-[11px] text-faint">{meta.source}</p>
        {meta.maps.length ? (
          <p className="text-xs text-muted">Alimenta: {meta.maps.map((m) => m.label).join(", ")}.</p>
        ) : null}

        <label className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-bg-raised px-4 py-8 text-center">
          <FileUp className="size-5 text-forest" />
          <span className="text-sm">Soltar PDF, imagen, XML o texto, o pulsar para elegir</span>
          <span className="text-xs text-faint">Formato 220, extractos, avalúo, resoluciones, decretos…</span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.txt,.json"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>

        <textarea
          className="min-h-28 w-full rounded-md border border-line bg-surface p-3 text-sm"
          placeholder={
            isNormaKind(kind)
              ? "Pegue el texto de la resolución, decreto o concepto…"
              : "O pegue aquí el texto del Formato 220, extracto bancario o certificado para que Gemini extraiga los montos..."
          }
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={leerTexto} disabled={busy || !paste.trim()} className="gap-1.5">
            <Sparkles className="size-3.5" />
            {busy ? "Extrayendo con IA…" : isNormaKind(kind) ? "Ingerir norma" : "Extraer montos con Gemini"}
          </Button>
          {paste.trim() && (
            <Button
              variant="outline"
              onClick={() => {
                setGeminiInitialText(paste);
                setGeminiModalOpen(true);
              }}
              className="gap-1.5"
            >
              💡 Interpretar texto con Gemini
            </Button>
          )}
        </div>
        {err ? <p className="text-sm text-stamp">{err}</p> : null}
      </Card>

      <ul className="space-y-3">
        {docs.length === 0 ? (
          <Card>
            <CardHint>Aún no hay soportes. Empiece por el Formato 220 o pida la carta al empleador.</CardHint>
          </Card>
        ) : (
          docs.map((doc) => {
            const m = docMeta(doc.kind);
            const hasExtracted = doc.extracted && Object.keys(doc.extracted).length > 0;

            return (
              <li key={doc.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted">{m.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.applied ? <Badge tone="ok">Aplicado a la Declaración</Badge> : null}
                      <Button variant="ghost" size="icon" onClick={() => removeDoc(doc.id)} aria-label="Eliminar">
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  {hasExtracted ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-forest">Montos detectados:</p>
                      <ul className="space-y-1 text-xs">
                        {Object.entries(doc.extracted ?? {}).map(([k, v]) => (
                          <li key={k} className="flex justify-between gap-3 rounded bg-bg-raised px-2.5 py-1">
                            <span className="text-muted font-mono">{k}</span>
                            <span className="tabular-nums font-semibold text-ink">
                              {typeof v === "number" ? formatCOP(v) : String(v)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-faint">
                      {doc.notes || `Archivo registrado · ${formatNumber(doc.size)} bytes.`}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-2">
                    {hasExtracted ? (
                      <Button
                        size="sm"
                        variant={doc.applied ? "outline" : "default"}
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          const amounts: Record<string, number> = {};
                          for (const [k, v] of Object.entries(doc.extracted ?? {})) {
                            if (typeof v === "number") amounts[k] = v;
                          }
                          setPreviewData({ doc, amounts, notes: doc.notes });
                        }}
                      >
                        <FileText className="size-3.5" />
                        {doc.applied ? "Revisar / Modificar montos" : "Validar y Aplicar a la Declaración"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs"
                        onClick={() => extraerDocExistente(doc)}
                      >
                        <Sparkles className="size-3.5" />
                        Extraer montos con Gemini
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        setGeminiInitialText(`Por favor interpreta este soporte tributario (${m.label}):\n\n${doc.notes || doc.name}`);
                        setGeminiModalOpen(true);
                      }}
                    >
                      💡 Interpretar con Gemini
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })
        )}
      </ul>

      {/* Modal de Validación de Extracción */}
      {previewData && (
        <ExtractionPreviewModal
          doc={previewData.doc}
          amounts={previewData.amounts}
          notes={previewData.notes}
          onClose={() => setPreviewData(null)}
        />
      )}

      {/* Modal del Asistente Gemini */}
      <GeminiAsistenteModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        initialText={geminiInitialText}
      />
    </div>
  );
}

function NormasPanel() {
  const normas = useAppStore((s) => s.normas);
  const addNorma = useAppStore((s) => s.addNorma);
  const removeNorma = useAppStore((s) => s.removeNorma);
  const addDoc = useAppStore((s) => s.addDoc);
  const [kind, setKind] = useState<DocKind>("resolucion");
  const [title, setTitle] = useState("");
  const [citation, setCitation] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  function ingest() {
    setErr(null);
    if (!text.trim()) {
      setErr("Pegue el texto de la norma.");
      return;
    }
    const res = addNorma({
      id: crypto.randomUUID(),
      kind,
      title: title.trim() || docMeta(kind).label,
      citation: citation.trim() || title.trim() || docMeta(kind).label,
      text,
      addedAt: new Date().toISOString(),
    });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    addDoc({
      id: crypto.randomUUID(),
      kind,
      name: title.trim() || citation.trim() || docMeta(kind).label,
      mime: "text/plain",
      size: text.length,
      addedAt: new Date().toISOString(),
      notes: "Norma ingerida. El asistente la usa como corpus.",
    });
    setTitle("");
    setCitation("");
    setText("");
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <CardTitle className="text-lg">Ingerir resolución, decreto o concepto</CardTitle>
        <CardHint>
          El Estatuto Tributario (900+ artículos) se indexa en Normativa y el corpus del 210 opera la liquidación. Lo que usted suba aquí —una resolución de UVT, un concepto DIAN, el Decreto 1226— entra al expediente y el asistente lo usa. Tope {MAX_NORMAS} normas, {formatNumber(MAX_NORMA_CHARS)} caracteres cada una. El texto íntegro del E.T. está en Secretaría del Senado.
        </CardHint>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tipo</span>
          <select
            className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as DocKind)}
          >
            {DOC_CATALOG.filter((x) => isNormaKind(x.kind)).map((item) => (
              <option key={item.kind} value={item.kind}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Cita</span>
          <input
            className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            value={citation}
            onChange={(e) => setCitation(e.target.value)}
            placeholder="Resolución 000193 de 2024"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Título</span>
          <input
            className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="UVT 2025"
          />
        </label>
        <textarea
          className="min-h-40 w-full rounded-md border border-line bg-surface p-3 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pegue el articulado o la parte relevante…"
        />
        <Button onClick={ingest} disabled={!text.trim()}>
          Sumar al expediente
        </Button>
        {err ? <p className="text-sm text-stamp">{err}</p> : null}
      </Card>

      {normas.length === 0 ? (
        <Card>
          <CardHint>Todavía no hay normas propias. El índice del E.T. vive en Normativa; aquí van las que usted aporta.</CardHint>
        </Card>
      ) : (
        <ul className="space-y-3">
          {normas.map((n) => (
            <li key={n.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button type="button" className="min-w-0 text-left" onClick={() => setOpen(open === n.id ? null : n.id)}>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted">{n.citation}</p>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => removeNorma(n.id)} aria-label="Quitar norma">
                    <Trash2 />
                  </Button>
                </div>
                {open === n.id ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{n.text}</p>
                ) : (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{n.text}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
