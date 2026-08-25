/**
 * Simulador de Anticipo de Impuesto de Renta para el Año Siguiente
 * Estatuto Tributario Colombiano - Artículo 807 (Casilla 134 del Formulario 210)
 */

export interface AnticipoRentaResult {
  tipoDeclaracion: "primer_ano" | "segundo_ano" | "tercer_ano_mas";
  porcentajeAnticipo: number; // 25 %, 50 % o 75 %
  
  // Procedimiento 1: Sobre el impuesto neto del año actual
  impuestoNetoActual: number;
  baseProcedimiento1: number;
  retencionesSufridas: number;
  anticipoProcedimiento1: number;
  
  // Procedimiento 2: Sobre el promedio de los 2 últimos años
  impuestoNetoAnterior: number;
  promedioImpuestos: number;
  baseProcedimiento2: number;
  anticipoProcedimiento2: number;
  
  // Recomendación
  opcionRecomendada: 1 | 2;
  anticipoSugerido: number;
  ahorroPorOpcion: number;
  explicacion: string;
}

export function calcularAnticipoRenta({
  impuestoNetoActual,
  impuestoNetoAnterior = 0,
  retencionesSufridas = 0,
  tipoDeclaracion = "tercer_ano_mas",
}: {
  impuestoNetoActual: number;
  impuestoNetoAnterior?: number;
  retencionesSufridas?: number;
  tipoDeclaracion?: "primer_ano" | "segundo_ano" | "tercer_ano_mas";
}): AnticipoRentaResult {
  const porcentajeAnticipo =
    tipoDeclaracion === "primer_ano" ? 0.25 : tipoDeclaracion === "segundo_ano" ? 0.5 : 0.75;

  // Procedimiento 1 (Art. 807 literal a)
  const baseProcedimiento1 = impuestoNetoActual;
  const anticipoProcedimiento1 = Math.max(
    0,
    Math.round(baseProcedimiento1 * porcentajeAnticipo - retencionesSufridas)
  );

  // Procedimiento 2 (Art. 807 literal b) - Solo aplica si declaró en el año anterior
  const tieneAnoAnterior = impuestoNetoAnterior > 0;
  const promedioImpuestos = tieneAnoAnterior
    ? (impuestoNetoActual + impuestoNetoAnterior) / 2
    : impuestoNetoActual;

  const baseProcedimiento2 = promedioImpuestos;
  const anticipoProcedimiento2 = Math.max(
    0,
    Math.round(baseProcedimiento2 * porcentajeAnticipo - retencionesSufridas)
  );

  // Elegir la opción más favorable para el declarante (menor anticipo a pagar)
  let opcionRecomendada: 1 | 2 = 1;
  if (tieneAnoAnterior && anticipoProcedimiento2 < anticipoProcedimiento1) {
    opcionRecomendada = 2;
  }

  const anticipoSugerido =
    opcionRecomendada === 1 ? anticipoProcedimiento1 : anticipoProcedimiento2;

  const ahorroPorOpcion = Math.abs(anticipoProcedimiento1 - anticipoProcedimiento2);

  let explicacion = "";
  if (!tieneAnoAnterior) {
    explicacion = `Se aplicó el Procedimiento 1 (${(porcentajeAnticipo * 100).toFixed(0)} % del Impuesto Neto actual $ ${impuestoNetoActual.toLocaleString("es-CO")} menos $ ${retencionesSufridas.toLocaleString("es-CO")} de retenciones).`;
  } else if (opcionRecomendada === 2 && ahorroPorOpcion > 0) {
    explicacion = `Recomendación: El Procedimiento 2 (Promedio de 2 años) le genera un anticipo de $ ${anticipoProcedimiento2.toLocaleString("es-CO")}, ahorrándole $ ${ahorroPorOpcion.toLocaleString("es-CO")} respecto al Procedimiento 1.`;
  } else {
    explicacion = `El Procedimiento 1 ($ ${anticipoProcedimiento1.toLocaleString("es-CO")}) resulta más favorable o igual al Procedimiento 2 ($ ${anticipoProcedimiento2.toLocaleString("es-CO")}).`;
  }

  return {
    tipoDeclaracion,
    porcentajeAnticipo: porcentajeAnticipo * 100,
    impuestoNetoActual,
    baseProcedimiento1,
    retencionesSufridas,
    anticipoProcedimiento1,
    impuestoNetoAnterior,
    promedioImpuestos,
    baseProcedimiento2,
    anticipoProcedimiento2,
    opcionRecomendada,
    anticipoSugerido,
    ahorroPorOpcion,
    explicacion,
  };
}
