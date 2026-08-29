import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ComputedDeclaration, Declaration } from "./types";

/**
 * Mapeo oficial de coordenadas exactas (en puntos tipográficos 612 x 792)
 * para el Formulario Oficial 210 de la DIAN.
 */
const DIAN_210_COORDS: Record<number, { xAnchor?: number; xCenter?: number; y: number; size?: number; bold?: boolean }> = {
  // 1% Factura electrónica
  28: { xAnchor: 590, y: 618, size: 7.5 },

  // Patrimonio
  29: { xAnchor: 230, y: 605, size: 7.5 },
  30: { xAnchor: 404, y: 605, size: 7.5 },
  31: { xAnchor: 590, y: 605, size: 7.5, bold: true },

  // Cédula General
  // Rentas de trabajo
  32: { xAnchor: 230, y: 581, size: 7.5 },
  33: { xAnchor: 230, y: 556, size: 7.5 },
  34: { xAnchor: 230, y: 531, size: 7.5, bold: true },
  35: { xAnchor: 230, y: 506, size: 7.5 },
  36: { xAnchor: 230, y: 493, size: 7.5 },
  37: { xAnchor: 230, y: 481, size: 7.5 },
  38: { xAnchor: 230, y: 468, size: 7.5 },
  39: { xAnchor: 230, y: 456, size: 7.5 },
  40: { xAnchor: 230, y: 443, size: 7.5 },
  41: { xAnchor: 230, y: 431, size: 7.5, bold: true },
  42: { xAnchor: 230, y: 383, size: 7.5, bold: true },

  // Rentas de honorarios y compensación servicios personales
  43: { xAnchor: 350, y: 581, size: 7.5 },
  44: { xAnchor: 350, y: 556, size: 7.5 },
  45: { xAnchor: 350, y: 543, size: 7.5 },
  46: { xAnchor: 350, y: 531, size: 7.5, bold: true },
  47: { xAnchor: 350, y: 506, size: 7.5 },
  48: { xAnchor: 350, y: 493, size: 7.5 },
  49: { xAnchor: 350, y: 481, size: 7.5 },
  50: { xAnchor: 350, y: 468, size: 7.5 },
  51: { xAnchor: 350, y: 456, size: 7.5 },
  52: { xAnchor: 350, y: 443, size: 7.5 },
  53: { xAnchor: 350, y: 431, size: 7.5, bold: true },
  54: { xAnchor: 350, y: 420, size: 7.5 },
  55: { xAnchor: 350, y: 408, size: 7.5 },
  56: { xAnchor: 350, y: 396, size: 7.5 },
  57: { xAnchor: 350, y: 383, size: 7.5, bold: true },

  // Rentas de capital
  58: { xAnchor: 470, y: 581, size: 7.5 },
  59: { xAnchor: 470, y: 556, size: 7.5 },
  60: { xAnchor: 470, y: 543, size: 7.5 },
  61: { xAnchor: 470, y: 531, size: 7.5, bold: true },
  62: { xAnchor: 470, y: 518, size: 7.5 },
  63: { xAnchor: 470, y: 506, size: 7.5 },
  64: { xAnchor: 470, y: 493, size: 7.5 },
  65: { xAnchor: 470, y: 481, size: 7.5 },
  66: { xAnchor: 470, y: 468, size: 7.5 },
  67: { xAnchor: 470, y: 456, size: 7.5 },
  68: { xAnchor: 470, y: 443, size: 7.5 },
  69: { xAnchor: 470, y: 431, size: 7.5, bold: true },
  70: { xAnchor: 470, y: 420, size: 7.5 },
  71: { xAnchor: 470, y: 408, size: 7.5 },
  72: { xAnchor: 470, y: 396, size: 7.5 },
  73: { xAnchor: 470, y: 383, size: 7.5, bold: true },

  // Rentas no laborales
  74: { xAnchor: 590, y: 581, size: 7.5 },
  75: { xAnchor: 590, y: 568, size: 7.5 },
  76: { xAnchor: 590, y: 556, size: 7.5 },
  77: { xAnchor: 590, y: 543, size: 7.5 },
  78: { xAnchor: 590, y: 531, size: 7.5, bold: true },
  79: { xAnchor: 590, y: 518, size: 7.5 },
  80: { xAnchor: 590, y: 506, size: 7.5 },
  81: { xAnchor: 590, y: 493, size: 7.5 },
  82: { xAnchor: 590, y: 481, size: 7.5 },
  83: { xAnchor: 590, y: 468, size: 7.5 },
  84: { xAnchor: 590, y: 456, size: 7.5 },
  85: { xAnchor: 590, y: 443, size: 7.5 },
  86: { xAnchor: 590, y: 431, size: 7.5, bold: true },
  87: { xAnchor: 590, y: 420, size: 7.5 },
  88: { xAnchor: 590, y: 408, size: 7.5 },
  89: { xAnchor: 590, y: 396, size: 7.5 },
  90: { xAnchor: 590, y: 383, size: 7.5, bold: true },

  // Depuración Cédula General
  91: { xAnchor: 160, y: 373, size: 7.5 },
  92: { xAnchor: 305, y: 372, size: 7.5 },
  93: { xAnchor: 448, y: 373, size: 7.5, bold: true },
  94: { xAnchor: 590, y: 372, size: 7.5 },
  95: { xAnchor: 160, y: 358, size: 7.5 },
  96: { xAnchor: 305, y: 358, size: 7.5 },
  97: { xAnchor: 448, y: 358, size: 7.5, bold: true },
  98: { xAnchor: 590, y: 358, size: 7.5 },

  // Pensiones (99 a 103)
  99: { xAnchor: 305, y: 346, size: 7.5 },
  100: { xAnchor: 305, y: 334, size: 7.5 },
  101: { xAnchor: 305, y: 322, size: 7.5 },
  102: { xAnchor: 305, y: 310, size: 7.5 },
  103: { xAnchor: 305, y: 298, size: 7.5, bold: true },

  // Dividendos (104 a 111)
  104: { xAnchor: 305, y: 285, size: 7.5 },
  105: { xAnchor: 305, y: 273, size: 7.5 },
  106: { xAnchor: 305, y: 261, size: 7.5 },
  107: { xAnchor: 305, y: 249, size: 7.5 },
  108: { xAnchor: 305, y: 236, size: 7.5 },
  109: { xAnchor: 305, y: 224, size: 7.5 },
  110: { xAnchor: 305, y: 212, size: 7.5 },
  111: { xAnchor: 305, y: 199, size: 7.5, bold: true },

  // Ganancias Ocasionales (112 a 115)
  112: { xAnchor: 305, y: 187, size: 7.5 },
  113: { xAnchor: 305, y: 175, size: 7.5 },
  114: { xAnchor: 305, y: 163, size: 7.5 },
  115: { xAnchor: 305, y: 151, size: 7.5, bold: true },

  // Liquidación Privada (116 a 133)
  116: { xAnchor: 590, y: 346, size: 7.5 },
  117: { xAnchor: 590, y: 334, size: 7.5 },
  118: { xAnchor: 590, y: 322, size: 7.5 },
  119: { xAnchor: 590, y: 310, size: 7.5 },
  120: { xAnchor: 590, y: 297, size: 7.5 },
  121: { xAnchor: 590, y: 285, size: 7.5, bold: true },
  122: { xAnchor: 460, y: 273, size: 7.5 },
  123: { xAnchor: 590, y: 273, size: 7.5 },
  124: { xAnchor: 460, y: 261, size: 7.5 },
  125: { xAnchor: 590, y: 261, size: 7.5, bold: true },
  126: { xAnchor: 590, y: 248, size: 7.5, bold: true },
  127: { xAnchor: 590, y: 237, size: 7.5 },
  128: { xAnchor: 590, y: 224, size: 7.5 },
  129: { xAnchor: 590, y: 211, size: 7.5, bold: true },
  130: { xAnchor: 590, y: 199, size: 7.5 },
  131: { xAnchor: 590, y: 187, size: 7.5 },
  132: { xAnchor: 590, y: 175, size: 7.5 },
  133: { xAnchor: 590, y: 163, size: 7.5 },

  // Totales y Control (134 a 141)
  134: { xAnchor: 160, y: 139, size: 7.5 },
  135: { xAnchor: 305, y: 139, size: 7.5 },
  136: { xAnchor: 448, y: 139, size: 7.5, bold: true },
  137: { xAnchor: 590, y: 139, size: 7.5, bold: true },
  138: { xAnchor: 125, y: 125, size: 7.5 },
  139: { xAnchor: 305, y: 125, size: 7.5 },
  140: { xCenter: 425, y: 125, size: 8, bold: true },
  141: { xAnchor: 590, y: 125, size: 7.5 },

  // 980 Pago Total
  980: { xAnchor: 580, y: 56, size: 9, bold: true },
};

const NIT_BOXES = [
  { x: 70, y: 629 },
  { x: 83, y: 629 },
  { x: 95, y: 629 },
  { x: 107, y: 629 },
  { x: 119, y: 629 },
  { x: 131, y: 629 },
  { x: 143, y: 629 },
  { x: 155, y: 629 },
  { x: 167, y: 629 },
  { x: 179, y: 629 },
];

const CIIU_BOXES = [
  { x: 61, y: 616 },
  { x: 73, y: 616 },
  { x: 85, y: 616 },
  { x: 97, y: 616 },
];

function formatThousandsCOP(val: number | undefined | null): string {
  if (val === undefined || val === null || val === 0) return "0";
  const rounded = Math.round(val / 1000) * 1000;
  return new Intl.NumberFormat("es-CO").format(rounded);
}

/**
 * Genera el PDF Oficial 1:1 vectorial sobre la plantilla original del Formulario 210 de la DIAN.
 */
export async function downloadOfficialDian210Pdf(
  filename: string,
  d: Declaration,
  c: ComputedDeclaration
): Promise<void> {
  try {
    // 1. Cargar la plantilla oficial del Formulario 210
    const res = await fetch("/templates/formulario-210-template.pdf");
    if (!res.ok) throw new Error("No se pudo cargar la plantilla oficial del Formulario 210");
    const templateBytes = await res.arrayBuffer();

    const pdfDoc = await PDFDocument.load(templateBytes);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    function drawRight(text: string, xAnchor: number, y: number, size = 7.5, bold = false) {
      const f = bold ? fontBold : fontRegular;
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x: xAnchor - w, y, size, font: f, color: rgb(0, 0, 0) });
    }

    function drawCenter(text: string, xCenter: number, y: number, size = 7.5, bold = false) {
      const f = bold ? fontBold : fontRegular;
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x: xCenter - w / 2, y, size, font: f, color: rgb(0, 0, 0) });
    }

    function drawLeft(text: string, x: number, y: number, size = 7.5, bold = false) {
      const f = bold ? fontBold : fontRegular;
      page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) });
    }

    const id = d.identity;

    // 2. Estampar datos de cabecera
    // 1. Año
    drawLeft(String(d.year || 2025), 75, 730, 9, true);

    // 4. Número de formulario
    const numFormulario = id.numeroFormulario || `210${d.year}000${id.nit ? id.nit.slice(-5) : "41029"}`;
    drawCenter(numFormulario, 445, 722, 8, true);

    // 5. NIT (Dígito por casilla)
    const nitClean = (id.nit || "").replace(/\D/g, "");
    for (let i = 0; i < nitClean.length && i < NIT_BOXES.length; i++) {
      drawCenter(nitClean[i], NIT_BOXES[i].x, NIT_BOXES[i].y, 8, true);
    }

    // 6. DV
    drawCenter(String(id.dv ?? 0), 194, 629, 8, true);

    // 7. Primer apellido, 8. Segundo apellido, 9. Primer nombre, 10. Otros nombres
    if (id.primerApellido) drawLeft(id.primerApellido.toUpperCase(), 210, 629, 8, true);
    if (id.segundoApellido) drawLeft(id.segundoApellido.toUpperCase(), 294, 629, 8, true);
    if (id.primerNombre) drawLeft(id.primerNombre.toUpperCase(), 377, 629, 8, true);
    if (id.otrosNombres) drawLeft(id.otrosNombres.toUpperCase(), 460, 629, 8, true);

    // 12. Código Dirección Seccional
    drawCenter(String(id.dirSeccional || "02"), 543, 629, 8, true);

    // 24. Actividad CIIU
    const ciiuClean = (id.actividadCiiu || "0010").padStart(4, "0");
    for (let i = 0; i < 4 && i < ciiuClean.length; i++) {
      drawCenter(ciiuClean[i], CIIU_BOXES[i].x, CIIU_BOXES[i].y, 7.5, true);
    }

    // 25. Cód. Corrección
    if (id.esCorreccion) {
      drawCenter(String(id.codCorreccion || "1"), 160, 616, 7.5);
    }

    // 26. No. Formulario anterior
    if (id.esCorreccion && id.formAnterior) {
      drawLeft(id.formAnterior, 200, 616, 7.5);
    }

    // 27. Fracción año siguiente
    drawCenter(id.fraccionAnioSiguiente ? "SÍ" : "NO", 330, 616, 7.5, true);

    // 3. Estampar todas las casillas numéricas 28 a 141
    for (let casillaNum = 28; casillaNum <= 141; casillaNum++) {
      const coord = DIAN_210_COORDS[casillaNum];
      if (!coord) continue;

      const rawVal = c.casillas[casillaNum] ?? 0;

      if (casillaNum === 140) {
        // Marca X o vacío
        if (rawVal || c.casillas[140]) {
          drawCenter("X", coord.xCenter ?? 425, coord.y, coord.size ?? 8, true);
        }
      } else if (casillaNum === 138) {
        // Número de dependientes (entero simple)
        if (coord.xAnchor) {
          drawRight(String(rawVal), coord.xAnchor, coord.y, coord.size ?? 7.5, coord.bold);
        }
      } else {
        // Valores en miles de pesos
        const formatted = formatThousandsCOP(rawVal);
        if (coord.xAnchor) {
          drawRight(formatted, coord.xAnchor, coord.y, coord.size ?? 7.5, coord.bold);
        }
      }
    }

    // 4. Casilla 980 Pago Total $
    const pagoTotalVal = c.saldoPagar > 0 ? formatThousandsCOP(c.saldoPagar) : "0";
    drawRight(pagoTotalVal, DIAN_210_COORDS[980].xAnchor ?? 580, DIAN_210_COORDS[980].y, 9, true);

    // 5. Nombre en bloque de firma
    const fullName = [id.primerApellido, id.segundoApellido, id.primerNombre, id.otrosNombres]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();
    if (fullName) {
      drawCenter(fullName, 240, 78, 6.5);
    }

    // 6. Guardar y descargar el PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error al generar PDF vectorial con pdf-lib, recurriendo a impresión del sistema:", err);
    window.print();
  }
}
