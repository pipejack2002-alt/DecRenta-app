import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck, FileSpreadsheet, FileStack, Scale, Wallet } from "lucide-react";
import { useState } from "react";
import { AlertList } from "@/components/layout/alert-list";
import { DeadlineLookup } from "@/components/layout/deadline-lookup";
import { UvtPanel } from "@/components/layout/uvt-panel";
import { ExogenaImportModal } from "@/components/layout/exogena-import-modal";
import { ClientChecklistModal } from "@/components/layout/client-checklist-modal";
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
  const d = useAppStore((s) => s.declaration);
  const docs = useAppStore((s) => s.docs);
  const loadExample = useAppStore((s) => s.loadExample);
  const reset = useAppStore((s) => s.reset);
  const c = useComputed();
  const findings = auditExpediente(d, c, docs);
  const sum = findingsSummary(findings);
  const zona = isZonaSismo1226(d.identity.dirSeccional, d.identity.zonaSismo1226);
  const dl = deadlineForNit(d.identity.nit, { zonaSismo1226: zona, seccional: d.identity.dirSeccional });
  const days = dl ? daysUntil(dl.iso) : null;
  const name = [d.identity.primerNombre, d.identity.primerApellido].filter(Boolean).join(" ") || "sin identificar";

  return (
    <div className="space-y-8">
      <ExogenaImportModal isOpen={exogenaOpen} onClose={() => setExogenaOpen(false)} />
      <ClientChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative order-2 overflow-hidden rounded-xl bg-forest px-6 py-7 text-primary-fg shadow-[var(--shadow-page)] sm:px-8 sm:py-10 lg:order-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-fg/70">Persona natural residente · Formulario 210</p>
          <h1 className="mt-2 max-w-xl font-display text-4xl leading-[1.1] sm:text-5xl font-bold">
            Declaración de Renta Persona Natural
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-fg/85">
            Sistema profesional de liquidación y depuración cedular del Formulario 210 (Año Gravable {d.year}) con la UVT oficial de {formatCOP(c.uvt)}. Aplica de forma automática los límites y exenciones de la Ley 2277 de 2022 y genera los archivos listos para el prevalidador de la DIAN.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => setExogenaOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold gap-2 shadow-sm"
            >
              <FileSpreadsheet className="size-4" />
              Importar Exógena DIAN (Excel)
            </Button>
            <Button
              onClick={() => setChecklistOpen(true)}
              variant="outline"
              className="border-primary-fg/40 text-primary-fg hover:bg-forest-deep gap-2 font-medium"
            >
              <FileCheck className="size-4" />
              Lista Documentos Cliente
            </Button>
            <Button asChild variant="outline" className="border-primary-fg/25 text-primary-fg hover:bg-forest-deep">
              <Link to="/declaracion">Diligenciar Formulario 210</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary-fg/25 text-primary-fg hover:bg-forest-deep">
              <Link to="/cedulas">Depuración cedular</Link>
            </Button>
            <Button variant="ghost" className="text-primary-fg/80 hover:bg-forest-deep" onClick={loadExample}>
              Cargar caso de ejemplo
            </Button>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <DeadlineLookup />
        </div>
      </section>
      <UvtPanel />

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Patrimonio líquido"
          value={formatCOP(c.casillas[31] ?? 0)}
          hint={formatUvt(uvtFromPesos(c.casillas[31] ?? 0, d.year, d.uvtOverrides))}
        />
        <Stat
          label="Renta líquida gravable"
          value={formatCOP(c.rentaLiquidaGravable)}
          hint={`Casilla 97 · ${CASILLA_LABELS[97]}`}
        />
        <Stat
          label={c.saldoPagar > 0 ? "Saldo a pagar" : c.saldoFavor > 0 ? "Saldo a favor" : "Impuesto a cargo"}
          value={formatCOP(c.saldoPagar || c.saldoFavor || c.impuestoCargo)}
          hint={c.saldoPagar > 0 ? "Casilla 136" : c.saldoFavor > 0 ? "Casilla 137" : "Casilla 129"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Expediente de {name}</CardTitle>
              <CardHint>
                {c.obligado ? `Obligado a declarar por AG ${d.year}.` : "Con los datos actuales no se activa un tope de obligación. Puede declarar de forma voluntaria."}
              </CardHint>
            </div>
            <Badge tone={c.obligado ? "stamp" : "ok"}>{c.obligado ? "Obligado" : "Revise topes"}</Badge>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {c.razonesObligado.length
              ? c.razonesObligado.map((r) => (
                  <li key={r} className="border-l-2 border-forest pl-3">
                    {r}
                  </li>
                ))
              : [
                  "Ingresos, patrimonio, consignaciones, compras y IVA aún no cruzan un umbral.",
                ].map((r) => (
                  <li key={r} className="border-l-2 border-line pl-3">
                    {r}
                  </li>
                ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm">
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

        <Card>
          <CardTitle className="text-lg">Su plazo</CardTitle>
          {dl ? (
            <>
              <p className="mt-3 font-display text-3xl tabular-nums">{dl.date.replace(/ de 20\d{2}$/, "")}</p>
              <p className="mt-1 text-sm text-muted">
                Dos últimos dígitos {d.identity.nit.slice(-2)}.{" "}
                {days !== null ? (days >= 0 ? `Quedan ${days} días.` : `Venció hace ${Math.abs(days)} días.`) : null}
              </p>
              {dl.regime === "decreto-1226" ? (
                <p className="mt-2 text-xs text-warn">Plazo especial del Decreto 1226 (zona del sismo).</p>
              ) : null}
            </>
          ) : (
            <CardHint>Escriba la cédula arriba. Los vencimientos generales van del 12 de agosto al 26 de octubre de 2026.</CardHint>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/biblioteca" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5">
            <Scale className="size-5 text-forest" />
            <CardTitle className="mt-3 text-lg">Normativa</CardTitle>
            <CardHint>Índice de libros y títulos del Estatuto Tributario, DUR 1625, Constitución y resoluciones DIAN.</CardHint>
          </Card>
        </Link>
        <Link to="/liquidacion" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5">
            <Wallet className="size-5 text-forest" />
            <CardTitle className="mt-3 text-lg">Liquidación privada</CardTitle>
            <CardHint>
              Impuesto neto {formatCOP(c.impuestoNeto)}. Anticipo, retenciones y saldo.
            </CardHint>
          </Card>
        </Link>
        <Link to="/asistente" className="group">
          <Card className="h-full transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5">
            <FileStack className="size-5 text-forest" />
            <CardTitle className="mt-3 text-lg">Asistente</CardTitle>
            <CardHint>Pregunte por qué no puede tomar un costo, un tope o una exención, con cita a la norma.</CardHint>
          </Card>
        </Link>
      </section>

      <section>
        <h2 className="font-display text-2xl">Qué está mal en el expediente</h2>
        <div className="mt-4">
          <AlertList
            alerts={(findings.length ? findings : c.alerts).slice(0, 6).map((a) => ({
              id: a.id,
              level: a.level,
              title: a.title,
              detail: a.detail,
              source: a.source,
            }))}
          />
        </div>
      </section>

      <p className="text-xs leading-relaxed text-faint">
        Cedulario es una herramienta de orientación basada en el Formulario 210 (Resolución 000044 de 2024 y Resolución 000227 de 2025), el Estatuto Tributario compilado y el Decreto 1625 de 2016. Fuentes cruzadas el 24 de agosto de 2026: UVT 2026 = $52.374 (Res. 000238 de 2025); topes AG 2025 con UVT $49.799; calendario general 12 ago–26 oct 2026 (Comunicado DIAN 090); plazo especial Decreto 1226 para zonas del sismo. No sustituye el Sistema Informático de Diligenciamiento de la DIAN ni el dictamen de un contador público. Verifique siempre en{" "}
        <a className="underline" href="https://www.dian.gov.co" target="_blank" rel="noreferrer">
          dian.gov.co
        </a>{" "}
        y en la Secretaría del Senado.
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-faint">{hint}</p>
    </Card>
  );
}
