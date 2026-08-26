/**
 * Formulario_210_2024_DIAN_Visual.xlsx
 * ======================================
 * Réplica exacta 1:1 de la vista visual del Formulario 210 de la aplicación web (official-dian-210.tsx)
 * Diseñado con ExcelJS con colores oficiales, pestañas verticales, divisiones multicolumna,
 * bordes precisos, sangrías y formato idéntico a https://decrenta.tributoapp.me/formulario.
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "Formulario_210_2024_DIAN_Visual.xlsx");

// ────────────────────────────────────────────────────────────
// PALETA EXACTA DE LA APP WEB (official-dian-210.tsx)
// ────────────────────────────────────────────────────────────
const CLR = {
  blue210:      "FF2D6187",  // Azul oficial caja "210"
  blueHdr:      "FFDBE7F0",  // bg-[#dbe7f0] - Encabezados principales / Patrimonio / Renta Líquida Ordinaria
  blueSoft:     "FFEEF4F8",  // bg-[#eef4f8] - Renta Líquida / Depuración
  blueAlt:      "FFF9FBFD",  // bg-[#f9fbfd] - Filas normales claras
  blueMuted:    "FFF0F5F9",  // bg-[#f0f5f9] - Totales intermedios (Total rentas exentas / deducciones)
  blueLimit:    "FFE9F0F6",  // bg-[#e9f0f6] - Rentas exentas limitadas
  blueLight:    "FFF4F7F9",  // bg-[#f4f7f9] - Actividad CIIU / Renta líquida pensiones / Impuesto neto
  blueTotal:    "FFEAF1F7",  // bg-[#eaf1f7] - Total patrimonio líquido / Total impuesto a cargo / Pago total
  tabGray:      "FFE5E7EB",  // bg-gray-200  - Pestañas laterales verticales
  disabledGray: "FFF4F4F4",  // bg-gray-100  - Celdas deshabilitadas (no aplican)
  borderGray:   "FFD1D5DB",  // border-gray-300
  redPayBg:     "FFFBEAE8",  // bg-[#fbeae8] - Total saldo a pagar (fondo rosado/rojo)
  redPayText:   "FF7F1D1D",  // text-red-900 / red-950
  greenFavBg:   "FFEAF4EE",  // bg-[#eaf4ee] - Total saldo a favor (fondo verde suave)
  greenFavText: "FF00573F",  // text-[#00573F]
  numBlue:      "FF2D6187",  // Número de casilla en azul institucional
  numMuted:     "FF6B7280",  // Número de casilla gris suave
  white:        "FFFFFFFF",
  black:        "FF000000",
};

// ────────────────────────────────────────────────────────────
// HELPERS DE ESTILO
// ────────────────────────────────────────────────────────────
const bdr = (style, argb = CLR.black) => ({ style, color: { argb } });
const T = bdr("thin", CLR.black);
const M = bdr("medium", CLR.black);
const TK = bdr("thick", CLR.black);
const TG = bdr("thin", CLR.borderGray);

const BDR_BOX = { top: T, left: T, bottom: T, right: T };
const BDR_OUTER = { top: TK, left: TK, bottom: TK, right: TK };

function borderCustom(top, left, bottom, right) {
  return { top, left, bottom, right };
}

const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const font = (sz, bold = false, argb = CLR.black, name = "Arial", italic = false) => ({
  name,
  size: sz,
  bold,
  italic,
  color: { argb },
});

const aln = (h = "left", v = "middle", wrap = true) => ({
  horizontal: h,
  vertical: v,
  wrapText: wrap,
});

/** Formatea números al estilo colombiano (con punto de miles) */
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    if (v === 0) return "0";
    return v.toLocaleString("es-CO");
  }
  return String(v);
};

/** Celda de Casilla DIAN con número pequeño en esquina superior izquierda y valor a la derecha */
function renderCasillaCell(ws, addr, casNum, val, opts = {}) {
  const c = ws.getCell(addr);
  const valStr = fmt(val);
  const numStr = casNum !== null && casNum !== undefined ? String(casNum) : "";

  c.value = {
    richText: [
      numStr
        ? { font: font(5.5, true, opts.numColor ?? CLR.numMuted), text: `${numStr} ` }
        : { font: font(5.5), text: "" },
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
  c.fill = fill(opts.bg ?? CLR.white);
  c.border = opts.border ?? BDR_BOX;
  c.alignment = aln(opts.h ?? "right", opts.v ?? "middle", true);
  return c;
}

/** Pestaña de texto vertical rotada a 90 grados */
function renderVerticalTab(ws, mergeRange, text, bg = CLR.tabGray, textColor = CLR.black, sz = 7) {
  ws.mergeCells(mergeRange);
  const startCell = mergeRange.split(":")[0];
  const c = ws.getCell(startCell);
  c.value = text;
  c.font = font(sz, true, textColor);
  c.fill = fill(bg);
  c.border = BDR_BOX;
  c.alignment = { vertical: "middle", horizontal: "center", textRotation: 90, wrapText: true };
  return c;
}

// ────────────────────────────────────────────────────────────
// DATOS REALES DE EJEMPLO DE LA APLICACIÓN
// ────────────────────────────────────────────────────────────
const D = {
  year: 2025,
  noForm: "210202500041029",
  nit: "900.123.456",
  dv: "7",
  primerApellido: "GARCÍA",
  segundoApellido: "MÁRQUEZ",
  primerNombre: "GABRIEL",
  otrosNombres: "JOSÉ",
  dirSeccional: "32",
  actividadCiiu: "0010",
  esCorreccion: false,
  formAnterior: "",
  // Patrimonio
  c28: 0,
  c29: 420_000_000,
  c30: 85_000_000,
  c31: 335_000_000,
  // Trabajo
  c32: 145_000_000,
  c33: 11_600_000,
  c34: 133_400_000,
  c35: 12_000_000,
  c36: 26_500_000,
  c37: 38_500_000,
  c38: 8_400_000,
  c39: 6_460_000,
  c40: 14_860_000,
  c41: 48_720_000,
  c42: 84_680_000,
  // Honorarios
  c43: 0,
  c44: 0,
  c45: 0,
  c46: 0,
  c47: 0,
  c48: 0,
  c49: 0,
  c50: 0,
  c51: 0,
  c52: 0,
  c53: 0,
  c54: 0,
  c55: 0,
  c56: 0,
  c57: 0,
  // Capital
  c58: 18_500_000,
  c59: 2_100_000,
  c60: 3_500_000,
  c61: 12_900_000,
  c62: 0,
  c63: 0,
  c64: 0,
  c65: 0,
  c66: 0,
  c67: 520_000,
  c68: 520_000,
  c69: 520_000,
  c70: 12_380_000,
  c71: 0,
  c72: 0,
  c73: 12_380_000,
  // No Laborales
  c74: 0,
  c75: 0,
  c76: 0,
  c77: 0,
  c78: 0,
  c79: 0,
  c80: 0,
  c81: 0,
  c82: 0,
  c83: 0,
  c84: 0,
  c85: 0,
  c86: 0,
  c87: 0,
  c88: 0,
  c89: 0,
  c90: 0,
  // Depuración
  c91: 146_300_000,
  c92: 50_480_000,
  c93: 97_060_000,
  c94: 0,
  c95: 0,
  c96: 0,
  c97: 97_060_000,
  c98: 0,
  // Pensiones
  c99: 0,
  c100: 0,
  c101: 0,
  c102: 0,
  c103: 0,
  // Dividendos
  c104: 0,
  c105: 0,
  c106: 0,
  c107: 4_500_000,
  c108: 0,
  c109: 0,
  c110: 0,
  c111: 4_500_000,
  // GO
  c112: 35_000_000,
  c113: 25_000_000,
  c114: 0,
  c115: 10_000_000,
  // Liquidación privada
  c116: 14_350_000,
  c117: 0,
  c118: 0,
  c119: 0,
  c120: 0,
  c121: 14_350_000,
  c122: 0,
  c123: 0,
  c124: 0,
  c125: 0,
  c126: 14_350_000,
  c127: 1_500_000,
  c128: 0,
  c129: 15_850_000,
  c130: 2_800_000,
  c131: 0,
  c132: 8_650_000,
  c133: 3_587_500,
  // Totales
  c134: 7_987_500,
  c135: 0,
  c136: 7_987_500,
  c137: 0,
  c138: 1,
  c139: 3_585_528,
  c140: false,
  c141: 0,
  c980: 7_987_500,
};

// ────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DEL WORKBOOK
// ────────────────────────────────────────────────────────────
async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TributoApp — Formulario 210 DIAN AG 2025";
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

  // ── COLUMNAS EXACTAS (GRID DE 10 COLUMNAS PRINCIPALES) ──────
  // Col A: Pestaña vertical izquierda (3.5)
  // Col B: Conceptos/rentas (32)
  // Col C: Rentas de trabajo (15)
  // Col D: Rentas de trabajo sin relación (16)
  // Col E: Rentas de capital (15)
  // Col F: Rentas no laborales (15)
  // Col G: Pestaña vertical derecha para Liquidación (3.5)
  // Col H: Concepto Liquidación privada (32)
  // Col I: Valor Descuento 1 / Valor Liq (15)
  // Col J: Valor Descuento 2 / Complemento Liq (15)
  ws.columns = [
    { key: "A", width: 3.5 }, // Pestaña vertical izquierda
    { key: "B", width: 32 },  // Conceptos cédula / Pensiones / Div / GO
    { key: "C", width: 15 },  // Rentas de trabajo
    { key: "D", width: 16 },  // Rentas de trabajo sin relación laboral
    { key: "E", width: 15 },  // Rentas de capital
    { key: "F", width: 15 },  // Rentas no laborales
    { key: "G", width: 3.5 }, // Pestaña vertical derecha (Liquidación)
    { key: "H", width: 32 },  // Conceptos Liquidación privada
    { key: "I", width: 15 },  // Valor Liq / Descuentos Col 1
    { key: "J", width: 15 },  // Descuentos Col 2
  ];

  let R = 1;

  // ════════════════════════════════════════════════════════════
  // 1. ENCABEZADO OFICIAL DIAN (Idéntico a official-dian-210.tsx)
  // ════════════════════════════════════════════════════════════
  // A-C: Logo DIAN y Casilla 1 Año
  // D-H: Título Central y Casilla 4 Número de formulario
  // I-J: Caja Azul Oficial "210"
  ws.mergeCells(`A${R}:C${R+2}`);
  ws.mergeCells(`D${R}:H${R+2}`);
  ws.mergeCells(`I${R}:J${R+2}`);

  // Logo DIAN y Año
  const cDian = ws.getCell(`A${R}`);
  cDian.value = {
    richText: [
      { font: font(20, true, CLR.black, "Arial Black"), text: "DIAN\n" },
      { font: font(7, true, CLR.black), text: "1. Año: " },
      { font: font(10, true, CLR.black, "Courier New"), text: `${D.year}\n` },
      { font: font(6, false, CLR.numMuted), text: "Espacio reservado para la DIAN" },
    ],
  };
  cDian.fill = fill(CLR.white);
  cDian.border = borderCustom(TK, TK, TK, M);
  cDian.alignment = aln("left", "middle", true);

  // Título y Casilla 4
  const cTitulo = ws.getCell(`D${R}`);
  cTitulo.value = {
    richText: [
      {
        font: font(8.5, true, CLR.black),
        text: "DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES Y ASIMILADAS RESIDENTES\nY SUCESIONES ILÍQUIDAS DE CAUSANTES RESIDENTES\n\n",
      },
      { font: font(7.5, true, CLR.black), text: "4. Número de formulario: " },
      { font: font(8, true, CLR.black, "Courier New"), text: `${D.noForm}` },
    ],
  };
  cTitulo.fill = fill(CLR.white);
  cTitulo.border = borderCustom(TK, M, TK, M);
  cTitulo.alignment = aln("center", "middle", true);

  // Caja Azul Oficial "210"
  const c210 = ws.getCell(`I${R}`);
  c210.value = "210";
  c210.font = font(36, true, CLR.white, "Arial Black");
  c210.fill = fill(CLR.blue210);
  c210.border = borderCustom(TK, M, TK, TK);
  c210.alignment = aln("center", "middle", false);

  ws.getRow(R).height = 16;
  ws.getRow(R + 1).height = 16;
  ws.getRow(R + 2).height = 16;
  R += 3;

  // ════════════════════════════════════════════════════════════
  // 2. DATOS DEL DECLARANTE (Casillas 5 a 28)
  // ════════════════════════════════════════════════════════════
  // Fila 1: Pestaña vertical + NIT + DV + Apellidos + Nombres + Seccional
  ws.getRow(R).height = 24;
  renderVerticalTab(ws, `A${R}:A${R+1}`, "Datos del declarante", CLR.tabGray, CLR.black, 6.5);

  // 5. NIT (B-C)
  ws.mergeCells(`B${R}:C${R}`);
  const cNIT = ws.getCell(`B${R}`);
  cNIT.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "5. Número de Identificación Tributaria (NIT)\n" },
      { font: font(9, true, CLR.black, "Courier New"), text: D.nit },
    ],
  };
  cNIT.border = BDR_BOX;
  cNIT.alignment = aln("left", "top", true);

  // 6. DV (D)
  const cDV = ws.getCell(`D${R}`);
  cDV.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "6.DV\n" },
      { font: font(9, true, CLR.black, "Courier New"), text: D.dv },
    ],
  };
  cDV.border = BDR_BOX;
  cDV.alignment = aln("center", "top", true);

  // 7. Primer apellido (E)
  const cAp1 = ws.getCell(`E${R}`);
  cAp1.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "7. Primer apellido\n" },
      { font: font(8.5, true, CLR.black), text: D.primerApellido },
    ],
  };
  cAp1.border = BDR_BOX;
  cAp1.alignment = aln("left", "top", true);

  // 8. Segundo apellido (F)
  const cAp2 = ws.getCell(`F${R}`);
  cAp2.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "8. Segundo apellido\n" },
      { font: font(8.5, true, CLR.black), text: D.segundoApellido },
    ],
  };
  cAp2.border = BDR_BOX;
  cAp2.alignment = aln("left", "top", true);

  // 9. Primer nombre (G-H)
  ws.mergeCells(`G${R}:H${R}`);
  const cN1 = ws.getCell(`G${R}`);
  cN1.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "9. Primer nombre\n" },
      { font: font(8.5, true, CLR.black), text: D.primerNombre },
    ],
  };
  cN1.border = BDR_BOX;
  cN1.alignment = aln("left", "top", true);

  // 10. Otros nombres (I)
  const cN2 = ws.getCell(`I${R}`);
  cN2.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "10. Otros nombres\n" },
      { font: font(8.5, true, CLR.black), text: D.otrosNombres },
    ],
  };
  cN2.border = BDR_BOX;
  cN2.alignment = aln("left", "top", true);

  // 12. Cód. Seccional (J)
  const cSecc = ws.getCell(`J${R}`);
  cSecc.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "12.Cód.Secc\n" },
      { font: font(9, true, CLR.black, "Courier New"), text: D.dirSeccional },
    ],
  };
  cSecc.border = borderCustom(T, T, T, TK);
  cSecc.alignment = aln("center", "top", true);
  R++;

  // Fila 2: CIIU 24, Cód 25, No anterior 26, Fracción 27, 1% FE 28
  ws.getRow(R).height = 20;
  // 24. CIIU (B-C)
  ws.mergeCells(`B${R}:C${R}`);
  const cCIIU = ws.getCell(`B${R}`);
  cCIIU.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "24. Actividad económica principal\n" },
      { font: font(9, true, CLR.black, "Courier New"), text: D.actividadCiiu },
    ],
  };
  cCIIU.fill = fill(CLR.blueLight);
  cCIIU.border = BDR_BOX;
  cCIIU.alignment = aln("left", "top", true);

  // 25. Cód (D)
  const c25 = ws.getCell(`D${R}`);
  c25.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "25. Cód\n" },
      { font: font(8.5, true, CLR.black), text: D.esCorreccion ? "1" : "—" },
    ],
  };
  c25.fill = fill(CLR.blueLight);
  c25.border = BDR_BOX;
  c25.alignment = aln("center", "top", true);

  // 26. No anterior (E-F)
  ws.mergeCells(`E${R}:F${R}`);
  const c26 = ws.getCell(`E${R}`);
  c26.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "26. No. Formulario anterior\n" },
      { font: font(8, false, CLR.black), text: D.formAnterior || "—" },
    ],
  };
  c26.fill = fill(CLR.blueLight);
  c26.border = BDR_BOX;
  c26.alignment = aln("left", "top", true);

  // 27. Fracción año gravable sig (G)
  const c27 = ws.getCell(`G${R}`);
  c27.value = {
    richText: [
      { font: font(6, false, CLR.numMuted), text: "27. Fracción sig.\n" },
      { font: font(8.5, true, CLR.black), text: "NO" },
    ],
  };
  c27.fill = fill(CLR.blueLight);
  c27.border = BDR_BOX;
  c27.alignment = aln("center", "top", true);

  // 28. 1% Compras Factura Electrónica (H-J)
  ws.mergeCells(`H${R}:I${R}`);
  const c28Label = ws.getCell(`H${R}`);
  c28Label.value = "28. Uno por ciento (1%) de compras con factura electrónica";
  c28Label.font = font(6.5, false, CLR.black);
  c28Label.fill = fill(CLR.white);
  c28Label.border = BDR_BOX;
  c28Label.alignment = aln("left", "middle", true);

  renderCasillaCell(ws, `J${R}`, 28, D.c28, {
    border: borderCustom(T, T, T, TK),
    sz: 8,
  });
  R++;

  // ════════════════════════════════════════════════════════════
  // 3. SECCIÓN PATRIMONIO (Casillas 29 a 31) - bg-[#dbe7f0]
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 20;

  // Banner PATRIMONIO (A-B)
  ws.mergeCells(`A${R}:B${R}`);
  const pBanner = ws.getCell(`A${R}`);
  pBanner.value = "PATRIMONIO";
  pBanner.font = font(8, true, CLR.black);
  pBanner.fill = fill(CLR.blueHdr);
  pBanner.border = borderCustom(M, TK, M, T);
  pBanner.alignment = aln("center", "middle", false);

  // 29. Total patrimonio bruto (C-D)
  ws.mergeCells(`C${R}:D${R}`);
  const p29 = ws.getCell(`C${R}`);
  p29.value = {
    richText: [
      { font: font(7, false, CLR.black), text: "Total patrimonio bruto   " },
      { font: font(6, true, CLR.numBlue), text: "29\n" },
      { font: font(8.5, true, CLR.black), text: fmt(D.c29) },
    ],
  };
  p29.fill = fill(CLR.white);
  p29.border = borderCustom(M, T, M, T);
  p29.alignment = aln("right", "middle", true);

  // 30. Deudas (E-F)
  ws.mergeCells(`E${R}:F${R}`);
  const p30 = ws.getCell(`E${R}`);
  p30.value = {
    richText: [
      { font: font(7, false, CLR.black), text: "Deudas   " },
      { font: font(6, true, CLR.numBlue), text: "30\n" },
      { font: font(8.5, true, CLR.black), text: fmt(D.c30) },
    ],
  };
  p30.fill = fill(CLR.white);
  p30.border = borderCustom(M, T, M, T);
  p30.alignment = aln("right", "middle", true);

  // 31. Total patrimonio líquido (G-J) - bg-[#eaf1f7]
  ws.mergeCells(`G${R}:J${R}`);
  const p31 = ws.getCell(`G${R}`);
  p31.value = {
    richText: [
      { font: font(7.5, true, CLR.black), text: "Total patrimonio líquido   " },
      { font: font(6.5, true, CLR.numBlue), text: "31\n" },
      { font: font(9.5, true, CLR.black), text: fmt(D.c31) },
    ],
  };
  p31.fill = fill(CLR.blueTotal);
  p31.border = borderCustom(M, T, M, TK);
  p31.alignment = aln("right", "middle", true);
  R++;

  // ════════════════════════════════════════════════════════════
  // 4. CÉDULA GENERAL: TABLA MULTICOLUMNA (32 a 90)
  // ════════════════════════════════════════════════════════════
  // Encabezado de columnas de Cédula General (bg-[#dbe7f0])
  ws.getRow(R).height = 26;
  const startCedulaRow = R;

  // A: inicio de pestaña vertical "Cédula general" (se fusionará sobre todas las filas de la cédula)
  // B: Conceptos/rentas
  // C-D: Rentas de trabajo
  // E-F: Rentas de trabajo que no provengan de una relación laboral
  // G-H: Rentas de capital
  // I-J: Rentas no laborales

  const cgConcept = ws.getCell(`B${R}`);
  cgConcept.value = "Conceptos/rentas";
  cgConcept.font = font(7.5, true, CLR.black);
  cgConcept.fill = fill(CLR.blueHdr);
  cgConcept.border = BDR_BOX;
  cgConcept.alignment = aln("left", "middle", false);

  ws.mergeCells(`C${R}:D${R}`);
  const cgTrab = ws.getCell(`C${R}`);
  cgTrab.value = "Rentas de trabajo";
  cgTrab.font = font(7.5, true, CLR.black);
  cgTrab.fill = fill(CLR.blueHdr);
  cgTrab.border = BDR_BOX;
  cgTrab.alignment = aln("center", "middle", true);

  ws.mergeCells(`E${R}:F${R}`);
  const cgHonor = ws.getCell(`E${R}`);
  cgHonor.value = "Rentas de trabajo que no provengan de una relación laboral";
  cgHonor.font = font(6.5, true, CLR.black);
  cgHonor.fill = fill(CLR.blueHdr);
  cgHonor.border = BDR_BOX;
  cgHonor.alignment = aln("center", "middle", true);

  ws.mergeCells(`G${R}:H${R}`);
  const cgCap = ws.getCell(`G${R}`);
  cgCap.value = "Rentas de capital";
  cgCap.font = font(7.5, true, CLR.black);
  cgCap.fill = fill(CLR.blueHdr);
  cgCap.border = BDR_BOX;
  cgCap.alignment = aln("center", "middle", true);

  ws.mergeCells(`I${R}:J${R}`);
  const cgNoLab = ws.getCell(`I${R}`);
  cgNoLab.value = "Rentas no laborales";
  cgNoLab.font = font(7.5, true, CLR.black);
  cgNoLab.fill = fill(CLR.blueHdr);
  cgNoLab.border = borderCustom(T, T, T, TK);
  cgNoLab.alignment = aln("center", "middle", true);
  R++;

  // ── Filas de la Cédula General (con los estilos y colores de official-dian-210.tsx) ──
  const CEDULA_ROWS = [
    // [concepto, casTrab, valTrab, casHon, valHon, casCap, valCap, casNL, valNL, bg, isBold, isItalic]
    ["Ingresos brutos", 32, D.c32, 43, D.c43, 58, D.c58, 74, D.c74, CLR.blueAlt, false, false],
    ["Devoluciones, rebajas y descuentos", null, null, null, null, null, null, 75, D.c75, CLR.disabledGray, false, false],
    ["Ingresos no constitutivos de renta", 33, D.c33, 44, D.c44, 59, D.c59, 76, D.c76, CLR.blueAlt, false, false],
    ["Costos y deducciones procedentes", null, null, 45, D.c45, 60, D.c60, 77, D.c77, CLR.blueAlt, false, false],
    ["Renta líquida", 34, D.c34, 46, D.c46, 61, D.c61, 78, D.c78, CLR.blueSoft, true, false],
    ["Rentas líquidas pasivas - ECE", null, null, null, null, 62, D.c62, 79, D.c79, CLR.blueAlt, false, false],
    ["  • Aportes voluntarios AFC, FVP y AVC", 35, D.c35, 47, D.c47, 63, D.c63, 80, D.c80, CLR.blueAlt, false, true],
    ["  • Otras rentas exentas", 36, D.c36, 48, D.c48, 64, D.c64, 81, D.c81, CLR.blueAlt, false, true],
    ["Total rentas exentas", 37, D.c37, 49, D.c49, 65, D.c65, 82, D.c82, CLR.blueMuted, true, false],
    ["  • Intereses de vivienda", 38, D.c38, 50, D.c50, 66, D.c66, 83, D.c83, CLR.blueAlt, false, true],
    ["  • Otras deducciones imputables", 39, D.c39, 51, D.c51, 67, D.c67, 84, D.c84, CLR.blueAlt, false, true],
    ["Total deducciones imputables", 40, D.c40, 52, D.c52, 68, D.c68, 85, D.c85, CLR.blueMuted, true, false],
    ["Rentas exentas y/o deduc. imputables (Limitadas)", 41, D.c41, 53, D.c53, 69, D.c69, 86, D.c86, CLR.blueLimit, true, false],
    ["Renta líquida ordinaria del ejercicio", null, null, 54, D.c54, 70, D.c70, 87, D.c87, CLR.blueAlt, false, false],
    ["Pérdida líquida del ejercicio", null, null, 55, D.c55, 71, D.c71, 88, D.c88, CLR.blueAlt, false, false],
    ["Compensaciones por pérdidas", null, null, 56, D.c56, 72, D.c72, 89, D.c89, CLR.blueAlt, false, false],
    ["Renta líquida ordinaria", 42, D.c42, 57, D.c57, 73, D.c73, 90, D.c90, CLR.blueHdr, true, false],
  ];

  for (const row of CEDULA_ROWS) {
    ws.getRow(R).height = 18;
    const [label, cT, vT, cH, vH, cC, vC, cN, vN, rowBg, isBold, isItalic] = row;

    // Col B: Etiqueta del concepto
    const cLabel = ws.getCell(`B${R}`);
    cLabel.value = label;
    cLabel.font = font(isBold ? 7.5 : 7, isBold, CLR.black, "Arial", isItalic);
    cLabel.fill = fill(rowBg);
    cLabel.border = BDR_BOX;
    cLabel.alignment = aln("left", "middle", true);

    // Pares de 2 columnas para cada subcédula:
    // C-D: Trabajo
    ws.mergeCells(`C${R}:D${R}`);
    if (cT !== null) {
      renderCasillaCell(ws, `C${R}`, cT, vT, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`C${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    // E-F: Honorarios
    ws.mergeCells(`E${R}:F${R}`);
    if (cH !== null) {
      renderCasillaCell(ws, `E${R}`, cH, vH, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`E${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    // G-H: Capital
    ws.mergeCells(`G${R}:H${R}`);
    if (cC !== null) {
      renderCasillaCell(ws, `G${R}`, cC, vC, { bg: rowBg, bold: isBold });
    } else {
      const disCell = ws.getCell(`G${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = BDR_BOX;
    }

    // I-J: No Laborales
    ws.mergeCells(`I${R}:J${R}`);
    if (cN !== null) {
      renderCasillaCell(ws, `I${R}`, cN, vN, {
        bg: rowBg,
        bold: isBold,
        border: borderCustom(T, T, T, TK),
      });
    } else {
      const disCell = ws.getCell(`I${R}`);
      disCell.fill = fill(CLR.disabledGray);
      disCell.border = borderCustom(T, T, T, TK);
    }
    R++;
  }

  // Renderizar la pestaña vertical izquierda "Cédula general"
  renderVerticalTab(ws, `A${startCedulaRow}:A${R-1}`, "Cédula general", CLR.tabGray, CLR.black, 7.5);

  // ════════════════════════════════════════════════════════════
  // 5. DEPURACIÓN CÉDULA GENERAL (Casillas 91 a 98) - bg-[#eef4f8]
  // ════════════════════════════════════════════════════════════
  // Fila 1: 91, 92, 93, 94
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  const dep91 = ws.getCell(`A${R}`);
  dep91.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Ren. líquida céd. gen.  " },
      { font: font(6, true, CLR.numBlue), text: "91\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c91) },
    ],
  };
  dep91.fill = fill(CLR.blueSoft);
  dep91.border = borderCustom(M, TK, T, T);
  dep91.alignment = aln("right", "middle", true);

  ws.mergeCells(`C${R}:D${R}`);
  const dep92 = ws.getCell(`C${R}`);
  dep92.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Ren. ex. y ded. imp. li.  " },
      { font: font(6, true, CLR.numBlue), text: "92\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c92) },
    ],
  };
  dep92.fill = fill(CLR.blueSoft);
  dep92.border = borderCustom(M, T, T, T);
  dep92.alignment = aln("right", "middle", true);

  ws.mergeCells(`E${R}:G${R}`);
  const dep93 = ws.getCell(`E${R}`);
  dep93.value = {
    richText: [
      { font: font(6.5, true, CLR.black), text: "R. líq. ord. cédula gen.  " },
      { font: font(6, true, CLR.numBlue), text: "93\n" },
      { font: font(9, true, CLR.black), text: fmt(D.c93) },
    ],
  };
  dep93.fill = fill(CLR.blueSoft);
  dep93.border = borderCustom(M, T, T, T);
  dep93.alignment = aln("right", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const dep94 = ws.getCell(`H${R}`);
  dep94.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Comp. pérdidas año 2018 y ant.  " },
      { font: font(6, true, CLR.numBlue), text: "94\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c94) },
    ],
  };
  dep94.fill = fill(CLR.blueSoft);
  dep94.border = borderCustom(M, T, T, TK);
  dep94.alignment = aln("right", "middle", true);
  R++;

  // Fila 2: 95, 96, 97, 98 (Casilla 97 con bg-[#dbe7f0] font-black)
  ws.getRow(R).height = 20;
  ws.mergeCells(`A${R}:B${R}`);
  const dep95 = ws.getCell(`A${R}`);
  dep95.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Comp. exc. ren. presuntiva  " },
      { font: font(6, true, CLR.numBlue), text: "95\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c95) },
    ],
  };
  dep95.fill = fill(CLR.blueSoft);
  dep95.border = borderCustom(T, TK, M, T);
  dep95.alignment = aln("right", "middle", true);

  ws.mergeCells(`C${R}:D${R}`);
  const dep96 = ws.getCell(`C${R}`);
  dep96.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Rentas gravables  " },
      { font: font(6, true, CLR.numBlue), text: "96\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c96) },
    ],
  };
  dep96.fill = fill(CLR.blueSoft);
  dep96.border = borderCustom(T, T, M, T);
  dep96.alignment = aln("right", "middle", true);

  ws.mergeCells(`E${R}:G${R}`);
  const dep97 = ws.getCell(`E${R}`);
  dep97.value = {
    richText: [
      { font: font(7, true, CLR.black), text: "R. líq. grav. cédula gen.  " },
      { font: font(6.5, true, CLR.numBlue), text: "97\n" },
      { font: font(10, true, CLR.black), text: fmt(D.c97) },
    ],
  };
  dep97.fill = fill(CLR.blueHdr);
  dep97.border = borderCustom(T, T, M, T);
  dep97.alignment = aln("right", "middle", true);

  ws.mergeCells(`H${R}:J${R}`);
  const dep98 = ws.getCell(`H${R}`);
  dep98.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Renta presuntiva  " },
      { font: font(6, true, CLR.numBlue), text: "98\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c98) },
    ],
  };
  dep98.fill = fill(CLR.blueSoft);
  dep98.border = borderCustom(T, T, M, TK);
  dep98.alignment = aln("right", "middle", true);
  R++;

  // ════════════════════════════════════════════════════════════
  // 6. DIVISIÓN INFERIOR EN 2 MITADES (50% IZQ / 50% DER)
  //    IZQUIERDA: Pensiones (99-103), Dividendos (104-111), GO (112-115)
  //    DERECHA:   Liquidación Privada (116-133 con sub-grid de Descuentos)
  // ════════════════════════════════════════════════════════════
  // Filas Izquierda (Total: 5 + 8 + 4 = 17 filas)
  const LEFT_SECTIONS = [
    // --- PENSIONES (5 filas) ---
    { section: "pensiones", label: "Ingresos brutos por rentas de pensiones del país y del exterior", cas: 99, val: D.c99, bg: CLR.white, bold: false },
    { section: "pensiones", label: "Ingresos no constitutivos de renta", cas: 100, val: D.c100, bg: CLR.white, bold: false },
    { section: "pensiones", label: "Renta líquida", cas: 101, val: D.c101, bg: CLR.blueLight, bold: false },
    { section: "pensiones", label: "Rentas exentas de pensiones", cas: 102, val: D.c102, bg: CLR.white, bold: false },
    { section: "pensiones", label: "Renta líquida gravable cédula de pensiones", cas: 103, val: D.c103, bg: CLR.blueHdr, bold: true },

    // --- DIVIDENDOS (8 filas) ---
    { section: "dividendos", label: "Dividendos y participaciones año 2016 y anteriores, y otros", cas: 104, val: D.c104, bg: CLR.white, bold: false },
    { section: "dividendos", label: "Ingresos no constitutivos de renta", cas: 105, val: D.c105, bg: CLR.white, bold: false },
    { section: "dividendos", label: "Renta líquida ordinaria año 2016 y anteriores", cas: 106, val: D.c106, bg: CLR.blueLight, bold: false },
    { section: "dividendos", label: "1a. Subcédula años 2017 y siguientes numeral 3 art. 49 del E.T.", cas: 107, val: D.c107, bg: CLR.white, bold: false },
    { section: "dividendos", label: "2a. Subcédula años 2017 y siguientes parágrafo 2 art. 49 del E.T.", cas: 108, val: D.c108, bg: CLR.white, bold: false },
    { section: "dividendos", label: "Dividendos y participaciones recibidas del exterior", cas: 109, val: D.c109, bg: CLR.white, bold: false },
    { section: "dividendos", label: "Rentas exentas de la casilla 109", cas: 110, val: D.c110, bg: CLR.white, bold: false },
    { section: "dividendos", label: "Renta líquida gravable (Cédula general o Renta presuntiva, pensiones y div)", cas: 111, val: D.c111, bg: CLR.blueHdr, bold: true },

    // --- GANANCIAS OCASIONALES (4 filas) ---
    { section: "go", label: "Ingresos por ganancias ocasionales del país y del exterior", cas: 112, val: D.c112, bg: CLR.white, bold: false },
    { section: "go", label: "Costos por ganancias ocasionales", cas: 113, val: D.c113, bg: CLR.white, bold: false },
    { section: "go", label: "Ganancias ocasionales no gravadas y exentas", cas: 114, val: D.c114, bg: CLR.white, bold: false },
    { section: "go", label: "Ganancias ocasionales gravables", cas: 115, val: D.c115, bg: CLR.blueHdr, bold: true },
  ];

  // Filas Derecha (Liquidación Privada - Total 17 filas para coincidir exactamente)
  const RIGHT_SECTIONS = [
    { type: "row", label: "Cédula general, de pensiones y de dividendos y participaciones", cas: 116, val: D.c116, bg: CLR.white, bold: false },
    { type: "row", label: "Renta presuntiva, de pensiones y de dividendos y participaciones", cas: 117, val: D.c117, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones año 2017 y siguientes, 2a subcédula (Art. 240)", cas: 118, val: D.c118, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones año 2016", cas: 119, val: D.c119, bg: CLR.white, bold: false },
    { type: "row", label: "Por dividendos y participaciones recibidas del exterior", cas: 120, val: D.c120, bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto sobre las rentas líquidas gravables", cas: 121, val: D.c121, bg: CLR.blueSoft, bold: true },
    // Sub-grid 2x2 Descuentos
    { type: "descGrid1", c1: 122, l1: "Imp. pagados exterior", v1: D.c122, c2: 123, l2: "Donaciones", v2: D.c123 },
    { type: "descGrid2", c1: 124, l1: "Dividendos, partic. y otros", v1: D.c124, c2: 125, l2: "Total desctos trib.", v2: D.c125 },
    // Resto de Liquidación
    { type: "row", label: "Impuesto neto de renta", cas: 126, val: D.c126, bg: CLR.blueLight, bold: true },
    { type: "row", label: "Impuesto de ganancias ocasionales", cas: 127, val: D.c127, bg: CLR.white, bold: false },
    { type: "row", label: "Descuento por impuestos pagados en el exterior por ganancias ocasionales", cas: 128, val: D.c128, bg: CLR.white, bold: false },
    { type: "row", label: "Total impuesto a cargo", cas: 129, val: D.c129, bg: CLR.blueHdr, bold: true },
    { type: "row", label: "Anticipo renta liquidado año gravable anterior", cas: 130, val: D.c130, bg: CLR.white, bold: false },
    { type: "row", label: "Saldo a favor del año gravable anterior sin solicitud de devolución/compensación", cas: 131, val: D.c131, bg: CLR.white, bold: false },
    { type: "row", label: "Retenciones año gravable a declarar", cas: 132, val: D.c132, bg: CLR.white, bold: false },
    { type: "row", label: "Anticipo renta para el año gravable siguiente", cas: 133, val: D.c133, bg: CLR.white, bold: false },
    { type: "blank" },
  ];

  const startLowerRow = R;

  for (let i = 0; i < 17; i++) {
    ws.getRow(R).height = 17.5;
    const l = LEFT_SECTIONS[i];
    const r = RIGHT_SECTIONS[i];

    // ── IZQUIERDA (Cols B-F) ──
    if (l) {
      // B-D: Etiqueta
      ws.mergeCells(`B${R}:D${R}`);
      const cLbl = ws.getCell(`B${R}`);
      cLbl.value = l.label;
      cLbl.font = font(l.bold ? 7.5 : 7, l.bold, CLR.black);
      cLbl.fill = fill(l.bg);
      cLbl.border = BDR_BOX;
      cLbl.alignment = aln("left", "middle", true);

      // E-F: Valor Casilla
      ws.mergeCells(`E${R}:F${R}`);
      renderCasillaCell(ws, `E${R}`, l.cas, l.val, { bg: l.bg, bold: l.bold });
    }

    // ── DERECHA (Cols H-J) ──
    if (r) {
      if (r.type === "row") {
        // H: Etiqueta Liquidación
        const rLbl = ws.getCell(`H${R}`);
        rLbl.value = r.label;
        rLbl.font = font(r.bold ? 7.5 : 7, r.bold, CLR.black);
        rLbl.fill = fill(r.bg);
        rLbl.border = BDR_BOX;
        rLbl.alignment = aln("left", "middle", true);

        // I-J: Valor Casilla Liquidación
        ws.mergeCells(`I${R}:J${R}`);
        renderCasillaCell(ws, `I${R}`, r.cas, r.val, {
          bg: r.bg,
          bold: r.bold,
          border: borderCustom(T, T, T, TK),
        });
      } else if (r.type === "descGrid1" || r.type === "descGrid2") {
        // Descuentos en 2 columnas: H=Desc1, I-J=Desc2
        // H: Descuento 1
        const d1Cell = ws.getCell(`H${R}`);
        d1Cell.value = {
          richText: [
            { font: font(6.5, false, CLR.black), text: `${r.l1}  ` },
            { font: font(5.5, true, CLR.numBlue), text: `${r.c1}\n` },
            { font: font(8, r.type === "descGrid2", CLR.black), text: fmt(r.v1) },
          ],
        };
        d1Cell.fill = fill(CLR.blueAlt);
        d1Cell.border = BDR_BOX;
        d1Cell.alignment = aln("right", "middle", true);

        // I-J: Descuento 2
        ws.mergeCells(`I${R}:J${R}`);
        const d2Cell = ws.getCell(`I${R}`);
        d2Cell.value = {
          richText: [
            { font: font(6.5, r.type === "descGrid2", CLR.black), text: `${r.l2}  ` },
            { font: font(5.5, true, CLR.numBlue), text: `${r.c2}\n` },
            { font: font(8, r.type === "descGrid2", CLR.black), text: fmt(r.v2) },
          ],
        };
        d2Cell.fill = fill(r.type === "descGrid2" ? CLR.blueSoft : CLR.blueAlt);
        d2Cell.border = borderCustom(T, T, T, TK);
        d2Cell.alignment = aln("right", "middle", true);
      } else {
        // Fila en blanco de relleno
        const blkH = ws.getCell(`H${R}`);
        blkH.fill = fill(CLR.white);
        blkH.border = BDR_BOX;
        ws.mergeCells(`I${R}:J${R}`);
        const blkI = ws.getCell(`I${R}`);
        blkI.fill = fill(CLR.white);
        blkI.border = borderCustom(T, T, T, TK);
      }
    }
    R++;
  }

  // Renderizar pestañas verticales de la parte inferior:
  // Col A:
  // - Pensiones: filas startLowerRow a startLowerRow + 4 (5 filas)
  renderVerticalTab(ws, `A${startLowerRow}:A${startLowerRow+4}`, "Cédula de pensiones", CLR.tabGray, CLR.black, 7);
  // - Dividendos: filas startLowerRow + 5 a startLowerRow + 12 (8 filas)
  renderVerticalTab(ws, `A${startLowerRow+5}:A${startLowerRow+12}`, "Cédula de dividendos y/o participaciones", CLR.tabGray, CLR.black, 6.5);
  // - Ganancias Ocasionales: filas startLowerRow + 13 a startLowerRow + 16 (4 filas)
  renderVerticalTab(ws, `A${startLowerRow+13}:A${startLowerRow+16}`, "Ganancias ocasionales", CLR.tabGray, CLR.black, 6.5);

  // Col G:
  // - Liquidación Privada: todas las 17 filas (startLowerRow a startLowerRow + 16)
  renderVerticalTab(ws, `G${startLowerRow}:G${startLowerRow+16}`, "Liquidación privada", CLR.tabGray, CLR.black, 7.5);

  // ════════════════════════════════════════════════════════════
  // 7. TOTALES DE SALDO Y DATOS INFORMATIVOS (134 a 141)
  // ════════════════════════════════════════════════════════════
  // Fila 1: 134, 135, 136 Saldo a pagar (rojo), 137 Saldo a favor (verde)
  ws.getRow(R).height = 22;

  // 134. Saldo a pagar por impuesto (A-C)
  ws.mergeCells(`A${R}:C${R}`);
  const s134 = ws.getCell(`A${R}`);
  s134.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Saldo a pagar por impuesto  " },
      { font: font(6, true, CLR.numBlue), text: "134\n" },
      { font: font(9, false, CLR.black), text: fmt(D.c134) },
    ],
  };
  s134.fill = fill(CLR.blueLight);
  s134.border = borderCustom(M, TK, T, T);
  s134.alignment = aln("right", "middle", true);

  // 135. Sanciones (D-E)
  ws.mergeCells(`D${R}:E${R}`);
  const s135 = ws.getCell(`D${R}`);
  s135.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Sanciones  " },
      { font: font(6, true, CLR.numBlue), text: "135\n" },
      { font: font(9, false, CLR.black), text: fmt(D.c135) },
    ],
  };
  s135.fill = fill(CLR.blueLight);
  s135.border = borderCustom(M, T, T, T);
  s135.alignment = aln("right", "middle", true);

  // 136. Total saldo a pagar (F-G) - bg-[#fbeae8] font-black text-red-900
  ws.mergeCells(`F${R}:G${R}`);
  const s136 = ws.getCell(`F${R}`);
  s136.value = {
    richText: [
      { font: font(7, true, CLR.redPayText), text: "Total saldo a pagar  " },
      { font: font(6.5, true, CLR.redPayText), text: "136\n" },
      { font: font(10, true, CLR.redPayText), text: fmt(D.c136) },
    ],
  };
  s136.fill = fill(CLR.redPayBg);
  s136.border = borderCustom(M, T, T, T);
  s136.alignment = aln("right", "middle", true);

  // 137. Total saldo a favor (H-J) - bg-[#eaf4ee] font-black text-[#00573F]
  ws.mergeCells(`H${R}:J${R}`);
  const s137 = ws.getCell(`H${R}`);
  s137.value = {
    richText: [
      { font: font(7, true, CLR.greenFavText), text: "Total saldo a favor  " },
      { font: font(6.5, true, CLR.greenFavText), text: "137\n" },
      { font: font(10, true, CLR.greenFavText), text: fmt(D.c137) },
    ],
  };
  s137.fill = fill(CLR.greenFavBg);
  s137.border = borderCustom(M, T, T, TK);
  s137.alignment = aln("right", "middle", true);
  R++;

  // Fila 2: Datos Informativos (138 dependientes, 139 adición, 140 superó tope, 141 aporte voluntario)
  ws.getRow(R).height = 20;

  // 138. Número de dependientes (A-C)
  ws.mergeCells(`A${R}:C${R}`);
  const s138 = ws.getCell(`A${R}`);
  s138.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Número de dependientes económicos  " },
      { font: font(6, true, CLR.numBlue), text: "138\n" },
      { font: font(8.5, true, CLR.black), text: fmt(D.c138) },
    ],
  };
  s138.fill = fill(CLR.white);
  s138.border = borderCustom(T, TK, M, T);
  s138.alignment = aln("right", "middle", true);

  // 139. Adición dependientes a casilla 92 (D-E)
  ws.mergeCells(`D${R}:E${R}`);
  const s139 = ws.getCell(`D${R}`);
  s139.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Adición dependientes a cas. 92  " },
      { font: font(6, true, CLR.numBlue), text: "139\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c139) },
    ],
  };
  s139.fill = fill(CLR.white);
  s139.border = borderCustom(T, T, M, T);
  s139.alignment = aln("right", "middle", true);

  // 140. Superó tope art. 336-1 E.T. marque X (F-G)
  ws.mergeCells(`F${R}:G${R}`);
  const s140 = ws.getCell(`F${R}`);
  s140.value = {
    richText: [
      { font: font(6, false, CLR.black), text: "Superó tope art. 336-1 marque X  " },
      { font: font(6, true, CLR.numBlue), text: "140\n" },
      { font: font(8.5, true, CLR.black), text: D.c140 ? "X" : "NO" },
    ],
  };
  s140.fill = fill(CLR.white);
  s140.border = borderCustom(T, T, M, T);
  s140.alignment = aln("center", "middle", true);

  // 141. Aporte voluntario (H-J)
  ws.mergeCells(`H${R}:J${R}`);
  const s141 = ws.getCell(`H${R}`);
  s141.value = {
    richText: [
      { font: font(6.5, false, CLR.black), text: "Aporte voluntario  " },
      { font: font(6, true, CLR.numBlue), text: "141\n" },
      { font: font(8.5, false, CLR.black), text: fmt(D.c141) },
    ],
  };
  s141.fill = fill(CLR.white);
  s141.border = borderCustom(T, T, M, TK);
  s141.alignment = aln("right", "middle", true);
  R++;

  // ════════════════════════════════════════════════════════════
  // 8. SECCIÓN DE FIRMAS Y RECAUDO OFICIAL (980 a 997)
  // ════════════════════════════════════════════════════════════
  // Fila Firmas 1: Representación & Declarante (A-E) | Sello Entidad Recaudadora (F-J)
  ws.getRow(R).height = 24;

  // 981. Representación y Declarante (A-E)
  ws.mergeCells(`A${R}:E${R}`);
  const fDecl = ws.getCell(`A${R}`);
  fDecl.value = {
    richText: [
      { font: font(6.5, false, CLR.numMuted), text: "981. Cód. Representación: 0\n" },
      {
        font: font(7.5, true, CLR.black),
        text: `Firma del declarante o quien lo representa: ${D.primerNombre} ${D.otrosNombres} ${D.primerApellido} ${D.segundoApellido}`,
      },
    ],
  };
  fDecl.fill = fill(CLR.white);
  fDecl.border = borderCustom(M, TK, T, T);
  fDecl.alignment = aln("left", "middle", true);

  // 997. Sello entidad recaudadora (F-J)
  ws.mergeCells(`F${R}:J${R}`);
  const fSello = ws.getCell(`F${R}`);
  fSello.value = {
    richText: [
      { font: font(7, true, CLR.black), text: "997. Espacio exclusivo para el sello de la entidad recaudadora\n" },
      { font: font(6, false, CLR.numMuted), text: "(Fecha de presentación y certificación electrónica MUISCA)" },
    ],
  };
  fSello.fill = fill(CLR.white);
  fSello.border = borderCustom(M, T, T, TK);
  fSello.alignment = aln("center", "middle", true);
  R++;

  // Fila Firmas 2: Contador (A-E) | 980 Pago Total $ y Adhesivo (F-J)
  ws.getRow(R).height = 22;

  // 982 / 994 / 983 Contador (A-E)
  ws.mergeCells(`A${R}:E${R}`);
  const fCont = ws.getCell(`A${R}`);
  fCont.value = {
    richText: [
      { font: font(6.5, false, CLR.numMuted), text: "982. Cód. Contador: 0    994. Con salvedades: NO\n" },
      { font: font(7, false, CLR.black), text: "983. No. Tarjeta profesional: __________-T  (Firma no requerida por topes legales)" },
    ],
  };
  fCont.fill = fill(CLR.white);
  fCont.border = borderCustom(T, TK, TK, T);
  fCont.alignment = aln("left", "middle", true);

  // 980. Pago Total $ (F-H) - bg-[#eaf1f7] font-black
  ws.mergeCells(`F${R}:H${R}`);
  const fPago = ws.getCell(`F${R}`);
  fPago.value = {
    richText: [
      { font: font(8, true, CLR.black), text: "980. Pago total $  " },
      { font: font(10.5, true, CLR.black, "Courier New"), text: fmt(D.c980) },
    ],
  };
  fPago.fill = fill(CLR.blueTotal);
  fPago.border = borderCustom(T, T, TK, T);
  fPago.alignment = aln("right", "middle", true);

  // 996. Adhesivo DIAN (I-J)
  ws.mergeCells(`I${R}:J${R}`);
  const fAdh = ws.getCell(`I${R}`);
  fAdh.value = "996. Espacio número interno DIAN / Adhesivo";
  fAdh.font = font(6, false, CLR.numMuted);
  fAdh.fill = fill(CLR.white);
  fAdh.border = borderCustom(T, T, TK, TK);
  fAdh.alignment = aln("center", "middle", true);

  // ════════════════════════════════════════════════════════════
  // GUARDAR ARCHIVO EXCEL
  // ════════════════════════════════════════════════════════════
  await wb.xlsx.writeFile(OUT);
  console.log(`✅ Archivo Excel Formulario 210 generado fiel a la app web: ${OUT}`);
  console.log(`   Total de filas: ${R}`);
}

build().catch((e) => {
  console.error("❌ Error generando Excel:", e.message);
  console.error(e.stack);
  process.exit(1);
});
