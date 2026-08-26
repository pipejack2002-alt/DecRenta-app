import * as XLSX from "xlsx";
import { CASILLA_LABELS } from "./engine.ts";
import { CASILLA_NOMBRES_CLAROS, FORMULAS_EXPLICADAS_210 } from "./instructivo-dian.ts";
import type { ComputedDeclaration, Declaration } from "./types.ts";

export interface CasillaMetaInfo {
  num: number;
  label: string;
  legal: string;
  section: string;
  formula?: string;
}

export const CASILLAS_OFICIALES_210: CasillaMetaInfo[] = [
  // Encabezado y Datos del Declarante
  { num: 1, label: "Año gravable", legal: "Art. 596 E.T.", section: "Encabezado Oficial DIAN" },
  { num: 4, label: "Número de formulario", legal: "Art. 578 E.T.", section: "Encabezado Oficial DIAN" },
  { num: 5, label: "Número de Identificación Tributaria (NIT)", legal: "Art. 555-2 E.T.", section: "Datos del Declarante (RUT)" },
  { num: 6, label: "Dígito de verificación (DV)", legal: "Art. 555-2 E.T.", section: "Datos del Declarante (RUT)" },
  { num: 7, label: "Primer apellido", legal: "Casilla 31 RUT", section: "Datos del Declarante (RUT)" },
  { num: 8, label: "Segundo apellido", legal: "Casilla 32 RUT", section: "Datos del Declarante (RUT)" },
  { num: 9, label: "Primer nombre", legal: "Casilla 33 RUT", section: "Datos del Declarante (RUT)" },
  { num: 10, label: "Otros nombres", legal: "Casilla 34 RUT", section: "Datos del Declarante (RUT)" },
  { num: 12, label: "Código Dirección Seccional", legal: "Casilla 12 RUT", section: "Datos del Declarante (RUT)" },
  { num: 24, label: "Actividad económica principal CIIU", legal: "Casillas 46/48/50 RUT", section: "Datos del Declarante (RUT)" },
  { num: 25, label: "Código de corrección", legal: "Arts. 588 y 589 E.T.", section: "Datos del Declarante (RUT)" },
  { num: 26, label: "No. Formulario anterior", legal: "Art. 588 E.T.", section: "Datos del Declarante (RUT)" },
  { num: 27, label: "Fracción año gravable siguiente", legal: "Art. 595 E.T.", section: "Datos del Declarante (RUT)" },

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
    ["1. Año", d.year, "", `4. Número de formulario: ${id.numeroFormulario || `210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}`}`, "", "", "", "", "MUISCA", ""],
    ["Espacio reservado para la DIAN", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // Datos del Declarante
    ["DATOS DEL DECLARANTE", "", "", "", "", "", "", "", "", ""],
    ["5. NIT", id.nit || "—", "6. DV", id.dv || "0", "7. Primer apellido", id.primerApellido || "—", "8. Segundo apellido", id.segundoApellido || "", "12. Cód. Seccional", id.dirSeccional || "03"],
    ["9. Primer nombre", id.primerNombre || "—", "10. Otros nombres", id.otrosNombres || "", "24. Actividad CIIU", id.actividadCiiu || "0010", "27. Frac. año sig.", id.fraccionAnioSiguiente ? "SÍ" : "NO", "25. Cód. Corr.", id.esCorreccion ? (id.codCorreccion || "1") : "—"],
    ["26. No. Formulario anterior", id.esCorreccion ? (id.formAnterior || "—") : "—", "", "", "", "", "", "", "Casilla 28", numVal(28)],
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

/**
 * Genera y descarga el Formulario 210 en Excel (.xlsx) con el diseño visual exacto 1:1 de la aplicación web,
 * usando ExcelJS con estilos, colores, pestañas verticales y celdas combinadas.
 */
export async function downloadStyledFormulario210Xlsx(
  filename: string,
  d: Declaration,
  c: ComputedDeclaration
): Promise<void> {
  if (typeof window === "undefined") return;

  const ExcelJSModule = await import("exceljs");
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;

  const wb = new ExcelJS.Workbook();
  wb.creator = "TributoApp — Formulario 210 DIAN";
  wb.created = new Date();

  const ws = wb.addWorksheet("Formulario 210 DIAN", {
    properties: { defaultRowHeight: 16 },
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0, footer: 0 },
    },
  });

  const CLR = {
    blue210:      "FF2D6187",
    blueHdr:      "FFDBE7F0",
    blueSoft:     "FFEEF4F8",
    blueAlt:      "FFF9FBFD",
    blueMuted:    "FFF0F5F9",
    blueLimit:    "FFE9F0F6",
    blueLight:    "FFF4F7F9",
    blueTotal:    "FFEAF1F7",
    tabGray:      "FFE5E7EB",
    disabledGray: "FFB4C6D4",
    borderGray:   "FFD1D5DB",
    redPayBg:     "FFFBEAE8",
    redPayText:   "FF7F1D1D",
    greenFavBg:   "FFEAF4EE",
    greenFavText: "FF00573F",
    numBlue:      "FF2D6187",
    numMuted:     "FF6B7280",
    white:        "FFFFFFFF",
    black:        "FF000000",
  };

  const bdr = (style: any, argb = CLR.black): any => ({ style, color: { argb } });
  const T = bdr("thin", CLR.black);
  const M = bdr("medium", CLR.black);
  const TK = bdr("thick", CLR.black);
  const BDR_BOX: any = { top: T, left: T, bottom: T, right: T };

  const fill = (argb: string): any => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const font = (sz: number, bold = false, argb = CLR.black, name = "Arial", italic = false): any => ({
    name,
    size: sz,
    bold,
    italic,
    color: { argb },
  });

  const aln = (h: any = "left", v: any = "middle", wrap = true): any => ({
    horizontal: h,
    vertical: v,
    wrapText: wrap,
  });

  const numVal = (num: number): number => {
    const v = c.casillas[num];
    return typeof v === "number" ? Math.round(v) : 0;
  };

  const fmt = (v: any) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number") {
      if (v === 0) return "0";
      return v.toLocaleString("es-CO");
    }
    return String(v);
  };

  function renderCasilla(addr: string, casNum: number | null, val: any, opts: any = {}) {
    const cell = ws.getCell(addr);
    const numStr = casNum !== null && casNum !== undefined ? String(casNum) : "";

    if (opts.formula) {
      cell.value = {
        formula: opts.formula,
        result: typeof val === "number" ? val : 0,
      };
      cell.numFmt = "$#,##0";
      cell.font = font(
        opts.sz ?? 8.5,
        opts.bold ?? false,
        opts.textColor ?? CLR.black,
        "Arial",
        opts.italic ?? false
      );
    } else if (typeof val === "number") {
      cell.value = val;
      cell.numFmt = "$#,##0";
      cell.font = font(
        opts.sz ?? 8.5,
        opts.bold ?? false,
        opts.textColor ?? CLR.black,
        "Arial",
        opts.italic ?? false
      );
    } else if (val === null || val === undefined || val === "") {
      cell.value = 0;
      cell.numFmt = "$#,##0";
      cell.font = font(opts.sz ?? 8.5, false, CLR.black);
    } else {
      cell.value = String(val);
      cell.font = font(opts.sz ?? 8.5, opts.bold ?? false, opts.textColor ?? CLR.black);
    }

    if (numStr) {
      const clearName = CASILLA_NOMBRES_CLAROS[Number(numStr)] || "";
      cell.note = clearName ? `Casilla ${numStr} · ${clearName}` : `Casilla ${numStr}`;
    }

    cell.fill = fill(opts.bg ?? CLR.white);
    cell.border = opts.border ?? BDR_BOX;
    cell.alignment = aln(opts.h ?? "right", opts.v ?? "middle", false);
    return cell;
  }

  function renderTab(mergeRange: string, text: string, bg = CLR.tabGray, textColor = CLR.black, sz = 7) {
    ws.mergeCells(mergeRange);
    const startCell = mergeRange.split(":")[0];
    const cell = ws.getCell(startCell);
    cell.value = text;
    cell.font = font(sz, true, textColor);
    cell.fill = fill(bg);
    cell.border = BDR_BOX;
    cell.alignment = { vertical: "middle", horizontal: "center", textRotation: 90, wrapText: true };
    return cell;
  }

  ws.columns = [
    { key: "A", width: 3.5 },
    { key: "B", width: 32 },
    { key: "C", width: 15 },
    { key: "D", width: 16 },
    { key: "E", width: 15 },
    { key: "F", width: 15 },
    { key: "G", width: 3.5 },
    { key: "H", width: 32 },
    { key: "I", width: 15 },
    { key: "J", width: 15 },
  ];

  let R = 1;
  const id = d.identity;

  // 1. ENCABEZADO
  ws.mergeCells(`A${R}:C${R+2}`);
  ws.mergeCells(`D${R}:H${R+2}`);
  ws.mergeCells(`I${R}:J${R+2}`);

  const cDian = ws.getCell(`A${R}`);
  cDian.value = {
    richText: [
      { font: font(20, true, CLR.black, "Arial Black"), text: "DIAN\n" },
      { font: font(7, true, CLR.black), text: "1. Año: " },
      { font: font(10, true, CLR.black, "Courier New"), text: `${d.year}\n` },
      { font: font(6, false, CLR.numMuted), text: "Espacio reservado para la DIAN" },
    ],
  };
  cDian.fill = fill(CLR.white);
  cDian.border = { top: TK, left: TK, bottom: TK, right: M };
  cDian.alignment = aln("left", "middle", true);

  const cTitulo = ws.getCell(`D${R}`);
  cTitulo.value = {
    richText: [
      {
        font: font(8.5, true, CLR.black),
        text: "DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES Y ASIMILADAS RESIDENTES\nY SUCESIONES ILÍQUIDAS DE CAUSANTES RESIDENTES\n\n",
      },
      { font: font(7.5, true, CLR.black), text: "4. Número de formulario: " },
      { font: font(8, true, CLR.black, "Courier New"), text: id.numeroFormulario || `210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}` },
    ],
  };
  cTitulo.fill = fill(CLR.white);
  cTitulo.border = { top: TK, left: M, bottom: TK, right: M };
  cTitulo.alignment = aln("center", "middle", true);

  const c210 = ws.getCell(`I${R}`);
  c210.value = "210";
  c210.font = font(36, true, CLR.white, "Arial Black");
  c210.fill = fill(CLR.blue210);
  c210.border = { top: TK, left: M, bottom: TK, right: TK };
  c210.alignment = aln("center", "middle", false);

  ws.getRow(R).height = 16;
  ws.getRow(R + 1).height = 16;
  ws.getRow(R + 2).height = 16;
  R += 3;

  // 2. DATOS DECLARANTE
  ws.getRow(R).height = 24;
  renderTab(`A${R}:A${R+1}`, "Datos del declarante", CLR.tabGray, CLR.black, 6.5);

  ws.mergeCells(`B${R}:C${R}`);
  const cNIT = ws.getCell(`B${R}`);
  cNIT.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "5. Número de Identificación Tributaria (NIT)\n" }, { font: font(9, true, CLR.black, "Courier New"), text: id.nit || "—" }] };
  cNIT.border = BDR_BOX;
  cNIT.alignment = aln("left", "top", true);

  const cDV = ws.getCell(`D${R}`);
  cDV.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "6.DV\n" }, { font: font(9, true, CLR.black, "Courier New"), text: id.dv || "0" }] };
  cDV.border = BDR_BOX;
  cDV.alignment = aln("center", "top", true);

  const cAp1 = ws.getCell(`E${R}`);
  cAp1.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "7. Primer apellido\n" }, { font: font(8.5, true, CLR.black), text: id.primerApellido || "—" }] };
  cAp1.border = BDR_BOX;
  cAp1.alignment = aln("left", "top", true);

  const cAp2 = ws.getCell(`F${R}`);
  cAp2.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "8. Segundo apellido\n" }, { font: font(8.5, true, CLR.black), text: id.segundoApellido || "—" }] };
  cAp2.border = BDR_BOX;
  cAp2.alignment = aln("left", "top", true);

  ws.mergeCells(`G${R}:H${R}`);
  const cN1 = ws.getCell(`G${R}`);
  cN1.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "9. Primer nombre\n" }, { font: font(8.5, true, CLR.black), text: id.primerNombre || "—" }] };
  cN1.border = BDR_BOX;
  cN1.alignment = aln("left", "top", true);

  const cN2 = ws.getCell(`I${R}`);
  cN2.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "10. Otros nombres\n" }, { font: font(8.5, true, CLR.black), text: id.otrosNombres || "—" }] };
  cN2.border = BDR_BOX;
  cN2.alignment = aln("left", "top", true);

  const cSecc = ws.getCell(`J${R}`);
  cSecc.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "12.Cód.Secc\n" }, { font: font(9, true, CLR.black, "Courier New"), text: id.dirSeccional || "03" }] };
  cSecc.border = { top: T, left: T, bottom: T, right: TK };
  cSecc.alignment = aln("center", "top", true);
  R++;

  // Fila 2 Declarante
  ws.getRow(R).height = 20;
  ws.mergeCells(`B${R}:C${R}`);
  const cCIIU = ws.getCell(`B${R}`);
  cCIIU.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "24. Actividad económica principal\n" }, { font: font(9, true, CLR.black, "Courier New"), text: id.actividadCiiu || "0010" }] };
  cCIIU.fill = fill(CLR.blueLight);
  cCIIU.border = BDR_BOX;
  cCIIU.alignment = aln("left", "top", true);

  const c25 = ws.getCell(`D${R}`);
  c25.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "25. Cód\n" }, { font: font(8.5, true, CLR.black), text: id.esCorreccion ? (id.codCorreccion || "1") : "—" }] };
  c25.fill = fill(CLR.blueLight);
  c25.border = BDR_BOX;
  c25.alignment = aln("center", "top", true);

  ws.mergeCells(`E${R}:F${R}`);
  const c26 = ws.getCell(`E${R}`);
  c26.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "26. No. Formulario anterior\n" }, { font: font(8, false, CLR.black), text: id.esCorreccion ? (id.formAnterior || "—") : "—" }] };
  c26.fill = fill(CLR.blueLight);
  c26.border = BDR_BOX;
  c26.alignment = aln("left", "top", true);

  const c27 = ws.getCell(`G${R}`);
  c27.value = { richText: [{ font: font(6, false, CLR.numMuted), text: "27. Frac. año sig.\n" }, { font: font(8.5, true, CLR.black), text: id.fraccionAnioSiguiente ? "SÍ" : "NO" }] };
  c27.fill = fill(CLR.blueLight);
  c27.border = BDR_BOX;
  c27.alignment = aln("center", "top", true);

  ws.mergeCells(`H${R}:I${R}`);
  const c28L = ws.getCell(`H${R}`);
  c28L.value = "28. Uno por ciento (1%) de compras con factura electrónica";
  c28L.font = font(6.5, false, CLR.black);
  c28L.fill = fill(CLR.white);
  c28L.border = BDR_BOX;
  c28L.alignment = aln("left", "middle", true);

  renderCasilla(`J${R}`, 28, numVal(28), { border: { top: T, left: T, bottom: T, right: TK } });
  R++;

  // 3. PATRIMONIO
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  const pB = ws.getCell(`A${R}`);
  pB.value = "PATRIMONIO";
  pB.font = font(8, true, CLR.black);
  pB.fill = fill(CLR.blueHdr);
  pB.border = { top: M, left: TK, bottom: M, right: T };
  pB.alignment = aln("center", "middle", false);

  ws.mergeCells(`C${R}:D${R}`);
  renderCasilla(`C${R}`, 29, numVal(29), { sz: 8.5, bold: true });

  ws.mergeCells(`E${R}:F${R}`);
  renderCasilla(`E${R}`, 30, numVal(30), { sz: 8.5, bold: true });

  ws.mergeCells(`G${R}:J${R}`);
  renderCasilla(`G${R}`, 31, numVal(31), {
    formula: `MAX(0, C${R} - E${R})`,
    bg: CLR.blueTotal,
    bold: true,
    sz: 9.5,
    border: { top: M, left: T, bottom: M, right: TK },
  });
  R++;

  // 4. CÉDULA GENERAL
  ws.getRow(R).height = 26;
  const startCG = R;

  const cgC = ws.getCell(`B${R}`);
  cgC.value = "Conceptos/rentas";
  cgC.font = font(7.5, true, CLR.black);
  cgC.fill = fill(CLR.blueHdr);
  cgC.border = BDR_BOX;
  cgC.alignment = aln("left", "middle", false);

  ws.mergeCells(`C${R}:D${R}`);
  const cgT = ws.getCell(`C${R}`);
  cgT.value = "Rentas de trabajo";
  cgT.font = font(7.5, true, CLR.black);
  cgT.fill = fill(CLR.blueHdr);
  cgT.border = BDR_BOX;
  cgT.alignment = aln("center", "middle", true);

  ws.mergeCells(`E${R}:F${R}`);
  const cgH = ws.getCell(`E${R}`);
  cgH.value = "Rentas de trabajo que no provengan de una relación laboral";
  cgH.font = font(6.5, true, CLR.black);
  cgH.fill = fill(CLR.blueHdr);
  cgH.border = BDR_BOX;
  cgH.alignment = aln("center", "middle", true);

  ws.mergeCells(`G${R}:H${R}`);
  const cgCap = ws.getCell(`G${R}`);
  cgCap.value = "Rentas de capital";
  cgCap.font = font(7.5, true, CLR.black);
  cgCap.fill = fill(CLR.blueHdr);
  cgCap.border = BDR_BOX;
  cgCap.alignment = aln("center", "middle", true);

  ws.mergeCells(`I${R}:J${R}`);
  const cgNL = ws.getCell(`I${R}`);
  cgNL.value = "Rentas no laborales";
  cgNL.font = font(7.5, true, CLR.black);
  cgNL.fill = fill(CLR.blueHdr);
  cgNL.border = { top: T, left: T, bottom: T, right: TK };
  cgNL.alignment = aln("center", "middle", true);
  R++;

  const CEDULA_ROWS = [
    // [label, cT, vT, fT, cH, vH, fH, cC, vC, fC, cN, vN, fN, rowBg, isBold, isItalic]
    ["Ingresos brutos", 32, numVal(32), null, 43, numVal(43), null, 58, numVal(58), null, 74, numVal(74), null, CLR.blueAlt, false, false],
    ["Devoluciones, rebajas y descuentos", null, null, null, null, null, null, null, null, null, 75, numVal(75), null, CLR.disabledGray, false, false],
    ["Ingresos no constitutivos de renta", 33, numVal(33), null, 44, numVal(44), null, 59, numVal(59), null, 76, numVal(76), null, CLR.blueAlt, false, false],
    ["Costos y deducciones procedentes", null, null, null, 45, numVal(45), null, 60, numVal(60), null, 77, numVal(77), null, CLR.blueAlt, false, false],
    ["Renta líquida", 34, numVal(34), "C8-C10", 46, numVal(46), "E8-E10-E11", 61, numVal(61), "G8-G10-G11", 78, numVal(78), "I8-I9-I10-I11", CLR.blueSoft, true, false],
    ["Rentas líquidas pasivas - ECE", null, null, null, null, null, null, 62, numVal(62), null, 79, numVal(79), null, CLR.blueAlt, false, false],
    ["  • Aportes voluntarios AFC, FVP y AVC", 35, numVal(35), null, 47, numVal(47), null, 63, numVal(63), null, 80, numVal(80), null, CLR.blueAlt, false, true],
    ["  • Otras rentas exentas", 36, numVal(36), null, 48, numVal(48), null, 64, numVal(64), null, 81, numVal(81), null, CLR.blueAlt, false, true],
    ["Total rentas exentas", 37, numVal(37), "C14+C15", 49, numVal(49), "E14+E15", 65, numVal(65), "G14+G15", 82, numVal(82), "I14+I15", CLR.blueMuted, true, false],
    ["  • Intereses de vivienda", 38, numVal(38), null, 50, numVal(50), null, 66, numVal(66), null, 83, numVal(83), null, CLR.blueAlt, false, true],
    ["  • Otras deducciones imputables", 39, numVal(39), null, 51, numVal(51), null, 67, numVal(67), null, 84, numVal(84), null, CLR.blueAlt, false, true],
    ["Total deducciones imputables", 40, numVal(40), "C17+C18", 52, numVal(52), "E17+E18", 68, numVal(68), "G17+G18", 85, numVal(85), "I17+I18", CLR.blueMuted, true, false],
    ["Rentas exentas y/o deduc. imputables (Limitadas)", 41, numVal(41), "MIN(C12*0.4, C16+C19)", 53, numVal(53), "MIN(E12*0.4, E16+E19)", 69, numVal(69), "MIN(G12*0.4, G16+G19)", 86, numVal(86), "MIN(I12*0.4, I16+I19)", CLR.blueLimit, true, false],
    ["Renta líquida ordinaria del ejercicio", null, null, null, 54, numVal(54), "MAX(0, E12-E20)", 70, numVal(70), "MAX(0, G12+G13-G20)", 87, numVal(87), "MAX(0, I12+I13-I20)", CLR.blueAlt, false, false],
    ["Pérdida líquida del ejercicio", null, null, null, 55, numVal(55), null, 71, numVal(71), null, 88, numVal(88), null, CLR.blueAlt, false, false],
    ["Compensaciones por pérdidas", null, null, null, 56, numVal(56), null, 72, numVal(72), null, 89, numVal(89), null, CLR.blueAlt, false, false],
    ["Renta líquida ordinaria", 42, numVal(42), "MAX(0, C12-C20)", 57, numVal(57), "MAX(0, E21-E23)", 73, numVal(73), "MAX(0, G21-G23)", 90, numVal(90), "MAX(0, I21-I23)", CLR.blueHdr, true, false],
  ];

  for (const row of CEDULA_ROWS) {
    ws.getRow(R).height = 18;
    const [label, cT, vT, fT, cH, vH, fH, cC, vC, fC, cN, vN, fN, rowBg, isBold, isItalic] = row;

    const cLabel = ws.getCell(`B${R}`);
    cLabel.value = label;
    cLabel.font = font(isBold ? 7.5 : 7, isBold as boolean, CLR.black, "Arial", isItalic as boolean);
    cLabel.fill = fill(rowBg as string);
    cLabel.border = BDR_BOX;
    cLabel.alignment = aln("left", "middle", true);

    if (cT === null && cH === null && cC === null && cN !== null) {
      // Devoluciones, rebajas y descuentos (Bloque continuo deshabilitado Trabajo, Honorarios y Capital)
      ws.mergeCells(`C${R}:H${R}`);
      const disCell = ws.getCell(`C${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;

      ws.mergeCells(`I${R}:J${R}`);
      renderCasilla(`I${R}`, cN as number, vN, { formula: fN, bg: rowBg, bold: isBold, border: { top: T, left: T, bottom: T, right: TK } });
    } else if (cT === null && cH === null && cC !== null && cN !== null) {
      // Rentas pasivas ECE (Bloque continuo deshabilitado Trabajo y Honorarios)
      ws.mergeCells(`C${R}:F${R}`);
      const disCell = ws.getCell(`C${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;

      ws.mergeCells(`G${R}:H${R}`);
      renderCasilla(`G${R}`, cC as number, vC, { formula: fC, bg: rowBg, bold: isBold });

      ws.mergeCells(`I${R}:J${R}`);
      renderCasilla(`I${R}`, cN as number, vN, { formula: fN, bg: rowBg, bold: isBold, border: { top: T, left: T, bottom: T, right: TK } });
    } else {
      ws.mergeCells(`C${R}:D${R}`);
      if (cT !== null) {
        renderCasilla(`C${R}`, cT as number, vT, { formula: fT, bg: rowBg, bold: isBold });
      } else {
        const disCell = ws.getCell(`C${R}`);
        disCell.fill = fill(CLR.disabledGray);
        disCell.border = BDR_BOX;
      }

      ws.mergeCells(`E${R}:F${R}`);
      if (cH !== null) {
        renderCasilla(`E${R}`, cH as number, vH, { formula: fH, bg: rowBg, bold: isBold });
      } else {
        const disCell = ws.getCell(`E${R}`);
        disCell.fill = fill(CLR.disabledGray);
        disCell.border = BDR_BOX;
      }

      ws.mergeCells(`G${R}:H${R}`);
      if (cC !== null) {
        renderCasilla(`G${R}`, cC as number, vC, { formula: fC, bg: rowBg, bold: isBold });
      } else {
        const disCell = ws.getCell(`G${R}`);
        disCell.fill = fill(CLR.disabledGray);
        disCell.border = BDR_BOX;
      }

      ws.mergeCells(`I${R}:J${R}`);
      if (cN !== null) {
        renderCasilla(`I${R}`, cN as number, vN, { formula: fN, bg: rowBg, bold: isBold, border: { top: T, left: T, bottom: T, right: TK } });
      } else {
        const disCell = ws.getCell(`I${R}`);
        disCell.fill = fill(CLR.disabledGray);
        disCell.border = { top: T, left: T, bottom: T, right: TK };
      }
    }
    R++;
  }

  renderTab(`A${startCG}:A${R-1}`, "Cédula general", CLR.tabGray, CLR.black, 7.5);

  // 5. DEPURACIÓN
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  renderCasilla(`A${R}`, 91, numVal(91), { formula: "C12+E12+G12+I12", bg: CLR.blueSoft, sz: 8.5, border: { top: M, left: TK, bottom: T, right: T } });

  ws.mergeCells(`C${R}:D${R}`);
  renderCasilla(`C${R}`, 92, numVal(92), { formula: "C20+E20+G20+I20+J5+D45", bg: CLR.blueSoft, sz: 8.5, border: { top: M, left: T, bottom: T, right: T } });

  ws.mergeCells(`E${R}:G${R}`);
  renderCasilla(`E${R}`, 93, numVal(93), { formula: "C24+E24+G24+I24", bg: CLR.blueSoft, bold: true, sz: 9, border: { top: M, left: T, bottom: T, right: T } });

  ws.mergeCells(`H${R}:J${R}`);
  renderCasilla(`H${R}`, 94, numVal(94), { bg: CLR.blueSoft, sz: 8.5, border: { top: M, left: T, bottom: T, right: TK } });
  R++;

  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  renderCasilla(`A${R}`, 95, numVal(95), { bg: CLR.blueSoft, sz: 8.5, border: { top: T, left: TK, bottom: M, right: T } });

  ws.mergeCells(`C${R}:D${R}`);
  renderCasilla(`C${R}`, 96, numVal(96), { bg: CLR.blueSoft, sz: 8.5, border: { top: T, left: T, bottom: M, right: T } });

  ws.mergeCells(`E${R}:G${R}`);
  renderCasilla(`E${R}`, 97, c.rentaLiquidaGravable ?? numVal(97), {
    formula: "MAX(0, E25-H25-A26+C26)",
    bg: CLR.blueHdr,
    bold: true,
    sz: 10,
    border: { top: T, left: T, bottom: M, right: T },
  });

  ws.mergeCells(`H${R}:J${R}`);
  renderCasilla(`H${R}`, 98, numVal(98), { bg: CLR.blueSoft, sz: 8.5, border: { top: T, left: T, bottom: M, right: TK } });
  R++;

  // 6. DIVISIÓN INFERIOR
  const LEFT_SECTIONS = [
    { label: "Ingresos brutos por rentas de pensiones", cas: 99, val: numVal(99), form: null, bg: CLR.white, bold: false },
    { label: "Ingresos no constitutivos de renta", cas: 100, val: numVal(100), form: null, bg: CLR.white, bold: false },
    { label: "Renta líquida", cas: 101, val: numVal(101), form: "E27-E28", bg: CLR.blueLight, bold: false },
    { label: "Rentas exentas de pensiones", cas: 102, val: numVal(102), form: null, bg: CLR.white, bold: false },
    { label: "Renta líquida gravable cédula de pensiones", cas: 103, val: numVal(103), form: "MAX(0, E29-E30)", bg: CLR.blueHdr, bold: true },

    { label: "Dividendos y participaciones año 2016 y anteriores", cas: 104, val: numVal(104), form: null, bg: CLR.white, bold: false },
    { label: "Ingresos no constitutivos de renta", cas: 105, val: numVal(105), form: null, bg: CLR.white, bold: false },
    { label: "Renta líquida ordinaria año 2016 y anteriores", cas: 106, val: numVal(106), form: "E32-E33", bg: CLR.blueLight, bold: false },
    { label: "1a. Subcédula años 2017 y siguientes numeral 3 art. 49", cas: 107, val: numVal(107), form: null, bg: CLR.white, bold: false },
    { label: "2a. Subcédula años 2017 y siguientes parágrafo 2 art. 49", cas: 108, val: numVal(108), form: null, bg: CLR.white, bold: false },
    { label: "Dividendos y participaciones recibidas del exterior", cas: 109, val: numVal(109), form: null, bg: CLR.white, bold: false },
    { label: "Rentas exentas de la casilla 109", cas: 110, val: numVal(110), form: null, bg: CLR.white, bold: false },
    { label: "Renta líquida gravable consolidada", cas: 111, val: numVal(111), form: "MAX(E26, H26)+E31+E35+E37-E38", bg: CLR.blueHdr, bold: true },

    { label: "Ingresos por ganancias ocasionales", cas: 112, val: numVal(112), form: null, bg: CLR.white, bold: false },
    { label: "Costos por ganancias ocasionales", cas: 113, val: numVal(113), form: null, bg: CLR.white, bold: false },
    { label: "Ganancias ocasionales no gravadas y exentas", cas: 114, val: numVal(114), form: null, bg: CLR.white, bold: false },
    { label: "Ganancias ocasionales gravables", cas: 115, val: numVal(115), form: "MAX(0, E40-E41-E42)", bg: CLR.blueHdr, bold: true },
  ];

  const RIGHT_SECTIONS = [
    { type: "row", label: "Cédula general, de pensiones y de dividendos", cas: 116, val: numVal(116), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Renta presuntiva, de pensiones y dividendos", cas: 117, val: numVal(117), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos 2a subcédula 2017+ (Art. 240)", cas: 118, val: numVal(118), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos año 2016", cas: 119, val: numVal(119), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos recibidos del exterior", cas: 120, val: numVal(120), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto sobre las rentas líquidas gravables", cas: 121, val: numVal(121), form: "SUM(I27:I31)", bg: CLR.blueSoft, bold: true },
    { type: "descGrid1", c1: 122, l1: "Imp. pagados exterior", v1: numVal(122), c2: 123, l2: "Donaciones", v2: numVal(123) },
    { type: "descGrid2", c1: 124, l1: "Otros desctos", v1: numVal(124), c2: 125, l2: "Total desctos trib.", v2: numVal(125), f2: "H33+I33+H34" },
    { type: "row", label: "Impuesto neto de renta", cas: 126, val: c.impuestoNeto ?? numVal(126), form: "MAX(0, I32-I34)", bg: CLR.blueLight, bold: true },
    { type: "row", label: "Impuesto de ganancias ocasionales", cas: 127, val: numVal(127), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Descuento impuestos exterior por ganancias ocasionales", cas: 128, val: numVal(128), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto a cargo", cas: 129, val: c.impuestoCargo ?? numVal(129), form: "I35+I36-I37", bg: CLR.blueHdr, bold: true },
    { type: "row", label: "Anticipo renta año anterior", cas: 130, val: numVal(130), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Saldo a favor año anterior", cas: 131, val: numVal(131), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Retenciones año a declarar", cas: 132, val: numVal(132), form: null, bg: CLR.white, bold: false },
    { type: "row", label: "Anticipo renta año siguiente", cas: 133, val: numVal(133), form: null, bg: CLR.white, bold: false },
    { type: "blank" },
  ];

  const startLower = R;

  for (let i = 0; i < 17; i++) {
    ws.getRow(R).height = 17.5;
    const l = LEFT_SECTIONS[i];
    const r = RIGHT_SECTIONS[i];

    if (l) {
      ws.mergeCells(`B${R}:D${R}`);
      const cLbl = ws.getCell(`B${R}`);
      cLbl.value = l.label;
      cLbl.font = font(l.bold ? 7.5 : 7, l.bold, CLR.black);
      cLbl.fill = fill(l.bg);
      cLbl.border = BDR_BOX;
      cLbl.alignment = aln("left", "middle", true);

      ws.mergeCells(`E${R}:F${R}`);
      renderCasilla(`E${R}`, l.cas, l.val, { formula: l.form, bg: l.bg, bold: l.bold });
    }

    if (r) {
      if (r.type === "row") {
        const rLbl = ws.getCell(`H${R}`);
        rLbl.value = r.label;
        rLbl.font = font(r.bold ? 7.5 : 7, r.bold, CLR.black);
        rLbl.fill = fill(r.bg as string);
        rLbl.border = BDR_BOX;
        rLbl.alignment = aln("left", "middle", true);

        ws.mergeCells(`I${R}:J${R}`);
        renderCasilla(`I${R}`, r.cas as number, r.val, {
          formula: r.form,
          bg: r.bg,
          bold: r.bold,
          border: { top: T, left: T, bottom: T, right: TK },
        });
      } else if (r.type === "descGrid1") {
        const d1 = ws.getCell(`H${R}`);
        d1.value = r.v1;
        d1.numFmt = "$#,##0";
        d1.font = font(7.5, false, CLR.black);
        d1.fill = fill(CLR.blueAlt);
        d1.border = BDR_BOX;
        d1.note = "122. Impuestos pagados en el exterior";
        d1.alignment = aln("right", "middle", false);

        ws.mergeCells(`I${R}:J${R}`);
        const d2 = ws.getCell(`I${R}`);
        d2.value = r.v2;
        d2.numFmt = "$#,##0";
        d2.font = font(7.5, false, CLR.black);
        d2.fill = fill(CLR.blueAlt);
        d2.border = { top: T, left: T, bottom: T, right: TK };
        d2.note = "123. Donaciones";
        d2.alignment = aln("right", "middle", false);
      } else if (r.type === "descGrid2") {
        const d1 = ws.getCell(`H${R}`);
        d1.value = r.v1;
        d1.numFmt = "$#,##0";
        d1.font = font(7.5, false, CLR.black);
        d1.fill = fill(CLR.blueAlt);
        d1.border = BDR_BOX;
        d1.note = "124. Otros descuentos";
        d1.alignment = aln("right", "middle", false);

        ws.mergeCells(`I${R}:J${R}`);
        const d2 = ws.getCell(`I${R}`);
        d2.value = { formula: (r as any).f2 || "0", result: (r.v2 as number) ?? 0 };
        d2.numFmt = "$#,##0";
        d2.font = font(8, true, CLR.black);
        d2.fill = fill(CLR.blueSoft);
        d2.border = { top: T, left: T, bottom: T, right: TK };
        d2.note = "125. Total descuentos tributarios";
        d2.alignment = aln("right", "middle", false);
      } else {
        const blkH = ws.getCell(`H${R}`);
        blkH.fill = fill(CLR.white);
        blkH.border = BDR_BOX;
        ws.mergeCells(`I${R}:J${R}`);
        const blkI = ws.getCell(`I${R}`);
        blkI.fill = fill(CLR.white);
        blkI.border = { top: T, left: T, bottom: T, right: TK };
      }
    }
    R++;
  }

  renderTab(`A${startLower}:A${startLower+4}`, "Cédula de pensiones", CLR.tabGray, CLR.black, 7);
  renderTab(`A${startLower+5}:A${startLower+12}`, "Cédula de dividendos y/o participaciones", CLR.tabGray, CLR.black, 6.5);
  renderTab(`A${startLower+13}:A${startLower+16}`, "Ganancias ocasionales", CLR.tabGray, CLR.black, 6.5);
  renderTab(`G${startLower}:G${startLower+16}`, "Liquidación privada", CLR.tabGray, CLR.black, 7.5);

  // 7. TOTALES DE SALDO
  ws.getRow(R).height = 22;
  ws.mergeCells(`A${R}:C${R}`);
  renderCasilla(`A${R}`, 134, numVal(134), { formula: "MAX(0, I38-I39-I40-I41+I42)", bg: CLR.blueLight, sz: 9, border: { top: M, left: TK, bottom: T, right: T } });

  ws.mergeCells(`D${R}:E${R}`);
  renderCasilla(`D${R}`, 135, numVal(135), { bg: CLR.blueLight, sz: 9, border: { top: M, left: T, bottom: T, right: T } });

  ws.mergeCells(`F${R}:G${R}`);
  renderCasilla(`F${R}`, 136, c.saldoPagar ?? numVal(136), {
    formula: "IF(I38+I42+D44>I39+I40+I41, I38+I42+D44-I39-I40-I41, 0)",
    bg: CLR.redPayBg,
    textColor: CLR.redPayText,
    bold: true,
    sz: 10,
    border: { top: M, left: T, bottom: T, right: T },
  });

  ws.mergeCells(`H${R}:J${R}`);
  renderCasilla(`H${R}`, 137, c.saldoFavor ?? numVal(137), {
    formula: "IF(I39+I40+I41>I38+I42+D44, I39+I40+I41-I38-I42-D44, 0)",
    bg: CLR.greenFavBg,
    textColor: CLR.greenFavText,
    bold: true,
    sz: 10,
    border: { top: M, left: T, bottom: T, right: TK },
  });
  R++;

  // Fila Datos Informativos
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:C${R}`);
  renderCasilla(`A${R}`, 138, numVal(138), { sz: 8.5, bold: true, border: { top: T, left: TK, bottom: M, right: T } });

  ws.mergeCells(`D${R}:E${R}`);
  renderCasilla(`D${R}`, 139, numVal(139), { sz: 8.5, border: { top: T, left: T, bottom: M, right: T } });

  ws.mergeCells(`F${R}:G${R}`);
  const s140 = ws.getCell(`F${R}`);
  s140.value = c.casillas[140] ? "X" : "NO";
  s140.font = font(8.5, true, CLR.black);
  s140.fill = fill(CLR.white);
  s140.border = { top: T, left: T, bottom: M, right: T };
  s140.alignment = aln("center", "middle", false);

  ws.mergeCells(`H${R}:J${R}`);
  renderCasilla(`H${R}`, 141, numVal(141), { sz: 8.5, border: { top: T, left: T, bottom: M, right: TK } });
  R++;

  // 8. FIRMAS
  const fullName = [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres].filter(Boolean).join(" ") || "CONTRIBUYENTE PERSONA NATURAL";

  ws.getRow(R).height = 24;
  ws.mergeCells(`A${R}:E${R}`);
  const fDecl = ws.getCell(`A${R}`);
  fDecl.value = { richText: [{ font: font(6.5, false, CLR.numMuted), text: "981. Cód. Representación: 0\n" }, { font: font(7.5, true, CLR.black), text: `Firma del declarante o quien lo representa: ${fullName}` }] };
  fDecl.fill = fill(CLR.white);
  fDecl.border = { top: M, left: TK, bottom: T, right: T };
  fDecl.alignment = aln("left", "middle", true);

  ws.mergeCells(`F${R}:J${R}`);
  const fSello = ws.getCell(`F${R}`);
  fSello.value = { richText: [{ font: font(7, true, CLR.black), text: "997. Espacio exclusivo para el sello de la entidad recaudadora\n" }, { font: font(6, false, CLR.numMuted), text: "(Fecha de presentación y certificación electrónica MUISCA)" }] };
  fSello.fill = fill(CLR.white);
  fSello.border = { top: M, left: T, bottom: T, right: TK };
  fSello.alignment = aln("center", "middle", true);
  R++;

  ws.getRow(R).height = 22;
  ws.mergeCells(`A${R}:E${R}`);
  const fCont = ws.getCell(`A${R}`);
  fCont.value = { richText: [{ font: font(6.5, false, CLR.numMuted), text: "982. Cód. Contador: 0    994. Con salvedades: NO\n" }, { font: font(7, false, CLR.black), text: "983. No. Tarjeta profesional: __________-T  (Firma no requerida por topes legales)" }] };
  fCont.fill = fill(CLR.white);
  fCont.border = { top: T, left: TK, bottom: TK, right: T };
  fCont.alignment = aln("left", "middle", true);

  ws.mergeCells(`F${R}:H${R}`);
  renderCasilla(`F${R}`, 980, c.saldoPagar > 0 ? numVal(136) : 0, {
    formula: "F44",
    bg: CLR.blueTotal,
    bold: true,
    sz: 10,
    border: { top: T, left: T, bottom: TK, right: T },
  });

  ws.mergeCells(`I${R}:J${R}`);
  const fAdh = ws.getCell(`I${R}`);
  fAdh.value = "996. Espacio número interno DIAN / Adhesivo";
  fAdh.font = font(6, false, CLR.numMuted);
  fAdh.fill = fill(CLR.white);
  fAdh.border = { top: T, left: T, bottom: TK, right: TK };
  fAdh.alignment = aln("center", "middle", true);

  // =========================================================================
  // HOJA 2: LIQUIDACIÓN Y FÓRMULAS VIVAS 100%
  // =========================================================================
  const ws2 = wb.addWorksheet("Liquidación y Fórmulas 100%", {
    properties: { defaultRowHeight: 20, tabColor: { argb: "FF2D6187" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws2.columns = [
    { key: "casilla", width: 14 },
    { key: "concepto", width: 46 },
    { key: "seccion", width: 34 },
    { key: "legal", width: 26 },
    { key: "formula", width: 56 },
    { key: "valor", width: 22 },
  ];

  // Header Title
  ws2.mergeCells("A1:F1");
  const h1 = ws2.getCell("A1");
  h1.value = `DIAN · FORMULARIO 210 — HOJA DE LIQUIDACIÓN Y FÓRMULAS OFICIALES (AÑO GRAVABLE ${d.year})`;
  h1.font = font(12, true, CLR.white);
  h1.fill = fill("FF1E3A8A");
  h1.alignment = aln("center", "middle");

  ws2.mergeCells("A2:F2");
  const h2 = ws2.getCell("A2");
  h2.value = `Contribuyente: ${fullName} | NIT: ${id.nit || "—"}-${id.dv || "0"} | Seccional: ${id.dirSeccional || "02"} | Actividad CIIU: ${id.actividadCiiu || "0010"} | UVT AG: $${fmt(c.uvt)}`;
  h2.font = font(9, false, "FF374151");
  h2.fill = fill("FFEBF5FF");
  h2.alignment = aln("center", "middle");

  // Summary KPI Cards (Rows 4-5)
  const kpis = [
    { rangeTitle: "A4:B4", rangeVal: "A5:B5", title: "PATRIMONIO LÍQUIDO (31)", val: numVal(31), bg: "FFEFF6FF" },
    { rangeTitle: "C4:C4", rangeVal: "C5:C5", title: "RENTA LÍQ. GRAVABLE (97)", val: c.rentaLiquidaGravable ?? numVal(97), bg: "FFF0FDF4" },
    { rangeTitle: "D4:D4", rangeVal: "D5:D5", title: "TOTAL IMPUESTO A CARGO (129)", val: c.impuestoCargo ?? numVal(129), bg: "FFFEFCE8" },
    { rangeTitle: "E4:F4", rangeVal: "E5:F5", title: c.saldoPagar > 0 ? "TOTAL SALDO A PAGAR (136)" : "TOTAL SALDO A FAVOR (137)", val: c.saldoPagar > 0 ? (c.saldoPagar ?? numVal(136)) : (c.saldoFavor ?? numVal(137)), bg: c.saldoPagar > 0 ? "FFFEE2E2" : "FFDCFCE7" },
  ];

  for (const k of kpis) {
    ws2.mergeCells(k.rangeTitle);
    const tCell = ws2.getCell(k.rangeTitle.split(":")[0]);
    tCell.value = k.title;
    tCell.font = font(7.5, true, "FF4B5563");
    tCell.fill = fill(k.bg);
    tCell.alignment = aln("center", "middle");
    tCell.border = BDR_BOX;

    ws2.mergeCells(k.rangeVal);
    const vCell = ws2.getCell(k.rangeVal.split(":")[0]);
    vCell.value = k.val;
    vCell.numFmt = "$#,##0";
    vCell.font = font(11, true, "FF111827");
    vCell.fill = fill(k.bg);
    vCell.alignment = aln("center", "middle");
    vCell.border = BDR_BOX;
  }

  // Table Headers (Row 7)
  const headers2 = ["Casilla No.", "Concepto / Renglón Oficial DIAN", "Cédula / Sección", "Fundamento Legal (E.T.)", "Fórmula Matemática Explicada", "Valor Liquidado (COP)"];
  const headerCols2 = ["A", "B", "C", "D", "E", "F"];
  ws2.getRow(7).height = 22;
  headerCols2.forEach((col, idx) => {
    const cCell = ws2.getCell(`${col}7`);
    cCell.value = headers2[idx];
    cCell.font = font(8.5, true, CLR.white);
    cCell.fill = fill("FF2D6187");
    cCell.border = { top: M, left: T, bottom: M, right: T };
    cCell.alignment = aln(idx === 0 || idx === 5 ? "center" : "left", "middle");
  });

  const getExcelFormula = (num: number, rowMap: Record<number, number>): string | null => {
    const r = (n: number) => (rowMap[n] ? `F${rowMap[n]}` : "0");
    switch (num) {
      case 31: return `MAX(0, ${r(29)} - ${r(30)})`;
      case 34: return `${r(32)} - ${r(33)}`;
      case 37: return `SUM(${r(35)}:${r(36)})`;
      case 40: return `SUM(${r(38)}:${r(39)})`;
      case 41: return `MIN(${r(34)}*0.4, ${r(37)}+${r(40)})`;
      case 42: return `MAX(0, ${r(34)} - ${r(41)})`;
      case 46: return `${r(43)} - ${r(44)} - ${r(45)}`;
      case 49: return `SUM(${r(47)}:${r(48)})`;
      case 52: return `SUM(${r(50)}:${r(51)})`;
      case 53: return `MIN(${r(46)}*0.4, ${r(49)}+${r(52)})`;
      case 54: return `${r(46)} - ${r(53)}`;
      case 57: return `MAX(0, ${r(54)} - ${r(56)})`;
      case 61: return `${r(58)} - ${r(59)} - ${r(60)}`;
      case 64: return `SUM(${r(62)}:${r(63)})`;
      case 67: return `SUM(${r(65)}:${r(66)})`;
      case 69: return `MIN(${r(61)}*0.4, ${r(64)}+${r(67)})`;
      case 70: return `${r(61)} + ${r(68)} - ${r(69)}`;
      case 73: return `MAX(0, ${r(70)} - ${r(72)})`;
      case 78: return `${r(74)} - ${r(75)} - ${r(76)} - ${r(77)}`;
      case 82: return `SUM(${r(80)}:${r(81)})`;
      case 85: return `SUM(${r(83)}:${r(84)})`;
      case 86: return `MIN(${r(78)}*0.4, ${r(82)}+${r(85)})`;
      case 87: return `${r(78)} + ${r(79)} - ${r(86)}`;
      case 90: return `MAX(0, ${r(87)} - ${r(89)})`;
      case 91: return `${r(34)} + ${r(46)} + ${r(61)} + ${r(78)}`;
      case 92: return `${r(41)} + ${r(53)} + ${r(69)} + ${r(86)} + ${r(139)} + ${r(28)}`;
      case 93: return `${r(42)} + ${r(57)} + ${r(73)} + ${r(90)}`;
      case 97: return `MAX(0, ${r(93)} - ${r(94)} - ${r(95)} + ${r(96)})`;
      case 101: return `${r(99)} - ${r(100)}`;
      case 103: return `MAX(0, ${r(101)} - ${r(102)})`;
      case 106: return `${r(104)} - ${r(105)}`;
      case 111: return `MAX(${r(97)}, ${r(98)}) + ${r(103)} + ${r(107)} + ${r(109)} - ${r(110)}`;
      case 115: return `MAX(0, ${r(112)} - ${r(113)} - ${r(114)})`;
      case 121: return `SUM(${r(116)}:${r(120)})`;
      case 125: return `SUM(${r(122)}:${r(124)})`;
      case 126: return `MAX(0, ${r(121)} - ${r(125)})`;
      case 129: return `${r(126)} + ${r(127)} - ${r(128)}`;
      case 134: return `MAX(0, ${r(129)} - ${r(130)} - ${r(131)} - ${r(132)} + ${r(133)})`;
      case 136: return `IF(${r(129)} + ${r(133)} + ${r(135)} > ${r(130)} + ${r(131)} + ${r(132)}, ${r(129)} + ${r(133)} + ${r(135)} - ${r(130)} - ${r(131)} - ${r(132)}, 0)`;
      case 137: return `IF(${r(130)} + ${r(131)} + ${r(132)} > ${r(129)} + ${r(133)} + ${r(135)}, ${r(130)} + ${r(131)} + ${r(132)} - ${r(129)} - ${r(133)} - ${r(135)}, 0)`;
      case 980: return `${r(136)}`;
      default: return null;
    }
  };

  let row2 = 8;
  const casillaRowMap: Record<number, number> = {};
  for (const item of CASILLAS_OFICIALES_210) {
    casillaRowMap[item.num] = row2;
    row2++;
  }

  row2 = 8;
  for (const item of CASILLAS_OFICIALES_210) {
    ws2.getRow(row2).height = 19;
    const isEven = row2 % 2 === 0;
    const rowBg = isEven ? "FFF9FAFB" : CLR.white;

    const cellA = ws2.getCell(`A${row2}`);
    cellA.value = item.num;
    cellA.font = font(8.5, true, "FF2D6187");
    cellA.fill = fill(rowBg);
    cellA.border = BDR_BOX;
    cellA.alignment = aln("center", "middle");

    const cellB = ws2.getCell(`B${row2}`);
    cellB.value = item.label;
    cellB.font = font(8, false, CLR.black);
    cellB.fill = fill(rowBg);
    cellB.border = BDR_BOX;
    cellB.alignment = aln("left", "middle");

    const cellC = ws2.getCell(`C${row2}`);
    cellC.value = item.section;
    cellC.font = font(7.5, false, "FF4B5563");
    cellC.fill = fill(rowBg);
    cellC.border = BDR_BOX;
    cellC.alignment = aln("left", "middle");

    const cellD = ws2.getCell(`D${row2}`);
    cellD.value = item.legal;
    cellD.font = font(7.5, false, "FF1D4ED8");
    cellD.fill = fill(rowBg);
    cellD.border = BDR_BOX;
    cellD.alignment = aln("left", "middle");

    const formulaInfo = FORMULAS_EXPLICADAS_210[item.num];
    const cellE = ws2.getCell(`E${row2}`);
    cellE.value = formulaInfo?.formula || item.formula || "—";
    cellE.font = font(7.5, !!formulaInfo, formulaInfo ? "FF047857" : "FF6B7280");
    cellE.fill = fill(formulaInfo ? "FFF0FDF4" : rowBg);
    cellE.border = BDR_BOX;
    cellE.alignment = aln("left", "middle");

    const cellF = ws2.getCell(`F${row2}`);
    const formulaStr = getExcelFormula(item.num, casillaRowMap);
    const currVal = numVal(item.num);

    if (formulaStr) {
      cellF.value = {
        formula: formulaStr,
        result: currVal,
      };
      cellF.fill = fill("FFEEF2FF");
      cellF.font = font(8.5, true, "FF1E40AF");
    } else {
      cellF.value = item.num === 140 ? (c.casillas[140] ? "X" : "") : currVal;
      cellF.fill = fill(rowBg);
      cellF.font = font(8.5, false, CLR.black);
    }
    if (typeof cellF.value === "number" || formulaStr) {
      cellF.numFmt = "$#,##0";
    }
    cellF.border = BDR_BOX;
    cellF.alignment = aln("right", "middle");

    row2++;
  }

  // =========================================================================
  // HOJA 3: DEPURACIÓN CEDULAR Y LÍMITE DEL 40%
  // =========================================================================
  const ws3 = wb.addWorksheet("Depuración Cedular y Límites", {
    properties: { defaultRowHeight: 20, tabColor: { argb: "FF059669" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws3.columns = [
    { key: "concepto", width: 45 },
    { key: "legal", width: 25 },
    { key: "trabajo", width: 20 },
    { key: "honorarios", width: 20 },
    { key: "capital", width: 20 },
    { key: "nolab", width: 20 },
    { key: "consolidado", width: 22 },
  ];

  ws3.mergeCells("A1:G1");
  const dHdr = ws3.getCell("A1");
  dHdr.value = `DIAN · AUDITORÍA DE DEPURACIÓN CEDULAR Y CONTROL LÍMITES 40% / 1.340 UVT (AG ${d.year})`;
  dHdr.font = font(11, true, CLR.white);
  dHdr.fill = fill("FF065F46");
  dHdr.alignment = aln("center", "middle");

  const depHeaders = ["Concepto de Depuración", "Fundamento Legal", "Trabajo (COP)", "Honorarios (COP)", "Capital (COP)", "No Laborales (COP)", "Total Consolidado (COP)"];
  const depCols = ["A", "B", "C", "D", "E", "F", "G"];
  ws3.getRow(3).height = 22;
  depCols.forEach((col, idx) => {
    const cCell = ws3.getCell(`${col}3`);
    cCell.value = depHeaders[idx];
    cCell.font = font(8.5, true, CLR.white);
    cCell.fill = fill("FF059669");
    cCell.border = BDR_BOX;
    cCell.alignment = aln("center", "middle");
  });

  const depRows = [
    { conc: "(+) Ingresos Brutos", leg: "Arts. 103, 335 E.T.", tr: numVal(32), hon: numVal(43), cap: numVal(58), nol: numVal(74), form: "SUM(C4:F4)" },
    { conc: "(-) Devoluciones, Rebajas y Descuentos", leg: "Art. 336 E.T.", tr: 0, hon: numVal(44), cap: numVal(59), nol: numVal(75), form: "SUM(C5:F5)" },
    { conc: "(-) Ingresos No Constitutivos (INCRNGO)", leg: "Arts. 55, 56 E.T.", tr: numVal(33), hon: numVal(45), cap: numVal(60), nol: numVal(76), form: "SUM(C6:F6)" },
    { conc: "(-) Costos y Gastos Procedentes", leg: "Art. 107, 336 E.T.", tr: 0, hon: 0, cap: 0, nol: numVal(77), form: "SUM(C7:F7)" },
    { conc: "(=) Ingresos Netos Cedulares", leg: "Art. 336 num. 1 E.T.", tr: numVal(34), hon: numVal(46), cap: numVal(61), nol: numVal(78), form: "SUM(C8:F8)", bold: true, bg: "FFECFDF5" },
    { conc: "Tope Límite del 40 % sobre Ingreso Neto", leg: "Art. 336 num. 2 E.T.", tr: Math.round(numVal(34)*0.4), hon: Math.round(numVal(46)*0.4), cap: Math.round(numVal(61)*0.4), nol: Math.round(numVal(78)*0.4), form: "G8*0.4", italic: true },
    { conc: "Límite Máximo Global en Pesos (1.340 UVT)", leg: "Art. 336 num. 2 E.T.", tr: Math.round(c.uvt*1340), hon: Math.round(c.uvt*1340), cap: Math.round(c.uvt*1340), nol: Math.round(c.uvt*1340), form: `${Math.round(c.uvt*1340)}`, italic: true },
    { conc: "(-) Rentas Exentas Solicitadas", leg: "Arts. 126-1, 206 E.T.", tr: numVal(37), hon: numVal(49), cap: numVal(64), nol: numVal(82), form: "SUM(C11:F11)" },
    { conc: "(-) Deducciones Imputables Solicitadas", leg: "Arts. 119, 387 E.T.", tr: numVal(40), hon: numVal(52), cap: numVal(67), nol: numVal(85), form: "SUM(C12:F12)" },
    { conc: "(=) Exentas y Deducciones Aceptadas", leg: "Art. 336 E.T.", tr: numVal(41), hon: numVal(53), cap: numVal(69), nol: numVal(86), form: "SUM(C13:F13)", bold: true, bg: "FFEFF6FF" },
    { conc: "(+) Beneficio Adicional Dependientes (72 UVT)", leg: "Art. 336 inc. 2 E.T.", tr: numVal(139), hon: 0, cap: 0, nol: 0, form: "C14" },
    { conc: "(+) Beneficio 1 % Factura Electrónica", leg: "Art. 336 par. 5 E.T.", tr: numVal(28), hon: 0, cap: 0, nol: 0, form: "C15" },
    { conc: "(=) TOTAL EXENTAS Y DEDUCCIONES (Casilla 92)", leg: "Casilla 92 DIAN", tr: numVal(41)+numVal(139)+numVal(28), hon: numVal(53), cap: numVal(69), nol: numVal(86), form: "SUM(C16:F16)", bold: true, bg: "FFDBEAFE" },
    { conc: "(=) RENTA LÍQUIDA ORDINARIA (Casilla 93)", leg: "Art. 336 num. 5 E.T.", tr: numVal(42), hon: numVal(57), cap: numVal(73), nol: numVal(90), form: "SUM(C17:F17)", bold: true, bg: "FFFEF3C7" },
    { conc: "(=) RENTA LÍQUIDA GRAVABLE (Casilla 97)", leg: "Art. 336 num. 5 E.T.", tr: numVal(42), hon: numVal(57), cap: numVal(73), nol: numVal(90), form: "G17", bold: true, bg: "FFFDE68A" },
  ];

  let rDep = 4;
  for (const dr of depRows) {
    ws3.getRow(rDep).height = 19;
    const cA = ws3.getCell(`A${rDep}`);
    cA.value = dr.conc;
    cA.font = font(8, dr.bold, CLR.black, "Arial", dr.italic);
    cA.fill = fill(dr.bg ?? CLR.white);
    cA.border = BDR_BOX;

    const cB = ws3.getCell(`B${rDep}`);
    cB.value = dr.leg;
    cB.font = font(7.5, false, "FF4B5563");
    cB.fill = fill(dr.bg ?? CLR.white);
    cB.border = BDR_BOX;

    const cC = ws3.getCell(`C${rDep}`);
    cC.value = dr.tr;
    cC.numFmt = "$#,##0";
    cC.font = font(8, dr.bold, CLR.black);
    cC.fill = fill(dr.bg ?? CLR.white);
    cC.border = BDR_BOX;

    const cD = ws3.getCell(`D${rDep}`);
    cD.value = dr.hon;
    cD.numFmt = "$#,##0";
    cD.font = font(8, dr.bold, CLR.black);
    cD.fill = fill(dr.bg ?? CLR.white);
    cD.border = BDR_BOX;

    const cE = ws3.getCell(`E${rDep}`);
    cE.value = dr.cap;
    cE.numFmt = "$#,##0";
    cE.font = font(8, dr.bold, CLR.black);
    cE.fill = fill(dr.bg ?? CLR.white);
    cE.border = BDR_BOX;

    const cF = ws3.getCell(`F${rDep}`);
    cF.value = dr.nol;
    cF.numFmt = "$#,##0";
    cF.font = font(8, dr.bold, CLR.black);
    cF.fill = fill(dr.bg ?? CLR.white);
    cF.border = BDR_BOX;

    const cG = ws3.getCell(`G${rDep}`);
    cG.value = {
      formula: dr.form,
      result: (dr.tr || 0) + (dr.hon || 0) + (dr.cap || 0) + (dr.nol || 0),
    };
    cG.numFmt = "$#,##0";
    cG.font = font(8.5, true, "FF065F46");
    cG.fill = fill(dr.bg ?? "FFF0FDF4");
    cG.border = BDR_BOX;

    rDep++;
  }

  // =========================================================================
  // HOJA 4: TABLA PROGRESIVA ART. 241 E.T.
  // =========================================================================
  const ws4 = wb.addWorksheet("Tabla Progresiva Art. 241", {
    properties: { defaultRowHeight: 20, tabColor: { argb: "FF7C3AED" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws4.columns = [
    { key: "rango", width: 12 },
    { key: "desdeUvt", width: 16 },
    { key: "hastaUvt", width: 16 },
    { key: "tarifa", width: 14 },
    { key: "baseUvt", width: 18 },
    { key: "formulaUvt", width: 42 },
    { key: "impuestoCop", width: 22 },
  ];

  ws4.mergeCells("A1:G1");
  const tHdr = ws4.getCell("A1");
  tHdr.value = `DIAN · TABLA DE RETENCIÓN E IMPUESTO SOBRE LA RENTA ARTÍCULO 241 E.T. (UVT $${fmt(c.uvt)})`;
  tHdr.font = font(11, true, CLR.white);
  tHdr.fill = fill("FF5B21B6");
  tHdr.alignment = aln("center", "middle");

  const t4Headers = ["Rango No.", "Desde (UVT)", "Hasta (UVT)", "Tarifa Marginal", "Impuesto Base (UVT)", "Fórmula en UVT", "Impuesto Liquidado (COP)"];
  const t4Cols = ["A", "B", "C", "D", "E", "F", "G"];
  ws4.getRow(3).height = 22;
  t4Cols.forEach((col, idx) => {
    const cCell = ws4.getCell(`${col}3`);
    cCell.value = t4Headers[idx];
    cCell.font = font(8.5, true, CLR.white);
    cCell.fill = fill("FF6D28D9");
    cCell.border = BDR_BOX;
    cCell.alignment = aln("center", "middle");
  });

  const rangos241 = [
    { r: "Rango 1", dUvt: 0, hUvt: 1090, t: "0 %", bUvt: 0, form: "0", cop: 0 },
    { r: "Rango 2", dUvt: 1090, hUvt: 1700, t: "19 %", bUvt: 0, form: "(Base UVT - 1.090) * 19%", cop: 0 },
    { r: "Rango 3", dUvt: 1700, hUvt: 4100, t: "28 %", bUvt: 116, form: "(Base UVT - 1.700) * 28% + 116", cop: 0 },
    { r: "Rango 4", dUvt: 4100, hUvt: 8670, t: "33 %", bUvt: 788, form: "(Base UVT - 4.100) * 33% + 788", cop: 0 },
    { r: "Rango 5", dUvt: 8670, hUvt: 18970, t: "35 %", bUvt: 2296, form: "(Base UVT - 8.670) * 35% + 2.296", cop: 0 },
    { r: "Rango 6", dUvt: 18970, hUvt: 31000, t: "37 %", bUvt: 5901, form: "(Base UVT - 18.970) * 37% + 5.901", cop: 0 },
    { r: "Rango 7", dUvt: 31000, hUvt: 999999, t: "39 %", bUvt: 10352, form: "(Base UVT - 31.000) * 39% + 10.352", cop: 0 },
  ];

  let r4 = 4;
  for (const rg of rangos241) {
    ws4.getRow(r4).height = 19;
    const cA = ws4.getCell(`A${r4}`);
    cA.value = rg.r;
    cA.font = font(8, true, "FF6D28D9");
    cA.fill = fill(CLR.white);
    cA.border = BDR_BOX;
    cA.alignment = aln("center", "middle");

    const cB = ws4.getCell(`B${r4}`);
    cB.value = rg.dUvt;
    cB.numFmt = "#,##0";
    cB.font = font(8, false, CLR.black);
    cB.fill = fill(CLR.white);
    cB.border = BDR_BOX;

    const cC = ws4.getCell(`C${r4}`);
    cC.value = rg.hUvt === 999999 ? "En adelante" : rg.hUvt;
    if (typeof cC.value === "number") cC.numFmt = "#,##0";
    cC.font = font(8, false, CLR.black);
    cC.fill = fill(CLR.white);
    cC.border = BDR_BOX;

    const cD = ws4.getCell(`D${r4}`);
    cD.value = rg.t;
    cD.font = font(8, true, "FF047857");
    cD.fill = fill(CLR.white);
    cD.border = BDR_BOX;
    cD.alignment = aln("center", "middle");

    const cE = ws4.getCell(`E${r4}`);
    cE.value = rg.bUvt;
    cE.numFmt = "#,##0";
    cE.font = font(8, false, CLR.black);
    cE.fill = fill(CLR.white);
    cE.border = BDR_BOX;

    const cF = ws4.getCell(`F${r4}`);
    cF.value = rg.form;
    cF.font = font(8, false, "FF4B5563");
    cF.fill = fill(CLR.white);
    cF.border = BDR_BOX;

    const cG = ws4.getCell(`G${r4}`);
    cG.value = numVal(116);
    cG.numFmt = "$#,##0";
    cG.font = font(8.5, true, "FF1E40AF");
    cG.fill = fill("FFF5F3FF");
    cG.border = BDR_BOX;

    r4++;
  }

  // Descargar archivo Excel desde buffer
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
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


