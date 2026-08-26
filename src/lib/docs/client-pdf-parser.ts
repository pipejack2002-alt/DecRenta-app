import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { cleanCurrency, parseFormato220Text, parseCertificadoBancarioText } from "./pdf-extractor";
import type { DocKind } from "./types";

// Configurar el worker de pdf.js para navegador
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

export interface ClientParsedDocResult {
  ok: boolean;
  text: string;
  numpages: number;
  amounts: Record<string, number>;
  notes: string;
  detectedKind: DocKind;
  error?: string;
}

/**
 * Parsea un archivo directamente en el navegador del cliente (sin depender de red ni límites de servidor)
 * Idéntico al motor de importación de Exógena
 */
export async function parseDocumentInBrowser(
  buffer: ArrayBuffer,
  fileName: string,
  selectedKind?: DocKind
): Promise<ClientParsedDocResult> {
  try {
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    let fullText = "";
    let numpages = 1;

    // 1. Si es PDF
    if (ext === "pdf") {
      try {
        const data = new Uint8Array(buffer);
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        numpages = pdfDoc.numPages;

        const pageTexts: string[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
            .join(" ");
          pageTexts.push(pageText);
        }
        fullText = pageTexts.join("\n");
      } catch (pdfErr: any) {
        // Fallback a decodificación de texto utf-8 si falla el parser
        const decoder = new TextDecoder("utf-8");
        fullText = decoder.decode(buffer);
      }
    }
    // 2. Si es Excel (.xlsx, .xls, .csv)
    else if (["xlsx", "xls", "csv"].includes(ext)) {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetTexts: string[] = [];
        for (const sName of wb.SheetNames) {
          const sheet = wb.Sheets[sName];
          if (sheet) {
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv) sheetTexts.push(csv);
          }
        }
        fullText = sheetTexts.join("\n");
      } catch {
        fullText = "";
      }
    }
    // 3. Si es texto plano o XML
    else {
      const decoder = new TextDecoder("utf-8");
      fullText = decoder.decode(buffer);
    }

    // Clasificación de tipo
    let detectedKind: DocKind = selectedKind || "otro";
    if (!selectedKind || selectedKind === "otro") {
      if (
        /formulario\s*220|certificado\s*de\s*ingresos\s*y\s*retenciones|rentas\s*de\s*trabajo/i.test(fullText) ||
        /f220|220/i.test(fileName)
      ) {
        detectedKind = "formato220";
      } else if (
        /registro\s*[uú]nico\s*tributario|para\s*uso\s*exclusivo\s*de\s*la\s*dian.*formulario|tipo\s*de\s*contribuyente|c[eé]dula\s*de\s*ciudadan[ií]a.*registradur/i.test(fullText) ||
        /^14\d{9}\.pdf$/i.test(fileName) ||
        /rut|cedula.*dian|dian.*cedula/i.test(fileName)
      ) {
        detectedKind = "rut";
      } else if (
        /extracto|cuenta\s*de\s*ahorro|cuenta\s*corriente|bancolombia|nu\s*colombia|tu\s*cuenta\s*de\s*ahorros|davivienda|banco|costos\s*totales|dep[oó]sito|saldo\s*final:|4x1000\s*gmf:|nequi|rendimientos\s*totales/i.test(
          fullText
        ) ||
        /extracto|cuenta|costos|banco|nu|nequi|bogota|rendimiento/i.test(fileName)
      ) {
        detectedKind = "extractoBanco";
      } else if (/certificado\s*de\s*retenci[oó]n|retenci[oó]n\s*en\s*la\s*fuente/i.test(fullText) || /retencion/i.test(fileName)) {
        detectedKind = "certRetencion";
      }
    }

    // Extracción de montos estructurados
    let parsedData: { amounts: Record<string, number>; notes: string } = { amounts: {}, notes: "" };

    if (detectedKind === "formato220" || /220/i.test(fileName)) {
      parsedData = parseFormato220Text(fullText);
    } else if (
      ["extractoBanco", "saldoCuentas", "certGmf", "certRendimientos", "certRetencion"].includes(detectedKind) ||
      /extracto|cuenta|banco|costos|nu|nequi|bogota|retencion/i.test(fileName) ||
      /cuenta\s*de\s*ahorros?|rendimientos|gravamen|4x1000|saldo\s*cuenta|bancolombia|nu\s*colombia/i.test(fullText)
    ) {
      // 1. Ejecutar extractor bancario universal (saldo, rendimientos, GMF, retención bancaria)
      parsedData = parseCertificadoBancarioText(fullText);

      // 2. Si no encontró retención en banco y es un certificado general de retención, buscar retención estándar
      if (!parsedData.amounts["extra.retenciones"]) {
        const retMatch = fullText.match(/(?:retenci[oó]n|valor\s*retenido|total\s*retenido)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i);
        if (retMatch) {
          const val = cleanCurrency(retMatch[1]);
          if (val > 0) {
            parsedData.amounts["extra.retenciones"] = val;
            if (!parsedData.notes) parsedData.notes = `Retención en la fuente extraída: $${val.toLocaleString("es-CO")}`;
          }
        }
      }
    } else if (detectedKind === "rut") {
      // RUT / Cédula: extraer nombre y NIT para nota pero sin montos
      const nitMatch = fullText.match(/(?:NIT|N[uú]mero\s*de\s*Identificaci[oó]n)[^\d]*(\d{7,12})/i);
      const nameMatch = fullText.match(/([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\s*(?:CL|CR|KR|AV|TV|DG|CQ|\d{2})/i);
      const nit = nitMatch ? nitMatch[1] : "";
      const name = nameMatch ? nameMatch[1].replace(/\s+/g, " ").trim() : "";
      parsedData.notes = `RUT / Documento DIAN registrado.${name ? ` Nombre: ${name}.` : ""}${nit ? ` NIT/CC: ${nit}.` : ""} Este documento no contiene montos tributarios — es un soporte de identidad.`;
    }

    // Si no hay notas útiles, mostrar vista previa del texto extraído
    // para que el usuario pueda verificar que el documento sí fue leído
    let finalNotes = parsedData.notes;
    if (!finalNotes || finalNotes === "Valores extraídos de certificado bancario.") {
      const preview = fullText.replace(/\s+/g, " ").trim().slice(0, 300);
      finalNotes = preview
        ? `Documento leído. Texto detectado: «${preview}...» (sin montos automáticos — puede agregar manualmente abajo).`
        : "Archivo procesado. No se detectó texto (puede ser imagen — use OCR o péguelo manualmente).";
    }

    return {
      ok: true,
      text: fullText,
      numpages,
      amounts: parsedData.amounts,
      notes: finalNotes,
      detectedKind,
    };
  } catch (err: any) {
    return {
      ok: false,
      text: "",
      numpages: 0,
      amounts: {},
      notes: "",
      detectedKind: selectedKind || "otro",
      error: err?.message || "Error al procesar el archivo.",
    };
  }
}
