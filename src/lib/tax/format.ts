const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return "$ 0";
  return cop.format(Math.round(value));
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return num.format(Math.round(value));
}

export function formatUvt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0 UVT";
  return `${value.toLocaleString("es-CO", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })} UVT`;
}

export function parseMoney(raw: string): number {
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (!cleaned || cleaned === "-") return 0;
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0 %";
  return `${(value * 100).toLocaleString("es-CO", {
    maximumFractionDigits: digits,
  })} %`;
}
