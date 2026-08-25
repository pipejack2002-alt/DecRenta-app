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
  { id: "incr", label: "INCRNGO" },
  { id: "exenta", label: "Rentas exentas" },
  { id: "deduccion", label: "Deducciones" },
  { id: "depuracion", label: "40 % / 1.340 UVT" },
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
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Determinación cedular · DIAN Renta {y}</p>
        <h1 className="mt-1 font-display text-4xl">Qué cabe en cada cédula</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Matriz oficial de ingresos no constitutivos, rentas exentas y deducciones. Pulse una fila para ver por qué un beneficio aplica o no. Topes en UVT {y} = {formatCOP(c.uvt)}.
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
            <Row k="INCRNGO (casilla 100)" v={c.casillas[100] ?? 0} />
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
  const lines: { k: string; v: number; note?: string; accent?: boolean }[] = [
    { k: "Total ingresos brutos cédula general", v: d.ingresosBrutos },
    { k: "(−) Total ingresos no constitutivos de renta", v: d.incrngo },
    { k: "= Subtotal", v: d.subtotal, accent: true },
    {
      k: `× 40 %, máx. 1.340 UVT (${formatCOP(d.tope1340)})`,
      v: d.poolLimit,
      note: `40 % = ${formatCOP(d.cuarentaPct)}. Se toma el menor.`,
      accent: true,
    },
    { k: "+ Rentas exentas no sometidas a limitante", v: d.ilimitadas, note: "Nums. 1-3 y 6-8 art. 206, primas, CAN." },
    { k: "+ Deducción 72 UVT por dependiente (casilla 139)", v: d.dependientes72 },
    { k: "+ Deducción del 1 % de factura electrónica (casilla 28)", v: d.facturaElectronica, note: "Sin la limitante del 40 % ni 1.340 UVT." },
    { k: "= Rentas exentas y deducciones imputables (casilla 92)", v: d.total92, accent: true },
  ];
  return (
    <Card>
      <CardTitle>Determinación de las rentas exentas y deducciones limitadas</CardTitle>
      <CardHint>
        Art. 336 num. 3 y art. 1.2.1.20.4 DUR. Las 72 UVT por dependiente y el 1 % de factura electrónica se suman después del 40 %.
      </CardHint>
      <dl className="mt-4 divide-y divide-line">
        {lines.map((l) => (
          <div key={l.k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className={cn("max-w-[70%]", l.accent ? "font-medium" : "text-ink-soft")}>
              {l.k}
              {l.note ? <span className="mt-0.5 block text-[11px] font-normal text-muted">{l.note}</span> : null}
            </dt>
            <dd className="tabular-nums">{formatCOP(l.v)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">
        Cupo del 40 % usado: {formatCOP(d.limitedUsed)} de {formatCOP(d.poolLimit)} ({formatUvt(d.tope1340 ? (d.limitedUsed / (c.uvt || 1)) : 0)}).
      </p>
    </Card>
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
