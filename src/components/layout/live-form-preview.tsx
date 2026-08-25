import { FileCode, FileSpreadsheet, Printer, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { downloadFile, generateFormulario210Csv, generateFormulario210Xml } from "@/lib/tax/export-dian";
import { formatCOP } from "@/lib/tax/format";

const SECTIONS: { title: string; casillas: number[] }[] = [
  {
    title: "Patrimonio",
    casillas: [28, 29, 30, 31],
  },
  {
    title: "Cédula General — Rentas de Trabajo",
    casillas: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  },
  {
    title: "Cédula General — Honorarios con Costos",
    casillas: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
  },
  {
    title: "Cédula General — Rentas de Capital",
    casillas: [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
  },
  {
    title: "Cédula General — Rentas No Laborales",
    casillas: [74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
  },
  {
    title: "Depuración Cédula General y Rentas Gravables",
    casillas: [91, 92, 93, 94, 95, 96, 97, 98],
  },
  {
    title: "Cédula de Pensiones",
    casillas: [99, 100, 101, 102, 103],
  },
  {
    title: "Cédula de Dividendos y Participaciones",
    casillas: [104, 105, 106, 107, 108, 109, 110, 111],
  },
  {
    title: "Ganancias Ocasionales",
    casillas: [112, 113, 114, 115],
  },
  {
    title: "Liquidación Privada — Impuesto y Descuentos",
    casillas: [116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126],
  },
  {
    title: "Liquidación Privada — Total Impuesto, Anticipos y Saldo",
    casillas: [127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137],
  },
  {
    title: "Datos Informativos",
    casillas: [138, 139, 140, 141],
  },
];

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
  const [query, setQuery] = useState("");

  const name =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "Persona Natural";

  function exportXml() {
    const xml = generateFormulario210Xml(d, c);
    downloadFile(`declaracion-210-ag${d.year}-${id.nit || "dian"}.xml`, xml, "application/xml");
  }

  function exportCsv() {
    const csv = generateFormulario210Csv(d, c);
    downloadFile(`formulario-210-ag${d.year}-${id.nit || "dian"}.csv`, csv, "text/csv");
  }

  const normalizedQuery = query.toLowerCase().trim();

  return (
    <div
      className={
        isModal
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          : "h-full w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-md"
      }
    >
      <div
        className={
          isModal
            ? "relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl flex flex-col"
            : "flex h-full flex-col overflow-hidden"
        }
      >
        {/* Cabecera del Preview */}
        <div className="border-b border-line bg-bg-raised px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Badge tone="forest">210 en vivo</Badge>
            <span className="font-display text-sm font-semibold text-ink">
              AG {d.year} · {name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={exportXml}
              title="Descargar XML Prevalidador"
              className="h-8 px-2 text-xs"
            >
              <FileCode className="size-3.5 mr-1" />
              XML
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCsv}
              title="Descargar CSV Excel"
              className="h-8 px-2 text-xs"
            >
              <FileSpreadsheet className="size-3.5 mr-1" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              title="Imprimir"
              className="h-8 px-2 text-xs"
            >
              <Printer className="size-3.5" />
            </Button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-muted hover:bg-surface ml-1"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="border-b border-line bg-surface px-4 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted" />
            <input
              type="text"
              placeholder="Buscar casilla por número o concepto (ej: 32, salarios, 97, patrimonio)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-line bg-bg-raised pl-8 pr-3 text-xs focus:border-forest focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-2 text-xs text-muted hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Contenido scrolleable de Casillas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Datos del contribuyente */}
          <div className="rounded-xl border border-line bg-bg-raised p-3">
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <div>
                <span className="text-muted">5. NIT / Cédula:</span>
                <p className="font-mono font-semibold text-ink">
                  {id.nit || "—"} {id.dv ? `-${id.dv}` : ""}
                </p>
              </div>
              <div>
                <span className="text-muted">12. Seccional:</span>
                <p className="font-medium text-ink">{id.dirSeccional || "—"}</p>
              </div>
              <div>
                <span className="text-muted">24. Actividad CIIU:</span>
                <p className="font-mono font-medium text-ink">{id.actividadCiiu || "—"}</p>
              </div>
              <div>
                <span className="text-muted">Tipo:</span>
                <p className="font-medium text-ink">{id.esCorreccion ? "Corrección" : "Inicial"}</p>
              </div>
            </div>
          </div>

          {/* Bloques temáticos de casillas */}
          {SECTIONS.map((sec) => {
            const filteredCasillas = sec.casillas.filter((n) => {
              if (!normalizedQuery) return true;
              const label = CASILLA_LABELS[n] ?? "";
              return (
                String(n).includes(normalizedQuery) ||
                label.toLowerCase().includes(normalizedQuery) ||
                sec.title.toLowerCase().includes(normalizedQuery)
              );
            });

            if (filteredCasillas.length === 0) return null;

            return (
              <div key={sec.title} className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="border-b border-line bg-forest-mist/50 px-3 py-1.5 font-display text-xs font-semibold text-forest-deep">
                  {sec.title}
                </div>
                <table className="w-full text-left">
                  <tbody>
                    {filteredCasillas.map((n) => {
                      const val = c.casillas[n];
                      const label = CASILLA_LABELS[n] ?? `Casilla ${n}`;
                      const isHighlighted = (val ?? 0) > 0 || n === 140;

                      return (
                        <tr
                          key={n}
                          className={`border-b border-line last:border-b-0 ${
                            isHighlighted ? "bg-forest-mist/10" : ""
                          }`}
                        >
                          <td className="w-10 px-3 py-1.5 font-mono text-[10px] text-muted">
                            {n}
                          </td>
                          <td className="px-2 py-1.5 text-ink-soft">{label}</td>
                          <td className="w-32 px-3 py-1.5 text-right font-mono text-xs tabular-nums text-ink">
                            {n === 140
                              ? val
                                ? "X"
                                : "—"
                              : formatCOP(val ?? 0)}
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

        {/* Pie resumen de saldos */}
        <div className="border-t border-line bg-bg-raised px-4 py-2.5 flex items-center justify-between shrink-0 text-xs">
          <span className="text-muted">
            {c.saldoPagar > 0 ? "Saldo a pagar (Casilla 136):" : "Saldo a favor (Casilla 137):"}
          </span>
          <span
            className={`font-display text-base font-bold tabular-nums ${
              c.saldoPagar > 0 ? "text-stamp" : "text-forest"
            }`}
          >
            {formatCOP(c.saldoPagar || c.saldoFavor)}
          </span>
        </div>
      </div>
    </div>
  );
}
