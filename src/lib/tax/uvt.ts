/** Unidades de Valor Tributario oficiales DIAN. */
export const UVT_BY_YEAR: Record<
  number,
  { value: number; resolucion: string; fuente: string }
> = {
  2023: {
    value: 42412,
    resolucion: "Resolución 000126 de 2022",
    fuente: "https://www.dian.gov.co",
  },
  2024: {
    value: 47065,
    resolucion: "Resolución 000187 del 28 de noviembre de 2023",
    fuente: "https://www.dian.gov.co",
  },
  2025: {
    value: 49799,
    resolucion: "Resolución 000193 del 4 de diciembre de 2024",
    fuente: "https://www.dian.gov.co",
  },
  2026: {
    value: 52374,
    resolucion: "Resolución 000238 del 15 de diciembre de 2025",
    fuente:
      "https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000238%20de%2015-12-2025.Pdf",
  },
};

export const DEFAULT_AG = 2025;
/** @deprecated Use filingYearOf(year). Kept so older imports do not break. */
export const FILING_YEAR = 2026;

export type UvtOverrides = Record<number, number>;

export function officialYears(): number[] {
  return Object.keys(UVT_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b);
}

export function officialUvt(year: number): number | undefined {
  return UVT_BY_YEAR[year]?.value;
}

export function latestOfficialYear(): number {
  const years = officialYears();
  return years[years.length - 1] ?? DEFAULT_AG;
}

export function filingYearOf(gravableYear: number): number {
  return gravableYear + 1;
}

export function normalizeOverrides(raw: unknown): UvtOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: UvtOverrides = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const y = Number(k);
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isInteger(y) && y >= 1990 && y <= 2100 && Number.isFinite(n) && n > 0) {
      out[y] = Math.round(n);
    }
  }
  return out;
}

export function uvtValue(year: number, overrides?: UvtOverrides | null): number {
  const ov = overrides?.[year];
  if (typeof ov === "number" && ov > 0) return Math.round(ov);
  const official = UVT_BY_YEAR[year]?.value;
  if (official) return official;
  return UVT_BY_YEAR[latestOfficialYear()]?.value ?? UVT_BY_YEAR[DEFAULT_AG].value;
}

export function uvtIsOfficial(year: number, overrides?: UvtOverrides | null): boolean {
  const ov = overrides?.[year];
  if (typeof ov === "number" && ov > 0) return false;
  return Boolean(UVT_BY_YEAR[year]);
}

export function pesosFromUvt(uvt: number, year = DEFAULT_AG, overrides?: UvtOverrides | null): number {
  return Math.round(uvt * uvtValue(year, overrides));
}

/** La DIAN publica los topes de obligación redondeados al millar. */
export function dianRoundThousands(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export function uvtFromPesos(pesos: number, year = DEFAULT_AG, overrides?: UvtOverrides | null): number {
  const v = uvtValue(year, overrides);
  if (!v) return 0;
  return pesos / v;
}

export function roundPesos(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function pos(n: number): number {
  return n > 0 ? n : 0;
}
