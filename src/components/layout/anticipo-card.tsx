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

  const esPrimeraVez = d.identity.primeraVez || d.identity.aniosDeclarando === 1;
  const aniosDeclarando = esPrimeraVez ? 1 : d.identity.aniosDeclarando || 3;
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
    patch((draft) => {
      draft.extra.usarPromedioAnticipo = opcion === 2;
    });
    setAplicado(true);
    setTimeout(() => setAplicado(false), 2500);
  }

  const usandoProc2 = Boolean(d.extra.usarPromedioAnticipo && !esPrimeraVez);

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
              <Badge tone="forest">Casilla 133</Badge>
            </div>
            <CardHint className="text-xs">
              Art. 807 del Estatuto Tributario · Porcentaje legal aplicable: {res.porcentajeAnticipo} % ({esPrimeraVez ? "1.er año: Declara por primera vez" : aniosDeclarando === 2 ? "2.º año declarando" : "3.er año o más"})
            </CardHint>
          </div>
        </div>

        {aplicado && (
          <Badge tone="ok" className="text-xs animate-in fade-in">
            ✓ Procedimiento aplicado a la declaración
          </Badge>
        )}

        {!aplicado && res.ahorroPorOpcion > 0 && (
          <Badge tone="ok" className="text-xs">
            Ahorro de {formatCOP(res.ahorroPorOpcion)} con Opción {res.opcionRecomendada}
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-3 text-xs">
        {/* Opción 1 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleApplyToDeclaration(1)}
          onKeyDown={(e) => e.key === "Enter" && handleApplyToDeclaration(1)}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
            !usandoProc2
              ? "border-forest bg-forest-mist/30 shadow-sm ring-1 ring-forest/30"
              : "border-line bg-surface hover:border-forest/40"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-ink">Procedimiento 1 (Año Actual)</span>
            {!usandoProc2 && (
              <span className="text-[10px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded">
                ✓ Seleccionado
              </span>
            )}
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
              variant={!usandoProc2 ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                handleApplyToDeclaration(1);
              }}
              className="text-xs h-7"
            >
              {!usandoProc2 ? "✓ Seleccionado" : "Usar Procedimiento 1"}
            </Button>
          </div>
        </div>

        {/* Opción 2 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!esPrimeraVez) handleApplyToDeclaration(2);
          }}
          onKeyDown={(e) => e.key === "Enter" && !esPrimeraVez && handleApplyToDeclaration(2)}
          className={`p-3.5 rounded-xl border transition-all text-left ${
            esPrimeraVez
              ? "opacity-60 border-line bg-muted-mist/20 cursor-not-allowed"
              : usandoProc2
              ? "border-forest bg-forest-mist/30 shadow-sm ring-1 ring-forest/30 cursor-pointer"
              : "border-line bg-surface hover:border-forest/40 cursor-pointer"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-ink">Procedimiento 2 (Promedio 2 Años)</span>
            {esPrimeraVez ? (
              <span className="text-[10px] text-muted font-medium bg-muted-mist px-1.5 py-0.5 rounded">
                No aplica en 1.er año
              </span>
            ) : usandoProc2 ? (
              <span className="text-[10px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded">
                ✓ Seleccionado
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted mb-2">
            {esPrimeraVez
              ? "No aplica porque es la primera declaración (no existe declaración previa del año 2024)."
              : `${res.porcentajeAnticipo} % sobre el promedio (2024: ${formatCOP(res.impuestoNetoAnterior)} y 2025: ${formatCOP(res.impuestoNetoActual)}) − Retenciones`}
          </p>
          <div className="flex items-baseline justify-between pt-1 border-t border-line/60">
            <span className="text-muted text-[11px]">Anticipo Liquidado:</span>
            <span className="font-display font-bold text-sm text-ink">
              {esPrimeraVez ? "—" : formatCOP(res.anticipoProcedimiento2)}
            </span>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={esPrimeraVez}
              variant={usandoProc2 ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                if (!esPrimeraVez) handleApplyToDeclaration(2);
              }}
              className="text-xs h-7"
            >
              {esPrimeraVez ? "No aplica" : usandoProc2 ? "✓ Seleccionado" : "Usar Procedimiento 2"}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted bg-bg/60 p-2.5 rounded-lg border border-line">
        {esPrimeraVez
          ? `Al declarar por 1.ª vez (Art. 807 E.T.), rige el Procedimiento 1 con tarifa del 25 % sobre el impuesto neto (${formatCOP(c.impuestoNeto)}), dando un anticipo liquidado de ${formatCOP(c.casillas[133] ?? 0)}.`
          : res.explicacion}
      </p>
    </Card>
  );
}
