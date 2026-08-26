import { createFileRoute } from "@tanstack/react-router";
import { DeadlineLookup } from "@/components/layout/deadline-lookup";
import { ToggleField } from "@/components/layout/money-field";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import {
  deadlineForNit,
  isZonaSismo1226,
  RENTA_DEADLINES_2026,
  RENTA_DEADLINES_DECRETO_1226,
  SECCIONALES_DECRETO_1226,
  SECCIONALES_DECRETO_1226_LABEL,
} from "@/lib/tax/calendar";
import { cn } from "@/lib/utils";
import { SECCIONALES } from "@/lib/catalogs";

export const Route = createFileRoute("/calendario")({ component: CalendarioPage });

function CalendarioPage() {
  const nit = useAppStore((s) => s.declaration.identity.nit);
  const seccional = useAppStore((s) => s.declaration.identity.dirSeccional);
  const seccionales = useAppStore((s) => s.customSeccionales);
  const zonaManual = useAppStore((s) => s.declaration.identity.zonaSismo1226);
  const patch = useAppStore((s) => s.patch);
  const zona = isZonaSismo1226(seccional, zonaManual);
  const mine = deadlineForNit(nit, { zonaSismo1226: zona, seccional });
  const today = new Date().toISOString().slice(0, 10);
  const autoZona = SECCIONALES_DECRETO_1226.has(seccional);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Calendario Tributario DIAN · Año 2026</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Vencimientos Declaración de Renta</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Plazos oficiales de presentación y pago del Formulario 210 (Personas Naturales, AG 2025) según los dos últimos dígitos del NIT del RUT, sin dígito de verificación. Incluye plazos especiales del Decreto 1226.
        </p>
      </header>

      <DeadlineLookup />

      <Card className="space-y-4">
        <CardTitle className="text-lg">Zona del sismo · Decreto 1226</CardTitle>
        <CardHint>
          Si al 10 de agosto de 2026 su domicilio fiscal (casilla 12 del RUT) estaba en {SECCIONALES_DECRETO_1226_LABEL} y su NIT termina entre 01 y 26, el vencimiento se corrió a octubre–noviembre de 2026. No aplica a grandes contribuyentes.
        </CardHint>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Dirección seccional del RUT</p>
          <select
            className="h-11 w-full max-w-md rounded-md border border-line bg-surface px-3 text-sm"
            value={seccional}
            onChange={(e) => patch((x) => (x.identity.dirSeccional = e.target.value))}
          >
            {seccionales.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name} {s.isCustom ? "⭐" : ""}
              </option>
            ))}
          </select>
          {autoZona ? (
            <p className="text-xs text-ok">Esta seccional está cubierta por el Decreto 1226. El plazo especial se aplica solo si los dígitos son 01 a 26.</p>
          ) : null}
        </div>
        <ToggleField
          label="Domicilio en Palmira, Tuluá, Buenaventura o Quibdó"
          hint="Márquelo si su seccional no aparece en la lista pero el RUT estaba en uno de esos municipios el 10 de agosto de 2026."
          checked={zonaManual}
          onChange={(v) => patch((x) => (x.identity.zonaSismo1226 = v))}
        />
      </Card>

      <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-raise)]">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3">Dígitos</th>
              <th>Fecha límite</th>
              <th className="hidden sm:table-cell">Régimen</th>
            </tr>
          </thead>
          <tbody>
            {RENTA_DEADLINES_2026.map((row) => {
              const special = RENTA_DEADLINES_DECRETO_1226.find((s) => s.digits[0] === row.digits[0]);
              const shown = zona && special ? special : row;
              const isMine = mine?.iso === shown.iso && mine.digits[0] === shown.digits[0];
              const past = shown.iso < today;
              return (
                <tr
                  key={row.digits.join()}
                  className={cn(
                    "border-t border-line",
                    isMine && "bg-forest-mist",
                    past && !isMine && "text-faint",
                  )}
                >
                  <td className="px-4 py-2 tabular-nums">
                    {row.digits[0]} y {row.digits[1]}
                  </td>
                  <td className="py-2">{shown.date}</td>
                  <td className="hidden py-2 pr-4 text-xs text-muted sm:table-cell">
                    {zona && special ? "Decreto 1226" : "General"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card>
        <CardTitle className="text-lg">Si se pasa del plazo</CardTitle>
        <CardHint>
          Sanción por extemporaneidad: 5 % del impuesto a cargo por mes o fracción (art. 641 E.T.), sin bajar de 10 UVT del año de presentación (art. 639). Tras emplazamiento, el 10 % mensual (art. 642). Pague con el formulario 490. Cedulario no presenta ni recauda.
        </CardHint>
      </Card>
    </div>
  );
}
