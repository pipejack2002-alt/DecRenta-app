/**
 * Motor de Conciliación y Renta por Comparación Patrimonial
 * Estatuto Tributario Colombiano - Artículos 236, 237, 238 y 239
 */

import type { Declaration, ComputedDeclaration } from "./types.ts";

export interface ComparacionPatrimonialResult {
  patrimonioLiquidoAnterior: number;
  patrimonioLiquidoActual: number;
  incrementoPatrimonial: number;
  
  // Rentas justificativas
  rentaLiquidaGravable: number;
  rentasExentas: number;
  incrngo: number;
  gananciaOcasionalNeta: number;
  ingresosNoGravadosGO: number;
  
  // Detracciones
  impuestoRentaPagado: number;
  impuestoGananciaOcasional: number;
  retencionesSufridas: number;
  consumosEstimados: number;
  
  // Ajustes especiales (Art. 238 E.T.)
  valorizacionesJustificadas: number;
  desvalorizacionesJustificadas: number;
  herenciasLegadosDonaciones: number;
  otrosAjustesJustificativos: number;
  
  // Resultados finales
  totalRentasJustificativas: number;
  totalAjustesPatrimoniales: number;
  diferenciaPatrimonial: number; // Incremento - Justificaciones
  
  // Diagnóstico
  semaforo: "justificado" | "limite" | "descuadre";
  esRentaPorComparacion: boolean;
  montoRentaPorComparacion: number;
  explicacion: string;
  articulos: string[];
}

export function calcularComparacionPatrimonial(
  d: Declaration,
  c: ComputedDeclaration,
  options?: {
    patrimonioLiquidoAnterior?: number;
    consumosEstimados?: number;
    valorizacionesJustificadas?: number;
    desvalorizacionesJustificadas?: number;
    herenciasLegadosDonaciones?: number;
    otrosAjustesJustificativos?: number;
    impuestoAnteriorPagado?: number;
  }
): ComparacionPatrimonialResult {
  const patrimonioLiquidoActual = c.casillas[31] ?? (d.patrimonio.inmuebles + d.patrimonio.cuentas + d.patrimonio.vehiculos + d.patrimonio.otrosActivos - d.patrimonio.obligacionesFinancieras);
  const patrimonioLiquidoAnterior = options?.patrimonioLiquidoAnterior ?? (d.patrimonio.patrimonioLiquidoAnterior ?? 0);
  
  const incrementoPatrimonial = Math.max(0, patrimonioLiquidoActual - patrimonioLiquidoAnterior);

  // Rentas y ganancias del año que justifican incremento
  const rentaLiquidaGravable = c.rentaLiquidaGravable; // Casilla 97 (Cédula General) + Casilla 103 (Pensiones) + Casilla 111 (Dividendos)
  const pensionesGravables = c.casillas[103] ?? 0;
  const dividendosGravables = (c.casillas[108] ?? 0) + (c.casillas[110] ?? 0);
  
  const rentasExentas =
    (c.casillas[36] ?? 0) +
    (c.casillas[48] ?? 0) +
    (c.casillas[64] ?? 0) +
    (c.casillas[80] ?? 0) +
    (c.casillas[102] ?? 0);
    
  const incrngo =
    (c.casillas[33] ?? 0) +
    (c.casillas[44] ?? 0) +
    (c.casillas[59] ?? 0) +
    (c.casillas[75] ?? 0) +
    (c.casillas[100] ?? 0);
    
  const gananciaOcasionalNeta = c.casillas[114] ?? 0;
  const ingresosNoGravadosGO = c.casillas[113] ?? 0;

  // Impuestos y retenciones que reducen la capacidad de ahorro
  const impuestoRenta = c.impuestoNeto || (c.casillas[126] ?? 0);
  const impuestoGO = c.casillas[127] ?? 0;
  const retencionesSufridas = c.casillas[132] ?? 0;
  
  // Consumos del año (gastos de sostenimiento que no quedaron en patrimonio)
  const totalIngresosBrutos =
    (c.casillas[32] ?? 0) +
    (c.casillas[43] ?? 0) +
    (c.casillas[58] ?? 0) +
    (c.casillas[74] ?? 0) +
    (c.casillas[99] ?? 0) +
    (c.casillas[104] ?? 0) +
    (c.casillas[107] ?? 0);
  const consumosEstimados = options?.consumosEstimados ?? (d.patrimonio.consumosEstimadosAnio ?? Math.round(totalIngresosBrutos * 0.15));

  // Ajustes de valorización patrimonial o herencias (Art. 238 E.T.)
  const valorizacionesJustificadas = options?.valorizacionesJustificadas ?? (d.patrimonio.valorizacionesJustificadas ?? 0);
  const desvalorizacionesJustificadas = options?.desvalorizacionesJustificadas ?? (d.patrimonio.desvalorizacionesJustificadas ?? 0);
  const herenciasLegadosDonaciones = options?.herenciasLegadosDonaciones ?? (d.patrimonio.herenciasLegadosDonaciones ?? 0);
  const otrosAjustesJustificativos = options?.otrosAjustesJustificativos ?? (d.patrimonio.otrosAjustesJustificativos ?? 0);

  // Total de fondos generados en el año
  const totalRentasJustificativas = Math.max(
    0,
    rentaLiquidaGravable +
      rentasExentas +
      incrngo +
      gananciaOcasionalNeta +
      ingresosNoGravadosGO -
      (impuestoRenta + impuestoGO) -
      consumosEstimados
  );

  const totalAjustesPatrimoniales =
    valorizacionesJustificadas -
    desvalorizacionesJustificadas +
    herenciasLegadosDonaciones +
    otrosAjustesJustificativos;

  const capacidadTotalJustificada = totalRentasJustificativas + totalAjustesPatrimoniales;
  const diferenciaPatrimonial = incrementoPatrimonial - capacidadTotalJustificada;

  let semaforo: "justificado" | "limite" | "descuadre" = "justificado";
  let esRentaPorComparacion = false;
  let montoRentaPorComparacion = 0;
  let explicacion = "";

  if (patrimonioLiquidoAnterior === 0 && patrimonioLiquidoActual > 0) {
    semaforo = "limite";
    explicacion =
      "No se ha digitado el Patrimonio Líquido del año anterior (2024). Ingrese la cifra para que el sistema realice la verificación matemática de los Arts. 236 y 237 del E.T.";
  } else if (diferenciaPatrimonial > 1_000_000) {
    semaforo = "descuadre";
    esRentaPorComparacion = true;
    montoRentaPorComparacion = diferenciaPatrimonial;
    explicacion = `Alerta Fiscal: Su patrimonio líquido se incrementó en $ ${incrementoPatrimonial.toLocaleString("es-CO")}, superando sus rentas justificativas y ajustes en $ ${diferenciaPatrimonial.toLocaleString("es-CO")}. Según el Art. 237 del E.T., esta diferencia constituye renta líquida gravable por comparación patrimonial a menos que se justifique con valorizaciones o pasivos saneados.`;
  } else if (diferenciaPatrimonial > 0 && diferenciaPatrimonial <= 1_000_000) {
    semaforo = "limite";
    explicacion =
      "El incremento patrimonial coincide de forma muy ajustada con las rentas del año (diferencia menor a $ 1.000.000 por redondeo). Se recomienda verificar consumos y valorizaciones.";
  } else {
    semaforo = "justificado";
    explicacion =
      "Conciliación patrimonial conforme: El incremento patrimonial del año está 100 % soportado por las rentas líquidas, exenciones, ganancias ocasionales y ajustes justificados.";
  }

  return {
    patrimonioLiquidoAnterior,
    patrimonioLiquidoActual,
    incrementoPatrimonial,
    rentaLiquidaGravable,
    rentasExentas,
    incrngo,
    gananciaOcasionalNeta,
    ingresosNoGravadosGO,
    impuestoRentaPagado: impuestoRenta,
    impuestoGananciaOcasional: impuestoGO,
    retencionesSufridas,
    consumosEstimados,
    valorizacionesJustificadas,
    desvalorizacionesJustificadas,
    herenciasLegadosDonaciones,
    otrosAjustesJustificativos,
    totalRentasJustificativas,
    totalAjustesPatrimoniales,
    diferenciaPatrimonial: Math.max(0, diferenciaPatrimonial),
    semaforo,
    esRentaPorComparacion,
    montoRentaPorComparacion,
    explicacion,
    articulos: ["Art. 236 E.T.", "Art. 237 E.T.", "Art. 238 E.T.", "Art. 239-1 E.T."],
  };
}
