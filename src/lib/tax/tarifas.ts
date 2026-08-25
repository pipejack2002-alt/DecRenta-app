import { uvtFromPesos, uvtValue, pos, roundPesos, type UvtOverrides } from "./uvt.ts";

export type TaxBracket = {
  from: number;
  to: number | null;
  rate: number;
  baseUvt: number;
  plusUvt: number;
};

/** Art. 241 E.T. — personas naturales residentes (Ley 2277 de 2022). */
export const ART_241: TaxBracket[] = [
  { from: 0, to: 1090, rate: 0, baseUvt: 0, plusUvt: 0 },
  { from: 1090, to: 1700, rate: 0.19, baseUvt: 1090, plusUvt: 0 },
  { from: 1700, to: 4100, rate: 0.28, baseUvt: 1700, plusUvt: 116 },
  { from: 4100, to: 8670, rate: 0.33, baseUvt: 4100, plusUvt: 786 },
  { from: 8670, to: 18970, rate: 0.35, baseUvt: 8670, plusUvt: 2296 },
  { from: 18970, to: 31000, rate: 0.37, baseUvt: 18970, plusUvt: 5901 },
  { from: 31000, to: null, rate: 0.39, baseUvt: 31000, plusUvt: 10352 },
];

/** Dividendos 2016 y anteriores gravados — tabla histórica art. 241 vigente 2016. */
export const ART_241_2016: TaxBracket[] = [
  { from: 0, to: 1090, rate: 0, baseUvt: 0, plusUvt: 0 },
  { from: 1090, to: 1700, rate: 0.19, baseUvt: 1090, plusUvt: 0 },
  { from: 1700, to: 4100, rate: 0.28, baseUvt: 1700, plusUvt: 116 },
  { from: 4100, to: null, rate: 0.33, baseUvt: 4100, plusUvt: 786 },
];

export function taxFromTable(
  basePesos: number,
  year: number,
  table: TaxBracket[],
  overrides?: UvtOverrides | null,
): number {
  const uvt = uvtFromPesos(pos(basePesos), year, overrides);
  const row = table.find((b) => uvt > b.from && (b.to === null || uvt <= b.to)) ?? table[0];
  if (!row || row.rate === 0) return 0;
  const taxUvt = (uvt - row.baseUvt) * row.rate + row.plusUvt;
  return roundPesos(taxUvt * uvtValue(year, overrides));
}

export function taxArt241(basePesos: number, year: number, overrides?: UvtOverrides | null): number {
  return taxFromTable(basePesos, year, ART_241, overrides);
}

export function taxArt241_2016(basePesos: number, year: number, overrides?: UvtOverrides | null): number {
  return taxFromTable(basePesos, year, ART_241_2016, overrides);
}

export function findBracket(basePesos: number, year: number, table = ART_241, overrides?: UvtOverrides | null): TaxBracket {
  const uvt = uvtFromPesos(pos(basePesos), year, overrides);
  return table.find((b) => uvt > b.from && (b.to === null || uvt <= b.to)) ?? table[0];
}

/** Descuento art. 254-1: 19% sobre exceso de 1.090 UVT de la renta líquida de dividendos. */
export function discountArt254_1(basePesos: number, year: number, overrides?: UvtOverrides | null): number {
  const uvt = uvtFromPesos(pos(basePesos), year, overrides);
  if (uvt <= 1090) return 0;
  return roundPesos((uvt - 1090) * 0.19 * uvtValue(year, overrides));
}
