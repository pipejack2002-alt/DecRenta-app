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
        /extracto|cuenta\s*de\s*ahorro|cuenta\s*corriente|bancolombia|nu\s*colombia|davivienda|banco|costos\s*totales|dep[oó]sito/i.test(
          fullText
        ) ||
        /extracto|cuenta|costos|banco|nu/i.test(fileName)
      ) {
        detectedKind = "extractoBanco";
      } else if (/certificado\s*de\s*retenci[oó]n|retenci[oó]n\s*en\s*la\s*fuente/i.test(fullText) || /retencion/i.test(fileName)) {
        detectedKind = "certRetencion";
      } else if (/c[eé]dula\s*de\s*ciudadan[ií]a|rep[uú]blica\s*de\s*colombia|registradur[ií]a/i.test(fullText) || /cedula/i.test(fileName)) {
        detectedKind = "rut";
      }
    }

    // Extracción de montos estructurados
    let parsedData: { amounts: Record<string, number>; notes: string } = { amounts: {}, notes: "" };

    if (detectedKind === "formato220" || /220/i.test(fileName)) {
      parsedData = parseFormato220Text(fullText);
    } else if (
      ["extractoBanco", "saldoCuentas", "certGmf", "certRendimientos"].includes(detectedKind) ||
      /extracto|cuenta|banco|costos|nu/i.test(fileName)
    ) {
      parsedData = parseCertificadoBancarioText(fullText);
    } else if (detectedKind === "certRetencion" || /retenci[oó]n/i.test(fileName)) {
      const retMatch = fullText.match(/(?:retenci[oó]n|valor\s*retenido|total\s*retenido)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i);
      if (retMatch) {
        const val = cleanCurrency(retMatch[1]);
        if (val > 0) {
          parsedData.amounts["extra.retenciones"] = val;
          parsedData.notes = `Retención en la fuente extraída: $${val.toLocaleString("es-CO")}`;
        }
      }
    }

    return {
      ok: true,
      text: fullText,
      numpages,
      amounts: parsedData.amounts,
      notes: parsedData.notes || (fullText ? `Texto extraído (${fullText.slice(0, 150)}...)` : "Archivo procesado."),
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
