import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Coins,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import type { ComputedDeclaration, Declaration } from "@/lib/tax/types";
import { uvtFromPesos } from "@/lib/tax/uvt";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  computed: ComputedDeclaration;
  declaration: Declaration;
}

export function InformeClienteModal({ isOpen, onClose, computed: c, declaration: d }: Props) {
  const [contadorName, setContadorName] = useState("CONTADOR PÚBLICO / ASESOR TRIBUTARIO");
  const [tarjetaProf, setTarjetaProf] = useState("T.P. No. XXXXXX-T");
  const [isEditingSignature, setIsEditingSignature] = useState(false);

  if (!isOpen) return null;

  const iden = d.identity;
  const fullName =
    [iden.primerNombre, iden.otrosNombres, iden.primerApellido, iden.segundoApellido]
      .filter(Boolean)
      .join(" ") || "CONTRIBUYENTE DECLARANTE";

  const nitCompleto = `${iden.nit || "Sin NIT"}${iden.dv ? `-${iden.dv}` : ""}`;
  const cas = c.casillas;

  const ingresosBrutosTotal =
    (cas[32] ?? 0) +
    (cas[43] ?? 0) +
    (cas[58] ?? 0) +
    (cas[74] ?? 0) +
    (cas[99] ?? 0) +
    (cas[104] ?? 0) +
    (cas[107] ?? 0) +
    (cas[108] ?? 0) +
    (cas[109] ?? 0) +
    (cas[112] ?? 0);

  const totalIncrngo =
    (cas[33] ?? 0) +
    (cas[44] ?? 0) +
    (cas[59] ?? 0) +
    (cas[76] ?? 0) +
    (cas[100] ?? 0) +
    (cas[105] ?? 0);

  const totalExentasDeducciones =
    (cas[92] ?? 0) + (cas[102] ?? 0) + (cas[110] ?? 0) + (cas[114] ?? 0);

  const retencionesTotal = (cas[132] ?? 0);
  const saldoPagar = c.saldoPagar;
  const saldoFavor = c.saldoFavor;

  function handlePrint() {
    window.print();
  }

  return createPortal(
    <div className="print-modal-container fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Estilos específicos de aislamiento de impresión para que NUNCA se monte el fondo */}
      <style>{`
        @media print {
          @page {
            size: portrait !important;
            margin: 10mm 12mm !important;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }
          #app,
          body > *:not(.print-modal-container) {
            display: none !important;
          }
          .print-modal-container {
            position: static !important;
            inset: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .print-modal-inner {
            position: static !important;
            max-width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          #informe-cliente-print {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #111827 !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>

      <div className="print-modal-inner relative w-full max-w-4xl rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
        {/* Barra superior de control (Oculta al imprimir) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 no-print">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-forest-mist text-forest">
              <FileText className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Informe Ejecutivo y Certificado para el Cliente
              </h3>
              <p className="text-xs text-muted">
                Documento oficial de entrega contable con dictamen, firmas y resumen tributario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-forest text-primary-fg hover:bg-forest-deep text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Printer className="size-3.5" />
              Imprimir / Guardar en PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingSignature((v) => !v)}
              className="text-xs border-line hover:bg-forest-mist"
            >
              {isEditingSignature ? "Guardar Firma" : "Editar Firma Contador"}
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-ink transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Panel de edición rápida de firma (Solo en pantalla) */}
        {isEditingSignature && (
          <div className="mt-4 p-4 rounded-xl bg-forest-mist/40 border border-forest/30 space-y-3 no-print">
            <p className="text-xs font-semibold text-forest">Datos del Contador / Asesor para la firma:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-ink">Nombre del Contador / Firma:</label>
                <input
                  type="text"
                  value={contadorName}
                  onChange={(e) => setContadorName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1 text-xs text-ink"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-ink">Tarjeta Profesional / NIT:</label>
                <input
                  type="text"
                  value={tarjetaProf}
                  onChange={(e) => setTarjetaProf(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1 text-xs text-ink"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CUERPO DEL CERTIFICADO EJECUTIVO (IMPRIMIBLE)
            ========================================================================= */}
        <div id="informe-cliente-print" className="mt-6 space-y-6 text-ink">
          {/* Membrete y Título */}
          <div className="border-b-2 border-forest pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest block">
                REPÚBLICA DE COLOMBIA · SISTEMA TRIBUTARIO NACIONAL
              </span>
              <h2 className="font-display text-2xl font-bold text-ink">
                INFORME DE LIQUIDACIÓN Y DICTAMEN PRIVADO
              </h2>
              <p className="text-xs text-muted font-medium mt-0.5">
                Declaración de Renta y Complementarios Personas Naturales · Formulario 210 DIAN
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-line sm:pl-4">
              <span className="font-mono text-xs font-bold text-forest block">AÑO GRAVABLE {c.year}</span>
              <span className="text-[11px] text-muted block">Presentación AG {c.filingYear}</span>
              <span className="text-[11px] text-muted block">Fecha: {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>

          {/* 1. Datos Generales del Contribuyente */}
          <div className="rounded-xl border border-line bg-bg-raised p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 mb-2.5">
              <Building2 className="size-3.5" /> 1. Identificación del Declarante
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted uppercase block">Contribuyente</span>
                <strong className="font-semibold text-ink">{fullName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase block">NIT / Cédula</span>
                <strong className="font-mono font-semibold text-ink">{nitCompleto}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase block">Seccional DIAN</span>
                <span className="font-medium text-ink">{iden.dirSeccional || "Barranquilla (02)"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase block">Actividad CIIU</span>
                <span className="font-medium text-ink">{iden.actividadCiiu || "0010 - Asalariado"}</span>
              </div>
            </div>
          </div>

          {/* 2. Cuadro Resumen Patrimonial y Financiero */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 mb-2">
              <Coins className="size-3.5" /> 2. Conciliación Patrimonial (Arts. 261 a 283 E.T.)
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-surface p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted block">Patrimonio Bruto (Cas. 29)</span>
                <p className="text-base sm:text-lg font-bold font-mono text-ink mt-0.5">{formatCOP(cas[29] || 0)}</p>
                <span className="text-[10px] text-muted">Bancos, inmuebles y vehículos</span>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted block">Deudas y Pasivos (Cas. 30)</span>
                <p className="text-base sm:text-lg font-bold font-mono text-red-700 mt-0.5">{formatCOP(cas[30] || 0)}</p>
                <span className="text-[10px] text-muted">Soportados con extractos bancarios</span>
              </div>
              <div className="rounded-xl border border-forest/40 bg-forest-mist/30 p-3">
                <span className="text-[10px] uppercase tracking-wider text-forest block font-semibold">Patrimonio Líquido (Cas. 31)</span>
                <p className="text-base sm:text-lg font-bold font-mono text-forest mt-0.5">{formatCOP(cas[31] || 0)}</p>
                <span className="text-[10px] text-muted">Base patrimonial neta</span>
              </div>
            </div>
          </div>

          {/* 3. Depuración Cedular y Liquidación del Impuesto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 mb-2">
              <ShieldCheck className="size-3.5" /> 3. Depuración de Ingresos y Determinación del Impuesto
            </h4>
            <div className="overflow-hidden rounded-xl border border-line bg-surface text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-line">
                  <tr className="bg-bg-raised/50">
                    <td className="p-2.5 font-medium">Total Ingresos Brutos del Año</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{formatCOP(ingresosBrutosTotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-muted">(−) Aportes a Salud y Pensión obligatorios (No gravados)</td>
                    <td className="p-2.5 text-right font-mono text-muted">− {formatCOP(totalIncrngo)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-muted">(−) Rentas Exentas y Deducciones (25% laboral, dependientes y medicina)</td>
                    <td className="p-2.5 text-right font-mono text-muted">− {formatCOP(totalExentasDeducciones)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-muted">(−) Deducción Especial 1% Factura Electrónica (Casilla 28 · Art. 336-5)</td>
                    <td className="p-2.5 text-right font-mono text-muted">− {formatCOP(cas[28] || 0)}</td>
                  </tr>
                  <tr className="bg-forest-mist/20 font-semibold text-forest">
                    <td className="p-2.5">Renta Líquida Gravable (Casilla 97)</td>
                    <td className="p-2.5 text-right font-mono">{formatCOP(c.rentaLiquidaGravable)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Impuesto Neto sobre la Renta (Casilla 126 · Tarifa Art. 241 E.T.)</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatCOP(c.impuestoNeto)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-muted">(+) Anticipo de Renta para el Año Siguiente (Casilla 133 · Art. 807 E.T.)</td>
                    <td className="p-2.5 text-right font-mono text-muted">+ {formatCOP(cas[133] || 0)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-muted">(−) Retenciones en la Fuente que le practicaron a favor (Casilla 132)</td>
                    <td className="p-2.5 text-right font-mono text-muted">− {formatCOP(retencionesTotal)}</td>
                  </tr>
                  <tr className={`font-bold text-sm ${saldoPagar > 0 ? "bg-red-50 text-red-900" : saldoFavor > 0 ? "bg-emerald-50 text-emerald-900" : "bg-bg-raised text-forest"}`}>
                    <td className="p-3">
                      {saldoPagar > 0 ? "TOTAL SALDO A PAGAR (Casilla 136)" : saldoFavor > 0 ? "TOTAL SALDO A FAVOR (Casilla 137)" : "VALOR TOTAL A PAGAR (Casilla 980)"}
                    </td>
                    <td className="p-3 text-right font-mono text-base">
                      {formatCOP(saldoPagar || saldoFavor || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Dictamen y Conclusión del Asesor Tributario */}
          <div className="rounded-xl border border-line bg-bg-raised p-4 text-xs space-y-1.5 leading-relaxed">
            <h5 className="font-bold uppercase tracking-wider text-forest flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Dictamen y Fundamento Jurídico:
            </h5>
            <p className="text-ink/90">
              {c.impuestoNeto === 0 ? (
                <>
                  La liquidación privada del contribuyente <strong>{fullName}</strong> para el Año Gravable {c.year} arrojó una base gravable de <strong>0 UVT</strong> en el tramo exento de la tabla progresiva del Art. 241 del Estatuto Tributario. En consecuencia, el <strong>Impuesto Neto de Renta es de $ 0</strong> y no se genera valor a pagar por concepto de impuesto básico.
                </>
              ) : (
                <>
                  El contribuyente <strong>{fullName}</strong> presenta una Renta Líquida Gravable de <strong>{formatUvt(uvtFromPesos(c.rentaLiquidaGravable, c.year, d.uvtOverrides))}</strong> gravada según los tramos de la Ley 2277 de 2022, resultando un impuesto neto de <strong>{formatCOP(c.impuestoNeto)}</strong>.
                </>
              )}
            </p>
            <p className="text-[11px] text-muted">
              * Los valores patrimoniales, pasivos y deducciones fueron conciliados con base en los certificados tributarios, extractos bancarios y reporte oficial de Información Exógena de la DIAN.
            </p>
          </div>

          {/* 5. Bloque de Firmas Oficiales */}
          <div className="grid grid-cols-2 gap-8 pt-10 border-t border-line">
            <div className="text-center space-y-1">
              <div className="border-b border-ink/40 w-4/5 mx-auto mb-2 h-10" />
              <strong className="text-xs font-bold text-ink block">{fullName}</strong>
              <span className="text-[10px] text-muted block font-mono">NIT / C.C. {nitCompleto}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Firma del Contribuyente</span>
            </div>

            <div className="text-center space-y-1">
              <div className="border-b border-ink/40 w-4/5 mx-auto mb-2 h-10" />
              <strong className="text-xs font-bold text-ink block">{contadorName}</strong>
              <span className="text-[10px] text-muted block font-mono">{tarjetaProf}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Contador Público / Asesor Tributario</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
