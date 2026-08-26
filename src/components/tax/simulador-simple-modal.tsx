import { useState, useMemo } from "react";
import {
  Scale,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Coins,
  ArrowRight,
  Sparkles,
  Info,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardHint } from "@/components/ui/card";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import type { ComputedDeclaration, Declaration } from "@/lib/tax/types";
import { uvtFromPesos } from "@/lib/tax/uvt";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  computed: ComputedDeclaration;
  declaration: Declaration;
}

type SimpleGrupo = 1 | 2 | 3 | 4;

interface SimpleRateTier {
  fromUvt: number;
  toUvt: number | null;
  rate: number;
}

const TARIFAS_SIMPLE: Record<SimpleGrupo, { name: string; desc: string; tiers: SimpleRateTier[] }> = {
  1: {
    name: "Grupo 1: Tiendas y Minimercados",
    desc: "Tiendas pequeñas, minimercados, micromercados y peluquerías.",
    tiers: [
      { fromUvt: 0, toUvt: 6000, rate: 0.012 },
      { fromUvt: 6000, toUvt: 15000, rate: 0.028 },
      { fromUvt: 15000, toUvt: 30000, rate: 0.044 },
      { fromUvt: 30000, toUvt: 100000, rate: 0.056 },
    ],
  },
  2: {
    name: "Grupo 2: Comercio e Industria",
    desc: "Actividades comerciales al por mayor/menor, servicios técnicos y manufactura.",
    tiers: [
      { fromUvt: 0, toUvt: 6000, rate: 0.016 },
      { fromUvt: 6000, toUvt: 15000, rate: 0.020 },
      { fromUvt: 15000, toUvt: 30000, rate: 0.035 },
      { fromUvt: 30000, toUvt: 100000, rate: 0.045 },
    ],
  },
  3: {
    name: "Grupo 3: Servicios Profesionales",
    desc: "Consultoría, servicios profesionales, científicos donde predomine el factor intelectual.",
    tiers: [
      { fromUvt: 0, toUvt: 6000, rate: 0.059 },
      { fromUvt: 6000, toUvt: 12000, rate: 0.073 },
      { fromUvt: 12000, toUvt: 30000, rate: 0.120 },
      { fromUvt: 30000, toUvt: 100000, rate: 0.145 },
    ],
  },
  4: {
    name: "Grupo 4: Restaurantes y Transporte",
    desc: "Expendio de comidas y bebidas (restaurantes, bares, cafeterías) y transporte.",
    tiers: [
      { fromUvt: 0, toUvt: 6000, rate: 0.034 },
      { fromUvt: 6000, toUvt: 15000, rate: 0.038 },
      { fromUvt: 15000, toUvt: 30000, rate: 0.055 },
      { fromUvt: 30000, toUvt: 100000, rate: 0.070 },
    ],
  },
};

export function SimuladorSimpleModal({ isOpen, onClose, computed: c, declaration: d }: Props) {
  const [selectedGrupo, setSelectedGrupo] = useState<SimpleGrupo>(3); // Por defecto servicios profesionales
  const [overrideIngresos, setOverrideIngresos] = useState<string>("");
  const [pensionEmpleador, setPensionEmpleador] = useState<number>(0);

  if (!isOpen) return null;

  const cas = c.casillas;
  const ingresosDeclaracion =
    (cas[32] ?? 0) +
    (cas[43] ?? 0) +
    (cas[58] ?? 0) +
    (cas[74] ?? 0) +
    (cas[99] ?? 0) +
    (cas[104] ?? 0) +
    (cas[107] ?? 0) +
    (cas[108] ?? 0) +
    (cas[109] ?? 0);

  const baseIngresos = overrideIngresos !== "" ? Number(overrideIngresos) || 0 : ingresosDeclaracion;
  const baseUvt = uvtFromPesos(baseIngresos, c.year, d.uvtOverrides);

  // Cálculo del impuesto SIMPLE (Art. 908 E.T.)
  const simpleCalculation = useMemo(() => {
    const grupoInfo = TARIFAS_SIMPLE[selectedGrupo];
    let matchedTier = grupoInfo.tiers[0];

    for (const t of grupoInfo.tiers) {
      if (baseUvt >= t.fromUvt && (t.toUvt === null || baseUvt <= t.toUvt)) {
        matchedTier = t;
        break;
      }
    }

    const impuestoBrutoSimple = Math.round(baseIngresos * matchedTier.rate);
    const impuestoNetoSimple = Math.max(0, impuestoBrutoSimple - pensionEmpleador);

    return {
      tier: matchedTier,
      ratePct: (matchedTier.rate * 100).toFixed(2),
      impuestoBruto: impuestoBrutoSimple,
      impuestoNeto: impuestoNetoSimple,
      superaTope: baseUvt > 100000,
    };
  }, [baseIngresos, baseUvt, selectedGrupo, pensionEmpleador]);

  // Comparación con el Régimen Ordinario
  const impuestoOrdinario = c.impuestoNeto;
  const diferencia = impuestoOrdinario - simpleCalculation.impuestoNeto;
  const convieneSimple = diferencia > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest-mist text-forest">
              <Scale className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Simulador: Régimen Ordinario (210) vs Régimen SIMPLE (260)
              </h3>
              <p className="text-xs text-muted">
                Análisis comparativo de conveniencia tributaria bajo la Ley 2277 de 2022 (Art. 908 E.T.).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-ink transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Selección de Parámetros */}
        <div className="space-y-4 rounded-xl border border-line bg-bg-raised p-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-ink">1. Selecciona el Grupo de Actividad Económica (RST):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(TARIFAS_SIMPLE) as unknown as SimpleGrupo[]).map((grpNum) => {
                const g = TARIFAS_SIMPLE[Number(grpNum) as SimpleGrupo];
                const active = selectedGrupo === Number(grpNum);
                return (
                  <button
                    key={grpNum}
                    type="button"
                    onClick={() => setSelectedGrupo(Number(grpNum) as SimpleGrupo)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-forest bg-forest-mist/40 text-forest ring-1 ring-forest/30"
                        : "border-line bg-surface hover:bg-bg"
                    }`}
                  >
                    <strong className="block font-semibold">{g.name}</strong>
                    <span className="text-[11px] text-muted line-clamp-2 mt-0.5">{g.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
            <div>
              <label className="font-semibold text-ink">Ingresos Brutos a Evaluar:</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  placeholder={String(ingresosDeclaracion)}
                  value={overrideIngresos}
                  onChange={(e) => setOverrideIngresos(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-mono font-bold text-ink"
                />
              </div>
              <span className="text-[10px] text-muted">
                {overrideIngresos === "" ? "Tomado de la declaración activa" : "Valor personalizado"} ({formatUvt(baseUvt)})
              </span>
            </div>

            <div>
              <label className="font-semibold text-ink">Aportes a Pensión Empleador (Descuento SIMPLE):</label>
              <input
                type="number"
                placeholder="0"
                value={pensionEmpleador || ""}
                onChange={(e) => setPensionEmpleador(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-mono text-ink"
              />
              <span className="text-[10px] text-muted">Descontable del impuesto SIMPLE (Art. 903 E.T.)</span>
            </div>
          </div>
        </div>

        {/* Comparativa Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Régimen Ordinario */}
          <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Régimen Ordinario (210)</span>
              <Badge tone="neutral">Estatuto Tributario</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted block">Renta Líquida Gravable:</span>
              <strong className="font-mono text-sm">{formatCOP(c.rentaLiquidaGravable)}</strong>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted block">Impuesto Neto Liquidado:</span>
              <p className="font-mono text-2xl font-bold text-ink">{formatCOP(impuestoOrdinario)}</p>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Tributa sobre la utilidad (depurada con salud, pensión, 25% exenta y compras electrónicas).
            </p>
          </div>

          {/* Régimen SIMPLE */}
          <div className="rounded-2xl border-2 border-forest/50 bg-forest-mist/20 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-forest/20 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">Régimen SIMPLE (260)</span>
              <Badge tone="forest">Tarifa {simpleCalculation.ratePct} %</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted block">Base de Ingresos Brutos:</span>
              <strong className="font-mono text-sm">{formatCOP(baseIngresos)}</strong>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted block">Impuesto Estimado en el SIMPLE:</span>
              <p className="font-mono text-2xl font-bold text-forest">{formatCOP(simpleCalculation.impuestoNeto)}</p>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Tributa con tarifa fija reducida sobre ingresos brutos e integra Renta, ICA y Avisos.
            </p>
          </div>
        </div>

        {/* Diagnóstico y Recomendación Automatizada */}
        <div className={`rounded-2xl border p-5 space-y-2 ${
          convieneSimple
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}>
          <div className="flex items-center gap-2">
            {convieneSimple ? (
              <TrendingDown className="size-5 text-emerald-700" />
            ) : (
              <TrendingUp className="size-5 text-amber-700" />
            )}
            <h4 className="font-display text-base font-bold">
              {convieneSimple
                ? `¡Le conviene pasarse al Régimen SIMPLE! (Ahorro estimado: ${formatCOP(diferencia)})`
                : `Le conviene permanecer en el Régimen Ordinario (Ahorro: ${formatCOP(Math.abs(diferencia))})`}
            </h4>
          </div>

          <p className="text-xs leading-relaxed">
            {convieneSimple ? (
              <>
                Al acogerse al <strong>Régimen Simple de Tributación</strong>, el contribuyente pagaría <strong>{formatCOP(simpleCalculation.impuestoNeto)}</strong> en lugar de <strong>{formatCOP(impuestoOrdinario)}</strong>, logrando un ahorro tributario neto de <strong>{formatCOP(diferencia)} anuales</strong> además de simplificar el pago del impuesto de Industria y Comercio (ICA).
              </>
            ) : (
              <>
                En el <strong>Régimen Ordinario</strong>, gracias a las deducciones, rentas exentas (25% laboral, salud, dependientes) o base en tramo exento, el contribuyente paga <strong>{formatCOP(impuestoOrdinario)}</strong>, siendo más económico que la tarifa sobre ingresos brutos del SIMPLE (<strong>{formatCOP(simpleCalculation.impuestoNeto)}</strong>).
              </>
            )}
          </p>
        </div>

        {/* Pie del modal */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar Simulador
          </Button>
        </div>
      </div>
    </div>
  );
}
