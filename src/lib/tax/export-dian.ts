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

  // ———————————————————————————————————————————————————————————
  // HOJA 1: FORMULARIO 210 OFICIAL DIAN
  // ———————————————————————————————————————————————————————————
  const rowsSheet1: (string | number)[][] = [
    ["DIRECCIÓN DE IMPUESTOS Y ADUANAS NACIONALES - DIAN", "", "", "", ""],
    ["FORMULARIO 210 - DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES RESIDENTES", "", "", "", ""],
    [`AÑO GRAVABLE: ${d.year}`, "", `CONCEPTO: ${id.esCorreccion ? "2 - CORRECCIÓN" : "1 - INICIAL"}`, "", `FECHA EMISIÓN: ${new Date().toLocaleDateString("es-CO")}`],
    ["", "", "", "", ""],
    ["DATOS DE IDENTIFICACIÓN DEL DECLARANTE", "", "", "", ""],
    ["NIT (Casilla 5)", id.nit || "—", "DV (Casilla 6)", id.dv || "0", ""],
    ["Primer Apellido (7)", id.primerApellido || "—", "Segundo Apellido (8)", id.segundoApellido || "", ""],
    ["Primer Nombre (9)", id.primerNombre || "—", "Otros Nombres (10)", id.otrosNombres || "", ""],
    ["Dirección Seccional (12)", id.dirSeccional || "—", "Actividad Económica CIIU (24)", id.actividadCiiu || "—", ""],
    ...(id.esCorreccion
      ? [["No. Formulario Anterior (27)", id.formAnterior || "—", "", "", ""]]
      : []),
    ["", "", "", "", ""],
    ["CASILLA", "CONCEPTO / RENGLÓN OFICIAL DIAN", "FUNDAMENTO LEGAL", "VALOR LIQUIDADO (COP)", "FÓRMULA / CONTROL"],
  ];

  let currentSection = "";
  for (const item of CASILLAS_OFICIALES_210) {
    if (item.section !== currentSection) {
      currentSection = item.section;
      rowsSheet1.push(["", `--- ${currentSection.toUpperCase()} ---`, "", "", ""]);
    }
    const rawVal = c.casillas[item.num];
    let cellVal: string | number = 0;
    if (rawVal !== undefined && rawVal !== null) {
      if (item.num === 140) {
        cellVal = rawVal ? "X (SÍ)" : "NO";
      } else {
        cellVal = Math.round(rawVal);
      }
    }
    rowsSheet1.push([
      item.num,
      item.label,
      item.legal,
      cellVal,
      item.formula || "",
    ]);
  }

  // Pie de control de firmas y recaudo
  const requiereFirmaContador = (c.casillas[29] ?? 0) >= c.uvt * 100000 || id.llevaLibros;
  rowsSheet1.push(["", "", "", "", ""]);
  rowsSheet1.push(["FIRMAS Y RECAUDO OFICIAL", "", "", "", ""]);
  rowsSheet1.push(["980. Pago total", "", "", c.saldoPagar > 0 ? Math.round(c.saldoPagar) : 0, "Art. 800 E.T."]);
  rowsSheet1.push(["Firma del Declarante:", taxpayerName, "", "NIT:", id.nit ? `${id.nit}-${id.dv || "0"}` : "—"]);
  rowsSheet1.push(["Firma Contador / Revisor Fiscal:", requiereFirmaContador ? "Requiere firma contador público" : "No requerida", "", "Tarjeta Profesional:", "—"]);

  const ws1 = XLSX.utils.aoa_to_sheet(rowsSheet1);

  // Ajuste de ancho de columnas
  ws1["!cols"] = [
    { wch: 10 }, // Casilla
    { wch: 55 }, // Concepto
    { wch: 30 }, // Legal
    { wch: 22 }, // Valor
    { wch: 45 }, // Fórmula
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
    ["Patrimonio Bruto", 29, c.casillas[29] ?? 0],
    ["Deudas", 30, c.casillas[30] ?? 0],
    ["Patrimonio Líquido", 31, c.casillas[31] ?? 0],
    ["", "", ""],
    ["Renta Líquida Cédula General", 91, c.casillas[91] ?? 0],
    ["Rentas Exentas y Deducciones Limitadas (40 % / 1.340 UVT)", 92, c.casillas[92] ?? 0],
    ["Renta Líquida Gravable Cédula General", 97, c.rentaLiquidaGravable ?? 0],
    ["Renta Líquida Gravable Pensiones", 103, c.casillas[103] ?? 0],
    ["Renta Líquida Gravable Dividendos", 111, c.casillas[111] ?? 0],
    ["Ganancias Ocasionales Gravables", 115, c.casillas[115] ?? 0],
    ["", "", ""],
    ["Total Impuesto sobre Rentas Líquidas", 121, c.casillas[121] ?? 0],
    ["Total Descuentos Tributarios", 125, c.casillas[125] ?? 0],
    ["Impuesto Neto de Renta", 126, c.impuestoNeto ?? 0],
    ["Impuesto de Ganancias Ocasionales", 127, c.casillas[127] ?? 0],
    ["Total Impuesto a Cargo", 129, c.impuestoCargo ?? 0],
    ["", "", ""],
    ["Anticipo de Renta Año Anterior", 130, c.casillas[130] ?? 0],
    ["Saldo a Favor Año Anterior", 131, c.casillas[131] ?? 0],
    ["Retenciones en la Fuente Practicadas", 132, c.casillas[132] ?? 0],
    ["Anticipo de Renta Año Siguiente", 133, c.casillas[133] ?? 0],
    ["Sanciones", 135, c.casillas[135] ?? 0],
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
    const numVal = typeof rawVal === "number" ? Math.round(rawVal) : 0;
    const strVal = item.num === 140 ? (rawVal ? "1" : "0") : String(numVal);
    rowsSheet3.push([item.num, item.label, numVal, strVal]);
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

