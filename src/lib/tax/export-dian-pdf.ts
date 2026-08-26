import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ComputedDeclaration, Declaration } from "./types";

/**
 * Genera y descarga el PDF Oficial del Formulario 210 de la DIAN
 * con calidad profesional (ultra-alta resolución 3x, 0 distorsión,
 * proporciones exactas del formulario oficial de 1 página).
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

  // Guardar estado original de transform si había zoom activo
  const originalTransform = container.style.transform;
  const originalTransition = container.style.transition;
  const originalMargin = container.style.margin;

  try {
    container.style.transition = "none";
    container.style.transform = "none";
    container.style.margin = "0";

    // Capturar el formulario en altísima resolución (3x DPI)
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");

    // Crear PDF con dimensiones exactas al formulario para escala 100% perfecta y máxima legibilidad
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
      hotfixes: ["px_scaling"],
    });

    const pdfWidth = canvas.width / 2;
    const pdfHeight = canvas.height / 2;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

    const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(finalName);
  } catch (err) {
    console.error("Error al exportar PDF con html2canvas, recurriendo a impresión del sistema:", err);
    window.print();
  } finally {
    // Restaurar transform
    container.style.transform = originalTransform;
    container.style.transition = originalTransition;
    container.style.margin = originalMargin;
  }
}
