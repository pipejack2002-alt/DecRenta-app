import { Check, CheckSquare, Square, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { cn } from "@/lib/utils";
import type { VaultDoc } from "@/lib/docs/types";

// ─── Catálogo completo de campos ───────────────────────────────────────────
const FIELD_LABELS: Record<string, { label: string; casilla?: number; source?: string }> = {
  "trabajo.salarios": { label: "Salarios, emolumentos y honorarios laborales", casilla: 32, source: "Art. 103 E.T." },
  "trabajo.otrasPrestaciones": { label: "Otras prestaciones y primas", casilla: 32, source: "Art. 103 E.T." },
  "trabajo.cesantiasPagadas": { label: "Cesantías pagadas directamente al empleado", casilla: 32, source: "Art. 206 num. 4" },
  "trabajo.cesantiasFondo": { label: "Cesantías consignadas al fondo", casilla: 32, source: "Art. 206 num. 4" },
  "trabajo.promedioMensual6m": { label: "Ingreso laboral promedio últimos 6 meses (C59 – cesantías)", casilla: 59, source: "Art. 206 num. 4 E.T." },
  "trabajo.aportesSaludObligatorios": { label: "Aportes obligatorios a salud (Colpensiones / EPS)", casilla: 33, source: "Art. 56 E.T." },
  "trabajo.aportesPensionObligatorios": { label: "Aportes obligatorios a pensión", casilla: 33, source: "Art. 55 E.T." },
  "trabajo.aportesVoluntariosRais": { label: "Aportes voluntarios RAIS (fondo privado)", casilla: 33, source: "Art. 55 E.T." },
  "trabajo.aportesAfcFvpAvc": { label: "Aportes AFC / FVP / AVC (Rentas Exentas)", casilla: 35, source: "Art. 126-1 / 126-4" },
  "trabajo.interesesVivienda": { label: "Intereses crédito de vivienda / leasing habitacional", casilla: 38, source: "Art. 119 E.T." },
  "trabajo.gmf": { label: "Gravamen a los Movimientos Financieros 4×1.000 (GMF)", casilla: 38, source: "Art. 115 E.T." },
  "trabajo.medicinaPrepagada": { label: "Medicina prepagada y seguros de salud", casilla: 38, source: "Art. 387 E.T." },
  "extra.retenciones": { label: "Retenciones en la fuente practicadas (total anual)", casilla: 132, source: "Art. 378 y 381 E.T." },
  "patrimonio.cuentas": { label: "Saldo cuentas bancarias / CDTs al 31 de diciembre", casilla: 29, source: "Art. 268 E.T." },
  "patrimonio.cesantiasFondos": { label: "Saldo en fondos de cesantías al 31 de diciembre", casilla: 29, source: "Art. 261, 271 E.T." },
  "patrimonio.inmuebles": { label: "Avalúo fiscal de bienes inmuebles", casilla: 29, source: "Art. 277 E.T." },
  "patrimonio.obligacionesFinancieras": { label: "Deudas y obligaciones financieras vigentes", casilla: 30, source: "Art. 283 E.T." },
  "capital.intereses": { label: "Rendimientos financieros e intereses ganados", casilla: 58, source: "Art. 338 E.T." },
  "capital.componenteInflacionario": { label: "Componente inflacionario no gravado (INCRNGO)", casilla: 59, source: "Arts. 38 y 40-1 E.T." },
  "capital.arrendamientos": { label: "Arrendamientos y cánones recibidos", casilla: 58, source: "Art. 338 E.T." },
  "honorarios.ingresos": { label: "Ingresos brutos por honorarios y servicios (independiente)", casilla: 43, source: "Art. 335 E.T." },
  "noLaborales.ingresos": { label: "Ingresos brutos rentas no laborales", casilla: 74, source: "Art. 335 E.T." },
  "pensiones.ingresos": { label: "Ingresos brutos por pensiones de jubilación", casilla: 99, source: "Art. 206 num. 8" },
};

// ─── Agrupación por cédula ──────────────────────────────────────────────────
const GROUPS: { label: string; icon: string; keys: (keyof typeof FIELD_LABELS)[] }[] = [
  {
    label: "Rentas de Trabajo",
    icon: "💼",
    keys: [
      "trabajo.salarios", "trabajo.otrasPrestaciones", "trabajo.cesantiasPagadas",
      "trabajo.cesantiasFondo", "trabajo.promedioMensual6m",
      "trabajo.aportesSaludObligatorios", "trabajo.aportesPensionObligatorios",
      "trabajo.aportesVoluntariosRais", "trabajo.aportesAfcFvpAvc",
      "trabajo.interesesVivienda", "trabajo.gmf", "trabajo.medicinaPrepagada",
    ],
  },
  {
    label: "Retenciones en la Fuente",
    icon: "📋",
    keys: ["extra.retenciones"],
  },
  {
    label: "Patrimonio — Saldos Bancarios, Cesantías y Bienes al 31/12",
    icon: "🏦",
    keys: ["patrimonio.cuentas", "patrimonio.cesantiasFondos", "patrimonio.inmuebles", "patrimonio.obligacionesFinancieras"],
  },
  {
    label: "Rentas de Capital",
    icon: "📈",
    keys: ["capital.intereses", "capital.componenteInflacionario", "capital.arrendamientos"],
  },
  {
    label: "Otras Cédulas",
    icon: "📂",
    keys: ["honorarios.ingresos", "noLaborales.ingresos", "pensiones.ingresos"],
  },
];

const ALL_KEYS = GROUPS.flatMap((g) => g.keys);

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

  // All fields pre-loaded; detected ones pre-filled, others at 0
  const [amountsState, setAmountsState] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const k of ALL_KEYS) init[k] = initialAmounts[k] ?? 0;
    return init;
  });

  // Only pre-check fields with a detected value > 0
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const k of ALL_KEYS) init[k] = (initialAmounts[k] ?? 0) > 0;
    return init;
  });

  const [mode, setMode] = useState<"replace" | "sum">("replace");
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const detectedCount = ALL_KEYS.filter((k) => (initialAmounts[k] ?? 0) > 0).length;
  const selectedCount = ALL_KEYS.filter((k) => selected[k]).length;

  function toggleAll() {
    const allDetectedSelected = ALL_KEYS.every((k) =>
      (initialAmounts[k] ?? 0) > 0 ? selected[k] : true
    );
    const next: Record<string, boolean> = {};
    if (allDetectedSelected) {
      // Deselect all
      for (const k of ALL_KEYS) next[k] = false;
    } else {
      // Restore only detected
      for (const k of ALL_KEYS) next[k] = (initialAmounts[k] ?? 0) > 0;
    }
    setSelected(next);
  }

  function handleAmountChange(key: string, val: number) {
    setAmountsState((prev) => ({ ...prev, [key]: val }));
    // Auto-select when user types a non-zero value
    if (val > 0) setSelected((prev) => ({ ...prev, [key]: true }));
  }

  function handleConfirm() {
    const toApply: Record<string, number> = {};
    for (const k of ALL_KEYS) {
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
      extracted: Object.fromEntries(
        ALL_KEYS.filter((k) => amountsState[k] > 0).map((k) => [k, amountsState[k]])
      ),
      notes: notes || doc.notes,
    });
    setAppliedSuccess(true);
    setTimeout(() => { onClose(); }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-2xl flex flex-col border border-line">

        {/* Header */}
        <div className="border-b border-line bg-bg-raised px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-forest text-primary-fg">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Validar y Aplicar Cifras del Soporte
              </h2>
              <p className="text-[11px] text-muted">
                {doc.name} · Revise, ajuste y marque los montos a aplicar
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-surface" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">

          {/* Notes banner */}
          {notes && (
            <div className="rounded-xl border border-line bg-forest-mist/30 px-4 py-3 text-xs leading-relaxed text-forest-deep">
              <p className="font-semibold uppercase tracking-wider text-[10px] text-forest mb-1">
                📄 Documento analizado:
              </p>
              <p>{notes}</p>
            </div>
          )}

          {/* Detected summary pill */}
          {detectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 font-medium text-forest">
                <Check className="size-3.5" /> {detectedCount} montos detectados automáticamente
              </span>
              <span className="text-muted">— el resto puede llenarlo manualmente abajo.</span>
            </div>
          )}

          {/* Mode + toggle row */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg-raised px-4 py-2.5">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs font-medium text-forest hover:underline"
            >
              {selectedCount > 0 ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
              {selectedCount > 0 ? `Desmarcar todo (${selectedCount} sel.)` : "Marcar detectados"}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Modo:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "replace" | "sum")}
                className="h-8 rounded-md border border-line bg-surface px-2 font-medium text-ink focus:border-forest focus:outline-none"
              >
                <option value="replace">Sustituir valor actual</option>
                <option value="sum">➕ Sumar al valor existente (varios bancos)</option>
              </select>
            </div>
          </div>

          {mode === "sum" && (
            <p className="text-[11px] text-forest-deep bg-forest-mist/20 rounded-lg px-3 py-2">
              💡 <strong>Modo Sumar:</strong> ideal cuando tiene varios bancos. Suba cada extracto por separado y sus saldos y GMF se acumularán.
            </p>
          )}

          {/* Groups */}
          {GROUPS.map((group) => {
            const isCollapsed = collapsed[group.label];
            const groupDetected = group.keys.filter((k) => (initialAmounts[k] ?? 0) > 0).length;
            const groupSelected = group.keys.filter((k) => selected[k]).length;

            return (
              <div key={group.label} className="overflow-hidden rounded-xl border border-line bg-surface">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [group.label]: !isCollapsed }))}
                  className="flex w-full items-center justify-between gap-3 bg-bg-raised px-4 py-2.5 text-left hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-ink">
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                    {groupDetected > 0 && (
                      <span className="rounded-full bg-forest text-primary-fg px-2 py-0.5 text-[10px] font-bold">
                        {groupDetected} detectado{groupDetected > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span>{groupSelected} marcado{groupSelected !== 1 ? "s" : ""}</span>
                    <span className="text-faint">{isCollapsed ? "▶" : "▼"}</span>
                  </div>
                </button>

                {!isCollapsed && (
                  <table className="w-full text-left text-xs">
                    <thead className="border-y border-line text-[10px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="w-9 px-3 py-1.5 text-center">✓</th>
                        <th className="px-3 py-1.5">Concepto</th>
                        <th className="px-3 py-1.5 text-right whitespace-nowrap">Declaración actual</th>
                        <th className="px-3 py-1.5 text-right whitespace-nowrap">Monto soporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {group.keys.map((k) => {
                        const info = FIELD_LABELS[k]!;
                        const extractedVal = amountsState[k] ?? 0;
                        const currentVal = getDeclarationCurrentValue(d, k);
                        const isChecked = Boolean(selected[k]);
                        const isDetected = (initialAmounts[k] ?? 0) > 0;

                        return (
                          <tr
                            key={k}
                            className={cn(
                              "transition-colors",
                              isChecked ? "bg-forest-mist/15" : "hover:bg-bg-raised",
                            )}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => setSelected((prev) => ({ ...prev, [k]: !prev[k] }))}
                                className="size-4 rounded border-line text-forest focus:ring-forest cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className={cn("font-medium", isDetected ? "text-forest-deep" : "text-ink-soft")}>
                                {info.casilla && (
                                  <span className="mr-1 font-mono text-[10px] text-faint">[C{info.casilla}]</span>
                                )}
                                {info.label}
                                {isDetected && (
                                  <span className="ml-1.5 rounded bg-forest/10 px-1 py-0.5 text-[9px] font-bold text-forest">AUTO</span>
                                )}
                              </div>
                              {info.source && (
                                <span className="text-[10px] text-faint">{info.source}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums text-muted text-[11px]">
                              {currentVal > 0 ? formatCOP(currentVal) : <span className="text-faint">—</span>}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={extractedVal || ""}
                                placeholder="0"
                                onChange={(e) => handleAmountChange(k, Number(e.target.value) || 0)}
                                className={cn(
                                  "w-32 rounded-md border px-2.5 py-1 text-right font-mono font-semibold tabular-nums focus:outline-none",
                                  isDetected
                                    ? "border-forest/40 bg-forest-mist/20 text-forest-deep focus:border-forest"
                                    : "border-line bg-surface text-ink focus:border-forest",
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-bg-raised px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <span className="text-xs text-muted hidden sm:block">
              {selectedCount} campo{selectedCount !== 1 ? "s" : ""} marcado{selectedCount !== 1 ? "s" : ""} para aplicar
            </span>
          </div>
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
                Aplicar {selectedCount} {selectedCount === 1 ? "monto" : "montos"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
