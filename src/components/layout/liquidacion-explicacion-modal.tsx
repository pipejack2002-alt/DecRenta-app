import { X, BookOpen, Calculator, Sparkles, Scale, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { type ComputedDeclaration, type Declaration } from "@/lib/tax/types";
import { uvtFromPesos } from "@/lib/tax/uvt";

export type ExplicacionTopic = "renta-gravable" | "impuesto-neto" | "anticipo" | "saldo-pagar";

interface Props {
  topic: ExplicacionTopic | null;
  onClose: () => void;
  computed: ComputedDeclaration;
  declaration: Declaration;
}

export function LiquidacionExplicacionModal({ topic, onClose, computed: c, declaration: d }: Props) {
  if (!topic) return null;

  const y = d.year;
  const ov = d.uvtOverrides;
  const esPrimeraVez = d.identity.primeraVez || d.identity.aniosDeclarando === 1;
  const anios = esPrimeraVez ? 1 : d.identity.aniosDeclarando || 3;
  const pctAnticipo = anios === 1 ? 25 : anios === 2 ? 50 : 75;
  const nombreCliente = [d.identity.primerNombre, d.identity.primerApellido].filter(Boolean).join(" ") || "el contribuyente";
  const tieneIngresos = c.depuracion.ingresosBrutos > 0;
  const uvtGravable = uvtFromPesos(c.rentaLiquidaGravable, y, ov);

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
                Es la ganancia neta depurada sobre la cual se calcula la tarifa de impuesto del Art. 241 E.T.
              </p>
            </header>

            {/* Diagnóstico dinámico */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico para {nombreCliente}: {formatCOP(c.rentaLiquidaGravable)} ({formatUvt(uvtGravable)})</span>
              </div>
              {tieneIngresos ? (
                <p className="text-xs text-ink-soft leading-relaxed">
                  De los <strong>{formatCOP(c.depuracion.ingresosBrutos)}</strong> de ingresos brutos obtenidos en el año, se restaron <strong>{formatCOP(c.depuracion.incrngo)}</strong> de aportes a seguridad social (salud/pensión), <strong>{formatCOP(c.depuracion.total92)}</strong> en rentas exentas y deducciones (con límite conjunto del 40 % o 1.340 UVT) y <strong>{formatCOP(c.casillas[28] ?? 0)}</strong> por el 1 % de compras con factura electrónica, dejando una base gravable de <strong>{formatCOP(c.rentaLiquidaGravable)}</strong>.
                </p>
              ) : (
                <p className="text-xs text-ink-soft leading-relaxed">
                  {nombreCliente} <strong>no tuvo ingresos laborales, de honorarios ni de comercio gravables</strong> en este periodo. Los movimientos bancarios reportados correspondieron a consignaciones de paso o créditos. Al ser los ingresos brutos <strong>$0</strong>, la renta líquida gravable resultante es exactamente <strong>$0</strong>.
                </p>
              )}
            </div>

            {/* Fórmula Matemática Oficial */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                Fórmula Oficial de Depuración DIAN (Cédula General)
              </div>
              <div className="rounded-lg bg-surface-sunken p-3 font-mono text-xs space-y-1.5 text-ink">
                <div className="flex justify-between">
                  <span>(+) Ingresos Brutos Totales</span>
                  <span className="font-bold">{formatCOP(c.depuracion.ingresosBrutos)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Ingresos No Constitutivos (Salud/Pensión Obligatoria)</span>
                  <span>{formatCOP(c.depuracion.incrngo)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Rentas Exentas y Deducciones Imputables (Límite 40 %)</span>
                  <span>{formatCOP(c.depuracion.total92)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>(−) Deducción 1 % Factura Electrónica (Casilla 28)</span>
                  <span>{formatCOP(c.casillas[28] ?? 0)}</span>
                </div>
                <div className="border-t border-line pt-1 flex justify-between font-bold text-forest">
                  <span>(=) Renta Líquida Gravable (Casilla 97)</span>
                  <span>{formatCOP(c.rentaLiquidaGravable)}</span>
                </div>
              </div>
            </div>

            {/* Fundamento legal */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                Regla Tributaria Clave:
              </div>
              <p>
                El <strong>Artículo 336 del Estatuto Tributario</strong> establece que las rentas exentas (como el 25 % laboral o aportes AFC) y deducciones (intereses de vivienda, dependientes, prepagada) no pueden exceder el <strong>40 % del ingreso neto</strong> (tope máximo de 1.340 UVT). La deducción del 1 % de compras con factura electrónica es adicional y no consume este límite del 40 %.
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
                Determinación del tributo a cargo aplicando la tabla progresiva de rangos en UVT.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico para {nombreCliente}: {formatCOP(c.impuestoNeto)}</span>
              </div>
              {c.impuestoNeto === 0 ? (
                <p className="text-xs text-ink-soft leading-relaxed">
                  La ley tributaria otorga una <strong>tarifa del 0 %</strong> a las primeras <strong>1.090 UVT</strong> de renta líquida gravable ({formatCOP(c.uvt * 1090)} en {y}). Al tener {nombreCliente} una renta líquida de <strong>{formatCOP(c.rentaLiquidaGravable)}</strong> (menor a 1.090 UVT), el impuesto liquidado da exactamente <strong>$0</strong>.
                </p>
              ) : (
                <p className="text-xs text-ink-soft leading-relaxed">
                  Con una renta líquida gravable de <strong>{formatCOP(c.rentaLiquidaGravable)}</strong> ({formatUvt(uvtGravable)}), el impuesto básico calculado según la tabla progresiva es de <strong>{formatCOP(c.impuestoNeto)}</strong>.
                </p>
              )}
            </div>

            {/* Tabla del Art. 241 */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Scale className="size-4 text-forest" />
                Rangos de Tarifa Progresiva (Art. 241 E.T. · Personas Naturales)
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-line">
                    <tr>
                      <th className="py-1.5">Rango en UVT</th>
                      <th>Equivalente en Pesos ({y})</th>
                      <th>Tarifa Marginal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono text-[11px]">
                    <tr className={uvtGravable <= 1090 ? "bg-emerald-50/70 font-bold text-emerald-950" : ""}>
                      <td className="py-1.5">0 a 1.090 UVT</td>
                      <td>Hasta {formatCOP(c.uvt * 1090)}</td>
                      <td>0 % (Exento) {uvtGravable <= 1090 ? "👈 Tramo actual" : ""}</td>
                    </tr>
                    <tr className={uvtGravable > 1090 && uvtGravable <= 1700 ? "bg-emerald-50/70 font-bold text-emerald-950" : ""}>
                      <td className="py-1.5">1.090 a 1.700 UVT</td>
                      <td>{formatCOP(c.uvt * 1090 + 1)} a {formatCOP(c.uvt * 1700)}</td>
                      <td>19 % sobre el exceso de 1.090 UVT {uvtGravable > 1090 && uvtGravable <= 1700 ? "👈 Tramo actual" : ""}</td>
                    </tr>
                    <tr className={uvtGravable > 1700 && uvtGravable <= 4100 ? "bg-emerald-50/70 font-bold text-emerald-950" : ""}>
                      <td className="py-1.5">1.700 a 4.100 UVT</td>
                      <td>{formatCOP(c.uvt * 1700 + 1)} a {formatCOP(c.uvt * 4100)}</td>
                      <td>28 % + 116 UVT {uvtGravable > 1700 && uvtGravable <= 4100 ? "👈 Tramo actual" : ""}</td>
                    </tr>
                    <tr className={uvtGravable > 4100 ? "bg-emerald-50/70 font-bold text-emerald-950" : ""}>
                      <td className="py-1.5">4.100 UVT en adelante</td>
                      <td>Más de {formatCOP(c.uvt * 4100)}</td>
                      <td>33 % a 39 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Descuentos */}
            <div className="rounded-xl border border-line bg-muted-mist/30 p-4 space-y-1.5 text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                <Info className="size-3.5 text-forest" />
                Descuentos Tributarios que pueden restar impuesto:
              </div>
              <p>
                Si se liquida impuesto a cargo, el contribuyente puede restar <strong>Descuentos Tributarios</strong> como donaciones a entidades sin ánimo de lucro (25 % de descuento · Art. 257 E.T.) e impuestos pagados en el exterior (Art. 254 E.T.).
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
                Monto que la DIAN exige abonar por adelantado para el impuesto del próximo año gravable.
              </p>
            </header>

            {/* Diagnóstico dinámico */}
            <div className="rounded-xl border border-line bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Diagnóstico para {nombreCliente}: {formatCOP(c.casillas[133] ?? 0)}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Antigüedad configurada: <strong>{esPrimeraVez ? "1.er año (Declara por primera vez)" : `${anios}.º año declarando`}</strong> (tarifa legal: <strong>{pctAnticipo} %</strong>).  
                <span className="font-mono font-semibold block mt-1">
                  ({formatCOP(c.impuestoNeto)} de Impuesto Neto × {pctAnticipo} %) − {formatCOP(c.casillas[132] ?? 0)} Retenciones = {formatCOP(c.casillas[133] ?? 0)}
                </span>
                {c.casillas[133] === 0 ? "Como el impuesto neto es $0, no se genera ningún valor a pagar por concepto de anticipo." : `El anticipo liquidado a pagar en esta declaración es de ${formatCOP(c.casillas[133])}.`}
              </p>
            </div>

            {/* Fórmulas de Anticipo */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                Procedimientos Oficiales de Cálculo (Art. 807 E.T.)
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="rounded-lg bg-surface-sunken p-3 space-y-1">
                  <p className="font-bold text-ink">1. Porcentaje según Años de Declaración:</p>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[11px]">
                    <div className={`p-2 rounded border ${anios === 1 ? "border-forest bg-forest-mist font-bold text-forest" : "border-line bg-surface"}`}>
                      1.er año: 25 % {anios === 1 ? "👈" : ""}
                    </div>
                    <div className={`p-2 rounded border ${anios === 2 ? "border-forest bg-forest-mist font-bold text-forest" : "border-line bg-surface"}`}>
                      2.º año: 50 % {anios === 2 ? "👈" : ""}
                    </div>
                    <div className={`p-2 rounded border ${anios >= 3 ? "border-forest bg-forest-mist font-bold text-forest" : "border-line bg-surface"}`}>
                      3.er año+: 75 % {anios >= 3 ? "👈" : ""}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-surface-sunken p-3 space-y-1 font-mono text-[11px]">
                  <p className="font-bold text-ink font-sans">2. Métodos de Cálculo:</p>
                  <p className="text-forest font-semibold">
                    • Procedimiento 1: (Impuesto Neto Actual × {pctAnticipo} %) − Retenciones
                  </p>
                  <p className="text-muted">
                    • Procedimiento 2: (Promedio Impuesto 2 Últimos Años × {pctAnticipo} %) − Retenciones
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {topic === "saldo-pagar" && (
          <div className="space-y-5">
            <header className="pr-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-forest-mist text-forest px-2 py-0.5 rounded border border-forest/20">
                  {c.saldoPagar > 0 ? "Casilla 136" : c.saldoFavor > 0 ? "Casilla 137" : "Casilla 136"}
                </span>
                <span className="text-xs font-semibold text-muted">Liquidación Final DIAN</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                {c.saldoPagar > 0 ? "Total Saldo a Pagar" : c.saldoFavor > 0 ? "Total Saldo a Favor" : "Total Saldo a Pagar"}
              </h2>
              <p className="text-xs text-muted">
                Resultado neto final de la declaración tras cruzar impuesto, anticipos, retenciones y sanciones.
              </p>
            </header>

            {/* Diagnóstico en este caso */}
            <div className={`rounded-xl border border-line p-4 space-y-2 ${c.saldoPagar > 0 ? "bg-amber-50/50" : c.saldoFavor > 0 ? "bg-emerald-50/50" : "bg-surface"}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="size-4 text-forest shrink-0" />
                <span>
                  {c.saldoPagar > 0
                    ? `Saldo a Pagar: ${formatCOP(c.saldoPagar)}`
                    : c.saldoFavor > 0
                    ? `Saldo a Favor: ${formatCOP(c.saldoFavor)}`
                    : "Saldo a Pagar: $ 0 (Sin impuesto a cargo)"}
                </span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {c.saldoPagar > 0
                  ? `El contribuyente debe realizar el pago de ${formatCOP(c.saldoPagar)} mediante el Formulario 490 (Recibo Oficial de Pago DIAN).`
                  : c.saldoFavor > 0
                  ? `El contribuyente tiene un saldo a favor de ${formatCOP(c.saldoFavor)} que podrá solicitar en devolución / compensación ante la DIAN o imputar en la declaración del año siguiente.`
                  : `${nombreCliente} no tiene impuesto a cargo ni anticipo pendiente. La declaración se presenta electrónicamente y queda legalmente cumplida sin desembolsar dinero.`}
              </p>
            </div>

            {/* Fórmula de Cierre */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-ink font-semibold text-xs uppercase tracking-wider">
                <Calculator className="size-4 text-forest" />
                Liquidación Oficial de Cierre DIAN
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
                <div className="border-t border-line pt-1.5 flex justify-between font-bold text-forest text-sm">
                  <span>{c.saldoFavor > 0 ? "(=) Saldo a Favor (Casilla 137)" : "(=) Total Saldo a Pagar (Casilla 136)"}</span>
                  <span>{formatCOP(c.saldoPagar || c.saldoFavor)}</span>
                </div>
              </div>
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

