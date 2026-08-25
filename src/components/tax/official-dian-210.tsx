import {
  Calculator,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Info,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  onNavigateToField?: (section: string) => void;
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
  const [zoomLevel, setZoomLevel] = useState<number>(compact ? 90 : 100);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("TODAS");
  const [selectedCasilla, setSelectedCasilla] = useState<number | null>(null);

  const fullName =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "CONTRIBUYENTE PERSONA NATURAL";

  // Agrupación de casillas oficiales por sección
  const sections = useMemo(() => {
    const map = new Map<string, typeof CASILLAS_OFICIALES_210>();
    for (const item of CASILLAS_OFICIALES_210) {
      if (!map.has(item.section)) {
        map.set(item.section, []);
      }
      map.get(item.section)!.push(item);
    }
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      items,
    }));
  }, []);

  const normalizedQuery = searchQuery.toLowerCase().trim();

  // Export handlers
  function handleExportXlsx() {
    const wb = generateFormulario210Workbook(d, c);
    const filename = `formulario-210-oficial-ag${d.year}-${id.nit || "dian"}.xlsx`;
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

  function handleExportJson() {
    const jsonStr = JSON.stringify(
      {
        identity: id,
        year: d.year,
        casillas: c.casillas,
        computed: {
          patrimonioLiquido: c.casillas[31] ?? 0,
          rentaLiquidaGravable: c.rentaLiquidaGravable,
          impuestoNeto: c.impuestoNeto,
          impuestoCargo: c.impuestoCargo,
          saldoPagar: c.saldoPagar,
          saldoFavor: c.saldoFavor,
        },
      },
      null,
      2,
    );
    downloadFile(`respaldo-210-ag${d.year}-${id.nit || "dian"}.json`, jsonStr, "application/json");
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de herramientas y acciones */}
      {!hideHeaderActions && (
        <div
          data-print-hide
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 shadow-xs"
        >
          {/* Búsqueda y Filtros Rápidos */}
          <div className="flex flex-1 items-center gap-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar por casilla o concepto (ej: 32, patrimonio, retenciones, 136)..."
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

            {/* Controles de Zoom */}
            <div className="hidden sm:flex items-center gap-1 border-l border-line pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
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
                onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                title="Aumentar escala"
              >
                <ZoomIn className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Botones de Exportación Oficial */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportXlsx}
              className="h-8 bg-forest hover:bg-forest-deep text-white text-xs font-semibold shadow-xs"
              title="Descargar Formulario 210 en Excel (.xlsx) profesional con fórmulas"
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
              XML Prevalidador
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs"
              title="Descargar archivo CSV estructurado"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs"
              title="Imprimir o Guardar como PDF oficial de la DIAN"
            >
              <Printer className="mr-1.5 size-3.5" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      )}

      {/* Píldoras de Secciones para Navegación Rápida */}
      {!hideHeaderActions && (
        <div data-print-hide className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSectionFilter("TODAS")}
            className={`shrink-0 rounded-full px-3 py-1 font-medium transition-colors ${
              activeSectionFilter === "TODAS"
                ? "bg-forest text-white"
                : "bg-surface border border-line text-muted hover:text-ink"
            }`}
          >
            Todas las Cédulas (210 Completo)
          </button>
          {sections.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setActiveSectionFilter(s.title)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition-colors ${
                activeSectionFilter === s.title
                  ? "bg-forest text-white"
                  : "bg-surface border border-line text-muted hover:text-ink"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* ———————————————————————————————————————————————————————————
          DOCUMENTO OFICIAL DEL FORMULARIO 210 DIAN (VISTA OFICIAL)
          ——————————————————————————————————————————————————————————— */}
      <div
        className="overflow-x-auto rounded-2xl border-2 border-[#164e3e]/30 bg-white p-3 sm:p-6 shadow-xl transition-all"
        style={{
          fontSize: `${(zoomLevel / 100) * 14}px`,
        }}
      >
        <div className="mx-auto max-w-[960px] bg-white text-[#1c241f] select-text">
          {/* ==========================================
              CABECERA INSTITUCIONAL OFICIAL DE LA DIAN
              ========================================== */}
          <header className="border-2 border-[#00573F] bg-white">
            {/* Fila Superior: República de Colombia + DIAN + Año y Formulario */}
            <div className="grid grid-cols-12 border-b-2 border-[#00573F] bg-[#00573F] text-white">
              {/* Escudo / Identidad */}
              <div className="col-span-12 md:col-span-3 flex items-center gap-2.5 p-2.5 bg-[#004733] border-b md:border-b-0 md:border-r border-[#003828]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 p-1.5 border border-white/20">
                  <svg viewBox="0 0 24 24" className="size-full fill-current text-[#F7C948]">
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.14-2.73 8.01-6 9.08-3.27-1.07-6-4.94-6-9.08V6.43l6-2.25z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                    República de Colombia
                  </p>
                  <p className="font-display text-xs font-bold text-[#F7C948]">
                    DIAN · Tributos
                  </p>
                  <p className="text-[9px] text-white/75">
                    Dirección de Impuestos y Aduanas Nacionales
                  </p>
                </div>
              </div>

              {/* Título Principal */}
              <div className="col-span-12 md:col-span-6 flex flex-col justify-center p-2.5 text-center border-b md:border-b-0 md:border-r border-[#003828]">
                <h1 className="font-display text-sm md:text-base font-black uppercase tracking-tight text-white">
                  Declaración de Renta y Complementario Personas Naturales y Asimiladas de Residentes
                </h1>
                <p className="text-[10px] font-medium text-white/80">
                  y Sucesiones Ilíquidas de Causantes Residentes
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="inline-block rounded bg-[#F7C948] px-2 py-0.5 text-[10px] font-extrabold text-[#004733]">
                    MUISCA OFICIAL
                  </span>
                  <span className="text-[10px] text-white/80">
                    Servicios Informáticos Electrónicos
                  </span>
                </div>
              </div>

              {/* Casilla 1 (Año) y Número 210 */}
              <div className="col-span-12 md:col-span-3 grid grid-cols-2 bg-[#004733]">
                {/* 1. Año */}
                <div className="flex flex-col items-center justify-center border-r border-[#003828] p-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase text-white/70">1. Año</span>
                  <span className="font-mono text-xl font-black text-white tabular-nums">
                    {d.year}
                  </span>
                </div>
                {/* Formulario 210 */}
                <div className="flex flex-col items-center justify-center p-1.5 text-center bg-[#00573F]">
                  <span className="text-[9px] font-bold uppercase text-[#F7C948]">Formulario</span>
                  <span className="font-display text-2xl font-black text-white tracking-wider">
                    210
                  </span>
                </div>
              </div>
            </div>

            {/* Fila 2: Casilla 2 Concepto y Casilla 4 Número de Formulario */}
            <div className="grid grid-cols-12 border-b border-[#00573F] bg-[#eef7f3] text-xs">
              <div className="col-span-6 md:col-span-3 border-r border-[#00573F] p-1.5">
                <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                  2. Concepto
                </span>
                <span className="font-semibold text-[#00573F]">
                  {id.esCorreccion ? "2 - Corrección" : "1 - Inicial"}
                </span>
              </div>
              <div className="col-span-6 md:col-span-4 border-r border-[#00573F] p-1.5">
                <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                  4. Número de Formulario
                </span>
                <span className="font-mono text-xs font-semibold text-[#00573F]">
                  210{d.year}000{id.nit ? id.nit.slice(-5) : "88291"}
                </span>
              </div>
              <div className="col-span-12 md:col-span-5 flex items-center justify-between p-1.5 px-3 bg-[#e4f1eb]">
                <span className="text-[10px] font-bold text-[#00573F] uppercase">
                  Borrador Oficial para Declarar
                </span>
                <span className="font-mono text-[10px] text-muted">
                  Generado: {new Date().toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>

            {/* Fila 3: DATOS DEL DECLARANTE (Casillas 5 a 27) */}
            <div className="border-b-2 border-[#00573F] bg-[#f9fbf9]">
              <div className="bg-[#00573F]/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-[#00573F]">
                Datos del Declarante
              </div>
              <div className="grid grid-cols-12 text-xs border-t border-[#00573F]">
                {/* 5. NIT y 6. DV */}
                <div className="col-span-8 md:col-span-4 border-r border-b md:border-b-0 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    5. Número de Identificación Tributaria (NIT)
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    {id.nit || "—"}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-1 border-r border-b md:border-b-0 border-[#00573F] p-2 text-center">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    6. DV
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    {id.dv || "0"}
                  </span>
                </div>

                {/* 7 a 10. Apellidos y Nombres */}
                <div className="col-span-6 md:col-span-2 border-r border-b md:border-b-0 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    7. Primer Apellido
                  </span>
                  <span className="font-semibold text-ink uppercase">
                    {id.primerApellido || "—"}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-2 border-r border-b md:border-b-0 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    8. Segundo Apellido
                  </span>
                  <span className="font-semibold text-ink uppercase">
                    {id.segundoApellido || "—"}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-1.5 border-r border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    9. Primer Nombre
                  </span>
                  <span className="font-semibold text-ink uppercase">
                    {id.primerNombre || "—"}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-1.5 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    10. Otros Nombres
                  </span>
                  <span className="font-semibold text-ink uppercase">
                    {id.otrosNombres || "—"}
                  </span>
                </div>
              </div>

              {/* Fila Seccional, CIIU y Corrección */}
              <div className="grid grid-cols-12 text-xs border-t border-[#00573F] bg-white">
                <div className="col-span-6 md:col-span-3 border-r border-b md:border-b-0 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    12. Cód. Dirección Seccional
                  </span>
                  <span className="font-semibold text-ink">
                    {id.dirSeccional || "32 - Bogotá"}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-3 border-r border-b md:border-b-0 border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    24. Actividad Económica (CIIU)
                  </span>
                  <span className="font-mono font-bold text-ink">
                    {id.actividadCiiu || "—"}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-3 border-r border-[#00573F] p-2">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    25. Fracción año gravable siguiente
                  </span>
                  <span className="font-semibold text-ink">NO</span>
                </div>
                <div className="col-span-6 md:col-span-3 p-2 bg-[#fbfdfc]">
                  <span className="block font-mono text-[9px] font-bold text-[#00573F]">
                    {id.esCorreccion ? "27. No. Formulario Anterior" : "26. Tipo de Declaración"}
                  </span>
                  <span className="font-semibold text-ink">
                    {id.esCorreccion ? id.formAnterior || "—" : "Declaración Inicial"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* ==========================================
              CUERPO OFICIAL DE CASILLAS (28 a 141)
              ========================================== */}
          <div className="mt-3 border-2 border-[#00573F] bg-white">
            {sections.map((sec) => {
              if (activeSectionFilter !== "TODAS" && activeSectionFilter !== sec.title) {
                return null;
              }

              const filteredItems = sec.items.filter((item) => {
                if (!normalizedQuery) return true;
                return (
                  String(item.num).includes(normalizedQuery) ||
                  item.label.toLowerCase().includes(normalizedQuery) ||
                  item.legal.toLowerCase().includes(normalizedQuery) ||
                  sec.title.toLowerCase().includes(normalizedQuery)
                );
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={sec.title} className="border-b-2 border-[#00573F] last:border-b-0">
                  {/* Encabezado de Sección Oficial */}
                  <div className="flex items-center justify-between bg-[#00573F] px-3 py-1.5 text-white">
                    <span className="font-display text-xs font-bold uppercase tracking-wider">
                      {sec.title}
                    </span>
                    <span className="text-[10px] text-white/70 font-mono">
                      Formulario 210 · DIAN
                    </span>
                  </div>

                  {/* Tabla de Casillas */}
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#00573F] bg-[#eef7f3] text-[10px] font-bold text-[#00573F] uppercase">
                        <th className="w-16 border-r border-[#00573F] px-2 py-1 text-center">
                          Casilla
                        </th>
                        <th className="border-r border-[#00573F] px-3 py-1">
                          Concepto / Renglón Oficial
                        </th>
                        <th className="hidden md:table-cell w-48 border-r border-[#00573F] px-2 py-1 text-center">
                          Fundamento Legal
                        </th>
                        <th className="w-44 px-3 py-1 text-right">
                          Valor (COP)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c2decb]">
                      {filteredItems.map((item) => {
                        const rawVal = c.casillas[item.num];
                        const isNonZero = (rawVal ?? 0) > 0 || item.num === 140;
                        const isTotalCasilla = [
                          31, 37, 40, 41, 42, 49, 52, 53, 54, 57, 65, 68, 69, 70, 73,
                          82, 85, 86, 87, 90, 91, 92, 93, 97, 101, 103, 106, 111,
                          115, 121, 125, 126, 129, 134, 136, 137, 980,
                        ].includes(item.num);
                        const isHighlightedMatch =
                          normalizedQuery &&
                          (String(item.num).includes(normalizedQuery) ||
                            item.label.toLowerCase().includes(normalizedQuery));

                        let displayVal = "$ 0";
                        if (rawVal !== undefined && rawVal !== null) {
                          if (item.num === 140) {
                            displayVal = rawVal ? "X (SÍ)" : "—";
                          } else {
                            displayVal = formatCOP(rawVal);
                          }
                        }

                        return (
                          <tr
                            key={item.num}
                            onClick={() => setSelectedCasilla(item.num)}
                            className={`cursor-pointer transition-colors hover:bg-[#e4f4ea] ${
                              isHighlightedMatch
                                ? "bg-[#fff7d6]"
                                : isTotalCasilla
                                  ? "bg-[#eaf4ee] font-semibold"
                                  : isNonZero
                                    ? "bg-[#f4f9f6]"
                                    : "bg-white"
                            }`}
                          >
                            {/* Número de Casilla en Cajetín Oficial */}
                            <td className="border-r border-[#00573F]/40 p-1 text-center">
                              <span
                                className={`inline-flex min-w-8 items-center justify-center rounded px-1.5 py-0.5 font-mono text-xs font-extrabold ${
                                  isTotalCasilla
                                    ? "bg-[#00573F] text-white"
                                    : isNonZero
                                      ? "bg-[#00573F]/15 text-[#00573F]"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.num}
                              </span>
                            </td>

                            {/* Nombre del Renglón Oficial */}
                            <td className="border-r border-[#00573F]/40 px-3 py-1.5 text-xs leading-snug">
                              <span className="text-ink font-medium">
                                {item.label}
                              </span>
                              {item.formula && (
                                <span className="block text-[10px] text-muted italic">
                                  {item.formula}
                                </span>
                              )}
                            </td>

                            {/* Fundamento Legal */}
                            <td className="hidden md:table-cell border-r border-[#00573F]/40 px-2 py-1.5 text-center font-mono text-[10px] text-muted">
                              {item.legal}
                            </td>

                            {/* Valor Formateado */}
                            <td
                              className={`px-3 py-1.5 text-right font-mono text-xs tabular-nums ${
                                isTotalCasilla
                                  ? "text-[#00573F] font-bold text-sm"
                                  : isNonZero
                                    ? "text-ink font-semibold"
                                    : "text-muted/60"
                              }`}
                            >
                              {displayVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* ==========================================
              SECCIÓN DE FIRMAS Y RECAUDO OFICIAL (980 a 997)
              ========================================== */}
          <footer className="mt-3 border-2 border-[#00573F] bg-[#f9fbf9] text-xs">
            {/* Casilla 980 Pago Total */}
            <div className="grid grid-cols-12 border-b border-[#00573F] bg-[#eef7f3]">
              <div className="col-span-8 flex items-center gap-2 border-r border-[#00573F] p-2">
                <span className="rounded bg-[#00573F] px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                  980
                </span>
                <span className="font-display text-sm font-bold text-[#00573F]">
                  Pago Total Oficial
                </span>
                <span className="text-[10px] text-muted">(Art. 800 E.T.)</span>
              </div>
              <div className="col-span-4 p-2 text-right">
                <span className="font-mono text-base font-black text-[#00573F] tabular-nums">
                  {c.saldoPagar > 0 ? formatCOP(c.saldoPagar) : "$ 0"}
                </span>
              </div>
            </div>

            {/* Firmas y Datos Profesionales */}
            <div className="grid grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#00573F]">
              {/* Firma del Declarante */}
              <div className="col-span-12 md:col-span-6 p-4 space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#00573F]">
                  <span>981. Firma del Contribuyente o Declarante</span>
                  <CheckCircle2 className="size-4 text-forest" />
                </div>
                <div className="h-16 rounded border border-dashed border-line bg-white flex items-center justify-center text-muted text-xs italic">
                  [ Firma Digitalizada / Autógrafa del Declarante ]
                </div>
                <div className="text-[11px] text-muted">
                  <p className="font-semibold text-ink">{fullName}</p>
                  <p>NIT / C.C. {id.nit || "—"} - {id.dv || "0"}</p>
                </div>
              </div>

              {/* Firma Contador / Revisor Fiscal */}
              <div className="col-span-12 md:col-span-6 p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#00573F]">
                  <span>982. Firma Contador Público / Revisor Fiscal</span>
                  <span className="font-mono text-[10px] text-muted">983. Tarjeta Profesional</span>
                </div>
                {(() => {
                  const requiereContador = (c.casillas[29] ?? 0) >= c.uvt * 100000 || id.llevaLibros;
                  return (
                    <>
                      <div className="h-16 rounded border border-dashed border-line bg-[#fafafa] flex items-center justify-center text-muted text-xs italic">
                        {requiereContador
                          ? "[ Requiere Firma de Contador Público (Patrimonio/Ingresos ≥ 100.000 UVT o lleva libros) ]"
                          : "[ Firma no requerida por topes legales de ingresos o patrimonio ]"}
                      </div>
                      <div className="text-[11px] text-muted">
                        <p>
                          {requiereContador
                            ? "Obligado a firma según Art. 596 E.T."
                            : "Declaración sin obligatoriedad de contador"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Espacio reservado para el sello DIAN / Entidad Recaudadora */}
            <div className="border-t border-[#00573F] bg-[#f0f5f2] p-2 text-center text-[10px] text-muted">
              <span className="font-bold text-[#00573F]">
                997. Espacio reservado para el sello de la entidad recaudadora / DIAN MUISCA
              </span>
              <p className="text-[9px] mt-0.5">
                Declaración Privada generada electrónicamente conforme a los Arts. 574, 596 y 598 del Estatuto Tributario.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Modal o Popover Informativo de la Casilla Seleccionada */}
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
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-forest text-sm font-bold text-white">
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
                    <span className="text-[10px] uppercase tracking-wider text-muted">Valor actual</span>
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
