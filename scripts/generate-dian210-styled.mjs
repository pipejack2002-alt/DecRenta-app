/**
 * Genera Formulario_210_2024_DIAN_Visual.xlsx
 * Réplica visual pixel-perfect del Formulario_210_2024.pdf oficial de la DIAN
 * Usando ExcelJS con estilos completos: bordes, colores, fuentes, celdas combinadas
 *
 * Estructura del PDF oficial:
 *   Fila 1-3: Encabezado (DIAN | Título | Espacio DIAN | Caja azul 210)
 *   Fila 4:   Año | Espacio DIAN | No. Formulario
 *   Fila 5:   Espacio reservado DIAN (vacío grande)
 *   Fila 6:   Datos declarante fila 1 (NIT/DV/Apellidos/Nombres/Seccional)
 *   Fila 7:   Datos declarante fila 2 (CIIU/Corrección/No anterior/Fracción/28)
 *   Fila 8:   Patrimonio (29/30/31)
 *   Fila 9:   Encabezado cédula general (4 columnas)
 *   Filas 10-26: Cédula general (32-90) | Liquidación privada (116-131)
 *   Fila 27-28: Depuración (91-98) | Retenciones 132-133
 *   Fila 29:  Encabezado pensiones + Totales header
 *   Filas 30+: Pensiones/Dividendos/GO izq | Totales/Firmas der
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "Formulario_210_2024_DIAN_Visual.xlsx");

// ──────────────────────────────────────────────────────────────
// PALETA OFICIAL DIAN
// ──────────────────────────────────────────────────────────────
const CLR = {
  blue210:   "FF2D6187",   // Caja grande "210" — azul institucional DIAN
  blueDark:  "FF1F4E79",   // Azul oscuro para bordes de secciones
  blueLight: "FFD6E4F0",   // Fondo azul claro (encabezados de sección)
  blueMid:   "FFB8CCE4",   // Encabezados columnas cédula
  blueNum:   "FF2E74B5",   // Numeración de casillas
  gray1:     "FFF2F2F2",   // Filas par leves
  gray2:     "FFD9D9D9",   // Encabezados de sección gris
  gray3:     "FFBFBFBF",   // Celdas deshabilitadas
  yellow:    "FFFFF2CC",   // Totales / Resúmenes importantes
  redBg:     "FFFCE4EC",   // Saldo a pagar
  greenBg:   "FFE8F5E9",   // Saldo a favor
  white:     "FFFFFFFF",
  black:     "FF000000",
};

// ──────────────────────────────────────────────────────────────
// HELPERS DE ESTILO
// ──────────────────────────────────────────────────────────────
const thin  = (argb = CLR.black) => ({ style:"thin",  color:{ argb } });
const med   = (argb = CLR.black) => ({ style:"medium", color:{ argb } });
const thick = (argb = CLR.black) => ({ style:"thick",  color:{ argb } });

const THIN = { top:thin(), left:thin(), bottom:thin(), right:thin() };
const MED  = { top:med(),  left:med(),  bottom:med(),  right:med()  };
const MED_BLUE = { top:med(CLR.blue210), left:med(CLR.blue210), bottom:med(CLR.blue210), right:med(CLR.blue210) };

const fill = argb => ({ type:"pattern", pattern:"solid", fgColor:{ argb } });

const font = (sz, bold=false, argb=CLR.black, name="Arial") =>
  ({ name, size:sz, bold, color:{ argb } });

const aln = (h="left", v="middle", wrap=true) =>
  ({ horizontal:h, vertical:v, wrapText:wrap });

// Rich text: número de casilla pequeño arriba + valor grande abajo
function rt(casNum, label, val, boldVal=false, argbNum=CLR.blueNum) {
  const valStr = val === null || val === undefined ? "" :
    typeof val === "number" ? val.toLocaleString("es-CO") : String(val);
  return { richText: [
    { font: font(5.5, true, argbNum), text: casNum !== null ? `${casNum} ` : "" },
    { font: font(5.5, false, "FF555555"), text: label ? `${label}\n` : "\n" },
    { font: font(8, boldVal, CLR.black), text: valStr },
  ]};
}

// Celda de sección (encabezado gris/azul)
function secCell(ws, addr, text, bgArgb=CLR.gray2, txtArgb=CLR.black, bold=true, sz=7) {
  const c = ws.getCell(addr);
  c.value     = text;
  c.font      = font(sz, bold, txtArgb);
  c.fill      = fill(bgArgb);
  c.border    = MED;
  c.alignment = aln("center","middle",true);
  return c;
}

// Celda de datos con casilla
function cas(ws, addr, num, label, val, opts={}) {
  const c = ws.getCell(addr);
  c.value     = rt(num, label, val, opts.bold ?? false);
  c.fill      = fill(opts.bg ?? CLR.white);
  c.border    = opts.border ?? THIN;
  c.alignment = aln(opts.h ?? "left", opts.v ?? "top", true);
  return c;
}

// Celda deshabilitada (gris)
function disabled(ws, addr) {
  const c = ws.getCell(addr);
  c.fill   = fill(CLR.gray3);
  c.border = THIN;
  return c;
}

// ──────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO (asalariado DIAN)
// ──────────────────────────────────────────────────────────────
const D = {
  anio:2024, noForm:"2102024000241029",
  nit:"900.123.456", dv:"7",
  ap1:"GARCÍA", ap2:"MÁRQUEZ", n1:"GABRIEL", n2:"JOSÉ",
  secc:"32 - BOGOTÁ", ciiu:"9002",
  // Patrimonio
  c29:420_000_000, c30:85_000_000, c31:335_000_000,
  // Trabajo (32-42)
  c32:145_000_000,c33:11_600_000,c34:133_400_000,c35:12_000_000,c36:26_500_000,
  c37:38_500_000,c38:8_400_000,c39:6_460_000,c40:14_860_000,c41:48_720_000,c42:84_680_000,
  // Honorarios (43-57)
  c43:0,c44:0,c45:0,c46:0,c47:0,c48:0,c49:0,c50:0,c51:0,c52:0,c53:0,c54:0,c55:0,c56:0,c57:0,
  // Capital (58-73)
  c58:18_500_000,c59:2_100_000,c60:3_500_000,c61:12_900_000,c62:0,c63:0,c64:0,c65:0,
  c66:0,c67:520_000,c68:520_000,c69:520_000,c70:12_380_000,c71:0,c72:0,c73:12_380_000,
  // No laborales (74-90)
  c74:0,c75:0,c76:0,c77:0,c78:0,c79:0,c80:0,c81:0,c82:0,c83:0,c84:0,c85:0,c86:0,c87:0,c88:0,c89:0,c90:0,
  // Depuración (91-98)
  c91:146_300_000,c92:50_480_000,c93:97_060_000,c94:0,c95:0,c96:0,c97:97_060_000,c98:0,
  // Pensiones (99-103)
  c99:0,c100:0,c101:0,c102:0,c103:0,
  // Dividendos (104-111)
  c104:0,c105:0,c106:0,c107:4_500_000,c108:0,c109:0,c110:0,c111:4_500_000,
  // GO (112-115)
  c112:35_000_000,c113:25_000_000,c114:0,c115:10_000_000,
  // Liquidación (116-133)
  c116:14_350_000,c117:0,c118:0,c119:0,c120:0,c121:14_350_000,
  c122:0,c123:0,c124:0,c125:0,
  c126:14_350_000,c127:1_500_000,c128:0,c129:15_850_000,
  c130:2_800_000,c131:0,c132:8_650_000,c133:3_587_500,
  // Totales (134-141)
  c134:7_987_500,c135:0,c136:7_987_500,c137:0,
  c138:1,c139:3_585_528,c140:false,c141:0,c980:7_987_500,
};

// ──────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DEL WORKBOOK
// ──────────────────────────────────────────────────────────────
async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DecRenta App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Formulario 210 DIAN", {
    properties: { defaultRowHeight: 15 },
    pageSetup: {
      paperSize:9, orientation:"landscape",
      fitToPage:true, fitToWidth:1, fitToHeight:0,
      margins:{ left:0.3, right:0.3, top:0.4, bottom:0.4, header:0, footer:0 },
    },
  });

  // ── Anchos de columna (11 columnas, A..K) ──────────────────
  // Layout del PDF:
  //   A = Etiqueta concepto (ancha)
  //   B = Cas# trab | C = Valor trab
  //   D = Cas# honor | E = Valor honor
  //   F = Cas# cap | G = Valor cap
  //   H = Cas# nolabor | I = Valor nolabor
  //   J = Cas# liq | K = Valor liquidación / Totales
  ws.columns = [
    {key:"A", width:28},
    {key:"B", width:4.5},
    {key:"C", width:13},
    {key:"D", width:4.5},
    {key:"E", width:13},
    {key:"F", width:4.5},
    {key:"G", width:13},
    {key:"H", width:4.5},
    {key:"I", width:13},
    {key:"J", width:4.5},
    {key:"K", width:18},
  ];

  let R = 1;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1: ENCABEZADO PRINCIPAL (3 filas de alto)
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R+2}`);  // DIAN
  ws.mergeCells(`C${R}:H${R+2}`);  // Título
  ws.mergeCells(`I${R}:I${R+2}`);  // Espacio DIAN
  ws.mergeCells(`J${R}:K${R+2}`);  // Caja 210

  const cDian = ws.getCell(`A${R}`);
  cDian.value     = "DIAN";
  cDian.font      = { name:"Arial Black", size:24, bold:true, color:{ argb:CLR.black } };
  cDian.alignment = aln("left","middle",false);
  cDian.border    = { top:thick(), left:thick(), bottom:thick(), right:med() };
  cDian.fill      = fill(CLR.white);

  const cTitulo = ws.getCell(`C${R}`);
  cTitulo.value     = "Declaración de renta y complementario personas naturales y asimiladas residentes\ny sucesiones ilíquidas de causantes residentes";
  cTitulo.font      = font(10, true);
  cTitulo.alignment = aln("center","middle",true);
  cTitulo.border    = { top:thick(), left:med(), bottom:thick(), right:med() };

  const cEspacio = ws.getCell(`I${R}`);
  cEspacio.fill   = fill(CLR.blueLight);
  cEspacio.border = { top:thick(), left:med(), bottom:thick(), right:med() };

  const c210 = ws.getCell(`J${R}`);
  c210.value     = "210";
  c210.font      = { name:"Arial Black", size:38, bold:true, color:{ argb:CLR.white } };
  c210.fill      = fill(CLR.blue210);
  c210.alignment = aln("center","middle",false);
  c210.border    = { top:thick(), left:med(), bottom:thick(), right:thick() };

  ws.getRow(R).height   = 13;
  ws.getRow(R+1).height = 13;
  ws.getRow(R+2).height = 13;
  R += 3;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 2: AÑO + ESPACIO DIAN + No. FORMULARIO
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:I${R}`);
  ws.mergeCells(`J${R}:K${R}`);
  ws.getRow(R).height = 14;

  const cAnio = ws.getCell(`A${R}`);
  cAnio.value     = rt(1, "Año", D.anio);
  cAnio.border    = { top:med(), left:thick(), bottom:THIN.bottom, right:THIN.right };
  cAnio.alignment = aln("left","top",true);

  const cEsp2 = ws.getCell(`C${R}`);
  cEsp2.value     = "Espacio reservado para la DIAN";
  cEsp2.font      = font(7, false, CLR.blue210);
  cEsp2.border    = { top:med(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  cEsp2.alignment = aln("left","middle",false);

  const cNumForm = ws.getCell(`J${R}`);
  cNumForm.value     = rt(4, "Número de formulario", D.noForm);
  cNumForm.border    = { top:med(), left:THIN.left, bottom:THIN.bottom, right:thick() };
  cNumForm.alignment = aln("left","top",true);
  R++;

  // Espacio blanco DIAN (fila vacía)
  ws.mergeCells(`A${R}:K${R}`);
  const cVacio = ws.getCell(`A${R}`);
  cVacio.border = { left:thick(), right:thick() };
  ws.getRow(R).height = 28;
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 3: DATOS DEL DECLARANTE — Fila 1
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 22;
  // Pestaña lateral "Datos del declarante" — ocupa 2 filas
  ws.mergeCells(`A${R}:A${R+1}`);
  const cDatos = ws.getCell(`A${R}`);
  cDatos.value     = "Datos del\ndeclarante";
  cDatos.font      = font(6, true, CLR.black);
  cDatos.fill      = fill(CLR.blueLight);
  cDatos.border    = { top:thick(), left:thick(), bottom:med(), right:med() };
  cDatos.alignment = { vertical:"middle", horizontal:"center", textRotation:90, wrapText:true };

  // Casilla 5: NIT (col B)
  const c5 = ws.getCell(`B${R}`);
  c5.value = rt(5, "Número de Identificación Tributaria (NIT)", D.nit);
  c5.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c5.alignment = aln("left","top",true);

  // Casilla 6: DV (col C)
  const c6 = ws.getCell(`C${R}`);
  c6.value = rt(6, "DV", D.dv);
  c6.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c6.alignment = aln("left","top",true);

  // Casilla 7: Primer apellido (col D)
  const c7 = ws.getCell(`D${R}`);
  c7.value = rt(7, "Primer apellido", D.ap1);
  c7.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c7.alignment = aln("left","top",true);

  // Casilla 8: Segundo apellido (col E)
  const c8 = ws.getCell(`E${R}`);
  c8.value = rt(8, "Segundo apellido", D.ap2);
  c8.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c8.alignment = aln("left","top",true);

  // Casilla 9: Primer nombre (col F)
  const c9 = ws.getCell(`F${R}`);
  c9.value = rt(9, "Primer nombre", D.n1);
  c9.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c9.alignment = aln("left","top",true);

  // Casilla 10: Otros nombres (col G)
  const c10 = ws.getCell(`G${R}`);
  c10.value = rt(10, "Otros nombres", D.n2);
  c10.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };
  c10.alignment = aln("left","top",true);

  // Vacio H
  const cH1 = ws.getCell(`H${R}`);
  cH1.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };

  // Vacio I
  const cI1 = ws.getCell(`I${R}`);
  cI1.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:THIN.right };

  // Casilla 12: Cód Seccional (cols J-K)
  ws.mergeCells(`J${R}:K${R}`);
  const c12 = ws.getCell(`J${R}`);
  c12.value = rt(12, "Cód. Dirección seccional", D.secc);
  c12.border = { top:thick(), left:THIN.left, bottom:THIN.bottom, right:thick() };
  c12.alignment = aln("left","top",true);
  R++;

  // ── Fila 2 del declarante: CIIU / Corrección / No anterior / Fracción / 28 ──
  ws.getRow(R).height = 18;

  // B-C: CIIU 24
  ws.mergeCells(`B${R}:C${R}`);
  const c24 = ws.getCell(`B${R}`);
  c24.value = rt(24, "Actividad económica principal", D.ciiu);
  c24.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  c24.alignment = aln("left","top",true);

  // D: Corrección
  const cCorr = ws.getCell(`D${R}`);
  cCorr.value = { richText: [
    { font: font(5, true, "FF555555"), text: "Si es una corrección indique:\n" },
    { font: font(7), text: "NO" }
  ]};
  cCorr.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  cCorr.alignment = aln("left","top",true);

  // E: Cód 25
  const c25 = ws.getCell(`E${R}`);
  c25.value = rt(25, "Cód.", "");
  c25.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  c25.alignment = aln("left","top",true);

  // F: No. Formulario anterior 26
  const c26 = ws.getCell(`F${R}`);
  c26.value = rt(26, "No. Formulario anterior", "");
  c26.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  c26.alignment = aln("left","top",true);

  // G-H: Fracción año gravable siguiente 27
  ws.mergeCells(`G${R}:H${R}`);
  const c27 = ws.getCell(`G${R}`);
  c27.value = rt(27, "Fracción año gravable siguiente", "NO");
  c27.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  c27.alignment = aln("left","top",true);

  // I-K: Casilla 28 uno por ciento
  ws.mergeCells(`I${R}:K${R}`);
  const c28 = ws.getCell(`I${R}`);
  c28.value = rt(28, "Uno por ciento (1%) de compras con factura electrónica", "");
  c28.border = { top:THIN.top, left:THIN.left, bottom:med(), right:thick() };
  c28.alignment = aln("left","top",true);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 4: PATRIMONIO (29 / 30 / 31)
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 18;

  // A: Título "Patrimonio"
  const cPatLabel = ws.getCell(`A${R}`);
  cPatLabel.value     = "Patrimonio";
  cPatLabel.font      = font(7, true);
  cPatLabel.fill      = fill(CLR.blueLight);
  cPatLabel.border    = { top:THIN.top, left:thick(), bottom:med(), right:med() };
  cPatLabel.alignment = aln("center","middle",false);

  // B-C: 29 Total patrimonio bruto
  ws.mergeCells(`B${R}:C${R}`);
  const p29 = ws.getCell(`B${R}`);
  p29.value = rt(29, "Total patrimonio bruto", D.c29, true);
  p29.fill  = fill(CLR.blueLight);
  p29.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  p29.alignment = aln("left","top",true);

  // D-E: 30 Deudas
  ws.mergeCells(`D${R}:F${R}`);
  const p30 = ws.getCell(`D${R}`);
  p30.value = rt(30, "Deudas", D.c30, true);
  p30.fill  = fill(CLR.blueLight);
  p30.border = { top:THIN.top, left:THIN.left, bottom:med(), right:THIN.right };
  p30.alignment = aln("left","top",true);

  // G-K: 31 Total patrimonio líquido
  ws.mergeCells(`G${R}:K${R}`);
  const p31 = ws.getCell(`G${R}`);
  p31.value = rt(31, "Total patrimonio líquido", D.c31, true);
  p31.fill  = fill(CLR.blueLight);
  p31.border = { top:THIN.top, left:THIN.left, bottom:med(), right:thick() };
  p31.alignment = aln("right","top",true);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 5: ENCABEZADO CÉDULA GENERAL (4 columnas)
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 32;

  secCell(ws, `A${R}`, "Conceptos/rentas", CLR.blueLight);
  ws.mergeCells(`B${R}:C${R}`);
  secCell(ws, `B${R}`, "Rentas de trabajo", CLR.blueMid);
  ws.mergeCells(`D${R}:E${R}`);
  const cH2 = ws.getCell(`D${R}`);
  cH2.value     = "Rentas de trabajo que no provengan de una\nrelación laboral o legal y reglamentaria";
  cH2.font      = font(6.5, true);
  cH2.fill      = fill(CLR.blueMid);
  cH2.border    = MED;
  cH2.alignment = aln("center","middle",true);
  ws.mergeCells(`F${R}:G${R}`);
  secCell(ws, `F${R}`, "Rentas de capital", CLR.blueMid);
  ws.mergeCells(`H${R}:I${R}`);
  secCell(ws, `H${R}`, "Rentas no laborales", CLR.blueMid);
  ws.mergeCells(`J${R}:K${R}`);
  secCell(ws, `J${R}`, "Liquidación privada del impuesto", CLR.gray2);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 6: FILAS DE LA CÉDULA GENERAL (32-90) + LIQUIDACIÓN (116-131)
  // ════════════════════════════════════════════════════════════
  // Estructura por fila: [Concepto, c_t, v_t, c_h, v_h, c_c, v_c, c_nl, v_nl]
  // null en casilla = celda deshabilitada (gris)
  const CEDULA = [
    ["Ingresos brutos",                                   32,D.c32,  43,D.c43,  58,D.c58,  74,D.c74],
    ["Devoluciones, rebajas y descuentos",               null,null,null,null,null,null,  75,D.c75],
    ["Ingresos no constitutivos de renta",                33,D.c33,  44,D.c44,  59,D.c59,  76,D.c76],
    ["Costos y deducciones procedentes",                null,null,  45,D.c45,  60,D.c60,  77,D.c77],
    ["Renta líquida",                                     34,D.c34,  46,D.c46,  61,D.c61,  78,D.c78],
    ["Rentas líquidas pasivas - ECE",                   null,null,null,null,  62,D.c62,  79,D.c79],
    ["Aportes vol. AFC, FVP y AVC (art. 126-1 y 126-4)", 35,D.c35,  47,D.c47,  63,D.c63,  80,D.c80],
    ["Otras rentas exentas\n(incluye 25% num. 10 art. 206 E.T.)", 36,D.c36, 48,D.c48, 64,D.c64, 81,D.c81],
    ["Total rentas exentas",                              37,D.c37,  49,D.c49,  65,D.c65,  82,D.c82],
    ["Intereses crédito de vivienda (art. 119 E.T.)",    38,D.c38,  50,D.c50,  66,D.c66,  83,D.c83],
    ["Otras deducciones imputables\n(Dependientes, Salud, GMF, art. 387)", 39,D.c39, 51,D.c51, 67,D.c67, 84,D.c84],
    ["Total deducciones imputables",                      40,D.c40,  52,D.c52,  68,D.c68,  85,D.c85],
    ["Rentas exentas y/o deducciones imputables\n(limitadas 40%/1.340 UVT art. 336)", 41,D.c41, 53,D.c53, 69,D.c69, 86,D.c86],
    ["Renta líquida ordinaria del ejercicio",           null,null,  54,D.c54,  70,D.c70,  87,D.c87],
    ["Pérdida líquida del ejercicio",                   null,null,  55,D.c55,  71,D.c71,  88,D.c88],
    ["Compensaciones por pérdidas de ejercicios anteriores",null,null,56,D.c56,72,D.c72,89,D.c89],
    ["Renta líquida ordinaria",                           42,D.c42,  57,D.c57,  73,D.c73,  90,D.c90],
  ];

  // Liquidación privada (paralela a cédula)
  const LIQ = [
    [116,"Impuesto sobre rentas líquidas gravables de la cédula general, pensiones y dividendos",D.c116],
    [117,"Impuesto sobre renta presuntiva",D.c117],
    [118,"Impuesto 2a. subcédula 2017 y sig. (art. 240)",D.c118],
    [119,"Impuesto dividendos 2016 y anteriores",D.c119],
    [120,"Impuesto s/ dividendos y participaciones del exterior",D.c120],
    [121,"Total impuesto sobre rentas líquidas gravables",D.c121,true],
    [null,"DESCUENTOS TRIBUTARIOS",null,false,true],  // encabezado sección
    [122,"Impuestos pagados en el exterior (arts. 254 y 255)",D.c122],
    [123,"Donaciones (art. 257)",D.c123],
    [124,"Dividendos, participaciones y otros (art. 258-1)",D.c124],
    [125,"Total descuentos tributarios",D.c125,true],
    [126,"Impuesto neto de renta",D.c126,true],
    [127,"Impuesto de ganancias ocasionales",D.c127],
    [128,"Descuento tributario por impuestos pagados en el exterior por GO",D.c128],
    [129,"Total impuesto a cargo",D.c129,true],
    [130,"Anticipo renta liquidado año gravable anterior (casilla 133 dec. ant.)",D.c130],
    [131,"Saldo a favor año gravable anterior sin solicitud de devolución",D.c131],
  ];

  for (let i = 0; i < Math.max(CEDULA.length, LIQ.length); i++) {
    ws.getRow(R).height = 18;
    const cr = CEDULA[i];
    const lr = LIQ[i];
    const isAlt = i % 2 === 1;
    const rowBg = isAlt ? CLR.gray1 : CLR.white;

    // ── Cédula general (cols A..I) ──────────────────────────
    if (cr) {
      const cA = ws.getCell(`A${R}`);
      cA.value     = cr[0];
      cA.font      = font(7);
      cA.fill      = fill(rowBg);
      cA.border    = { top:THIN.top, left:thick(), bottom:THIN.bottom, right:THIN.right };
      cA.alignment = aln("left","middle",true);

      const cols4 = [
        ["B","C", cr[1], cr[2]],
        ["D","E", cr[3], cr[4]],
        ["F","G", cr[5], cr[6]],
        ["H","I", cr[7], cr[8]],
      ];
      for (const [colN, colV, casNum, val] of cols4) {
        const cN = ws.getCell(`${colN}${R}`);
        const cV = ws.getCell(`${colV}${R}`);
        if (casNum === null) {
          cN.fill = fill(CLR.gray3); cN.border = THIN;
          cV.fill = fill(CLR.gray3); cV.border = THIN;
        } else {
          cN.value     = String(casNum);
          cN.font      = font(6, true, CLR.blueNum);
          cN.alignment = aln("left","top",false);
          cN.border    = THIN;
          cN.fill      = fill(rowBg);
          cV.value     = val ?? 0;
          cV.font      = font(8);
          cV.numFmt    = "#,##0";
          cV.alignment = aln("right","middle",false);
          cV.border    = THIN;
          cV.fill      = fill(val ? rowBg : CLR.white);
        }
      }
    } else {
      for (const col of ["A","B","C","D","E","F","G","H","I"]) {
        ws.getCell(`${col}${R}`).border = THIN;
      }
    }

    // ── Liquidación privada (cols J..K) ─────────────────────
    ws.mergeCells(`J${R}:K${R}`);
    const jk = ws.getCell(`J${R}`);
    if (lr) {
      if (lr[4] === true) {
        // Encabezado de sub-sección
        jk.value     = lr[1];
        jk.font      = font(7, true, CLR.black);
        jk.fill      = fill(CLR.gray2);
        jk.border    = MED;
        jk.alignment = aln("center","middle",false);
      } else if (lr[0] !== null) {
        jk.value     = rt(lr[0], lr[1], lr[2], lr[3] ?? false);
        jk.alignment = aln("left","top",true);
        jk.border    = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
        jk.fill      = fill((lr[3] ?? false) ? CLR.yellow : CLR.white);
      } else {
        jk.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
      }
    } else {
      jk.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
    }
    R++;
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 7: DEPURACIÓN CÉDULA GENERAL (91-98)
  // ════════════════════════════════════════════════════════════
  // Fila 91,92,93,94 + Liq: Retenciones 132
  ws.getRow(R).height = 18;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);
  ws.mergeCells(`J${R}:K${R}`);

  const dep1 = [[`A${R}`,91,"Renta líquida cédula general",D.c91,false],
                 [`C${R}`,92,"Rentas exentas y deduc. limitadas",D.c92,false],
                 [`E${R}`,93,"R. líq. ord. cédula general",D.c93,true],
                 [`G${R}`,94,"Comp. pérdidas 2017 y ant.",D.c94,false]];
  for (const [addr,num,lbl,val,bold] of dep1) {
    const c = ws.getCell(addr);
    c.value = rt(num, lbl, val, bold);
    c.fill  = fill(bold ? CLR.yellow : CLR.blueLight);
    c.border = { top:med(CLR.blue210), left:med(CLR.blue210), bottom:med(CLR.blue210), right:med(CLR.blue210) };
    c.alignment = aln("left","top",true);
  }
  ws.getCell(`I${R}`).border = { top:med(CLR.blue210), left:THIN.left, bottom:med(CLR.blue210), right:THIN.right };
  ws.getCell(`I${R}`).fill = fill(CLR.blueLight);
  const jk132 = ws.getCell(`J${R}`);
  jk132.value = rt(132, "Retenciones año gravable a declarar", D.c132);
  jk132.alignment = aln("left","top",true);
  jk132.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
  R++;

  // Fila 95,96,97,98 + Liq: Anticipo 133
  ws.getRow(R).height = 18;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);
  ws.mergeCells(`J${R}:K${R}`);

  const dep2 = [[`A${R}`,95,"Comp. exceso renta presuntiva",D.c95,false],
                 [`C${R}`,96,"Rentas gravables",D.c96,false],
                 [`E${R}`,97,"R. líq. grav. cédula general",D.c97,true],
                 [`G${R}`,98,"Renta presuntiva",D.c98,false]];
  for (const [addr,num,lbl,val,bold] of dep2) {
    const c = ws.getCell(addr);
    c.value = rt(num, lbl, val, bold);
    c.fill  = fill(bold ? CLR.yellow : CLR.blueLight);
    c.border = { top:med(CLR.blue210), left:med(CLR.blue210), bottom:med(CLR.blue210), right:med(CLR.blue210) };
    c.alignment = aln("left","top",true);
  }
  ws.getCell(`I${R}`).border = { top:med(CLR.blue210), left:THIN.left, bottom:med(CLR.blue210), right:THIN.right };
  ws.getCell(`I${R}`).fill = fill(CLR.blueLight);
  const jk133 = ws.getCell(`J${R}`);
  jk133.value = rt(133, "Anticipo renta año gravable siguiente", D.c133);
  jk133.alignment = aln("left","top",true);
  jk133.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 8: SECCIÓN INFERIOR
  //   Izquierda A-I: Pensiones / Dividendos / GO
  //   Derecha J-K:   Totales y Firmas
  // ════════════════════════════════════════════════════════════
  // Datos izquierda
  const LEFT_DATA = [
    // [tipo, casilla, etiqueta, valor, bold]
    // tipo: "sec" = encabezado, "row" = fila normal
    ["sec", null, "CÉDULA DE PENSIONES", null, false],
    ["row", 99,  "Ingresos brutos pensiones", D.c99],
    ["row", 100, "Ingresos no constitutivos de renta", D.c100],
    ["row", 101, "Renta líquida pensiones", D.c101],
    ["row", 102, "Rentas exentas pensiones (art. 206-1)", D.c102],
    ["row", 103, "Renta líquida gravable de pensiones", D.c103, true],
    ["sec", null, "CÉDULA DE DIVIDENDOS Y/O PARTICIPACIONES", null, false],
    ["row", 104, "Dividendos año 2016 y anteriores", D.c104],
    ["row", 105, "INCRNGO dividendos año 2016 y anteriores", D.c105],
    ["row", 106, "Renta líquida ordinaria 2016 y anteriores", D.c106],
    ["row", 107, "1a. Subcédula 2017 y sig. (num. 3 art. 49)", D.c107],
    ["row", 108, "2a. Subcédula 2017 y sig. (par. 2 art. 49)", D.c108],
    ["row", 109, "Dividendos y participaciones del exterior", D.c109],
    ["row", 110, "Rentas exentas de la casilla 109", D.c110],
    ["row", 111, "Renta líq. grav. dividendos (base art. 241)", D.c111, true],
    ["sec", null, "GANANCIAS OCASIONALES", null, false],
    ["row", 112, "Ingresos por ganancias ocasionales", D.c112],
    ["row", 113, "Costos por ganancias ocasionales", D.c113],
    ["row", 114, "Ganancias ocasionales no gravadas y exentas", D.c114],
    ["row", 115, "Ganancias ocasionales gravables", D.c115, true],
  ];

  // Datos derecha
  const RIGHT_DATA = [
    ["sec", null, "SALDOS Y DATOS INFORMATIVOS", null],
    ["row", 134, "Saldo a pagar por impuesto", D.c134],
    ["row", 135, "Sanciones", D.c135],
    ["tot", 136, "TOTAL SALDO A PAGAR", D.c136, "red"],
    ["tot", 137, "TOTAL SALDO A FAVOR", D.c137, "green"],
    ["row", 138, "Número de dependientes económicos", D.c138],
    ["row", 139, "Adición al límite de deducciones (cas. 92 art. 336 inc. 2)", D.c139],
    ["row", 140, "Superó tope 60% de costos y gastos (art. 336-1)", D.c140 ? "X" : ""],
    ["row", 141, "Aporte voluntario (art. 126-4)", D.c141],
    ["sec", null, "FIRMAS Y PAGO OFICIAL", null],
    ["tot", 980, "PAGO TOTAL $", D.c980, "yellow"],
    ["row", 981, "Cód. Representación / Firma del Declarante", `${D.n1} ${D.n2} ${D.ap1} ${D.ap2}`],
    ["row", 982, "Cód. Contador Público", "0"],
    ["row", 983, "Número Tarjeta Profesional", "—"],
    ["row", 994, "Con salvedades (1=SÍ, 2=NO)", "2"],
    ["row", 997, "Espacio exclusivo sello entidad recaudadora", ""],
    ["row", 996, "No. interno DIAN / Adhesivo", ""],
    null, null, null,
  ];

  const maxRows = Math.max(LEFT_DATA.length, RIGHT_DATA.length);
  for (let i = 0; i < maxRows; i++) {
    ws.getRow(R).height = 17;
    const ld = LEFT_DATA[i];
    const rd = RIGHT_DATA[i];

    // ── Izquierda A-I ──────────────────────────────────────
    if (ld && ld[0] === "sec") {
      ws.mergeCells(`A${R}:I${R}`);
      const sh = ws.getCell(`A${R}`);
      sh.value     = ld[2];
      sh.font      = font(7, true);
      sh.fill      = fill(CLR.blueLight);
      sh.border    = { top:med(), left:thick(), bottom:med(), right:THIN.right };
      sh.alignment = aln("left","middle",false);
    } else if (ld && ld[0] === "row") {
      ws.mergeCells(`A${R}:B${R}`);
      ws.mergeCells(`C${R}:I${R}`);
      const la = ws.getCell(`A${R}`);
      la.value = { richText: [
        { font: font(6, true, CLR.blueNum), text: `${ld[1]} ` },
        { font: font(6.5), text: ld[2] }
      ]};
      la.alignment = aln("left","middle",true);
      la.border = { top:THIN.top, left:thick(), bottom:THIN.bottom, right:THIN.right };
      if (ld[4] === true) la.fill = fill(CLR.yellow);

      const lv = ws.getCell(`C${R}`);
      lv.value = typeof ld[3] === "number" ? ld[3] : (ld[3] ?? 0);
      lv.font  = font(8, ld[4] === true);
      if (typeof ld[3] === "number") lv.numFmt = "#,##0";
      lv.alignment = aln("right","middle",false);
      lv.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:THIN.right };
      if (ld[4] === true) lv.fill = fill(CLR.yellow);
    } else {
      // Vacía
      ws.mergeCells(`A${R}:I${R}`);
      ws.getCell(`A${R}`).border = { top:THIN.top, left:thick(), bottom:THIN.bottom, right:THIN.right };
    }

    // ── Derecha J-K ────────────────────────────────────────
    ws.mergeCells(`J${R}:K${R}`);
    const rjk = ws.getCell(`J${R}`);
    if (rd && rd[0] === "sec") {
      rjk.value     = rd[2];
      rjk.font      = font(7, true);
      rjk.fill      = fill(CLR.gray2);
      rjk.border    = { top:med(), left:THIN.left, bottom:med(), right:thick() };
      rjk.alignment = aln("center","middle",false);
    } else if (rd && rd[0] === "tot") {
      const bgMap = { red: CLR.redBg, green: CLR.greenBg, yellow: CLR.yellow };
      rjk.value = rt(rd[1], rd[2], rd[3], true);
      rjk.fill  = fill(bgMap[rd[4]] ?? CLR.yellow);
      rjk.border = { top:med(), left:THIN.left, bottom:med(), right:thick() };
      rjk.alignment = aln("left","top",true);
    } else if (rd && rd[0] === "row" && rd[1] !== null) {
      rjk.value = rt(rd[1], rd[2], rd[3]);
      rjk.alignment = aln("left","top",true);
      rjk.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
    } else {
      rjk.border = { top:THIN.top, left:THIN.left, bottom:THIN.bottom, right:thick() };
    }
    R++;
  }

  // Borde inferior del formulario
  ws.mergeCells(`A${R}:K${R}`);
  ws.getCell(`A${R}`).border = { top:thick(), left:thick(), right:thick() };
  ws.getRow(R).height = 2;

  // ════════════════════════════════════════════════════════════
  // GUARDAR
  // ════════════════════════════════════════════════════════════
  await wb.xlsx.writeFile(OUT);
  console.log(`✅ Generado: ${OUT}`);
  console.log(`   Filas: ${R}`);
}

build().catch(e => { console.error("❌", e.message); console.error(e.stack); process.exit(1); });
