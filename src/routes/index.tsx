import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileStack,
  FileText,
  HelpCircle,
  Lock,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { AlertList } from "@/components/layout/alert-list";
import { DeadlineLookup } from "@/components/layout/deadline-lookup";
import { UvtPanel } from "@/components/layout/uvt-panel";
import { ExogenaImportModal } from "@/components/layout/exogena-import-modal";
import { ClientChecklistModal } from "@/components/layout/client-checklist-modal";
import { GeminiAsistenteModal } from "@/components/layout/gemini-asistente-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { auditExpediente, findingsSummary } from "@/lib/docs/audit";
import { useAppStore, useComputed } from "@/lib/store";
import { deadlineForNit, daysUntil, isZonaSismo1226 } from "@/lib/tax/calendar";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { uvtFromPesos } from "@/lib/tax/uvt";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [exogenaOpen, setExogenaOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  
  // Mini simulador rápido de topes en el front
  const [simPatrimonio, setSimPatrimonio] = useState<number>(180000000);
  const [simIngresos, setSimIngresos] = useState<number>(55000000);
  const [simCompras, setSimCompras] = useState<number>(30000000);

  const d = useAppStore((s) => s.declaration);
  const docs = useAppStore((s) => s.docs);
  const loadExample = useAppStore((s) => s.loadExample);
  const loadAndresBernal = useAppStore((s) => s.loadAndresBernal);
  const reset = useAppStore((s) => s.reset);
  const computed = useComputed();
  const findings = auditExpediente(d, computed, docs);
  const sum = findingsSummary(findings);
  const zona = isZonaSismo1226(d.identity.dirSeccional, d.identity.zonaSismo1226);
  const dl = deadlineForNit(d.identity.nit, { zonaSismo1226: zona, seccional: d.identity.dirSeccional });
  const days = dl ? daysUntil(dl.iso) : null;
  const name = [d.identity.primerNombre, d.identity.primerApellido].filter(Boolean).join(" ") || "Cliente Principal";

  // Evaluación rápida de simulador
  const uvtVal = computed.uvt;
  const topePatrimonio = 4500 * uvtVal; // $224.095.500
  const topeIngresos = 1400 * uvtVal; // $69.718.600
  const topeCompras = 1400 * uvtVal;

  const simObligado =
    simPatrimonio >= topePatrimonio ||
    simIngresos >= topeIngresos ||
    simCompras >= topeCompras;

  return (
    <div className="space-y-10">
      {/* Modales de Acciones Rápidas */}
      <ExogenaImportModal isOpen={exogenaOpen} onClose={() => setExogenaOpen(false)} />
      <ClientChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />
      <GeminiAsistenteModal isOpen={geminiOpen} onClose={() => setGeminiOpen(false)} />

      {/* ========================================================================= */}
      {/* 1. HERO COMERCIAL DE ALTA CONVERSIÓN & CAPTACIÓN */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064E3B] via-[#0F4F47] to-[#042F2E] p-6 text-white shadow-2xl sm:p-10 border border-emerald-500/20">
        {/* Luces y brillos ambientales de fondo */}
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Columna Izquierda: Propuesta de Valor y CTAs */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-inner">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DIAN AG {d.year} · UVT Oficial {formatCOP(computed.uvt)}</span>
              <span className="text-amber-300">★ Ley 2277 de 2022</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold leading-[1.12] sm:text-5xl text-white tracking-tight">
              Liquida la Renta Persona Natural con{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Precisión Blindada
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              La plataforma colombiana más completa para contadores y declarantes. Importa la <strong>Exógena en Excel</strong> en 1 clic, calcula rentas exentas con los nuevos topes de la Ley 2277 y genera el <strong>Formulario 210, Excel DIAN y XML Muisca</strong> listo para radicar.
            </p>

            {/* CTAs Comerciales de Acción Inmediata */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/25 border border-emerald-400/30 hover-lift gap-2 text-sm sm:text-base px-6 h-12"
              >
                <Link to="/declaracion">
                  <Zap className="size-5 text-amber-300" />
                  <span>Iniciar Declaración Ahora</span>
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>

              <Button
                onClick={() => setExogenaOpen(true)}
                size="lg"
                variant="outline"
                className="border-emerald-400/40 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60 hover:text-white font-semibold backdrop-blur-sm gap-2 h-12"
              >
                <FileSpreadsheet className="size-4 text-emerald-300" />
                <span>Importar Exógena (Excel)</span>
              </Button>

              <Button
                onClick={loadExample}
                variant="ghost"
                size="sm"
                className="text-emerald-200/90 hover:text-white hover:bg-emerald-900/50 gap-1.5 text-xs font-medium"
                title="Cargar una declaración de prueba para ver el sistema en acción"
              >
                <Play className="size-3.5 text-amber-300 fill-amber-300" />
                <span>Cargar caso de ejemplo</span>
              </Button>

              <Button
                onClick={() => setChecklistOpen(true)}
                variant="ghost"
                size="sm"
                className="text-emerald-200/90 hover:text-white hover:bg-emerald-900/50 gap-1.5 text-xs font-medium"
              >
                <FileCheck className="size-3.5 text-emerald-300" />
                <span>Checklist de Documentos</span>
              </Button>
            </div>

            {/* Micro-puntos de confianza */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-800/60 text-[11px] text-emerald-200/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>100% Confidencial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                <span>Límite 1.340 UVT Auto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-teal-300 shrink-0" />
                <span>Asistente IA Gemini</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo de Plazo y Estado */}
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-800/80 text-emerald-300">
                    📅
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Calendario Oficial DIAN 2026
                    </h3>
                    <p className="text-[11px] text-emerald-200/70">Vencimientos Personas Naturales</p>
                  </div>
                </div>
                <Link
                  to="/calendario"
                  className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline"
                >
                  Ver tabla →
                </Link>
              </div>

              <div className="pt-3">
                <DeadlineLookup />
              </div>
            </div>

            {/* Tarjeta de Resumen Rápido del Expediente Actual */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/30 p-4 backdrop-blur-sm flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Expediente Activo
                </span>
                <p className="font-display text-sm font-bold text-white truncate max-w-[180px]">
                  {name}
                </p>
                <p className="text-[10px] text-emerald-200/70">
                  NIT: {d.identity.nit || "Sin registrar"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  {computed.saldoPagar > 0 ? "Saldo a Pagar" : computed.saldoFavor > 0 ? "Saldo a Favor" : "Impuesto a Cargo"}
                </span>
                <p className="font-display text-base font-extrabold text-white">
                  {formatCOP(computed.saldoPagar || computed.saldoFavor || computed.impuestoCargo)}
                </p>
                <Link
                  to="/declaracion"
                  className="text-[11px] font-semibold text-emerald-300 hover:underline inline-flex items-center gap-1"
                >
                  Continuar <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SIMULADOR INTERACTIVO RÁPIDO ("¿ESTOY OBLIGADO A DECLARAR?") */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <Calculator className="size-3.5" />
              Simulador Exprés en Vivo
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              ¿Debes declarar renta por el Año Gravable {d.year}?
            </h2>
            <p className="text-xs text-muted">
              Mueve los valores para saber al instante si superas los topes de ley (Arts. 592 y 594-3 del Estatuto Tributario con UVT oficial).
            </p>
          </div>

          <div className="shrink-0">
            <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${
              simObligado
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}>
              <span className="text-2xl">{simObligado ? "⚠️" : "✅"}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {simObligado ? "Estás Obligado a Declarar" : "No obligado por estos topes"}
                </p>
                <p className="text-[11px] opacity-80">
                  {simObligado
                    ? "Superas al menos 1 umbral de la DIAN"
                    : "Tus cifras están por debajo de los topes"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sliders / Entradas del simulador */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Patrimonio Bruto */}
          <div className="space-y-2 rounded-xl bg-bg/50 p-4 border border-line/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Patrimonio Bruto (Bienes)</span>
              <span className="font-mono text-emerald-800 font-bold">{formatCOP(simPatrimonio)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500000000"
              step="5000000"
              value={simPatrimonio}
              onChange={(e) => setSimPatrimonio(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>Tope: {formatCOP(topePatrimonio)} (4.500 UVT)</span>
              <span className={simPatrimonio >= topePatrimonio ? "text-amber-600 font-bold" : "text-emerald-700"}>
                {simPatrimonio >= topePatrimonio ? "¡Supera tope!" : "Bajo el tope"}
              </span>
            </div>
          </div>

          {/* Ingresos Brutos */}
          <div className="space-y-2 rounded-xl bg-bg/50 p-4 border border-line/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Ingresos Brutos Anuales</span>
              <span className="font-mono text-emerald-800 font-bold">{formatCOP(simIngresos)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000000"
              step="2000000"
              value={simIngresos}
              onChange={(e) => setSimIngresos(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>Tope: {formatCOP(topeIngresos)} (1.400 UVT)</span>
              <span className={simIngresos >= topeIngresos ? "text-amber-600 font-bold" : "text-emerald-700"}>
                {simIngresos >= topeIngresos ? "¡Supera tope!" : "Bajo el tope"}
              </span>
            </div>
          </div>

          {/* Compras / Consumos */}
          <div className="space-y-2 rounded-xl bg-bg/50 p-4 border border-line/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Compras / Consignaciones</span>
              <span className="font-mono text-emerald-800 font-bold">{formatCOP(simCompras)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000000"
              step="2000000"
              value={simCompras}
              onChange={(e) => setSimCompras(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>Tope: {formatCOP(topeCompras)} (1.400 UVT)</span>
              <span className={simCompras >= topeCompras ? "text-amber-600 font-bold" : "text-emerald-700"}>
                {simCompras >= topeCompras ? "¡Supera tope!" : "Bajo el tope"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted border-t border-line/60 pt-3">
          <span>
            💡 ¿Necesitas el informe detallado con los 5 topes oficiales?
          </span>
          <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
            <Link to="/topes">
              Ver Diagnóstico Completo de Topes <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FLUJO INTERACTIVO EN 4 PASOS (EL EMBUDO TRIBUTARIO) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">
            Flujo Guiado de Liquidación
          </h2>
          <p className="text-xs text-muted">
            Todo lo que necesitas para culminar tu declaración de forma segura y sin errores.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Paso 1 */}
          <Link to="/documentos" className="group">
            <Card className="h-full border border-line bg-surface hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  01
                </span>
                <Badge tone="ok">Exógena & Docs</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-bold group-hover:text-emerald-700 transition-colors">
                Carga de Información
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Sube el Excel de Exógena DIAN y certificados bancarios. El sistema extrae y clasifica automáticamente.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Cargar archivos →
              </div>
            </Card>
          </Link>

          {/* Paso 2 */}
          <Link to="/declaracion" className="group">
            <Card className="h-full border border-line bg-surface hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  02
                </span>
                <Badge tone="neutral">Formulario 210</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-bold group-hover:text-emerald-700 transition-colors">
                Captura y Cédulas
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Diligencia rentas de trabajo, honorarios, capital, dividendos y ganancias ocasionales con validación instantánea.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Diligenciar casillas →
              </div>
            </Card>
          </Link>

          {/* Paso 3 */}
          <Link to="/cedulas" className="group">
            <Card className="h-full border border-line bg-surface hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  03
                </span>
                <Badge tone="warn">Depuración Ley 2277</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-bold group-hover:text-emerald-700 transition-colors">
                Exenciones y Límites
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Aplica la exención del 25%, dependientes económicos (hasta 4 de 72 UVT), medicina prepagada y tope del 40%.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ver depuración cedular →
              </div>
            </Card>
          </Link>

          {/* Paso 4 */}
          <Link to="/formulario" className="group">
            <Card className="h-full border border-line bg-surface hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  04
                </span>
                <Badge tone="stamp">Radicación</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-bold group-hover:text-emerald-700 transition-colors">
                Descarga Oficial DIAN
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Exporta el Excel DIAN 210, XML Muisca, PDF del Formulario y el Informe Ejecutivo listo para enviar al cliente.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Generar descargables →
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PANEL UVT OFICIAL Y ESTADÍSTICAS DEL EXPEDIENTE */}
      {/* ========================================================================= */}
      <UvtPanel />

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Patrimonio líquido"
          value={formatCOP(computed.casillas[31] ?? 0)}
          hint={formatUvt(uvtFromPesos(computed.casillas[31] ?? 0, d.year, d.uvtOverrides))}
        />
        <Stat
          label="Renta líquida gravable"
          value={formatCOP(computed.rentaLiquidaGravable)}
          hint={`Casilla 97 · ${CASILLA_LABELS[97]}`}
        />
        <Stat
          label={computed.saldoPagar > 0 ? "Saldo a pagar" : computed.saldoFavor > 0 ? "Saldo a favor" : "Impuesto a cargo"}
          value={formatCOP(computed.saldoPagar || computed.saldoFavor || computed.impuestoCargo)}
          hint={computed.saldoPagar > 0 ? "Casilla 136" : computed.saldoFavor > 0 ? "Casilla 137" : "Casilla 129"}
        />
      </section>

      {/* ========================================================================= */}
      {/* 5. AUDITORÍA PREVENTIVA Y CENTRO DE EXPEDIENTE */}
      {/* ========================================================================= */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Expediente de {name}</CardTitle>
              <CardHint>
                {computed.obligado
                  ? `Obligado a declarar por AG ${d.year} (Supera topes del Estatuto Tributario).`
                  : "Con los datos actuales no se activa un tope de obligación. Puede declarar de forma voluntaria."}
              </CardHint>
            </div>
            <Badge tone={computed.obligado ? "stamp" : "ok"}>
              {computed.obligado ? "Obligado" : "Revise topes"}
            </Badge>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {computed.razonesObligado.length
              ? computed.razonesObligado.map((r) => (
                  <li key={r} className="border-l-2 border-emerald-600 pl-3">
                    {r}
                  </li>
                ))
              : [
                  "Ingresos, patrimonio, consignaciones, compras y consumos con tarjeta aún no cruzan un umbral legal.",
                ].map((r) => (
                  <li key={r} className="border-l-2 border-line pl-3">
                    {r}
                  </li>
                ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
              <Link to="/declaracion">Continuar declaración</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/documentos">
                <FileStack /> {sum.block + sum.warn > 0 ? `${sum.block + sum.warn} en el expediente` : "Soportes"}
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              Borrar datos
            </Button>
          </div>
        </Card>

        {/* Asistente IA Gemini & Herramientas */}
        <Card className="bg-gradient-to-br from-emerald-950/5 to-teal-900/10 border-emerald-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Sparkles className="size-5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
              <CardTitle className="text-lg">Copiloto Tributario con IA</CardTitle>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              ¿Dudas sobre cómo deducir dependientes económicos, aplicar el beneficio de auditoría del Art. 689-3, o cómo declarar cuentas en el exterior? Pregúntale a nuestro asistente entrenado en el Estatuto Tributario.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted">Google Gemini AI Integrado</span>
            <Button
              onClick={() => setGeminiOpen(true)}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5" />
              <span>Consultar IA (Ctrl + K)</span>
            </Button>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 6. HERRAMIENTAS ADICIONALES DE NAVEGACIÓN */}
      {/* ========================================================================= */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/biblioteca" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5 hover:border-emerald-500/40">
            <Scale className="size-5 text-emerald-700" />
            <CardTitle className="mt-3 text-lg">Estatuto Tributario & Normas</CardTitle>
            <CardHint>
              Índice completo de libros, artículos oficiales de la DIAN, DUR 1625 y Ley 2277 con búsqueda instantánea.
            </CardHint>
          </Card>
        </Link>
        <Link to="/liquidacion" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5 hover:border-emerald-500/40">
            <Wallet className="size-5 text-emerald-700" />
            <CardTitle className="mt-3 text-lg">Liquidación Privada & Anticipos</CardTitle>
            <CardHint>
              Impuesto neto {formatCOP(computed.impuestoNeto)}, anticipo para el año siguiente y retenciones aplicadas.
            </CardHint>
          </Card>
        </Link>
        <Link to="/clientes" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5 hover:border-emerald-500/40">
            <Users className="size-5 text-emerald-700" />
            <CardTitle className="mt-3 text-lg">Gestor de Clientes y Portafolio</CardTitle>
            <CardHint>
              Crea y administra múltiples expedientes de clientes con almacenamiento seguro en tu navegador.
            </CardHint>
          </Card>
        </Link>
      </section>

      {/* ========================================================================= */}
      {/* 7. ALERTAS Y HALLAZGOS DEL EXPEDIENTE */}
      {/* ========================================================================= */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Auditoría Preventiva Anti-Sanciones</h2>
            <p className="text-xs text-muted">Reglas automáticas de consistencia patrimonial y límites legales.</p>
          </div>
          <Badge tone={findings.length > 0 ? "warn" : "ok"}>
            {findings.length > 0 ? `${findings.length} Alertas` : "Expediente Limpio"}
          </Badge>
        </div>
        <div className="mt-3">
          <AlertList
            alerts={(findings.length ? findings : computed.alerts).slice(0, 6).map((a) => ({
              id: a.id,
              level: a.level,
              title: a.title,
              detail: a.detail,
              source: a.source,
            }))}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. BARRA DE GARANTÍA, AUTORIDAD Y AVISO LEGAL */}
      {/* ========================================================================= */}
      <section className="rounded-xl border border-line bg-bg-raised p-5 text-xs leading-relaxed text-muted space-y-2">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Lock className="size-4 text-emerald-700" />
          <span>Privacidad y Fuentes Oficiales Garantizadas</span>
        </div>
        <p>
          <strong>DeclaraPro</strong> opera como un sistema profesional de liquidación y orientación tributaria basado en la estructura oficial del Formulario 210 de la DIAN (Resolución 000044 de 2024 y Resolución 000227 de 2025), el Estatuto Tributario compilado y el Decreto 1625 de 2016. Valores de UVT parametrizados: <strong>2025 = $49.799</strong> y <strong>2026 = $52.374</strong> (Res. 000238 de 2025). Calendario oficial del 12 de agosto al 26 de octubre de 2026.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="hover-lift border border-line bg-surface hover:border-emerald-500/40">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-bold">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums tracking-tight font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-xs text-faint">{hint}</p>
    </Card>
  );
}
