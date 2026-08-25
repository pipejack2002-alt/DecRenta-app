import * as XLSX from "xlsx";
import { CASILLA_LABELS } from "./engine.ts";
import type { ComputedDeclaration, Declaration } from "./types.ts";

export interface CasillaMetaInfo {
  num: number;
  label: string;
  legal: string;
  section: string;
  formula?: string;
}

export const CASILLAS_OFICIALES_210: CasillaMetaInfo[] = [
  // Patrimonio
  { num: 28, label: "1 % compras con factura electrónica", legal: "Art. 336 inc. 2 E.T.", section: "Patrimonio", formula: "Máx 240 UVT" },
  { num: 29, label: "Total patrimonio bruto", legal: "Arts. 261 a 281 E.T.", section: "Patrimonio" },
  { num: 30, label: "Deudas", legal: "Arts. 283 a 287 E.T.", section: "Patrimonio" },
  { num: 31, label: "Total patrimonio líquido", legal: "Art. 282 E.T.", section: "Patrimonio", formula: "Casilla 29 - Casilla 30" },

  // Cédula General - Trabajo
  { num: 32, label: "Ingresos brutos rentas de trabajo", legal: "Art. 103 E.T.", section: "Cédula General - Rentas de Trabajo" },
  { num: 33, label: "Ingresos no constitutivos de renta", legal: "Arts. 55 y 56 E.T.", section: "Cédula General - Rentas de Trabajo" },
  { num: 34, label: "Renta líquida", legal: "Art. 336 num. 1 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Casilla 32 - Casilla 33" },
  { num: 35, label: "Rentas exentas AFC / FVP / AVC", legal: "Arts. 126-1 y 126-4 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Máx 30% ingreso y 3.800 UVT" },
  { num: 36, label: "Otras rentas exentas", legal: "Arts. 206 y 206-1 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Incluye 25% num. 10 (máx 790 UVT)" },
  { num: 37, label: "Total rentas exentas de trabajo", legal: "Art. 206 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Casilla 35 + Casilla 36" },
  { num: 38, label: "De vivienda (intereses)", legal: "Art. 119 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Máx 1.200 UVT año" },
  { num: 39, label: "Otras deducciones imputables", legal: "Arts. 387, 115 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Dependientes 10%, Medicina prepagada, GMF 50%" },
  { num: 40, label: "Total deducciones imputables de trabajo", legal: "Art. 387 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Casilla 38 + Casilla 39" },
  { num: 41, label: "Rentas exentas y deducciones limitadas", legal: "Art. 336 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Límite 40 % o 1.340 UVT" },
  { num: 42, label: "Renta líquida ordinaria", legal: "Art. 336 num. 5 E.T.", section: "Cédula General - Rentas de Trabajo", formula: "Casilla 34 - Casilla 41" },

  // Cédula General - Honorarios con Costos
  { num: 43, label: "Ingresos brutos honorarios con costos", legal: "Art. 335 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 44, label: "Ingresos no constitutivos de renta", legal: "Arts. 55 y 56 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 45, label: "Costos y deducciones procedentes", legal: "Art. 336-1 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 46, label: "Renta líquida", legal: "Art. 336 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Casilla 43 - Casilla 44 - Casilla 45" },
  { num: 47, label: "AFC / FVP / AVC honorarios", legal: "Arts. 126-1 y 126-4 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 48, label: "Otras rentas exentas honorarios", legal: "Art. 206 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 49, label: "Total rentas exentas honorarios", legal: "Art. 206 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Casilla 47 + Casilla 48" },
  { num: 50, label: "Intereses de vivienda honorarios", legal: "Art. 119 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 51, label: "Otras deducciones honorarios", legal: "Arts. 387, 115 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 52, label: "Total deducciones honorarios", legal: "Art. 387 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Casilla 50 + Casilla 51" },
  { num: 53, label: "Exentas y deducciones limitadas", legal: "Art. 336 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Límite 40 % o 1.340 UVT" },
  { num: 54, label: "Renta líquida ordinaria del ejercicio", legal: "Art. 336 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Casilla 46 - Casilla 53" },
  { num: 55, label: "Pérdida líquida del ejercicio", legal: "Art. 330 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 56, label: "Compensación por pérdidas", legal: "Art. 147 E.T.", section: "Cédula General - Honorarios con Costos" },
  { num: 57, label: "Renta líquida ordinaria honorarios", legal: "Art. 336 E.T.", section: "Cédula General - Honorarios con Costos", formula: "Casilla 54 - Casilla 56" },

  // Cédula General - Rentas de Capital
  { num: 58, label: "Ingresos brutos rentas de capital", legal: "Art. 335 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 59, label: "Ingresos no constitutivos de renta", legal: "Arts. 38 a 44 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 60, label: "Costos y deducciones procedentes", legal: "Arts. 107 y 336 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 61, label: "Renta líquida", legal: "Art. 336 E.T.", section: "Cédula General - Rentas de Capital", formula: "Casilla 58 - Casilla 59 - Casilla 60" },
  { num: 62, label: "Rentas líquidas pasivas - ECE", legal: "Art. 890 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 63, label: "AFC / FVP / AVC capital", legal: "Arts. 126-1 y 126-4 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 64, label: "Otras rentas exentas capital", legal: "Art. 235-2 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 65, label: "Total rentas exentas capital", legal: "Art. 235-2 E.T.", section: "Cédula General - Rentas de Capital", formula: "Casilla 63 + Casilla 64" },
  { num: 66, label: "Intereses de vivienda capital", legal: "Art. 119 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 67, label: "Otras deducciones capital", legal: "Arts. 115, 387 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 68, label: "Total deducciones capital", legal: "Art. 387 E.T.", section: "Cédula General - Rentas de Capital", formula: "Casilla 66 + Casilla 67" },
  { num: 69, label: "Exentas y deducciones limitadas", legal: "Art. 336 E.T.", section: "Cédula General - Rentas de Capital", formula: "Límite 40 % o 1.340 UVT" },
  { num: 70, label: "Renta líquida ordinaria del ejercicio", legal: "Art. 336 E.T.", section: "Cédula General - Rentas de Capital", formula: "Casilla 61 + Casilla 62 - Casilla 69" },
  { num: 71, label: "Pérdida líquida del ejercicio", legal: "Art. 330 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 72, label: "Compensación por pérdidas", legal: "Art. 147 E.T.", section: "Cédula General - Rentas de Capital" },
  { num: 73, label: "Renta líquida ordinaria capital", legal: "Art. 336 E.T.", section: "Cédula General - Rentas de Capital", formula: "Casilla 70 - Casilla 72" },

  // Cédula General - Rentas No Laborales
  { num: 74, label: "Ingresos brutos no laborales", legal: "Art. 335 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 75, label: "Devoluciones, rebajas y descuentos", legal: "Art. 335 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 76, label: "Ingresos no constitutivos de renta", legal: "Arts. 36 a 57 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 77, label: "Costos y deducciones procedentes", legal: "Arts. 107 y 336 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 78, label: "Renta líquida", legal: "Art. 336 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Casilla 74 - Casilla 75 - Casilla 76 - Casilla 77" },
  { num: 79, label: "Rentas líquidas pasivas - ECE", legal: "Art. 890 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 80, label: "AFC / FVP / AVC no laborales", legal: "Arts. 126-1 y 126-4 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 81, label: "Otras rentas exentas no laborales", legal: "Art. 235-2 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 82, label: "Total rentas exentas no laborales", legal: "Art. 235-2 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Casilla 80 + Casilla 81" },
  { num: 83, label: "Intereses de vivienda no laborales", legal: "Art. 119 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 84, label: "Otras deducciones no laborales", legal: "Arts. 115, 387 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 85, label: "Total deducciones no laborales", legal: "Art. 387 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Casilla 83 + Casilla 84" },
  { num: 86, label: "Exentas y deducciones limitadas", legal: "Art. 336 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Límite 40 % o 1.340 UVT" },
  { num: 87, label: "Renta líquida ordinaria del ejercicio", legal: "Art. 336 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Casilla 78 + Casilla 79 - Casilla 86" },
  { num: 88, label: "Pérdida líquida del ejercicio", legal: "Art. 330 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 89, label: "Compensación por pérdidas", legal: "Art. 147 E.T.", section: "Cédula General - Rentas No Laborales" },
  { num: 90, label: "Renta líquida ordinaria no laborales", legal: "Art. 336 E.T.", section: "Cédula General - Rentas No Laborales", formula: "Casilla 87 - Casilla 89" },

  // Depuración Cédula General
  { num: 91, label: "Renta líquida cédula general", legal: "Art. 336 num. 1 E.T.", section: "Depuración Cédula General y Rentas Gravables", formula: "Casilla 34 + 46 + 61 + 78" },
  { num: 92, label: "Rentas exentas y deducciones imputables limitadas", legal: "Art. 336 num. 2 y 3 E.T.", section: "Depuración Cédula General y Rentas Gravables", formula: "Casilla 41 + 53 + 69 + 86" },
  { num: 93, label: "Renta líquida ordinaria cédula general", legal: "Art. 336 num. 5 E.T.", section: "Depuración Cédula General y Rentas Gravables", formula: "Casilla 42 + 57 + 73 + 90" },
  { num: 94, label: "Compensaciones por pérdidas 2018 y anteriores", legal: "Art. 147 E.T.", section: "Depuración Cédula General y Rentas Gravables" },
  { num: 95, label: "Compensaciones por exceso de renta presuntiva", legal: "Art. 189 par. E.T.", section: "Depuración Cédula General y Rentas Gravables" },
  { num: 96, label: "Rentas gravables", legal: "Art. 336 num. 4 E.T.", section: "Depuración Cédula General y Rentas Gravables" },
  { num: 97, label: "Renta líquida gravable cédula general", legal: "Art. 336 num. 5 E.T.", section: "Depuración Cédula General y Rentas Gravables", formula: "Casilla 93 - Casilla 94 - Casilla 95 + Casilla 96" },
  { num: 98, label: "Renta presuntiva", legal: "Arts. 188 y 189 E.T.", section: "Depuración Cédula General y Rentas Gravables" },

  // Cédula de Pensiones
  { num: 99, label: "Ingresos brutos pensiones", legal: "Art. 206 num. 5 E.T.", section: "Cédula de Pensiones" },
  { num: 100, label: "Ingresos no constitutivos de renta", legal: "Arts. 55 y 56 E.T.", section: "Cédula de Pensiones" },
  { num: 101, label: "Renta líquida pensiones", legal: "Art. 337 E.T.", section: "Cédula de Pensiones", formula: "Casilla 99 - Casilla 100" },
  { num: 102, label: "Rentas exentas pensiones", legal: "Art. 206 num. 5 E.T.", section: "Cédula de Pensiones", formula: "Exención hasta 1.000 UVT mes" },
  { num: 103, label: "Renta líquida gravable pensiones", legal: "Art. 337 E.T.", section: "Cédula de Pensiones", formula: "Casilla 101 - Casilla 102" },

  // Cédula de Dividendos y Participaciones
  { num: 104, label: "Dividendos y participaciones 2016 y anteriores", legal: "Art. 242 par. 3 E.T.", section: "Cédula de Dividendos y Participaciones" },
  { num: 105, label: "Ingresos no constitutivos de renta (dividendos 2016)", legal: "Arts. 48 y 49 E.T.", section: "Cédula de Dividendos y Participaciones" },
  { num: 106, label: "Renta líquida ordinaria 2016 y anteriores", legal: "Art. 242 par. 3 E.T.", section: "Cédula de Dividendos y Participaciones", formula: "Casilla 104 - Casilla 105" },
  { num: 107, label: "1ª subcédula 2017 y siguientes (num. 3 art. 49)", legal: "Art. 242 inc. 1 E.T.", section: "Cédula de Dividendos y Participaciones" },
  { num: 108, label: "2ª subcédula 2017 y siguientes (par. 2 art. 49)", legal: "Art. 242 inc. 2 E.T.", section: "Cédula de Dividendos y Participaciones" },
  { num: 109, label: "Dividendos y participaciones del exterior", legal: "Art. 242 par. 1 E.T.", section: "Cédula de Dividendos y Participaciones" },
  { num: 110, label: "Rentas exentas de la casilla 109", legal: "Dec. 578 CAN / CDI", section: "Cédula de Dividendos y Participaciones" },
  { num: 111, label: "Renta líquida gravable dividendos (base art. 241)", legal: "Art. 242 E.T.", section: "Cédula de Dividendos y Participaciones", formula: "Casilla 107 + Casilla 109 - Casilla 110" },

  // Ganancias Ocasionales
  { num: 112, label: "Ingresos por ganancias ocasionales", legal: "Arts. 299 a 306 E.T.", section: "Ganancias Ocasionales" },
  { num: 113, label: "Costos por ganancias ocasionales", legal: "Arts. 307 a 310 E.T.", section: "Ganancias Ocasionales" },
  { num: 114, label: "Ganancias ocasionales no gravadas y exentas", legal: "Arts. 307 y 311 E.T.", section: "Ganancias Ocasionales" },
  { num: 115, label: "Ganancias ocasionales gravables", legal: "Art. 313 E.T.", section: "Ganancias Ocasionales", formula: "Casilla 112 - Casilla 113 - Casilla 114" },

  // Liquidación Privada - Impuesto
  { num: 116, label: "Impuesto cédula general / pensiones / dividendos", legal: "Art. 241 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas", formula: "Tarifa progresiva tabla art. 241" },
  { num: 117, label: "Impuesto sobre renta presuntiva", legal: "Arts. 188 y 241 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas" },
  { num: 118, label: "Impuesto 2ª subcédula (art. 240)", legal: "Art. 242 inc. 2 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas", formula: "Tarifa art. 240 E.T. (35 %)" },
  { num: 119, label: "Impuesto dividendos 2016 y anteriores", legal: "Art. 242 par. 3 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas" },
  { num: 120, label: "Impuesto dividendos del exterior", legal: "Art. 242 par. 1 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas" },
  { num: 121, label: "Total impuesto sobre rentas líquidas gravables", legal: "Art. 241 E.T.", section: "Liquidación Privada - Impuesto sobre Rentas Líquidas", formula: "Casilla 116 + 117 + 118 + 119 + 120" },

  // Liquidación Privada - Descuentos
  { num: 122, label: "Descuento por impuestos pagados en el exterior", legal: "Art. 254 E.T.", section: "Liquidación Privada - Descuentos Tributarios" },
  { num: 123, label: "Descuento por donaciones", legal: "Arts. 257 y 257-1 E.T.", section: "Liquidación Privada - Descuentos Tributarios", formula: "25 % del valor donado" },
  { num: 124, label: "Descuento dividendos y otros", legal: "Art. 254-1 E.T.", section: "Liquidación Privada - Descuentos Tributarios" },
  { num: 125, label: "Total descuentos tributarios", legal: "Art. 259 E.T.", section: "Liquidación Privada - Descuentos Tributarios", formula: "Casilla 122 + Casilla 123 + Casilla 124" },

  // Liquidación Privada - Totales y Saldos
  { num: 126, label: "Impuesto neto de renta", legal: "Art. 259 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "Casilla 121 - Casilla 125" },
  { num: 127, label: "Impuesto de ganancias ocasionales", legal: "Arts. 313 a 317 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "15 % (o 20 % loterías/rifas)" },
  { num: 128, label: "Descuento GO por impuestos del exterior", legal: "Art. 254 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 129, label: "Total impuesto a cargo", legal: "Art. 259 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "Casilla 126 + Casilla 127 - Casilla 128" },
  { num: 130, label: "Anticipo de renta liquidado año anterior", legal: "Art. 807 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 131, label: "Saldo a favor año gravable anterior", legal: "Art. 815 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 132, label: "Retenciones en la fuente año gravable declarado", legal: "Arts. 365 a 404 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 133, label: "Anticipo de renta año gravable siguiente", legal: "Art. 807 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 134, label: "Saldo a pagar por impuesto", legal: "Art. 807 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "Casilla 129 - 130 - 131 - 132 + 133" },
  { num: 135, label: "Sanciones", legal: "Arts. 640 a 650 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos" },
  { num: 136, label: "Total saldo a pagar", legal: "Art. 807 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "Casilla 129 - 130 - 131 - 132 + 133 + 135" },
  { num: 137, label: "Total saldo a favor", legal: "Art. 815 E.T.", section: "Liquidación Privada - Total Impuesto, Anticipos y Saldos", formula: "Casilla 130 + 131 + 132 - 129 - 133 - 135" },

  // Datos Informativos y Recaudo
  { num: 138, label: "Número de dependientes económicos (hasta 4)", legal: "Art. 336 E.T.", section: "Datos Informativos" },
  { num: 139, label: "Adición por dependientes a la casilla 92", legal: "Art. 336 inc. 2 E.T.", section: "Datos Informativos", formula: "72 UVT por dependiente (máx 288 UVT)" },
  { num: 140, label: "¿Superó el límite del 60 % de costos y gastos?", legal: "Art. 336-1 E.T.", section: "Datos Informativos", formula: "Marcar X si costos > 60 %" },
  { num: 141, label: "Aporte voluntario", legal: "Art. 244-1 E.T.", section: "Datos Informativos" },
  { num: 980, label: "Pago total", legal: "Art. 800 E.T.", section: "Control de Pago y Recaudo" },
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Genera el documento XML oficial del Formulario 210 para personas naturales residentes,
 * compatible con la estructura de carga y prevalidador de la DIAN.
 */
export function generateFormulario210Xml(d: Declaration, c: ComputedDeclaration): string {
  const id = d.identity;
  const year = d.year;
  const isCorrection = id.esCorreccion;
  const concepto = isCorrection ? "2" : "1"; // 1 = Inicial, 2 = Corrección

  const sortedCasillas = Object.keys(c.casillas)
    .map(Number)
    .sort((a, b) => a - b);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<declaracion formulario="210" version="${year}" concepto="${concepto}" anio="${year}" periodo="1">`,
  );

  // Cabecera / Identificación Oficial
  lines.push("  <cabecera>");
  lines.push(`    <nit>${escapeXml(id.nit || "")}</nit>`);
  lines.push(`    <dv>${escapeXml(id.dv || "")}</dv>`);
  lines.push(`    <primerApellido>${escapeXml(id.primerApellido || "")}</primerApellido>`);
  lines.push(`    <segundoApellido>${escapeXml(id.segundoApellido || "")}</segundoApellido>`);
  lines.push(`    <primerNombre>${escapeXml(id.primerNombre || "")}</primerNombre>`);
  lines.push(`    <otrosNombres>${escapeXml(id.otrosNombres || "")}</otrosNombres>`);
  lines.push(`    <codSeccional>${escapeXml(id.dirSeccional || "")}</codSeccional>`);
  lines.push(`    <actividadCiiu>${escapeXml(id.actividadCiiu || "")}</actividadCiiu>`);
  lines.push(`    <esCorreccion>${isCorrection ? "true" : "false"}</esCorreccion>`);
  if (isCorrection && id.formAnterior) {
    lines.push(`    <formularioAnterior>${escapeXml(id.formAnterior)}</formularioAnterior>`);
  }
  lines.push(`    <aniosDeclarando>${id.aniosDeclarando || 1}</aniosDeclarando>`);
  lines.push(`    <responsableIva>${id.responsableIva ? "1" : "0"}</responsableIva>`);
  lines.push(`    <fechaGeneracion>${new Date().toISOString()}</fechaGeneracion>`);
  lines.push("  </cabecera>");

  // Casillas de liquidación
  lines.push("  <casillas>");
  for (const n of sortedCasillas) {
    const val = c.casillas[n];
    if (val === undefined || val === null) continue;
    const label = CASILLA_LABELS[n] ?? `Casilla ${n}`;
    const formattedVal = n === 140 ? (val ? "1" : "0") : String(Math.round(val));
    lines.push(
      `    <casilla num="${n}" valor="${formattedVal}" etiqueta="${escapeXml(label)}" />`,
    );
  }
  lines.push("  </casillas>");

  // Resumen de liquidación
  lines.push("  <totales>");
  lines.push(`    <patrimonioLiquido casilla="31">${c.casillas[31] ?? 0}</patrimonioLiquido>`);
  lines.push(`    <rentaLiquidaGravableGeneral casilla="97">${c.rentaLiquidaGravable ?? 0}</rentaLiquidaGravableGeneral>`);
  lines.push(`    <impuestoNeto casilla="126">${c.impuestoNeto ?? 0}</impuestoNeto>`);
  lines.push(`    <totalImpuestoCargo casilla="129">${c.impuestoCargo ?? 0}</totalImpuestoCargo>`);
  lines.push(`    <saldoPagar casilla="136">${c.saldoPagar ?? 0}</saldoPagar>`);
  lines.push(`    <saldoFavor casilla="137">${c.saldoFavor ?? 0}</saldoFavor>`);
  lines.push("  </totales>");

  lines.push("</declaracion>");

  return lines.join("\n");
}

/**
 * Genera un libro de trabajo Excel (.xlsx) oficial y profesional del Formulario 210 de la DIAN.
 * Incluye encabezados institucionales, todas las casillas oficiales organizadas por cédulas,
 * formato numérico contable, resumen ejecutivo y pestaña prevalidador.
 */
export function generateFormulario210Workbook(d: Declaration, c: ComputedDeclaration): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const id = d.identity;
  const taxpayerName =
    [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ") || "CONTRIBUYENTE PERSONA NATURAL";

  const numVal = (n: number) => {
    const val = c.casillas[n];
    return val !== undefined && val !== null ? Math.round(val) : 0;
  };

  // ———————————————————————————————————————————————————————————
  // HOJA 1: FORMULARIO 210 OFICIAL DIAN (MATRIZ EXACTA AL PDF)
  // ———————————————————————————————————————————————————————————
  const rowsSheet1: (string | number)[][] = [
    ["DIAN", "", "", "DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES Y ASIMILADAS RESIDENTES Y SUCESIONES ILÍQUIDAS DE CAUSANTES RESIDENTES", "", "", "", "", "210", ""],
    ["1. Año", d.year, "", `4. Número de formulario: 210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}`, "", "", "", "", "MUISCA", ""],
    ["Espacio reservado para la DIAN", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // Datos del Declarante
    ["DATOS DEL DECLARANTE", "", "", "", "", "", "", "", "", ""],
    ["5. NIT", id.nit || "—", "6. DV", id.dv || "0", "7. Primer apellido", id.primerApellido || "—", "8. Segundo apellido", id.segundoApellido || "", "12. Cód. Seccional", id.dirSeccional || "32"],
    ["9. Primer nombre", id.primerNombre || "—", "10. Otros nombres", id.otrosNombres || "", "24. Actividad CIIU", id.actividadCiiu || "0010", "27. Frac. año sig.", "NO", "25. Cód. Corr.", id.esCorreccion ? "1" : "—"],
    ["28. Uno por ciento (1%) de compras con factura electrónica", "", "", "", "", "", "", "", "Casilla 28", numVal(28)],
    ["", "", "", "", "", "", "", "", "", ""],

    // Sección Patrimonio
    ["SECCIÓN PATRIMONIO", "", "", "", "", "", "", "", "", ""],
    ["29. Total patrimonio bruto", numVal(29), "", "30. Deudas", numVal(30), "", "31. Total patrimonio líquido", numVal(31), "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // Cédula General: Matriz de 4 Columnas Oficial
    [
      "CÉDULA GENERAL (Conceptos / Rentas)",
      "Cas.",
      "Rentas de Trabajo",
      "Cas.",
      "Honorarios con Costos",
      "Cas.",
      "Rentas de Capital",
      "Cas.",
      "Rentas No Laborales",
      ""
    ],
    ["Ingresos brutos", "32", numVal(32), "43", numVal(43), "58", numVal(58), "74", numVal(74)],
    ["Devoluciones, rebajas y descuentos", "—", 0, "—", 0, "—", 0, "75", numVal(75)],
    ["Ingresos no constitutivos de renta", "33", numVal(33), "44", numVal(44), "59", numVal(59), "76", numVal(76)],
    ["Costos y deducciones procedentes", "—", 0, "45", numVal(45), "60", numVal(60), "77", numVal(77)],
    ["Renta líquida", "34", numVal(34), "46", numVal(46), "61", numVal(61), "78", numVal(78)],
    ["Rentas líquidas pasivas - ECE", "—", 0, "—", 0, "62", numVal(62), "79", numVal(79)],
    ["Aportes voluntarios AFC, FVP y AVC", "35", numVal(35), "47", numVal(47), "63", numVal(63), "80", numVal(80)],
    ["Otras rentas exentas (incluye 25% num. 10 art. 206)", "36", numVal(36), "48", numVal(48), "64", numVal(64), "81", numVal(81)],
    ["Total rentas exentas", "37", numVal(37), "49", numVal(49), "65", numVal(65), "82", numVal(82)],
    ["Intereses de vivienda", "38", numVal(38), "50", numVal(50), "66", numVal(66), "83", numVal(83)],
    ["Otras deducciones imputables (Dependientes, Salud, GMF)", "39", numVal(39), "51", numVal(51), "67", numVal(67), "84", numVal(84)],
    ["Total deducciones imputables", "40", numVal(40), "52", numVal(52), "68", numVal(68), "85", numVal(85)],
    ["Rentas exentas y/o deduc. imputables (Limitadas)", "41", numVal(41), "53", numVal(53), "69", numVal(69), "86", numVal(86)],
    ["Renta líquida ordinaria del ejercicio", "—", 0, "54", numVal(54), "70", numVal(70), "87", numVal(87)],
    ["Pérdida líquida del ejercicio", "—", 0, "55", numVal(55), "71", numVal(71), "88", numVal(88)],
    ["Compensaciones por pérdidas", "—", 0, "56", numVal(56), "72", numVal(72), "89", numVal(89)],
    ["Renta líquida ordinaria", "42", numVal(42), "57", numVal(57), "73", numVal(73), "90", numVal(90)],
    ["", "", "", "", "", "", "", "", "", ""],

    // Depuración Cédula General
    ["DEPURACIÓN CÉDULA GENERAL Y RENTAS GRAVABLES", "", "", "", "", "", "", "", "", ""],
    ["91. Ren. líquida céd. gen.", numVal(91), "92. Ren. ex. y ded. imp. li.", numVal(92), "93. R. líq. ord. cédula gen.", numVal(93), "94. Comp. pérdidas 2018", numVal(94)],
    ["95. Comp. exc. ren. presuntiva", numVal(95), "96. Rentas gravables", numVal(96), "97. R. líq. grav. cédula gen.", numVal(97), "98. Renta presuntiva", numVal(98)],
    ["", "", "", "", "", "", "", "", "", ""],

    // Cédulas Inferiores y Liquidación Privada
    ["CÉDULAS DE PENSIONES, DIVIDENDOS Y GANANCIAS OCASIONALES", "", "", "", "LIQUIDACIÓN PRIVADA DEL IMPUESTO", "", "", "", "", ""],
    
    // Pensiones & Impuestos
    ["99. Ingresos brutos pensiones", numVal(99), "", "", "116. Impuesto cédula general, pensiones y dividendos", numVal(116), "", "", "", ""],
    ["100. Ingresos no constitutivos de renta (pensiones)", numVal(100), "", "", "117. Impuesto sobre renta presuntiva", numVal(117), "", "", "", ""],
    ["101. Renta líquida pensiones", numVal(101), "", "", "118. Impuesto 2a subcédula año 2017+ (art. 240 E.T.)", numVal(118), "", "", "", ""],
    ["102. Rentas exentas de pensiones", numVal(102), "", "", "119. Impuesto dividendos 2016 y anteriores", numVal(119), "", "", "", ""],
    ["103. Renta líquida gravable de pensiones", numVal(103), "", "", "120. Impuesto dividendos del exterior", numVal(120), "", "", "", ""],
    ["", "", "", "", "121. Total impuesto sobre rentas líquidas gravables", numVal(121), "", "", "", ""],

    // Dividendos & Descuentos
    ["104. Dividendos año 2016 y anteriores", numVal(104), "", "", "DESCUENTOS TRIBUTARIOS", "", "", "", "", ""],
    ["105. Ingresos no constitutivos de renta (dividendos 2016)", numVal(105), "", "", "122. Impuestos pagados en el exterior", numVal(122), "123. Donaciones", numVal(123), "", ""],
    ["106. Renta líquida ordinaria 2016 y anteriores", numVal(106), "", "", "124. Dividendos, particip. y otros", numVal(124), "125. Total desctos trib.", numVal(125), "", ""],
    ["107. 1a. Subcédula 2017 y siguientes (num. 3 art. 49 E.T.)", numVal(107), "", "", "126. Impuesto neto de renta", numVal(126), "", "", "", ""],
    ["108. 2a. Subcédula 2017 y siguientes (par. 2 art. 49 E.T.)", numVal(108), "", "", "127. Impuesto de ganancias ocasionales", numVal(127), "", "", "", ""],
    ["109. Dividendos y participaciones del exterior", numVal(109), "", "", "128. Descuento GO impuestos del exterior", numVal(128), "", "", "", ""],
    ["110. Rentas exentas de la casilla 109", numVal(110), "", "", "129. Total impuesto a cargo", numVal(129), "", "", "", ""],
    ["111. Renta líquida gravable dividendos (base art. 241)", numVal(111), "", "", "130. Anticipo renta año gravable anterior", numVal(130), "", "", "", ""],
    ["", "", "", "", "131. Saldo a favor año gravable anterior", numVal(131), "", "", "", ""],

    // Ganancias Ocasionales & Retenciones
    ["GANANCIAS OCASIONALES", "", "", "", "132. Retenciones año gravable a declarar", numVal(132), "", "", "", ""],
    ["112. Ingresos por ganancias ocasionales", numVal(112), "", "", "133. Anticipo renta año gravable siguiente", numVal(133), "", "", "", ""],
    ["113. Costos por ganancias ocasionales", numVal(113), "", "", "", "", "", "", "", ""],
    ["114. Ganancias ocasionales no gravadas y exentas", numVal(114), "", "", "", "", "", "", "", ""],
    ["115. Ganancias ocasionales gravables", numVal(115), "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // Totales de Liquidación y Datos Informativos
    ["TOTALES Y SALDOS FINALES", "", "", "", "", "", "", "", "", ""],
    ["134. Saldo a pagar por impuesto", numVal(134), "135. Sanciones", numVal(135), "136. TOTAL SALDO A PAGAR", numVal(136), "137. TOTAL SALDO A FAVOR", numVal(137)],
    ["138. Número de dependientes", numVal(138), "139. Adición dep. cas. 92", numVal(139), "140. Superó tope 60% art. 336-1", c.casillas[140] ? "X (SÍ)" : "NO", "141. Aporte voluntario", numVal(141)],
    ["", "", "", "", "", "", "", "", "", ""],

    // Firmas y Recaudo Oficial
    ["FIRMAS Y CONTROL DE RECAUDO OFICIAL", "", "", "", "", "", "", "", "", ""],
    ["981. Cód. Representación", "0", "Firma del Declarante:", taxpayerName, "NIT:", `${id.nit || "—"}-${id.dv || "0"}`, "", ""],
    [
      "982. Cód. Contador",
      (numVal(29) >= c.uvt * 100000 || id.llevaLibros) ? "1" : "0",
      "994. Con salvedades",
      "NO",
      "983. Tarjeta Profesional:",
      "—",
      "",
      ""
    ],
    ["980. PAGO TOTAL $", c.saldoPagar > 0 ? numVal(136) : 0, "997. Sello Entidad Recaudadora:", "[ CERTIFICADO ELECTRÓNICO MUISCA ]", "", "", "", ""]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(rowsSheet1);

  // Formato de ancho de columnas
  ws1["!cols"] = [
    { wch: 42 }, // Columna A: Concepto
    { wch: 14 }, // Columna B: Casilla / Valor
    { wch: 18 }, // Columna C: Renta Trabajo
    { wch: 14 }, // Columna D: Casilla / Valor
    { wch: 22 }, // Columna E: Honorarios
    { wch: 14 }, // Columna F: Casilla / Valor
    { wch: 20 }, // Columna G: Capital
    { wch: 14 }, // Columna H: Casilla / Valor
    { wch: 20 }, // Columna I: No Laborales
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Formulario 210 DIAN");

  // ———————————————————————————————————————————————————————————
  // HOJA 2: RESUMEN Y LIQUIDACIÓN
  // ———————————————————————————————————————————————————————————
  const rowsSheet2: (string | number)[][] = [
    ["RESUMEN EJECUTIVO DE LIQUIDACIÓN TRIBUTARIA - AG " + d.year, "", ""],
    ["Contribuyente:", taxpayerName, ""],
    ["Identificación:", `${id.nit || "—"}-${id.dv || "0"}`, ""],
    ["", "", ""],
    ["CONCEPTO CONSOLIDADO", "CASILLA DIAN", "VALOR (COP)"],
    ["Patrimonio Bruto", 29, numVal(29)],
    ["Deudas", 30, numVal(30)],
    ["Patrimonio Líquido", 31, numVal(31)],
    ["", "", ""],
    ["Renta Líquida Cédula General", 91, numVal(91)],
    ["Rentas Exentas y Deducciones Limitadas (40 % / 1.340 UVT)", 92, numVal(92)],
    ["Renta Líquida Gravable Cédula General", 97, c.rentaLiquidaGravable ?? 0],
    ["Renta Líquida Gravable Pensiones", 103, numVal(103)],
    ["Renta Líquida Gravable Dividendos", 111, numVal(111)],
    ["Ganancias Ocasionales Gravables", 115, numVal(115)],
    ["", "", ""],
    ["Total Impuesto sobre Rentas Líquidas", 121, numVal(121)],
    ["Total Descuentos Tributarios", 125, numVal(125)],
    ["Impuesto Neto de Renta", 126, c.impuestoNeto ?? 0],
    ["Impuesto de Ganancias Ocasionales", 127, numVal(127)],
    ["Total Impuesto a Cargo", 129, c.impuestoCargo ?? 0],
    ["", "", ""],
    ["Anticipo de Renta Año Anterior", 130, numVal(130)],
    ["Saldo a Favor Año Anterior", 131, numVal(131)],
    ["Retenciones en la Fuente Practicadas", 132, numVal(132)],
    ["Anticipo de Renta Año Siguiente", 133, numVal(133)],
    ["Sanciones", 135, numVal(135)],
    ["", "", ""],
    ["TOTAL SALDO A PAGAR", 136, c.saldoPagar ?? 0],
    ["TOTAL SALDO A FAVOR", 137, c.saldoFavor ?? 0],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(rowsSheet2);
  ws2["!cols"] = [{ wch: 60 }, { wch: 15 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen Liquidación");

  // ———————————————————————————————————————————————————————————
  // HOJA 3: PREVALIDADOR DIAN (FORMATO PLANO)
  // ———————————————————————————————————————————————————————————
  const rowsSheet3: (string | number)[][] = [
    ["NumeroCasilla", "NombreCasilla", "ValorNumerico", "ValorFormateado"],
  ];
  for (const item of CASILLAS_OFICIALES_210) {
    const rawVal = c.casillas[item.num];
    const nVal = typeof rawVal === "number" ? Math.round(rawVal) : 0;
    const strVal = item.num === 140 ? (rawVal ? "1" : "0") : String(nVal);
    rowsSheet3.push([item.num, item.label, nVal, strVal]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(rowsSheet3);
  ws3["!cols"] = [{ wch: 15 }, { wch: 55 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Prevalidador DIAN");

  return wb;
}

/**
 * Dispara la descarga del libro de cálculo oficial en formato .xlsx.
 */
export function downloadXlsxFile(filename: string, wb: XLSX.WorkBook): void {
  if (typeof window === "undefined") return;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera un archivo CSV delimitado por punto y coma (;) estructurado exactamente por las
 * secciones del Formulario 210 oficial de la DIAN (como en el PDF oficial).
 */
export function generateFormulario210Csv(d: Declaration, c: ComputedDeclaration): string {
  const id = d.identity;
  const lines: string[] = [];

  // Metadatos y Cabecera Oficial (Casillas 1 a 24)
  lines.push(`DIAN - FORMULARIO 210 - DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES RESIDENTES`);
  lines.push(`Año Gravable (Casilla 1);${d.year}`);
  lines.push(`Número de Formulario;210`);
  lines.push(`Concepto;${id.esCorreccion ? "2 - Corrección" : "1 - Inicial"}`);
  lines.push(`NIT (Casilla 5);${id.nit || ""}`);
  lines.push(`DV (Casilla 6);${id.dv || ""}`);
  lines.push(`Primer Apellido (Casilla 7);${id.primerApellido || ""}`);
  lines.push(`Segundo Apellido (Casilla 8);${id.segundoApellido || ""}`);
  lines.push(`Primer Nombre (Casilla 9);${id.primerNombre || ""}`);
  lines.push(`Otros Nombres (Casilla 10);${id.otrosNombres || ""}`);
  lines.push(`Código Dirección Seccional (Casilla 12);${id.dirSeccional || ""}`);
  lines.push(`Actividad Económica Principal CIIU (Casilla 24);${id.actividadCiiu || ""}`);
  if (id.esCorreccion && id.formAnterior) {
    lines.push(`Número Declaración Anterior;${id.formAnterior}`);
  }
  lines.push(`Fecha de Emisión;${new Date().toLocaleDateString("es-CO")}`);
  lines.push("");

  lines.push("Casilla;Concepto / Descripción Oficial;Fundamento Legal;Valor (COP)");

  let currSec = "";
  for (const item of CASILLAS_OFICIALES_210) {
    if (item.section !== currSec) {
      currSec = item.section;
      lines.push("");
      lines.push(`--- ${currSec} ---;;;`);
    }
    const val = c.casillas[item.num];
    let formattedVal = "0";
    if (val !== undefined && val !== null) {
      formattedVal = item.num === 140 ? (val ? "X" : "") : String(Math.round(val));
    }
    lines.push(`${item.num};"${item.label.replace(/"/g, '""')}";"${item.legal.replace(/"/g, '""')}";${formattedVal}`);
  }

  return lines.join("\n");
}

/**
 * Helper para disparar la descarga de cualquier archivo en el cliente web.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

