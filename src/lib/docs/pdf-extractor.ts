import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "module";

export interface PdfExtractionResult {
  ok: boolean;
  text: string;
  numpages: number;
  amounts: Record<string, number>;
  notes: string;
  detectedKind?: string;
  error?: string;
}

function extractAmount(text: string, patterns: RegExp[]): number {
  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const numStr = match[1].replace(/[\$,\s]/g, "").replace(/\./g, "");
      const val = parseInt(numStr, 10);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return 0;
}

/**
 * Parsea texto de un Formato 220 (Certificado de Ingresos y Retenciones de Trabajo)
 */
export function parseFormato220Text(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  // 1. Salarios (Casilla 37)
  const salarios = extractAmount(text, [
    /(?:37\.?|casilla\s*37|pagos\s*por\s*salarios|salarios|emolumentos)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{5,12})/i,
    /(?:salarios\s*o\s*emolumentos)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{5,12})/i,
  ]);
  if (salarios > 0) {
    amounts["trabajo.salarios"] = salarios;
    notesLines.push(`Salarios Formato 220: $${salarios.toLocaleString("es-CO")}`);
  }

  // 2. Prestaciones sociales (Casilla 41)
  const prest = extractAmount(text, [
    /(?:41\.?|casilla\s*41|prestaciones\s*sociales|primas)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{5,12})/i,
  ]);
  if (prest > 0) {
    amounts["trabajo.otrasPrestaciones"] = prest;
    notesLines.push(`Prestaciones sociales: $${prest.toLocaleString("es-CO")}`);
  }

  // 3. Cesantías pagadas (Casilla 46)
  const ces = extractAmount(text, [
    /(?:46\.?|casilla\s*46|cesant[ií]as[\s\S]{1,25}pagadas)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (ces > 0) {
    amounts["trabajo.cesantiasPagadas"] = ces;
    notesLines.push(`Cesantías pagadas: $${ces.toLocaleString("es-CO")}`);
  }

  // 4. Aportes obligatorios a salud (Casilla 49)
  const salud = extractAmount(text, [
    /(?:49\.?|casilla\s*49|aportes\s*obligatorios\s*por\s*salud|salud\s*a\s*cargo)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (salud > 0) {
    amounts["trabajo.aportesSaludObligatorios"] = salud;
    notesLines.push(`Aportes salud: $${salud.toLocaleString("es-CO")}`);
  }

  // 5. Aportes obligatorios a pensión (Casilla 50)
  const pen = extractAmount(text, [
    /(?:50\.?|casilla\s*50|aportes\s*obligatorios\s*a\s*fondos\s*de\s*pensiones|pensi[oó]n|solidaridad)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (pen > 0) {
    amounts["trabajo.aportesPensionObligatorios"] = pen;
    notesLines.push(`Aportes pensión: $${pen.toLocaleString("es-CO")}`);
  }

  // 6. Retenciones en la fuente (Casilla 53)
  const ret = extractAmount(text, [
    /(?:53\.?|casilla\s*53|retenciones\s*en\s*la\s*fuente|valor\s*de\s*las?\s*retenci[oó]n|retenci[oó]n\s*practicada)[\s\S]{1,60}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (ret > 0) {
    amounts["extra.retenciones"] = ret;
    notesLines.push(`Retención en la fuente: $${ret.toLocaleString("es-CO")}`);
  }

  return {
    amounts,
    notes: notesLines.join(" | ") || "Valores extraídos de Formato 220.",
  };
}

/**
 * Parsea texto de extractos o certificados bancarios
 */
export function parseCertificadoBancarioText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  // Saldo a 31 de diciembre
  const saldo = extractAmount(text, [
    /(?:saldo\s*(?:al|a|en)?\s*31[\s\S]{1,20}diciembre|saldo\s*final|saldo\s*a\s*favor|saldo\s*disponible)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (saldo > 0) {
    amounts["patrimonio.cuentas"] = saldo;
    notesLines.push(`Saldo bancario a 31 dic: $${saldo.toLocaleString("es-CO")}`);
  }

  // Rendimientos / intereses
  const rend = extractAmount(text, [
    /(?:rendimientos|intereses\s*pagados|intereses\s*abonados|intereses\s*causados)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (rend > 0) {
    amounts["capital.intereses"] = rend;
    notesLines.push(`Rendimientos financieros: $${rend.toLocaleString("es-CO")}`);
  }

  // Retención en la fuente
  const ret = extractAmount(text, [
    /(?:retenci[oó]n\s*en\s*la\s*fuente|retenci[oó]n\s*practicada|retefuente)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (ret > 0) {
    amounts["extra.retenciones"] = ret;
    notesLines.push(`Retención en la fuente: $${ret.toLocaleString("es-CO")}`);
  }

  // GMF / 4x1000
  const gmf = extractAmount(text, [
    /(?:gravamen\s*a\s*los\s*movimientos|gmf|4\s*x\s*1000|cuatro\s*por\s*mil)[\s\S]{1,50}?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})+|[0-9]{4,12})/i,
  ]);
  if (gmf > 0) {
    amounts["trabajo.gmf"] = gmf;
    notesLines.push(`GMF / 4x1000: $${gmf.toLocaleString("es-CO")}`);
  }

  return {
    amounts,
    notes: notesLines.join(" | ") || "Valores extraídos de certificado bancario.",
  };
}

/**
 * Server Function para extraer texto completo y cifras de un PDF codificado en Base64
 */
export const extractPdfServerFn = createServerFn({ method: "POST" })
  .validator((input: { base64: string; fileName: string; kind?: string }) => input)
  .handler(async ({ data }): Promise<PdfExtractionResult> => {
    try {
      const require = createRequire(import.meta.url);
      const { PDFParse } = require("pdf-parse");

      const binaryStr = Buffer.from(data.base64, "base64");
      const parser = new PDFParse(new Uint8Array(binaryStr));
      const res = await parser.getText();
      const rawText = (typeof res === "string" ? res : res?.text || "").trim();

      let detectedKind = data.kind || "otro";
      if (!data.kind || data.kind === "otro") {
        if (/formulario\s*220|certificado\s*de\s*ingresos\s*y\s*retenciones/i.test(rawText) || /f220|220/i.test(data.fileName)) {
          detectedKind = "formato220";
        } else if (/extracto|cuenta\s*de\s*ahorro|cuenta\s*corriente|bancolombia|nu\s*colombia|davivienda|banco/i.test(rawText)) {
          detectedKind = "extractoBancario";
        } else if (/certificado\s*de\s*retenci[oó]n/i.test(rawText)) {
          detectedKind = "certificadoRetencion";
        }
      }

      let parsedData: { amounts: Record<string, number>; notes: string } = { amounts: {}, notes: "" };
      if (detectedKind === "formato220") {
        parsedData = parseFormato220Text(rawText);
      } else if (detectedKind === "extractoBancario" || detectedKind === "certificadoBancario") {
        parsedData = parseCertificadoBancarioText(rawText);
      }

      return {
        ok: true,
        text: rawText,
        numpages: 1,
        amounts: parsedData.amounts,
        notes: parsedData.notes,
        detectedKind,
      };
    } catch (err: any) {
      return {
        ok: false,
        text: "",
        numpages: 0,
        amounts: {},
        notes: "",
        error: err?.message || "Error al procesar el archivo PDF.",
      };
    }
  });
