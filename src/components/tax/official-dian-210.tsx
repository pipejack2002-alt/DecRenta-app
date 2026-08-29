import {
  BookOpen,
  Calculator,
  CheckCircle2,
  Edit3,
  FileCode,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Maximize2,
  Minimize2,
  Pencil,
  Printer,
  Search,
  Settings2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CatalogManagerModal } from "@/components/layout/catalog-manager-modal";
import { Button } from "@/components/ui/button";
import { useAppStore, useComputed } from "@/lib/store";
import { getCasillaItemizedBreakdown } from "@/lib/tax/casilla-breakdowns";
import {
  CASILLAS_OFICIALES_210,
  downloadFile,
  downloadStyledFormulario210Xlsx,
  downloadXlsxFile,
  generateFormulario210Csv,
  generateFormulario210Workbook,
  generateFormulario210Xml,
} from "@/lib/tax/export-dian";
import { downloadOfficialDian210Pdf } from "@/lib/tax/export-dian-pdf";
import { formatCOP, formatNumber, parseMoney } from "@/lib/tax/format";
import { CASILLA_NOMBRES_CLAROS, FORMULAS_EXPLICADAS_210, INSTRUCTIVO_DIAN_210 } from "@/lib/tax/instructivo-dian";
import type { Declaration, TaxYear } from "@/lib/tax/types";
import {
  UVT_BY_YEAR,
  filingYearOf,
  officialUvt,
} from "@/lib/tax/uvt";

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
  const patch = useAppStore((s) => s.patch);
  const setYear = useAppStore((s) => s.setYear);
  const overrides = useAppStore((s) => s.declaration.uvtOverrides);
  const setUvtOverride = useAppStore((s) => s.setUvtOverride);
  const seccionales = useAppStore((s) => s.customSeccionales);
  const ciiuList = useAppStore((s) => s.customCiiu);
  const c = useComputed();
  const id = d.identity;

  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState<number>(compact ? 75 : 100);
  const [selectedCasilla, setSelectedCasilla] = useState<number | null>(null);
  const [isEditingDeclarante, setIsEditingDeclarante] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogModalTab, setCatalogModalTab] = useState<"seccionales" | "ciiu">("seccionales");

  const [modalYearInput, setModalYearInput] = useState(String(d.year));
  useEffect(() => {
    setModalYearInput(String(d.year));
  }, [d.year]);

  const fullName =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "CONTRIBUYENTE PERSONA NATURAL";

  const normalizedQuery = searchQuery.toLowerCase().trim();

  // Helper para formatear valor de casilla en el Formulario 210 oficial con redondeo al múltiplo de mil más cercano (Art. 577 E.T.)
  function v(num: number): string {
    const val = c.casillas[num];
    if (num === 140) return val ? "X" : "";
    if (num === 138) return String(val ?? 0);
    if (val === undefined || val === null || val === 0) return "0";
    const rounded = Math.round(val / 1000) * 1000;
    return formatNumber(rounded);
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
  async function handleExportXlsx() {
    const filename = `Formulario_210_AG${d.year}_${id.nit || "DIAN"}.xlsx`;
    try {
      await downloadStyledFormulario210Xlsx(filename, d, c);
    } catch {
      const wb = generateFormulario210Workbook(d, c);
      downloadXlsxFile(filename, wb);
    }
  }

  function handleExportXml() {
    const xml = generateFormulario210Xml(d, c);
    downloadFile(`declaracion-210-ag${d.year}-${id.nit || "dian"}.xml`, xml, "application/xml");
  }

  function handleExportCsv() {
    const csv = generateFormulario210Csv(d, c);
    downloadFile(`formulario-210-ag${d.year}-${id.nit || "dian"}.csv`, csv, "text/csv");
  }

  function VerticalLabel({ text, className = "" }: { text: string; className?: string }) {
    return (
      <div className={`w-4 bg-gray-100 border-r border-black flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}>
        <svg className="w-3.5 h-full max-h-[120px]" viewBox="0 0 14 100" preserveAspectRatio="xMidYMid meet">
          <text
            x="-50"
            y="9.5"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#1f2937"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="Arial, 'Helvetica Neue', Helvetica, sans-serif"
            letterSpacing="0.2"
          >
            {text}
          </text>
        </svg>
      </div>
    );
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
        className={`relative flex items-center justify-between px-1 h-[19px] cursor-pointer font-mono text-[9.5px] leading-none transition-colors select-text ${
          highlighted
            ? "bg-[#ffeb99] ring-2 ring-amber-500 z-10 font-bold"
            : valStr
            ? "bg-white text-black font-semibold hover:bg-amber-100/60"
            : "bg-white text-black hover:bg-amber-50"
        } ${className}`}
      >
        <span className="font-sans text-[6.5px] text-gray-500 font-normal select-none pointer-events-none pr-1">
          {num}
        </span>
        <span className="tabular-nums text-right w-full whitespace-nowrap">{valStr || "0"}</span>
      </div>
    );
  }

  const requiereContador = (c.casillas[29] ?? 0) >= c.uvt * 100000 || id.llevaLibros;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de herramientas superior */}
      {!hideHeaderActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 shadow-xs print:hidden no-print" data-print-hide>
          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador de casillas */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Buscar casilla o concepto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 sm:w-60 rounded-lg border border-line bg-surface pl-8 pr-3 text-xs focus:border-forest focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 border-l border-line pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                title="Reducir escala (hacer más pequeño)"
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
              <button
                type="button"
                onClick={() => setZoomLevel(60)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${zoomLevel === 60 ? "bg-forest text-white font-bold" : "bg-muted-mist hover:bg-forest-mist text-ink"}`}
                title="Escala compacta 60%"
              >
                60%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(75)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${zoomLevel === 75 ? "bg-forest text-white font-bold" : "bg-muted-mist hover:bg-forest-mist text-ink"}`}
                title="Escala media 75%"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${zoomLevel === 100 ? "bg-forest text-white font-bold" : "bg-muted-mist hover:bg-forest-mist text-ink"}`}
                title="Escala 100%"
              >
                100%
              </button>
            </div>
          </div>

          {/* Botones de Acción y Exportación */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDeclarante(true)}
              className="h-8 text-xs border-forest/50 text-forest-deep hover:bg-forest-mist font-semibold shadow-xs"
              title="Editar Año, Número de formulario, NIT, Nombres, Seccional y Actividad CIIU"
            >
              <Pencil className="mr-1.5 size-3.5 text-forest" />
              Editar Cabecera / RUT
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => downloadOfficialDian210Pdf(`Formulario_210_Oficial_AG${d.year}_${id.nit || "DIAN"}.pdf`, d, c)}
              className="h-8 bg-forest hover:bg-forest-deep text-white text-xs font-semibold shadow-xs"
              title="Descargar el PDF Oficial idéntico al de la DIAN"
            >
              <FileText className="mr-1.5 size-3.5" />
              Descargar PDF Oficial (.pdf)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportXlsx}
              className="h-8 text-xs font-semibold border border-line"
              title="Descargar Formulario 210 en Excel (.xlsx) estructurado"
            >
              <FileSpreadsheet className="mr-1.5 size-3.5 text-forest" />
              Excel (.xlsx)
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
              title="Imprimir en 1 sola hoja vertical exacta"
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
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30 p-1 sm:p-2 shadow-xs flex justify-center print:p-0 print:m-0 print:border-none print:bg-transparent print:shadow-none">
        <div
          id="dian-form-pdf-container"
          className="relative bg-white text-black border border-black shadow-sm origin-top select-text print:!transform-none print:!m-0 print:!w-full print:!max-w-none print:!min-w-0 print:!mb-0 print:border-black print:!bg-white"
          style={{
            width: "100%",
            maxWidth: "1060px",
            minWidth: "960px",
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
            {/* Col 1-3: Logo DIAN y Casilla 1 */}
            <div
              className={`col-span-3 border-r border-black p-1.5 flex flex-col justify-between cursor-pointer transition-colors ${
                selectedCasilla === 1 ? "bg-[#ffeb99] ring-2 ring-amber-500 font-bold" : "hover:bg-amber-50"
              }`}
              onClick={() => setSelectedCasilla(1)}
              onDoubleClick={() => setIsEditingDeclarante(true)}
              title="Casilla 1: Año gravable (Art. 596 E.T.)"
            >
              <div className="flex items-center justify-start pl-1">
                {/* Logotipo DIAN oficial */}
                <div className="font-sans text-xl font-light tracking-[3px] text-black uppercase flex items-baseline">
                  <span>D</span>
                  <span className="font-normal text-[#2D6187]">I</span>
                  <span>AN</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[8.5px]">
                <span className="font-bold">1. Año</span>
                <div className="flex border border-black divide-x divide-black bg-white">
                  {String(d.year).padStart(4, "0").split("").map((digit, idx) => (
                    <span key={idx} className="w-3.5 h-3.5 flex items-center justify-center font-mono font-bold text-[9px] text-black">
                      {digit}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[7px] text-gray-500 leading-none mt-0.5">Espacio reservado para la DIAN</p>
            </div>

            {/* Col 4-10: Título Central y Casilla 4 */}
            <div className="col-span-7 border-r border-black p-1.5 flex flex-col justify-between text-center">
              <h1 className="font-sans text-[11px] font-bold uppercase tracking-tight leading-tight px-2">
                Declaración de renta y complementario personas naturales y asimiladas residentes y sucesiones ilíquidas de causantes residentes
              </h1>
              <div
                className={`mt-1 inline-flex items-center justify-center gap-1.5 text-[8.5px] cursor-pointer rounded px-1 transition-colors self-center ${
                  selectedCasilla === 4 ? "bg-[#ffeb99] ring-2 ring-amber-500 font-bold" : "hover:bg-amber-50"
                }`}
                onClick={() => setSelectedCasilla(4)}
                onDoubleClick={() => setIsEditingDeclarante(true)}
                title="Casilla 4: Número de formulario único (Art. 578 E.T.)"
              >
                <span className="font-bold">4. Número de formulario:</span>
                <span className="font-mono font-bold text-[9.5px] bg-white px-2 py-0.5 border border-black">
                  {id.numeroFormulario || `210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}`}
                </span>
              </div>
            </div>

            {/* Col 11-12: Caja Azul Oficial 210 */}
            <div className="col-span-2 bg-[#2D6187] text-white flex items-center justify-center p-1 print:!bg-[#2D6187] print:!text-white">
              <span className="font-sans text-4xl font-black tracking-normal print:!text-white">
                210
              </span>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              2. DATOS DEL DECLARANTE (Casillas 5 a 28)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[8.5px]">
            {/* Fila 1: NIT, DV, Nombres y Seccional */}
            <div className="flex border-b border-black items-stretch h-[24px]">
              <div className="w-5 border-r border-black flex items-center justify-center shrink-0 bg-gray-50 overflow-hidden">
                <VerticalLabel text="Datos declarante" />
              </div>

              <div className="flex-1 grid grid-cols-12 divide-x divide-black items-center h-full">
                {/* 5. NIT con cajitas individuales */}
                <div
                  className={`col-span-3 px-1 h-full flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCasilla === 5 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(5)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                  title="Casilla 5: Número de Identificación Tributaria (NIT)"
                >
                  <span className="text-[7.5px] text-gray-700 leading-none whitespace-nowrap">5. NIT</span>
                  <div className="flex border border-black divide-x divide-black bg-white">
                    {((id.nit || "").padEnd(10, " ")).slice(0, 10).split("").map((ch, idx) => (
                      <span key={idx} className="w-2.5 h-3.5 flex items-center justify-center font-mono font-bold text-[8px] text-black">
                        {ch.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 6. DV */}
                <div
                  className={`col-span-1 px-1 h-full flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    selectedCasilla === 6 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(6)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                  title="Casilla 6: Dígito de Verificación (DV)"
                >
                  <span className="text-[7.5px] text-gray-700 leading-none">6.DV</span>
                  <span className="w-3.5 h-3.5 border border-black flex items-center justify-center font-mono font-bold text-[8.5px] bg-white">
                    {id.dv || "0"}
                  </span>
                </div>

                {/* 7. Primer apellido */}
                <div
                  className={`col-span-2 px-1 h-full flex flex-col justify-center cursor-pointer transition-colors ${
                    selectedCasilla === 7 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(7)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">7. Primer apellido</span>
                  <span className="font-semibold uppercase text-[8.5px] leading-tight truncate">{id.primerApellido || "—"}</span>
                </div>

                {/* 8. Segundo apellido */}
                <div
                  className={`col-span-2 px-1 h-full flex flex-col justify-center cursor-pointer transition-colors ${
                    selectedCasilla === 8 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(8)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">8. Segundo apellido</span>
                  <span className="font-semibold uppercase text-[8.5px] leading-tight truncate">{id.segundoApellido || "—"}</span>
                </div>

                {/* 9. Primer nombre */}
                <div
                  className={`col-span-2 px-1 h-full flex flex-col justify-center cursor-pointer transition-colors ${
                    selectedCasilla === 9 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(9)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">9. Primer nombre</span>
                  <span className="font-semibold uppercase text-[8.5px] leading-tight truncate">{id.primerNombre || "—"}</span>
                </div>

                {/* 10. Otros nombres */}
                <div
                  className={`col-span-1 px-1 h-full flex flex-col justify-center cursor-pointer transition-colors ${
                    selectedCasilla === 10 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(10)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">10. Otros</span>
                  <span className="font-semibold uppercase text-[8.5px] leading-tight truncate">{id.otrosNombres || "—"}</span>
                </div>

                {/* 12. Cód. Dirección seccional */}
                <div
                  className={`col-span-1 px-1 h-full flex flex-col justify-center text-center cursor-pointer transition-colors ${
                    selectedCasilla === 12 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(12)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[6.5px] text-gray-600 leading-none">12.Cod.Secc</span>
                  <span className="font-mono font-bold text-[8.5px] leading-tight">{id.dirSeccional || "02"}</span>
                </div>
              </div>
            </div>

            {/* Fila 2: Actividad CIIU, Correcciones y Casilla 28 */}
            <div className="flex items-stretch h-[22px] bg-[#f8fafc]">
              <div className="w-5 border-r border-black shrink-0 bg-gray-100" />
              <div className="flex-1 grid grid-cols-12 divide-x divide-black items-center h-full">
                {/* 24. Actividad CIIU */}
                <div
                  className={`col-span-3 px-1 h-full flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCasilla === 24 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(24)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-700 leading-none">24. Actividad ppal</span>
                  <div className="flex border border-black divide-x divide-black bg-white">
                    {((id.actividadCiiu || "0010").padStart(4, "0")).slice(0, 4).split("").map((ch, idx) => (
                      <span key={idx} className="w-2.5 h-3.5 flex items-center justify-center font-mono font-bold text-[8px] text-black">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 25. Cód. Corrección */}
                <div
                  className={`col-span-1 px-1 h-full flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    selectedCasilla === 25 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(25)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">25.Cód</span>
                  <span className="font-mono text-[8px]">{id.esCorreccion ? (id.codCorreccion || "1") : "—"}</span>
                </div>

                {/* 26. No. Formulario anterior */}
                <div
                  className={`col-span-2 px-1 h-full flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCasilla === 26 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(26)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">26. Form. anterior</span>
                  <span className="font-mono text-[8px]">{id.esCorreccion ? (id.formAnterior || "—") : "—"}</span>
                </div>

                {/* 27. Fracción año gravable siguiente */}
                <div
                  className={`col-span-2 px-1 h-full flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    selectedCasilla === 27 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(27)}
                  onDoubleClick={() => setIsEditingDeclarante(true)}
                >
                  <span className="text-[7px] text-gray-600 leading-none">27. Fracción sig.</span>
                  <span className="font-bold text-[8px]">{id.fraccionAnioSiguiente ? "SÍ" : "NO"}</span>
                </div>

                {/* 28. 1% Factura electrónica */}
                <div
                  className={`col-span-4 px-1.5 h-full bg-white flex items-center justify-between cursor-pointer ${
                    selectedCasilla === 28 ? "bg-[#ffeb99]" : "hover:bg-amber-50"
                  }`}
                  onClick={() => setSelectedCasilla(28)}
                >
                  <span className="text-[7px] text-gray-700 leading-tight">28. 1% compras factura electrónica</span>
                  <Cell num={28} className="w-20 border border-gray-300 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              3. SECCIÓN PATRIMONIO (Casillas 29 a 31)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[8.5px] h-[22px] flex items-center bg-[#e8eef3]">
            <div className="w-24 px-2 font-bold text-[8.5px] border-r border-black h-full flex items-center">
              Patrimonio
            </div>
            <div className="flex-1 grid grid-cols-12 divide-x divide-black h-full items-center">
              <div className="col-span-4 flex items-center justify-between px-2 h-full bg-white">
                <span className="text-[8px]">Total patrimonio bruto</span>
                <Cell num={29} className="w-24 border border-gray-300 h-4" />
              </div>
              <div className="col-span-4 flex items-center justify-between px-2 h-full bg-white">
                <span className="text-[8px]">Deudas</span>
                <Cell num={30} className="w-24 border border-gray-300 h-4" />
              </div>
              <div className="col-span-4 flex items-center justify-between px-2 h-full bg-[#dce7f0]">
                <span className="text-[8px] font-bold">Total patrimonio líquido</span>
                <Cell num={31} className="w-24 border border-black font-bold h-4" />
              </div>
            </div>
          </div>

          {/* ———————————————————————————————————————————————————————————
              4. CÉDULA GENERAL: TABLA MULTICOLUMNA (32 a 90)
              ——————————————————————————————————————————————————————————— */}
          <div className="border-b border-black text-[9.5px]">
            <div className="flex">
              {/* Etiqueta vertical izquierda: Cédula General */}
              <VerticalLabel text="CÉDULA GENERAL" />

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

                  {/* Devoluciones, rebajas y descuentos (Bloque continuo deshabilitado en Trabajo, Honorarios y Capital) */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Devoluciones, rebajas y descuentos</div>
                    <div className="col-span-6 bg-[#b4c6d4]" />
                    <Cell num={75} className="col-span-2" />
                  </div>

                  {/* Ingresos no constitutivos de renta */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Ingresos no constitutivos de renta</div>
                    <Cell num={33} className="col-span-2" />
                    <Cell num={44} className="col-span-2" />
                    <Cell num={59} className="col-span-2" />
                    <Cell num={76} className="col-span-2" />
                  </div>

                  {/* Costos y deducciones procedentes (Deshabilitado en Trabajo) */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Costos y deducciones procedentes</div>
                    <div className="col-span-2 bg-[#b4c6d4]" />
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

                  {/* Rentas líquidas pasivas - ECE (Bloque continuo deshabilitado en Trabajo y Honorarios) */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 px-2 py-0.5 bg-[#f9fbfd]">Rentas líquidas pasivas - ECE</div>
                    <div className="col-span-4 bg-[#b4c6d4]" />
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

                  {/* Bloque de 3 filas con columna de trabajo unificada continua (sin líneas divisorias interiores) */}
                  <div className="grid grid-cols-12 divide-x divide-black">
                    <div className="col-span-4 divide-y divide-gray-300">
                      <div className="px-2 py-0.5 bg-[#f9fbfd]">Renta líquida ordinaria del ejercicio</div>
                      <div className="px-2 py-0.5 bg-[#f9fbfd]">Pérdida líquida del ejercicio</div>
                      <div className="px-2 py-0.5 bg-[#f9fbfd]">Compensaciones por pérdidas</div>
                    </div>
                    {/* Columna Rentas de Trabajo bloqueada 100% continua */}
                    <div className="col-span-2 bg-[#b4c6d4]" />
                    {/* Columnas Honorarios, Capital y No Laborales con sus casillas */}
                    <div className="col-span-2 divide-y divide-gray-300">
                      <Cell num={54} />
                      <Cell num={55} />
                      <Cell num={56} />
                    </div>
                    <div className="col-span-2 divide-y divide-gray-300">
                      <Cell num={70} />
                      <Cell num={71} />
                      <Cell num={72} />
                    </div>
                    <div className="col-span-2 divide-y divide-gray-300">
                      <Cell num={87} />
                      <Cell num={88} />
                      <Cell num={89} />
                    </div>
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
                  <VerticalLabel text="PENSIONES" />
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
                  <VerticalLabel text="DIVIDENDOS" />
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
                  <VerticalLabel text="GANANCIAS OCASIONALES" />
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
              <VerticalLabel text="LIQUIDACIÓN PRIVADA" />

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

      {/* Popover Explicativo de Casilla con Instructivo Oficial DIAN */}
      {selectedCasilla && (
        <div
          data-print-hide
          className="rounded-2xl border border-forest/30 bg-forest-mist/50 p-4 text-xs shadow-sm transition-all space-y-3"
        >
          {(() => {
            const meta = CASILLAS_OFICIALES_210.find((x) => x.num === selectedCasilla);
            const val = c.casillas[selectedCasilla] ?? 0;
            const instructivo = INSTRUCTIVO_DIAN_210[selectedCasilla];

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#2D6187] text-sm font-bold text-white font-mono shadow-sm">
                      {selectedCasilla}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{meta?.label || `Casilla ${selectedCasilla}`}</h4>
                      <p className="text-muted">
                        <span className="font-semibold text-ink-soft">{meta?.section}</span> ·{" "}
                        <span className="font-mono text-forest-deep font-semibold">{meta?.legal}</span>
                        {meta?.formula && ` · Fórmula: ${meta.formula}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedCasilla <= 27 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDeclarante(true)}
                        className="h-8 text-xs border-forest/40 text-forest-deep hover:bg-forest-mist font-medium"
                      >
                        <Pencil className="mr-1.5 size-3" />
                        Editar este dato
                      </Button>
                    )}
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted">Valor liquidado</span>
                      <p className="font-mono text-lg font-bold text-forest-deep">
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

                {instructivo && (
                  <div className="bg-white/80 rounded-xl p-3 border border-forest/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest">
                      📖 Instructivo Oficial DIAN (MUISCA):
                    </span>
                    <p className="text-ink text-xs leading-relaxed">
                      {instructivo}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          MODAL DE EDICIÓN DE DATOS DEL DECLARANTE Y ENCABEZADO (Casillas 1 a 27)
          ========================================================================= */}
      {isEditingDeclarante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-4 border-b border-line bg-forest-mist/30">
              <div className="flex items-center gap-2.5">
                <span className="size-9 rounded-xl bg-forest/15 text-forest flex items-center justify-center font-bold">
                  <Pencil className="size-4" />
                </span>
                <div>
                  <h3 className="font-bold text-ink text-base">Editar Datos del Declarante y Encabezado</h3>
                  <p className="text-xs text-muted">Casillas 1 a 27 del Formulario 210 y Registro Único Tributario (RUT)</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingDeclarante(false)}
                className="size-8 rounded-lg text-muted hover:text-ink hover:bg-muted-mist flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Contenido scrolleable del modal */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Bloque 1: Año, UVT y Número de Formulario */}
              <div className="p-3.5 bg-muted-mist/40 rounded-xl border border-line space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-ink flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="size-4 rounded bg-forest/20 text-forest text-[10px] flex items-center justify-center font-mono">1</span>
                        1. Año Gravable
                      </span>
                      <span className="font-mono text-xs font-bold text-forest-deep">AG {d.year} (Presentación en {filingYearOf(d.year)})</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([2026, 2025, 2024, 2023] as const).map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYear(yr)}
                          className={`h-8 px-2.5 rounded-md border text-xs font-mono font-bold transition-all ${
                            d.year === yr
                              ? "bg-forest text-white shadow-xs border-forest"
                              : "bg-surface border-line text-ink-soft hover:bg-forest-mist"
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[11px] text-muted">Otro:</span>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="2030"
                          className="w-16 h-8 font-mono text-xs font-bold text-center rounded-md border border-line bg-white"
                          value={modalYearInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setModalYearInput(val);
                            const y = Number(val);
                            if (y >= 1990 && y <= 2100) setYear(y as TaxYear);
                          }}
                          onBlur={() => {
                            const y = Number(modalYearInput);
                            if (y >= 1990 && y <= 2100) {
                              setYear(y as TaxYear);
                            } else {
                              setModalYearInput(String(d.year));
                            }
                          }}
                          title="Digita cualquier año libremente"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-ink flex items-center gap-1.5">
                      <span className="size-4 rounded bg-forest/20 text-forest text-[10px] flex items-center justify-center font-mono">4</span>
                      4. Número de Formulario
                    </label>
                    <input
                      type="text"
                      className="h-8 w-full rounded-md border border-line bg-surface px-2.5 font-mono text-xs font-semibold"
                      placeholder={`210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}`}
                      value={id.numeroFormulario || ""}
                      onChange={(e) => patch((x) => (x.identity.numeroFormulario = e.target.value.replace(/\D/g, "")))}
                    />
                    <p className="text-[10px] text-muted">Vacío = autogenerado oficial DIAN.</p>
                  </div>
                </div>

                {/* Parámetros UVT de Año Gravable y Presentación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-ink">UVT {d.year} (Año Gravable)</span>
                      {overrides[d.year] ? (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1 rounded">Personalizada</span>
                      ) : (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1 rounded">Oficial</span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">$</span>
                      <input
                        type="text"
                        className="h-8 w-full pl-6 pr-2 rounded-md border border-line bg-surface font-mono text-xs font-bold text-forest-deep"
                        placeholder="Ej: 55.000"
                        value={formatNumber(overrides[d.year] || officialUvt(d.year) || 0)}
                        onChange={(e) => {
                          const n = parseMoney(e.target.value);
                          setUvtOverride(d.year, n > 0 ? n : null);
                        }}
                      />
                    </div>
                    <p className="text-[9.5px] text-muted truncate">
                      {officialUvt(d.year) ? UVT_BY_YEAR[d.year]?.resolucion : "Valor UVT para liquidar topes y rentas"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-ink">UVT {filingYearOf(d.year)} (Presentación)</span>
                      {overrides[filingYearOf(d.year)] ? (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1 rounded">Personalizada</span>
                      ) : (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1 rounded">Oficial</span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">$</span>
                      <input
                        type="text"
                        className="h-8 w-full pl-6 pr-2 rounded-md border border-line bg-surface font-mono text-xs font-bold text-forest-deep"
                        placeholder="Ej: 58.000"
                        value={formatNumber(overrides[filingYearOf(d.year)] || officialUvt(filingYearOf(d.year)) || 0)}
                        onChange={(e) => {
                          const n = parseMoney(e.target.value);
                          setUvtOverride(filingYearOf(d.year), n > 0 ? n : null);
                        }}
                      />
                    </div>
                    <p className="text-[9.5px] text-muted truncate">
                      {officialUvt(filingYearOf(d.year)) ? UVT_BY_YEAR[filingYearOf(d.year)]?.resolucion : "Aplica para sanciones mínimas"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloque 2: NIT y Nombres */}
              <div className="space-y-3 p-3 bg-white rounded-xl border border-line">
                <h4 className="font-bold text-ink-soft text-[11px] uppercase tracking-wider">Identificación y Nombres (RUT)</h4>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8 space-y-1">
                    <label className="font-semibold text-ink">5. Cédula / NIT (sin DV)</label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 font-mono text-xs font-semibold"
                      value={id.nit || ""}
                      onChange={(e) => patch((x) => (x.identity.nit = e.target.value.replace(/\D/g, "")))}
                      placeholder="Ej: 1045678901"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <label className="font-semibold text-ink text-center block">6. DV</label>
                    <input
                      type="text"
                      maxLength={1}
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 font-mono text-xs font-bold text-center"
                      value={id.dv || "0"}
                      onChange={(e) => patch((x) => (x.identity.dv = e.target.value.slice(0, 1)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink text-[11px]">7. Primer Apellido</label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs uppercase"
                      value={id.primerApellido || ""}
                      onChange={(e) => patch((x) => (x.identity.primerApellido = e.target.value.toUpperCase()))}
                      placeholder="PÉREZ"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink text-[11px]">8. Segundo Apellido</label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs uppercase"
                      value={id.segundoApellido || ""}
                      onChange={(e) => patch((x) => (x.identity.segundoApellido = e.target.value.toUpperCase()))}
                      placeholder="GÓMEZ"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink text-[11px]">9. Primer Nombre</label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs uppercase"
                      value={id.primerNombre || ""}
                      onChange={(e) => patch((x) => (x.identity.primerNombre = e.target.value.toUpperCase()))}
                      placeholder="JUAN"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink text-[11px]">10. Otros Nombres</label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs uppercase"
                      value={id.otrosNombres || ""}
                      onChange={(e) => patch((x) => (x.identity.otrosNombres = e.target.value.toUpperCase()))}
                      placeholder="CARLOS"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Seccional y Actividad CIIU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted-mist/40 rounded-xl border border-line">
                <div className="space-y-1.5 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <label className="font-semibold text-ink flex items-center gap-1 truncate">
                      <span className="size-4 rounded bg-forest/20 text-forest text-[10px] flex items-center justify-center font-mono shrink-0">12</span>
                      12. Dirección Seccional
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogModalTab("seccionales");
                        setCatalogModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-forest hover:text-forest-deep flex items-center gap-1 bg-forest-mist/80 hover:bg-forest-mist px-1.5 py-0.5 rounded transition-colors shrink-0"
                      title="Editar o añadir nuevas direcciones seccionales"
                    >
                      <Settings2 className="size-3" /> Gestionar
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="text"
                      maxLength={3}
                      className="w-12 h-8 px-1.5 font-mono text-xs font-bold text-center rounded-lg border border-line bg-white shadow-2xs shrink-0"
                      value={id.dirSeccional || "02"}
                      onChange={(e) => patch((x) => (x.identity.dirSeccional = e.target.value.replace(/\D/g, "").slice(0, 3)))}
                      placeholder="02"
                      title="Digita el código de seccional"
                    />
                    <select
                      className="h-8 flex-1 min-w-0 w-full truncate rounded-lg border border-line bg-surface px-2 text-xs font-medium focus:ring-1 focus:ring-forest"
                      value={id.dirSeccional || "02"}
                      onChange={(e) => patch((x) => (x.identity.dirSeccional = e.target.value))}
                    >
                      {seccionales.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} · {s.name} {s.isCustom ? "⭐" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <label className="font-semibold text-ink flex items-center gap-1 truncate">
                      <span className="size-4 rounded bg-forest/20 text-forest text-[10px] flex items-center justify-center font-mono shrink-0">24</span>
                      24. Actividad CIIU
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogModalTab("ciiu");
                        setCatalogModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-forest hover:text-forest-deep flex items-center gap-1 bg-forest-mist/80 hover:bg-forest-mist px-1.5 py-0.5 rounded transition-colors shrink-0"
                      title="Editar o añadir nuevas actividades CIIU"
                    >
                      <Settings2 className="size-3" /> Gestionar
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="text"
                      maxLength={4}
                      className="w-16 h-8 px-1.5 font-mono text-xs font-bold text-center rounded-lg border border-line bg-white shadow-2xs shrink-0"
                      value={id.actividadCiiu || "0010"}
                      onChange={(e) => patch((x) => (x.identity.actividadCiiu = e.target.value.replace(/\D/g, "").slice(0, 4)))}
                      placeholder="0010"
                      title="Digita cualquier código CIIU de 4 dígitos"
                    />
                    <select
                      className="h-8 flex-1 min-w-0 w-full truncate rounded-lg border border-line bg-surface px-2 text-xs font-medium focus:ring-1 focus:ring-forest"
                      value={id.actividadCiiu || "0010"}
                      onChange={(e) => patch((x) => (x.identity.actividadCiiu = e.target.value))}
                    >
                      {ciiuList.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} · {s.name} {s.isCustom ? "⭐" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Corrección y Fracción */}
              <div className="p-3 bg-white rounded-xl border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-ink text-xs">25. ¿Esta declaración es una corrección?</span>
                    <p className="text-[10px] text-muted">Habilita casillas 25 y 26 según Art. 588 / 589 E.T.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!id.esCorreccion}
                      onChange={(e) => patch((x) => (x.identity.esCorreccion = e.target.checked))}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest"></div>
                  </label>
                </div>

                {id.esCorreccion && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
                    <div className="space-y-1">
                      <label className="font-semibold text-ink text-[11px]">25. Código de Corrección</label>
                      <select
                        className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-xs"
                        value={id.codCorreccion || "1"}
                        onChange={(e) => patch((x) => (x.identity.codCorreccion = e.target.value))}
                      >
                        <option value="1">1 · Corrección declaración privada (Art. 588)</option>
                        <option value="2">2 · Disminuye impuesto o aumenta saldo (Art. 589)</option>
                        <option value="3">3 · Provocada por acto administrativo DIAN</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-ink text-[11px]">26. No. Formulario Anterior</label>
                      <input
                        type="text"
                        className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 font-mono text-xs"
                        placeholder="Ej: 210202400012345"
                        value={id.formAnterior || ""}
                        onChange={(e) => patch((x) => (x.identity.formAnterior = e.target.value.replace(/\D/g, "")))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <div>
                    <span className="font-bold text-ink text-xs">27. Fracción de año gravable siguiente</span>
                    <p className="text-[10px] text-muted">Sucesión ilíquida o cancelación de RUT</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!id.fraccionAnioSiguiente}
                      onChange={(e) => patch((x) => (x.identity.fraccionAnioSiguiente = e.target.checked))}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
              <span className="text-[11px] text-muted">Los cambios se aplican automáticamente en vivo.</span>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditingDeclarante(false)}
                className="bg-forest hover:bg-forest-deep text-white font-semibold"
              >
                <UserCheck className="mr-1.5 size-3.5" />
                Guardar y Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestor de Catálogos */}
      <CatalogManagerModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        defaultTab={catalogModalTab}
        onSelectSeccional={(code) => patch((x) => (x.identity.dirSeccional = code))}
        onSelectCiiu={(code) => patch((x) => (x.identity.actividadCiiu = code))}
      />

      {/* Modal Inspector de Casilla y Fórmula Oficial DIAN */}
      {selectedCasilla !== null && (
        <CasillaInspectorModal
          casillaNum={selectedCasilla}
          computed={c}
          declaration={d}
          onClose={() => setSelectedCasilla(null)}
          onEditDeclarante={() => {
            setSelectedCasilla(null);
            setIsEditingDeclarante(true);
          }}
        />
      )}
    </div>
  );
}

function CasillaInspectorModal({
  casillaNum,
  computed,
  declaration,
  onClose,
  onEditDeclarante,
}: {
  casillaNum: number;
  computed: any;
  declaration: Declaration;
  onClose: () => void;
  onEditDeclarante: () => void;
}) {
  const meta = CASILLAS_OFICIALES_210.find((x) => x.num === casillaNum);
  const formulaInfo = FORMULAS_EXPLICADAS_210[casillaNum];
  const itemized = getCasillaItemizedBreakdown(casillaNum, declaration, computed);
  const instructivoText = INSTRUCTIVO_DIAN_210[casillaNum];
  const rawVal = computed.casillas[casillaNum] ?? 0;
  const uvtValue = computed.uvt > 0 ? (rawVal / computed.uvt).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Inspector */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-forest-mist/30">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-forest/15 text-forest flex items-center justify-center font-bold text-sm font-mono shrink-0">
              {casillaNum}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-ink text-base">
                  {meta?.label || `Casilla ${casillaNum}`}
                </h3>
                {formulaInfo ? (
                  <span className="text-[10px] font-semibold text-forest bg-forest/15 px-2 py-0.5 rounded-full flex items-center gap-1 border border-forest/20">
                    <Calculator className="size-2.5" /> Formulada
                  </span>
                ) : itemized ? (
                  <span className="text-[10px] font-semibold text-forest bg-forest/15 px-2 py-0.5 rounded-full flex items-center gap-1 border border-forest/20">
                    <ListChecks className="size-2.5" /> Desglose de Conceptos
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-forest bg-forest/15 px-2 py-0.5 rounded-full border border-forest/20">
                    Dato de Entrada
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono">{meta?.legal || "Estatuto Tributario Nacional"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-muted hover:text-ink hover:bg-muted-mist flex items-center justify-center transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tarjeta de Valor Liquidado */}
          <div className="p-4 rounded-xl border border-forest/20 bg-forest-mist/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Valor Liquidado en Formulario</span>
              <p className="text-2xl font-bold font-mono text-forest-deep mt-0.5">
                {casillaNum === 140 ? (computed.casillas[140] ? "SÍ (Marcado X)" : "NO") : formatCOP(rawVal)}
              </p>
            </div>
            {casillaNum !== 140 && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-muted">Equivalente en UVT</span>
                <p className="font-mono text-sm font-bold text-ink-soft">
                  {formatNumber(Number(uvtValue))} UVT
                </p>
                <p className="text-[9px] text-muted">UVT AG: ${formatNumber(computed.uvt)}</p>
              </div>
            )}
          </div>

          {/* Desglose de Fórmula Matemática */}
          {formulaInfo && (
            <div className="p-4 rounded-xl border border-forest/25 bg-forest-mist/35 space-y-3">
              <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wide">
                <Calculator className="size-4 text-forest" />
                <span>Fórmula Matemática Explicada</span>
              </div>
              <div className="bg-surface p-3.5 rounded-lg border border-line font-sans text-xs text-ink font-bold leading-relaxed shadow-2xs">
                {formulaInfo.formula}
              </div>

              {/* Cálculo en vivo con valores del usuario */}
              {formulaInfo.casillasInvolucradas && formulaInfo.casillasInvolucradas.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-ink">Desglose de valores del declarante:</span>
                  <div className="grid gap-2 bg-surface p-3 rounded-lg border border-line text-xs shadow-2xs">
                    {formulaInfo.casillasInvolucradas.map((cn: number) => {
                      const clearLabel = CASILLA_NOMBRES_CLAROS[cn] || CASILLAS_OFICIALES_210.find((x) => x.num === cn)?.label || "Concepto";
                      const cVal = computed.casillas[cn] ?? 0;
                      return (
                        <div key={cn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 border-b border-line pb-2 last:border-none last:pb-0">
                          <div className="min-w-0 flex-1">
                            <span className="text-ink text-[11.5px] font-medium leading-snug">
                              <strong className="text-forest font-mono font-bold">Casilla {cn}</strong> · {clearLabel}:
                            </span>
                          </div>
                          <div className="shrink-0 self-end sm:self-auto">
                            <span className="font-bold font-mono text-ink text-xs sm:text-sm bg-mist/80 px-2.5 py-0.5 rounded border border-line inline-block">
                              {cn === 138 ? String(cVal) : formatCOP(cVal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-ink-soft leading-relaxed">
                {formulaInfo.descripcion}
              </p>
            </div>
          )}

          {/* Desglose Interactivo de Conceptos y Soportes Incluidos */}
          {itemized && (
            <div className="p-4 rounded-xl border border-forest/25 bg-forest-mist/35 space-y-3">
              <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wide">
                <ListChecks className="size-4 text-forest" />
                <span>{itemized.title}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed font-medium">
                {itemized.description}
              </p>

              {/* Lista Desglosada de Conceptos */}
              <div className="grid gap-2 bg-surface p-3 rounded-lg border border-line text-xs shadow-2xs">
                {itemized.items.map((it, idx) => (
                  <div key={idx} className="border-b border-line pb-2 last:border-none last:pb-0 space-y-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                      <span className="font-semibold text-ink leading-snug">{it.label}</span>
                      <span className="font-bold font-mono text-forest-deep shrink-0 text-xs sm:text-sm self-end sm:self-auto bg-forest-mist/60 px-2.5 py-0.5 rounded border border-forest/30">
                        {it.value}
                      </span>
                    </div>
                    {it.source && (
                      <p className="text-[10.5px] text-muted font-mono flex items-center gap-1">
                        📂 <span className="text-ink-soft font-medium">{it.source}</span>
                      </p>
                    )}
                    {it.legal && (
                      <p className="text-[10px] text-forest font-medium">
                        ⚖️ {it.legal}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Subtotal del Desglose */}
              {itemized.totalLabel && itemized.totalValue !== undefined && (
                <div className="flex items-center justify-between p-2.5 bg-forest/10 rounded-lg border border-forest/20 text-xs">
                  <span className="font-bold text-forest-deep">{itemized.totalLabel}:</span>
                  <span className="font-mono font-bold text-forest-deep text-sm">
                    {formatCOP(itemized.totalValue)}
                  </span>
                </div>
              )}

              {/* Nota probatoria / Explicativa */}
              {itemized.footnote && (
                <p className="text-[11px] text-ink-soft leading-relaxed italic bg-mist/50 p-2.5 rounded-md border border-line">
                  💡 {itemized.footnote}
                </p>
              )}
            </div>
          )}

          {/* Instructivo Oficial Completo */}
          {instructivoText && (
            <div className="p-4 rounded-xl border border-line bg-muted-mist/30 space-y-2">
              <div className="flex items-center gap-2 text-ink font-bold text-xs">
                <BookOpen className="size-4 text-forest" />
                <span>Instructivo Oficial Formulario 210 DIAN</span>
              </div>
              <p className="text-ink-soft leading-relaxed text-xs">
                {instructivoText}
              </p>
            </div>
          )}

          {/* Sección de Origen */}
          {meta?.section && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface text-muted text-xs">
              <span>Sección en el Formulario:</span>
              <span className="font-semibold text-ink">{meta.section}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
          {casillaNum <= 27 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditDeclarante}
              className="text-xs"
            >
              <Pencil className="mr-1.5 size-3.5" />
              Editar en RUT / Cabecera
            </Button>
          ) : (
            <span className="text-[11px] text-muted">Calculado automáticamente según el Estatuto Tributario.</span>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="bg-forest hover:bg-forest-deep text-white font-semibold ml-auto"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
