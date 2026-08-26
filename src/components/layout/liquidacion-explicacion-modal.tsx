import { X, BookOpen, Calculator, Sparkles, Scale, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { type ComputedDeclaration } from "@/lib/tax/types";

export type ExplicacionTopic = "renta-gravable" | "impuesto-neto" | "anticipo" | "saldo-pagar";

interface Props {
  topic: ExplicacionTopic | null;
  onClose: () => void;
  computed: ComputedDeclaration;
  year: number;
}

export function LiquidacionExplicacionModal({ topic, onClose, computed: c, year }: Props) {
  if (!topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface p-6 shadow-2xl overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-muted-mist hover:text-ink transition-colors"
          title="Cerrar ventana"
        >
          <X className="size-5" />
        </button>

        {topic === "renta-gravable" && (
          <div className="space-y-5">
            <header className="pr-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-forest-mist text-forest px-2 py-0.5 rounded border border-forest/20">
                  Casilla 97
                </span>
                <span className="text-xs font-semibold text-muted">Artículos 26, 335 y 336 E.T.</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                Renta Líquida Gravable (Cédula General)
              </h2>
              <p className="text-xs text-muted">
                Es la ganancia neta real sobre la cual la DIAN aplica la tarifa de impuesto.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico en tu declaración actual: {formatCOP(c.rentaLiquidaGravable)} (0 UVT)</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Tu cliente <strong>no tuvo salarios ni honorarios propios</strong> reportados como ingresos gravables en el año. Sus movimientos fueron transferencias o consignaciones de paso. Al ser los ingresos brutos <strong>$0</strong>, la renta líquida gravable resultante es exactamente <strong>$0</strong>.
              </p>
            </div>

            {/* Fórmula Matemática */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                Fórmula Oficial de Depuración DIAN
              </div>
              <div className="rounded-lg bg-surface-sunken p-3 font-mono text-xs space-y-1.5 text-ink">
                <div className="flex justify-between">
                  <span>(+) Ingresos Brutos Totales</span>
                  <span>{formatCOP(c.depuracion.ingresosBrutos)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Ingresos No Constitutivos (Salud/Pensión)</span>
                  <span>{formatCOP(c.depuracion.incrngo)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Rentas Exentas y Deducciones (Límite 40% / 1.340 UVT)</span>
                  <span>{formatCOP(c.depuracion.total92)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Deducción 1% Factura Electrónica (Casilla 28)</span>
                  <span>{formatCOP(c.casillas[28] ?? 0)}</span>
                </div>
                <div className="border-t border-line pt-1 flex justify-between font-bold text-forest">
                  <span>(=) Renta Líquida Gravable (Casilla 97)</span>
                  <span>{formatCOP(c.rentaLiquidaGravable)}</span>
                </div>
              </div>
            </div>

            {/* Si tuviera ingresos */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                ¿Qué pasaría si tu cliente tuviera ingresos?
              </div>
              <p>
                Si por ejemplo ganara <strong>$60.000.000</strong> de salarios, se le restan los aportes de salud y pensión obligatorios (~$4.800.000), las rentas exentas (como el 25% laboral) y deducciones (medicina prepagada, vivienda, 1% FE), tributando solo sobre la diferencia neta.
              </p>
            </div>
          </div>
        )}

        {topic === "impuesto-neto" && (
          <div className="space-y-5">
            <header className="pr-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-forest-mist text-forest px-2 py-0.5 rounded border border-forest/20">
                  Casilla 126
                </span>
                <span className="text-xs font-semibold text-muted">Artículo 241 Estatuto Tributario</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                Impuesto Neto de Renta
              </h2>
              <p className="text-xs text-muted">
                Cálculo del tributo a pagar aplicando la tabla progresiva de rangos en UVT.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico en tu declaración actual: {formatCOP(c.impuestoNeto)}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                La ley colombiana establece que los primeros <strong>1.090 UVT</strong> de renta gravable (equivalentes a <strong>$54.280.910</strong> en 2025) tienen una <strong>tarifa del 0%</strong>. Como la renta líquida de tu cliente es de $0 (está dentro del primer rango), el impuesto liquidado es <strong>$0</strong>.
              </p>
            </div>

            {/* Tabla del Art. 241 */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Scale className="size-4 text-forest" />
                Rangos de Tarifa Progresiva (Art. 241 E.T.)
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-line">
                    <tr>
                      <th className="py-1.5">Rango en UVT</th>
                      <th>Equivalente en Pesos</th>
                      <th>Tarifa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono text-[11px]">
                    <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                      <td className="py-1.5">0 a 1.090 UVT</td>
                      <td>Hasta $54.280.910</td>
                      <td>0 % (Exento de impuesto)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">1.090 a 1.700 UVT</td>
                      <td>$54.280.910 a $84.658.300</td>
                      <td>19 % sobre el exceso de 1.090 UVT</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">1.700 a 4.100 UVT</td>
                      <td>$84.658.300 a $204.175.900</td>
                      <td>28 % + 116 UVT</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">4.100 UVT en adelante</td>
                      <td>Más de $204.175.900</td>
                      <td>33 % a 39 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ejemplo */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                Ejemplo de liquidación con impuesto:
              </div>
              <p>
                Si un contribuyente tiene una Renta Líquida Gravable de <strong>1.200 UVT</strong>:  
                Exceso = 1.200 − 1.090 = <strong>110 UVT</strong>.  
                Impuesto = 110 UVT × 19% = <strong>20,9 UVT</strong> (aprox. <strong>$1.041.000</strong>).
              </p>
            </div>
          </div>
        )}

        {topic === "anticipo" && (
          <div className="space-y-5">
            <header className="pr-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-forest-mist text-forest px-2 py-0.5 rounded border border-forest/20">
                  Casilla 133
                </span>
                <span className="text-xs font-semibold text-muted">Artículo 807 Estatuto Tributario</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                Anticipo de Renta para el Año Siguiente
              </h2>
              <p className="text-xs text-muted">
                Abono obligatorio que la DIAN cobra como anticipo del impuesto del año entrante.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico en tu declaración actual: {formatCOP(c.casillas[133] ?? 0)}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Como tu cliente declara por <strong>1.ª vez</strong> (porcentaje legal del <strong>25%</strong>) y su Impuesto Neto de Renta en esta declaración es <strong>$0</strong>, el cálculo del anticipo da exactamente:  
                <span className="font-mono font-bold block mt-1">($0 de Impuesto × 25%) − $0 Retenciones = $0</span>
                Por lo tanto, <strong>no se le cobra ningún anticipo para el año entrante</strong>.
              </p>
            </div>

            {/* Las 2 Fórmulas Legales */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                ¿Cómo calcula la DIAN el Anticipo? (Art. 807 E.T.)
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-surface-sunken p-2.5 space-y-1">
                  <p className="font-bold text-ink">1. Porcentaje según Años Declarando:</p>
                  <p className="text-muted">
                    • <strong>1.er año (Declara por primera vez):</strong> 25 %<br/>
                    • <strong>2.º año declarando:</strong> 50 %<br/>
                    • <strong>3.er año en adelante:</strong> 75 %
                  </p>
                </div>
                <div className="rounded-lg bg-surface-sunken p-2.5 space-y-1">
                  <p className="font-bold text-ink">2. Procedimiento Oficial (Sistema 1):</p>
                  <p className="font-mono text-[11px] text-forest font-semibold">
                    Anticipo = (Impuesto Neto del Año × % Antigüedad) − Retenciones en la fuente
                  </p>
                </div>
              </div>
            </div>

            {/* Ejemplo con valores */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                Ejemplo si un cliente tuviera impuesto a pagar:
              </div>
              <p>
                Si un cliente declara por primera vez y le da <strong>$4.000.000</strong> de impuesto neto, y le practicaron <strong>$500.000</strong> en retenciones:  
                Anticipo = ($4.000.000 × 25%) − $500.000 = $1.000.000 − $500.000 = <strong>$500.000</strong>.
              </p>
            </div>
          </div>
        )}

        {topic === "saldo-pagar" && (
          <div className="space-y-5">
            <header className="pr-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-forest-mist text-forest px-2 py-0.5 rounded border border-forest/20">
                  Casillas 136 y 137
                </span>
                <span className="text-xs font-semibold text-muted">Resultado Final de la Declaración</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                Total Saldo a Pagar / Total Saldo a Favor
              </h2>
              <p className="text-xs text-muted">
                Es la cifra final que determina si el declarante debe pagar al banco o si la DIAN le debe dinero.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico en tu declaración actual: Saldo a Pagar $0</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Como no hubo impuesto liquidado, ni anticipo, ni sanciones, ni retenciones pendientes, el total a transferir o pagar a la DIAN es exactamente <strong>$0</strong>. La declaración se presenta y queda formalmente cumplida sin desembolsar dinero.
              </p>
            </div>

            {/* Fórmula de Cierre */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                Fórmula de Cierre Oficial de la DIAN
              </div>
              <div className="rounded-lg bg-surface-sunken p-3 font-mono text-xs space-y-1 text-ink">
                <div className="flex justify-between">
                  <span>(+) Impuesto Neto de Renta (Casilla 126)</span>
                  <span>{formatCOP(c.impuestoNeto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Impuesto Ganancias Ocasionales (Casilla 127)</span>
                  <span>{formatCOP(c.casillas[127] ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Anticipo Año Siguiente (Casilla 133)</span>
                  <span>{formatCOP(c.casillas[133] ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Sanciones (Casilla 135)</span>
                  <span>{formatCOP(c.casillas[135] ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Anticipo Año Anterior (Casilla 130)</span>
                  <span>{formatCOP(c.casillas[130] ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Saldo a Favor Anterior (Casilla 131)</span>
                  <span>{formatCOP(c.casillas[131] ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Retenciones en la Fuente del Año (Casilla 132)</span>
                  <span>{formatCOP(c.casillas[132] ?? 0)}</span>
                </div>
                <div className="border-t border-line pt-1 flex justify-between font-bold text-forest text-sm">
                  <span>(=) Total Saldo a Pagar (Casilla 136)</span>
                  <span>{formatCOP(c.saldoPagar)}</span>
                </div>
              </div>
            </div>

            {/* Cuándo da a favor */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                ¿Cuándo da Saldo a Favor (Casilla 137)?
              </div>
              <p>
                Si las <strong>Retenciones en la fuente (132)</strong> que le practicaron durante el año a la persona superan al impuesto liquidado más el anticipo, la diferencia queda como un <strong>Saldo a Favor</strong> que el contribuyente puede solicitar en devolución a la DIAN o arrastrar para el año siguiente.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="default" size="sm">
            Entendido, cerrar explicación
          </Button>
        </div>
      </div>
    </div>
  );
}
