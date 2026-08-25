import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP, formatNumber, parseMoney } from "@/lib/tax/format";
import {
  UVT_BY_YEAR,
  filingYearOf,
  officialUvt,
  officialYears,
} from "@/lib/tax/uvt";

export function UvtPanel() {
  const year = useAppStore((s) => s.declaration.year);
  const overrides = useAppStore((s) => s.declaration.uvtOverrides);
  const setYear = useAppStore((s) => s.setYear);
  const setUvtOverride = useAppStore((s) => s.setUvtOverride);
  const c = useComputed();
  const filing = filingYearOf(year);
  const [customYear, setCustomYear] = useState("");

  const gravableOfficial = officialUvt(year);
  const filingOfficial = officialUvt(filing);
  const gravableValue = overrides[year] || gravableOfficial || 0;
  const filingValue = overrides[filing] || filingOfficial || 0;
  const years = Array.from(new Set([...officialYears(), year, filing])).sort((a, b) => a - b);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Art. 868 E.T.</p>
          <CardTitle className="text-lg sm:text-xl">UVT de cada año</CardTitle>
          <CardHint>
            Los topes de obligación y la tabla del art. 241 se liquidan con la UVT del año gravable. Las sanciones, con la UVT del año en que se presenta. Cuando la DIAN publique un valor nuevo, digitelo aquí: no hay que esperar una actualización de la app.
          </CardHint>
        </div>
        {c.uvtOverridden ? <Badge tone="warn">UVT digitada</Badge> : <Badge tone="ok">UVT oficial</Badge>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ag-year">Año gravable</Label>
          <select
            id="ag-year"
            className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            value={years.includes(year) ? String(year) : "otro"}
            onChange={(e) => {
              if (e.target.value === "otro") return;
              setYear(Number(e.target.value));
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            <option value="otro">Otro año…</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uvt-ag">UVT {year} (año gravable)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <Input
              id="uvt-ag"
              className="pl-7"
              inputMode="numeric"
              value={gravableValue ? formatNumber(gravableValue) : ""}
              onChange={(e) => {
                const n = parseMoney(e.target.value);
                setUvtOverride(year, n > 0 ? n : null);
              }}
            />
          </div>
          <p className="text-xs text-faint">
            {gravableOfficial
              ? `Oficial: ${formatCOP(gravableOfficial)}${overrides[year] ? " · hay un valor digitado" : ""}`
              : "No hay resolución cargada para este año. Digite el valor DIAN."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uvt-fil">UVT {filing} (presentación)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <Input
              id="uvt-fil"
              className="pl-7"
              inputMode="numeric"
              value={filingValue ? formatNumber(filingValue) : ""}
              onChange={(e) => {
                const n = parseMoney(e.target.value);
                setUvtOverride(filing, n > 0 ? n : null);
              }}
            />
          </div>
          <p className="text-xs text-faint">
            {filingOfficial
              ? `Oficial: ${formatCOP(filingOfficial)}${overrides[filing] ? " · hay un valor digitado" : ""}`
              : "Sanciones (p. ej. mínima de 10 UVT) usan este valor."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="custom-year">Cargar otro año</Label>
          <Input
            id="custom-year"
            className="w-32"
            inputMode="numeric"
            placeholder="2027"
            value={customYear}
            onChange={(e) => setCustomYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={customYear.length !== 4}
          onClick={() => {
            const y = Number(customYear);
            if (y >= 1990 && y <= 2100) {
              setYear(y);
              setCustomYear("");
            }
          }}
        >
          Usar ese año
        </Button>
        {(overrides[year] || overrides[filing]) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setUvtOverride(year, null);
              setUvtOverride(filing, null);
            }}
          >
            Restaurar oficiales
          </Button>
        )}
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {officialYears().map((y) => {
          const info = UVT_BY_YEAR[y];
          return (
            <li key={y} className="rounded-md border border-line px-3 py-2 text-sm">
              <span className="font-medium tabular-nums">{y}</span>
              <span className="mx-2 text-muted">·</span>
              <span className="tabular-nums">{formatCOP(info.value)}</span>
              <span className="mt-0.5 block text-[11px] text-faint">{info.resolucion}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
