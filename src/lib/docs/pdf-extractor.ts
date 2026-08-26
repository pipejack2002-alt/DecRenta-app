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

/**
 * Parsea texto de un Formato 220 (Certificado de Ingresos y Retenciones de Trabajo)
 */
export function parseFormato220Text(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  // Normalizar texto
  const clean = text.replace(/,/g, "").replace(/\r/g, "\n");

  // Regex para capturar montos según casillas estándar del Formato 220
  // Casilla 37: Salarios
  const salariosMatch = clean.match(/(?:casilla\s*37|pagos\s*por\s*salarios|emolumentos)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (salariosMatch) {
    const val = parseInt(salariosMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.salarios"] = val;
      notesLines.push(`Salarios Formato 220: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Casilla 41: Prestaciones sociales
  const prestMatch = clean.match(/(?:casilla\s*41|prestaciones\s*sociales)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (prestMatch) {
    const val = parseInt(prestMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.otrasPrestaciones"] = val;
      notesLines.push(`Prestaciones sociales: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Casilla 46: Cesantías e intereses pagadas
  const cesMatch = clean.match(/(?:casilla\s*46|cesant[ií]as[\s\S]{1,25}pagadas)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (cesMatch) {
    const val = parseInt(cesMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.cesantiasPagadas"] = val;
      notesLines.push(`Cesantías pagadas: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Casilla 49: Aportes obligatorios a salud
  const saludMatch = clean.match(/(?:casilla\s*49|aportes\s*obligatorios\s*por\s*salud|salud\s*a\s*cargo\s*del\s*trabajador)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (saludMatch) {
    const val = parseInt(saludMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.aportesSaludObligatorios"] = val;
      notesLines.push(`Aportes a salud: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Casilla 50: Aportes obligatorios a pensión
  const penMatch = clean.match(/(?:casilla\s*50|aportes\s*obligatorios\s*a\s*fondos\s*de\s*pensiones|pensi[oó]n\s*a\s*cargo\s*del\s*trabajador)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (penMatch) {
    const val = parseInt(penMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.aportesPensionObligatorios"] = val;
      notesLines.push(`Aportes a pensión: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Casilla 53: Retenciones en la fuente
  const retMatch = clean.match(/(?:casilla\s*53|retenciones\s*en\s*la\s*fuente\s*practicadas|valor\s*de\s*la\s*retenci[oó]n)[\s\S]{1,60}?(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (retMatch) {
    const val = parseInt(retMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["extra.retenciones"] = val;
      notesLines.push(`Retención en la fuente practicada: $${val.toLocaleString("es-CO")}`);
    }
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
  const clean = text.replace(/,/g, "").replace(/\r/g, "\n");

  // Saldo a 31 de diciembre
  const saldoMatch = clean.match(/(?:saldo\s*(?:al|a|en)?\s*31[\s\S]{1,20}diciembre|saldo\s*final)[\s\S]{1,50}?\$?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (saldoMatch) {
    const val = parseInt(saldoMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["patrimonio.cuentas"] = val;
      notesLines.push(`Saldo bancario a 31 dic: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Rendimientos / intereses
  const rendMatch = clean.match(/(?:rendimientos|intereses\s*pagados|intereses\s*abonados)[\s\S]{1,50}?\$?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (rendMatch) {
    const val = parseInt(rendMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["capital.intereses"] = val;
      notesLines.push(`Rendimientos financieros: $${val.toLocaleString("es-CO")}`);
    }
  }

  // Retención en la fuente
  const retMatch = clean.match(/(?:retenci[oó]n\s*en\s*la\s*fuente|retenci[oó]n\s*practicada)[\s\S]{1,50}?\$?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (retMatch) {
    const val = parseInt(retMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["extra.retenciones"] = val;
      notesLines.push(`Retención en la fuente: $${val.toLocaleString("es-CO")}`);
    }
  }

  // GMF / 4x1000
  const gmfMatch = clean.match(/(?:gravamen\s*a\s*los\s*movimientos|gmf|4\s*x\s*1000)[\s\S]{1,50}?\$?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
  if (gmfMatch) {
    const val = parseInt(gmfMatch[1].replace(/\./g, ""), 10);
    if (val > 0) {
      amounts["trabajo.gmf"] = val;
      notesLines.push(`GMF / 4x1000: $${val.toLocaleString("es-CO")}`);
    }
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
