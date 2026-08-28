import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import {
  CAPITAL_CATS,
  CEDULA_COLS,
  DEDUCCION_ROWS,
  EXENTA_ROWS,
  FACTURA_ELECTRONICA_REQS,
  INCR_ROWS,
  NL_CATS,
  whyCannot,
  type MatrixRow,
} from "@/lib/tax/matrices";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { pesosFromUvt } from "@/lib/tax/uvt";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cedulas")({ component: CedulasPage });

const TABS: { id: "incr" | "exenta" | "deduccion" | "depuracion"; label: string }[] = [
  { id: "incr", label: "No Constitutivos de Renta (Salud/Pensión)" },
  { id: "exenta", label: "Rentas exentas" },
  { id: "deduccion", label: "Deducciones imputables" },
  { id: "depuracion", label: "Límite 40 % / 1.340 UVT" },
];

function CedulasPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("incr");
  const [open, setOpen] = useState<string | null>(null);
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const y = d.year;
  const ov = d.uvtOverrides;

  const rows = tab === "incr" ? INCR_ROWS : tab === "exenta" ? EXENTA_ROWS : tab === "deduccion" ? DEDUCCION_ROWS : [];
  const selected = useMemo(
    () => [...INCR_ROWS, ...EXENTA_ROWS, ...DEDUCCION_ROWS].find((r) => r.id === open) ?? null,
    [open],
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Sistema Cedular · Estatuto Tributario · AG {y}</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Depuración Cedular Integral</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Matriz legal de depuración para la Cédula General (Trabajo, Honorarios, Capital y No Laborales), Pensiones y Dividendos. Consolida ingresos no constitutivos de renta (aportes obligatorios), rentas exentas y deducciones imputables con el límite conjunto del 40 % o 1.340 UVT (Art. 336 E.T.).
        </p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setOpen(null);
            }}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
              tab === t.id ? "bg-forest text-primary-fg" : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "depuracion" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-forest text-primary-fg">
                  <th className="px-4 py-3 font-medium">
                    {tab === "incr" ? "Ingresos no constitutivos de renta" : tab === "exenta" ? "Rentas exentas" : "Deducciones"}
                  </th>
                  {CEDULA_COLS.map((col) => (
                    <th key={col.id} className="px-2 py-3 text-center text-[11px] font-medium uppercase tracking-wide">
                      {col.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-b border-line last:border-0",
                      open === row.id ? "bg-forest-mist" : "hover:bg-bg-raised",
                    )}
                    onClick={() => setOpen(open === row.id ? null : row.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium leading-snug">{row.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {row.article}
                        {row.capUvt ? ` · ${row.capUvt} UVT = ${formatCOP(pesosFromUvt(row.capUvt, y, ov))}` : ""}
                      </p>
                    </td>
                    {CEDULA_COLS.map((col) => (
                      <td key={col.id} className="px-2 py-3 text-center">
                        {row.cols[col.id] ? (
                          <Check className="mx-auto size-4 text-ok" strokeWidth={2.5} />
                        ) : (
                          <Minus className="mx-auto size-3 text-line-strong" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selected && tab !== "depuracion" && <WhyPanel row={selected} year={y} uvt={c.uvt} />}

      {tab === "depuracion" && <DepuracionPanel />}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Rentas de capital · art. 335</CardTitle>
          <CardHint>Lo que la DIAN agrupa en la cédula de capital.</CardHint>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {CAPITAL_CATS.map((cat) => (
              <li key={cat.id} className="rounded-md border border-line bg-bg-raised px-3 py-2 text-sm">
                {cat.label}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Rentas no laborales · art. 335</CardTitle>
          <CardHint>Todo lo que no cabe en trabajo, capital, pensiones ni dividendos.</CardHint>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NL_CATS.map((cat) => (
              <li key={cat.id} className="rounded-md border border-line bg-bg-raised px-3 py-2 text-sm">
                {cat.label}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>1 % de factura electrónica · num. 5 art. 336</CardTitle>
            <CardHint>No se somete al 40 % ni a 1.340 UVT. Tope 240 UVT = {formatCOP(pesosFromUvt(240, y, ov))}.</CardHint>
          </div>
          <Badge tone="forest">Casilla 28 · {formatCOP(c.casillas[28] ?? 0)}</Badge>
        </div>
        <ul className="mt-4 space-y-2">
          {FACTURA_ELECTRONICA_REQS.map((r) => (
            <li key={r.id} className="flex gap-2 text-sm text-ink-soft">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.25} />
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Cédula de pensiones</CardTitle>
          <CardHint>Num. 5 art. 206. Exentas hasta 1.000 UVT mensuales ({formatCOP(pesosFromUvt(1000, y, ov))} por mes).</CardHint>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Ingresos brutos (casilla 99)" v={c.casillas[99] ?? 0} />
            <Row k="Aportes a salud y solidaridad (casilla 100)" v={c.casillas[100] ?? 0} />
            <Row k="Renta líquida (101)" v={c.casillas[101] ?? 0} />
            <Row k="Rentas exentas (102)" v={c.casillas[102] ?? 0} />
            <Row k="Renta líquida gravable (103)" v={c.casillas[103] ?? 0} />
          </dl>
        </Card>
        <Card>
          <CardTitle>Dividendos · arts. 48, 49 y 242</CardTitle>
          <CardHint>La 1ª subcédula (num. 3 art. 49) se suma a la tabla 241. La 2ª (par. 2) se grava a tarifa de sociedades.</CardHint>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="2016 y anteriores (104)" v={c.casillas[104] ?? 0} />
            <Row k="1ª subcédula 2017+ (107)" v={c.casillas[107] ?? 0} />
            <Row k="2ª subcédula 2017+ (108)" v={c.casillas[108] ?? 0} />
            <Row k="Del exterior (109)" v={c.casillas[109] ?? 0} />
          </dl>
        </Card>
      </section>

      <p className="text-xs text-faint">
        Compilación de la capacitación DIAN «Impuesto sobre la renta personas naturales — determinación cedular» (AG 2025), cruzada con el Estatuto Tributario. No sustituye el instructivo ni el portal de la DIAN.
      </p>
    </div>
  );
}

function WhyPanel({ row, year, uvt }: { row: MatrixRow; year: number; uvt: number }) {
  const ov = useAppStore((s) => s.declaration.uvtOverrides);
  return (
    <Card className="border-forest/25 bg-forest-mist/40">
      <div className="flex flex-wrap items-center gap-2">
        <Scale className="size-4 text-forest" />
        <CardTitle className="text-lg">{row.label}</CardTitle>
        <Badge tone="forest">{row.article}</Badge>
        {!row.limited40 && row.kind !== "incr" ? <Badge tone="ok">Fuera del 40 %</Badge> : null}
        {row.limited40 ? <Badge tone="warn">Sometida al 40 % / 1.340 UVT</Badge> : null}
      </div>
      {row.cap ? <p className="mt-2 text-sm text-ink-soft">{row.cap}</p> : null}
      {row.capNote ? <p className="mt-1 text-sm text-muted">{row.capNote}</p> : null}
      {row.capUvt ? (
        <p className="mt-1 text-sm tabular-nums text-muted">
          {row.capUvt} UVT × {formatCOP(uvt)} = {formatCOP(pesosFromUvt(row.capUvt, year, ov))} en {year}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {CEDULA_COLS.map((col) => {
          const ok = row.cols[col.id];
          const reason = whyCannot(row, col.id);
          return (
            <li key={col.id} className="text-sm">
              <p className="flex items-center gap-2 font-medium">
                {ok ? <Check className="size-4 text-ok" /> : <Minus className="size-4 text-stamp" />}
                {col.long}
              </p>
              {!ok && reason ? <p className="mt-1 pl-6 text-muted">{reason}</p> : null}
              {ok ? (
                <p className="mt-1 pl-6 text-muted">
                  Sí se imputa a {col.short.toLowerCase()}. {col.arts}.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Link to="/biblioteca/$id" params={{ id: row.articleId }} className="mt-4 inline-block text-sm text-forest underline-offset-2 hover:underline">
        Leer {row.article} en la normativa
      </Link>
    </Card>
  );
}

function DepuracionPanel() {
  const c = useComputed();
  const d = c.depuracion;
  const dec = useAppStore((s) => s.declaration);
  const uvt = c.uvt;

  const cupoDisponible = Math.max(0, d.poolLimit - d.limitedUsed);
  const pctUsado = d.poolLimit > 0 ? Math.min(100, (d.limitedUsed / d.poolLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Banner de Resumen y Estado del Límite */}
      <Card className="border-forest/30 bg-gradient-to-br from-forest-mist/40 via-surface to-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-forest/20 text-forest">
                <Scale className="size-4" />
              </span>
              <CardTitle className="text-lg">Depuración Integral y Límite Conjunto (40 % / 1.340 UVT)</CardTitle>
            </div>
            <CardHint className="text-xs leading-relaxed">
              Fundamento legal: Art. 336 numeral 3 del E.T. y Art. 1.2.1.20.4 del DUR 1625 de 2016. La ley unifica las 4 subcédulas y aplica el tope del 40 % sobre la base neta general.
            </CardHint>
          </div>
          <Badge tone={cupoDisponible > 0 ? "ok" : "warn"} className="text-xs px-3 py-1 font-semibold">
            {cupoDisponible > 0 ? "✅ Dentro del límite legal" : "⚠️ Límite del 40% alcanzado"}
          </Badge>
        </div>

        {/* Barra de progreso de uso del 40% */}
        <div className="mt-5 space-y-2 rounded-xl bg-surface/80 p-4 border border-line">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-medium text-ink">
              Uso del cupo del 40 %: <strong className="text-forest font-mono">{formatCOP(d.limitedUsed)}</strong> de{" "}
              <strong className="font-mono">{formatCOP(d.poolLimit)}</strong> ({pctUsado.toFixed(1)} %)
            </span>
            <span className="text-muted font-mono text-[11px]">
              Disponible sin agotar: <strong className="text-emerald-700">{formatCOP(cupoDisponible)}</strong>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist">
            <div
              className={cn("h-full transition-all", cupoDisponible > 0 ? "bg-forest" : "bg-amber-600")}
              style={{ width: `${pctUsado}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Tarjetas de Proceso Paso a Paso */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Paso 1: Ingresos Brutos de las 4 Subcédulas */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">1</span>
            <h3 className="font-bold text-ink text-sm">Paso 1 · Ingresos Brutos de la Cédula General</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Sumatoria de los ingresos brutos percibidos en el año por todas las fuentes ordinarias (Art. 335 E.T.):
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Rentas de Trabajo (Casilla 32):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[32] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Rentas de Capital (Casilla 58):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[58] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Honorarios y Servicios (Casilla 43):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[43] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Rentas No Laborales (Casilla 74):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[74] ?? 0)}</span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-ink">
              <span>Total Ingresos Brutos:</span>
              <span className="font-mono text-forest">{formatCOP(d.ingresosBrutos)}</span>
            </div>
          </div>
        </Card>

        {/* Paso 2: Ingresos No Constitutivos (Salud, Pensión, Inflación) */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">2</span>
            <h3 className="font-bold text-ink text-sm">Paso 2 · Ingresos No Gravados (Seguridad Social e Inflación)</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Conceptos que por ley no son constitutivos de renta y se restan antes del 40 %:
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Salud y Pensión en Trabajo (Casilla 33):</span>
              <span className="font-mono font-semibold text-ink">-{formatCOP(c.casillas[33] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Beneficio Inflación en Capital (Casilla 59):</span>
              <span className="font-mono font-semibold text-ink">-{formatCOP(c.casillas[59] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Aportes en Honorarios y No Laborales:</span>
              <span className="font-mono font-semibold text-ink">-{formatCOP((c.casillas[44] ?? 0) + (c.casillas[76] ?? 0))}</span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-ink">
              <span>Total No Gravado a Restar:</span>
              <span className="font-mono text-emerald-800">-{formatCOP(d.incrngo)}</span>
            </div>
          </div>
        </Card>

        {/* Paso 3: Subtotal y Límite del 40% */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">3</span>
            <h3 className="font-bold text-ink text-sm">Paso 3 · Base Neta y Límite Conjunto Aplicable</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Se calcula el 40 % de la base neta y se compara con el tope máximo legal de 1.340 UVT:
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Base de cálculo unificada (Subtotal):</span>
              <span className="font-mono font-bold text-ink">{formatCOP(d.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">40 % de la base neta (Art. 336 E.T.):</span>
              <span className="font-mono font-bold text-forest">{formatCOP(d.cuarentaPct)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Tope legal anual (1.340 UVT × ${formatCOP(uvt)}):</span>
              <span className="font-mono font-semibold text-muted">{formatCOP(d.tope1340)}</span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-ink">
              <span>Límite Máximo Aceptado (Menor valor):</span>
              <span className="font-mono text-forest text-sm">{formatCOP(d.poolLimit)}</span>
            </div>
          </div>
        </Card>

        {/* Paso 4: Beneficios Imputados Sujetos al 40% */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">4</span>
            <h3 className="font-bold text-ink text-sm">Paso 4 · Asignación de Beneficios dentro del 40%</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Exenciones y deducciones imputadas a cada subcédula bajo el cupo del 40 %:
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Rentas de Trabajo (Casilla 41 - 25% + Dep. 10%):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[41] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Rentas de Capital (Casilla 69 - 50% GMF):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP(c.casillas[69] ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-muted">Honorarios (Casilla 53) y No Laborales (Casilla 86):</span>
              <span className="font-mono font-semibold text-ink">{formatCOP((c.casillas[53] ?? 0) + (c.casillas[86] ?? 0))}</span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-ink">
              <span>Total Beneficios del 40 % Usados:</span>
              <span className="font-mono text-forest">{formatCOP(d.limitedUsed)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Paso 5: Beneficios Especiales Fuera del 40% y Total Casilla 92 */}
      <Card className="p-6 bg-surface border-line space-y-4">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">5</span>
          <h3 className="font-bold text-ink text-base">Paso 5 · Beneficios Especiales Sin Límite del 40% (Ley 2277 de 2022)</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-line bg-mist/40 p-3.5 space-y-1">
            <span className="font-bold text-ink block">Deducción 72 UVT por dependiente económico (Casilla 139)</span>
            <p className="text-muted text-[11px]">
              Art. 336 num. 2 E.T.: {dec.trabajo.dependientes} dependiente(s) × 72 UVT ({formatCOP(uvt * 72)} c/u). Se resta directamente sin estar sujeta al 40 %.
            </p>
            <span className="font-mono font-bold text-emerald-800 block text-sm pt-1">
              +{formatCOP(d.dependientes72)}
            </span>
          </div>

          <div className="rounded-xl border border-line bg-mist/40 p-3.5 space-y-1">
            <span className="font-bold text-ink block">Deducción 1% compras con Factura Electrónica (Casilla 28)</span>
            <p className="text-muted text-[11px]">
              Art. 336 num. 5 E.T.: 1% de compras pagadas por medios bancarios. Se suma directamente sin estar sujeta al 40 % ni a las 1.340 UVT.
            </p>
            <span className="font-mono font-bold text-emerald-800 block text-sm pt-1">
              +{formatCOP(d.facturaElectronica)}
            </span>
          </div>
        </div>

        {/* Consolidado Final de la Casilla 92 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line rounded-xl bg-forest-mist/30 p-4">
          <div>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">Total Liquidado en Formulario 210</span>
            <p className="font-bold text-ink text-base">Total Rentas Exentas y Deducciones Imputables (Casilla 92)</p>
            <p className="text-xs text-muted">
              Fórmula: Beneficios del 40 % ({formatCOP(d.limitedUsed)}) + Dependientes 72 UVT ({formatCOP(d.dependientes72)}) + Factura Electrónica ({formatCOP(d.facturaElectronica)})
            </p>
          </div>
          <p className="font-mono text-2xl font-bold text-forest-deep">{formatCOP(d.total92)}</p>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular-nums">{formatCOP(v)}</dd>
    </div>
  );
}
