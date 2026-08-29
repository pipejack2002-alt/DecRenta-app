import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ComputedDeclaration, Declaration } from "./types";

/**
 * Genera y descarga el PDF Oficial del Formulario 210 de la DIAN
 * con calidad profesional (ultra-alta resolución, proporciones 1:1,
 * ajustado exactamente a 1 sola página A4 vertical).
 */
export async function downloadOfficialDian210Pdf(
  filename: string,
  d: Declaration,
  c: ComputedDeclaration
): Promise<void> {
  const container = document.getElementById("dian-form-pdf-container");
  if (!container) {
    window.print();
    return;
  }

  // Guardar estado original de estilos
  const originalTransform = container.style.transform;
  const originalTransition = container.style.transition;
  const originalMargin = container.style.margin;
  const originalWidth = container.style.width;
  const originalMinWidth = container.style.minWidth;
  const originalMaxWidth = container.style.maxWidth;

  try {
    // Forzar ancho estándar fijo y remover transformaciones para captura nítida
    container.style.transition = "none";
    container.style.transform = "none";
    container.style.margin = "0";
    container.style.width = "980px";
    container.style.minWidth = "980px";
    container.style.maxWidth = "980px";

    // Capturar el formulario en alta resolución
    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 980,
      windowWidth: 980,
    });

    const imgData = canvas.toDataURL("image/png");

    // Crear PDF estándar A4 vertical (595.28 x 841.89 pt)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Margen uniforme de 10 puntos para ajuste perfecto de 1 página
    const margin = 12;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    let renderWidth = availWidth;
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > availHeight) {
      renderHeight = availHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const posX = (pageWidth - renderWidth) / 2;
    const posY = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight, undefined, "FAST");

    const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(finalName);
  } catch (err) {
    console.error("Error al exportar PDF con html2canvas, recurriendo a impresión del sistema:", err);
    window.print();
  } finally {
    // Restaurar estilos originales
    container.style.transform = originalTransform;
    container.style.transition = originalTransition;
    container.style.margin = originalMargin;
    container.style.width = originalWidth;
    container.style.minWidth = originalMinWidth;
    container.style.maxWidth = originalMaxWidth;
  }
}
