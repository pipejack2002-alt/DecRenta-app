/**
 * genera Formulario_210_2024_DIAN_Visual.xlsx
 * Layout visual idéntico al PDF oficial de la DIAN usando ExcelJS
 * con bordes, colores, fuentes, celdas combinadas
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, "..", "Formulario_210_2024_DIAN_Visual.xlsx");

// ── Colores DIAN ─────────────────────────────────────────────
const C = {
  blue210:    "FF2D6187",
  blueMid:    "FF9DC3E6",
  blueLight:  "FFD6E4F0",
  gray:       "FFD9D9D9",
  disabled:   "FFBFBFBF",
  yellow:     "FFFFF2CC",
  redBg:      "FFFCE4EC",
  greenBg:    "FFE8F5E9",
  white:      "FFFFFFFF",
  black:      "FF000000",
  blueNum:    "FF2D6187",
};

// ── Estilos base ─────────────────────────────────────────────
const thin = { style: "thin", color: { argb: C.black } };
const med  = { style: "medium", color: { argb: C.black } };
const THIN = { top: thin, left: thin, bottom: thin, right: thin };
const MED  = { top: med, left: med, bottom: med, right: med };

function bg(argb) { return { type: "pattern", pattern: "solid", fgColor: { argb } }; }
function arial(sz, bold = false, argb = C.black) {
  return { name: "Arial", size: sz, bold, color: { argb } };
}

// ── Datos de ejemplo (asalariada de las pruebas DIAN) ────────
const D = {
  anio: 2024, noFormulario: "2102024000241029",
  nit: "900.123.456", dv: "7",
  ap1: "GARCÍA", ap2: "MÁRQUEZ", n1: "GABRIEL", n2: "JOSÉ",
  secc: "32", ciiu: "9002", fraccion: "NO",
  // Patrimonio
  c29: 420_000_000, c30: 85_000_000, c31: 335_000_000,
  // Trabajo
  c32: 145_000_000, c33: 11_600_000, c34: 133_400_000,
  c35: 12_000_000, c36: 26_500_000, c37: 38_500_000,
  c38: 8_400_000, c39: 6_460_000, c40: 14_860_000,
  c41: 48_720_000, c42: 84_680_000,
  // Honorarios
  c43:0,c44:0,c45:0,c46:0,c47:0,c48:0,c49:0,c50:0,c51:0,c52:0,c53:0,c54:0,c55:0,c56:0,c57:0,
  // Capital
  c58: 18_500_000, c59: 2_100_000, c60: 3_500_000, c61: 12_900_000,
  c62:0,c63:0,c64:0,c65:0,c66:0,c67: 520_000,c68: 520_000,c69: 520_000,
  c70: 12_380_000,c71:0,c72:0,c73: 12_380_000,
  // No laborales
  c74:0,c75:0,c76:0,c77:0,c78:0,c79:0,c80:0,c81:0,c82:0,c83:0,c84:0,c85:0,c86:0,c87:0,c88:0,c89:0,c90:0,
  // Depuración
  c91:146_300_000,c92:50_480_000,c93:97_060_000,c94:0,c95:0,c96:0,c97:97_060_000,c98:0,
  // Pensiones
  c99:0,c100:0,c101:0,c102:0,c103:0,
  // Dividendos
  c104:0,c105:0,c106:0,c107:4_500_000,c108:0,c109:0,c110:0,c111:4_500_000,
  // GO
  c112:35_000_000,c113:25_000_000,c114:0,c115:10_000_000,
  // Liquidación privada
  c116:14_350_000,c117:0,c118:0,c119:0,c120:0,c121:14_350_000,
  c122:0,c123:0,c124:0,c125:0,
  c126:14_350_000,c127:1_500_000,c128:0,c129:15_850_000,
  c130:2_800_000,c131:0,c132:8_650_000,c133:3_587_500,
  // Totales
  c134:7_987_500,c135:0,c136:7_987_500,c137:0,
  c138:1,c139:3_585_528,c140:false,c141:0,c980:7_987_500,
};

const fmt = v => typeof v === "number" ? v.toLocaleString("es-CO") : (v ?? "");

// ── Helper: celda enriquecida con número de casilla ──────────
function richCas(numCas, label, value, bold = false) {
  return { richText: [
    { font: arial(6, true, C.blueNum), text: `${numCas} ` },
    { font: arial(6, false, "FF444444"), text: `${label}\n` },
    { font: arial(8, bold), text: fmt(value) },
  ]};
}

// ── Helper: aplicar estilo a celda ───────────────────────────
function style(cell, opts = {}) {
  cell.font      = opts.font      ?? arial(8);
  cell.fill      = opts.fill      ?? bg(C.white);
  cell.border    = opts.border    ?? THIN;
  cell.alignment = opts.alignment ?? { vertical: "middle", horizontal: "left", wrapText: true };
  if (opts.numFmt) cell.numFmt = opts.numFmt;
}

// ── Helper: sección header ───────────────────────────────────
function secHeader(cell, text, bgArgb = C.gray) {
  cell.value     = text;
  cell.font      = arial(7, true);
  cell.fill      = bg(bgArgb);
  cell.border    = MED;
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DecRenta App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Formulario 210 DIAN", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // Anchos de columna: A=concepto, B=cas#, C=val, D=cas#, E=val, F=cas#, G=val, H=cas#, I=val, J=cas#, K=liq
  ws.columns = [
    { key:"A", width: 26 },   // Concepto
    { key:"B", width:  5 },   // Cas 1
    { key:"C", width: 13 },   // Renta trabajo
    { key:"D", width:  5 },   // Cas 2
    { key:"E", width: 13 },   // Honorarios
    { key:"F", width:  5 },   // Cas 3
    { key:"G", width: 13 },   // Capital
    { key:"H", width:  5 },   // Cas 4
    { key:"I", width: 13 },   // No laborales
    { key:"J", width:  5 },   // Cas liq
    { key:"K", width: 20 },   // Liquidación
  ];

  let R = 1;

  // ══════════════════════════════════════════════════════
  // 1. ENCABEZADO (3 filas de alto)
  // ══════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R+2}`); // DIAN
  ws.mergeCells(`C${R}:H${R+2}`); // Título
  ws.mergeCells(`I${R}:I${R+2}`); // Espacio DIAN
  ws.mergeCells(`J${R}:K${R+2}`); // 210

  const dian = ws.getCell(`A${R}`);
  dian.value     = "DIAN";
  dian.font      = { name: "Arial Black", size: 22, bold: true };
  dian.alignment = { vertical: "middle", horizontal: "left" };
  dian.border    = MED;

  const titulo = ws.getCell(`C${R}`);
  titulo.value     = "Declaración de renta y complementario personas naturales\ny asimiladas residentes y sucesiones ilíquidas de causantes residentes";
  titulo.font      = arial(9, true);
  titulo.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  titulo.border    = MED;

  const espacio = ws.getCell(`I${R}`);
  espacio.fill   = bg(C.blueLight);
  espacio.border = MED;

  const box210 = ws.getCell(`J${R}`);
  box210.value     = "210";
  box210.font      = { name: "Arial Black", size: 32, bold: true, color: { argb: "FFFFFFFF" } };
  box210.fill      = bg(C.blue210);
  box210.alignment = { vertical: "middle", horizontal: "center" };
  box210.border    = MED;

  ws.getRow(R).height = 14;
  ws.getRow(R+1).height = 14;
  ws.getRow(R+2).height = 14;
  R += 3;

  // ══════════════════════════════════════════════════════
  // 2. FILA AÑO + ESPACIO DIAN + N° FORMULARIO
  // ══════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:I${R}`);
  ws.mergeCells(`J${R}:K${R}`);
  ws.getRow(R).height = 16;

  const cAnio = ws.getCell(`A${R}`);
  cAnio.value     = { richText: [{ font: arial(6, true), text: "1. Año\n" }, { font: arial(9, true), text: String(D.anio) }] };
  cAnio.alignment = { vertical: "top", wrapText: true };
  cAnio.border    = THIN;

  const cEsp = ws.getCell(`C${R}`);
  cEsp.value     = "Espacio reservado para la DIAN";
  cEsp.font      = { name: "Arial", size: 7, color: { argb: C.blueNum } };
  cEsp.alignment = { vertical: "middle" };
  cEsp.border    = THIN;

  const cForm = ws.getCell(`J${R}`);
  cForm.value     = { richText: [{ font: arial(6, true), text: "4. Número de formulario\n" }, { font: arial(8), text: D.noFormulario }] };
  cForm.alignment = { vertical: "top", wrapText: true };
  cForm.border    = THIN;
  R++;

  // Espacio en blanco del reservado DIAN
  ws.mergeCells(`A${R}:K${R}`);
  ws.getCell(`A${R}`).border = THIN;
  ws.getRow(R).height = 20;
  R++;

  // ══════════════════════════════════════════════════════
  // 3. DATOS DEL DECLARANTE — Fila 1: NIT, apellidos, nombre, seccional
  // ══════════════════════════════════════════════════════
  // Pestaña lateral "Datos del declarante" (vertical) — 2 filas
  ws.mergeCells(`A${R}:A${R+1}`);
  const dDec = ws.getCell(`A${R}`);
  dDec.value     = "Datos del declarante";
  dDec.font      = arial(6, true);
  dDec.fill      = bg(C.blueLight);
  dDec.border    = MED;
  dDec.alignment = { vertical: "middle", horizontal: "center", textRotation: 90, wrapText: true };

  ws.getRow(R).height = 22;
  // B: NIT
  const cNIT = ws.getCell(`B${R}`);
  cNIT.value = { richText: [{ font: arial(5, true), text: "5. Número de Identificación Tributaria (NIT)\n" }, { font: arial(8), text: D.nit }] };
  cNIT.alignment = { vertical: "top", wrapText: true }; cNIT.border = THIN;
  // C: DV
  const cDV = ws.getCell(`C${R}`);
  cDV.value = { richText: [{ font: arial(5, true), text: "6.DV\n" }, { font: arial(8), text: D.dv }] };
  cDV.alignment = { vertical: "top", wrapText: true }; cDV.border = THIN;
  // D: Primer apellido
  const cAp1 = ws.getCell(`D${R}`);
  cAp1.value = { richText: [{ font: arial(5, true), text: "7. Primer apellido\n" }, { font: arial(8), text: D.ap1 }] };
  cAp1.alignment = { vertical: "top", wrapText: true }; cAp1.border = THIN;
  // E: Segundo apellido
  const cAp2 = ws.getCell(`E${R}`);
  cAp2.value = { richText: [{ font: arial(5, true), text: "8. Segundo apellido\n" }, { font: arial(8), text: D.ap2 }] };
  cAp2.alignment = { vertical: "top", wrapText: true }; cAp2.border = THIN;
  // F: Primer nombre
  const cN1 = ws.getCell(`F${R}`);
  cN1.value = { richText: [{ font: arial(5, true), text: "9. Primer nombre\n" }, { font: arial(8), text: D.n1 }] };
  cN1.alignment = { vertical: "top", wrapText: true }; cN1.border = THIN;
  // G: Otros nombres
  const cN2 = ws.getCell(`G${R}`);
  cN2.value = { richText: [{ font: arial(5, true), text: "10. Otros nombres\n" }, { font: arial(8), text: D.n2 }] };
  cN2.alignment = { vertical: "top", wrapText: true }; cN2.border = THIN;
  // H: Vacío
  ws.getCell(`H${R}`).border = THIN;
  // I-J-K: Cód. Dirección seccional
  ws.mergeCells(`I${R}:K${R}`);
  const cSecc = ws.getCell(`I${R}`);
  cSecc.value = { richText: [{ font: arial(5, true), text: "12.Cod. Dirección seccional\n" }, { font: arial(8), text: D.secc }] };
  cSecc.alignment = { vertical: "top", wrapText: true }; cSecc.border = THIN;
  R++;

  // Fila 2: CIIU, Corrección, Cod, No anterior, Fracción, 28.
  ws.getRow(R).height = 18;
  // B-C: CIIU
  ws.mergeCells(`B${R}:C${R}`);
  const cCIIU = ws.getCell(`B${R}`);
  cCIIU.value = { richText: [{ font: arial(5, true), text: "24. Act. económica principal\n" }, { font: arial(8), text: D.ciiu }] };
  cCIIU.alignment = { vertical: "top", wrapText: true }; cCIIU.border = THIN;
  // D: Corrección
  const cCorr = ws.getCell(`D${R}`);
  cCorr.value = { richText: [{ font: arial(5, true), text: "Si es una corrección indique:\n" }, { font: arial(7), text: "NO" }] };
  cCorr.alignment = { vertical: "top", wrapText: true }; cCorr.border = THIN;
  // E: Cod
  const cCod = ws.getCell(`E${R}`);
  cCod.value = { richText: [{ font: arial(5, true), text: "25. Cód.\n" }, { font: arial(8), text: "" }] };
  cCod.alignment = { vertical: "top", wrapText: true }; cCod.border = THIN;
  // F: No anterior
  const cNoAnt = ws.getCell(`F${R}`);
  cNoAnt.value = { richText: [{ font: arial(5, true), text: "26. No. Formulario anterior\n" }, { font: arial(8), text: "" }] };
  cNoAnt.alignment = { vertical: "top", wrapText: true }; cNoAnt.border = THIN;
  // G-H: Fracción año gravable siguiente
  ws.mergeCells(`G${R}:H${R}`);
  const cFrac = ws.getCell(`G${R}`);
  cFrac.value = { richText: [{ font: arial(5, true), text: "27. Fracción año gravable siguiente\n" }, { font: arial(8), text: D.fraccion }] };
  cFrac.alignment = { vertical: "top", wrapText: true }; cFrac.border = THIN;
  // I-K: Uno por ciento
  ws.mergeCells(`I${R}:K${R}`);
  const c28 = ws.getCell(`I${R}`);
  c28.value = { richText: [{ font: arial(5, true), text: "28. Uno por ciento (1%) de compras con factura electrónica\n" }, { font: arial(8), text: "" }] };
  c28.alignment = { vertical: "top", wrapText: true }; c28.border = THIN;
  R++;

  // ══════════════════════════════════════════════════════
  // 4. PATRIMONIO
  // ══════════════════════════════════════════════════════
  ws.getRow(R).height = 18;
  // A: Título
  const pLabel = ws.getCell(`A${R}`);
  secHeader(pLabel, "Patrimonio", C.blueLight);
  // B-C: Patrimonio bruto 29
  ws.mergeCells(`B${R}:C${R}`);
  const p29 = ws.getCell(`B${R}`);
  p29.value = richCas(29, "Total patrimonio bruto", D.c29, true);
  p29.fill = bg(C.blueLight); p29.border = THIN;
  p29.alignment = { vertical: "top", wrapText: true };
  // D-E: Deudas 30
  ws.mergeCells(`D${R}:E${R}`);
  const p30 = ws.getCell(`D${R}`);
  p30.value = { richText: [{ font: arial(5, true), text: "Deudas  " }, { font: arial(6, true, C.blueNum), text: "30\n" }, { font: arial(8, true), text: fmt(D.c30) }] };
  p30.fill = bg(C.blueLight); p30.border = THIN;
  p30.alignment = { vertical: "top", wrapText: true };
  // F-K: Patrimonio líquido 31
  ws.mergeCells(`F${R}:K${R}`);
  const p31 = ws.getCell(`F${R}`);
  p31.value = { richText: [{ font: arial(5, true), text: "Total patrimonio líquido  " }, { font: arial(6, true, C.blueNum), text: "31\n" }, { font: arial(9, true), text: fmt(D.c31) }] };
  p31.fill = bg(C.blueLight); p31.border = THIN;
  p31.alignment = { vertical: "top", horizontal: "right", wrapText: true };
  R++;

  // ══════════════════════════════════════════════════════
  // 5. ENCABEZADO CÉDULA GENERAL
  // ══════════════════════════════════════════════════════
  ws.getRow(R).height = 28;
  const chA = ws.getCell(`A${R}`); secHeader(chA, "Conceptos/rentas", C.blueLight);
  ws.mergeCells(`B${R}:C${R}`);
  secHeader(ws.getCell(`B${R}`), "Rentas de trabajo", C.blueMid);
  ws.mergeCells(`D${R}:E${R}`);
  secHeader(ws.getCell(`D${R}`), "Rentas de trabajo que no provengan de\nuna relación laboral o legal y reglamentaria", C.blueMid);
  ws.mergeCells(`F${R}:G${R}`);
  secHeader(ws.getCell(`F${R}`), "Rentas de capital", C.blueMid);
  ws.mergeCells(`H${R}:I${R}`);
  secHeader(ws.getCell(`H${R}`), "Rentas no laborales", C.blueMid);
  ws.mergeCells(`J${R}:K${R}`);
  secHeader(ws.getCell(`J${R}`), "Liquidación privada del impuesto", C.gray);
  R++;

  // ══════════════════════════════════════════════════════
  // 6. FILAS DE CÉDULA GENERAL + LIQUIDACIÓN PRIVADA (paralelas)
  // ══════════════════════════════════════════════════════
  // [label, c_trab, v_trab, c_hon, v_hon, c_cap, v_cap, c_nl, v_nl]
  // null en c_ = celda gris deshabilitada
  const CEDULA = [
    ["Ingresos brutos",                             32,D.c32, 43,D.c43, 58,D.c58, 74,D.c74],
    ["Devoluciones, rebajas y descuentos",         null,null,null,null,null,null, 75,D.c75],
    ["Ingresos no constitutivos de renta",          33,D.c33, 44,D.c44, 59,D.c59, 76,D.c76],
    ["Costos y deducciones procedentes",           null,null, 45,D.c45, 60,D.c60, 77,D.c77],
    ["Renta líquida",                               34,D.c34, 46,D.c46, 61,D.c61, 78,D.c78],
    ["Rentas líquidas pasivas - ECE",              null,null,null,null, 62,D.c62, 79,D.c79],
    ["Aportes voluntarios AFC, FVP y AVC",          35,D.c35, 47,D.c47, 63,D.c63, 80,D.c80],
    ["Otras rentas exentas (incluye 25% art. 206)", 36,D.c36, 48,D.c48, 64,D.c64, 81,D.c81],
    ["Total rentas exentas",                        37,D.c37, 49,D.c49, 65,D.c65, 82,D.c82],
    ["Intereses de vivienda",                       38,D.c38, 50,D.c50, 66,D.c66, 83,D.c83],
    ["Otras deducciones imputables",                39,D.c39, 51,D.c51, 67,D.c67, 84,D.c84],
    ["Total deducciones imputables",                40,D.c40, 52,D.c52, 68,D.c68, 85,D.c85],
    ["Rentas exentas y/o ded. limitadas (40%/1.340 UVT)",41,D.c41,53,D.c53,69,D.c69,86,D.c86],
    ["Renta líquida ordinaria del ejercicio",      null,null, 54,D.c54, 70,D.c70, 87,D.c87],
    ["Pérdida líquida del ejercicio",              null,null, 55,D.c55, 71,D.c71, 88,D.c88],
    ["Compensaciones por pérdidas",                null,null, 56,D.c56, 72,D.c72, 89,D.c89],
    ["Renta líquida ordinaria",                     42,D.c42, 57,D.c57, 73,D.c73, 90,D.c90],
  ];

  // Liquidación privada: [cas|null, label, valor, bold?, esSeccion?]
  const LIQ = [
    [116,"Impuesto cédula gral., pensiones y dividendos",D.c116],
    [117,"Impuesto sobre renta presuntiva",D.c117],
    [118,"Impuesto 2a. subcédula 2017+ (art. 240)",D.c118],
    [119,"Impuesto dividendos 2016 y anteriores",D.c119],
    [120,"Impuesto dividendos del exterior",D.c120],
    [121,"Total impuesto s/rentas líquidas gravables",D.c121,true],
    [null,"DESCUENTOS TRIBUTARIOS",null,false,true],
    [122,"Impuestos pagados en el exterior",D.c122],
    [123,"Donaciones art. 257",D.c123],
    [124,"Dividendos, particip. y otros",D.c124],
    [125,"Total descuentos tributarios",D.c125,true],
    [126,"Impuesto neto de renta",D.c126,true],
    [127,"Impuesto de ganancias ocasionales",D.c127],
    [128,"Descuento GO imp. del exterior",D.c128],
    [129,"Total impuesto a cargo",D.c129,true],
    [130,"Anticipo renta año gravable anterior",D.c130],
    [131,"Saldo a favor año gravable anterior",D.c131],
  ];

  const maxCG = Math.max(CEDULA.length, LIQ.length);
  for (let i = 0; i < maxCG; i++) {
    ws.getRow(R).height = 16;
    const cr = CEDULA[i];
    const lr = LIQ[i];

    if (cr) {
      // A: concepto
      const ca = ws.getCell(`A${R}`);
      ca.value = cr[0]; ca.font = arial(7); ca.border = THIN;
      ca.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

      // Pares B-C, D-E, F-G, H-I
      const cols = [["B","C",cr[1],cr[2]], ["D","E",cr[3],cr[4]], ["F","G",cr[5],cr[6]], ["H","I",cr[7],cr[8]]];
      for (const [colN, colV, cas, val] of cols) {
        const cN = ws.getCell(`${colN}${R}`);
        const cV = ws.getCell(`${colV}${R}`);
        if (cas === null) {
          cN.fill = bg(C.disabled); cN.border = THIN;
          cV.fill = bg(C.disabled); cV.border = THIN;
        } else {
          cN.value = String(cas);
          cN.font = arial(6, true, C.blueNum);
          cN.alignment = { vertical: "top", horizontal: "left" };
          cN.border = THIN;
          cV.value = val ?? 0;
          cV.font = arial(8);
          cV.numFmt = "#,##0";
          cV.alignment = { vertical: "middle", horizontal: "right" };
          cV.border = THIN;
        }
      }
    } else {
      // Fila vacía en cédula
      for (const col of ["A","B","C","D","E","F","G","H","I"]) {
        ws.getCell(`${col}${R}`).border = THIN;
      }
    }

    // J-K: Liquidación privada
    ws.mergeCells(`J${R}:K${R}`);
    const jk = ws.getCell(`J${R}`);
    if (lr) {
      if (lr[4]) {
        secHeader(jk, lr[1], C.gray);
      } else if (lr[0] !== null) {
        jk.value = richCas(lr[0], lr[1], lr[2], lr[3]);
        jk.alignment = { vertical: "top", wrapText: true };
        jk.border = THIN;
        if (lr[3]) jk.fill = bg(C.yellow);
      } else {
        jk.border = THIN;
      }
    } else {
      jk.border = THIN;
    }
    R++;
  }

  // ══════════════════════════════════════════════════════
  // 7. DEPURACIÓN CÉDULA GENERAL (91-98)
  // ══════════════════════════════════════════════════════
  // Fila 91,92,93,94 | Liq: Retenciones 132
  ws.getRow(R).height = 18;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);
  ws.mergeCells(`I${R}:I${R}`);
  ws.mergeCells(`J${R}:K${R}`);

  for (const [col, cas, val] of [["A",91,D.c91],["C",92,D.c92],["E",93,D.c93],["G",94,D.c94]]) {
    const c = ws.getCell(`${col}${R}`);
    c.value = richCas(cas, [{91:"R. líq. cédula gral.",92:"R. exentas y ded. lim.",93:"R. líq. ord. céd. gral.",94:"Comp. pérd. 2017 y ant."}[cas]], val, cas===93||cas===97);
    c.alignment = { vertical: "top", wrapText: true }; c.border = THIN;
    c.fill = bg(cas === 93 ? C.yellow : C.blueLight);
  }
  ws.getCell(`I${R}`).border = THIN;
  const jk132 = ws.getCell(`J${R}`);
  jk132.value = richCas(132, "Retenciones año gravable a declarar", D.c132);
  jk132.alignment = { vertical: "top", wrapText: true }; jk132.border = THIN;
  R++;

  // Fila 95,96,97,98 | Liq: Anticipo 133
  ws.getRow(R).height = 18;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);
  ws.mergeCells(`J${R}:K${R}`);

  for (const [col, cas, val] of [["A",95,D.c95],["C",96,D.c96],["E",97,D.c97],["G",98,D.c98]]) {
    const c = ws.getCell(`${col}${R}`);
    c.value = richCas(cas, [{95:"Comp. exc. ren. presuntiva",96:"Rentas gravables",97:"R. líq. grav. céd. gral.",98:"Renta presuntiva"}[cas]], val, cas===97);
    c.alignment = { vertical: "top", wrapText: true }; c.border = THIN;
    c.fill = bg(cas === 97 ? C.yellow : C.blueLight);
  }
  ws.getCell(`I${R}`).border = THIN;
  const jk133 = ws.getCell(`J${R}`);
  jk133.value = richCas(133, "Anticipo renta año gravable siguiente", D.c133);
  jk133.alignment = { vertical: "top", wrapText: true }; jk133.border = THIN;
  R++;

  // ══════════════════════════════════════════════════════
  // 8. SECCIÓN INFERIOR: Pensiones/Dividendos/GO (A-I) + Totales finales (J-K)
  // ══════════════════════════════════════════════════════
  // Pensiones
  ws.getRow(R).height = 12;
  ws.mergeCells(`A${R}:I${R}`);
  secHeader(ws.getCell(`A${R}`), "CÉDULA DE PENSIONES", C.blueLight);
  ws.mergeCells(`J${R}:K${R}`);
  secHeader(ws.getCell(`J${R}`), "TOTALES Y SALDOS FINALES", C.gray);
  R++;

  const PENS = [[99,D.c99],[100,D.c100],[101,D.c101],[102,D.c102],[103,D.c103,true]];
  const PENS_LABELS = {99:"Ingresos brutos",100:"INCRNGO pensiones",101:"Renta líquida",102:"Rentas exentas",103:"Renta líq. gravable"};
  // Totales finales alineados con pensiones/dividendos/go
  const TOTALES = [
    [134,"Saldo a pagar por impuesto",D.c134],
    [135,"Sanciones",D.c135],
    [136,"TOTAL SALDO A PAGAR",D.c136,true,"red"],
    [137,"TOTAL SALDO A FAVOR",D.c137,true,"green"],
    [138,"No. dependientes",D.c138],
    [139,"Adición dep. cas. 92",D.c139],
    [140,"Superó tope 60% art. 336-1",D.c140 ? "X" : "NO"],
    [141,"Aporte voluntario",D.c141],
    [null,"FIRMAS Y RECAUDO",null,false,true],
    [980,"PAGO TOTAL $",D.c980,true],
    [981,"Cód. Rep. / Firma del Declarante","GABRIEL JOSÉ GARCÍA"],
    [982,"Cód. Contador","0"],
    [983,"Tarjeta Profesional","—"],
    [994,"Con salvedades","NO"],
    [997,"Sello entidad recaudadora","[MUISCA]"],
    [996,"No. interno DIAN / Adhesivo",""],
  ];

  // Dividendos rows
  const DIV_ROWS = [
    [null,"CÉDULA DE DIVIDENDOS",null,false,true],
    [104,D.c104],[105,D.c105],[106,D.c106],[107,D.c107],[108,D.c108],[109,D.c109],[110,D.c110],[111,D.c111,true],
  ];
  const DIV_LABELS = {104:"Dividendos año 2016 y ant.",105:"INCRNGO dividendos 2016",106:"Renta líq. ord. 2016 y ant.",107:"1a. Subcédula 2017+ (art. 49 num 3)",108:"2a. Subcédula 2017+ (par 2 art 49)",109:"Dividendos del exterior",110:"Rentas exentas cas. 109",111:"Renta líq. gravable dividendos"};
  const GO_ROWS = [
    [null,"GANANCIAS OCASIONALES",null,false,true],
    [112,D.c112],[113,D.c113],[114,D.c114],[115,D.c115,true],
  ];
  const GO_LABELS = {112:"Ingresos por GO",113:"Costos por GO",114:"GO no gravadas y exentas",115:"Ganancias ocasionales gravables"};

  const ALL_LEFT = [
    ...PENS.map(r=>[...r]),
    ...DIV_ROWS,
    ...GO_ROWS,
  ];

  const maxB = Math.max(ALL_LEFT.length, TOTALES.length);
  for (let i = 0; i < maxB; i++) {
    ws.getRow(R).height = 16;
    const lr = ALL_LEFT[i];
    const tr = TOTALES[i];

    // Izquierda A-I
    if (lr && lr[4] === true) {
      // Encabezado de sección → merge completo A:I
      ws.mergeCells(`A${R}:I${R}`);
      secHeader(ws.getCell(`A${R}`), lr[1], C.blueLight);
    } else {
      // Fila de datos → A:B para etiqueta, C:I para valor
      ws.mergeCells(`A${R}:B${R}`);
      ws.mergeCells(`C${R}:I${R}`);
      if (lr && lr[0] !== null) {
        const lKey = lr[0];
        const lLabel = PENS_LABELS[lKey] || DIV_LABELS[lKey] || GO_LABELS[lKey] || `Casilla ${lKey}`;
        const lVal = lr[1];
        const lBold = lr[2] === true;
        const la = ws.getCell(`A${R}`);
        la.value = { richText: [{ font: arial(6, true, C.blueNum), text: `${lKey} ` }, { font: arial(6), text: lLabel }] };
        la.alignment = { vertical: "middle", wrapText: true }; la.border = THIN;
        if (lBold) la.fill = bg(C.yellow);
        const lv = ws.getCell(`C${R}`);
        lv.value = typeof lVal === "number" ? lVal : 0;
        lv.font = arial(8, lBold); lv.numFmt = "#,##0";
        lv.alignment = { vertical: "middle", horizontal: "right" }; lv.border = THIN;
        if (lBold) lv.fill = bg(C.yellow);
      } else {
        ws.getCell(`A${R}`).border = THIN;
        ws.getCell(`C${R}`).border = THIN;
      }
    }

    // Derecha J-K
    ws.mergeCells(`J${R}:K${R}`);
    const jk = ws.getCell(`J${R}`);
    if (tr) {
      if (tr[4] === true && tr[0] === null) {
        secHeader(jk, tr[1], C.gray);
      } else if (tr[0] !== null) {
        const valStr = tr[2] !== null && tr[2] !== undefined && tr[2] !== "" ? (typeof tr[2] === "number" ? tr[2].toLocaleString("es-CO") : String(tr[2])) : "";
        jk.value = { richText: [
          { font: arial(6, true, C.blueNum), text: `${tr[0]} ` },
          { font: arial(6), text: `${tr[1]}\n` },
          { font: arial(8, tr[3] === true), text: valStr },
        ]};
        jk.alignment = { vertical: "top", wrapText: true }; jk.border = THIN;
        if (tr[4] === "red") jk.fill = bg(C.redBg);
        else if (tr[4] === "green") jk.fill = bg(C.greenBg);
        else if (tr[3] === true) jk.fill = bg(C.yellow);
      } else {
        jk.border = THIN;
      }
    } else {
      jk.border = THIN;
    }
    R++;
  }

  await wb.xlsx.writeFile(OUTPUT);
  console.log(`✅ Archivo generado: ${OUTPUT}`);
  console.log(`   Total de filas: ${R}`);
}

build().catch(e => { console.error("❌", e.message, e.stack); process.exit(1); });
