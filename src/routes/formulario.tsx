import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Download, FileCode, FileSpreadsheet, FileText, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfficialDian210 } from "@/components/tax/official-dian-210";
import { InformeClienteModal } from "@/components/tax/informe-cliente-modal";
import { useAppStore, useComputed } from "@/lib/store";
import {
  downloadFile,
  downloadStyledFormulario210Xlsx,
  downloadXlsxFile,
  generateFormulario210Csv,
  generateFormulario210Workbook,
  generateFormulario210Xml,
} from "@/lib/tax/export-dian";
import { downloadOfficialDian210Pdf } from "@/lib/tax/export-dian-pdf";
import { formatCOP, formatNumber } from "@/lib/tax/format";

export const Route = createFileRoute("/formulario")({ component: FormularioPage });

function FormularioPage() {
  const [informeOpen, setInformeOpen] = useState(false);
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const id = d.identity;

  async function exportXlsx() {
    const filename = `formulario-210-oficial-ag${d.year}-${id.nit || "dian"}.xlsx`;
    try {
      await downloadStyledFormulario210Xlsx(filename, d, c);
    } catch {
      const wb = generateFormulario210Workbook(d, c);
      downloadXlsxFile(filename, wb);
    }
  }

  function exportXml() {
    const xml = generateFormulario210Xml(d, c);
    downloadFile(`declaracion-210-ag${d.year}-${id.nit || "dian"}.xml`, xml, "application/xml");
  }

  function exportCsv() {
    const csv = generateFormulario210Csv(d, c);
    downloadFile(`formulario-210-ag${d.year}-${id.nit || "dian"}.csv`, csv, "text/csv");
  }

  function exportJson() {
    const jsonStr = JSON.stringify({ identity: id, casillas: c.casillas, year: d.year }, null, 2);
    downloadFile(`tributoapp-210-ag${d.year}-${id.nit || "dian"}.json`, jsonStr, "application/json");
  }

  function exportPdfOfficial() {
    downloadOfficialDian210Pdf(`Formulario_210_Oficial_AG${d.year}_${id.nit || "DIAN"}.pdf`, d, c);
  }

  return (
    <div className="space-y-6 pb-12 print:space-y-0 print:p-0 print:m-0">
      {/* Encabezado Principal */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4 print:hidden no-print" data-print-hide>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/declaracion"
              className="inline-flex items-center text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
            >
              <ArrowLeft className="mr-1 size-3.5" /> Volver a Cédulas de Trabajo
            </Link>
            <span className="text-muted">·</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              DIAN MUISCA Oficial · AG {d.year}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Formulario Oficial 210 DIAN
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted">
            Declaración de Renta y Complementario para Personas Naturales Residentes. Formato fiel e interactivo con casillas oficiales, fundamento legal del Estatuto Tributario y exportación a Excel, XML y PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            onClick={exportPdfOfficial}
            className="bg-forest hover:bg-forest-deep text-white text-xs font-semibold shadow-xs"
            title="Descargar el PDF Oficial 1:1 de 1 sola página del Formulario 210 DIAN"
          >
            <FileText className="mr-1.5 size-4" />
            Descargar PDF Oficial 210
          </Button>
          <Button
            variant="secondary"
            onClick={() => setInformeOpen(true)}
            className="text-xs font-semibold border border-line"
            title="Generar informe ejecutivo membretado con dictamen y firmas para entregar al cliente"
          >
            <FileText className="mr-1.5 size-4 text-forest" />
            Informe Cliente
          </Button>
          <Button
            variant="secondary"
            onClick={exportXlsx}
            className="text-xs font-semibold border border-line"
            title="Descargar Formulario 210 en Excel (.xlsx) estructurado con fórmulas oficiales"
          >
            <FileSpreadsheet className="mr-1.5 size-4 text-forest" />
            Excel (.xlsx)
          </Button>
          <Button
            variant="secondary"
            onClick={exportXml}
            className="text-xs"
            title="Exportar archivo XML oficial compatible con el prevalidador de la DIAN"
          >
            <FileCode className="mr-1.5 size-4 text-forest" />
            XML DIAN
          </Button>
          <Button
            variant="outline"
            onClick={exportCsv}
            className="text-xs"
            title="Descargar archivo CSV compatible con Excel"
          >
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportJson}
            className="text-xs"
            title="Exportar respaldo de casillas en formato JSON"
          >
            <Download className="mr-1.5 size-3.5" />
            JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="text-xs"
            title="Imprimir o vista previa del Formulario 210 en 1 sola hoja vertical"
          >
            <Printer className="mr-1.5 size-3.5" />
            Imprimir 210
          </Button>
        </div>
      </header>

      {/* Modal del Informe Ejecutivo para el Cliente */}
      <InformeClienteModal
        isOpen={informeOpen}
        onClose={() => setInformeOpen(false)}
        computed={c}
        declaration={d}
      />

      {/* Resumen Superior Rápido */}
      <div
        data-print-hide
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border border-line bg-surface p-4 shadow-xs text-xs print:hidden no-print"
      >
        <div>
          <span className="text-muted">Patrimonio Líquido (31):</span>
          <p className="font-mono text-sm font-bold text-ink">{formatCOP(c.casillas[31] ?? 0)}</p>
        </div>
        <div>
          <span className="text-muted">Renta Líquida Gravable (97):</span>
          <p className="font-mono text-sm font-bold text-ink">{formatCOP(c.rentaLiquidaGravable ?? 0)}</p>
        </div>
        <div>
          <span className="text-muted">Total Impuesto a Cargo (129):</span>
          <p className="font-mono text-sm font-bold text-forest">{formatCOP(c.impuestoCargo ?? 0)}</p>
        </div>
        <div>
          <span className="text-muted">
            {c.saldoPagar > 0 ? "Total Saldo a Pagar (136):" : "Total Saldo a Favor (137):"}
          </span>
          <p
            className={`font-mono text-sm font-bold ${
              c.saldoPagar > 0 ? "text-stamp font-black" : "text-forest font-black"
            }`}
          >
            {formatCOP(c.saldoPagar || c.saldoFavor)}
          </p>
        </div>
      </div>

      {/* Componente Central del Formulario Oficial DIAN 210 */}
      <div className="dian-form-wrapper w-full print:w-full print:m-0 print:p-0">
        <OfficialDian210 />
      </div>

      {/* Información Legal y Control de Recaudo */}
      <div className="rounded-2xl border border-line bg-surface p-4 text-xs text-muted space-y-1 print:hidden no-print" data-print-hide>
        <div className="flex items-center gap-2 text-ink font-semibold">
          <ShieldCheck className="size-4 text-forest" />
          <span>Cumplimiento Legal y Verificación Formal DIAN</span>
        </div>
        <p>
          Las casillas 1 a 141 son calculadas y consolidadas en estricta conformidad con la Ley 2277 de 2022, el Estatuto Tributario Nacional (E.T.) y las directrices del sistema MUISCA de la DIAN.
        </p>
        <p className="text-[11px] text-faint">
          Espacios 980–997 corresponden a las firmas del declarante, contador público (si el patrimonio o ingresos superan {formatNumber(100000)} UVT) y control de la entidad recaudadora.
        </p>
      </div>
    </div>
  );
}

