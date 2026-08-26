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

export function cleanCurrency(valStr: string): number {
  if (!valStr) return 0;
  let s = valStr.replace(/[\$\s\+]/g, "").trim();
  // Formatos con decimales tipo 43.130,68 o 3.954.661,92
  if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } 
  // Formatos con decimales tipo 1,629,340.00 o 6,517.36
  else if (/^\d{1,3}(?:,\d{3})*\.\d{2}$/.test(s)) {
    s = s.replace(/,/g, "");
  }
  // Formatos enteros con puntos: 18.868.000 o 749.000 o 1.812.000
  else if (/^\d{1,3}(?:\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  // Formatos enteros con comas: 18,868,000
  else if (/^\d{1,3}(?:,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, "");
  }
  const n = Math.round(parseFloat(s));
  return isNaN(n) ? 0 : n;
}

/**
 * Parsea texto de un Formato 220 (Certificado de Ingresos y Retenciones de Trabajo)
 */
export function parseFormato220Text(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Salarios
    if (/pagos\s*por\s*salarios/i.test(line)) {
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
        const val = cleanCurrency(lines[j]);
        if (val > 1000000) {
          amounts["trabajo.salarios"] = val;
          notesLines.push(`Salarios: $${val.toLocaleString("es-CO")}`);
          break;
        }
      }
    }

    // Prestaciones sociales
    if (/pagos\s*por\s*prestaciones\s*sociales/i.test(line)) {
      for (let j = Math.max(0, i - 12); j <= Math.min(i + 4, lines.length - 1); j++) {
        if (/^\d{1,3}\.\d{3}\.000$/.test(lines[j]) || /^\d{1,3}\.\d{3}$/.test(lines[j])) {
          const val = cleanCurrency(lines[j]);
          if (val > 100000 && val < 15000000 && val !== amounts["trabajo.salarios"]) {
            amounts["trabajo.otrasPrestaciones"] = val;
            notesLines.push(`Prestaciones: $${val.toLocaleString("es-CO")}`);
            break;
          }
        }
      }
    }

    // Cesantías pagadas
    if (/cesant[ií]a[\s\S]*pagados?/i.test(line)) {
      const parts = line.split(/[\t:]+/);
      const val = cleanCurrency(parts[parts.length - 1]);
      if (val > 0) {
        amounts["trabajo.cesantiasPagadas"] = val;
        notesLines.push(`Cesantías pagadas: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Cesantías consignadas al fondo
    if (/cesant[ií]a[\s\S]*fondo/i.test(line)) {
      const parts = line.split(/[\t:]+/);
      const val = cleanCurrency(parts[parts.length - 1]);
      if (val > 0) {
        amounts["trabajo.cesantiasFondo"] = val;
        notesLines.push(`Cesantías consignadas al fondo: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Salud
    if (/salud\s*a\s*cargo\s*del\s*trabajador/i.test(line)) {
      const parts = line.split(/[\t:]+/);
      const val = cleanCurrency(parts[parts.length - 1]);
      if (val > 0) {
        amounts["trabajo.aportesSaludObligatorios"] = val;
        notesLines.push(`Aportes a salud: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Pensión
    if (/pensiones\s*y\s*solidaridad\s*pensional/i.test(line)) {
      const parts = line.split(/[\t:]+/);
      const val = cleanCurrency(parts[parts.length - 1]);
      if (val > 0) {
        amounts["trabajo.aportesPensionObligatorios"] = val;
        notesLines.push(`Aportes a pensión: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Retención en la fuente laboral
    if (/retenci[oó]n\s*en\s*la\s*fuente\s*por\s*rentas\s*de\s*trabajo/i.test(line)) {
      const parts = line.split(/[\t:]+/);
      const val = cleanCurrency(parts[parts.length - 1]);
      if (val > 0) {
        amounts["extra.retenciones"] = val;
        notesLines.push(`Retención en la fuente: $${val.toLocaleString("es-CO")}`);
      }
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
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Dinero en cajitas / cuentas Nu
    if (/dinero\s*en\s*tus\s*cajitas/i.test(line)) {
      const next = lines[i + 1] || "";
      const val = cleanCurrency(next);
      if (val > 0) {
        amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + val;
        notesLines.push(`Saldo Cajitas Nu: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Saldo Deposito bajo monto
    if (/saldo\s*dep[oó]sito\s*de\s*bajo\s*monto/i.test(line)) {
      const m = line.match(/\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/);
      if (m) {
        const val = cleanCurrency(m[1]);
        if (val > 0) {
          amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + val;
          notesLines.push(`Saldo Depósito Bancolombia: $${val.toLocaleString("es-CO")}`);
        }
      }
    }

    // GMF Nu / General
    if (/gravamen\s*a\s*los\s*movimientos\s*financieros|gmf/i.test(line)) {
      const m = line.match(/\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i);
      if (m) {
        const val = cleanCurrency(m[1]);
        if (val > 0) {
          amounts["trabajo.gmf"] = (amounts["trabajo.gmf"] || 0) + val;
          notesLines.push(`GMF: $${val.toLocaleString("es-CO")}`);
        }
      }
    }

    // GMF Bancolombia
    if (/Vr\s*Gravamen/i.test(line)) {
      const next = lines[i + 1] || "";
      const m = next.match(/\$?\s*([0-9]{1,3}(?:,\d{3})*(?:\.\d{2})?)$/);
      if (m) {
        const val = cleanCurrency(m[1]);
        if (val > 0) {
          amounts["trabajo.gmf"] = (amounts["trabajo.gmf"] || 0) + val;
          notesLines.push(`GMF Bancolombia: $${val.toLocaleString("es-CO")}`);
        }
      }
    }

    // Rendimientos Nu
    if (/Rendimientos\s*\|\s*[\d,]+%\s*Efectivo/i.test(line)) {
      const next = lines[i + 1] || "";
      const val = cleanCurrency(next);
      if (val > 0) {
        amounts["capital.intereses"] = (amounts["capital.intereses"] || 0) + val;
        notesLines.push(`Rendimientos Nu: $${val.toLocaleString("es-CO")}`);
      }
    }

    // Intereses Bancolombia
    if (/Intereses\s*pagados/i.test(line)) {
      const m = line.match(/Intereses\s*pagados[\s\S]*?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i);
      if (m) {
        const val = cleanCurrency(m[1]);
        if (val > 0) {
          amounts["capital.intereses"] = (amounts["capital.intereses"] || 0) + val;
          notesLines.push(`Intereses Bancolombia: $${val.toLocaleString("es-CO")}`);
        }
      }
    }

    // Retenciones bancarias
    if (/retenci[oó]n\s*en\s*la\s*fuente/i.test(line)) {
      const m = line.match(/(?:valor|total|vr)?\s*retenci[oó]n[\s\S]*?\$?\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
      if (m) {
        const val = cleanCurrency(m[1]);
        if (val > 0) {
          amounts["extra.retenciones"] = (amounts["extra.retenciones"] || 0) + val;
          notesLines.push(`Retención bancaria: $${val.toLocaleString("es-CO")}`);
        }
      }
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
