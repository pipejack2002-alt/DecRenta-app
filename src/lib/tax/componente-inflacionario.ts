/**
 * Módulo de Decretos y Porcentajes Oficiales del Componente Inflacionario
 *
 * Fundamento legal:
 * - Art. 38 del E.T.: Rendimientos financieros no constitutivos de renta ni ganancia ocasional (INCRNGO).
 * - Art. 40-1 del E.T.: Fórmula legal de cálculo (Tasa de inflación DANE / Tasa de captación Superfinanciera).
 * - Art. 41 del E.T.: Aplicable a personas naturales y sucesiones ilíquidas no obligadas a llevar libros de contabilidad.
 * - Decretos reglamentarios anuales expedidos por el Ministerio de Hacienda y Crédito Público.
 */

export interface ComponenteInflacionarioData {
  year: number;
  rate: number;
  percentage: number;
  decree: string;
  isOfficial: boolean;
  notes: string;
}

export const COMPONENTE_INFLACIONARIO_BY_YEAR: Record<number, ComponenteInflacionarioData> = {
  2021: {
    year: 2021,
    rate: 1.0,
    percentage: 100.0,
    decree: "Decreto 1848 de 2021",
    isOfficial: true,
    notes: "100.00% no constitutivo de renta ni ganancia ocasional.",
  },
  2022: {
    year: 2022,
    rate: 1.0,
    percentage: 100.0,
    decree: "Decreto 0728 de 2023",
    isOfficial: true,
    notes: "100.00% no gravado para personas naturales no obligadas a llevar contabilidad.",
  },
  2023: {
    year: 2023,
    rate: 0.6671,
    percentage: 66.71,
    decree: "Decreto 1006 de agosto de 2024",
    isOfficial: true,
    notes: "66.71% de los rendimientos financieros percibidos constituyen INCRNGO (Casilla 59).",
  },
  2024: {
    year: 2024,
    rate: 0.5088,
    percentage: 50.88,
    decree: "Decreto 771 de julio de 2025",
    isOfficial: true,
    notes: "50.88% de los rendimientos financieros son INCRNGO según Decreto 771 de 2025.",
  },
  2025: {
    year: 2025,
    rate: 0.5543,
    percentage: 55.43,
    decree: "Proyección técnica IPC / Banco de la República (Art. 40-1 E.T.)",
    isOfficial: false,
    notes: "55.43% estimado a partir de la tasa de inflación y captación de entidades financieras.",
  },
  2026: {
    year: 2026,
    rate: 0.5,
    percentage: 50.0,
    decree: "Proyección legal IPC (Art. 40-1 E.T.)",
    isOfficial: false,
    notes: "50.00% proyectado para el año gravable 2026.",
  },
};

/**
 * Obtiene los datos oficiales del componente inflacionario para un año gravable específico.
 */
export function getComponenteInflacionario(year: number): ComponenteInflacionarioData {
  return (
    COMPONENTE_INFLACIONARIO_BY_YEAR[year] || {
      year,
      rate: 0.5088,
      percentage: 50.88,
      decree: "Decreto reglamentario anual (Art. 40-1 E.T.)",
      isOfficial: false,
      notes: "Porcentaje no constitutivo de renta ni ganancia ocasional.",
    }
  );
}

/**
 * Calcula el monto no gravado del componente inflacionario en pesos para un total de rendimientos financieros.
 */
export function calculateComponenteInflacionario(
  totalIntereses: number,
  year: number,
  customPercentage?: number,
): {
  base: number;
  percentage: number;
  monto: number;
  decree: string;
  isOfficial: boolean;
} {
  const info = getComponenteInflacionario(year);
  const pct = customPercentage !== undefined && customPercentage >= 0 ? customPercentage : info.percentage;
  const rate = pct / 100;
  const monto = Math.round(totalIntereses * rate);

  return {
    base: totalIntereses,
    percentage: pct,
    monto,
    decree: info.decree,
    isOfficial: info.isOfficial,
  };
}
