import { useState } from "react";
import { ShieldCheck, ShieldAlert, Sparkles, Calculator } from "lucide-react";
import { useAppStore, useComputed } from "@/lib/store";
import { calcularBeneficioAuditoria } from "@/lib/tax/auditoria-sanciones";
import { Card, CardTitle, CardHint } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyField } from "@/components/layout/money-field";
import { formatCOP } from "@/lib/tax/format";
import { SancionesCalculatorModal } from "./sanciones-calculator-modal";

export function BeneficioAuditoriaCard() {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();

  const [sancionesOpen, setSancionesOpen] = useState(false);

  const res = calcularBeneficioAuditoria({
    impuestoNetoAnterior: d.extra.impuestoNetoAnterior || 0,
    impuestoNetoActual: c.impuestoNeto,
    year: d.year,
    uvtOverrides: d.uvtOverrides,
  });

  return (
    <>
      <Card className="border-line">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-9 items-center justify-center rounded-lg ${
              res.estado === "firme_6m"
                ? "bg-emerald-100 text-emerald-800"
                : res.estado === "firme_12m"
                ? "bg-blue-100 text-blue-800"
                : "bg-stone-100 text-stone-800"
            }`}>
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Beneficio de Auditoría</CardTitle>
                {res.estado === "firme_6m" && <Badge tone="ok">Firmeza en 6 Meses (≥ 35 %)</Badge>}
                {res.estado === "firme_12m" && <Badge tone="ok">Firmeza en 12 Meses (≥ 25 %)</Badge>}
                {res.estado === "requiere_adicion" && <Badge tone="warn">Oportunidad de Firmeza</Badge>}
                {res.estado === "no_aplica" && <Badge tone="neutral">No Aplica / Revisar</Badge>}
              </div>
              <CardHint className="text-xs">Art. 689-3 del Estatuto Tributario (Ley 2277 de 2022)</CardHint>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => setSancionesOpen(true)} className="gap-1.5 text-xs">
            <Calculator className="size-3.5 text-forest" /> Calcular Sanciones / Mora
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-line pt-3 text-xs">
          <div>
            <MoneyField
              label="Impuesto Neto 2024 (Año Anterior)"
              hint="Casilla 126 de la declaración del año gravable 2024."
              value={d.extra.impuestoNetoAnterior || 0}
              onChange={(v) => patch((draft) => { draft.extra.impuestoNetoAnterior = v; })}
            />
          </div>
          <div>
            <span className="text-muted block text-[11px] mb-1">Impuesto Neto 2025 (Actual)</span>
            <div className="p-2 rounded border border-line bg-bg/50 font-bold text-sm text-ink">
              {formatCOP(c.impuestoNeto)}
            </div>
            <span className="text-[10px] text-muted mt-0.5 block">Casilla 126 liquidada</span>
          </div>
          <div>
            <span className="text-muted block text-[11px] mb-1">Incremento Fiscal</span>
            <div className="p-2 rounded border border-line bg-bg/50 font-bold text-sm text-emerald-800">
              {res.incrementoPorcentaje > 0 ? `+${res.incrementoPorcentaje.toFixed(1)} %` : "0 %"}
            </div>
            <span className="text-[10px] text-muted mt-0.5 block">Base mínima 71 UVT: {formatCOP(res.baseMinima71UvtPesos)}</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted bg-bg/60 p-2.5 rounded-lg border border-line">
          {res.diagnostico}
        </p>
      </Card>

      <SancionesCalculatorModal isOpen={sancionesOpen} onClose={() => setSancionesOpen(false)} />
    </>
  );
}
