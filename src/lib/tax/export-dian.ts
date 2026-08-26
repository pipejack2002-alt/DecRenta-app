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
    disabledGray: "FFF4F4F4",
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
    const valStr = fmt(val);
    const numStr = casNum !== null && casNum !== undefined ? String(casNum) : "";

    cell.value = {
      richText: [
        numStr ? { font: font(5.5, true, opts.numColor ?? CLR.numMuted), text: `${numStr} ` } : { font: font(5.5), text: "" },
        { font: font(5.5), text: "\n" },
        {
          font: font(
            opts.sz ?? 8,
            opts.bold ?? false,
            opts.textColor ?? CLR.black,
            "Arial",
            opts.italic ?? false
          ),
          text: valStr,
        },
      ],
    };
    cell.fill = fill(opts.bg ?? CLR.white);
    cell.border = opts.border ?? BDR_BOX;
    cell.alignment = aln(opts.h ?? "right", opts.v ?? "middle", true);
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
  const p29 = ws.getCell(`C${R}`);
  p29.value = { richText: [{ font: font(7, false, CLR.black), text: "Total patrimonio bruto   " }, { font: font(6, true, CLR.numBlue), text: "29\n" }, { font: font(8.5, true, CLR.black), text: fmt(numVal(29)) }] };
  p29.fill = fill(CLR.white);
  p29.border = { top: M, left: T, bottom: M, right: T };
  p29.alignment = aln("right", "middle", true);

  ws.mergeCells(`E${R}:F${R}`);
  const p30 = ws.getCell(`E${R}`);
  p30.value = { richText: [{ font: font(7, false, CLR.black), text: "Deudas   " }, { font: font(6, true, CLR.numBlue), text: "30\n" }, { font: font(8.5, true, CLR.black), text: fmt(numVal(30)) }] };
  p30.fill = fill(CLR.white);
  p30.border = { top: M, left: T, bottom: M, right: T };
  p30.alignment = aln("right", "middle", true);

  ws.mergeCells(`G${R}:J${R}`);
  const p31 = ws.getCell(`G${R}`);
  p31.value = { richText: [{ font: font(7.5, true, CLR.black), text: "Total patrimonio líquido   " }, { font: font(6.5, true, CLR.numBlue), text: "31\n" }, { font: font(9.5, true, CLR.black), text: fmt(numVal(31)) }] };
  p31.fill = fill(CLR.blueTotal);
  p31.border = { top: M, left: T, bottom: M, right: TK };
  p31.alignment = aln("right", "middle", true);
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
    ["Ingresos brutos", 32, numVal(32), 43, numVal(43), 58, numVal(58), 74, numVal(74), CLR.blueAlt, false, false],
    ["Devoluciones, rebajas y descuentos", null, null, null, null, null, null, 75, numVal(75), CLR.disabledGray, false, false],
    ["Ingresos no constitutivos de renta", 33, numVal(33), 44, numVal(44), 59, numVal(59), 76, numVal(76), CLR.blueAlt, false, false],
    ["Costos y deducciones procedentes", null, null, 45, numVal(45), 60, numVal(60), 77, numVal(77), CLR.blueAlt, false, false],
    ["Renta líquida", 34, numVal(34), 46, numVal(46), 61, numVal(61), 78, numVal(78), CLR.blueSoft, true, false],
    ["Rentas líquidas pasivas - ECE", null, null, null, null, 62, numVal(62), 79, numVal(79), CLR.blueAlt, false, false],
    ["  • Aportes voluntarios AFC, FVP y AVC", 35, numVal(35), 47, numVal(47), 63, numVal(63), 80, numVal(80), CLR.blueAlt, false, true],
    ["  • Otras rentas exentas", 36, numVal(36), 48, numVal(48), 64, numVal(64), 81, numVal(81), CLR.blueAlt, false, true],
    ["Total rentas exentas", 37, numVal(37), 49, numVal(49), 65, numVal(65), 82, numVal(82), CLR.blueMuted, true, false],
    ["  • Intereses de vivienda", 38, numVal(38), 50, numVal(50), 66, numVal(66), 83, numVal(83), CLR.blueAlt, false, true],
    ["  • Otras deducciones imputables", 39, numVal(39), 51, numVal(51), 67, numVal(67), 84, numVal(84), CLR.blueAlt, false, true],
    ["Total deducciones imputables", 40, numVal(40), 52, numVal(52), 68, numVal(68), 85, numVal(85), CLR.blueMuted, true, false],
    ["Rentas exentas y/o deduc. imputables (Limitadas)", 41, numVal(41), 53, numVal(53), 69, numVal(69), 86, numVal(86), CLR.blueLimit, true, false],
    ["Renta líquida ordinaria del ejercicio", null, null, 54, numVal(54), 70, numVal(70), 87, numVal(87), CLR.blueAlt, false, false],
    ["Pérdida líquida del ejercicio", null, null, 55, numVal(55), 71, numVal(71), 88, numVal(88), CLR.blueAlt, false, false],
    ["Compensaciones por pérdidas", null, null, 56, numVal(56), 72, numVal(72), 89, numVal(89), CLR.blueAlt, false, false],
    ["Renta líquida ordinaria", 42, numVal(42), 57, numVal(57), 73, numVal(73), 90, numVal(90), CLR.blueHdr, true, false],
  ];

  for (const row of CEDULA_ROWS) {
    ws.getRow(R).height = 18;
    const [label, cT, vT, cH, vH, cC, vC, cN, vN, rowBg, isBold, isItalic] = row;

    const cLabel = ws.getCell(`B${R}`);
    cLabel.value = label;
    cLabel.font = font(isBold ? 7.5 : 7, isBold as boolean, CLR.black, "Arial", isItalic as boolean);
    cLabel.fill = fill(rowBg as string);
    cLabel.border = BDR_BOX;
    cLabel.alignment = aln("left", "middle", true);

    ws.mergeCells(`C${R}:D${R}`);
    if (cT !== null) {
      renderCasilla(`C${R}`, cT as number, vT, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`C${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    ws.mergeCells(`E${R}:F${R}`);
    if (cH !== null) {
      renderCasilla(`E${R}`, cH as number, vH, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`E${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    ws.mergeCells(`G${R}:H${R}`);
    if (cC !== null) {
      renderCasilla(`G${R}`, cC as number, vC, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`G${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    ws.mergeCells(`I${R}:J${R}`);
    if (cN !== null) {
      renderCasilla(`I${R}`, cN as number, vN, { bg: rowBg, bold: isBold, border: { top: T, left: T, bottom: T, right: TK } });
    } else {
      const disCell = ws.getCell(`I${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = { top: T, left: T, bottom: T, right: TK };
    }
    R++;
  }

  renderTab(`A${startCG}:A${R-1}`, "Cédula general", CLR.tabGray, CLR.black, 7.5);

  // 5. DEPURACIÓN
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  const d91 = ws.getCell(`A${R}`);
  d91.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Ren. líquida céd. gen.  " }, { font: font(6, true, CLR.numBlue), text: "91\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(91)) }] };
  d91.fill = fill(CLR.blueSoft);
  d91.border = { top: M, left: TK, bottom: T, right: T };
  d91.alignment = aln("right", "middle", true);

  ws.mergeCells(`C${R}:D${R}`);
  const d92 = ws.getCell(`C${R}`);
  d92.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Ren. ex. y ded. imp. li.  " }, { font: font(6, true, CLR.numBlue), text: "92\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(92)) }] };
  d92.fill = fill(CLR.blueSoft);
  d92.border = { top: M, left: T, bottom: T, right: T };
  d92.alignment = aln("right", "middle", true);

  ws.mergeCells(`E${R}:G${R}`);
  const d93 = ws.getCell(`E${R}`);
  d93.value = { richText: [{ font: font(6.5, true, CLR.black), text: "R. líq. ord. cédula gen.  " }, { font: font(6, true, CLR.numBlue), text: "93\n" }, { font: font(9, true, CLR.black), text: fmt(numVal(93)) }] };
  d93.fill = fill(CLR.blueSoft);
  d93.border = { top: M, left: T, bottom: T, right: T };
  d93.alignment = aln("right", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const d94 = ws.getCell(`H${R}`);
  d94.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Comp. pérdidas año 2018 y ant.  " }, { font: font(6, true, CLR.numBlue), text: "94\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(94)) }] };
  d94.fill = fill(CLR.blueSoft);
  d94.border = { top: M, left: T, bottom: T, right: TK };
  d94.alignment = aln("right", "middle", true);
  R++;

  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  const d95 = ws.getCell(`A${R}`);
  d95.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Comp. exc. ren. presuntiva  " }, { font: font(6, true, CLR.numBlue), text: "95\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(95)) }] };
  d95.fill = fill(CLR.blueSoft);
  d95.border = { top: T, left: TK, bottom: M, right: T };
  d95.alignment = aln("right", "middle", true);

  ws.mergeCells(`C${R}:D${R}`);
  const d96 = ws.getCell(`C${R}`);
  d96.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Rentas gravables  " }, { font: font(6, true, CLR.numBlue), text: "96\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(96)) }] };
  d96.fill = fill(CLR.blueSoft);
  d96.border = { top: T, left: T, bottom: M, right: T };
  d96.alignment = aln("right", "middle", true);

  ws.mergeCells(`E${R}:G${R}`);
  const d97 = ws.getCell(`E${R}`);
  d97.value = { richText: [{ font: font(7, true, CLR.black), text: "R. líq. grav. cédula gen.  " }, { font: font(6.5, true, CLR.numBlue), text: "97\n" }, { font: font(10, true, CLR.black), text: fmt(c.rentaLiquidaGravable ?? numVal(97)) }] };
  d97.fill = fill(CLR.blueHdr);
  d97.border = { top: T, left: T, bottom: M, right: T };
  d97.alignment = aln("right", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const d98 = ws.getCell(`H${R}`);
  d98.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Renta presuntiva  " }, { font: font(6, true, CLR.numBlue), text: "98\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(98)) }] };
  d98.fill = fill(CLR.blueSoft);
  d98.border = { top: T, left: T, bottom: M, right: TK };
  d98.alignment = aln("right", "middle", true);
  R++;

  // 6. DIVISIÓN INFERIOR
  const LEFT_SECTIONS = [
    { label: "Ingresos brutos por rentas de pensiones del país y del exterior", cas: 99, val: numVal(99), bg: CLR.white, bold: false },
    { label: "Ingresos no constitutivos de renta", cas: 100, val: numVal(100), bg: CLR.white, bold: false },
    { label: "Renta líquida", cas: 101, val: numVal(101), bg: CLR.blueLight, bold: false },
    { label: "Rentas exentas de pensiones", cas: 102, val: numVal(102), bg: CLR.white, bold: false },
    { label: "Renta líquida gravable cédula de pensiones", cas: 103, val: numVal(103), bg: CLR.blueHdr, bold: true },

    { label: "Dividendos y participaciones año 2016 y anteriores, y otros", cas: 104, val: numVal(104), bg: CLR.white, bold: false },
    { label: "Ingresos no constitutivos de renta", cas: 105, val: numVal(105), bg: CLR.white, bold: false },
    { label: "Renta líquida ordinaria año 2016 y anteriores", cas: 106, val: numVal(106), bg: CLR.blueLight, bold: false },
    { label: "1a. Subcédula años 2017 y siguientes numeral 3 art. 49 del E.T.", cas: 107, val: numVal(107), bg: CLR.white, bold: false },
    { label: "2a. Subcédula años 2017 y siguientes parágrafo 2 art. 49 del E.T.", cas: 108, val: numVal(108), bg: CLR.white, bold: false },
    { label: "Dividendos y participaciones recibidas del exterior", cas: 109, val: numVal(109), bg: CLR.white, bold: false },
    { label: "Rentas exentas de la casilla 109", cas: 110, val: numVal(110), bg: CLR.white, bold: false },
    { label: "Renta líquida gravable (Cédula general o Renta presuntiva, pensiones y div)", cas: 111, val: numVal(111), bg: CLR.blueHdr, bold: true },

    { label: "Ingresos por ganancias ocasionales del país y del exterior", cas: 112, val: numVal(112), bg: CLR.white, bold: false },
    { label: "Costos por ganancias ocasionales", cas: 113, val: numVal(113), bg: CLR.white, bold: false },
    { label: "Ganancias ocasionales no gravadas y exentas", cas: 114, val: numVal(114), bg: CLR.white, bold: false },
    { label: "Ganancias ocasionales gravables", cas: 115, val: numVal(115), bg: CLR.blueHdr, bold: true },
  ];

  const RIGHT_SECTIONS = [
    { type: "row", label: "Cédula general, de pensiones y de dividendos y participaciones", cas: 116, val: numVal(116), bg: CLR.white, bold: false },
    { type: "row", label: "Renta presuntiva, de pensiones y de dividendos y participaciones", cas: 117, val: numVal(117), bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones año 2017 y siguientes, 2a subcédula (Art. 240)", cas: 118, val: numVal(118), bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones año 2016", cas: 119, val: numVal(119), bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones recibidas del exterior", cas: 120, val: numVal(120), bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto sobre las rentas líquidas gravables", cas: 121, val: numVal(121), bg: CLR.blueSoft, bold: true },
    { type: "descGrid1", c1: 122, l1: "Imp. pagados exterior", v1: numVal(122), c2: 123, l2: "Donaciones", v2: numVal(123) },
    { type: "descGrid2", c1: 124, l1: "Dividendos, partic. y otros", v1: numVal(124), c2: 125, l2: "Total desctos trib.", v2: numVal(125) },
    { type: "row", label: "Impuesto neto de renta", cas: 126, val: c.impuestoNeto ?? numVal(126), bg: CLR.blueLight, bold: true },
    { type: "row", label: "Impuesto de ganancias ocasionales", cas: 127, val: numVal(127), bg: CLR.white, bold: false },
    { type: "row", label: "Descuento por impuestos pagados en el exterior por ganancias ocasionales", cas: 128, val: numVal(128), bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto a cargo", cas: 129, val: c.impuestoCargo ?? numVal(129), bg: CLR.blueHdr, bold: true },
    { type: "row", label: "Anticipo renta liquidado año gravable anterior", cas: 130, val: numVal(130), bg: CLR.white, bold: false },
    { type: "row", label: "Saldo a favor del año gravable anterior sin solicitud de devolución/compensación", cas: 131, val: numVal(131), bg: CLR.white, bold: false },
    { type: "row", label: "Retenciones año gravable a declarar", cas: 132, val: numVal(132), bg: CLR.white, bold: false },
    { type: "row", label: "Anticipo renta para el año gravable siguiente", cas: 133, val: numVal(133), bg: CLR.white, bold: false },
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
      renderCasilla(`E${R}`, l.cas, l.val, { bg: l.bg, bold: l.bold });
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
          bg: r.bg,
          bold: r.bold,
          border: { top: T, left: T, bottom: T, right: TK },
        });
      } else if (r.type === "descGrid1" || r.type === "descGrid2") {
        const d1 = ws.getCell(`H${R}`);
        d1.value = { richText: [{ font: font(6.5, false, CLR.black), text: `${r.l1}  ` }, { font: font(5.5, true, CLR.numBlue), text: `${r.c1}\n` }, { font: font(8, r.type === "descGrid2", CLR.black), text: fmt(r.v1) }] };
        d1.fill = fill(CLR.blueAlt);
        d1.border = BDR_BOX;
        d1.alignment = aln("right", "middle", true);

        ws.mergeCells(`I${R}:J${R}`);
        const d2 = ws.getCell(`I${R}`);
        d2.value = { richText: [{ font: font(6.5, r.type === "descGrid2", CLR.black), text: `${r.l2}  ` }, { font: font(5.5, true, CLR.numBlue), text: `${r.c2}\n` }, { font: font(8, r.type === "descGrid2", CLR.black), text: fmt(r.v2) }] };
        d2.fill = fill(r.type === "descGrid2" ? CLR.blueSoft : CLR.blueAlt);
        d2.border = { top: T, left: T, bottom: T, right: TK };
        d2.alignment = aln("right", "middle", true);
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
  const s134 = ws.getCell(`A${R}`);
  s134.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Saldo a pagar por impuesto  " }, { font: font(6, true, CLR.numBlue), text: "134\n" }, { font: font(9, false, CLR.black), text: fmt(numVal(134)) }] };
  s134.fill = fill(CLR.blueLight);
  s134.border = { top: M, left: TK, bottom: T, right: T };
  s134.alignment = aln("right", "middle", true);

  ws.mergeCells(`D${R}:E${R}`);
  const s135 = ws.getCell(`D${R}`);
  s135.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Sanciones  " }, { font: font(6, true, CLR.numBlue), text: "135\n" }, { font: font(9, false, CLR.black), text: fmt(numVal(135)) }] };
  s135.fill = fill(CLR.blueLight);
  s135.border = { top: M, left: T, bottom: T, right: T };
  s135.alignment = aln("right", "middle", true);

  ws.mergeCells(`F${R}:G${R}`);
  const s136 = ws.getCell(`F${R}`);
  s136.value = { richText: [{ font: font(7, true, CLR.redPayText), text: "Total saldo a pagar  " }, { font: font(6.5, true, CLR.redPayText), text: "136\n" }, { font: font(10, true, CLR.redPayText), text: fmt(c.saldoPagar ?? numVal(136)) }] };
  s136.fill = fill(CLR.redPayBg);
  s136.border = { top: M, left: T, bottom: T, right: T };
  s136.alignment = aln("right", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const s137 = ws.getCell(`H${R}`);
  s137.value = { richText: [{ font: font(7, true, CLR.greenFavText), text: "Total saldo a favor  " }, { font: font(6.5, true, CLR.greenFavText), text: "137\n" }, { font: font(10, true, CLR.greenFavText), text: fmt(c.saldoFavor ?? numVal(137)) }] };
  s137.fill = fill(CLR.greenFavBg);
  s137.border = { top: M, left: T, bottom: T, right: TK };
  s137.alignment = aln("right", "middle", true);
  R++;

  // Fila Datos Informativos
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:C${R}`);
  const s138 = ws.getCell(`A${R}`);
  s138.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Número de dependientes económicos  " }, { font: font(6, true, CLR.numBlue), text: "138\n" }, { font: font(8.5, true, CLR.black), text: fmt(numVal(138)) }] };
  s138.fill = fill(CLR.white);
  s138.border = { top: T, left: TK, bottom: M, right: T };
  s138.alignment = aln("right", "middle", true);

  ws.mergeCells(`D${R}:E${R}`);
  const s139 = ws.getCell(`D${R}`);
  s139.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Adición dependientes a cas. 92  " }, { font: font(6, true, CLR.numBlue), text: "139\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(139)) }] };
  s139.fill = fill(CLR.white);
  s139.border = { top: T, left: T, bottom: M, right: T };
  s139.alignment = aln("right", "middle", true);

  ws.mergeCells(`F${R}:G${R}`);
  const s140 = ws.getCell(`F${R}`);
  s140.value = { richText: [{ font: font(6, false, CLR.black), text: "Superó tope art. 336-1 marque X  " }, { font: font(6, true, CLR.numBlue), text: "140\n" }, { font: font(8.5, true, CLR.black), text: c.casillas[140] ? "X" : "NO" }] };
  s140.fill = fill(CLR.white);
  s140.border = { top: T, left: T, bottom: M, right: T };
  s140.alignment = aln("center", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const s141 = ws.getCell(`H${R}`);
  s141.value = { richText: [{ font: font(6.5, false, CLR.black), text: "Aporte voluntario  " }, { font: font(6, true, CLR.numBlue), text: "141\n" }, { font: font(8.5, false, CLR.black), text: fmt(numVal(141)) }] };
  s141.fill = fill(CLR.white);
  s141.border = { top: T, left: T, bottom: M, right: TK };
  s141.alignment = aln("right", "middle", true);
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
  const fPago = ws.getCell(`F${R}`);
  fPago.value = { richText: [{ font: font(8, true, CLR.black), text: "980. Pago total $  " }, { font: font(10.5, true, CLR.black, "Courier New"), text: fmt(c.saldoPagar > 0 ? numVal(136) : 0) }] };
  fPago.fill = fill(CLR.blueTotal);
  fPago.border = { top: T, left: T, bottom: TK, right: T };
  fPago.alignment = aln("right", "middle", true);

  ws.mergeCells(`I${R}:J${R}`);
  const fAdh = ws.getCell(`I${R}`);
  fAdh.value = "996. Espacio número interno DIAN / Adhesivo";
  fAdh.font = font(6, false, CLR.numMuted);
  fAdh.fill = fill(CLR.white);
  fAdh.border = { top: T, left: T, bottom: TK, right: TK };
  fAdh.alignment = aln("center", "middle", true);

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


