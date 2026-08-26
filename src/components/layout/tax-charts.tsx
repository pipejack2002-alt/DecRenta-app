import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/tax/format";
import type { ComputedDeclaration, Declaration } from "@/lib/tax/types";
import { ART_241 } from "@/lib/tax/tarifas";
import { uvtFromPesos } from "@/lib/tax/uvt";

const PALETTE = [
  "#1F4F47", // Forest principal
  "#2D5A45", // Verde oliva
  "#8A6232", // Ocre / ámbar
  "#8B3A32", // Ladrillo / Stamp
  "#4A6B63", // Forest claro
  "#735738", // Tostado
  "#3A433D", // Ink soft
];

export function TaxCharts({
  computed: c,
  declaration: d,
}: {
  computed: ComputedDeclaration;
  declaration: Declaration;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const cas = c.casillas;

  // 1. Datos para el desglose / cascada fiscal
  const ingresosBrutosTotal =
    (cas[32] ?? 0) +
    (cas[43] ?? 0) +
    (cas[58] ?? 0) +
    (cas[74] ?? 0) +
    (cas[99] ?? 0) +
    (cas[104] ?? 0) +
    (cas[107] ?? 0) +
    (cas[108] ?? 0) +
    (cas[109] ?? 0) +
    (cas[112] ?? 0);

  const totalIncrngo =
    (cas[33] ?? 0) +
    (cas[44] ?? 0) +
    (cas[59] ?? 0) +
    (cas[76] ?? 0) +
    (cas[100] ?? 0) +
    (cas[105] ?? 0);

  const totalCostos =
    (cas[45] ?? 0) + (cas[60] ?? 0) + (cas[77] ?? 0) + (cas[113] ?? 0);

  const totalExentasDeducciones =
    (cas[92] ?? 0) + (cas[102] ?? 0) + (cas[110] ?? 0) + (cas[114] ?? 0);

  const rentaGravable = c.rentaLiquidaGravable;
  const impuestoCargo = c.impuestoCargo;
  const retencionesAnticipos =
    (cas[130] ?? 0) + (cas[131] ?? 0) + (cas[132] ?? 0);
  const saldoFinal = c.saldoPagar > 0 ? c.saldoPagar : -c.saldoFavor;

  const flowData = [
    { name: "Ingresos Brutos", valor: ingresosBrutosTotal, fill: "#1F4F47" },
    { name: "(−) Salud/Pensión", valor: totalIncrngo, fill: "#6B6358" },
    { name: "(−) Costos", valor: totalCostos, fill: "#8A6232" },
    { name: "(−) Exentas/Ded.", valor: totalExentasDeducciones, fill: "#4A6B63" },
    { name: "Base Gravable", valor: rentaGravable, fill: "#2D5A45" },
    { name: "Impuesto Cargo", valor: impuestoCargo, fill: "#8B3A32" },
    { name: "(−) Retenciones", valor: retencionesAnticipos, fill: "#735738" },
  ].filter((item) => item.valor > 0 || item.name === "Base Gravable" || item.name === "Impuesto Cargo");

  // 2. Datos para la composición cedular
  const cedulaData = [
    { name: "Trabajo", valor: cas[32] ?? 0 },
    { name: "Honorarios", valor: cas[43] ?? 0 },
    { name: "Capital", valor: cas[58] ?? 0 },
    { name: "No Laborales", valor: cas[74] ?? 0 },
    { name: "Pensiones", valor: cas[99] ?? 0 },
    {
      name: "Dividendos",
      valor:
        (cas[104] ?? 0) +
        (cas[107] ?? 0) +
        (cas[108] ?? 0) +
        (cas[109] ?? 0),
    },
    { name: "Ganancia Ocasional", valor: cas[112] ?? 0 },
  ].filter((item) => item.valor > 0);

  // 3. Tasas efectivas y marginales
  const tasaEfectivaReal =
    ingresosBrutosTotal > 0
      ? Math.min(100, (impuestoCargo / ingresosBrutosTotal) * 100)
      : 0;

  const tasaRetencionSufrida =
    ingresosBrutosTotal > 0
      ? Math.min(100, (retencionesAnticipos / ingresosBrutosTotal) * 100)
      : 0;

  const rentaUvt = uvtFromPesos(c.rentaLiquidaGravable, c.year, d.uvtOverrides);
  const marginalBracket =
    ART_241.find((b) => rentaUvt >= b.from && (b.to == null || rentaUvt <= b.to)) ??
    ART_241[0];
  const tasaMarginalNominal = Math.round(marginalBracket.rate * 100);

  if (!mounted) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface p-6" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjeta de Tasas Efectivas */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Diagnóstico y Tasa Efectiva de Tributación</CardTitle>
            <CardHint>
              Relación entre el impuesto total liquidado y los ingresos brutos del contribuyente (Art. 241 E.T.).
            </CardHint>
          </div>
          <Badge tone={tasaEfectivaReal > 20 ? "warn" : "ok"}>
            Tasa efectiva: {tasaEfectivaReal.toFixed(1)} %
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-bg-raised p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Tasa Efectiva Real</p>
            <p className="mt-1 font-display text-3xl font-bold text-forest">
              {tasaEfectivaReal.toFixed(2)} %
            </p>
            <p className="mt-1 text-xs text-muted">
              Por cada $100 de ingreso bruto, paga {formatCOP((tasaEfectivaReal / 100) * 100)} en impuesto.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-bg-raised p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Tasa Marginal Máxima</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink">
              {tasaMarginalNominal} %
            </p>
            <p className="mt-1 text-xs text-muted">
              Tramo del Art. 241 alcanzado ({marginalBracket.from} a {marginalBracket.to ?? "en adelante"} UVT).
            </p>
          </div>

          <div className="rounded-xl border border-line bg-bg-raised p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Retenciones en la Fuente Aplicadas</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink">
              {tasaRetencionSufrida.toFixed(2)} %
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatCOP(retencionesAnticipos)} anticipados / retenidos a favor en el año.
            </p>
          </div>
        </div>

        {/* Barra de progreso comparativa */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-muted">
            <span>Tasa efectiva real ({tasaEfectivaReal.toFixed(1)} %)</span>
            <span>Tasa marginal ({tasaMarginalNominal} %)</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-raised">
            <div
              className="h-full rounded-full bg-forest transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, (tasaEfectivaReal / Math.max(tasaMarginalNominal, 1)) * 100))}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Gráficos en dos columnas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Flujo y Depuración Fiscal */}
        <Card className="space-y-4">
          <div>
            <CardTitle className="text-base">Flujo de Depuración Fiscal</CardTitle>
            <CardHint>De los ingresos brutos a la base gravable y el impuesto a cargo.</CardHint>
          </div>
          <div className="h-72 w-full pt-2">
            {flowData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6B6358" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6B6358" }}
                    tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCOP(Number(val) || 0), "Valor"]}
                    contentStyle={{
                      backgroundColor: "#FFFCF7",
                      borderColor: "#D9D0C4",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {flowData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                Diligencie ingresos en la declaración para visualizar el flujo.
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico 2: Composición por Cédula */}
        <Card className="space-y-4">
          <div>
            <CardTitle className="text-base">Composición de Ingresos por Cédula</CardTitle>
            <CardHint>Distribución de las fuentes de ingreso del contribuyente.</CardHint>
          </div>
          <div className="h-72 w-full pt-2">
            {cedulaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cedulaData}
                    dataKey="valor"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {cedulaData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [formatCOP(Number(val) || 0), "Ingreso"]}
                    contentStyle={{
                      backgroundColor: "#FFFCF7",
                      borderColor: "#D9D0C4",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                No hay ingresos registrados para mostrar el gráfico de composición.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
