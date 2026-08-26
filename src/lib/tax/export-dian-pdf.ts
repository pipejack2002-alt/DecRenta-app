import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ComputedDeclaration, Declaration } from "./types";
import { formatNumber } from "./format";

/**
 * Genera y descarga el PDF Oficial del Formulario 210 de la DIAN
 * rellenando la plantilla oficial de 1 página con los datos del declarante y casillas.
 */
export async function downloadOfficialDian210Pdf(
  filename: string,
  d: Declaration,
  c: ComputedDeclaration
): Promise<void> {
  const id = d.identity;
  const cas = c.casillas;

  // 1. Cargar la plantilla oficial del Formulario 210 desde public/
  let existingPdfBytes: ArrayBuffer;
  try {
    const response = await fetch("/Formulario_210_template.pdf");
    if (!response.ok) throw new Error("Template no encontrado");
    existingPdfBytes = await response.arrayBuffer();
  } catch {
    // Si falla el fetch de la plantilla, generar ventana de impresión del navegador optimizada
    window.print();
    return;
  }

  // 2. Cargar el documento PDF con pdf-lib
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0]; // La plantilla tiene exactamente 1 sola página
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper para dibujar texto en coordenadas PDF (origen inferior izquierdo)
  function draw(
    text: string,
    x: number,
    y: number,
    size: number = 8,
    isBold: boolean = false,
    color = rgb(0.05, 0.05, 0.05)
  ) {
    if (!text || text === "0" && size === 0) return;
    page.drawText(String(text), {
      x,
      y,
      size,
      font: isBold ? fontBold : font,
      color,
    });
  }

  // Helper para casillas numéricas con alineación derecha
  function drawCasilla(num: number, xRight: number, y: number, size: number = 7.5) {
    const val = cas[num];
    if (num === 140) {
      if (val) draw("X", xRight - 10, y, 9, true, rgb(0.1, 0.1, 0.1));
      return;
    }
    if (val === undefined || val === null || val === 0) {
      draw("0", xRight - 6, y, size, true);
      return;
    }
    const rounded = Math.round(val / 1000) * 1000;
    const str = formatNumber(rounded);
    const textWidth = fontBold.widthOfTextAtSize(str, size);
    draw(str, xRight - textWidth, y, size, true);
  }

  // Helper para texto centrado
  function drawCenter(text: string, xCenter: number, y: number, size: number = 8, isBold: boolean = false) {
    if (!text) return;
    const w = (isBold ? fontBold : font).widthOfTextAtSize(text, size);
    draw(text, xCenter - w / 2, y, size, isBold);
  }

  // 3. Encabezado del Formulario
  // Año gravable (Casilla 1)
  draw(String(d.year), 80, 715, 11, true, rgb(0.1, 0.3, 0.5));

  // Número de formulario (Casilla 4)
  if (id.numeroFormulario) {
    draw(id.numeroFormulario, 430, 715, 9, true);
  }

  // NIT (Casilla 5) y DV (Casilla 6)
  if (id.nit) {
    draw(id.nit, 65, 665, 9, true);
  }
  if (id.dv) {
    draw(id.dv, 275, 665, 9, true);
  }

  // Apellidos y Nombres (Casillas 7 a 10)
  if (id.primerApellido) draw(id.primerApellido.toUpperCase(), 290, 665, 8.5, true);
  if (id.segundoApellido) draw(id.segundoApellido.toUpperCase(), 355, 665, 8.5, true);
  if (id.primerNombre) draw(id.primerNombre.toUpperCase(), 425, 665, 8.5, true);
  if (id.otrosNombres) draw(id.otrosNombres.toUpperCase(), 485, 665, 8.5, true);

  // Dirección Seccional (Casilla 12)
  draw(id.dirSeccional || "02", 565, 665, 8.5, true);

  // Actividad Económica (Casilla 24)
  draw(id.actividadCiiu || "0010", 65, 642, 8.5, true);

  // Corrección (Casillas 25 y 26)
  if (id.esCorreccion) {
    draw(id.codCorreccion || "1", 255, 642, 8, true);
    if (id.formAnterior) draw(id.formAnterior, 290, 642, 8, true);
  }

  // Fracción año siguiente (Casilla 27)
  draw(id.fraccionAnioSiguiente ? "SÍ" : "NO", 405, 642, 8, true);

  // 4. Guardar y descargar el PDF completado
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
