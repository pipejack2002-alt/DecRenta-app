import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertList } from "@/components/layout/alert-list";
import { TaxCharts } from "@/components/layout/tax-charts";
import { ComparacionPatrimonialCard } from "@/components/layout/comparacion-patrimonial-card";
import { BeneficioAuditoriaCard } from "@/components/layout/beneficio-auditoria-card";
import { AnticipoCard } from "@/components/layout/anticipo-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { ART_241 } from "@/lib/tax/tarifas";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { uvtFromPesos } from "@/lib/tax/uvt";

import { useState } from "react";
import { LiquidacionExplicacionModal, type ExplicacionTopic } from "@/components/layout/liquidacion-explicacion-modal";
import { Info } from "lucide-react";

export const Route = createFileRoute("/liquidacion")({ component: LiquidacionPage });

const BLOCKS: { title: string; ids: number[] }[] = [
  { title: "Patrimonio", ids: [29, 30, 31] },
  { title: "Cédula general — trabajo", ids: [32, 33, 34, 35, 36, 37, 38, 40, 41, 42] },
  { title: "Honorarios", ids: [43, 45, 46, 53, 55, 57, 140] },
  { title: "Capital y no laborales", ids: [58, 61, 69, 73, 74, 78, 86, 90] },
  { title: "Depuración cédula general", ids: [28, 91, 92, 93, 96, 97, 98, 139] },
  { title: "Pensiones y dividendos", ids: [99, 102, 103, 107, 108, 111] },
  { title: "Ganancias ocasionales", ids: [112, 113, 114, 115, 127] },
  { title: "Impuesto y saldo", ids: [116, 118, 121, 125, 126, 129, 132, 133, 135, 136, 137, 141] },
];

function LiquidacionPage() {
  const [topic, setTopic] = useState<ExplicacionTopic | null>(null);
  const c = useComputed();
  const d = useAppStore((s) => s.declaration);
  const ov = d.uvtOverrides;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Determinación del Impuesto · Formulario 210</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Liquidación Privada del Impuesto</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Cálculo del impuesto sobre la renta y complementarios según la tabla progresiva del art. 241 E.T. (Ley 2277 de 2022). UVT AG {c.year} = {formatCOP(c.uvt)}. UVT de presentación {c.filingYear} = {formatCOP(c.uvtFiling)}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta 1: Renta Líquida Gravable */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTopic("renta-gravable")}
          onKeyDown={(e) => e.key === "Enter" && setTopic("renta-gravable")}
          className="cursor-pointer group text-left rounded-2xl border border-line bg-surface p-4 shadow-sm hover:border-forest/50 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-forest/30"
          title="Haz clic para ver la fórmula y explicación técnica de la Casilla 97"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted group-hover:text-forest transition-colors">
              Renta Líquida Gravable
            </p>
            <span className="font-mono text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded border border-line text-muted group-hover:border-forest/40 group-hover:text-forest transition-colors">
              Casilla 97
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{formatCOP(c.rentaLiquidaGravable)}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>{formatUvt(uvtFromPesos(c.rentaLiquidaGravable, c.year, ov))} · Base Cédula General</span>
            <span className="text-[10px] font-semibold text-forest flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="size-3" /> Ver fórmula
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Impuesto Neto de Renta */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTopic("impuesto-neto")}
          onKeyDown={(e) => e.key === "Enter" && setTopic("impuesto-neto")}
          className="cursor-pointer group text-left rounded-2xl border border-line bg-surface p-4 shadow-sm hover:border-forest/50 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-forest/30"
          title="Haz clic para ver cómo opera la tabla del Art. 241 E.T. y la tarifa del 0%"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted group-hover:text-forest transition-colors">
              Impuesto Neto de Renta
            </p>
            <span className="font-mono text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded border border-line text-muted group-hover:border-forest/40 group-hover:text-forest transition-colors">
              Casilla 126
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{formatCOP(c.impuestoNeto)}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>Art. 241 E.T. · Tarifa 0 % (&lt; 1.090 UVT)</span>
            <span className="text-[10px] font-semibold text-forest flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="size-3" /> Ver tabla
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Anticipo Año Siguiente */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTopic("anticipo")}
          onKeyDown={(e) => e.key === "Enter" && setTopic("anticipo")}
          className="cursor-pointer group text-left rounded-2xl border border-line bg-surface p-4 shadow-sm hover:border-forest/50 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-forest/30"
          title="Haz clic para ver el procedimiento de cálculo del Anticipo (Art. 807 E.T.)"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted group-hover:text-forest transition-colors">
              Anticipo Año Siguiente
            </p>
            <span className="font-mono text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded border border-line text-muted group-hover:border-forest/40 group-hover:text-forest transition-colors">
              Casilla 133
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{formatCOP(c.casillas[133] ?? 0)}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>Art. 807 E.T. · Anticipo AG {c.filingYear}</span>
            <span className="text-[10px] font-semibold text-forest flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="size-3" /> Ver cálculo
            </span>
          </div>
        </div>

        {/* Tarjeta 4: Total Saldo a Pagar / a Favor */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTopic("saldo-pagar")}
          onKeyDown={(e) => e.key === "Enter" && setTopic("saldo-pagar")}
          className={`cursor-pointer group text-left rounded-2xl border border-line p-4 shadow-sm hover:border-forest/50 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-forest/30 ${
            c.saldoPagar > 0 ? "bg-amber-50/40" : c.saldoFavor > 0 ? "bg-emerald-50/40" : "bg-surface"
          }`}
          title="Haz clic para ver la fórmula de cierre de saldos a pagar / a favor"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted group-hover:text-forest transition-colors">
              {c.saldoPagar > 0 ? "Total Saldo a Pagar" : c.saldoFavor > 0 ? "Total Saldo a Favor" : "Total Saldo a Pagar"}
            </p>
            <span className="font-mono text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded border border-line text-muted group-hover:border-forest/40 group-hover:text-forest transition-colors">
              {c.saldoPagar > 0 ? "Casilla 136" : c.saldoFavor > 0 ? "Casilla 137" : "Casilla 136"}
            </span>
          </div>
          <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${c.saldoPagar > 0 ? "text-amber-800" : c.saldoFavor > 0 ? "text-emerald-700" : "text-ink"}`}>
            {formatCOP(c.saldoPagar || c.saldoFavor)}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>{c.saldoPagar > 0 ? "Impuesto + Anticipo − Retenciones" : c.saldoFavor > 0 ? "Retenciones superiores al impuesto" : "Sin impuesto a cargo"}</span>
            <span className="text-[10px] font-semibold text-forest flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="size-3" /> Ver cierre
            </span>
          </div>
        </div>
      </div>

      {/* Modal Interactivo de Explicación Técnica y Fórmulas */}
      <LiquidacionExplicacionModal
        topic={topic}
        onClose={() => setTopic(null)}
        computed={c}
        year={d.year}
      />

      {/* Analítica visual con Recharts */}
      <TaxCharts computed={c} declaration={d} />

      {/* Conciliación Patrimonial (Arts. 236 a 239 E.T.) */}
      <ComparacionPatrimonialCard />

      {/* Beneficio de Auditoría y Sanciones (Arts. 689-3 y 641 E.T.) */}
      <BeneficioAuditoriaCard />

      {/* Anticipo de Renta AG 2026 (Art. 807 E.T.) */}
      <AnticipoCard />

      <DepuracionCard />

      <Card>
        <CardTitle className="text-lg">Tabla art. 241</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2">Desde UVT</th>
                <th>Hasta</th>
                <th>Tarifa</th>
                <th>Más</th>
              </tr>
            </thead>
            <tbody>
              {ART_241.map((b) => (
                <tr key={b.from} className="border-t border-line">
                  <td className="py-2 tabular-nums">{b.from}</td>
                  <td className="tabular-nums">{b.to ?? "en adelante"}</td>
                  <td>{Math.round(b.rate * 100)} %</td>
                  <td className="tabular-nums">{b.plusUvt ? `${b.plusUvt} UVT` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {BLOCKS.map((b) => (
        <Card key={b.title}>
          <CardTitle className="text-lg">{b.title}</CardTitle>
          <ul className="mt-3 divide-y divide-line">
            {b.ids.map((id) => (
              <li key={id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-mono text-[10px] text-faint">{id}</span> {CASILLA_LABELS[id]}
                </span>
                <span className="tabular-nums">
                  {id === 140 ? (c.casillas[id] ? "X" : "—") : formatCOP(c.casillas[id] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-2xl">Por qué quedó así</h2>
          <Badge tone="forest">{c.alerts.length}</Badge>
        </div>
        <AlertList alerts={c.alerts} />
      </section>

      <Button asChild>
        <Link to="/formulario">Ver Formulario 210</Link>
      </Button>
    </div>
  );
}

function DepuracionCard() {
  const c = useComputed();
  const d = c.depuracion;
  const rows: { k: string; v: number; hint?: string }[] = [
    { k: "Ingresos brutos cédula general", v: d.ingresosBrutos },
    { k: "(−) Ingresos no constitutivos de renta (Salud/Pensión)", v: d.incrngo },
    { k: "Base para el límite del 40 %", v: d.subtotal },
    { k: "Tope conjunto del 40 % (máx. 1.340 UVT)", v: d.poolLimit, hint: `40 % = ${formatCOP(d.cuarentaPct)} · 1.340 UVT = ${formatCOP(d.tope1340)}` },
    { k: "Exentas y deducciones independientes (fuera del 40 %)", v: d.ilimitadas, hint: "Indemnizaciones laborales, gastos de representación, CAN." },
    { k: "Deducción dependientes adicionales (72 UVT c/u · Casilla 139)", v: d.dependientes72 },
    { k: "1 % compras con factura electrónica (Casilla 28)", v: d.facturaElectronica, hint: "Deducción especial independiente (Art. 336 par. 5)." },
    { k: "Rentas exentas y deducciones imputables (Casilla 92)", v: d.total92 },
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Depuración y Límite del 40 % / 1.340 UVT</CardTitle>
          <CardHint>Art. 336 E.T. y Art. 1.2.1.20.4 DUR 1625. Metodología oficial de depuración de la Cédula General DIAN.</CardHint>
        </div>
        <Link to="/cedulas" className="text-sm text-forest underline-offset-2 hover:underline">
          Ver matriz cedular
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.k} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span>
              {r.k}
              {r.hint ? <span className="mt-0.5 block text-[11px] text-muted">{r.hint}</span> : null}
            </span>
            <span className="tabular-nums">{formatCOP(r.v)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
