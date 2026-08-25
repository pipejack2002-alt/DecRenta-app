import { createFileRoute } from "@tanstack/react-router";
import { Download, FileCode, FileSpreadsheet, Printer } from "lucide-react";
import { useAppStore, useComputed } from "@/lib/store";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { downloadFile, generateFormulario210Csv, generateFormulario210Xml } from "@/lib/tax/export-dian";
import { formatCOP, formatNumber } from "@/lib/tax/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/formulario")({ component: FormularioPage });

const ROWS: number[][] = [
  [28, 29, 30, 31],
  [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
  [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
  [74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
  [91, 92, 93, 94, 95, 96, 97, 98],
  [99, 100, 101, 102, 103],
  [104, 105, 106, 107, 108, 109, 110, 111],
  [112, 113, 114, 115],
  [116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126],
  [127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141],
];

function FormularioPage() {
  const d = useAppStore((s) => s.declaration);
  const c = useComputed();
  const id = d.identity;

  function exportJson() {
    const jsonStr = JSON.stringify({ identity: id, casillas: c.casillas, year: d.year }, null, 2);
    downloadFile(`tributoapp-210-ag${d.year}-${id.nit || "dian"}.json`, jsonStr, "application/json");
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3" data-print-hide>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">DIAN · Formulario Oficial · AG {d.year}</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Borrador Formulario 210</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Hoja de trabajo y liquidación del Formulario 210. Exportable a XML Prevalidador, CSV Excel y JSON para facilitar la presentación en los servicios informáticos de la DIAN.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={exportXml} title="Exportar archivo XML compatible con el prevalidador de la DIAN">
            <FileCode className="size-4" />
            XML DIAN
          </Button>
          <Button variant="secondary" onClick={exportCsv} title="Descargar archivo CSV compatible con Excel">
            <FileSpreadsheet className="size-4" />
            CSV Excel
          </Button>
          <Button variant="secondary" onClick={exportJson} title="Exportar respaldo de casillas en formato JSON">
            <Download className="size-4" />
            JSON
          </Button>
          <Button variant="outline" data-print-hide onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="flex items-stretch">
          <div className="w-2 bg-forest" />
          <div className="flex-1 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Declaración de renta y complementario</p>
                <p className="font-display text-2xl">Personas naturales residentes</p>
              </div>
              <div className="text-right">
                <p className="font-display text-4xl tabular-nums text-forest">210</p>
                <p className="text-xs text-muted">Año gravable {d.year}</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <Item k="5. NIT" v={id.nit || "—"} />
              <Item k="6. DV" v={id.dv || "—"} />
              <Item k="7–10. Nombre" v={[id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres].filter(Boolean).join(" ") || "—"} />
              <Item k="12. Dir. seccional" v={id.dirSeccional} />
              <Item k="24. CIIU" v={id.actividadCiiu} />
            </dl>
          </div>
        </div>
      </Card>

      {ROWS.map((group, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-raise)]">
          <table className="w-full text-sm">
            <tbody>
              {group.map((n) => (
                <tr key={n} className="border-t border-line first:border-t-0">
                  <td className="w-14 px-3 py-2 font-mono text-[11px] text-faint">{n}</td>
                  <td className="px-2 py-2 text-ink-soft">{CASILLA_LABELS[n] ?? `Casilla ${n}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {n === 140 ? (c.casillas[n] ? "X" : "") : formatCOP(c.casillas[n] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="text-xs text-faint">
        Espacios 980–997 (firma, contador, sello) son del recaudo. Si patrimonio o ingresos ≥ 100.000 UVT ({formatNumber(100000)} UVT), debe firmar contador público.
      </p>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
