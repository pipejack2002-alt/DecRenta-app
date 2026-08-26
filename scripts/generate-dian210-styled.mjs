/**
 * Formulario_210_2024_DIAN_Visual.xlsx
 * Réplica del PDF oficial Formulario_210_2024.pdf de la DIAN
 *
 * Estructura exacta del PDF:
 *  Cols: A(vert label 3), B(concepto 26), C(cas 4), D(trab 12), E(cas 4), F(honor 12),
 *        G(cas 4), H(cap 12), I(cas 4), J(nolabor 12), K(cas 4), L(liq 17)
 *
 *  Filas 1-3:  Encabezado DIAN | Título | Espacio | 210
 *  Fila 4:     Año | Espacio DIAN | No. Formulario
 *  Fila 5:     Espacio grande reservado DIAN
 *  Fila 6:     Datos declarante (NIT/DV/Apellidos/Nombres/Seccional)
 *  Fila 7:     Datos declarante (CIIU/Corr/25/26/27/28)
 *  Fila 8:     Patrimonio (29/30/31)
 *  Fila 9:     Encabezado 5 columnas cédula
 *  Filas 10-26: Cédula general (32-90) + etiqueta "Cédula general" vertical + liquidación (116-131)
 *  Fila 27-28: Depuración (91-98) + Retenciones (132-133)
 *  Filas 29+:  Pensiones/Dividendos/GO (izq) + Totales/Firmas (der)
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "Formulario_210_2024_DIAN_Visual.xlsx");

// ── Colores exactos del PDF DIAN ──────────────────────────────
const C = {
  blue210:  "FF2D6187",  // Caja "210" azul institucional
  blueMid:  "FFBDD7EE",  // Encabezados de columna cédula
  blueLt:   "FFD6E4F0",  // Fondo claro secciones/patrimonio
  blueNum:  "FF2E74B5",  // Numeración de casillas
  grayHdr:  "FFD9D9D9",  // Fondo gris encabezados de sección
  grayRow:  "FFF2F2F2",  // Filas pares alternadas
  grayDis:  "FFBFBFBF",  // Celda deshabilitada (no aplica)
  yellow:   "FFFFF2CC",  // Totales importantes
  redPay:   "FFFCE4EC",  // Saldo a pagar (fondo rosado)
  greenFav: "FFE8F5E9",  // Saldo a favor (fondo verde)
  white:    "FFFFFFFF",
  black:    "FF000000",
};

// ── Helpers ───────────────────────────────────────────────────
const bdr = (style, argb = C.black) => ({ style, color: { argb } });
const THIN = { top:bdr("thin"), left:bdr("thin"), bottom:bdr("thin"), right:bdr("thin") };
const MED  = { top:bdr("medium"), left:bdr("medium"), bottom:bdr("medium"), right:bdr("medium") };
const THICK = { top:bdr("thick"), left:bdr("thick"), bottom:bdr("thick"), right:bdr("thick") };

function borderOf(t,l,b,r) { return { top:t, left:l, bottom:b, right:r }; }
const T=bdr("thin"), M=bdr("medium"), TK=bdr("thick");
const TKb = argb => bdr("thick", argb);
const Mb  = argb => bdr("medium", argb);

const fill = argb => ({ type:"pattern", pattern:"solid", fgColor:{ argb } });
const fnt  = (sz, bold=false, argb=C.black, name="Arial") => ({ name, size:sz, bold, color:{ argb } });
const aln  = (h="left", v="middle", wrap=true) => ({ horizontal:h, vertical:v, wrapText:wrap });

/** Celda con número de casilla (pequeño arriba) y valor (grande abajo) */
function richCell(ws, addr, casNum, label, val, opts = {}) {
  const c = ws.getCell(addr);
  const valStr = val === null || val === undefined ? ""
    : typeof val === "number" ? val.toLocaleString("es-CO")
    : String(val);
  c.value = { richText: [
    casNum !== null ? { font: fnt(5.5, true, C.blueNum), text: `${casNum} ` } : { font: fnt(5.5), text:"" },
    label           ? { font: fnt(5.5, false, "FF444444"), text: `${label}\n` } : { font: fnt(5.5), text:"\n" },
    { font: fnt(8, opts.bold ?? false, C.black), text: valStr },
  ]};
  c.fill      = fill(opts.bg ?? C.white);
  c.border    = opts.border ?? THIN;
  c.alignment = aln(opts.h ?? "left", opts.v ?? "top", true);
  return c;
}

/** Celda de encabezado de sección */
function secHdr(ws, addr, text, bgArgb=C.grayHdr, bold=true, sz=7) {
  const c = ws.getCell(addr);
  c.value     = text;
  c.font      = fnt(sz, bold, C.black);
  c.fill      = fill(bgArgb);
  c.border    = MED;
  c.alignment = aln("center","middle",true);
  return c;
}

/** Celda deshabilitada (gris) */
function dis(ws, addr) {
  const c = ws.getCell(addr);
  c.fill   = fill(C.grayDis);
  c.border = THIN;
  return c;
}

// ── Datos de ejemplo (asalariada DIAN) ───────────────────────
const D = {
  anio:2024, noForm:"2102024000241029",
  nit:"900.123.456", dv:"7",
  ap1:"GARCÍA", ap2:"MÁRQUEZ", n1:"GABRIEL", n2:"JOSÉ", secc:"32 - BOGOTÁ",
  ciiu:"9002",
  c29:420_000_000, c30:85_000_000, c31:335_000_000,
  c32:145_000_000,c33:11_600_000,c34:133_400_000,c35:12_000_000,c36:26_500_000,
  c37:38_500_000,c38:8_400_000,c39:6_460_000,c40:14_860_000,c41:48_720_000,c42:84_680_000,
  c43:0,c44:0,c45:0,c46:0,c47:0,c48:0,c49:0,c50:0,c51:0,c52:0,c53:0,c54:0,c55:0,c56:0,c57:0,
  c58:18_500_000,c59:2_100_000,c60:3_500_000,c61:12_900_000,c62:0,c63:0,c64:0,c65:0,
  c66:0,c67:520_000,c68:520_000,c69:520_000,c70:12_380_000,c71:0,c72:0,c73:12_380_000,
  c74:0,c75:0,c76:0,c77:0,c78:0,c79:0,c80:0,c81:0,c82:0,c83:0,c84:0,c85:0,c86:0,c87:0,c88:0,c89:0,c90:0,
  c91:146_300_000,c92:50_480_000,c93:97_060_000,c94:0,c95:0,c96:0,c97:97_060_000,c98:0,
  c99:0,c100:0,c101:0,c102:0,c103:0,
  c104:0,c105:0,c106:0,c107:4_500_000,c108:0,c109:0,c110:0,c111:4_500_000,
  c112:35_000_000,c113:25_000_000,c114:0,c115:10_000_000,
  c116:14_350_000,c117:0,c118:0,c119:0,c120:0,c121:14_350_000,
  c122:0,c123:0,c124:0,c125:0,
  c126:14_350_000,c127:1_500_000,c128:0,c129:15_850_000,
  c130:2_800_000,c131:0,c132:8_650_000,c133:3_587_500,
  c134:7_987_500,c135:0,c136:7_987_500,c137:0,
  c138:1,c139:3_585_528,c140:false,c141:0,c980:7_987_500,
};

// ── BUILD ─────────────────────────────────────────────────────
async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DecRenta App — Formulario 210 DIAN 2024";
  wb.created = new Date();

  const ws = wb.addWorksheet("Formulario 210 DIAN", {
    properties: { defaultRowHeight: 15 },
    pageSetup: {
      paperSize:9, orientation:"landscape",
      fitToPage:true, fitToWidth:1, fitToHeight:0,
      margins:{ left:0.25, right:0.25, top:0.4, bottom:0.4, header:0, footer:0 },
    },
  });

  // ── Columnas (A-L) ───────────────────────────────────────────
  // A: etiqueta "Cédula general" vertical (estrecha)
  // B: Conceptos/rentas
  // C-D: Trabajo (cas# + val)
  // E-F: Honorarios (cas# + val)
  // G-H: Capital (cas# + val)
  // I-J: No laborales (cas# + val)
  // K-L: Liquidación privada (cas# + val)
  ws.columns = [
    {key:"A", width:3.2},   // vertical label
    {key:"B", width:25},    // concepto
    {key:"C", width:4.2},   // cas# trab
    {key:"D", width:12.5},  // val trab
    {key:"E", width:4.2},   // cas# honor
    {key:"F", width:12.5},  // val honor
    {key:"G", width:4.2},   // cas# cap
    {key:"H", width:12.5},  // val cap
    {key:"I", width:4.2},   // cas# nolabor
    {key:"J", width:12.5},  // val nolabor
    {key:"K", width:4.2},   // cas# liq
    {key:"L", width:18},    // val liq / totales
  ];

  let R = 1;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 1: ENCABEZADO (3 filas)
  //  A:C=DIAN  D:I=Título  J:J=Espacio  K:L=210
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:C${R+2}`);
  ws.mergeCells(`D${R}:I${R+2}`);
  ws.mergeCells(`J${R}:J${R+2}`);
  ws.mergeCells(`K${R}:L${R+2}`);

  const dian = ws.getCell(`A${R}`);
  dian.value     = "DIAN";
  dian.font      = { name:"Arial Black", size:22, bold:true, color:{argb:C.black} };
  dian.alignment = aln("left","middle",false);
  dian.border    = borderOf(TK,TK,TK,M);
  dian.fill      = fill(C.white);

  const titulo = ws.getCell(`D${R}`);
  titulo.value     = "Declaración de renta y complementario personas naturales y asimiladas residentes\ny sucesiones ilíquidas de causantes residentes";
  titulo.font      = fnt(9, true);
  titulo.alignment = aln("center","middle",true);
  titulo.border    = borderOf(TK,M,TK,M);

  const espDian = ws.getCell(`J${R}`);
  espDian.fill   = fill(C.blueLt);
  espDian.border = borderOf(TK,M,TK,M);

  const box210 = ws.getCell(`K${R}`);
  box210.value     = "210";
  box210.font      = { name:"Arial Black", size:36, bold:true, color:{argb:C.white} };
  box210.fill      = fill(C.blue210);
  box210.alignment = aln("center","middle",false);
  box210.border    = borderOf(TK,M,TK,TK);

  ws.getRow(R).height   = 13;
  ws.getRow(R+1).height = 13;
  ws.getRow(R+2).height = 13;
  R += 3;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 2: AÑO + ESPACIO DIAN + No. FORMULARIO
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:C${R}`);
  ws.mergeCells(`D${R}:J${R}`);
  ws.mergeCells(`K${R}:L${R}`);
  ws.getRow(R).height = 14;

  const cAnio = ws.getCell(`A${R}`);
  cAnio.value = { richText:[
    { font: fnt(6,true), text:"1. Año\n" },
    { font: fnt(9,true), text: String(D.anio) },
  ]};
  cAnio.border    = borderOf(M,TK,T,T);
  cAnio.alignment = aln("left","top",true);

  const cEspacio = ws.getCell(`D${R}`);
  cEspacio.value     = "Espacio reservado para la DIAN";
  cEspacio.font      = fnt(7, false, C.blue210);
  cEspacio.border    = borderOf(M,T,T,T);
  cEspacio.alignment = aln("left","middle",false);

  const cForm = ws.getCell(`K${R}`);
  cForm.value = { richText:[
    { font: fnt(6,true), text:"4. Número de formulario\n" },
    { font: fnt(8), text: D.noForm },
  ]};
  cForm.border    = borderOf(M,T,T,TK);
  cForm.alignment = aln("left","top",true);
  R++;

  // Espacio reservado DIAN (fila vacía grande)
  ws.mergeCells(`A${R}:L${R}`);
  ws.getCell(`A${R}`).border = borderOf(T,TK,T,TK);
  ws.getRow(R).height = 26;
  R++;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 3: DATOS DEL DECLARANTE — Fila 1
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 22;
  // Col A: "Datos del declarante" vertical, ocupa 2 filas
  ws.mergeCells(`A${R}:A${R+1}`);
  const dDec = ws.getCell(`A${R}`);
  dDec.value     = "Datos del declarante";
  dDec.font      = fnt(5.5, true);
  dDec.fill      = fill(C.blueLt);
  dDec.border    = borderOf(TK,TK,M,M);
  dDec.alignment = { vertical:"middle", horizontal:"center", textRotation:90, wrapText:true };

  // B: NIT (5)
  const c5 = ws.getCell(`B${R}`);
  c5.value = { richText:[{font:fnt(5.5,true),text:"5. Número de Identificación Tributaria (NIT)\n"},{font:fnt(8),text:D.nit}] };
  c5.border = borderOf(TK,T,T,T); c5.alignment = aln("left","top",true);

  // C: DV (6)
  const c6 = ws.getCell(`C${R}`);
  c6.value = { richText:[{font:fnt(5.5,true),text:"6.DV\n"},{font:fnt(8),text:D.dv}] };
  c6.border = borderOf(TK,T,T,T); c6.alignment = aln("left","top",true);

  // D: Primer apellido (7)
  const c7 = ws.getCell(`D${R}`);
  c7.value = { richText:[{font:fnt(5.5,true),text:"7. Primer apellido\n"},{font:fnt(8),text:D.ap1}] };
  c7.border = borderOf(TK,T,T,T); c7.alignment = aln("left","top",true);

  // E: Segundo apellido (8)
  const c8 = ws.getCell(`E${R}`);
  c8.value = { richText:[{font:fnt(5.5,true),text:"8. Segundo apellido\n"},{font:fnt(8),text:D.ap2}] };
  c8.border = borderOf(TK,T,T,T); c8.alignment = aln("left","top",true);

  // F: Primer nombre (9)
  const c9 = ws.getCell(`F${R}`);
  c9.value = { richText:[{font:fnt(5.5,true),text:"9. Primer nombre\n"},{font:fnt(8),text:D.n1}] };
  c9.border = borderOf(TK,T,T,T); c9.alignment = aln("left","top",true);

  // G: Otros nombres (10)
  const c10 = ws.getCell(`G${R}`);
  c10.value = { richText:[{font:fnt(5.5,true),text:"10. Otros nombres\n"},{font:fnt(8),text:D.n2}] };
  c10.border = borderOf(TK,T,T,T); c10.alignment = aln("left","top",true);

  // H-I vacíos
  ws.getCell(`H${R}`).border = borderOf(TK,T,T,T);
  ws.getCell(`I${R}`).border = borderOf(TK,T,T,T);

  // J-L: Cód. Dirección seccional (12)
  ws.mergeCells(`J${R}:L${R}`);
  const c12 = ws.getCell(`J${R}`);
  c12.value = { richText:[{font:fnt(5.5,true),text:"12.Cód. Dirección seccional\n"},{font:fnt(8),text:D.secc}] };
  c12.border = borderOf(TK,T,T,TK); c12.alignment = aln("left","top",true);
  R++;

  // Fila 2 declarante
  ws.getRow(R).height = 17;
  // B-C: CIIU 24
  ws.mergeCells(`B${R}:C${R}`);
  const c24 = ws.getCell(`B${R}`);
  c24.value = { richText:[{font:fnt(5,true),text:"24. Actividad económica principal\n"},{font:fnt(8),text:D.ciiu}] };
  c24.border = borderOf(T,T,M,T); c24.alignment = aln("left","top",true);

  // D: Si es corrección
  const cCorr = ws.getCell(`D${R}`);
  cCorr.value = { richText:[{font:fnt(5,true),text:"Si es una corrección indique:\n"},{font:fnt(7),text:"NO"}] };
  cCorr.border = borderOf(T,T,M,T); cCorr.alignment = aln("left","top",true);

  // E: 25 Cód
  const c25 = ws.getCell(`E${R}`);
  c25.value = { richText:[{font:fnt(5,true),text:"25. Cód.\n"},{font:fnt(8),text:""}] };
  c25.border = borderOf(T,T,M,T); c25.alignment = aln("left","top",true);

  // F: 26 No. Formulario anterior
  const c26 = ws.getCell(`F${R}`);
  c26.value = { richText:[{font:fnt(5,true),text:"26. No. Formulario anterior\n"},{font:fnt(8),text:""}] };
  c26.border = borderOf(T,T,M,T); c26.alignment = aln("left","top",true);

  // G-H: 27 Fracción año gravable
  ws.mergeCells(`G${R}:H${R}`);
  const c27 = ws.getCell(`G${R}`);
  c27.value = { richText:[{font:fnt(5,true),text:"27. Fracción año gravable siguiente\n"},{font:fnt(8),text:"NO"}] };
  c27.border = borderOf(T,T,M,T); c27.alignment = aln("left","top",true);

  // I-L: 28 Uno por ciento
  ws.mergeCells(`I${R}:L${R}`);
  const c28 = ws.getCell(`I${R}`);
  c28.value = { richText:[{font:fnt(5,true),text:"28. Uno por ciento (1%) de compras con factura electrónica\n"},{font:fnt(8),text:""}] };
  c28.border = borderOf(T,T,M,TK); c28.alignment = aln("left","top",true);
  R++;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 4: PATRIMONIO
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 18;

  const pLabel = ws.getCell(`A${R}`);
  pLabel.value = "Patrimonio"; pLabel.font = fnt(7,true); pLabel.fill = fill(C.blueLt);
  pLabel.border = borderOf(T,TK,M,M); pLabel.alignment = aln("center","middle",false);

  ws.mergeCells(`B${R}:D${R}`);
  const p29 = ws.getCell(`B${R}`);
  p29.value = { richText:[{font:fnt(5.5,true),text:"Total patrimonio bruto  "},{font:fnt(6,true,C.blueNum),text:"29\n"},{font:fnt(9,true),text:D.c29.toLocaleString("es-CO")}] };
  p29.fill = fill(C.blueLt); p29.border = borderOf(T,T,M,T); p29.alignment = aln("left","top",true);

  ws.mergeCells(`E${R}:G${R}`);
  const p30 = ws.getCell(`E${R}`);
  p30.value = { richText:[{font:fnt(5.5,true),text:"Deudas  "},{font:fnt(6,true,C.blueNum),text:"30\n"},{font:fnt(9,true),text:D.c30.toLocaleString("es-CO")}] };
  p30.fill = fill(C.blueLt); p30.border = borderOf(T,T,M,T); p30.alignment = aln("left","top",true);

  ws.mergeCells(`H${R}:L${R}`);
  const p31 = ws.getCell(`H${R}`);
  p31.value = { richText:[{font:fnt(5.5,true),text:"Total patrimonio líquido  "},{font:fnt(6,true,C.blueNum),text:"31\n"},{font:fnt(9,true),text:D.c31.toLocaleString("es-CO")}] };
  p31.fill = fill(C.blueLt); p31.border = borderOf(T,T,M,TK); p31.alignment = aln("right","top",true);
  R++;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 5: ENCABEZADO CÉDULA GENERAL (5 columnas + liq)
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 30;

  // A: vacío (alineado con la etiqueta "Cédula general" que viene después)
  const chA = ws.getCell(`A${R}`);
  chA.fill = fill(C.blueLt); chA.border = borderOf(T,TK,T,M);

  secHdr(ws, `B${R}`, "Conceptos/rentas", C.blueLt, true, 7);
  ws.getCell(`B${R}`).border = borderOf(T,M,T,M);

  ws.mergeCells(`C${R}:D${R}`);
  const h1 = secHdr(ws, `C${R}`, "Rentas de trabajo", C.blueMid, true, 7);
  h1.border = borderOf(T,M,T,M);

  ws.mergeCells(`E${R}:F${R}`);
  const h2 = ws.getCell(`E${R}`);
  h2.value = "Rentas de trabajo que no provengan de una relación laboral o legal y reglamentaria";
  h2.font = fnt(6.5,true); h2.fill = fill(C.blueMid); h2.border = borderOf(T,M,T,M);
  h2.alignment = aln("center","middle",true);

  ws.mergeCells(`G${R}:H${R}`);
  const h3 = secHdr(ws, `G${R}`, "Rentas de capital", C.blueMid, true, 7);
  h3.border = borderOf(T,M,T,M);

  ws.mergeCells(`I${R}:J${R}`);
  const h4 = secHdr(ws, `I${R}`, "Rentas no laborales", C.blueMid, true, 7);
  h4.border = borderOf(T,M,T,M);

  ws.mergeCells(`K${R}:L${R}`);
  const hLiq = secHdr(ws, `K${R}`, "Liquidación privada del impuesto", C.grayHdr, true, 7);
  hLiq.border = borderOf(T,M,T,TK);
  R++;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 6: CÉDULA GENERAL (filas 32-90) + LIQUIDACIÓN (116-131)
  //  Col A = etiqueta vertical "Cédula general" mergeada todo el bloque
  // ════════════════════════════════════════════════════════════

  // Rows del cedulario: [concepto, c_t, v_t, c_h, v_h, c_c, v_c, c_nl, v_nl, bgArgb]
  // bgArgb: null = alternado blanco/gris, else = fondo fijo (ej blueLt para exentas/deducciones)
  const CEDULA = [
    ["Ingresos brutos",                                    32,D.c32,  43,D.c43,  58,D.c58,  74,D.c74],
    ["Devoluciones, rebajas y descuentos",                null,null, null,null, null,null,  75,D.c75],
    ["Ingresos no constitutivos de renta",                 33,D.c33,  44,D.c44,  59,D.c59,  76,D.c76],
    ["Costos y deducciones procedentes",                 null,null,   45,D.c45,  60,D.c60,  77,D.c77],
    ["Renta líquida",                                      34,D.c34,  46,D.c46,  61,D.c61,  78,D.c78],
    ["Rentas líquidas pasivas - ECE",                    null,null,  null,null,  62,D.c62,  79,D.c79],
    ["Aportes vol. AFC, FVP y AVC (art. 126-1 y 126-4)",  35,D.c35,  47,D.c47,  63,D.c63,  80,D.c80, C.blueLt],
    ["Otras rentas exentas (incluye 25% num. 10 art. 206 E.T.)", 36,D.c36, 48,D.c48, 64,D.c64, 81,D.c81, C.blueLt],
    ["Total rentas exentas",                               37,D.c37,  49,D.c49,  65,D.c65,  82,D.c82, C.blueLt],
    ["Intereses crédito de vivienda (art. 119 E.T.)",      38,D.c38,  50,D.c50,  66,D.c66,  83,D.c83, C.blueMid],
    ["Otras deducciones imputables\n(Dependientes, Salud, GMF, art. 387 E.T.)", 39,D.c39, 51,D.c51, 67,D.c67, 84,D.c84, C.blueMid],
    ["Total deducciones imputables",                       40,D.c40,  52,D.c52,  68,D.c68,  85,D.c85, C.blueMid],
    ["Rentas exentas y/o deducciones imputables\n(limitadas 40%/1.340 UVT art. 336)", 41,D.c41, 53,D.c53, 69,D.c69, 86,D.c86],
    ["Renta líquida ordinaria del ejercicio",            null,null,   54,D.c54,  70,D.c70,  87,D.c87],
    ["Pérdida líquida del ejercicio",                    null,null,   55,D.c55,  71,D.c71,  88,D.c88],
    ["Compensaciones por pérdidas de ejercicios anteriores",null,null,56,D.c56, 72,D.c72,  89,D.c89],
    ["Renta líquida ordinaria",                            42,D.c42,  57,D.c57,  73,D.c73,  90,D.c90],
  ];

  const LIQ = [
    [116,"Impuesto s/ ren. líq. grav. cédula gral., pensiones y dividendos",D.c116],
    [117,"Impuesto sobre renta presuntiva",D.c117],
    [118,"Impuesto 2a. subcédula 2017 y sig. (art. 240 E.T.)",D.c118],
    [119,"Impuesto dividendos 2016 y anteriores",D.c119],
    [120,"Impuesto s/ dividendos y particip. del exterior",D.c120],
    [121,"Total impuesto sobre rentas líquidas gravables",D.c121,true],
    [null,"DESCUENTOS TRIBUTARIOS",null,false,true],
    [122,"Impuestos pagados en el exterior (arts. 254 y 255)",D.c122],
    [123,"Donaciones (art. 257)",D.c123],
    [124,"Dividendos, participaciones y otros (art. 258-1)",D.c124],
    [125,"Total descuentos tributarios",D.c125,true],
    [126,"Impuesto neto de renta",D.c126,true],
    [127,"Impuesto de ganancias ocasionales",D.c127],
    [128,"Desc. tributario por imp. pagados en el exterior por GO",D.c128],
    [129,"Total impuesto a cargo",D.c129,true],
    [130,"Anticipo renta liquidado año gravable anterior",D.c130],
    [131,"Saldo a favor año gravable anterior sin sol. de devolución",D.c131],
  ];

  // Merge la columna A para toda la cédula general
  const cedulaStartR = R;
  const cedulaEndR   = R + Math.max(CEDULA.length, LIQ.length) - 1;
  ws.mergeCells(`A${cedulaStartR}:A${cedulaEndR}`);
  const cgLabel = ws.getCell(`A${cedulaStartR}`);
  cgLabel.value     = "Cédula general";
  cgLabel.font      = fnt(7, true, C.white);
  cgLabel.fill      = fill(C.blue210);
  cgLabel.border    = borderOf(T, TK, T, M);
  cgLabel.alignment = { vertical:"middle", horizontal:"center", textRotation:90, wrapText:false };

  for (let i = 0; i < Math.max(CEDULA.length, LIQ.length); i++) {
    ws.getRow(R).height = 18;
    const cr = CEDULA[i];
    const lr = LIQ[i];
    const rowBg = cr?.[9] ?? (i % 2 === 1 ? C.grayRow : C.white);

    // B: concepto
    if (cr) {
      const cB = ws.getCell(`B${R}`);
      cB.value     = cr[0];
      cB.font      = fnt(7);
      cB.fill      = fill(rowBg);
      cB.border    = borderOf(T, M, T, T);
      cB.alignment = aln("left","middle",true);

      // C-D: trabajo, E-F: honor, G-H: capital, I-J: nolabor
      const cols4 = [["C","D",cr[1],cr[2]],["E","F",cr[3],cr[4]],["G","H",cr[5],cr[6]],["I","J",cr[7],cr[8]]];
      for (const [cCas,cVal,casN,val] of cols4) {
        const cc = ws.getCell(`${cCas}${R}`);
        const cv = ws.getCell(`${cVal}${R}`);
        if (casN === null) {
          cc.fill = fill(C.grayDis); cc.border = THIN;
          cv.fill = fill(C.grayDis); cv.border = THIN;
        } else {
          cc.value     = String(casN);
          cc.font      = fnt(6.5, true, C.blueNum);
          cc.alignment = aln("left","top",false);
          cc.border    = THIN;
          cc.fill      = fill(rowBg);
          cv.value     = val ?? 0;
          cv.font      = fnt(8);
          cv.numFmt    = "#,##0";
          cv.alignment = aln("right","middle",false);
          cv.border    = THIN;
          cv.fill      = fill(rowBg);
        }
      }
    } else {
      for (const col of ["B","C","D","E","F","G","H","I","J"]) {
        ws.getCell(`${col}${R}`).border = THIN;
      }
    }

    // K-L: Liquidación privada
    ws.mergeCells(`K${R}:L${R}`);
    const kl = ws.getCell(`K${R}`);
    if (lr) {
      if (lr[4] === true) {
        // Sub-encabezado sección (ej "DESCUENTOS TRIBUTARIOS")
        kl.value     = lr[1];
        kl.font      = fnt(7, true);
        kl.fill      = fill(C.grayHdr);
        kl.border    = borderOf(T, T, T, TK);
        kl.alignment = aln("center","middle",false);
      } else if (lr[0] !== null) {
        kl.value = { richText:[
          {font:fnt(6,true,C.blueNum), text:`${lr[0]} `},
          {font:fnt(6,false,"FF444444"), text:`${lr[1]}\n`},
          {font:fnt(8, lr[3]??false), text: typeof lr[2]==="number" ? lr[2].toLocaleString("es-CO") : ""},
        ]};
        kl.alignment = aln("left","top",true);
        kl.border    = borderOf(T, T, T, TK);
        kl.fill      = fill((lr[3]??false) ? C.yellow : C.white);
      } else {
        kl.border = borderOf(T, T, T, TK);
      }
    } else {
      kl.border = borderOf(T, T, T, TK);
    }
    R++;
  }

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 7: DEPURACIÓN CÉDULA GENERAL (91-98)
  // ════════════════════════════════════════════════════════════
  // Fila 1: 91, 92, 93, 94 | Liquidación: Retenciones 132
  ws.getRow(R).height = 17;
  // A: vacío (continúa el borde)
  ws.getCell(`A${R}`).border = borderOf(T, TK, T, M);
  ws.getCell(`A${R}`).fill  = fill(C.blueLt);

  ws.mergeCells(`B${R}:C${R}`);
  ws.mergeCells(`D${R}:E${R}`);
  ws.mergeCells(`F${R}:G${R}`);
  ws.mergeCells(`H${R}:I${R}`);
  ws.mergeCells(`J${R}:J${R}`);
  ws.mergeCells(`K${R}:L${R}`);

  const dep1Data = [
    [`B${R}`, 91, "Ren. líq. cédula gral.", D.c91, false],
    [`D${R}`, 92, "Ren. ex. y ded. imp. lim.", D.c92, false],
    [`F${R}`, 93, "R. líq. ord. cédula gral.", D.c93, true],
    [`H${R}`, 94, "Comp. pérd. 2017 y ant.", D.c94, false],
  ];
  for (const [addr,num,lbl,val,bold] of dep1Data) {
    const c = ws.getCell(addr);
    c.value = { richText:[
      {font:fnt(6,true,C.blueNum), text:`${num} `},
      {font:fnt(5.5,false,"FF444444"), text:`${lbl}\n`},
      {font:fnt(8,bold), text: val.toLocaleString("es-CO")},
    ]};
    c.fill = fill(bold ? C.yellow : C.blueLt);
    c.border = borderOf(Mb(C.blue210), Mb(C.blue210), Mb(C.blue210), Mb(C.blue210));
    c.alignment = aln("left","top",true);
  }
  // J: espacio (parte de depuración)
  const jDep1 = ws.getCell(`J${R}`);
  jDep1.fill = fill(C.blueLt);
  jDep1.border = borderOf(Mb(C.blue210), Mb(C.blue210), Mb(C.blue210), Mb(C.blue210));

  // K-L: Retenciones 132
  const kl132 = ws.getCell(`K${R}`);
  kl132.value = { richText:[
    {font:fnt(6,true,C.blueNum), text:"132 "},
    {font:fnt(5.5,false,"FF444444"), text:"Retenciones año gravable a declarar\n"},
    {font:fnt(8), text: D.c132.toLocaleString("es-CO")},
  ]};
  kl132.alignment = aln("left","top",true);
  kl132.border = borderOf(T,T,T,TK);
  R++;

  // Fila 2 depuración: 95, 96, 97, 98 | Liquidación: Anticipo 133
  ws.getRow(R).height = 17;
  ws.getCell(`A${R}`).border = borderOf(T, TK, M, M);
  ws.getCell(`A${R}`).fill  = fill(C.blueLt);

  ws.mergeCells(`B${R}:C${R}`);
  ws.mergeCells(`D${R}:E${R}`);
  ws.mergeCells(`F${R}:G${R}`);
  ws.mergeCells(`H${R}:I${R}`);
  ws.mergeCells(`K${R}:L${R}`);

  const dep2Data = [
    [`B${R}`, 95, "Comp. exc. ren. presuntiva", D.c95, false],
    [`D${R}`, 96, "Rentas gravables", D.c96, false],
    [`F${R}`, 97, "R. líq. grav. cédula gral.", D.c97, true],
    [`H${R}`, 98, "Renta presuntiva", D.c98, false],
  ];
  for (const [addr,num,lbl,val,bold] of dep2Data) {
    const c = ws.getCell(addr);
    c.value = { richText:[
      {font:fnt(6,true,C.blueNum), text:`${num} `},
      {font:fnt(5.5,false,"FF444444"), text:`${lbl}\n`},
      {font:fnt(8,bold), text: val.toLocaleString("es-CO")},
    ]};
    c.fill = fill(bold ? C.yellow : C.blueLt);
    c.border = borderOf(Mb(C.blue210), Mb(C.blue210), Mb(C.blue210), Mb(C.blue210));
    c.alignment = aln("left","top",true);
  }
  const jDep2 = ws.getCell(`J${R}`);
  jDep2.fill = fill(C.blueLt);
  jDep2.border = borderOf(Mb(C.blue210), Mb(C.blue210), Mb(C.blue210), Mb(C.blue210));

  const kl133 = ws.getCell(`K${R}`);
  kl133.value = { richText:[
    {font:fnt(6,true,C.blueNum), text:"133 "},
    {font:fnt(5.5,false,"FF444444"), text:"Anticipo renta año gravable siguiente\n"},
    {font:fnt(8), text: D.c133.toLocaleString("es-CO")},
  ]};
  kl133.alignment = aln("left","top",true);
  kl133.border = borderOf(T,T,T,TK);
  R++;

  // ════════════════════════════════════════════════════════════
  //  BLOQUE 8: SECCIÓN INFERIOR
  //  Columnas A-J = Pensiones / Dividendos / GO
  //  Columnas K-L = Totales / Firmas y Recaudo
  // ════════════════════════════════════════════════════════════
  const LEFT = [
    // [tipo, cas, label, val, bold]
    ["sec", null, "CÉDULA DE PENSIONES"],
    ["row", 99,  "Ingresos brutos de pensiones de jubilación, invalidez, vejez, de sobrevivientes y riesgos profesionales del país y del exterior", D.c99],
    ["row", 100, "Ingresos no constitutivos de renta", D.c100],
    ["row", 101, "Renta líquida", D.c101],
    ["row", 102, "Rentas exentas de pensiones (art. 206-1 E.T.)", D.c102],
    ["row", 103, "Renta líquida gravable de la cédula de pensiones", D.c103, true],
    ["sec", null, "CÉDULAS DE DIVIDENDOS Y/O PARTICIPACIONES"],
    ["row", 104, "Dividendos y participaciones 2016 y anteriores, y otros", D.c104],
    ["row", 105, "Ingresos no constitutivos de renta", D.c105],
    ["row", 106, "Renta líquida ordinaria año 2016 y anteriores", D.c106],
    ["row", 107, "Subcédula 2017 y siguientes Numeral 3 art. 49 del E.T.", D.c107],
    ["row", 108, "Subcédula 2017 y siguientes Parágrafo 2 art. 49 del E.T.", D.c108],
    ["row", 109, "Dividendos y participaciones recibidas del exterior", D.c109],
    ["row", 110, "Rentas exentas de la casilla 109", D.c110],
    ["row", 111, "Renta líquida gravable (Cédula gral.o ren. presuntiva, de pensiones y de dividendos y particip. del exterior)", D.c111, true],
    ["sec", null, "GANANCIAS OCASIONALES"],
    ["row", 112, "Ingresos por ganancias ocasionales del país y del exterior", D.c112],
    ["row", 113, "Costos por ganancias ocasionales", D.c113],
    ["row", 114, "Ganancias ocasionales no gravadas y exentas", D.c114],
    ["row", 115, "Ganancias ocasionales gravables", D.c115, true],
  ];

  const RIGHT = [
    ["sec", null, "SALDOS Y DATOS INFORMATIVOS"],
    ["row", 134, "Saldo a pagar por impuesto", D.c134],
    ["row", 135, "Sanciones", D.c135],
    ["tot", 136, "Total saldo a pagar", D.c136, "red"],
    ["tot", 137, "Total saldo a favor", D.c137, "green"],
    ["row", 138, "Número de dependientes económicos", D.c138],
    ["row", 139, "Adición al límite de deducciones (cas. 92 art. 336 inc. 2)", D.c139],
    ["row", 140, "Superó tope 60% de costos y gastos (art. 336-1)", D.c140 ? "X" : ""],
    ["row", 141, "Aporte voluntario (art. 126-4)", D.c141],
    ["sec", null, "FIRMAS Y PAGO OFICIAL"],
    ["tot", 980, "PAGO TOTAL $", D.c980, "yellow"],
    ["row", 981, "Cód. Representación / Firma del Declarante o de quien lo representa", `${D.n1} ${D.n2} ${D.ap1}`],
    ["row", 982, "Firma Contador Público / 994. Con salvedades", "0"],
    ["row", 983, "No. Tarjeta Profesional", "—"],
    ["row", 997, "Espacio exclusivo para el sello de la entidad recaudadora", ""],
    ["row", 996, "No. para el número interno de la DIAN / Adhesivo", ""],
    null, null, null, null,
  ];

  const maxB = Math.max(LEFT.length, RIGHT.length);
  for (let i = 0; i < maxB; i++) {
    ws.getRow(R).height = 17;
    const ld = LEFT[i];
    const rd = RIGHT[i];

    // Izquierda A-J
    if (ld && ld[0] === "sec") {
      ws.mergeCells(`A${R}:J${R}`);
      const sh = ws.getCell(`A${R}`);
      sh.value     = ld[2];
      sh.font      = fnt(7, true);
      sh.fill      = fill(C.blueLt);
      sh.border    = borderOf(T,TK,T,T);
      sh.alignment = aln("left","middle",false);
    } else if (ld && ld[0] === "row") {
      ws.mergeCells(`A${R}:C${R}`);
      ws.mergeCells(`D${R}:J${R}`);
      const la = ws.getCell(`A${R}`);
      la.value = { richText:[
        {font:fnt(6,true,C.blueNum), text:`${ld[1]} `},
        {font:fnt(6), text: ld[2]},
      ]};
      la.alignment = aln("left","middle",true);
      la.border = borderOf(T,TK,T,T);
      if (ld[4] === true) la.fill = fill(C.yellow);
      const lv = ws.getCell(`D${R}`);
      lv.value = typeof ld[3]==="number" ? ld[3] : (ld[3] ?? 0);
      if (typeof ld[3]==="number") lv.numFmt = "#,##0";
      lv.font = fnt(8, ld[4]===true);
      lv.alignment = aln("right","middle",false);
      lv.border = borderOf(T,T,T,T);
      if (ld[4]===true) lv.fill = fill(C.yellow);
    } else {
      ws.mergeCells(`A${R}:J${R}`);
      ws.getCell(`A${R}`).border = borderOf(T,TK,T,T);
    }

    // Derecha K-L
    ws.mergeCells(`K${R}:L${R}`);
    const rk = ws.getCell(`K${R}`);
    if (rd && rd[0] === "sec") {
      rk.value     = rd[2];
      rk.font      = fnt(7, true);
      rk.fill      = fill(C.grayHdr);
      rk.border    = borderOf(T,T,T,TK);
      rk.alignment = aln("left","middle",false);
    } else if (rd && rd[0] === "tot") {
      const bgM = { red:C.redPay, green:C.greenFav, yellow:C.yellow };
      rk.value = { richText:[
        {font:fnt(6,true,C.blueNum), text:`${rd[1]} `},
        {font:fnt(6,true), text:`${rd[2]}\n`},
        {font:fnt(9,true), text: typeof rd[3]==="number"?rd[3].toLocaleString("es-CO"):""},
      ]};
      rk.fill      = fill(bgM[rd[4]] ?? C.yellow);
      rk.border    = borderOf(M,T,M,TK);
      rk.alignment = aln("left","top",true);
    } else if (rd && rd[0] === "row") {
      rk.value = { richText:[
        {font:fnt(6,true,C.blueNum), text:`${rd[1]} `},
        {font:fnt(5.5), text:`${rd[2]}\n`},
        {font:fnt(8), text: typeof rd[3]==="number"?rd[3].toLocaleString("es-CO"):(rd[3]??"")},
      ]};
      rk.alignment = aln("left","top",true);
      rk.border    = borderOf(T,T,T,TK);
    } else {
      rk.border = borderOf(T,T,T,TK);
    }
    R++;
  }

  // Línea de cierre
  ws.mergeCells(`A${R}:L${R}`);
  ws.getCell(`A${R}`).border = borderOf(TK,TK,TK,TK);
  ws.getRow(R).height = 2;

  // ════════════════════════════════════════════════════════════
  await wb.xlsx.writeFile(OUT);
  console.log(`✅ Generado: ${OUT}`);
  console.log(`   Filas: ${R}`);
}

build().catch(e => { console.error("❌", e.message, "\n", e.stack); process.exit(1); });
