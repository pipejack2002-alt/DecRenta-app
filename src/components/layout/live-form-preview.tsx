import {
  FileCode,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfficialDian210 } from "@/components/tax/official-dian-210";
import { useAppStore, useComputed } from "@/lib/store";
import {
  downloadFile,
  downloadXlsxFile,
  generateFormulario210Csv,
  generateFormulario210Workbook,
  generateFormulario210Xml,
} from "@/lib/tax/export-dian";
import { formatCOP } from "@/lib/tax/format";

export function LiveFormPreview({
  isModal = false,
  onClose,
}: {
  isModal?: boolean;
  onClose?: () => void;
}) {
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const id = d.identity;
  const [fullscreen, setFullscreen] = useState(false);

  const name =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "Contribuyente Persona Natural";

  function exportXlsx() {
    const wb = generateFormulario210Workbook(d, c);
    downloadXlsxFile(`formulario-210-oficial-ag${d.year}-${id.nit || "dian"}.xlsx`, wb);
  }

  function exportXml() {
    const xml = generateFormulario210Xml(d, c);
    downloadFile(`declaracion-210-ag${d.year}-${id.nit || "dian"}.xml`, xml, "application/xml");
  }

  function exportCsv() {
    const csv = generateFormulario210Csv(d, c);
    downloadFile(`formulario-210-ag${d.year}-${id.nit || "dian"}.csv`, csv, "text/csv");
  }

  return (
    <div
      className={
        isModal
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
          : "h-full w-full overflow-hidden rounded-2xl border-2 border-forest/20 bg-surface shadow-lg flex flex-col"
      }
    >
      <div
        className={
          isModal
            ? `relative flex flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl border border-line ${
                fullscreen ? "h-[98vh] w-[98vw]" : "max-h-[92vh] w-full max-w-6xl"
              }`
            : "flex h-full flex-col overflow-hidden"
        }
      >
        {/* Barra superior de control */}
        <div className="border-b border-line bg-bg-raised px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-forest animate-pulse" />
            <Badge tone="forest" className="font-mono text-[10px] uppercase tracking-wider">
              210 DIAN OFICIAL
            </Badge>
            <span className="font-display text-sm font-bold text-ink truncate max-w-[200px] sm:max-w-[360px]">
              AG {d.year} · {name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="default"
              onClick={exportXlsx}
              title="Descargar Formulario 210 en Excel (.xlsx) estructurado"
              className="h-8 bg-forest hover:bg-forest-deep text-white text-xs font-semibold px-2.5"
            >
              <FileSpreadsheet className="size-3.5 mr-1" />
              Excel (.xlsx)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportXml}
              title="Descargar XML Prevalidador"
              className="h-8 px-2 text-xs"
            >
              <FileCode className="size-3.5 mr-1 text-forest" />
              XML
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCsv}
              title="Descargar CSV Excel"
              className="h-8 px-2 text-xs"
            >
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              title="Imprimir / PDF Oficial"
              className="h-8 px-2 text-xs"
            >
              <Printer className="size-3.5" />
            </Button>
            {isModal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreen((f) => !f)}
                title={fullscreen ? "Restaurar tamaño" : "Pantalla completa"}
                className="h-8 px-2 text-xs text-muted hover:text-ink"
              >
                {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </Button>
            )}
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink ml-1 transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido scrolleable con el Formulario Oficial DIAN */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#f3eee4]/60">
          <OfficialDian210 hideHeaderActions={false} compact={!isModal} />
        </div>

        {/* Barra inferior de resumen de saldos */}
        <div className="border-t border-line bg-surface px-4 py-2.5 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted">Patrimonio Líquido: </span>
              <span className="font-mono font-bold text-ink">{formatCOP(c.casillas[31] ?? 0)}</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-muted">Renta Líquida Gravable: </span>
              <span className="font-mono font-bold text-ink">{formatCOP(c.rentaLiquidaGravable ?? 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">
              {c.saldoPagar > 0 ? "Total a Pagar (136):" : "Total a Favor (137):"}
            </span>
            <span
              className={`font-mono text-base font-extrabold tabular-nums ${
                c.saldoPagar > 0 ? "text-stamp" : "text-forest"
              }`}
            >
              {formatCOP(c.saldoPagar || c.saldoFavor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

