import { Check, CheckSquare, FileText, Plus, Sparkles, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import type { VaultDoc } from "@/lib/docs/types";

const FIELD_LABELS: Record<string, { label: string; casilla?: number; source?: string }> = {
  "trabajo.salarios": { label: "Salarios, emolumentos y honorarios laborales", casilla: 32, source: "Art. 103 E.T." },
  "trabajo.otrasPrestaciones": { label: "Otras prestaciones y primas", casilla: 32, source: "Art. 103 E.T." },
  "trabajo.cesantiasPagadas": { label: "Cesantías pagadas directamente al empleado", casilla: 32, source: "Art. 206 num. 4" },
  "trabajo.cesantiasFondo": { label: "Cesantías consignadas al fondo", casilla: 32, source: "Art. 206 num. 4" },
  "trabajo.promedioMensual6m": { label: "Ingreso laboral promedio últimos 6 meses (para exención cesantías)", casilla: 59, source: "Art. 206 num. 4 E.T." },
  "trabajo.aportesSaludObligatorios": { label: "Aportes obligatorios a salud", casilla: 33, source: "Art. 56 E.T." },
  "trabajo.aportesPensionObligatorios": { label: "Aportes obligatorios a pensión", casilla: 33, source: "Art. 55 E.T." },
  "trabajo.aportesVoluntariosRais": { label: "Aportes voluntarios RAIS", casilla: 33, source: "Art. 55 E.T." },
  "trabajo.aportesAfcFvpAvc": { label: "Aportes AFC / FVP / AVC (Rentas Exentas)", casilla: 35, source: "Art. 126-1 / 126-4" },
  "trabajo.interesesVivienda": { label: "Intereses crédito de vivienda / leasing", casilla: 38, source: "Art. 119 E.T." },
  "trabajo.gmf": { label: "Gravamen a los Movimientos Financieros (4×1.000)", casilla: 38, source: "Art. 115 E.T." },
  "trabajo.medicinaPrepagada": { label: "Medicina prepagada y seguros de salud", casilla: 38, source: "Art. 387 E.T." },
  "extra.retenciones": { label: "Retenciones en la fuente practicadas", casilla: 132, source: "Art. 378 y 381 E.T." },
  "patrimonio.cuentas": { label: "Saldo de cuentas bancarias y CDTs al 31/12", casilla: 29, source: "Art. 268 E.T." },
  "patrimonio.inmuebles": { label: "Avalúo fiscal de bienes inmuebles", casilla: 29, source: "Art. 277 E.T." },
  "patrimonio.obligacionesFinancieras": { label: "Deudas y créditos financieros", casilla: 30, source: "Art. 283 E.T." },
  "capital.intereses": { label: "Rendimientos financieros e intereses", casilla: 58, source: "Art. 338 E.T." },
  "capital.arrendamientos": { label: "Arrendamientos y cánones", casilla: 58, source: "Art. 338 E.T." },
  "honorarios.ingresos": { label: "Ingresos brutos por honorarios y servicios", casilla: 43, source: "Art. 335 E.T." },
  "noLaborales.ingresos": { label: "Ingresos brutos rentas no laborales", casilla: 74, source: "Art. 335 E.T." },
  "pensiones.ingresos": { label: "Ingresos brutos por pensiones", casilla: 99, source: "Art. 206 num. 8" },
};

function getDeclarationCurrentValue(d: any, path: string): number {
  const parts = path.split(".");
  let cur = d;
  for (const p of parts) {
    if (!cur) return 0;
    cur = cur[p];
  }
  return typeof cur === "number" ? cur : 0;
}

export function ExtractionPreviewModal({
  doc,
  amounts: initialAmounts,
  notes,
  onClose,
}: {
  doc: VaultDoc;
  amounts: Record<string, number>;
  notes?: string;
  onClose: () => void;
}) {
  const d = useAppStore((s) => s.declaration);
  const applyAmounts = useAppStore((s) => s.applyAmounts);
  const updateDoc = useAppStore((s) => s.updateDoc);

  const [amountsState, setAmountsState] = useState<Record<string, number>>(() => ({ ...initialAmounts }));
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState<string>("trabajo.salarios");

  const keys = Object.keys(amountsState);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const k of keys) init[k] = true;
    return init;
  });
  const [mode, setMode] = useState<"replace" | "sum">("replace");
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  function toggleAll() {
    const allSelected = keys.every((k) => selected[k]);
    const next: Record<string, boolean> = {};
    for (const k of keys) next[k] = !allSelected;
    setSelected(next);
  }

  function handleAddField() {
    if (!selectedFieldToAdd) return;
    setAmountsState((prev) => ({ ...prev, [selectedFieldToAdd]: prev[selectedFieldToAdd] || 0 }));
    setSelected((prev) => ({ ...prev, [selectedFieldToAdd]: true }));
  }

  function handleAmountChange(key: string, val: number) {
    setAmountsState((prev) => ({ ...prev, [key]: val }));
  }

  function handleRemoveField(key: string) {
    setAmountsState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSelected((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleConfirm() {
    const toApply: Record<string, number> = {};
    for (const k of keys) {
      if (selected[k]) {
        const newVal = amountsState[k] ?? 0;
        if (mode === "sum") {
          const currentVal = getDeclarationCurrentValue(d, k);
          toApply[k] = currentVal + newVal;
        } else {
          toApply[k] = newVal;
        }
      }
    }

    applyAmounts(toApply);
    updateDoc(doc.id, {
      applied: true,
      extracted: amountsState,
      notes: notes || doc.notes,
    });
    setAppliedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  }

  const selectedCount = keys.filter((k) => selected[k]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-surface shadow-2xl flex flex-col border border-line">
        {/* Encabezado */}
        <div className="border-b border-line bg-bg-raised px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-forest text-primary-fg">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                Validar y Aplicar Cifras del Soporte
              </h2>
              <p className="text-xs text-muted">
                {doc.name} · Revise y confirme los montos antes de aplicarlos a la declaración
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {notes && (
            <div className="rounded-xl border border-line bg-forest-mist/30 p-3.5 text-xs leading-relaxed text-forest-deep">
              <p className="font-semibold uppercase tracking-wider text-[10px] text-forest">
                Resumen del documento analizado:
              </p>
              <p className="mt-1">{notes}</p>
            </div>
          )}

          {/* Opciones de aplicación */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg-raised p-3">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs font-medium text-forest hover:underline"
            >
              {keys.length > 0 && keys.every((k) => selected[k]) ? (
                <>
                  <CheckSquare className="size-4" />
                  Deseleccionar todos
                </>
              ) : (
                <>
                  <Square className="size-4" />
                  Seleccionar todos ({keys.length})
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Modo de aplicación:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "replace" | "sum")}
                className="h-8 rounded-md border border-line bg-surface px-2 font-medium text-ink focus:border-forest focus:outline-none"
              >
                <option value="replace">Sustituir valor actual</option>
                <option value="sum">Sumar al valor existente</option>
              </select>
            </div>
          </div>

          {/* Tabla de montos */}
          {keys.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-muted text-xs space-y-3">
              <p>No se detectaron montos automáticos. Puede agregar los conceptos del soporte a continuación:</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg-raised text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-10 px-3 py-2 text-center">Sel.</th>
                    <th className="px-3 py-2">Concepto / Norma</th>
                    <th className="px-3 py-2 text-right">Valor Actual</th>
                    <th className="px-3 py-2 text-right">Monto del Soporte</th>
                    <th className="w-8 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {keys.map((k) => {
                    const info = FIELD_LABELS[k] ?? { label: k };
                    const extractedVal = amountsState[k] ?? 0;
                    const currentVal = getDeclarationCurrentValue(d, k);
                    const isChecked = Boolean(selected[k]);

                    return (
                      <tr
                        key={k}
                        className={`transition-colors ${
                          isChecked ? "bg-forest-mist/15" : "hover:bg-bg-raised"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setSelected((prev) => ({ ...prev, [k]: !prev[k] }))}
                            className="size-4 rounded border-line text-forest focus:ring-forest cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-ink">
                            {info.casilla ? (
                              <span className="mr-1.5 font-mono text-[10px] text-faint">
                                [C{info.casilla}]
                              </span>
                            ) : null}
                            {info.label}
                          </div>
                          {info.source ? (
                            <span className="text-[10px] text-muted">{info.source}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted">
                          {formatCOP(currentVal)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            value={extractedVal || ""}
                            onChange={(e) => handleAmountChange(k, Number(e.target.value) || 0)}
                            className="w-32 rounded-md border border-line bg-surface px-2.5 py-1 text-right font-mono font-semibold tabular-nums text-forest-deep focus:border-forest focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveField(k)}
                            className="text-muted hover:text-stamp p-1"
                            title="Quitar concepto"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Agregar concepto adicional manualmente */}
          <div className="flex items-center gap-2 pt-2">
            <select
              value={selectedFieldToAdd}
              onChange={(e) => setSelectedFieldToAdd(e.target.value)}
              className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-xs text-ink focus:border-forest focus:outline-none"
            >
              {Object.entries(FIELD_LABELS).map(([k, info]) => (
                <option key={k} value={k}>
                  {info.casilla ? `[C${info.casilla}] ` : ""}
                  {info.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={handleAddField} className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Añadir al Soporte
            </Button>
          </div>
        </div>

        {/* Pie de acción */}
        <div className="border-t border-line bg-bg-raised px-5 py-3.5 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selectedCount === 0 || appliedSuccess}
            className="gap-1.5 bg-forest hover:bg-forest-deep text-white"
          >
            {appliedSuccess ? (
              <>
                <Check className="size-4" />
                ¡Aplicado a la Declaración!
              </>
            ) : (
              <>
                <Check className="size-4" />
                Aplicar {selectedCount} {selectedCount === 1 ? "monto" : "montos"} a la Declaración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
