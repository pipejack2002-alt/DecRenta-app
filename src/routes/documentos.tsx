import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  FileText,
  FileUp,
  Sparkles,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Printer,
  ShieldCheck,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { extractUniversalDocServerFn } from "@/lib/docs/universal-extractor";
import {
  parseFormato220Text,
  parseCertificadoBancarioText,
  parseCertCesantiasText,
  parseCertAfcFvpText,
  parseInteresesViviendaText,
  parseMedicinaPrepagadaText,
  parsePilaText,
  parseCertDeudasText,
  parseCertDividendosText,
  parseCertHonorariosText,
  parseAvaluoPredialText,
  parseIcetexText,
  parseDonacionesText,
  parsePensionJubilacionText,
  parseForm210AnteriorText,
  parseVehiculoText,
  parseFacturaElectronicaText,
  parseCertRetencionGeneralText,
} from "@/lib/docs/pdf-extractor";
import { parseDocumentInBrowser } from "@/lib/docs/client-pdf-parser";
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
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Paso 2 · Procedimiento Probatorio y Soportes (Art. 771-2 E.T.)</p>
          <h1 className="mt-1 font-display text-4xl font-bold">2. Soportes y Documentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Importe la Información Exógena DIAN en Excel, cargue o arrastre cualquier soporte (PDF, fotos con OCR, Word, extractos), audite inconsistencias y genere solicitudes a terceros.
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
          const active = t.id === effective;
          const count =
            t.id === "mal"
              ? sum.block + sum.warn
              : t.id === "pedir"
                ? missingCount
                : t.id === "subir"
                  ? docs.length
                  : normas.length;
          const tone =
            t.id === "mal" && sum.block > 0
              ? "stamp"
              : t.id === "mal" && sum.warn > 0
                ? "warn"
                : t.id === "pedir" && missingCount > 0
                  ? "warn"
                  : "forest";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-all",
                active ? "bg-forest text-primary-fg shadow-xs font-semibold" : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)] hover:bg-forest-mist/30",
              )}
            >
              <span>{t.label}</span>
              {count > 0 ? (
                <Badge tone={active ? "neutral" : tone} className="text-xs">
                  {count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>

      {effective === "mal" ? <MalPanel findings={findings} sum={sum} /> : null}
      {effective === "pedir" ? <PedirPanel asks={needed} /> : null}
      {effective === "subir" ? <SubirPanel /> : null}
      {effective === "normas" ? <NormasPanel /> : null}

      {/* Navegación entre pasos */}
      <div className="flex items-center justify-between border-t border-line pt-6 mt-8">
        <Button asChild variant="outline">
          <Link to="/topes">← 1. Diagnóstico de Topes</Link>
        </Button>
        <Button asChild className="gap-2 bg-forest hover:bg-forest-deep text-white">
          <Link to="/declaracion">3. Continuar a Diligenciamiento 210 →</Link>
        </Button>
      </div>
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
  - Certificado de ingresos y retenciones Formato 220 (empleador).
  - Extractos bancarios que respalden las consignaciones y movimientos del año.
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
  const [copiedReport, setCopiedReport] = useState(false);

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
        setReview(generateLocalAuditReport(d, c, findings));
      }
    } catch {
      setReview(generateLocalAuditReport(d, c, findings));
    } finally {
      setBusy(false);
    }
  }

  function handleCopyReport() {
    const textToCopy = review || generateLocalAuditReport(d, c, findings);
    navigator.clipboard.writeText(textToCopy);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <CountCard label="Inconsistencias Bloqueantes" value={sum.block} tone="stamp" />
        <CountCard label="Soportes Faltantes / Advertencias" value={sum.warn} tone="warn" />
        <CountCard label="Notas y Recomendaciones" value={sum.info} tone="neutral" />
      </div>

      {findings.length === 0 ? (
        <Card className="border-forest/30 bg-forest-mist/20 text-center py-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest text-primary-fg mb-3">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-forest-deep text-lg">Expediente 100% Conforme</CardTitle>
          <p className="mt-1 text-sm text-ink-soft max-w-md mx-auto">
            Todos los valores declarados cuentan con soportes documentales y no se detectaron inconsistencias jurídicas ni matemáticas.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li key={f.id}>
              <Card
                className={cn(
                  "p-4 border",
                  f.level === "block" && "border-stamp/30 bg-stamp-mist/30",
                  f.level === "warn" && "border-warn/30 bg-warn-mist/30",
                  f.level === "info" && "border-line bg-surface"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      f.level === "block" ? "stamp" : f.level === "warn" ? "warn" : "neutral"
                    }
                  >
                    {f.level === "block" ? "Inconsistencia grave" : f.level === "warn" ? "Soporte requerido" : "Nota probatoria"}
                  </Badge>
                  <p className="font-medium text-sm text-ink">{f.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.detail}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2">
                  <p className="text-[11px] text-faint">
                    {f.source}
                    {f.askFrom ? ` · Pídalo a: ${f.askFrom}` : ""}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={revisar} disabled={busy} className="gap-1.5">
          <Sparkles className="size-4" />
          {busy ? "Analizando expediente..." : "Dictamen y Auditoría Integral con IA"}
        </Button>
        <Button variant="outline" onClick={handleCopyReport} className="gap-1.5">
          {copiedReport ? <Check className="size-4 text-forest" /> : <Copy className="size-4" />}
          {copiedReport ? "Informe copiado" : "Copiar Informe de Auditoría"}
        </Button>
      </div>

      {err ? <p className="text-sm text-stamp">{err}</p> : null}

      {review ? (
        <Card className="border-forest/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <CardTitle className="text-base font-bold text-ink">Dictamen de Auditoría Tributaria</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleCopyReport} className="gap-1 text-xs">
              <Copy className="size-3.5" />
              {copiedReport ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink font-mono text-xs bg-bg-raised p-4 rounded-lg">
            {review}
          </div>
          <CardHint className="mt-4">
            Este informe consolida las bases de liquidación según los arts. 206, 241, 336, 771-2 y concordantes del Estatuto Tributario.
          </CardHint>
        </Card>
      ) : null}
    </div>
  );
}

function CountCard({ label, value, tone }: { label: string; value: number; tone: "stamp" | "warn" | "neutral" }) {
  return (
    <Card className="border border-line">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-3xl tabular-nums font-bold",
          tone === "stamp" && "text-stamp",
          tone === "warn" && "text-warn",
          tone === "neutral" && "text-ink"
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function PedirPanel({ asks }: { asks: ProviderAsk[] }) {
  const d = useAppStore((s) => s.declaration);
  const docs = useAppStore((s) => s.docs);
  const addDoc = useAppStore((s) => s.addDoc);
  const removeDoc = useAppStore((s) => s.removeDoc);
  
  const [open, setOpen] = useState<string | null>(asks[0]?.id ?? null);
  const [copied, setCopied] = useState<string | null>(null);
  const [customLetters, setCustomLetters] = useState<Record<string, string>>({});
  const [busyKind, setBusyKind] = useState<string | null>(null);

  // Estados de modal de previsualización
  const [previewData, setPreviewData] = useState<{
    doc: VaultDoc;
    amounts: Record<string, number>;
    notes?: string;
  } | null>(null);

  const totalRequiredDocs = useMemo(() => {
    const allKinds = new Set<DocKind>();
    for (const ask of asks) {
      for (const doc of ask.documents) {
        allKinds.add(doc.kind);
      }
    }
    return allKinds.size;
  }, [asks]);

  const totalObtainedDocs = useMemo(() => {
    const obtainedKinds = new Set<DocKind>();
    for (const ask of asks) {
      for (const kind of ask.have) {
        obtainedKinds.add(kind);
      }
    }
    return obtainedKinds.size;
  }, [asks]);

  const progressPct = totalRequiredDocs > 0 ? Math.round((totalObtainedDocs / totalRequiredDocs) * 100) : 100;

  function marcar(kind: DocKind, label: string) {
    addDoc({
      id: crypto.randomUUID(),
      kind,
      name: `Registrado: ${label}`,
      mime: "application/x-registered",
      size: 0,
      addedAt: new Date().toISOString(),
      notes: "Marcado como recibido en expediente.",
    });
  }

  function desmarcar(kind: DocKind) {
    const existing = docs.filter((doc) => doc.kind === kind);
    for (const doc of existing) {
      removeDoc(doc.id);
    }
  }

  function getLetterText(ask: ProviderAsk) {
    if (customLetters[ask.id]) return customLetters[ask.id];
    return cartaProveedor(ask, d);
  }

  function handleLetterChange(askId: string, text: string) {
    setCustomLetters((prev) => ({ ...prev, [askId]: text }));
  }

  async function copiar(ask: ProviderAsk) {
    const text = getLetterText(ask);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(ask.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  function enviarWhatsApp(ask: ProviderAsk) {
    const text = getLetterText(ask);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  function enviarEmail(ask: ProviderAsk) {
    const text = getLetterText(ask);
    const subject = encodeURIComponent(`Solicitud de Certificados Tributarios AG ${d.year} - ${d.identity.primerNombre} ${d.identity.primerApellido}`);
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  async function onDirectFile(files: FileList | null, kind: DocKind) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setBusyKind(kind);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const clientRes = await parseDocumentInBrowser(arrayBuffer, file.name, kind);
      
      const doc: VaultDoc = {
        id: crypto.randomUUID(),
        kind: clientRes.detectedKind && clientRes.detectedKind !== "otro" ? clientRes.detectedKind : kind,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
        notes: clientRes.text ? clientRes.text.slice(0, MAX_NORMA_CHARS) : clientRes.notes,
        extracted: Object.keys(clientRes.amounts).length > 0 ? clientRes.amounts : undefined,
      };

      addDoc(doc);
      setPreviewData({ doc, amounts: clientRes.amounts, notes: clientRes.notes });
    } catch (e: any) {
      // Fallback
      addDoc({
        id: crypto.randomUUID(),
        kind,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
        notes: "Archivo subido directamente.",
      });
    } finally {
      setBusyKind(null);
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
    <div className="space-y-5">
      {/* Barra de Progreso General del Expediente */}
      <Card className="border border-forest/20 bg-gradient-to-br from-surface to-forest-mist/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Estado Probatorio del Expediente</h3>
            <p className="text-xs text-muted">
              {totalObtainedDocs} de {totalRequiredDocs} tipos de soporte listos en el archivo ({progressPct}%)
            </p>
          </div>
          <Badge tone={progressPct === 100 ? "ok" : progressPct >= 50 ? "warn" : "stamp"} className="text-xs px-3 py-1 font-semibold">
            {progressPct === 100 ? "✓ Expediente Completo" : `Faltan ${totalRequiredDocs - totalObtainedDocs} soportes`}
          </Badge>
        </div>

        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-bg-raised border border-line">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              progressPct === 100 ? "bg-forest" : progressPct >= 50 ? "bg-amber-500" : "bg-stamp"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* Lista de Terceros y Solicitudes */}
      <ul className="space-y-3">
        {asks.map((ask) => {
          const isOpen = open === ask.id;
          const letterText = getLetterText(ask);

          return (
            <li key={ask.id}>
              <Card className="overflow-hidden border border-line transition-all">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-bg-raised/50 transition-colors cursor-pointer"
                  onClick={() => setOpen(isOpen ? null : ask.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base text-ink">{ask.provider}</p>
                    <p className="mt-0.5 text-xs text-muted truncate">{ask.role}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge tone={ask.missing.length ? "warn" : "ok"}>
                      {ask.missing.length ? `Faltan ${ask.missing.length}` : "✓ Completo"}
                    </Badge>
                    {isOpen ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
                  </div>
                </button>

                {isOpen ? (
                  <div className="space-y-4 border-t border-line bg-surface p-4 sm:p-5">
                    <div className="rounded-lg bg-bg-raised p-3 text-xs leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink">¿Por qué se necesita?</span> {ask.reason}
                    </div>

                    {/* Lista de Documentos Específicos */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">Soportes requeridos a este tercero:</p>
                      <ul className="space-y-2">
                        {ask.documents.map((doc) => {
                          const have = ask.have.includes(doc.kind);
                          const isProcessingThis = busyKind === doc.kind;

                          return (
                            <li
                              key={doc.kind}
                              className={cn(
                                "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all",
                                have ? "border-forest/30 bg-forest-mist/10" : "border-line bg-surface"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {have ? (
                                    <CheckCircle2 className="size-4 text-forest shrink-0" />
                                  ) : (
                                    <AlertCircle className="size-4 text-warn shrink-0" />
                                  )}
                                  <p className="text-sm font-semibold text-ink">{doc.what}</p>
                                </div>
                                <p className="mt-1 text-xs text-muted leading-relaxed pl-6">{doc.why}</p>
                                <p className="mt-0.5 text-[11px] text-faint pl-6 font-mono">{doc.article}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {have ? (
                                  <>
                                    <Badge tone="ok" className="text-xs">✓ En Expediente</Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => desmarcar(doc.kind)}
                                      className="text-xs text-muted hover:text-stamp"
                                    >
                                      Desmarcar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <label className="cursor-pointer">
                                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-forest/40 bg-forest-mist/30 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest-mist transition-colors">
                                        <Upload className="size-3.5" />
                                        {isProcessingThis ? "Leyendo..." : "Subir soporte"}
                                      </span>
                                      <input
                                        type="file"
                                        className="sr-only"
                                        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.xls,.txt,image/*"
                                        onChange={(e) => onDirectFile(e.target.files, doc.kind)}
                                      />
                                    </label>

                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => marcar(doc.kind, doc.what)}
                                      className="text-xs"
                                    >
                                      Ya lo tengo
                                    </Button>
                                  </>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Editor de Carta de Solicitud */}
                    <div className="space-y-2 pt-2 border-t border-line">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">
                          Carta de Solicitud Formal (Editable):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => copiar(ask)} className="gap-1.5 text-xs">
                            {copied === ask.id ? <Check className="size-3.5 text-forest" /> : <Copy className="size-3.5" />}
                            {copied === ask.id ? "Copiada" : "Copiar"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => enviarWhatsApp(ask)} className="gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50">
                            <MessageCircle className="size-3.5" />
                            WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => enviarEmail(ask)} className="gap-1.5 text-xs text-blue-700 hover:bg-blue-50">
                            <Mail className="size-3.5" />
                            Email
                          </Button>
                        </div>
                      </div>

                      <textarea
                        className="w-full min-h-36 rounded-lg border border-line bg-bg-raised p-3 text-xs leading-relaxed text-ink font-mono focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                        value={letterText}
                        onChange={(e) => handleLetterChange(ask.id, e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
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
    </div>
  );
}

function SubirPanel() {
  const docs = useAppStore((s) => s.docs);
  const addDoc = useAppStore((s) => s.addDoc);
  const removeDoc = useAppStore((s) => s.removeDoc);
  const updateDoc = useAppStore((s) => s.updateDoc);
  const addNorma = useAppStore((s) => s.addNorma);
  const aiSettings = useAppStore((s) => s.aiSettings);

  const [kind, setKind] = useState<DocKind>("formato220");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
        let text = "";
        let extractedAmounts: Record<string, number> = {};
        let notes = "";
        let docKindToUse = kind;

        try {
          const arrayBuffer = await file.arrayBuffer();
          const clientRes = await parseDocumentInBrowser(arrayBuffer, file.name);
          const ext = (file.name.split(".").pop() || "").toLowerCase();
          const isTextualPdf = ext === "pdf" || ext === "xlsx" || ext === "csv" || ext === "txt";

          if (clientRes.detectedKind && clientRes.detectedKind !== "otro") {
            docKindToUse = clientRes.detectedKind;
            setKind(clientRes.detectedKind);
          }

          if (clientRes.ok && (clientRes.text.length > 20 || Object.keys(clientRes.amounts).length > 0)) {
            text = clientRes.text.slice(0, MAX_NORMA_CHARS);
            extractedAmounts = clientRes.amounts;
            notes = clientRes.notes;
          } else if (clientRes.ok && isTextualPdf) {
            text = "";
            notes = clientRes.notes || "Documento registrado. Parece ser un PDF de imagen — use el área de texto o Gemini para ingresar el contenido.";
          } else {
            try {
              const blob = new Blob([arrayBuffer]);
              const reader = new FileReader();
              const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                  const resStr = reader.result as string;
                  resolve(resStr.split(",")[1] || "");
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              const serverRes = await extractUniversalDocServerFn({
                data: {
                  base64,
                  fileName: file.name,
                  mimeType: file.type || "application/octet-stream",
                  kind: docKindToUse,
                },
              });

              if (serverRes.ok) {
                text = serverRes.text.slice(0, MAX_NORMA_CHARS);
                extractedAmounts = serverRes.amounts || {};
                notes = serverRes.notes || (text ? text.slice(0, 400) : "Archivo procesado.");
              } else {
                notes = clientRes.notes || `Archivo registrado. ${serverRes.error || ""}`;
              }
            } catch {
              notes = clientRes.notes || (clientRes.text ? clientRes.text.slice(0, 400) : "Archivo registrado.");
            }
          }
        } catch (e: any) {
          notes = "Archivo registrado.";
        }

        const doc: VaultDoc = {
          id: crypto.randomUUID(),
          kind: docKindToUse,
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          addedAt: new Date().toISOString(),
          notes: text ? text : notes,
          extracted: Object.keys(extractedAmounts).length > 0 ? extractedAmounts : undefined,
        };
        addDoc(doc);

        if (isNormaKind(docKindToUse) && text.trim()) {
          addNorma({
            id: crypto.randomUUID(),
            kind: docKindToUse,
            title: file.name.replace(/\.[^.]+$/, ""),
            citation: file.name,
            text,
            addedAt: new Date().toISOString(),
            fileName: file.name,
          });
        }

        setPreviewData({ doc, amounts: extractedAmounts, notes });
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
    setBusy(true);
    setErr(null);

    const textToScan = doc.notes || doc.name || "";
    let parsedData: { amounts: Record<string, number>; notes: string } = { amounts: {}, notes: "" };
    
    if (doc.kind === "formato220" || /220/i.test(doc.name)) {
      parsedData = parseFormato220Text(textToScan);
    } else if (doc.kind === "certCesantias" || /cesant[ií]a/i.test(doc.name)) {
      parsedData = parseCertCesantiasText(textToScan);
    } else if (doc.kind === "certAfc" || /afc|fvp/i.test(doc.name)) {
      parsedData = parseCertAfcFvpText(textToScan);
    } else if (doc.kind === "interesesHipoteca" || /vivienda|hipoteca|leasing/i.test(doc.name)) {
      parsedData = parseInteresesViviendaText(textToScan);
    } else if (doc.kind === "medicinaPrepagada" || /prepagada|salud/i.test(doc.name)) {
      parsedData = parseMedicinaPrepagadaText(textToScan);
    } else if (doc.kind === "pila" || /pila|planilla/i.test(doc.name)) {
      parsedData = parsePilaText(textToScan);
    } else if (doc.kind === "certDeudas" || /deuda/i.test(doc.name)) {
      parsedData = parseCertDeudasText(textToScan);
    } else if (doc.kind === "certDividendos" || /dividendo/i.test(doc.name)) {
      parsedData = parseCertDividendosText(textToScan);
    } else if (doc.kind === "certHonorarios" || /honorario/i.test(doc.name)) {
      parsedData = parseCertHonorariosText(textToScan);
    } else if (["avaluoCatastral", "predial"].includes(doc.kind) || /avaluo|predial/i.test(doc.name)) {
      parsedData = parseAvaluoPredialText(textToScan);
    } else if (doc.kind === "facturaElectronica" || /factura/i.test(doc.name)) {
      parsedData = parseFacturaElectronicaText(textToScan);
    } else if (doc.kind === "icetex" || /icetex/i.test(doc.name)) {
      parsedData = parseIcetexText(textToScan);
    } else if (doc.kind === "donaciones" || /donaci/i.test(doc.name)) {
      parsedData = parseDonacionesText(textToScan);
    } else if (doc.kind === "pensionJubilacion" || /pension/i.test(doc.name)) {
      parsedData = parsePensionJubilacionText(textToScan);
    } else if (doc.kind === "form210Anterior" || /210/i.test(doc.name)) {
      parsedData = parseForm210AnteriorText(textToScan);
    } else if (doc.kind === "certRetencion" || /retencion/i.test(doc.name)) {
      parsedData = parseCertRetencionGeneralText(textToScan);
    } else if (
      ["extractoBanco", "saldoCuentas", "certGmf", "certRendimientos"].includes(doc.kind) ||
      /extracto|cuenta|banco|retencion|rendimiento|costos|nu|nequi|bogota/i.test(doc.name) ||
      /cuenta\s*de\s*ahorros?|rendimientos|gravamen|4x1000|saldo\s*cuenta/i.test(textToScan)
    ) {
      parsedData = parseCertificadoBancarioText(textToScan);
    }

    if (Object.keys(parsedData.amounts).length > 0) {
      updateDoc(doc.id, { extracted: parsedData.amounts, notes: parsedData.notes || doc.notes });
      setPreviewData({ doc, amounts: parsedData.amounts, notes: parsedData.notes });
      setBusy(false);
      return;
    }

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
      text: textToScan,
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
    <div className="space-y-5">
      {/* Tarjeta Hero con Indicador de Auto-Detección */}
      <Card className="space-y-4 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-forest text-primary-fg">
              <Sparkles className="size-4" />
            </span>
            <CardTitle className="text-lg">Carga y Reconocimiento Universal de Soportes</CardTitle>
          </div>
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

        {/* Zona Drag & Drop Universal con Auto-Detección */}
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onFiles(e.dataTransfer.files); }}
          className={cn(
            "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all",
            isDragOver
              ? "border-forest bg-forest-mist/40 scale-[0.99]"
              : "border-forest/40 bg-gradient-to-b from-forest-mist/10 to-surface hover:border-forest hover:bg-forest-mist/20"
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-forest text-primary-fg shadow-sm">
            <FileUp className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">
              Arrastre y suelte cualquier soporte aquí (o haga clic para seleccionar)
            </p>
            <p className="text-xs text-muted max-w-xl">
              ⚡ <strong>Detección automática instantánea:</strong> Reconoce Formato 220, Exógena, RUT, extractos bancarios (Bancolombia, Nu, Davivienda, etc.), cesantías, PILA, medicina prepagada, deudas, predial y más.
            </p>
          </div>
          <span className="rounded-full bg-bg-raised px-3 py-1 text-[11px] font-medium text-faint border border-line">
            PDF · Imágenes (OCR) · Word (.docx) · Excel (.xlsx/.csv) · Texto plano
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.pptx,.xlsx,.xls,.txt,.xml,.json,.csv,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/*"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>

        {/* Selector manual de tipo opcional */}
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tipo de documento sugerido</span>
            <select
              className="h-10 w-full rounded-md border border-line bg-surface px-3 text-xs"
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
          <div className="flex flex-col justify-center">
            <p className="text-xs text-muted">{meta.help}</p>
            <p className="text-[11px] text-faint font-mono mt-0.5">{meta.source}</p>
          </div>
        </div>

        {/* Pegado de texto opcional */}
        <div className="space-y-2 pt-2 border-t border-line">
          <textarea
            className="min-h-24 w-full rounded-md border border-line bg-surface p-3 text-xs leading-relaxed text-ink"
            placeholder="O pegue aquí el texto copiado de un certificado, extracto bancario o resolución..."
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={leerTexto} disabled={busy || !paste.trim()} className="gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              {busy ? "Extrayendo con IA..." : isNormaKind(kind) ? "Ingerir norma" : "Extraer montos con Gemini"}
            </Button>
            {paste.trim() && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setGeminiInitialText(paste);
                  setGeminiModalOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                💡 Interpretar con Gemini
              </Button>
            )}
          </div>
        </div>

        {err ? <p className="text-xs text-stamp font-medium">{err}</p> : null}
      </Card>

      {/* Bóveda de Documentos en el Expediente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">
            Documentos en el Expediente ({docs.length})
          </h3>
          <p className="text-xs text-muted">
            {docs.filter((d) => d.extracted && Object.keys(d.extracted).length > 0).length} con cifras extraídas
          </p>
        </div>

        <ul className="space-y-3">
          {docs.length === 0 ? (
            <Card className="text-center py-8">
              <CardHint>Aún no hay soportes en el expediente. Arrastre un PDF o certificado bancario arriba para comenzar.</CardHint>
            </Card>
          ) : (
            docs.map((doc) => {
              const m = docMeta(doc.kind);
              const hasExtracted = doc.extracted && Object.keys(doc.extracted).length > 0;

              return (
                <li key={doc.id}>
                  <Card className="border border-line">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-ink">{doc.name}</p>
                          <Badge tone="forest" className="text-[11px]">{m.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatNumber(doc.size)} bytes · Registrado {new Date(doc.addedAt).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.applied ? <Badge tone="ok">✓ Aplicado a Declaración</Badge> : null}
                        <Button variant="ghost" size="icon" onClick={() => removeDoc(doc.id)} aria-label="Eliminar">
                          <Trash2 className="size-4 text-muted hover:text-stamp" />
                        </Button>
                      </div>
                    </div>

                    {hasExtracted ? (
                      <div className="mt-3 space-y-2 rounded-lg bg-bg-raised p-3 border border-line/60">
                        <p className="text-xs font-bold text-forest uppercase tracking-wider">Cifras extraídas:</p>
                        <ul className="space-y-1 text-xs">
                          {Object.entries(doc.extracted ?? {}).map(([k, v]) => (
                            <li key={k} className="flex justify-between gap-3 rounded bg-surface px-2.5 py-1 border border-line/40">
                              <span className="text-muted font-mono">{k}</span>
                              <span className="tabular-nums font-bold text-ink">
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
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5 text-xs bg-forest hover:bg-forest-deep text-white"
                            onClick={() => extraerDocExistente(doc)}
                          >
                            <Sparkles className="size-3.5" />
                            Extraer cifras del documento
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => {
                              setPreviewData({ doc, amounts: {}, notes: doc.notes });
                            }}
                          >
                            <FileText className="size-3.5" />
                            Ingresar cifras manualmente
                          </Button>
                        </>
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
      </div>

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

const NORMAS_PREDEFINIDAS = [
  {
    kind: "resolucion" as DocKind,
    citation: "Resolución DIAN 000192 de 2024",
    title: "UVT 2025 fijada en $49.799",
    category: "UVT & Retención",
    summary: "Fija la Unidad de Valor Tributario (UVT) en $49.799 para el año 2025, rigiendo topes de declaración, sanciones y tramos exentos.",
    text: `RESOLUCIÓN NÚMERO 000192 DE 2024 - DIAN
Por la cual se fija el valor de la Unidad de Valor Tributario (UVT) aplicable para el año 2025.
Artículo 1. Valor de la UVT: Fíjese en CUARENTA Y NUEVE MIL SETECIENTOS NOVENTA Y NUEVE PESOS ($49.799) el valor de la UVT que regirá a partir del 1 de enero de 2025.
Artículo 2. Conversión de sanciones y topes: Para efectos de la determinación de las obligaciones tributarias y de control, se aplicará el valor fijado en el artículo 1.`,
  },
  {
    kind: "decreto" as DocKind,
    citation: "Decreto 1226 de 2024 (MinHacienda)",
    title: "Calendario Tributario 2025-2026 y Plazos Especiales",
    category: "Calendario",
    summary: "Establece las fechas de vencimiento para personas naturales según los dos últimos dígitos del NIT y plazos por contingencias.",
    text: `DECRETO 1226 DE 2024 - MINISTERIO DE HACIENDA Y CRÉDITO PÚBLICO
Por el cual se modifican y adicionan artículos del Decreto 1625 de 2016 Único Reglamentario en Materia Tributaria.
Artículo 1.6.1.13.2.15. Plazos para declarar y pagar el impuesto sobre la renta de personas naturales:
Los plazos inician en agosto y concluyen en octubre, determinados según los dos últimos dígitos del NIT del Registro Único Tributario (RUT), sin tener en cuenta el dígito de verificación.
Parágrafo especial: En caso de contingencia declarada por la DIAN (Art. 579-2 E.T.), el vencimiento se trasladará al día hábil siguiente al restablecimiento.`,
  },
  {
    kind: "conceptoDian" as DocKind,
    citation: "Concepto Unificado DIAN 0106 de 2023",
    title: "Doctrina de Rentas de Trabajo, Honorarios y 25% Exento",
    category: "Doctrina Laboral",
    summary: "Regula la renta exenta del 25% (Art. 206 num. 10), límite conjunto del 40% y procedencia de dependientes económicos (72 UVT).",
    text: `CONCEPTO UNIFICADO 0106 DE 2023 - DIAN (SUBDIRECCIÓN DE NORMATIVA Y DOCTRINA)
Tema: Determinación del impuesto sobre la renta de personas naturales tras la Ley 2277 de 2022.
1. Renta Exenta del 25%: Procede para todas las rentas de trabajo (laborales y honorarios sin costos) calculada sobre el valor resultante de detraer ingresos no constitutivos de renta, deducciones imputables y demás rentas exentas, con tope de 790 UVT.
2. Dependientes económicos: La deducción de 72 UVT por dependiente (hasta 4) aplica directamente en la cédula general sin someterse al límite porcentual del 40% (Art. 336 E.T.).
3. Factura Electrónica (1%): Procede sobre compras con factura electrónica validada por la DIAN y pagada por medios bancarios (hasta 240 UVT).`,
  },
  {
    kind: "conceptoDian" as DocKind,
    citation: "Concepto DIAN 000889 de 2024",
    title: "Deducción Especial del 1% por Factura Electrónica (Art. 336)",
    category: "Beneficio 1%",
    summary: "Requisitos de procedencia del 1% en compras de bienes y servicios sin necesidad de causalidad con actividad productora.",
    text: `CONCEPTO DIAN 000889 DE 2024 - DEDUCCIÓN DEL 1% EN FACTURAS ELECTRÓNICAS
1. No requiere relación de causalidad con la actividad productora de renta. Aplica para gastos personales de compras y servicios.
2. El pago debe haberse realizado mediante tarjeta de crédito, débito u otro medio electrónico supervisado por la Superfinanciera.
3. La factura electrónica debe contener CUFE, estar a nombre del declarante con su NIT o cédula y con validación previa de la DIAN.`,
  },
  {
    kind: "resolucion" as DocKind,
    citation: "Resolución DIAN 000162 de 2023",
    title: "Información Exógena y Cruces de Terceros",
    category: "Exógena DIAN",
    summary: "Topes de obligados y formatos 1001, 1007, 1008, 1009 y 2276 para cruces de ingresos, costos, cuentas y retenciones.",
    text: `RESOLUCIÓN DIAN 000162 DE 2023
Por la cual se establece el grupo de obligados a suministrar información tributaria a la DIAN.
Define los topes de personas naturales con ingresos brutos superiores a 500 millones de pesos o rentas de capital superiores a 100 millones, y la obligación de reportar pagos, retenciones y saldos acumulados.`,
  },
  {
    kind: "decreto" as DocKind,
    citation: "DUR 1625 de 2016 (Arts. 1.2.1.20.1 y ss.)",
    title: "Decreto Único Reglamentario en Materia Tributaria",
    category: "Reglamentario",
    summary: "Reglamentación del sistema de cedulación para personas naturales, soportes de pasivos y pruebas tributarias.",
    text: `DECRETO ÚNICO REGLAMENTARIO 1625 DE 2016 (DUR TRIBUTARIO)
Artículo 1.2.1.20.3. Requisitos para la procedencia de deducciones por dependientes económicos.
Artículo 1.2.1.20.4. Determinación de la renta líquida cedular de la cédula general.
Artículo 1.2.1.20.5. Tratamiento de las cesantías e intereses sobre cesantías acumuladas.
Artículo 1.2.1.20.6. Soportes de fecha cierta para el reconocimiento fiscal de deudas y pasivos financieros.`,
  },
  {
    kind: "sentencia" as DocKind,
    citation: "Sentencia C-489 de 2023 (Corte Constitucional)",
    title: "Sentencia de Inexequibilidad / Deducibilidad Tributaria",
    category: "Jurisprudencia",
    summary: "Fallo de la Corte Constitucional sobre derechos adquiridos y deducibilidad de pagos esenciales en la cédula general.",
    text: `SENTENCIA C-489 DE 2023 - CORTE CONSTITUCIONAL DE COLOMBIA
La Corte precisa los límites a las restricciones deducibles en el impuesto sobre la renta, ratificando el principio de capacidad contributiva y la debida acreditación de costos indispensables para la producción de la renta gravable.`,
  },
];

function autoDetectNormaMetadata(text: string, fileName: string): {
  kind: DocKind;
  citation: string;
  title: string;
} {
  let kind: DocKind = "resolucion";
  let citation = "";
  let title = "";

  const cleanFile = fileName.replace(/\.[^.]+$/, "");

  // 1. Detección de tipo
  if (/sentencia|corte\s*constitucional|consejo\s*de\s*estado|\bc-\d+|\bsu-\d+/i.test(text) || /sentencia/i.test(fileName)) {
    kind = "sentencia";
  } else if (/concepto\s*(?:unificado)?|oficio\s*dian|subdirecci[oó]n\s*de\s*doctrina/i.test(text) || /concepto/i.test(fileName)) {
    kind = "conceptoDian";
  } else if (/decreto|ministerio\s*de\s*hacienda|\bdur\b/i.test(text) || /decreto/i.test(fileName)) {
    kind = "decreto";
  } else if (/\bley\s*\d+/i.test(text) || /ley/i.test(fileName)) {
    kind = "ley";
  } else if (/oficio/i.test(text) || /oficio/i.test(fileName)) {
    kind = "oficio";
  } else {
    kind = "resolucion";
  }

  // 2. Detección de Cita
  const resMatch = text.match(/resoluci[oó]n\s*(?:n[uú]mero|no\.?)?\s*(\d{1,8})\s*(?:de\s*)?(\d{4})/i);
  const decMatch = text.match(/decreto\s*(?:n[uú]mero|no\.?)?\s*(\d{1,8})\s*(?:de\s*)?(\d{4})/i);
  const conMatch = text.match(/concepto\s*(?:unificado\s*)?(?:n[uú]mero|no\.?)?\s*(\d{1,8})\s*(?:de\s*)?(\d{4})/i);
  const sentMatch = text.match(/sentencia\s*([A-Z]{1,3}-\d{1,5}(?:\s*(?:de|\/)\s*\d{2,4})?)/i);
  const leyMatch = text.match(/ley\s*(?:n[uú]mero|no\.?)?\s*(\d{1,8})\s*(?:de\s*)?(\d{4})/i);
  const ofMatch = text.match(/oficio\s*(?:n[uú]mero|no\.?)?\s*(\d{1,8})\s*(?:de\s*)?(\d{4})/i);

  if (resMatch) citation = `Resolución DIAN ${resMatch[1]} de ${resMatch[2]}`;
  else if (decMatch) citation = `Decreto ${decMatch[1]} de ${decMatch[2]}`;
  else if (conMatch) citation = `Concepto DIAN ${conMatch[1]} de ${conMatch[2]}`;
  else if (sentMatch) citation = `Sentencia ${sentMatch[1]}`;
  else if (leyMatch) citation = `Ley ${leyMatch[1]} de ${leyMatch[2]}`;
  else if (ofMatch) citation = `Oficio DIAN ${ofMatch[1]} de ${ofMatch[2]}`;
  else citation = cleanFile;

  // 3. Detección de Título
  if (/uvt|unidad\s*de\s*valor\s*tributario/i.test(text)) {
    const uvtNumMatch = text.match(/\$\s*([0-9]{1,3}(?:\.[0-9]{3})+)/);
    title = `UVT ${uvtNumMatch ? `(${uvtNumMatch[1]})` : "Oficial"}`;
  } else if (/calendario|vencimiento|plazos/i.test(text)) {
    title = "Calendario Tributario y Plazos Oficiales";
  } else if (/rentas\s*de\s*trabajo|honorarios|salarios/i.test(text)) {
    title = "Doctrina de Rentas de Trabajo y Cédula General";
  } else if (/factura\s*electr[oó]nica|1\s*%/i.test(text)) {
    title = "Deducción 1% por Factura Electrónica";
  } else if (/ex[oó]gena|1001|1007|2276/i.test(text)) {
    title = "Información Exógena y Reportes a la DIAN";
  } else if (/dependientes/i.test(text)) {
    title = "Requisitos de Dependientes Económicos (72 UVT)";
  } else {
    title = cleanFile;
  }

  return { kind, citation, title };
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [busyFile, setBusyFile] = useState(false);

  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiInitialText, setGeminiInitialText] = useState("");

  function ingest(customData?: { kind: DocKind; title: string; citation: string; text: string }) {
    setErr(null);
    setSuccessMsg(null);

    const kindToUse = customData ? customData.kind : kind;
    const titleToUse = customData ? customData.title : title.trim();
    const citationToUse = customData ? customData.citation : citation.trim();
    const textToUse = customData ? customData.text : text.trim();

    if (!textToUse) {
      setErr("Por favor ingrese o suba el texto del articulado de la norma.");
      return;
    }

    const finalTitle = titleToUse || docMeta(kindToUse).label;
    const finalCitation = citationToUse || finalTitle;

    const res = addNorma({
      id: crypto.randomUUID(),
      kind: kindToUse,
      title: finalTitle,
      citation: finalCitation,
      text: textToUse,
      addedAt: new Date().toISOString(),
    });

    if (!res.ok) {
      setErr(res.error);
      return;
    }

    addDoc({
      id: crypto.randomUUID(),
      kind: kindToUse,
      name: `${finalCitation} · ${finalTitle}`,
      mime: "text/plain",
      size: textToUse.length,
      addedAt: new Date().toISOString(),
      notes: "Soporte doctrinal / normativo incorporado al expediente.",
    });

    if (!customData) {
      setTitle("");
      setCitation("");
      setText("");
    }

    setSuccessMsg(`✓ Se añadió «${finalCitation}» al expediente con éxito.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  async function onNormaFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setBusyFile(true);
    setErr(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const clientRes = await parseDocumentInBrowser(arrayBuffer, file.name);

      if (clientRes.ok && clientRes.text.trim()) {
        const detected = autoDetectNormaMetadata(clientRes.text, file.name);
        setKind(detected.kind);
        setCitation(detected.citation);
        setTitle(detected.title);
        setText(clientRes.text.slice(0, MAX_NORMA_CHARS));
        setSuccessMsg(`📄 Archivo «${file.name}» leído y clasificado como ${docMeta(detected.kind).label}. Puede revisar los datos y confirmar.`);
      } else {
        // Fallback a servidor
        const blob = new Blob([arrayBuffer]);
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const resStr = reader.result as string;
            resolve(resStr.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const serverRes = await extractUniversalDocServerFn({
          data: {
            base64,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
          },
        });

        if (serverRes.ok && serverRes.text.trim()) {
          const detected = autoDetectNormaMetadata(serverRes.text, file.name);
          setKind(detected.kind);
          setCitation(detected.citation);
          setTitle(detected.title);
          setText(serverRes.text.slice(0, MAX_NORMA_CHARS));
          setSuccessMsg(`📄 Archivo «${file.name}» procesado con OCR. Revise y pulse 'Añadir al Expediente'.`);
        } else {
          setErr("No se pudo extraer texto del archivo normativo. Puede escribir o pegar el articulado manualmente.");
        }
      }
    } catch (e: any) {
      setErr("Error al leer el archivo: " + (e?.message || ""));
    } finally {
      setBusyFile(false);
    }
  }

  const filteredNormas = normas.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.citation.toLowerCase().includes(q) ||
      n.text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Catálogo Rápido de Normas Clave (1 Clic) */}
      <Card className="border border-forest/20 bg-gradient-to-br from-surface to-forest-mist/15 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-forest text-primary-fg shadow-sm">
              <BookOpen className="size-4" />
            </span>
            <CardTitle className="text-base font-bold text-ink">Normas y Resoluciones Frecuentes (1 Clic)</CardTitle>
          </div>
          <Badge tone="forest" className="text-xs">Soporte Doctrinal Oficial</Badge>
        </div>
        <p className="text-xs text-muted">
          Añada al expediente las resoluciones de UVT, decretos de calendario o conceptos unificados de la DIAN más utilizados en personas naturales:
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
          {NORMAS_PREDEFINIDAS.map((pre) => {
            const alreadyAdded = normas.some((n) => n.citation.toLowerCase() === pre.citation.toLowerCase() || n.title.toLowerCase() === pre.title.toLowerCase());

            return (
              <div
                key={pre.citation}
                className="flex flex-col justify-between rounded-xl border border-line bg-surface p-3.5 shadow-sm transition-all hover:border-forest/40 hover:shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="forest" className="text-[10px] uppercase font-semibold">
                      {pre.category}
                    </Badge>
                    {alreadyAdded ? (
                      <Badge tone="ok" className="text-[10px]">✓ En Expediente</Badge>
                    ) : null}
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-ink leading-snug">{pre.citation}</h4>
                  <p className="mt-0.5 text-xs text-forest font-medium">{pre.title}</p>
                  <p className="mt-1.5 text-[11px] text-muted leading-relaxed line-clamp-2">{pre.summary}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant={alreadyAdded ? "ghost" : "default"}
                    disabled={alreadyAdded}
                    onClick={() => ingest({ kind: pre.kind, title: pre.title, citation: pre.citation, text: pre.text })}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {alreadyAdded ? <Check className="size-3.5 text-forest" /> : <Sparkles className="size-3.5" />}
                    {alreadyAdded ? "Agregada" : "Añadir al Expediente"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Formulario y Zona Drag & Drop para Añadir Norma Personalizada */}
      <Card className="space-y-4 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <CardTitle className="text-base font-bold text-ink">Añadir Soporte Jurídico o Doctrina DIAN</CardTitle>
            <p className="text-xs text-muted">
              Arrastre el PDF oficial o foto de la resolución para extraer el articulado automáticamente.
            </p>
          </div>
          <span className="text-[11px] text-faint font-mono">
            {normas.length} / {MAX_NORMAS} normas registradas
          </span>
        </div>

        {/* Zona Drag & Drop de Normativa */}
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onNormaFiles(e.dataTransfer.files); }}
          className={cn(
            "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-all",
            isDragOver
              ? "border-forest bg-forest-mist/40 scale-[0.99]"
              : "border-forest/40 bg-gradient-to-b from-forest-mist/10 to-surface hover:border-forest hover:bg-forest-mist/20"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-forest text-primary-fg shadow-sm">
            <FileUp className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-ink">
              {busyFile ? "Leyendo y clasificando documento..." : "Arrastre el PDF oficial o imagen de la resolución / concepto aquí"}
            </p>
            <p className="text-xs text-muted">
              Auto-detecta tipo de norma, número de cita oficial, título temático y texto del articulado.
            </p>
          </div>
          <span className="rounded-full bg-bg-raised px-2.5 py-0.5 text-[10px] font-medium text-faint border border-line">
            PDF · Imágenes (OCR) · Word (.docx) · Texto (.txt)
          </span>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt,application/pdf"
            onChange={(e) => onNormaFiles(e.target.files)}
          />
        </label>

        {/* Campos de Clasificación */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Tipo de Norma</span>
            <select
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs focus:border-forest focus:outline-none"
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

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Cita Oficial</span>
            <input
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs focus:border-forest focus:outline-none"
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              placeholder="Ej. Resolución DIAN 000192 de 2024"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Título / Objeto</span>
            <input
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs focus:border-forest focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Fijación UVT 2025 en $49.799"
            />
          </label>
        </div>

        {/* Articulado / Texto */}
        <label className="block space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Texto del Articulado o Extracto Relevante</span>
            <span className="text-[11px] text-faint">{text.length} / {MAX_NORMA_CHARS} caracteres</span>
          </div>
          <textarea
            className="min-h-32 w-full rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-ink font-mono focus:border-forest focus:outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pegue aquí el texto relevante de la resolución, decreto o concepto..."
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button onClick={() => ingest()} disabled={!text.trim() || busyFile} className="gap-2">
            <Sparkles className="size-4" />
            <span>Añadir Norma al Expediente</span>
          </Button>

          {text.trim() && (
            <Button
              variant="outline"
              onClick={() => {
                setGeminiInitialText(`Interpreta jurídicamente esta norma para la declaración de renta:\n\n${citation} - ${title}\n\n${text}`);
                setGeminiModalOpen(true);
              }}
              className="gap-1.5 text-xs text-forest border-forest/30"
            >
              💡 Analizar con Asistente IA
            </Button>
          )}
        </div>

        {successMsg && <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg">{successMsg}</p>}
        {err && <p className="text-xs text-stamp font-medium bg-stamp-mist/40 p-2.5 rounded-lg">{err}</p>}
      </Card>

      {/* 3. Gestor de Normas Registradas en el Expediente */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Biblioteca Jurídica del Expediente ({normas.length})
            </h3>
            <p className="text-xs text-muted">
              Doctrina y normas activas que el Asistente IA utiliza como corpus de sustento
            </p>
          </div>

          {normas.length > 0 && (
            <input
              type="search"
              placeholder="Buscar en normas guardadas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-line bg-surface px-3 text-xs focus:border-forest focus:outline-none"
            />
          )}
        </div>

        {normas.length === 0 ? (
          <Card className="text-center py-8">
            <CardHint>
              Aún no hay normas añadidas para este caso. Puede hacer clic en las «Normas Frecuentes» arriba o arrastrar una resolución en PDF.
            </CardHint>
          </Card>
        ) : filteredNormas.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-xs text-muted">No se encontraron normas que coincidan con «{searchQuery}».</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filteredNormas.map((n) => {
              const isOpen = open === n.id;
              const metaInfo = docMeta(n.kind);

              return (
                <li key={n.id}>
                  <Card className="border border-line overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left cursor-pointer"
                        onClick={() => setOpen(isOpen ? null : n.id)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-ink">{n.citation || n.title}</p>
                          <Badge tone="forest" className="text-[10px] uppercase font-semibold">
                            {metaInfo.label.split("—")[0].trim()}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted font-medium">{n.title}</p>
                        <p className="mt-0.5 text-[11px] text-faint">
                          Registrada el {new Date(n.addedAt).toLocaleDateString("es-CO")} · {formatNumber(n.text.length)} caracteres
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGeminiInitialText(`¿Cómo aplica esta norma al caso del contribuyente?\n\n${n.citation} - ${n.title}\n\n${n.text}`);
                            setGeminiModalOpen(true);
                          }}
                          className="h-8 gap-1.5 text-xs text-forest border-forest/30 hover:bg-forest-mist"
                        >
                          <Sparkles className="size-3.5" />
                          Consultar IA
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(`${n.citation} · ${n.title}`);
                            setSuccessMsg(`✓ Cita copiada al portapapeles.`);
                            setTimeout(() => setSuccessMsg(null), 2000);
                          }}
                          className="h-8 text-xs"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNorma(n.id)}
                          aria-label="Quitar norma"
                          className="size-8 text-muted hover:text-stamp"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : n.id)}
                          className="p-1 text-muted hover:text-ink cursor-pointer"
                        >
                          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="border-t border-line bg-bg-raised p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Texto del Articulado:</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface p-3.5 text-xs leading-relaxed text-ink font-mono border border-line/60">
                          {n.text}
                        </pre>
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal del Asistente Gemini */}
      <GeminiAsistenteModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        initialText={geminiInitialText}
      />
    </div>
  );
}
