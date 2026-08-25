import {
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore, useComputed } from "@/lib/store";
import {
  CASILLAS_OFICIALES_210,
  downloadFile,
  downloadXlsxFile,
  generateFormulario210Csv,
  generateFormulario210Workbook,
  generateFormulario210Xml,
} from "@/lib/tax/export-dian";
import { formatCOP, formatNumber } from "@/lib/tax/format";

interface OfficialDian210Props {
  compact?: boolean;
  hideHeaderActions?: boolean;
  className?: string;
}

export function OfficialDian210({
  compact = false,
  hideHeaderActions = false,
  className = "",
}: OfficialDian210Props) {
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const id = d.identity;

  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState<number>(compact ? 85 : 100);
  const [selectedCasilla, setSelectedCasilla] = useState<number | null>(null);

  const fullName =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "CONTRIBUYENTE PERSONA NATURAL";

  const normalizedQuery = searchQuery.toLowerCase().trim();

  // Helper para formatear valor de casilla en el PDF exacto
  function v(num: number): string {
    const val = c.casillas[num];
    if (val === undefined || val === null || (val === 0 && num !== 140)) return "";
    if (num === 140) return val ? "X" : "";
    return formatNumber(Math.round(val));
  }

  function isMatch(num: number): boolean {
    if (!normalizedQuery) return false;
    const meta = CASILLAS_OFICIALES_210.find((x) => x.num === num);
    return (
      String(num).includes(normalizedQuery) ||
      (meta?.label.toLowerCase().includes(normalizedQuery) ?? false)
    );
  }

  // Export handlers
  function handleExportXlsx() {
    const wb = generateFormulario210Workbook(d, c);
    const filename = `Formulario_210_AG${d.year}_${id.nit || "DIAN"}.xlsx`;
    downloadXlsxFile(filename, wb);
  }

  function handleExportXml() {
    const xml = generateFormulario210Xml(d, c);
    downloadFile(`declaracion-210-ag${d.year}-${id.nit || "dian"}.xml`, xml, "application/xml");
  }

  function handleExportCsv() {
    const csv = generateFormulario210Csv(d, c);
    downloadFile(`formulario-210-ag${d.year}-${id.nit || "dian"}.csv`, csv, "text/csv");
  }

  function Cell({
    num,
    className = "",
  }: {
    num: number;
    className?: string;
  }) {
    const valStr = v(num);
    const highlighted = isMatch(num);
    const meta = CASILLAS_OFICIALES_210.find((x) => x.num === num);

    return (
      <div
        onClick={() => setSelectedCasilla(num)}
        title={meta ? `Casilla ${num}: ${meta.label} (${meta.legal})` : `Casilla ${num}`}
        className={`relative flex items-center justify-end px-1.5 py-0.5 cursor-pointer font-mono text-[11px] leading-none transition-colors select-text ${
          highlighted
            ? "bg-[#ffeb99] ring-2 ring-amber-500 z-10 font-bold"
            : valStr
              ? "bg-white text-black font-semibold"
              : "bg-white text-transparent"
        } ${className}`}
      >
        <span className="absolute left-1 top-0.5 font-sans text-[8px] text-gray-500 select-none pointer-events-none">
          {num}
        </span>
        <span className="tabular-nums text-right w-full pl-4 truncate">{valStr || "—"}</span>
      </div>
    );
  }

  const requiereContador = (c.casillas[29] ?? 0) >= c.uvt * 100000 || id.llevaLibros;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de Herramientas y Acciones */}
      {!hideHeaderActions && (
        <div
          data-print-hide
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 shadow-xs"
        >
          {/* Búsqueda y Zoom */}
          <div className="flex flex-1 items-center gap-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar casilla en el PDF oficial (ej: 32, 97, patrimonio, retenciones)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-line bg-bg-raised pl-9 pr-8 text-xs text-ink focus:border-forest focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-muted hover:text-ink"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1 border-l border-line pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setZoomLevel((z) => Math.max(65, z - 10))}
                title="Reducir escala"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <span className="font-mono text-[11px] text-muted w-10 text-center">
                {zoomLevel}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                title="Aumentar escala"
              >
                <ZoomIn className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Botones de Exportación */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportXlsx}
              className="h-8 bg-forest hover:bg-forest-deep text-white text-xs font-semibold shadow-xs"
              title="Descargar Formulario 210 en Excel (.xlsx) estructurado"
            >
              <FileSpreadsheet className="mr-1.5 size-3.5" />
              Descargar Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportXml}
              className="h-8 text-xs"
              title="Descargar archivo XML oficial para el Prevalidador DIAN"
            >
              <FileCode className="mr-1.5 size-3.5 text-forest" />
              XML DIAN
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs"
              title="Descargar archivo CSV compatible con Excel"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs"
              title="Imprimir o exportar PDF idéntico al oficial de la DIAN"
            >
              <Printer className="mr-1.5 size-3.5" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENEDOR DEL FORMULARIO 210 (RÉPLICA EXACTA DEL Formulario_210_2024.pdf)
          ========================================================================= */}
      <div className="overflow-x-auto rounded-xl border border-gray-400 bg-gray-100 p-2 sm:p-6 shadow-2xl flex justify-center">
        <div
          id="dian-form-pdf-container"
          className="relative bg-white text-black border border-black shadow-md origin-top select-text"
          style={{
            width: "980px",
            minWidth: "980px",
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : "none",
            transformOrigin: "top center",
            marginBottom: zoomLevel < 100 ? `-${(100 - zoomLevel) * 11}px` : zoomLevel > 100 ? `${(zoomLevel - 100) * 11}px` : "0",
            fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
          }}
        >
          {/* Marca de agua de fondo */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] overflow-hidden">
            <svg viewBox="0 0 500 500" className="w-[850px] h-[850px] text-black fill-current">
              <circle cx="250" cy="250" r="230" fill="none" stroke="currentColor" strokeWidth="8" />
              <path d="M250 50 A200 200 0 0 1 450 250 A200 200 0 0 1 250 450 A200 200 0 0 1 50 250 A200 200 0 0 1 250 50 Z" fill="none" stroke="currentColor" strokeWidth="6" />
              <text x="250" y="270" textAnchor="middle" fontSize="48" fontWeight="bold" letterSpacing="4">DIAN · 210</text>
            </svg>
          </div>

          {/* ———————————————————————————————————————————————————————————
              1. ENCABEZADO OFICIAL DIAN (Idéntico a Formulario_210_2024.pdf)
              ——————————————————————————————————————————————————————————— */}
          <div className="grid grid-cols-12 border-b border-black">
            {/* Logo DIAN y Casilla 1 */}
            <div className="col-span-3 border-r border-black p-2 flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                {/* Logotipo DIAN con letras contorneadas */}
                <div className="font-sans text-3xl font-black tracking-tighter text-black flex items-baseline">
                  <span>d</span>
                  <span className="text-[#2D6187]">i</span>
                  <span>an</span>
                </div>
              </div>
              <div className="mt-2 text-[9px] leading-tight">
                <span className="font-bold">1. Año:</span>
                <span className="ml-2 font-mono text-sm font-black">{d.year}</span>
                <p className="text-[8px] text-gray-500 mt-1">Espacio reservado para la DIAN</p>
              </div>
            </div>

            {/* Título Central y Casilla 4 */}
            <div className="col-span-7 border-r border-black p-2 flex flex-col justify-between text-center">
              <h1 className="font-sans text-[13px] font-bold uppercase tracking-tight leading-snug px-4">
                Declaración de renta y complementario personas naturales y asimiladas residentes y sucesiones ilíquidas de causantes residentes
              </h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
                <span className="font-bold">4. Número de formulario:</span>
                <span className="font-mono font-bold text-xs bg-gray-50 px-2 py-0.5 border border-gray-300">
                  210{d.year}000{id.nit ? id.nit.slice(-5) : "41029"}
                </span>
              </div>
            </div>

            {/* Caja Azul Oficial 210 */}
            <div className="col-span-2 bg-[#2D6187] text-white flex items-center justify-center p-2">
              <span className="font-sans text-5xl font-black tracking-normal">
                210
              </span>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              2. DATOS DEL DECLARANTE (Casillas 5 a 28)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[10px]">
            {/* Fila NIT, DV, Nombres y Seccional */}
            <div className="flex border-b border-black">
              <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[7.5px] font-bold tracking-tight text-gray-700 py-1">
                  Datos del declarante
                </span>
              </div>

              <div className="flex-1 grid grid-cols-12 divide-x divide-black">
                <div className="col-span-3 p-1">
                  <span className="block text-[8px] text-gray-600">5. Número de Identificación Tributaria (NIT)</span>
                  <span className="font-mono font-bold text-xs">{id.nit || "—"}</span>
                </div>
                <div className="col-span-1 p-1 text-center">
                  <span className="block text-[8px] text-gray-600">6.DV</span>
                  <span className="font-mono font-bold text-xs">{id.dv || "0"}</span>
                </div>
                <div className="col-span-2 p-1">
                  <span className="block text-[8px] text-gray-600">7. Primer apellido</span>
                  <span className="font-semibold uppercase text-[11px] truncate block">{id.primerApellido || "—"}</span>
                </div>
                <div className="col-span-2 p-1">
                  <span className="block text-[8px] text-gray-600">8. Segundo apellido</span>
                  <span className="font-semibold uppercase text-[11px] truncate block">{id.segundoApellido || "—"}</span>
                </div>
                <div className="col-span-2 p-1">
                  <span className="block text-[8px] text-gray-600">9. Primer nombre</span>
                  <span className="font-semibold uppercase text-[11px] truncate block">{id.primerNombre || "—"}</span>
                </div>
                <div className="col-span-1 p-1">
                  <span className="block text-[8px] text-gray-600">10. Otros</span>
                  <span className="font-semibold uppercase text-[11px] truncate block">{id.otrosNombres || "—"}</span>
                </div>
                <div className="col-span-1 p-1 text-center">
                  <span className="block text-[7.5px] text-gray-600 leading-none">12.Cód.Secc</span>
                  <span className="font-mono font-bold text-xs">{id.dirSeccional || "32"}</span>
                </div>
              </div>
            </div>

            {/* Fila Actividad CIIU, Correcciones y Casilla 28 */}
            <div className="grid grid-cols-12 divide-x divide-black bg-[#f4f7f9]">
              <div className="col-span-3 p-1">
                <span className="block text-[8px] text-gray-600">24. Actividad económica principal</span>
                <span className="font-mono font-bold text-xs">{id.actividadCiiu || "0010"}</span>
              </div>
              <div className="col-span-1 p-1 text-center">
                <span className="block text-[7.5px] text-gray-600 leading-none">25. Cód</span>
                <span className="font-mono font-bold text-xs">{id.esCorreccion ? "1" : "—"}</span>
              </div>
              <div className="col-span-3 p-1">
                <span className="block text-[8px] text-gray-600">26. No. Formulario anterior</span>
                <span className="font-mono text-xs">{id.formAnterior || "—"}</span>
              </div>
              <div className="col-span-2 p-1 text-center">
                <span className="block text-[7.5px] text-gray-600 leading-none">27. Fracción año gravable sig.</span>
                <span className="font-semibold text-xs">NO</span>
              </div>
              <div className="col-span-3 p-1 bg-white flex items-center justify-between">
                <span className="text-[7.5px] text-gray-700 leading-tight">
                  28. Uno por ciento (1%) de compras con factura electrónica
                </span>
                <Cell num={28} className="w-24 border border-gray-300" />
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              3. SECCIÓN PATRIMONIO (Casillas 29 a 31)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black bg-[#dbe7f0] text-[10px] font-bold">
            <div className="grid grid-cols-12 divide-x divide-black items-center">
              <div className="col-span-2 px-2 py-1 uppercase text-black font-extrabold tracking-wide">
                Patrimonio
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-0.5 bg-white">
                <span className="text-[9px] font-normal">Total patrimonio bruto</span>
                <Cell num={29} className="w-28 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-0.5 bg-white">
                <span className="text-[9px] font-normal">Deudas</span>
                <Cell num={30} className="w-28 border border-gray-300" />
              </div>
              <div className="col-span-4 flex items-center justify-between px-2 py-0.5 bg-[#eaf1f7]">
                <span className="text-[9px] font-bold">Total patrimonio líquido</span>
                <Cell num={31} className="w-32 border border-black font-bold" />
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              4. CÉDULA GENERAL: TABLA MULTICOLUMNA (32 a 90)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[9.5px]">
            <div className="flex">
              {/* Etiqueta vertical izquierda: Cédula General */}
              <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[8px] font-bold uppercase tracking-wider text-gray-800 py-4">
                  Cédula general
                </span>
              </div>

              {/* Contenedor de la Matriz Cedular */}
              <div className="flex-1">
                {/* Cabecera de Columnas */}
                <div className="grid grid-cols-12 border-b border-black bg-[#dbe7f0] text-[9px] font-bold text-center divide-x divide-black">
                  <div className="col-span-4 p-1 text-left pl-2">Conceptos/rentas</div>
                  <div className="col-span-2 p-1">Rentas de trabajo</div>
                  <div className="col-span-2 p-1 leading-tight">
                    Rentas de trabajo que no provengan de una relación laboral
                  </div>
                  <div className="col-span-2 p-1">Rentas de capital</div>
                  <div className="col-span-2 p-1">Rentas no laborales</div>
                </div>

                {/* Filas de la Cédula General */}
                <div className="divide-y divide-gray-300">
                  {/* Ingresos brutos */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Ingresos brutos</div>
                    <Cell num={32} className="col-span-2" />
                    <Cell num={43} className="col-span-2" />
                    <Cell num={58} className="col-span-2" />
                    <Cell num={74} className="col-span-2" />
                  </div>

                  {/* Devoluciones, rebajas y descuentos */}
                  <div className="grid grid-cols-12 divide-x divide-black bg-[#f4f4f4]">
                    <div className="col-span-4 px-2 py-0.5">Devoluciones, rebajas y descuentos</div>
                    <div className="col-span-2 bg-gray-100" />
                    <div className="col-span-2 bg-gray-100" />
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={75} className="col-span-2 bg-white" />
                  </div>

                  {/* Ingresos no constitutivos de renta */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Ingresos no constitutivos de renta</div>
                    <Cell num={33} className="col-span-2" />
                    <Cell num={44} className="col-span-2" />
                    <Cell num={59} className="col-span-2" />
                    <Cell num={76} className="col-span-2" />
                  </div>

                  {/* Costos y deducciones procedentes */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Costos y deducciones procedentes</div>
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={45} className="col-span-2" />
                    <Cell num={60} className="col-span-2" />
                    <Cell num={77} className="col-span-2" />
                  </div>

                  {/* Renta líquida */}
                  <div className="grid grid-cols-12 divide-x divide-black bg-[#eef4f8] font-semibold">
                    <div className="col-span-4 px-2 py-0.5">Renta líquida</div>
                    <Cell num={34} className="col-span-2 font-bold" />
                    <Cell num={46} className="col-span-2 font-bold" />
                    <Cell num={61} className="col-span-2 font-bold" />
                    <Cell num={78} className="col-span-2 font-bold" />
                  </div>

                  {/* Rentas líquidas pasivas - ECE */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Rentas líquidas pasivas - ECE</div>
                    <div className="col-span-2 bg-gray-100" />
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={62} className="col-span-2" />
                    <Cell num={79} className="col-span-2" />
                  </div>

                  {/* Bloque Rentas Exentas */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd] pl-4 italic">
                      • Aportes voluntarios AFC, FVP y AVC
                    </div>
                    <Cell num={35} className="col-span-2" />
                    <Cell num={47} className="col-span-2" />
                    <Cell num={63} className="col-span-2" />
                    <Cell num={80} className="col-span-2" />
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd] pl-4 italic">
                      • Otras rentas exentas
                    </div>
                    <Cell num={36} className="col-span-2" />
                    <Cell num={48} className="col-span-2" />
                    <Cell num={64} className="col-span-2" />
                    <Cell num={81} className="col-span-2" />
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-black bg-[#f0f5f9] font-medium">
                    <div className="col-span-4 px-2 py-0.5 pl-2 font-semibold">Total rentas exentas</div>
                    <Cell num={37} className="col-span-2" />
                    <Cell num={49} className="col-span-2" />
                    <Cell num={65} className="col-span-2" />
                    <Cell num={82} className="col-span-2" />
                  </div>

                  {/* Bloque Deducciones Imputables */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd] pl-4 italic">
                      • Intereses de vivienda
                    </div>
                    <Cell num={38} className="col-span-2" />
                    <Cell num={50} className="col-span-2" />
                    <Cell num={66} className="col-span-2" />
                    <Cell num={83} className="col-span-2" />
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd] pl-4 italic">
                      • Otras deducciones imputables
                    </div>
                    <Cell num={39} className="col-span-2" />
                    <Cell num={51} className="col-span-2" />
                    <Cell num={67} className="col-span-2" />
                    <Cell num={84} className="col-span-2" />
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-black bg-[#f0f5f9] font-medium">
                    <div className="col-span-4 px-2 py-0.5 pl-2 font-semibold">Total deducciones imputables</div>
                    <Cell num={40} className="col-span-2" />
                    <Cell num={52} className="col-span-2" />
                    <Cell num={68} className="col-span-2" />
                    <Cell num={85} className="col-span-2" />
                  </div>

                  {/* Rentas exentas y/o deduc. imputables (Limitadas) */}
                  <div className="grid grid-cols-12 divide-x divide-black bg-[#e9f0f6] font-semibold">
                    <div className="col-span-4 px-2 py-0.5">
                      Rentas exentas y/o deduc. imputables (Limitadas)
                    </div>
                    <Cell num={41} className="col-span-2" />
                    <Cell num={53} className="col-span-2" />
                    <Cell num={69} className="col-span-2" />
                    <Cell num={86} className="col-span-2" />
                  </div>

                  {/* Renta líquida ordinaria del ejercicio */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Renta líquida ordinaria del ejercicio</div>
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={54} className="col-span-2" />
                    <Cell num={70} className="col-span-2" />
                    <Cell num={87} className="col-span-2" />
                  </div>

                  {/* Pérdida líquida del ejercicio */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Pérdida líquida del ejercicio</div>
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={55} className="col-span-2" />
                    <Cell num={71} className="col-span-2" />
                    <Cell num={88} className="col-span-2" />
                  </div>

                  {/* Compensaciones por pérdidas */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Compensaciones por pérdidas</div>
                    <div className="col-span-2 bg-gray-100" />
                    <Cell num={56} className="col-span-2" />
                    <Cell num={72} className="col-span-2" />
                    <Cell num={89} className="col-span-2" />
                  </div>

                  {/* Renta líquida ordinaria */}
                  <div className="grid grid-cols-12 divide-x divide-black bg-[#dbe7f0] font-bold">
                    <div className="col-span-4 px-2 py-0.5">Renta líquida ordinaria</div>
                    <Cell num={42} className="col-span-2 font-bold" />
                    <Cell num={57} className="col-span-2 font-bold" />
                    <Cell num={73} className="col-span-2 font-bold" />
                    <Cell num={90} className="col-span-2 font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              5. DEPURACIÓN CÉDULA GENERAL (Casillas 91 a 98)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black bg-[#eef4f8] text-[9px]">
            <div className="grid grid-cols-12 divide-x divide-black border-b border-gray-300">
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Ren. líquida céd. gen.</span>
                <Cell num={91} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Ren. ex. y ded. imp. li.</span>
                <Cell num={92} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5 font-bold">
                <span>R. líq. ord. cédula gen.</span>
                <Cell num={93} className="w-24 border border-gray-300 font-bold" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Comp. pérdidas año 2018 y ant.</span>
                <Cell num={94} className="w-24 border border-gray-300" />
              </div>
            </div>

            <div className="grid grid-cols-12 divide-x divide-black">
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Comp. exc. ren. presuntiva</span>
                <Cell num={95} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Rentas gravables</span>
                <Cell num={96} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5 bg-[#dbe7f0] font-black">
                <span>R. líq. grav. cédula gen.</span>
                <Cell num={97} className="w-24 border border-black font-black" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-1.5 py-0.5">
                <span>Renta presuntiva</span>
                <Cell num={98} className="w-24 border border-gray-300" />
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              6. DIVISIÓN INFERIOR EN 2 COLUMNAS (PENSIONES/DIVIDENDOS/GO + LIQUIDACIÓN)
              ——————————————————————————————————————————————————————————— */}
          <div className="grid grid-cols-12 divide-x divide-black border-b border-black text-[9px]">
            {/* ==================== COLUMNA IZQUIERDA ==================== */}
            <div className="col-span-6 flex flex-col justify-between">
              {/* CÉDULA DE PENSIONES (99 a 103) */}
              <div className="border-b border-black">
                <div className="flex">
                  <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                    <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[7.5px] font-bold uppercase text-gray-700 py-1">
                      Cédula de pensiones
                    </span>
                  </div>
                  <div className="flex-1 divide-y divide-gray-300">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Ingresos brutos por rentas de pensiones del país y del exterior</span>
                      <Cell num={99} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Ingresos no constitutivos de renta</span>
                      <Cell num={100} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5 bg-[#f4f7f9]">
                      <span>Renta líquida</span>
                      <Cell num={101} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Rentas exentas de pensiones</span>
                      <Cell num={102} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5 bg-[#dbe7f0] font-bold">
                      <span>Renta líquida gravable cédula de pensiones</span>
                      <Cell num={103} className="w-24 border border-black font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CÉDULA DE DIVIDENDOS Y PARTICIPACIONES (104 a 111) */}
              <div className="border-b border-black">
                <div className="flex">
                  <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                    <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[7px] font-bold uppercase text-gray-700 py-2">
                      Cédula de dividendos y/o participaciones
                    </span>
                  </div>
                  <div className="flex-1 divide-y divide-gray-300">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Dividendos y participaciones año 2016 y anteriores, y otros</span>
                      <Cell num={104} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Ingresos no constitutivos de renta</span>
                      <Cell num={105} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5 bg-[#f4f7f9]">
                      <span>Renta líquida ordinaria año 2016 y anteriores</span>
                      <Cell num={106} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>1a. Subcédula años 2017 y siguientes numeral 3 art. 49 del E.T.</span>
                      <Cell num={107} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>2a. Subcédula años 2017 y siguientes parágrafo 2 art. 49 del E.T.</span>
                      <Cell num={108} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Dividendos y participaciones recibidas del exterior</span>
                      <Cell num={109} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Rentas exentas de la casilla 109</span>
                      <Cell num={110} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5 bg-[#dbe7f0] font-bold">
                      <span className="text-[8px] leading-tight">
                        Renta líquida gravable (Cédula general o Renta presuntiva, pensiones y dividendos art. 241)
                      </span>
                      <Cell num={111} className="w-24 border border-black font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* GANANCIAS OCASIONALES (112 a 115) */}
              <div>
                <div className="flex">
                  <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                    <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[7px] font-bold uppercase text-gray-700 py-1">
                      Ganancias ocasionales
                    </span>
                  </div>
                  <div className="flex-1 divide-y divide-gray-300">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Ingresos por ganancias ocasionales del país y del exterior</span>
                      <Cell num={112} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Costos por ganancias ocasionales</span>
                      <Cell num={113} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span>Ganancias ocasionales no gravadas y exentas</span>
                      <Cell num={114} className="w-24 border border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-0.5 bg-[#dbe7f0] font-bold">
                      <span>Ganancias ocasionales gravables</span>
                      <Cell num={115} className="w-24 border border-black font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== COLUMNA DERECHA: LIQUIDACIÓN PRIVADA ==================== */}
            <div className="col-span-6 flex">
              <div className="w-5 bg-gray-200 border-r border-black flex items-center justify-center">
                <span className="[writing-mode:vertical-lr] rotate-180 font-sans text-[8px] font-bold uppercase tracking-wider text-gray-800 py-4">
                  Liquidación privada
                </span>
              </div>

              <div className="flex-1 divide-y divide-gray-300 flex flex-col justify-between">
                {/* Sub-bloque Impuesto */}
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Cédula general, de pensiones y de dividendos y participaciones</span>
                  <Cell num={116} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Renta presuntiva, de pensiones y de dividendos y participaciones</span>
                  <Cell num={117} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Por dividendos y participaciones año 2017 y siguientes, 2a subcédula (Art. 240)</span>
                  <Cell num={118} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Por dividendos y participaciones año 2016</span>
                  <Cell num={119} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Por dividendos y participaciones recibidas del exterior</span>
                  <Cell num={120} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5 bg-[#eef4f8] font-bold">
                  <span>Total impuesto sobre las rentas líquidas gravables</span>
                  <Cell num={121} className="w-24 border border-black font-bold" />
                </div>

                {/* Sub-bloque Descuentos */}
                <div className="grid grid-cols-2 divide-x divide-black border-y border-black bg-[#f9fbfd]">
                  <div className="flex items-center justify-between px-1.5 py-0.5">
                    <span className="text-[8px]">Imp. pagados exterior</span>
                    <Cell num={122} className="w-16 border border-gray-300" />
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-0.5">
                    <span className="text-[8px]">Donaciones</span>
                    <Cell num={123} className="w-16 border border-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-black border-b border-black bg-[#f9fbfd]">
                  <div className="flex items-center justify-between px-1.5 py-0.5">
                    <span className="text-[8px]">Dividendos, partic. y otros</span>
                    <Cell num={124} className="w-16 border border-gray-300" />
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 bg-[#eef4f8] font-bold">
                    <span className="text-[8px]">Total desctos trib.</span>
                    <Cell num={125} className="w-16 border border-black font-bold" />
                  </div>
                </div>

                {/* Totales y Liquidación Final */}
                <div className="flex items-center justify-between px-2 py-0.5 font-semibold bg-[#f4f7f9]">
                  <span>Impuesto neto de renta</span>
                  <Cell num={126} className="w-24 border border-gray-300 font-bold" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Impuesto de ganancias ocasionales</span>
                  <Cell num={127} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Descuento por impuestos pagados en el exterior por ganancias ocasionales</span>
                  <Cell num={128} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5 bg-[#dbe7f0] font-black">
                  <span>Total impuesto a cargo</span>
                  <Cell num={129} className="w-24 border border-black font-black" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Anticipo renta liquidado año gravable anterior</span>
                  <Cell num={130} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Saldo a favor del año gravable anterior sin solicitud de devolución/compensación</span>
                  <Cell num={131} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Retenciones año gravable a declarar</span>
                  <Cell num={132} className="w-24 border border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span>Anticipo renta para el año gravable siguiente</span>
                  <Cell num={133} className="w-24 border border-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              7. TOTALES DE SALDO Y DATOS INFORMATIVOS (134 a 141)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[9.5px]">
            {/* Saldos y Sanciones */}
            <div className="grid grid-cols-12 divide-x divide-black border-b border-black bg-[#f4f7f9]">
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[9px]">Saldo a pagar por impuesto</span>
                <Cell num={134} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[9px]">Sanciones</span>
                <Cell num={135} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1 bg-[#fbeae8] font-black text-red-900">
                <span className="text-[9px]">Total saldo a pagar</span>
                <Cell num={136} className="w-24 border border-red-800 font-black text-red-950" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1 bg-[#eaf4ee] font-black text-[#00573F]">
                <span className="text-[9px]">Total saldo a favor</span>
                <Cell num={137} className="w-24 border border-[#00573F] font-black text-[#00573F]" />
              </div>
            </div>

            {/* Datos Informativos (138 a 141) */}
            <div className="grid grid-cols-12 divide-x divide-black bg-white">
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[8.5px]">Número de dependientes económicos</span>
                <Cell num={138} className="w-16 border border-gray-300 text-center" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[8.5px]">Adición dependientes a casilla 92</span>
                <Cell num={139} className="w-24 border border-gray-300" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[8px] leading-tight">Ud. superó tope indicativo art. 336-1 E.T., marque X</span>
                <Cell num={140} className="w-12 border border-gray-300 text-center font-bold" />
              </div>
              <div className="col-span-3 flex items-center justify-between px-2 py-1">
                <span className="text-[8.5px]">Aporte voluntario</span>
                <Cell num={141} className="w-24 border border-gray-300" />
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              8. SECCIÓN DE FIRMAS Y RECAUDO OFICIAL (980 a 997)
              ——————————————————————————————————————————————————————————— */}
          <div className="grid grid-cols-12 divide-x divide-black text-[9px] bg-white">
            {/* Firmas Declarante y Contador */}
            <div className="col-span-5 flex flex-col justify-between divide-y divide-black">
              {/* Representación y Firma Declarante */}
              <div className="p-1.5 space-y-1">
                <div className="flex items-center justify-between text-[8px] text-gray-700">
                  <span>981. Cód. Representación</span>
                  <span className="border border-black px-2 py-0.5 font-mono font-bold">0</span>
                </div>
                <div className="h-9 border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-[8.5px] text-gray-500 italic">
                  Firma del declarante o de quien lo representa: {fullName}
                </div>
              </div>

              {/* Firma Contador */}
              <div className="p-1.5 space-y-1">
                <div className="flex items-center justify-between text-[8px] text-gray-700">
                  <span>982. Cód. Contador: <strong className="ml-1 border border-black px-1.5 py-0.2">{requiereContador ? "1" : "0"}</strong></span>
                  <span>994. Con salvedades: <strong className="ml-1 border border-black px-1.5 py-0.2"> </strong></span>
                </div>
                <div className="h-9 border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-[8px] text-gray-500 italic text-center">
                  {requiereContador
                    ? "Firma de Contador Público obligatoria (Art. 596 E.T.)"
                    : "Firma de contador no requerida por topes legales"}
                </div>
                <div className="text-[8px] text-gray-700">
                  983. No. Tarjeta profesional: <span className="font-mono">__________-T</span>
                </div>
              </div>
            </div>

            {/* Espacio Sello Recaudadora y Pago Total (980) */}
            <div className="col-span-7 flex flex-col justify-between">
              <div className="p-2 text-center text-gray-600 flex-1 flex flex-col justify-center border-b border-black bg-gray-50/50">
                <p className="text-[8.5px] font-bold text-gray-800">
                  997. Espacio exclusivo para el sello de la entidad recaudadora
                </p>
                <p className="text-[7.5px] text-gray-500 mt-1">
                  (Fecha de presentación y sello oficial de la entidad recaudadora / Certificación MUISCA)
                </p>
              </div>

              <div className="grid grid-cols-12 divide-x divide-black bg-[#eaf1f7]">
                <div className="col-span-7 p-1.5 flex items-center justify-between">
                  <span className="font-bold text-[10px]">980. Pago total $</span>
                  <span className="font-mono text-sm font-black tabular-nums bg-white px-2 py-0.5 border border-black">
                    {c.saldoPagar > 0 ? formatNumber(Math.round(c.saldoPagar)) : "0"}
                  </span>
                </div>
                <div className="col-span-5 p-1 text-[7.5px] text-gray-600 flex items-center justify-center text-center">
                  996. Espacio para el número interno de la DIAN/ Adhesivo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popover Explicativo de Casilla */}
      {selectedCasilla && (
        <div
          data-print-hide
          className="rounded-2xl border border-forest/30 bg-forest-mist/40 p-4 text-xs shadow-sm transition-all"
        >
          {(() => {
            const meta = CASILLAS_OFICIALES_210.find((x) => x.num === selectedCasilla);
            const val = c.casillas[selectedCasilla] ?? 0;
            return (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#2D6187] text-sm font-bold text-white font-mono">
                    {selectedCasilla}
                  </span>
                  <div>
                    <h4 className="font-semibold text-ink">{meta?.label || `Casilla ${selectedCasilla}`}</h4>
                    <p className="text-muted">
                      {meta?.section} · <span className="font-mono text-forest-deep">{meta?.legal}</span>
                      {meta?.formula && ` · Fórmula: ${meta.formula}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted">Valor liquidado</span>
                    <p className="font-mono text-base font-bold text-forest-deep">
                      {selectedCasilla === 140 ? (val ? "Marcado (X)" : "No") : formatCOP(val)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCasilla(null)}
                    className="h-8 px-2 text-muted hover:text-ink"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
