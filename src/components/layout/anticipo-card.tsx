import { useState } from "react";
import { TrendingUp, CheckCircle, Info, Sparkles } from "lucide-react";
import { useAppStore, useComputed } from "@/lib/store";
import { calcularAnticipoRenta } from "@/lib/tax/anticipo";
import { Card, CardTitle, CardHint } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/tax/format";

export function AnticipoCard() {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();

  const aniosDeclarando = d.identity.aniosDeclarando || 3;
  const tipo =
    aniosDeclarando === 1
      ? "primer_ano"
      : aniosDeclarando === 2
      ? "segundo_ano"
      : "tercer_ano_mas";

  const res = calcularAnticipoRenta({
    impuestoNetoActual: c.impuestoNeto,
    impuestoNetoAnterior: d.extra.impuestoNetoAnterior || 0,
    retencionesSufridas: c.casillas[132] || 0,
    tipoDeclaracion: tipo,
  });

  const [aplicado, setAplicado] = useState(false);

  function handleApplyToDeclaration(opcion: 1 | 2) {
    const valor = opcion === 1 ? res.anticipoProcedimiento1 : res.anticipoProcedimiento2;
    patch((draft) => {
      draft.extra.usarPromedioAnticipo = opcion === 2;
    });
    setAplicado(true);
    setTimeout(() => setAplicado(false), 2500);
  }

  return (
    <Card className="border-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Simulador de Anticipo de Renta 2026</CardTitle>
              <Badge tone="neutral">Casilla 134</Badge>
            </div>
            <CardHint className="text-xs">Art. 807 del Estatuto Tributario (Porcentaje legal: {res.porcentajeAnticipo} %)</CardHint>
          </div>
        </div>

        {res.ahorroPorOpcion > 0 && (
          <Badge tone="ok" className="text-xs">
            Ahorro de {formatCOP(res.ahorroPorOpcion)} con Opción {res.opcionRecomendada}
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-3 text-xs">
        {/* Opción 1 */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          res.opcionRecomendada === 1
            ? "border-forest bg-forest-mist/30 shadow-sm"
            : "border-line bg-surface"
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-ink">Procedimiento 1 (Año Actual)</span>
            {res.opcionRecomendada === 1 && <span className="text-[10px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded">Recomendado</span>}
          </div>
          <p className="text-[11px] text-muted mb-2">
            {res.porcentajeAnticipo} % sobre el Impuesto Neto 2025 ({formatCOP(res.impuestoNetoActual)}) − Retenciones ({formatCOP(res.retencionesSufridas)})
          </p>
          <div className="flex items-baseline justify-between pt-1 border-t border-line/60">
            <span className="text-muted text-[11px]">Anticipo Liquidado:</span>
            <span className="font-display font-bold text-sm text-ink">{formatCOP(res.anticipoProcedimiento1)}</span>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant={!d.extra.usarPromedioAnticipo ? "default" : "outline"}
              onClick={() => handleApplyToDeclaration(1)}
              className="text-xs h-7"
            >
              {!d.extra.usarPromedioAnticipo ? "✓ Seleccionado" : "Usar Procedimiento 1"}
            </Button>
          </div>
        </div>

        {/* Opción 2 */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          res.opcionRecomendada === 2
            ? "border-forest bg-forest-mist/30 shadow-sm"
            : "border-line bg-surface"
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-ink">Procedimiento 2 (Promedio 2 Años)</span>
            {res.opcionRecomendada === 2 && <span className="text-[10px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded">Recomendado</span>}
          </div>
          <p className="text-[11px] text-muted mb-2">
            {res.porcentajeAnticipo} % sobre el promedio (2024: {formatCOP(res.impuestoNetoAnterior)} y 2025: {formatCOP(res.impuestoNetoActual)}) − Retenciones
          </p>
          <div className="flex items-baseline justify-between pt-1 border-t border-line/60">
            <span className="text-muted text-[11px]">Anticipo Liquidado:</span>
            <span className="font-display font-bold text-sm text-ink">{formatCOP(res.anticipoProcedimiento2)}</span>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant={d.extra.usarPromedioAnticipo ? "default" : "outline"}
              onClick={() => handleApplyToDeclaration(2)}
              className="text-xs h-7"
            >
              {d.extra.usarPromedioAnticipo ? "✓ Seleccionado" : "Usar Procedimiento 2"}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted bg-bg/60 p-2.5 rounded-lg border border-line">
        {res.explicacion}
      </p>
    </Card>
  );
}
