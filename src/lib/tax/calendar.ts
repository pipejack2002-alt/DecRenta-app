/**
 * Plazos de declaración de renta personas naturales 2026 (AG 2025).
 * Dos últimos dígitos del NIT del RUT, sin dígito de verificación.
 *
 * Calendario general: Decreto que fija el calendario tributario 2026 /
 * Comunicado de Prensa DIAN No. 090 de 2026.
 * https://www.dian.gov.co/Calendarios/Calendario_Tributario_2026.pdf
 *
 * Plazo especial (solo dígitos 01–26 y domicilio en seccionales del sismo):
 * Decreto 1226 del 18 de agosto de 2026 · Comunicados DIAN 101 y 105.
 */
export type DeadlineRow = {
  digits: [string, string];
  date: string;
  iso: string;
};

export type DeadlineHit = DeadlineRow & {
  lastTwo: string;
  regime: "general" | "decreto-1226";
  source: string;
};

export const RENTA_DEADLINES_2026: DeadlineRow[] = [
  { digits: ["01", "02"], date: "12 de agosto de 2026", iso: "2026-08-12" },
  { digits: ["03", "04"], date: "13 de agosto de 2026", iso: "2026-08-13" },
  { digits: ["05", "06"], date: "14 de agosto de 2026", iso: "2026-08-14" },
  { digits: ["07", "08"], date: "18 de agosto de 2026", iso: "2026-08-18" },
  { digits: ["09", "10"], date: "19 de agosto de 2026", iso: "2026-08-19" },
  { digits: ["11", "12"], date: "20 de agosto de 2026", iso: "2026-08-20" },
  { digits: ["13", "14"], date: "21 de agosto de 2026", iso: "2026-08-21" },
  { digits: ["15", "16"], date: "24 de agosto de 2026", iso: "2026-08-24" },
  { digits: ["17", "18"], date: "25 de agosto de 2026", iso: "2026-08-25" },
  { digits: ["19", "20"], date: "26 de agosto de 2026", iso: "2026-08-26" },
  { digits: ["21", "22"], date: "27 de agosto de 2026", iso: "2026-08-27" },
  { digits: ["23", "24"], date: "28 de agosto de 2026", iso: "2026-08-28" },
  { digits: ["25", "26"], date: "31 de agosto de 2026", iso: "2026-08-31" },
  { digits: ["27", "28"], date: "1 de septiembre de 2026", iso: "2026-09-01" },
  { digits: ["29", "30"], date: "2 de septiembre de 2026", iso: "2026-09-02" },
  { digits: ["31", "32"], date: "3 de septiembre de 2026", iso: "2026-09-03" },
  { digits: ["33", "34"], date: "4 de septiembre de 2026", iso: "2026-09-04" },
  { digits: ["35", "36"], date: "7 de septiembre de 2026", iso: "2026-09-07" },
  { digits: ["37", "38"], date: "8 de septiembre de 2026", iso: "2026-09-08" },
  { digits: ["39", "40"], date: "9 de septiembre de 2026", iso: "2026-09-09" },
  { digits: ["41", "42"], date: "10 de septiembre de 2026", iso: "2026-09-10" },
  { digits: ["43", "44"], date: "11 de septiembre de 2026", iso: "2026-09-11" },
  { digits: ["45", "46"], date: "14 de septiembre de 2026", iso: "2026-09-14" },
  { digits: ["47", "48"], date: "15 de septiembre de 2026", iso: "2026-09-15" },
  { digits: ["49", "50"], date: "16 de septiembre de 2026", iso: "2026-09-16" },
  { digits: ["51", "52"], date: "17 de septiembre de 2026", iso: "2026-09-17" },
  { digits: ["53", "54"], date: "18 de septiembre de 2026", iso: "2026-09-18" },
  { digits: ["55", "56"], date: "21 de septiembre de 2026", iso: "2026-09-21" },
  { digits: ["57", "58"], date: "22 de septiembre de 2026", iso: "2026-09-22" },
  { digits: ["59", "60"], date: "23 de septiembre de 2026", iso: "2026-09-23" },
  { digits: ["61", "62"], date: "24 de septiembre de 2026", iso: "2026-09-24" },
  { digits: ["63", "64"], date: "25 de septiembre de 2026", iso: "2026-09-25" },
  { digits: ["65", "66"], date: "28 de septiembre de 2026", iso: "2026-09-28" },
  { digits: ["67", "68"], date: "1 de octubre de 2026", iso: "2026-10-01" },
  { digits: ["69", "70"], date: "2 de octubre de 2026", iso: "2026-10-02" },
  { digits: ["71", "72"], date: "5 de octubre de 2026", iso: "2026-10-05" },
  { digits: ["73", "74"], date: "6 de octubre de 2026", iso: "2026-10-06" },
  { digits: ["75", "76"], date: "7 de octubre de 2026", iso: "2026-10-07" },
  { digits: ["77", "78"], date: "8 de octubre de 2026", iso: "2026-10-08" },
  { digits: ["79", "80"], date: "9 de octubre de 2026", iso: "2026-10-09" },
  { digits: ["81", "82"], date: "13 de octubre de 2026", iso: "2026-10-13" },
  { digits: ["83", "84"], date: "14 de octubre de 2026", iso: "2026-10-14" },
  { digits: ["85", "86"], date: "15 de octubre de 2026", iso: "2026-10-15" },
  { digits: ["87", "88"], date: "16 de octubre de 2026", iso: "2026-10-16" },
  { digits: ["89", "90"], date: "19 de octubre de 2026", iso: "2026-10-19" },
  { digits: ["91", "92"], date: "20 de octubre de 2026", iso: "2026-10-20" },
  { digits: ["93", "94"], date: "21 de octubre de 2026", iso: "2026-10-21" },
  { digits: ["95", "96"], date: "22 de octubre de 2026", iso: "2026-10-22" },
  { digits: ["97", "98"], date: "23 de octubre de 2026", iso: "2026-10-23" },
  { digits: ["99", "00"], date: "26 de octubre de 2026", iso: "2026-10-26" },
];

/** Decreto 1226 del 18 de agosto de 2026 — solo dígitos 01 a 26. */
export const RENTA_DEADLINES_DECRETO_1226: DeadlineRow[] = [
  { digits: ["01", "02"], date: "27 de octubre de 2026", iso: "2026-10-27" },
  { digits: ["03", "04"], date: "28 de octubre de 2026", iso: "2026-10-28" },
  { digits: ["05", "06"], date: "29 de octubre de 2026", iso: "2026-10-29" },
  { digits: ["07", "08"], date: "30 de octubre de 2026", iso: "2026-10-30" },
  { digits: ["09", "10"], date: "3 de noviembre de 2026", iso: "2026-11-03" },
  { digits: ["11", "12"], date: "4 de noviembre de 2026", iso: "2026-11-04" },
  { digits: ["13", "14"], date: "5 de noviembre de 2026", iso: "2026-11-05" },
  { digits: ["15", "16"], date: "6 de noviembre de 2026", iso: "2026-11-06" },
  { digits: ["17", "18"], date: "9 de noviembre de 2026", iso: "2026-11-09" },
  { digits: ["19", "20"], date: "10 de noviembre de 2026", iso: "2026-11-10" },
  { digits: ["21", "22"], date: "11 de noviembre de 2026", iso: "2026-11-11" },
  { digits: ["23", "24"], date: "12 de noviembre de 2026", iso: "2026-11-12" },
  { digits: ["25", "26"], date: "13 de noviembre de 2026", iso: "2026-11-13" },
];

/** Casilla 12 del RUT — seccionales cubiertas por el Decreto 1226. */
export const SECCIONALES_DECRETO_1226 = new Set(["18", "19", "20", "24", "26"]);

export const SECCIONALES_DECRETO_1226_LABEL =
  "Cali, Palmira, Tuluá, Buenaventura, Pereira, Armenia, Manizales, Quibdó y Popayán";

export function lastTwoNitDigits(nit: string): string | null {
  const trimmed = nit.trim();
  const cut = /-\d$/.test(trimmed) ? trimmed.slice(0, trimmed.lastIndexOf("-")) : trimmed;
  const digits = cut.replace(/\D/g, "");
  if (digits.length < 2) return null;
  return digits.slice(-2);
}

function findRow(table: DeadlineRow[], last: string): DeadlineRow | null {
  return table.find((row) => row.digits.includes(last)) ?? null;
}

export function isZonaSismo1226(seccional?: string, manual?: boolean): boolean {
  if (manual) return true;
  if (!seccional) return false;
  return SECCIONALES_DECRETO_1226.has(seccional);
}

export function deadlineForNit(
  nit: string,
  opts?: { zonaSismo1226?: boolean; seccional?: string },
): DeadlineHit | null {
  const last = lastTwoNitDigits(nit);
  if (!last) return null;
  const general = findRow(RENTA_DEADLINES_2026, last);
  if (!general) return null;

  const zona = isZonaSismo1226(opts?.seccional, opts?.zonaSismo1226);
  if (zona) {
    const special = findRow(RENTA_DEADLINES_DECRETO_1226, last);
    if (special) {
      return {
        ...special,
        lastTwo: last,
        regime: "decreto-1226",
        source: "Decreto 1226 del 18 de agosto de 2026 · Comunicados DIAN 101 y 105",
      };
    }
  }

  return {
    ...general,
    lastTwo: last,
    regime: "general",
    source: "Calendario tributario DIAN 2026 · Comunicado de Prensa No. 090",
  };
}

export function daysUntil(iso: string, from = new Date()): number {
  const target = new Date(`${iso}T23:59:59-05:00`);
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
