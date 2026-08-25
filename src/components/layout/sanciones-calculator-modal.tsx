import { useState } from "react";
import { AlertCircle, Calendar, ShieldAlert, CheckCircle2, Percent, Calculator } from "lucide-react";
import { useAppStore, useComputed } from "@/lib/store";
import { calcularSancionExtemporaneidad } from "@/lib/tax/auditoria-sanciones";
import { deadlineForNit, isZonaSismo1226 } from "@/lib/tax/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCOP } from "@/lib/tax/format";

export function SancionesCalculatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();

  const zona = isZonaSismo1226(d.identity.dirSeccional, d.identity.zonaSismo1226);
  const dl = deadlineForNit(d.identity.nit, { zonaSismo1226: zona, seccional: d.identity.dirSeccional });
  const fechaVencDefecto = dl ? dl.iso : "2026-10-15";

  const [fechaVenc, setFechaVenc] = useState(fechaVencDefecto);
  const [fechaPres, setFechaPres] = useState(new Date().toISOString().slice(0, 10));
  const [aplica640, setAplica640] = useState(true);
  const [pct640, setPct640] = useState<50 | 75>(50);
  const [tasaUsura, setTasaUsura] = useState(28.5);

  const res = calcularSancionExtemporaneidad({
    fechaVencimiento: fechaVenc,
    fechaPresentacion: fechaPres,
    impuestoCargo: c.impuestoCargo,
    ingresosBrutos: c.casillas[32] || 0,
    patrimonioBruto: c.casillas[29] || 0,
    aplicaReduccion640: aplica640,
    porcentajeReduccion: pct640,
    tasaEaMora: tasaUsura,
    yearPresentacion: c.filingYear,
    uvtOverrides: d.uvtOverrides,
  });

  function handleApplySancion() {
    patch((draft) => {
      draft.extra.sanciones = res.sancionFinal;
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
              <Calculator className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Calculadora de Sanciones e Intereses Moratorios
              </h3>
              <p className="text-xs text-muted">Estatuto Tributario - Arts. 641, 642, 640 (Reducción) y 634 (Intereses)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-forest">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Fechas de Liquidación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-line bg-bg/50 p-4">
            <div>
              <Label className="text-xs">Fecha Oficial de Vencimiento DIAN</Label>
              <Input
                type="date"
                value={fechaVenc}
                onChange={(e) => setFechaVenc(e.target.value)}
                className="mt-1 text-xs"
              />
              <span className="text-[11px] text-muted mt-0.5 block">Según los 2 últimos dígitos del NIT</span>
            </div>
            <div>
              <Label className="text-xs">Fecha de Presentación y Pago Efectivo</Label>
              <Input
                type="date"
                value={fechaPres}
                onChange={(e) => setFechaPres(e.target.value)}
                className="mt-1 text-xs"
              />
              <span className="text-[11px] text-muted mt-0.5 block">Día en que se radica y paga el Formulario 210</span>
            </div>
          </div>

          {/* Opciones del Art. 640 */}
          <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="check640"
                checked={aplica640}
                onChange={(e) => setAplica640(e.target.checked)}
                className="mt-0.5 rounded border-line text-forest focus:ring-forest"
              />
              <label htmlFor="check640" className="text-xs leading-relaxed text-ink font-medium cursor-pointer">
                Aplicar Principio de Lesividad / Gradualidad (Art. 640 del Estatuto Tributario)
                <span className="block text-[11px] font-normal text-muted">
                  Permite reducir la sanción en un 50 % si no ha cometido la misma infracción en los últimos 2 años (o 75 % si no la ha cometido en 1 año y no hay pliego).
                </span>
              </label>
            </div>

            {aplica640 && (
              <div className="flex items-center gap-4 pl-6 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pct640"
                    checked={pct640 === 50}
                    onChange={() => setPct640(50)}
                  />
                  <span>Reducción al 50 % (Sin sanción previa en 2 años)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pct640"
                    checked={pct640 === 75}
                    onChange={() => setPct640(75)}
                  />
                  <span>Reducción al 75 % (Sin sanción previa en 1 año)</span>
                </label>
              </div>
            )}
          </div>

          {/* Desglose de Resultados */}
          <div className="rounded-xl border border-line bg-bg/40 p-4 space-y-3">
            <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-forest" /> Liquidación Oficial de la Sanción
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-line py-3 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Días de Mora</span>
                <span className="font-bold text-ink">{res.diasMora} días</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Meses / Fracción</span>
                <span className="font-bold text-ink">{res.mesesExtemporaneidad} mes(es)</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Sanción Plena</span>
                <span className="font-bold text-ink">{formatCOP(res.sancionPlena)}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Sanción Mínima</span>
                <span className="font-bold text-muted">{formatCOP(res.sancionMinima10Uvt)}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span>Sanción por Extemporaneidad Final (Casilla 135):</span>
                <span className="font-bold text-ink text-sm">{formatCOP(res.sancionFinal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Intereses Moratorios estimados (Art. 634 E.T. al {tasaUsura} % E.A.):</span>
                <span className="font-semibold text-amber-800">{formatCOP(res.interesesMoratorios)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-line pt-2 font-bold text-sm text-forest">
                <span>Total a Pagar (Sanción + Intereses de Mora):</span>
                <span>{formatCOP(res.totalPagarSancionEIntereses)}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed mt-2">{res.explicacion}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleApplySancion} className="bg-forest text-primary-fg">
            Aplicar Sanción a Casilla 135 ({formatCOP(res.sancionFinal)})
          </Button>
        </div>
      </div>
    </div>
  );
}
