import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Info, RotateCcw, Sparkles } from "lucide-react";
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

  const [inputYear, setInputYear] = useState(String(year));
  useEffect(() => {
    setInputYear(String(year));
  }, [year]);

  const gravableOfficial = officialUvt(year);
  const filingOfficial = officialUvt(filing);
  const gravableValue = overrides[year] || gravableOfficial || 0;
  const filingValue = overrides[filing] || filingOfficial || 0;

  const quickYears = [2026, 2025, 2024, 2023];

  function handleYearChange(newYearStr: string) {
    setInputYear(newYearStr);
    const y = Number(newYearStr);
    if (y >= 1990 && y <= 2100) {
      setYear(y);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-forest">Art. 868 E.T.</span>
            <Badge tone="neutral" className="text-[10px]">Parámetro Universal</Badge>
          </div>
          <CardTitle className="text-lg sm:text-xl mt-1">Unidad de Valor Tributario (UVT) por Año</CardTitle>
          <CardHint>
            Los topes de ingresos, patrimonio, deducciones (1.340 UVT, 790 UVT, 1.200 UVT) y la tabla del Art. 241 se liquidan con la UVT del <strong>año gravable</strong>. Las sanciones y anticipos mínimos usan la UVT del <strong>año de presentación</strong>.
            Puedes seleccionar un año predeterminado o <strong>digitar libremente cualquier año futuro (2026, 2027, 2030...)</strong> y su valor UVT respectivo.
          </CardHint>
        </div>
        {c.uvtOverridden ? (
          <Badge tone="warn" className="font-semibold shadow-xs">UVT personalizada activa</Badge>
        ) : (
          <Badge tone="ok" className="font-semibold shadow-xs">UVT oficial DIAN</Badge>
        )}
      </div>

      {/* Selector Rápido y Campo Libre de Año */}
      <div className="p-4 rounded-xl bg-forest-mist/30 border border-line space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-ink">
            1. Seleccionar o Digitar Año Gravable:
          </Label>
          <span className="font-mono text-xs font-bold text-forest-deep">
            Año Activo: {year} (Declaración en {filing})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botones de Años Comunes */}
          {quickYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(y);
                setInputYear(String(y));
              }}
              className={`h-9 px-3.5 rounded-lg font-mono text-xs font-bold transition-all ${
                year === y
                  ? "bg-forest text-white shadow-xs"
                  : "bg-surface border border-line text-ink-soft hover:bg-forest-mist hover:text-ink"
              }`}
            >
              {y}
            </button>
          ))}

          {/* Campo para Digitar CUALQUIER Año Libremente */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-medium text-muted">Otro año:</span>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Ej: 2030"
                className="w-24 h-9 font-mono text-xs font-bold text-center pl-2 pr-2"
                value={inputYear}
                onChange={(e) => handleYearChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onBlur={() => {
                  const y = Number(inputYear);
                  if (y >= 1990 && y <= 2100) {
                    setYear(y);
                  } else {
                    setInputYear(String(year));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inputs de UVT Gravable y de Presentación */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* UVT Año Gravable */}
        <div className="p-3.5 rounded-xl border border-line bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="uvt-ag" className="text-xs font-bold text-ink">
              UVT {year} (Año Gravable a Liquidar)
            </Label>
            {overrides[year] ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                Personalizada
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                Oficial
              </span>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">$</span>
            <Input
              id="uvt-ag"
              className="pl-7 font-mono text-sm font-bold text-forest-deep"
              inputMode="numeric"
              placeholder="Ej: 55.000"
              value={gravableValue ? formatNumber(gravableValue) : ""}
              onChange={(e) => {
                const n = parseMoney(e.target.value);
                setUvtOverride(year, n > 0 ? n : null);
              }}
            />
          </div>
          <p className="text-[11px] text-muted leading-tight">
            {gravableOfficial ? (
              <>Resolución oficial: <strong className="text-ink">{UVT_BY_YEAR[year]?.resolucion}</strong> ({formatCOP(gravableOfficial)})</>
            ) : (
              <span className="text-amber-800 font-medium">
                Año futuro/sin resolución registrada. Digita aquí el valor que fije la DIAN para liquidar topes y tablas.
              </span>
            )}
          </p>
        </div>

        {/* UVT Año de Presentación */}
        <div className="p-3.5 rounded-xl border border-line bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="uvt-fil" className="text-xs font-bold text-ink">
              UVT {filing} (Año de Presentación / Sanciones)
            </Label>
            {overrides[filing] ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                Personalizada
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                Oficial
              </span>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">$</span>
            <Input
              id="uvt-fil"
              className="pl-7 font-mono text-sm font-bold text-forest-deep"
              inputMode="numeric"
              placeholder="Ej: 58.000"
              value={filingValue ? formatNumber(filingValue) : ""}
              onChange={(e) => {
                const n = parseMoney(e.target.value);
                setUvtOverride(filing, n > 0 ? n : null);
              }}
            />
          </div>
          <p className="text-[11px] text-muted leading-tight">
            {filingOfficial ? (
              <>Resolución oficial: <strong className="text-ink">{UVT_BY_YEAR[filing]?.resolucion}</strong> ({formatCOP(filingOfficial)})</>
            ) : (
              <span className="text-amber-800 font-medium">
                Aplica para la sanción mínima legal (10 UVT = {formatCOP(filingValue * 10 || 0)}) y extemporaneidad.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Botón Restaurar si hay override */}
      {(overrides[year] || overrides[filing]) && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUvtOverride(year, null);
              setUvtOverride(filing, null);
            }}
            className="text-xs text-muted hover:text-ink"
          >
            <RotateCcw className="mr-1.5 size-3" />
            Restaurar valores oficiales de la DIAN
          </Button>
        </div>
      )}

      {/* Tabla Referencial de Resoluciones Oficiales */}
      <div className="space-y-2 pt-2 border-t border-line">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
          Histórico de Resoluciones DIAN Registradas:
        </h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {officialYears().map((y) => {
            const info = UVT_BY_YEAR[y];
            const isCurrent = y === year;
            return (
              <div
                key={y}
                onClick={() => {
                  setYear(y);
                  setInputYear(String(y));
                }}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? "border-forest bg-forest-mist/50 ring-1 ring-forest"
                    : "border-line bg-muted-mist/20 hover:bg-muted-mist/60"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="font-mono">{y}</span>
                  <span className="font-mono text-forest-deep">{formatCOP(info.value)}</span>
                </div>
                <p className="text-[10px] text-muted mt-1 truncate" title={info.resolucion}>
                  {info.resolucion}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
