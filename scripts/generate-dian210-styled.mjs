/**
 * Formulario_210_2024_DIAN_Visual.xlsx
 * ======================================
 * Réplica visual fiel del Formulario_210_2024.pdf oficial de la DIAN.
 *
 * ESTRUCTURA DE COLUMNAS (igual al PDF):
 *   A  = Conceptos / rentas       (ancha ~28)
 *   B  = Cas# Renta Trabajo       (estrecha ~4)
 *   C  = Valor Renta Trabajo      (~13)
 *   D  = Cas# Honor/NolabRelac    (~4)
 *   E  = Valor Honor/NolabRelac   (~13)
 *   F  = Cas# Capital             (~4)
 *   G  = Valor Capital            (~13)
 *   H  = Cas# No laborales        (~4)
 *   I  = Valor No laborales       (~13)
 *   J  = Liquidación privada      (única col ancha ~22)
 *
 * Para el ENCABEZADO y secciones superiores las 10 columnas se fusionan según el PDF.
 * La etiqueta "Cédula general" se añade como columna K estrecha rotada 90° igual que
 * el PDF la muestra en el margen del papel (agregada al final para no distorsionar el grid).
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "Formulario_210_2024_DIAN_Visual.xlsx");

// ────────────────────────────────────────────────────────────
// PALETA DE COLORES (extraída del PDF oficial DIAN)
// ────────────────────────────────────────────────────────────
const CLR = {
  blue210:  "FF2D6187",   // Azul caja "210"
  blueHdr:  "FFBDD7EE",   // Azul encabezados de cédula
  blueSec:  "FFD6E4F0",   // Azul claro: secciones / patrimonio / rentas exentas
  blueNum:  "FF2E74B5",   // Azul para número de casilla
  grayBand: "FFD9D9D9",   // Gris encabezado de sección
  grayAlt:  "FFF2F2F2",   // Gris fila alternada
  grayDis:  "FFBFBFBF",   // Gris celda deshabilitada
  yellow:   "FFFFF2CC",   // Amarillo: totales destacados
  redPay:   "FFFCE4EC",   // Rojo claro: saldo a pagar
  greenFav: "FFE8F5E9",   // Verde claro: saldo a favor
  white:    "FFFFFFFF",
  black:    "FF000000",
};

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const b   = (s, argb=CLR.black) => ({ style:s, color:{ argb } });
const T   = b("thin");
const M   = b("medium");
const TK  = b("thick");
const TH  = { top:T, left:T, bottom:T, right:T };
const ME  = { top:M, left:M, bottom:M, right:M };
function bdr(t,l,bo,r){ return { top:t, left:l, bottom:bo, right:r }; }

const fill  = a => ({ type:"pattern", pattern:"solid", fgColor:{ argb:a } });
const font  = (sz,bold=false,argb=CLR.black,name="Arial") => ({ name,size:sz,bold,color:{argb} });
const aln   = (h="left",v="middle",wrap=true) => ({ horizontal:h,vertical:v,wrapText:wrap });

/** Celda estándar con casilla (número arriba-izq) y valor (abajo) */
function casillaCell(ws, addr, casNum, label, val, opts={}) {
  const c = ws.getCell(addr);
  const vs = val===null||val===undefined ? ""
    : typeof val==="number" ? val.toLocaleString("es-CO")
    : String(val);
  c.value = { richText:[
    casNum!==null ? { font:font(5.5,true,CLR.blueNum), text:`${casNum} ` } : { font:font(5.5),text:"" },
    label         ? { font:font(5.5,false,"FF555555"), text:`${label}\n` } : { font:font(5.5),text:"\n" },
    { font:font(opts.sz??8, opts.bold??false), text:vs },
  ]};
  c.fill      = fill(opts.bg ?? CLR.white);
  c.border    = opts.border ?? TH;
  c.alignment = aln(opts.h??"left", opts.v??"top", true);
  return c;
}

/** Encabezado de sección */
function secHdr(ws, addr, text, bg=CLR.grayBand, bold=true, sz=7, txtColor=CLR.black) {
  const c = ws.getCell(addr);
  c.value     = text;
  c.font      = font(sz,bold,txtColor);
  c.fill      = fill(bg);
  c.border    = ME;
  c.alignment = aln("center","middle",true);
  return c;
}

/** Celda deshabilitada */
const dis = (ws, addr) => {
  const c = ws.getCell(addr);
  c.fill = fill(CLR.grayDis); c.border = TH; return c;
};

// ────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO
// ────────────────────────────────────────────────────────────
const D = {
  anio:2024, noForm:"2102024000241029",
  nit:"900.123.456", dv:"7",
  ap1:"GARCÍA",ap2:"MÁRQUEZ",n1:"GABRIEL",n2:"JOSÉ",secc:"32 - BOGOTÁ",ciiu:"9002",
  c29:420_000_000,c30:85_000_000,c31:335_000_000,
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

// ────────────────────────────────────────────────────────────
// BUILD
// ────────────────────────────────────────────────────────────
async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DecRenta — Formulario 210 DIAN 2024";
  wb.created = new Date();

  const ws = wb.addWorksheet("Formulario 210 DIAN", {
    properties:{ defaultRowHeight:15 },
    pageSetup:{
      paperSize:9, orientation:"landscape",
      fitToPage:true, fitToWidth:1, fitToHeight:0,
      margins:{ left:0.25, right:0.25, top:0.4, bottom:0.4, header:0, footer:0 },
    },
  });

  // ── ANCHOS DE COLUMNA ───────────────────────────────────────
  // Igual que el PDF: A=Concepto, B/C=Trab, D/E=Honor, F/G=Cap, H/I=NoLab, J=Liq
  ws.columns = [
    {key:"A", width:25 },   // Conceptos/rentas
    {key:"B", width:4.5},   // Cas# Trabajo
    {key:"C", width:13 },   // Val Trabajo
    {key:"D", width:4.5},   // Cas# Honorarios
    {key:"E", width:13 },   // Val Honorarios
    {key:"F", width:4.5},   // Cas# Capital
    {key:"G", width:13 },   // Val Capital
    {key:"H", width:4.5},   // Cas# No Laborales
    {key:"I", width:13 },   // Val No Laborales
    {key:"J", width:23 },   // Liquidación privada
  ];

  let R = 1;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1: ENCABEZADO (3 filas)
  // Estructura del PDF: [DIAN] | [Título] | [espacio] | [210]
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R+2}`);  // DIAN
  ws.mergeCells(`C${R}:G${R+2}`);  // Título
  ws.mergeCells(`H${R}:H${R+2}`);  // Espacio DIAN (vacío gris azul)
  ws.mergeCells(`I${R}:J${R+2}`);  // 210

  const cDian = ws.getCell(`A${R}`);
  cDian.value     = "DIAN";
  cDian.font      = { name:"Arial Black", size:22, bold:true, color:{ argb:CLR.black } };
  cDian.alignment = aln("left","middle",false);
  cDian.border    = bdr(TK,TK,TK,M);
  cDian.fill      = fill(CLR.white);

  const cTitulo = ws.getCell(`C${R}`);
  cTitulo.value     = "Declaración de renta y complementario personas naturales y asimiladas residentes\ny sucesiones ilíquidas de causantes residentes";
  cTitulo.font      = font(9,true);
  cTitulo.alignment = aln("center","middle",true);
  cTitulo.border    = bdr(TK,M,TK,M);

  ws.getCell(`H${R}`).fill   = fill(CLR.blueSec);
  ws.getCell(`H${R}`).border = bdr(TK,M,TK,M);

  const c210 = ws.getCell(`I${R}`);
  c210.value     = "210";
  c210.font      = { name:"Arial Black", size:36, bold:true, color:{ argb:CLR.white } };
  c210.fill      = fill(CLR.blue210);
  c210.alignment = aln("center","middle",false);
  c210.border    = bdr(TK,M,TK,TK);

  ws.getRow(R).height   = 14;
  ws.getRow(R+1).height = 14;
  ws.getRow(R+2).height = 14;
  R += 3;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 2: FILA AÑO + ESPACIO + No. FORMULARIO
  // ════════════════════════════════════════════════════════════
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:H${R}`);
  ws.mergeCells(`I${R}:J${R}`);
  ws.getRow(R).height = 13;

  const cAnio = ws.getCell(`A${R}`);
  cAnio.value = { richText:[
    {font:font(6,true), text:"1. Año\n"},
    {font:font(9,true), text:String(D.anio)},
  ]};
  cAnio.border    = bdr(M,TK,T,T);
  cAnio.alignment = aln("left","top",true);

  const cEsp = ws.getCell(`C${R}`);
  cEsp.value     = "Espacio reservado para la DIAN";
  cEsp.font      = font(7,false,CLR.blueNum);
  cEsp.border    = bdr(M,T,T,T);
  cEsp.alignment = aln("left","middle",false);

  const cNF = ws.getCell(`I${R}`);
  cNF.value = { richText:[
    {font:font(6,true), text:"4. Número de formulario\n"},
    {font:font(8), text:D.noForm},
  ]};
  cNF.border    = bdr(M,T,T,TK);
  cNF.alignment = aln("left","top",true);
  R++;

  // Espacio grande reservado DIAN
  ws.mergeCells(`A${R}:J${R}`);
  ws.getCell(`A${R}`).border = bdr(T,TK,T,TK);
  ws.getRow(R).height = 32;
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 3: DATOS DEL DECLARANTE fila 1
  // Pestaña vertical "Datos del declarante" + NIT,DV,Apellidos,Nombres,Seccional
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 22;

  // La pestaña "Datos del declarante" ocupa las 2 filas (declarante f1 + f2)
  ws.mergeCells(`A${R}:A${R+1}`);
  const cDecLabel = ws.getCell(`A${R}`);
  cDecLabel.value     = "Datos del declarante";
  cDecLabel.font      = font(5.5,true);
  cDecLabel.fill      = fill(CLR.blueSec);
  cDecLabel.border    = bdr(TK,TK,M,M);
  cDecLabel.alignment = { vertical:"middle", horizontal:"center", textRotation:90, wrapText:true };

  // B: NIT (5)
  const nit = ws.getCell(`B${R}`);
  nit.value = { richText:[{font:font(5,true),text:"5. Número de Identificación Tributaria (NIT)\n"},{font:font(8),text:D.nit}] };
  nit.border = bdr(TK,T,T,T); nit.alignment = aln("left","top",true);

  // C: DV (6)
  const dv = ws.getCell(`C${R}`);
  dv.value = { richText:[{font:font(5,true),text:"6.DV\n"},{font:font(8),text:D.dv}] };
  dv.border = bdr(TK,T,T,T); dv.alignment = aln("left","top",true);

  // D: Primer apellido (7)
  const ap1c = ws.getCell(`D${R}`);
  ap1c.value = { richText:[{font:font(5,true),text:"7. Primer apellido\n"},{font:font(8),text:D.ap1}] };
  ap1c.border = bdr(TK,T,T,T); ap1c.alignment = aln("left","top",true);

  // E: Segundo apellido (8)
  const ap2c = ws.getCell(`E${R}`);
  ap2c.value = { richText:[{font:font(5,true),text:"8. Segundo apellido\n"},{font:font(8),text:D.ap2}] };
  ap2c.border = bdr(TK,T,T,T); ap2c.alignment = aln("left","top",true);

  // F: Primer nombre (9)
  const n1c = ws.getCell(`F${R}`);
  n1c.value = { richText:[{font:font(5,true),text:"9. Primer nombre\n"},{font:font(8),text:D.n1}] };
  n1c.border = bdr(TK,T,T,T); n1c.alignment = aln("left","top",true);

  // G: Otros nombres (10)
  const n2c = ws.getCell(`G${R}`);
  n2c.value = { richText:[{font:font(5,true),text:"10. Otros nombres\n"},{font:font(8),text:D.n2}] };
  n2c.border = bdr(TK,T,T,T); n2c.alignment = aln("left","top",true);

  // H: vacío (11 - espacio)
  ws.getCell(`H${R}`).border = bdr(TK,T,T,T);

  // I-J: Cód Dirección seccional (12)
  ws.mergeCells(`I${R}:J${R}`);
  const secc = ws.getCell(`I${R}`);
  secc.value = { richText:[{font:font(5,true),text:"12.Cód. Dirección seccional\n"},{font:font(8),text:D.secc}] };
  secc.border = bdr(TK,T,T,TK); secc.alignment = aln("left","top",true);
  R++;

  // ── Fila 2 declarante: CIIU, corrección, 25, 26, 27, 28 ──
  ws.getRow(R).height = 16;
  // B: CIIU 24
  const ciiu = ws.getCell(`B${R}`);
  ciiu.value = { richText:[{font:font(5,true),text:"24. Actividad económica principal\n"},{font:font(8),text:D.ciiu}] };
  ciiu.border = bdr(T,T,M,T); ciiu.alignment = aln("left","top",true);

  // C: Corrección
  const corr = ws.getCell(`C${R}`);
  corr.value = { richText:[{font:font(5,true),text:"Si es una corrección indique:\n"},{font:font(7),text:"NO"}] };
  corr.border = bdr(T,T,M,T); corr.alignment = aln("left","top",true);

  // D: 25 Cód
  const cod25 = ws.getCell(`D${R}`);
  cod25.value = { richText:[{font:font(5,true),text:"25. Cód.\n"},{font:font(8),text:""}] };
  cod25.border = bdr(T,T,M,T); cod25.alignment = aln("left","top",true);

  // E: 26 No. Form anterior
  const nf26 = ws.getCell(`E${R}`);
  nf26.value = { richText:[{font:font(5,true),text:"26. No. Formulario anterior\n"},{font:font(8),text:""}] };
  nf26.border = bdr(T,T,M,T); nf26.alignment = aln("left","top",true);

  // F: 27 Fracción año gravable
  const frac27 = ws.getCell(`F${R}`);
  frac27.value = { richText:[{font:font(5,true),text:"27. Fracción año gravable siguiente\n"},{font:font(8),text:"NO"}] };
  frac27.border = bdr(T,T,M,T); frac27.alignment = aln("left","top",true);

  // G: vacío
  ws.getCell(`G${R}`).border = bdr(T,T,M,T);

  // H vacío
  ws.getCell(`H${R}`).border = bdr(T,T,M,T);

  // I-J: 28 Uno por ciento
  ws.mergeCells(`I${R}:J${R}`);
  const c28 = ws.getCell(`I${R}`);
  c28.value = { richText:[{font:font(5,true),text:"28. Uno por ciento (1%) de compras con factura electrónica\n"},{font:font(8),text:""}] };
  c28.border = bdr(T,T,M,TK); c28.alignment = aln("left","top",true);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 4: PATRIMONIO
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 18;

  // A: "Patrimonio"
  const pLabel = ws.getCell(`A${R}`);
  pLabel.value = "Patrimonio"; pLabel.font = font(7,true); pLabel.fill = fill(CLR.blueSec);
  pLabel.border = bdr(T,TK,M,M); pLabel.alignment = aln("center","middle",false);

  // B-C: 29 Patrimonio bruto
  ws.mergeCells(`B${R}:C${R}`);
  const p29 = ws.getCell(`B${R}`);
  p29.value = { richText:[{font:font(5.5,true),text:"Total patrimonio bruto  "},{font:font(6,true,CLR.blueNum),text:"29\n"},{font:font(9,true),text:D.c29.toLocaleString("es-CO")}] };
  p29.fill = fill(CLR.blueSec); p29.border = bdr(T,T,M,T); p29.alignment = aln("left","top",true);

  // D-F: 30 Deudas
  ws.mergeCells(`D${R}:F${R}`);
  const p30 = ws.getCell(`D${R}`);
  p30.value = { richText:[{font:font(5.5,true),text:"Deudas  "},{font:font(6,true,CLR.blueNum),text:"30\n"},{font:font(9,true),text:D.c30.toLocaleString("es-CO")}] };
  p30.fill = fill(CLR.blueSec); p30.border = bdr(T,T,M,T); p30.alignment = aln("left","top",true);

  // G-I: total pat liq 31
  ws.mergeCells(`G${R}:I${R}`);
  const p31v = ws.getCell(`G${R}`);
  p31v.value = { richText:[{font:font(5.5,true),text:"Total patrimonio líquido  "},{font:font(6,true,CLR.blueNum),text:"31\n"},{font:font(9,true),text:D.c31.toLocaleString("es-CO")}] };
  p31v.fill = fill(CLR.blueSec); p31v.border = bdr(T,T,M,T); p31v.alignment = aln("right","top",true);

  // J: vacío patrimonio (para liquidación privada ocupa esta columna solo en las filas del cedulario)
  ws.getCell(`J${R}`).border = bdr(T,T,M,TK);
  ws.getCell(`J${R}`).fill  = fill(CLR.blueSec);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 5: ENCABEZADO CÉDULA GENERAL
  // [Conceptos] [Rtas Trabajo] [Rtas NoRelac] [Cap] [NoLab] | [Liq]
  // ════════════════════════════════════════════════════════════
  ws.getRow(R).height = 32;

  secHdr(ws,`A${R}`,"Conceptos/rentas", CLR.blueSec, true, 7);
  ws.getCell(`A${R}`).border = bdr(T,TK,T,M);

  ws.mergeCells(`B${R}:C${R}`);
  secHdr(ws,`B${R}`,"Rentas de trabajo", CLR.blueHdr, true, 7);

  ws.mergeCells(`D${R}:E${R}`);
  const hH = ws.getCell(`D${R}`);
  hH.value="Rentas de trabajo que no provengan de una relación laboral o legal y reglamentaria";
  hH.font=font(6,true); hH.fill=fill(CLR.blueHdr); hH.border=ME; hH.alignment=aln("center","middle",true);

  ws.mergeCells(`F${R}:G${R}`);
  secHdr(ws,`F${R}`,"Rentas de capital",CLR.blueHdr,true,7);

  ws.mergeCells(`H${R}:I${R}`);
  secHdr(ws,`H${R}`,"Rentas no laborales",CLR.blueHdr,true,7);

  secHdr(ws,`J${R}`,"Liquidación privada del impuesto",CLR.grayBand,true,7);
  ws.getCell(`J${R}`).border = bdr(T,T,T,TK);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 6: FILAS CÉDULA GENERAL (32-90) + LIQUIDACIÓN (116-131)
  // ════════════════════════════════════════════════════════════
  // Columnas: A=concepto, B=cas#trab, C=valtrab, D=cas#hon, E=valhon,
  //           F=cas#cap, G=valcap, H=cas#nol, I=valnol, J=liquidación
  // bg especial para filas de Rentas Exentas y Deducciones
  const ROWS = [
    // [concepto, c_t, v_t, c_h, v_h, c_c, v_c, c_nl, v_nl, liq_cas, liq_lbl, liq_val, liq_bold, rowBg]
    ["Ingresos brutos",                               32,D.c32,43,D.c43,58,D.c58,74,D.c74, 116,"Impuesto s/ren.líq.grav. cédula gral., pensiones y dividendos",D.c116,false],
    ["Devoluciones, rebajas y descuentos",           null,null,null,null,null,null,75,D.c75,  117,"Impuesto sobre renta presuntiva",D.c117,false],
    ["Ingresos no constitutivos de renta",            33,D.c33,44,D.c44,59,D.c59,76,D.c76,   118,"Impuesto 2a. subcédula 2017 y sig. (art. 240)",D.c118,false],
    ["Costos y deducciones procedentes",            null,null,45,D.c45,60,D.c60,77,D.c77,    119,"Impuesto dividendos 2016 y anteriores",D.c119,false],
    ["Renta líquida",                                 34,D.c34,46,D.c46,61,D.c61,78,D.c78,   120,"Impuesto s/dividendos y particip. del exterior",D.c120,false],
    ["Rentas líquidas pasivas - ECE",               null,null,null,null,62,D.c62,79,D.c79,    121,"Total impuesto sobre rentas líquidas gravables",D.c121,true],
    ["Aportes vol. AFC, FVP y AVC\n(art. 126-1 y 126-4)",35,D.c35,47,D.c47,63,D.c63,80,D.c80,null,"DESCUENTOS TRIBUTARIOS",null,false,"sec"],
    ["Otras rentas exentas\n(incluye 25% num. 10 art. 206 E.T.)",36,D.c36,48,D.c48,64,D.c64,81,D.c81,122,"Impuestos pagados en el exterior (arts.254 y 255)",D.c122,false,CLR.blueSec],
    ["Total rentas exentas",                         37,D.c37,49,D.c49,65,D.c65,82,D.c82,    123,"Donaciones (art. 257)",D.c123,false,CLR.blueSec],
    ["Intereses crédito de vivienda\n(art. 119 E.T.)",38,D.c38,50,D.c50,66,D.c66,83,D.c83,  124,"Dividendos, participaciones y otros (art.258-1)",D.c124,false],
    ["Otras deducciones imputables\n(Dependientes, Salud, GMF, art. 387)",39,D.c39,51,D.c51,67,D.c67,84,D.c84,125,"Total descuentos tributarios",D.c125,true],
    ["Total deducciones imputables",                 40,D.c40,52,D.c52,68,D.c68,85,D.c85,    126,"Impuesto neto de renta",D.c126,true],
    ["Rentas exentas y/o deduc. imputables\n(limit. 40%/1.340 UVT art. 336)",41,D.c41,53,D.c53,69,D.c69,86,D.c86,127,"Impuesto de ganancias ocasionales",D.c127,false],
    ["Renta líquida ordinaria del ejercicio",       null,null,54,D.c54,70,D.c70,87,D.c87,    128,"Desc. tributario por imp.pagados en el ext. por GO",D.c128,false],
    ["Pérdida líquida del ejercicio",               null,null,55,D.c55,71,D.c71,88,D.c88,    129,"Total impuesto a cargo",D.c129,true],
    ["Compensaciones por pérdidas de ejerc. ant.",  null,null,56,D.c56,72,D.c72,89,D.c89,    130,"Anticipo renta liq. año gravable anterior (cas.133 dec.ant.)",D.c130,false],
    ["Renta líquida ordinaria",                       42,D.c42,57,D.c57,73,D.c73,90,D.c90,   131,"Saldo a favor año grav. ant. sin sol. de devolución",D.c131,false],
  ];

  for (let i = 0; i < ROWS.length; i++) {
    ws.getRow(R).height = 18;
    const row = ROWS[i];
    const [concepto,ct,vt,ch,vh,cc,vc,cnl,vnl,lc,ll,lv,lb,rbg] = row;
    const rowBg = (rbg && rbg.startsWith("FF")) ? rbg : (i%2===1 ? CLR.grayAlt : CLR.white);

    // A: concepto
    const cA = ws.getCell(`A${R}`);
    cA.value     = concepto;
    cA.font      = font(6.5);
    cA.fill      = fill(rowBg);
    cA.border    = bdr(T,TK,T,T);
    cA.alignment = aln("left","middle",true);

    // B-I: 4 pares cas#+valor
    const cuatro = [["B","C",ct,vt],["D","E",ch,vh],["F","G",cc,vc],["H","I",cnl,vnl]];
    for (const [colCas,colVal,cas,val] of cuatro) {
      const cc2 = ws.getCell(`${colCas}${R}`);
      const cv2 = ws.getCell(`${colVal}${R}`);
      if (cas === null) {
        cc2.fill=fill(CLR.grayDis); cc2.border=TH;
        cv2.fill=fill(CLR.grayDis); cv2.border=TH;
      } else {
        cc2.value = String(cas); cc2.font=font(6,true,CLR.blueNum);
        cc2.alignment=aln("left","top",false); cc2.border=TH; cc2.fill=fill(rowBg);
        cv2.value = val??0; cv2.font=font(8); cv2.numFmt="#,##0";
        cv2.alignment=aln("right","middle",false); cv2.border=TH; cv2.fill=fill(rowBg);
      }
    }

    // J: Liquidación privada
    const jCell = ws.getCell(`J${R}`);
    if (lc === null && rbg === "sec") {
      // sub-encabezado de sección
      jCell.value     = ll;
      jCell.font      = font(6.5,true);
      jCell.fill      = fill(CLR.grayBand);
      jCell.border    = bdr(T,T,T,TK);
      jCell.alignment = aln("center","middle",false);
    } else if (lc !== null) {
      jCell.value = { richText:[
        {font:font(5.5,true,CLR.blueNum), text:`${lc} `},
        {font:font(5.5,false,"FF444444"), text:`${ll}\n`},
        {font:font(8,lb??false), text:typeof lv==="number"?lv.toLocaleString("es-CO"):""},
      ]};
      jCell.alignment = aln("left","top",true);
      jCell.border    = bdr(T,T,T,TK);
      jCell.fill      = fill((lb??false) ? CLR.yellow : CLR.white);
    } else {
      jCell.border = bdr(T,T,T,TK);
    }
    R++;
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 7: DEPURACIÓN (91-98) + RET/ANTICIPO (132-133)
  // ════════════════════════════════════════════════════════════
  // Fila 1: 91, 92, 93, 94 + Liq: 132
  ws.getRow(R).height = 17;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);

  const d1 = [[`A${R}`,91,"Ren. líq. cédula general",D.c91,false],
              [`C${R}`,92,"Ren. ex. y ded. imp. lim.",D.c92,false],
              [`E${R}`,93,"R. líq. ord. cédula gral.",D.c93,true],
              [`G${R}`,94,"Comp. pérd. 2017 y ant.",D.c94,false]];
  const depBdr = { top:b("medium",CLR.blue210), left:b("medium",CLR.blue210), bottom:b("medium",CLR.blue210), right:b("medium",CLR.blue210) };
  for (const [addr,num,lbl,val,bold] of d1) {
    const c = ws.getCell(addr);
    c.value = { richText:[{font:font(5.5,true,CLR.blueNum),text:`${num} `},{font:font(5.5,false,"FF444444"),text:`${lbl}\n`},{font:font(8,bold),text:val.toLocaleString("es-CO")}] };
    c.fill=fill(bold?CLR.yellow:CLR.blueSec); c.border=depBdr; c.alignment=aln("left","top",true);
  }
  ws.getCell(`I${R}`).fill=fill(CLR.blueSec); ws.getCell(`I${R}`).border=depBdr;

  const r132 = ws.getCell(`J${R}`);
  r132.value = { richText:[{font:font(5.5,true,CLR.blueNum),text:"132 "},{font:font(5.5,false,"FF444444"),text:"Retenciones año gravable a declarar\n"},{font:font(8),text:D.c132.toLocaleString("es-CO")}] };
  r132.alignment=aln("left","top",true); r132.border=bdr(T,T,T,TK);
  R++;

  // Fila 2: 95, 96, 97, 98 + Liq: 133
  ws.getRow(R).height = 17;
  ws.mergeCells(`A${R}:B${R}`);
  ws.mergeCells(`C${R}:D${R}`);
  ws.mergeCells(`E${R}:F${R}`);
  ws.mergeCells(`G${R}:H${R}`);

  const d2 = [[`A${R}`,95,"Comp. exc. renta presuntiva",D.c95,false],
              [`C${R}`,96,"Rentas gravables",D.c96,false],
              [`E${R}`,97,"R. líq. grav. cédula gral.",D.c97,true],
              [`G${R}`,98,"Renta presuntiva",D.c98,false]];
  for (const [addr,num,lbl,val,bold] of d2) {
    const c = ws.getCell(addr);
    c.value = { richText:[{font:font(5.5,true,CLR.blueNum),text:`${num} `},{font:font(5.5,false,"FF444444"),text:`${lbl}\n`},{font:font(8,bold),text:val.toLocaleString("es-CO")}] };
    c.fill=fill(bold?CLR.yellow:CLR.blueSec); c.border=depBdr; c.alignment=aln("left","top",true);
  }
  ws.getCell(`I${R}`).fill=fill(CLR.blueSec); ws.getCell(`I${R}`).border=depBdr;

  const r133 = ws.getCell(`J${R}`);
  r133.value = { richText:[{font:font(5.5,true,CLR.blueNum),text:"133 "},{font:font(5.5,false,"FF444444"),text:"Anticipo renta año gravable siguiente\n"},{font:font(8),text:D.c133.toLocaleString("es-CO")}] };
  r133.alignment=aln("left","top",true); r133.border=bdr(T,T,T,TK);
  R++;

  // ════════════════════════════════════════════════════════════
  // BLOQUE 8: SECCIÓN INFERIOR
  // A-I = Pensiones / Dividendos / GO  |  J = Totales y Firmas
  // ════════════════════════════════════════════════════════════
  const LEFT = [
    {t:"sec",lbl:"CÉDULA DE PENSIONES"},
    {t:"row",cas:99, lbl:"Ingresos brutos de pensiones del país y del exterior",val:D.c99},
    {t:"row",cas:100,lbl:"Ingresos no constitutivos de renta",val:D.c100},
    {t:"row",cas:101,lbl:"Renta líquida",val:D.c101},
    {t:"row",cas:102,lbl:"Rentas exentas de pensiones (art. 206-1)",val:D.c102},
    {t:"row",cas:103,lbl:"Renta líquida gravable de la cédula de pensiones",val:D.c103,bold:true},
    {t:"sec",lbl:"CÉDULAS DE DIVIDENDOS Y/O PARTICIPACIONES"},
    {t:"row",cas:104,lbl:"Dividendos y participaciones 2016 y anteriores, y otros",val:D.c104},
    {t:"row",cas:105,lbl:"Ingresos no constitutivos de renta",val:D.c105},
    {t:"row",cas:106,lbl:"Renta líquida ordinaria año 2016 y anteriores",val:D.c106},
    {t:"row",cas:107,lbl:"Subcédula 2017 y siguientes num. 3 art. 49",val:D.c107},
    {t:"row",cas:108,lbl:"Subcédula 2017 y siguientes par. 2 art. 49",val:D.c108},
    {t:"row",cas:109,lbl:"Dividendos y participaciones del exterior",val:D.c109},
    {t:"row",cas:110,lbl:"Rentas exentas de la casilla 109",val:D.c110},
    {t:"row",cas:111,lbl:"Renta líq. grav. dividendos (base art. 241)",val:D.c111,bold:true},
    {t:"sec",lbl:"GANANCIAS OCASIONALES"},
    {t:"row",cas:112,lbl:"Ingresos por ganancias ocasionales",val:D.c112},
    {t:"row",cas:113,lbl:"Costos por ganancias ocasionales",val:D.c113},
    {t:"row",cas:114,lbl:"Ganancias ocasionales no gravadas y exentas",val:D.c114},
    {t:"row",cas:115,lbl:"Ganancias ocasionales gravables",val:D.c115,bold:true},
  ];

  const RIGHT = [
    {t:"sec",lbl:"SALDOS Y DATOS INFORMATIVOS"},
    {t:"row",cas:134,lbl:"Saldo a pagar por impuesto",val:D.c134},
    {t:"row",cas:135,lbl:"Sanciones",val:D.c135},
    {t:"tot",cas:136,lbl:"TOTAL SALDO A PAGAR",val:D.c136,bg:CLR.redPay},
    {t:"tot",cas:137,lbl:"TOTAL SALDO A FAVOR",val:D.c137,bg:CLR.greenFav},
    {t:"row",cas:138,lbl:"Número de dependientes económicos",val:D.c138},
    {t:"row",cas:139,lbl:"Adición al límite de deducciones (cas. 92)",val:D.c139},
    {t:"row",cas:140,lbl:"Superó tope 60% de costos y gastos (art. 336-1)",val:D.c140?"X":""},
    {t:"row",cas:141,lbl:"Aporte voluntario (art. 126-4)",val:D.c141},
    {t:"sec",lbl:"FIRMAS Y PAGO OFICIAL"},
    {t:"tot",cas:980,lbl:"PAGO TOTAL $",val:D.c980,bg:CLR.yellow},
    {t:"row",cas:981,lbl:"Cód. Rep./Firma del Declarante",val:`${D.n1} ${D.n2} ${D.ap1}`},
    {t:"row",cas:982,lbl:"Firma Contador / 994. Con salvedades",val:"0"},
    {t:"row",cas:983,lbl:"No. Tarjeta Profesional",val:"—"},
    {t:"row",cas:997,lbl:"Sello entidad recaudadora",val:""},
    {t:"row",cas:996,lbl:"No. interno DIAN / Adhesivo",val:""},
    null, null, null, null,
  ];

  const maxB = Math.max(LEFT.length, RIGHT.length);
  for (let i = 0; i < maxB; i++) {
    ws.getRow(R).height = 17;
    const ld = LEFT[i];
    const rd = RIGHT[i];

    // A-I izquierda
    if (ld?.t === "sec") {
      ws.mergeCells(`A${R}:I${R}`);
      const sh = ws.getCell(`A${R}`);
      sh.value=ld.lbl; sh.font=font(7,true); sh.fill=fill(CLR.blueSec);
      sh.border=bdr(T,TK,T,T); sh.alignment=aln("left","middle",false);
    } else if (ld?.t === "row") {
      ws.mergeCells(`A${R}:C${R}`);
      ws.mergeCells(`D${R}:I${R}`);
      const la = ws.getCell(`A${R}`);
      la.value={richText:[{font:font(6,true,CLR.blueNum),text:`${ld.cas} `},{font:font(6),text:ld.lbl}]};
      la.alignment=aln("left","middle",true); la.border=bdr(T,TK,T,T);
      if (ld.bold) la.fill=fill(CLR.yellow);
      const lv = ws.getCell(`D${R}`);
      lv.value=typeof ld.val==="number"?ld.val:(ld.val??0);
      if (typeof ld.val==="number") lv.numFmt="#,##0";
      lv.font=font(8,ld.bold??false); lv.alignment=aln("right","middle",false);
      lv.border=bdr(T,T,T,T); if (ld.bold) lv.fill=fill(CLR.yellow);
    } else {
      ws.mergeCells(`A${R}:I${R}`);
      ws.getCell(`A${R}`).border=bdr(T,TK,T,T);
    }

    // J derecha
    const jk = ws.getCell(`J${R}`);
    if (rd?.t === "sec") {
      jk.value=rd.lbl; jk.font=font(7,true); jk.fill=fill(CLR.grayBand);
      jk.border=bdr(T,T,T,TK); jk.alignment=aln("center","middle",false);
    } else if (rd?.t === "tot") {
      jk.value={richText:[
        {font:font(6,true,CLR.blueNum),text:`${rd.cas} `},
        {font:font(6,true),text:`${rd.lbl}\n`},
        {font:font(9,true),text:typeof rd.val==="number"?rd.val.toLocaleString("es-CO"):""},
      ]};
      jk.fill=fill(rd.bg??CLR.yellow); jk.border=bdr(M,T,M,TK); jk.alignment=aln("left","top",true);
    } else if (rd?.t === "row") {
      jk.value={richText:[
        {font:font(5.5,true,CLR.blueNum),text:`${rd.cas} `},
        {font:font(5.5,false,"FF444444"),text:`${rd.lbl}\n`},
        {font:font(8),text:typeof rd.val==="number"?rd.val.toLocaleString("es-CO"):(rd.val??"")},
      ]};
      jk.alignment=aln("left","top",true); jk.border=bdr(T,T,T,TK);
    } else {
      jk.border=bdr(T,T,T,TK);
    }
    R++;
  }

  // Borde de cierre inferior
  ws.mergeCells(`A${R}:J${R}`);
  ws.getCell(`A${R}`).border = bdr(TK,TK,TK,TK);
  ws.getRow(R).height = 2;

  await wb.xlsx.writeFile(OUT);
  console.log(`✅ Generado: ${OUT}`);
  console.log(`   Filas: ${R}`);
}

build().catch(e => { console.error("❌", e.message, "\n", e.stack); process.exit(1); });
