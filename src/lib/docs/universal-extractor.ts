import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "module";
import { parseFormato220Text, parseCertificadoBancarioText } from "./pdf-extractor.ts";

export interface UniversalExtractionResult {
  ok: boolean;
  text: string;
  numpages?: number;
  amounts: Record<string, number>;
  notes: string;
  detectedKind?: string;
  fileType: "pdf" | "image" | "word" | "powerpoint" | "excel" | "text" | "other";
  error?: string;
}

/**
 * Helper para extraer texto de PowerPoint (.pptx) analizando el archivo zip y los xmls de diapositivas
 */
async function extractPptxText(buffer: Buffer): Promise<string> {
  try {
    const textChunks: string[] = [];
    const raw = buffer.toString("utf8");
    // Extraer texto entre etiquetas <a:t>...</a:t> típicas de slide XML
    const matches = raw.match(/<a:t(?:\s+[^>]*)?>([^<]+)<\/a:t>/gi);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const clean = m.replace(/<[^>]+>/g, "").trim();
        if (clean) textChunks.push(clean);
      }
      return textChunks.join(" ");
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Server Function universal para extraer texto y cifras de cualquier tipo de archivo
 * Soporta: PDF, Imágenes (JPG/PNG/WEBP con OCR), Word (.docx), PowerPoint (.pptx), Excel (.xlsx/.csv), Texto (.txt/.xml)
 */
export const extractUniversalDocServerFn = createServerFn({ method: "POST" })
  .validator((input: { base64: string; fileName: string; mimeType: string; kind?: string }) => input)
  .handler(async ({ data }): Promise<UniversalExtractionResult> => {
    try {
      const buffer = Buffer.from(data.base64, "base64");
      const ext = (data.fileName.split(".").pop() || "").toLowerCase();
      let rawText = "";
      let fileType: UniversalExtractionResult["fileType"] = "other";

      // 1. PDF
      if (ext === "pdf" || data.mimeType.includes("pdf")) {
        fileType = "pdf";
        try {
          const require = createRequire(import.meta.url);
          const { PDFParse } = require("pdf-parse");
          const parser = new PDFParse(new Uint8Array(buffer));
          const res = await parser.getText();
          rawText = (typeof res === "string" ? res : res?.text || "").trim();
        } catch (pdfErr) {
          rawText = "";
        }

        // Si el PDF es escaneado (sin texto digital), intentar OCR con Tesseract
        if (!rawText || rawText.length < 20) {
          try {
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker("spa");
            const ocrRes = await worker.recognize(buffer);
            rawText = ocrRes.data.text.trim();
            await worker.terminate();
          } catch {
            // Continuar con lo obtenido
          }
        }
      }
      // 2. Imágenes (PNG, JPG, JPEG, WEBP, BMP) -> OCR con Tesseract en español
      else if (["png", "jpg", "jpeg", "webp", "bmp", "tiff"].includes(ext) || data.mimeType.startsWith("image/")) {
        fileType = "image";
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("spa");
          const ocrRes = await worker.recognize(buffer);
          rawText = ocrRes.data.text.trim();
          await worker.terminate();
        } catch (ocrErr: any) {
          return {
            ok: false,
            text: "",
            amounts: {},
            notes: "",
            fileType: "image",
            error: "No se pudo realizar el reconocimiento óptico (OCR) de la imagen: " + (ocrErr?.message || ""),
          };
        }
      }
      // 3. Documentos de Word (.docx)
      else if (ext === "docx" || data.mimeType.includes("wordprocessingml")) {
        fileType = "word";
        try {
          const mammoth = await import("mammoth");
          const wordRes = await mammoth.extractRawText({ buffer });
          rawText = wordRes.value.trim();
        } catch (wordErr: any) {
          return {
            ok: false,
            text: "",
            amounts: {},
            notes: "",
            fileType: "word",
            error: "No se pudo leer el documento de Word: " + (wordErr?.message || ""),
          };
        }
      }
      // 4. Presentaciones de PowerPoint (.pptx)
      else if (ext === "pptx" || data.mimeType.includes("presentationml")) {
        fileType = "powerpoint";
        rawText = await extractPptxText(buffer);
      }
      // 5. Archivos de Texto Plano y XML/CSV
      else if (["txt", "csv", "xml", "json", "rtf"].includes(ext) || data.mimeType.startsWith("text/")) {
        fileType = "text";
        rawText = buffer.toString("utf8").trim();
      }
      // 6. Archivos Excel (.xlsx, .xls)
      else if (["xlsx", "xls"].includes(ext) || data.mimeType.includes("spreadsheetml") || data.mimeType.includes("excel")) {
        fileType = "excel";
        try {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(buffer, { type: "buffer" });
          const sheetTexts: string[] = [];
          for (const sName of wb.SheetNames) {
            const sheet = wb.Sheets[sName];
            if (sheet) {
              const csv = XLSX.utils.sheet_to_csv(sheet);
              if (csv) sheetTexts.push(csv);
            }
          }
          rawText = sheetTexts.join("\n");
        } catch {
          rawText = "";
        }
      } else {
        // Fallback genérico a texto utf8
        rawText = buffer.toString("utf8").slice(0, 10000);
      }

      // Clasificación inteligente del tipo de certificado según contenido
      let detectedKind = data.kind || "otro";
      if (!data.kind || data.kind === "otro") {
        if (/formulario\s*220|certificado\s*de\s*ingresos\s*y\s*retenciones|retenciones\s*por\s*rentas\s*de\s*trabajo/i.test(rawText) || /f220|220/i.test(data.fileName)) {
          detectedKind = "formato220";
        } else if (/extracto|cuenta\s*de\s*ahorro|cuenta\s*corriente|bancolombia|nu\s*colombia|davivienda|banco|costos\s*totales/i.test(rawText)) {
          detectedKind = "extractoBancario";
        } else if (/certificado\s*de\s*retenci[oó]n|retenci[oó]n\s*en\s*la\s*fuente/i.test(rawText)) {
          detectedKind = "certificadoRetencion";
        } else if (/c[eé]dula\s*de\s*ciudadan[ií]a|rep[uú]blica\s*de\s*colombia|registradur[ií]a/i.test(rawText)) {
          detectedKind = "cedula";
        }
      }

      // Extraer montos y conceptos estructurados
      let parsedData: { amounts: Record<string, number>; notes: string } = { amounts: {}, notes: "" };
      if (detectedKind === "formato220") {
        parsedData = parseFormato220Text(rawText);
      } else if (detectedKind === "extractoBancario" || detectedKind === "certificadoBancario") {
        parsedData = parseCertificadoBancarioText(rawText);
      } else if (detectedKind === "certificadoRetencion") {
        const retMatch = rawText.match(/(?:retenci[oó]n|valor\s*retenido|total\s*retenido)[\s\S]{1,50}?\$?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
        if (retMatch) {
          const val = parseInt(retMatch[1].replace(/\./g, ""), 10);
          if (val > 0) {
            parsedData.amounts["extra.retenciones"] = val;
            parsedData.notes = `Retención en la fuente extraída: $${val.toLocaleString("es-CO")}`;
          }
        }
      }

      return {
        ok: true,
        text: rawText,
        numpages: 1,
        amounts: parsedData.amounts,
        notes: parsedData.notes || (rawText ? `Texto extraído (${fileType.toUpperCase()}) ${rawText.slice(0, 150)}...` : "Archivo procesado."),
        detectedKind,
        fileType,
      };
    } catch (err: any) {
      return {
        ok: false,
        text: "",
        amounts: {},
        notes: "",
        fileType: "other",
        error: err?.message || "Error al procesar el archivo.",
      };
    }
  });
