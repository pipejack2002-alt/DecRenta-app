import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertList } from "@/components/layout/alert-list";
import { TaxCharts } from "@/components/layout/tax-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { ART_241 } from "@/lib/tax/tarifas";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { uvtFromPesos } from "@/lib/tax/uvt";

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
  const c = useComputed();
  const d = useAppStore((s) => s.declaration);
  const ov = d.uvtOverrides;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Liquidación privada</p>
        <h1 className="mt-1 font-display text-4xl">Del 210 a la plata</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Impuesto según tabla del art. 241 E.T. (Ley 2277 de 2022). UVT AG {c.year} = {formatCOP(c.uvt)}. UVT de presentación {c.filingYear} = {formatCOP(c.uvtFiling)}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Impuesto neto</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{formatCOP(c.impuestoNeto)}</p>
          <p className="text-xs text-faint">Casilla 126</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            {c.saldoPagar > 0 ? "A pagar" : "A favor"}
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">{formatCOP(c.saldoPagar || c.saldoFavor)}</p>
          <p className="text-xs text-faint">{c.saldoPagar > 0 ? "Casilla 136" : "Casilla 137"}</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Renta gravable general</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{formatCOP(c.rentaLiquidaGravable)}</p>
          <p className="text-xs text-faint">
            {formatUvt(uvtFromPesos(c.rentaLiquidaGravable, c.year, ov))} · casilla 97
          </p>
        </Card>
      </div>

      {/* Analítica visual con Recharts */}
      <TaxCharts computed={c} declaration={d} />

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
    { k: "(−) INCRNGO", v: d.incrngo },
    { k: "Subtotal", v: d.subtotal },
    { k: "40 % (tope 1.340 UVT)", v: d.poolLimit, hint: `40 % = ${formatCOP(d.cuarentaPct)} · 1.340 UVT = ${formatCOP(d.tope1340)}` },
    { k: "Exentas no sometidas al 40 %", v: d.ilimitadas, hint: "Nums. 1-3 y 6-8 art. 206, primas, CAN." },
    { k: "72 UVT × dependientes (casilla 139)", v: d.dependientes72 },
    { k: "1 % factura electrónica (casilla 28)", v: d.facturaElectronica, hint: "Fuera del 40 %." },
    { k: "Casilla 92", v: d.total92 },
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Depuración del 40 % / 1.340 UVT</CardTitle>
          <CardHint>Art. 336 num. 3 · art. 1.2.1.20.4 DUR. Igual a la determinación cedular de la DIAN.</CardHint>
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
