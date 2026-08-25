/**
 * Motor de Beneficio de Auditoría y Calculadora de Sanciones e Intereses Moratorios
 * Estatuto Tributario Colombiano - Artículos 689-3, 641, 642, 640 y 634
 */

import { pesosFromUvt } from "./uvt.ts";

export interface BeneficioAuditoriaResult {
  impuestoNetoAnterior: number;
  impuestoNetoActual: number;
  incrementoPorcentaje: number;
  cumpleBaseMinima71Uvt: boolean;
  baseMinima71UvtPesos: number;
  
  // Opciones de firmeza
  aplicaFirmeza6Meses: boolean; // +35 %
  impuestoRequerido6Meses: number;
  adicionalRequerido6Meses: number;
  
  aplicaFirmeza12Meses: boolean; // +25 %
  impuestoRequerido12Meses: number;
  adicionalRequerido12Meses: number;
  
  diagnostico: string;
  estado: "firme_6m" | "firme_12m" | "no_aplica" | "requiere_adicion";
}

export function calcularBeneficioAuditoria({
  impuestoNetoAnterior,
  impuestoNetoActual,
  year = 2025,
  uvtOverrides,
}: {
  impuestoNetoAnterior: number;
  impuestoNetoActual: number;
  year?: number;
  uvtOverrides?: Record<number, number>;
}): BeneficioAuditoriaResult {
  // Para el año gravable 2025 (Ley 2277 de 2022 Art. 689-3), la base mínima del año anterior es 71 UVT
  const baseMinima71UvtPesos = pesosFromUvt(71, year - 1, uvtOverrides);
  const cumpleBaseMinima71Uvt = impuestoNetoAnterior >= baseMinima71UvtPesos;

  const incrementoPorcentaje =
    impuestoNetoAnterior > 0
      ? ((impuestoNetoActual - impuestoNetoAnterior) / impuestoNetoAnterior) * 100
      : 0;

  const impuestoRequerido6Meses = Math.ceil(impuestoNetoAnterior * 1.35);
  const adicionalRequerido6Meses = Math.max(0, impuestoRequerido6Meses - impuestoNetoActual);

  const impuestoRequerido12Meses = Math.ceil(impuestoNetoAnterior * 1.25);
  const adicionalRequerido12Meses = Math.max(0, impuestoRequerido12Meses - impuestoNetoActual);

  const aplicaFirmeza6Meses = cumpleBaseMinima71Uvt && incrementoPorcentaje >= 35;
  const aplicaFirmeza12Meses = cumpleBaseMinima71Uvt && incrementoPorcentaje >= 25 && !aplicaFirmeza6Meses;

  let estado: BeneficioAuditoriaResult["estado"] = "no_aplica";
  let diagnostico = "";

  if (impuestoNetoAnterior <= 0) {
    estado = "no_aplica";
    diagnostico =
      "Para acceder al Beneficio de Auditoría (Art. 689-3 E.T.), el impuesto neto de renta del año gravable anterior debe haber sido liquidado y ser igual o superior a 71 UVT.";
  } else if (!cumpleBaseMinima71Uvt) {
    estado = "no_aplica";
    diagnostico = `El impuesto neto del año anterior ($ ${impuestoNetoAnterior.toLocaleString("es-CO")}) es inferior a las 71 UVT requeridas ($ ${baseMinima71UvtPesos.toLocaleString("es-CO")}). Por ley no procede el Beneficio de Auditoría.`;
  } else if (aplicaFirmeza6Meses) {
    estado = "firme_6m";
    diagnostico = `🎉 ¡Beneficio de Auditoría Total! Su impuesto neto se incrementó en un ${incrementoPorcentaje.toFixed(1)} % (>= 35 %). Su declaración quedará en FIRMEZA TOTAL en tan solo 6 MESES siguientes a la presentación.`;
  } else if (aplicaFirmeza12Meses) {
    estado = "firme_12m";
    diagnostico = `🛡️ Beneficio de Auditoría de 12 Meses: Su impuesto neto se incrementó en un ${incrementoPorcentaje.toFixed(1)} % (>= 25 %). Su declaración quedará en FIRMEZA en 12 MESES. (Para 6 meses requeriría adicionar $ ${adicionalRequerido6Meses.toLocaleString("es-CO")}).`;
  } else {
    estado = "requiere_adicion";
    diagnostico = `Su impuesto creció un ${incrementoPorcentaje.toFixed(1)} %. Con una adición voluntaria de $ ${adicionalRequerido12Meses.toLocaleString("es-CO")} puede blindar su declaración en 12 meses, o con $ ${adicionalRequerido6Meses.toLocaleString("es-CO")} en 6 meses.`;
  }

  return {
    impuestoNetoAnterior,
    impuestoNetoActual,
    incrementoPorcentaje,
    cumpleBaseMinima71Uvt,
    baseMinima71UvtPesos,
    aplicaFirmeza6Meses,
    impuestoRequerido6Meses,
    adicionalRequerido6Meses,
    aplicaFirmeza12Meses,
    impuestoRequerido12Meses,
    adicionalRequerido12Meses,
    diagnostico,
    estado,
  };
}

export interface CalculoSancionResult {
  mesesExtemporaneidad: number;
  diasMora: number;
  
  // Bases
  baseCalculo: "impuesto" | "ingresos" | "patrimonio";
  montoBase: number;
  
  // Sanción plena
  porcentajeAplicado: number;
  sancionPlena: number;
  
  // Reducción Art. 640 E.T. (Principio de proporcionalidad y gradualidad)
  aplicaReduccion640: boolean;
  porcentajeReduccion: number; // 0, 50 o 75
  sancionConReduccion: number;
  
  // Sanción mínima (10 UVT año presentación)
  sancionMinima10Uvt: number;
  sancionFinal: number;
  
  // Intereses moratorios (Art. 634 E.T.)
  tasaEfectivaAnualUsura: number;
  tasaDiariaMora: number;
  interesesMoratorios: number;
  
  totalPagarSancionEIntereses: number;
  explicacion: string;
}

export function calcularSancionExtemporaneidad({
  fechaVencimiento,
  fechaPresentacion,
  impuestoCargo,
  ingresosBrutos = 0,
  patrimonioBruto = 0,
  aplicaReduccion640 = false,
  porcentajeReduccion = 50, // 50 % si no ha cometido infracción en 2 años
  tasaEaMora = 28.5, // Tasa de usura anual estimada DIAN
  yearPresentacion = 2026,
  uvtOverrides,
}: {
  fechaVencimiento: string; // YYYY-MM-DD
  fechaPresentacion: string; // YYYY-MM-DD
  impuestoCargo: number;
  ingresosBrutos?: number;
  patrimonioBruto?: number;
  aplicaReduccion640?: boolean;
  porcentajeReduccion?: 50 | 75;
  tasaEaMora?: number;
  yearPresentacion?: number;
  uvtOverrides?: Record<number, number>;
}): CalculoSancionResult {
  const dVenc = new Date(fechaVencimiento);
  const dPres = new Date(fechaPresentacion);

  const diffMs = Math.max(0, dPres.getTime() - dVenc.getTime());
  const diasMora = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Cálculo de meses o fracción de mes de extemporaneidad (Art. 641 E.T.)
  const mesesExtemporaneidad = diasMora > 0 ? Math.ceil(diasMora / 30) : 0;

  // Sanción mínima 10 UVT de presentación (Art. 639 E.T.)
  const sancionMinima10Uvt = pesosFromUvt(10, yearPresentacion, uvtOverrides);

  let baseCalculo: "impuesto" | "ingresos" | "patrimonio" = "impuesto";
  let montoBase = impuestoCargo;
  let porcentajePorMes = 0.05; // 5 % por mes sobre impuesto
  let limiteMaximo = impuestoCargo; // 100 % del impuesto

  if (impuestoCargo > 0) {
    baseCalculo = "impuesto";
    montoBase = impuestoCargo;
    porcentajePorMes = 0.05;
    limiteMaximo = impuestoCargo;
  } else if (ingresosBrutos > 0) {
    baseCalculo = "ingresos";
    montoBase = ingresosBrutos;
    porcentajePorMes = 0.005; // 0.5 % sobre ingresos
    limiteMaximo = ingresosBrutos;
  } else {
    baseCalculo = "patrimonio";
    montoBase = patrimonioBruto;
    porcentajePorMes = 0.01; // 1 % sobre patrimonio líquido
    limiteMaximo = pesosFromUvt(2500, yearPresentacion, uvtOverrides);
  }

  const porcentajeTotal = mesesExtemporaneidad * porcentajePorMes;
  let sancionPlena = Math.min(montoBase * porcentajeTotal, limiteMaximo);

  // Aplicación de reducción del Art. 640 E.T.
  let sancionConReduccion = sancionPlena;
  if (aplicaReduccion640 && porcentajeReduccion > 0) {
    sancionConReduccion = sancionPlena * (1 - porcentajeReduccion / 100);
  }

  // La sanción final no puede ser inferior a la sanción mínima
  const sancionFinal =
    mesesExtemporaneidad > 0
      ? Math.max(sancionMinima10Uvt, Math.round(sancionConReduccion))
      : 0;

  // Intereses moratorios (Art. 634 E.T.) sobre el impuesto a cargo
  const tasaDiaria = Math.pow(1 + tasaEaMora / 100, 1 / 365) - 1;
  const interesesMoratorios =
    diasMora > 0 && impuestoCargo > 0
      ? Math.round(impuestoCargo * tasaDiaria * diasMora)
      : 0;

  const totalPagarSancionEIntereses = sancionFinal + interesesMoratorios;

  let explicacion = "";
  if (diasMora <= 0) {
    explicacion = "Declaración presentada oportunamente dentro del plazo legal. Sin sanción ni intereses.";
  } else {
    explicacion = `Presentación extemporánea por ${diasMora} días (${mesesExtemporaneidad} mes(es) o fracción). Se liquidó sanción del ${(porcentajeTotal * 100).toFixed(1)} % sobre la base de ${baseCalculo} con sanción mínima legal de 10 UVT ($ ${sancionMinima10Uvt.toLocaleString("es-CO")}).`;
  }

  return {
    mesesExtemporaneidad,
    diasMora,
    baseCalculo,
    montoBase,
    porcentajeAplicado: porcentajeTotal * 100,
    sancionPlena: Math.round(sancionPlena),
    aplicaReduccion640,
    porcentajeReduccion: aplicaReduccion640 ? porcentajeReduccion : 0,
    sancionConReduccion: Math.round(sancionConReduccion),
    sancionMinima10Uvt,
    sancionFinal,
    tasaEfectivaAnualUsura: tasaEaMora,
    tasaDiariaMora: tasaDiaria,
    interesesMoratorios,
    totalPagarSancionEIntereses,
    explicacion,
  };
}
