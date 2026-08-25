import { useState } from "react";
import { Scale, CheckCircle, AlertTriangle, XCircle, Info, ChevronRight, Calculator } from "lucide-react";
import { useAppStore, useComputed } from "@/lib/store";
import { calcularComparacionPatrimonial } from "@/lib/tax/comparacion-patrimonial";
import { Card, CardTitle, CardHint } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyField } from "@/components/layout/money-field";
import { formatCOP } from "@/lib/tax/format";

export function ComparacionPatrimonialCard() {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();

  const [modalOpen, setModalOpen] = useState(false);

  const comp = calcularComparacionPatrimonial(d, c);

  return (
    <>
      <Card className="relative overflow-hidden border-line">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-9 items-center justify-center rounded-lg ${
              comp.semaforo === "justificado"
                ? "bg-emerald-100 text-emerald-800"
                : comp.semaforo === "limite"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}>
              <Scale className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Conciliación Patrimonial</CardTitle>
                <SemaforoBadge semaforo={comp.semaforo} />
              </div>
              <CardHint className="text-xs">Arts. 236 a 239 del Estatuto Tributario</CardHint>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Calculator className="size-3.5 text-forest" /> Detalle de Justificación
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-line pt-3 text-xs">
          <div>
            <span className="text-muted block text-[11px]">Patrimonio Líquido 2024</span>
            <span className="font-semibold text-ink">{formatCOP(comp.patrimonioLiquidoAnterior)}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Patrimonio Líquido 2025</span>
            <span className="font-semibold text-ink">{formatCOP(comp.patrimonioLiquidoActual)}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Incremento Patrimonial</span>
            <span className="font-semibold text-ink">{formatCOP(comp.incrementoPatrimonial)}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Capacidad Justificada</span>
            <span className="font-semibold text-emerald-700">{formatCOP(comp.totalRentasJustificativas + comp.totalAjustesPatrimoniales)}</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted bg-bg/60 p-2.5 rounded-lg border border-line">
          {comp.explicacion}
        </p>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
                  <Scale className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Módulo de Renta por Comparación Patrimonial
                  </h3>
                  <p className="text-xs text-muted">Auditoría preventiva de incremento patrimonial no justificado (Art. 236 a 239 E.T.)</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-forest"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Resumen Semáforo */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                comp.semaforo === "justificado"
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : comp.semaforo === "limite"
                  ? "bg-amber-50/70 border-amber-200 text-amber-900"
                  : "bg-red-50/70 border-red-200 text-red-900"
              }`}>
                {comp.semaforo === "justificado" && <CheckCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />}
                {comp.semaforo === "limite" && <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />}
                {comp.semaforo === "descuadre" && <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />}
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {comp.semaforo === "justificado" && "Patrimonio 100 % Justificado y Cuadrado"}
                    {comp.semaforo === "limite" && "Atención: Verifique las cifras del año anterior"}
                    {comp.semaforo === "descuadre" && "Riesgo Fiscal: Descuadre Patrimonial Detectado"}
                  </h4>
                  <p className="leading-relaxed">{comp.explicacion}</p>
                </div>
              </div>

              {/* Parámetros Editables */}
              <div className="rounded-lg border border-line bg-bg/40 p-4 space-y-4">
                <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px]">
                  Cifras de Conciliación y Ajustes (Año Gravable 2024 - 2025)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MoneyField
                    label="Patrimonio Líquido Año Anterior (2024)"
                    hint="Casilla 31 de la declaración de renta del año 2024."
                    value={d.patrimonio.patrimonioLiquidoAnterior}
                    onChange={(v) => patch((draft) => { draft.patrimonio.patrimonioLiquidoAnterior = v; })}
                  />
                  <MoneyField
                    label="Consumos y Gastos Personales Estimados"
                    hint="Gastos de manutención, viajes o compras que no quedaron en activos."
                    value={d.patrimonio.consumosEstimadosAnio || 0}
                    onChange={(v) => patch((draft) => { draft.patrimonio.consumosEstimadosAnio = v; })}
                  />
                  <MoneyField
                    label="(+) Valorizaciones Justificadas de Activos (Art. 238)"
                    hint="Reajustes fiscales del art. 70 o avalúos catastrales legales."
                    value={d.patrimonio.valorizacionesJustificadas || 0}
                    onChange={(v) => patch((draft) => { draft.patrimonio.valorizacionesJustificadas = v; })}
                  />
                  <MoneyField
                    label="(+) Herencias, Legados o Donaciones Recibidas"
                    hint="Bienes recibidos en el año que incrementaron el patrimonio."
                    value={d.patrimonio.herenciasLegadosDonaciones || 0}
                    onChange={(v) => patch((draft) => { draft.patrimonio.herenciasLegadosDonaciones = v; })}
                  />
                </div>
              </div>

              {/* Tabla de Conciliación Matemática */}
              <div className="rounded-lg border border-line overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-bg text-muted uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Concepto de Justificación</th>
                      <th className="p-3 text-right">Monto ($ COP)</th>
                      <th className="p-3">Soporte Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr className="bg-surface">
                      <td className="p-3 font-medium text-ink">1. Incremento Patrimonial del Año (2025 vs. 2024)</td>
                      <td className="p-3 text-right font-bold text-ink">{formatCOP(comp.incrementoPatrimonial)}</td>
                      <td className="p-3 text-muted text-[11px]">Art. 236 E.T.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(+) Renta Líquida Gravable (Cédula General)</td>
                      <td className="p-3 text-right text-emerald-700">{formatCOP(comp.rentaLiquidaGravable)}</td>
                      <td className="p-3 text-muted text-[11px]">Casilla 97</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(+) Rentas Exentas Cedulares</td>
                      <td className="p-3 text-right text-emerald-700">{formatCOP(comp.rentasExentas)}</td>
                      <td className="p-3 text-muted text-[11px]">Arts. 206 y 206-1 E.T.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(+) Ingresos No Constitutivos de Renta (INCRNGO)</td>
                      <td className="p-3 text-right text-emerald-700">{formatCOP(comp.incrngo)}</td>
                      <td className="p-3 text-muted text-[11px]">Arts. 36 a 57-1 E.T.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(+) Ganancia Ocasional Neta</td>
                      <td className="p-3 text-right text-emerald-700">{formatCOP(comp.gananciaOcasionalNeta)}</td>
                      <td className="p-3 text-muted text-[11px]">Casilla 114</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(+) Ajustes Justificativos (Valorizaciones / Herencias)</td>
                      <td className="p-3 text-right text-emerald-700">{formatCOP(comp.totalAjustesPatrimoniales)}</td>
                      <td className="p-3 text-muted text-[11px]">Art. 238 E.T.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(−) Impuesto de Renta y Ganancia Ocasional</td>
                      <td className="p-3 text-right text-red-600 font-medium">− {formatCOP(comp.impuestoRentaPagado + comp.impuestoGananciaOcasional)}</td>
                      <td className="p-3 text-muted text-[11px]">Casillas 126 y 127</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ink pl-6">(−) Consumos Estimados del Año</td>
                      <td className="p-3 text-right text-red-600 font-medium">− {formatCOP(comp.consumosEstimados)}</td>
                      <td className="p-3 text-muted text-[11px]">Sostenimiento</td>
                    </tr>
                    <tr className="bg-bg font-bold">
                      <td className="p-3 text-ink">Total Capacidad de Ahorro / Incremento Justificado</td>
                      <td className="p-3 text-right text-emerald-800">{formatCOP(comp.totalRentasJustificativas + comp.totalAjustesPatrimoniales)}</td>
                      <td className="p-3 text-muted text-[11px]">Suma de Rentas</td>
                    </tr>
                    <tr className={comp.diferenciaPatrimonial > 0 ? "bg-red-50 font-bold text-red-900" : "bg-emerald-50 font-bold text-emerald-900"}>
                      <td className="p-3">Diferencia / Renta por Comparación Patrimonial</td>
                      <td className="p-3 text-right">{formatCOP(comp.diferenciaPatrimonial)}</td>
                      <td className="p-3 text-[11px]">{comp.diferenciaPatrimonial > 0 ? "Art. 237 E.T. (Gravable)" : "100 % Amparado"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-line px-6 py-4">
              <Button size="sm" onClick={() => setModalOpen(false)}>
                Aceptar y Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SemaforoBadge({ semaforo }: { semaforo: "justificado" | "limite" | "descuadre" }) {
  switch (semaforo) {
    case "justificado":
      return <Badge tone="ok">🟢 Justificado</Badge>;
    case "limite":
      return <Badge tone="warn">🟡 Límite / Revisar</Badge>;
    case "descuadre":
      return <Badge tone="stamp">🔴 Descuadre Patrimonial</Badge>;
  }
}
