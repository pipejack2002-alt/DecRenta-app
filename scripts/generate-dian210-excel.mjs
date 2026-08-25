import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

/**
 * Script para generar el archivo Excel oficial Formulario_210_2024_Oficial_DIAN.xlsx
 * idéntico en estructura, columnas, cajetines y secciones al PDF Formulario_210_2024.pdf.
 */
function buildOfficialDian210Workbook() {
  const wb = XLSX.utils.book_new();

  // Matriz de celdas para el Formulario 210 Oficial (Hoja 1)
  const aoa = [
    // 1-3: Encabezado Oficial
    ["DIAN", "", "", "DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES Y ASIMILADAS RESIDENTES Y SUCESIONES ILÍQUIDAS DE CAUSANTES RESIDENTES", "", "", "", "", "210", ""],
    ["1. Año", "2024", "", "4. Número de formulario: 210202400010294", "", "", "", "", "MUISCA", ""],
    ["Espacio reservado para la DIAN", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // 5-6: Datos del Declarante
    ["DATOS DEL DECLARANTE", "", "", "", "", "", "", "", "", ""],
    ["5. NIT", "900.123.456", "6. DV", "7", "7. Primer apellido", "GARCÍA", "8. Segundo apellido", "MÁRQUEZ", "12. Cód. Seccional", "32"],
    ["9. Primer nombre", "GABRIEL", "10. Otros nombres", "JOSÉ", "24. Actividad CIIU", "9002", "27. Frac. año sig.", "NO", "25. Cód. Corr.", "—"],
    ["28. Uno por ciento (1%) de compras con factura electrónica", "", "", "", "", "", "", "", "Casilla 28", 1240000],
    ["", "", "", "", "", "", "", "", "", ""],

    // 10-11: Patrimonio
    ["SECCIÓN PATRIMONIO", "", "", "", "", "", "", "", "", ""],
    ["29. Total patrimonio bruto", 420000000, "", "30. Deudas", 85000000, "", "31. Total patrimonio líquido", 335000000, "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // 13: Cédula General - Encabezado de Matriz de 4 Columnas
    [
      "CÉDULA GENERAL (Conceptos / Rentas)",
      "Cas.",
      "Rentas de Trabajo",
      "Cas.",
      "Honorarios y Serv. con Costos",
      "Cas.",
      "Rentas de Capital",
      "Cas.",
      "Rentas No Laborales",
      ""
    ],
    ["Ingresos brutos", "32", 145000000, "43", 0, "58", 18500000, "74", 0],
    ["Devoluciones, rebajas y descuentos", "—", 0, "—", 0, "—", 0, "75", 0],
    ["Ingresos no constitutivos de renta", "33", 11600000, "44", 0, "59", 2100000, "76", 0],
    ["Costos y deducciones procedentes", "—", 0, "45", 0, "60", 3500000, "77", 0],
    ["Renta líquida", "34", 133400000, "46", 0, "61", 12900000, "78", 0],
    ["Rentas líquidas pasivas - ECE", "—", 0, "—", 0, "62", 0, "79", 0],
    ["Aportes voluntarios AFC, FVP y AVC", "35", 12000000, "47", 0, "63", 0, "80", 0],
    ["Otras rentas exentas (incluye 25% num. 10 art. 206)", "36", 26500000, "48", 0, "64", 0, "81", 0],
    ["Total rentas exentas", "37", 38500000, "49", 0, "65", 0, "82", 0],
    ["Intereses de vivienda", "38", 8400000, "50", 0, "66", 0, "83", 0],
    ["Otras deducciones imputables (Dependientes, Salud, GMF)", "39", 6460000, "51", 0, "67", 520000, "84", 0],
    ["Total deducciones imputables", "40", 14860000, "52", 0, "68", 520000, "85", 0],
    ["Rentas exentas y/o deduc. imputables (Limitadas 40%/1.340 UVT)", "41", 48720000, "53", 0, "69", 520000, "86", 0],
    ["Renta líquida ordinaria del ejercicio", "—", 0, "54", 0, "70", 12380000, "87", 0],
    ["Pérdida líquida del ejercicio", "—", 0, "55", 0, "71", 0, "88", 0],
    ["Compensaciones por pérdidas", "—", 0, "56", 0, "72", 0, "89", 0],
    ["Renta líquida ordinaria", "42", 84680000, "57", 0, "73", 12380000, "90", 0],
    ["", "", "", "", "", "", "", "", "", ""],

    // 31-33: Depuración Cédula General (91 a 98)
    ["DEPURACIÓN CÉDULA GENERAL Y RENTAS GRAVABLES", "", "", "", "", "", "", "", "", ""],
    ["91. Ren. líquida céd. gen.", 146300000, "92. Ren. ex. y ded. imp. li.", 50480000, "93. R. líq. ord. cédula gen.", 97060000, "94. Comp. pérdidas 2018", 0],
    ["95. Comp. exc. ren. presuntiva", 0, "96. Rentas gravables", 0, "97. R. líq. grav. cédula gen.", 97060000, "98. Renta presuntiva", 0],
    ["", "", "", "", "", "", "", "", "", ""],

    // 35: Encabezado 2 Columnas Inferiores
    ["CÉDULAS DE PENSIONES, DIVIDENDOS Y GANANCIAS OCASIONALES", "", "", "", "LIQUIDACIÓN PRIVADA DEL IMPUESTO", "", "", "", "", ""],
    
    // Pensiones
    ["99. Ingresos brutos pensiones", 0, "", "", "116. Impuesto cédula general, pensiones y dividendos", 14350000, "", "", "", ""],
    ["100. Ingresos no constitutivos de renta (pensiones)", 0, "", "", "117. Impuesto sobre renta presuntiva", 0, "", "", "", ""],
    ["101. Renta líquida pensiones", 0, "", "", "118. Impuesto 2a subcédula año 2017+ (art. 240 E.T.)", 0, "", "", "", ""],
    ["102. Rentas exentas de pensiones", 0, "", "", "119. Impuesto dividendos 2016 y anteriores", 0, "", "", "", ""],
    ["103. Renta líquida gravable de pensiones", 0, "", "", "120. Impuesto dividendos del exterior", 0, "", "", "", ""],
    ["", "", "", "", "121. Total impuesto sobre rentas líquidas gravables", 14350000, "", "", "", ""],

    // Dividendos
    ["104. Dividendos año 2016 y anteriores", 0, "", "", "DESCUENTOS TRIBUTARIOS", "", "", "", "", ""],
    ["105. Ingresos no constitutivos de renta (dividendos 2016)", 0, "", "", "122. Impuestos pagados en el exterior", 0, "123. Donaciones", 0, "", ""],
    ["106. Renta líquida ordinaria 2016 y anteriores", 0, "", "", "124. Dividendos, particip. y otros", 0, "125. Total desctos trib.", 0, "", ""],
    ["107. 1a. Subcédula 2017 y siguientes (num. 3 art. 49 E.T.)", 4500000, "", "", "126. Impuesto neto de renta", 14350000, "", "", "", ""],
    ["108. 2a. Subcédula 2017 y siguientes (par. 2 art. 49 E.T.)", 0, "", "", "127. Impuesto de ganancias ocasionales", 1500000, "", "", "", ""],
    ["109. Dividendos y participaciones del exterior", 0, "", "", "128. Descuento GO impuestos del exterior", 0, "", "", "", ""],
    ["110. Rentas exentas de la casilla 109", 0, "", "", "129. Total impuesto a cargo", 15850000, "", "", "", ""],
    ["111. Renta líquida gravable dividendos (base art. 241)", 4500000, "", "", "130. Anticipo renta año gravable anterior", 2800000, "", "", "", ""],
    ["", "", "", "", "131. Saldo a favor año gravable anterior", 0, "", "", "", ""],

    // Ganancias Ocasionales
    ["GANANCIAS OCASIONALES", "", "", "", "132. Retenciones año gravable a declarar", 8650000, "", "", "", ""],
    ["112. Ingresos por ganancias ocasionales", 35000000, "", "", "133. Anticipo renta año gravable siguiente", 3587500, "", "", "", ""],
    ["113. Costos por ganancias ocasionales", 25000000, "", "", "", "", "", "", "", ""],
    ["114. Ganancias ocasionales no gravadas y exentas", 0, "", "", "", "", "", "", "", ""],
    ["115. Ganancias ocasionales gravables", 10000000, "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],

    // Totales de Liquidación y Datos Informativos
    ["TOTALES Y SALDOS FINALES", "", "", "", "", "", "", "", "", ""],
    ["134. Saldo a pagar por impuesto", 7987500, "135. Sanciones", 0, "136. TOTAL SALDO A PAGAR", 7987500, "137. TOTAL SALDO A FAVOR", 0],
    ["138. Número de dependientes", 1, "139. Adición dep. cas. 92", 3585528, "140. Superó tope 60% art. 336-1", "NO", "141. Aporte voluntario", 0],
    ["", "", "", "", "", "", "", "", "", ""],

    // Firmas y Recaudo Oficial
    ["FIRMAS Y CONTROL DE RECAUDO OFICIAL", "", "", "", "", "", "", "", "", ""],
    ["981. Cód. Representación", "0", "Firma del Declarante:", "GABRIEL JOSÉ GARCÍA MÁRQUEZ", "NIT:", "900.123.456-7", "", ""],
    ["982. Cód. Contador", "0", "994. Con salvedades", "NO", "983. Tarjeta Profesional:", "—", "", ""],
    ["980. PAGO TOTAL $", 7987500, "997. Sello Entidad Recaudadora:", "[ CERTIFICADO ELECTRÓNICO MUISCA ]", "", "", "", ""]
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Formato de columnas para que coincidan con la vista oficial
  ws["!cols"] = [
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

  XLSX.utils.book_append_sheet(wb, ws, "Formulario 210 DIAN");

  // Hoja 2: Listado Plano Prevalidador
  const aoaPrevalidador = [
    ["NumeroCasilla", "NombreConceptoOficial", "ValorNumerico", "FundamentoLegal"],
    [1, "Año gravable", 2024, "Art. 574 E.T."],
    [5, "NIT", 900123456, "RUT"],
    [6, "DV", 7, "RUT"],
    [7, "Primer Apellido", "GARCÍA", "RUT"],
    [8, "Segundo Apellido", "MÁRQUEZ", "RUT"],
    [9, "Primer Nombre", "GABRIEL", "RUT"],
    [10, "Otros Nombres", "JOSÉ", "RUT"],
    [12, "Dirección Seccional", 32, "RUT"],
    [24, "Actividad Económica CIIU", 9002, "RUT"],
    [28, "1% Compras con factura electrónica", 1240000, "Art. 336 inc. 2 E.T."],
    [29, "Total patrimonio bruto", 420000000, "Arts. 261 a 281 E.T."],
    [30, "Deudas", 85000000, "Arts. 283 a 287 E.T."],
    [31, "Total patrimonio líquido", 335000000, "Art. 282 E.T."],
    [32, "Ingresos brutos rentas de trabajo", 145000000, "Art. 103 E.T."],
    [33, "Ingresos no constitutivos de renta (trabajo)", 11600000, "Arts. 55 y 56 E.T."],
    [34, "Renta líquida (trabajo)", 133400000, "Art. 336 num. 1 E.T."],
    [35, "Aportes voluntarios AFC, FVP y AVC (trabajo)", 12000000, "Arts. 126-1 y 126-4 E.T."],
    [36, "Otras rentas exentas (trabajo)", 26500000, "Art. 206 E.T."],
    [37, "Total rentas exentas (trabajo)", 38500000, "Art. 206 E.T."],
    [38, "Intereses de vivienda (trabajo)", 8400000, "Art. 119 E.T."],
    [39, "Otras deducciones imputables (trabajo)", 6460000, "Arts. 387, 115 E.T."],
    [40, "Total deducciones imputables (trabajo)", 14860000, "Art. 387 E.T."],
    [41, "Rentas exentas y deduc. limitadas (trabajo)", 48720000, "Art. 336 E.T."],
    [42, "Renta líquida ordinaria (trabajo)", 84680000, "Art. 336 num. 5 E.T."],
    [58, "Ingresos brutos rentas de capital", 18500000, "Art. 335 E.T."],
    [59, "Ingresos no constitutivos de renta (capital)", 2100000, "Arts. 38 a 44 E.T."],
    [60, "Costos y deducciones procedentes (capital)", 3500000, "Arts. 107 y 336 E.T."],
    [61, "Renta líquida (capital)", 12900000, "Art. 336 E.T."],
    [67, "Otras deducciones capital", 520000, "Arts. 115, 387 E.T."],
    [68, "Total deducciones capital", 520000, "Art. 387 E.T."],
    [69, "Exentas y deducciones limitadas (capital)", 520000, "Art. 336 E.T."],
    [70, "Renta líquida ordinaria del ejercicio (capital)", 12380000, "Art. 336 E.T."],
    [73, "Renta líquida ordinaria (capital)", 12380000, "Art. 336 E.T."],
    [91, "Renta líquida cédula general", 146300000, "Art. 336 E.T."],
    [92, "Rentas exentas y deducciones limitadas", 50480000, "Art. 336 E.T."],
    [93, "Renta líquida ordinaria cédula general", 97060000, "Art. 336 E.T."],
    [97, "Renta líquida gravable cédula general", 97060000, "Art. 336 E.T."],
    [107, "1a. Subcédula 2017 y siguientes", 4500000, "Art. 242 inc. 1 E.T."],
    [111, "Renta líquida gravable dividendos", 4500000, "Art. 242 E.T."],
    [112, "Ingresos por ganancias ocasionales", 35000000, "Arts. 299 a 306 E.T."],
    [113, "Costos por ganancias ocasionales", 25000000, "Arts. 307 a 310 E.T."],
    [115, "Ganancias ocasionales gravables", 10000000, "Art. 313 E.T."],
    [116, "Impuesto cédula general, pensiones y dividendos", 14350000, "Art. 241 E.T."],
    [121, "Total impuesto sobre rentas líquidas gravables", 14350000, "Art. 241 E.T."],
    [126, "Impuesto neto de renta", 14350000, "Art. 259 E.T."],
    [127, "Impuesto de ganancias ocasionales", 1500000, "Arts. 313 a 317 E.T."],
    [129, "Total impuesto a cargo", 15850000, "Art. 259 E.T."],
    [130, "Anticipo liquidado año anterior", 2800000, "Art. 807 E.T."],
    [132, "Retenciones año gravable declarado", 8650000, "Arts. 365 a 404 E.T."],
    [133, "Anticipo año gravable siguiente", 3587500, "Art. 807 E.T."],
    [134, "Saldo a pagar por impuesto", 7987500, "Art. 807 E.T."],
    [136, "TOTAL SALDO A PAGAR", 7987500, "Art. 807 E.T."],
    [138, "Número de dependientes económicos", 1, "Art. 336 E.T."],
    [139, "Adición dependientes casilla 92", 3585528, "Art. 336 inc. 2 E.T."],
    [980, "Pago total", 7987500, "Art. 800 E.T."]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(aoaPrevalidador);
  ws2["!cols"] = [{ wch: 15 }, { wch: 55 }, { wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Prevalidador DIAN");

  const outputPath = path.resolve(process.cwd(), "Formulario_210_2024_Oficial_DIAN.xlsx");
  XLSX.writeFile(wb, outputPath);
  console.log("Archivo generado exitosamente en:", outputPath);
}

buildOfficialDian210Workbook();
