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

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026 && num !== 202511 && num !== 20251231) {
        return num;
      }
    }
    return 0;
  }

  // 1. Salarios (Casilla 36 en Formato 220)
  const sal = extractPattern(/Pagos\s*por\s*salarios[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i);
  if (sal > 0) {
    amounts["trabajo.salarios"] = sal;
    notesLines.push(`Salarios: $${sal.toLocaleString("es-CO")}`);
  }

  // 2. Prestaciones sociales (Casilla 42 en Formato 220)
  const prest = extractPattern(/(\d{1,3}(?:\.\d{3})+)\s*Pagos\s*por\s*vi[aá]ticos/i) ||
    extractPattern(/Pagos\s*por\s*prestaciones\s*sociales[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i);
  if (prest > 0 && prest !== sal) {
    amounts["trabajo.otrasPrestaciones"] = prest;
    notesLines.push(`Prestaciones sociales: $${prest.toLocaleString("es-CO")}`);
  }

  // 3. Cesantías pagadas al empleado (Casilla 47 en Formato 220)
  const cesPag = extractPattern(/Auxilio\s*de\s*cesant[ií]a[\s\S]*?efectivamente\s*pagados?[\s\S]{0,30}?(\d{1,3}(?:\.\d{3})+|\d{4,9})/i) ||
    extractPattern(/cesant[ií]a[\s\S]*?pagados?\s*al\s*empleado[\s\S]{0,30}?(\d{1,3}(?:\.\d{3})+|\d{4,9})/i);
  if (cesPag > 0 && cesPag !== 202511) {
    amounts["trabajo.cesantiasPagadas"] = cesPag;
    notesLines.push(`Cesantías pagadas: $${cesPag.toLocaleString("es-CO")}`);
  }

  // 4. Cesantías consignadas al fondo (Casilla 49 en Formato 220)
  const cesFondo = extractPattern(/Auxilio\s*de\s*cesant[ií]a[\s\S]*?consignado\s*al\s*fondo[\s\S]{0,30}?(\d{1,3}(?:\.\d{3})+|\d{4,9})/i) ||
    extractPattern(/cesant[ií]as?\s*consignadas?\s*al\s*fondo[\s\S]{0,30}?(\d{1,3}(?:\.\d{3})+|\d{4,9})/i);
  if (cesFondo > 0 && cesFondo !== 202511) {
    amounts["trabajo.cesantiasFondo"] = cesFondo;
    notesLines.push(`Cesantías consignadas al fondo: $${cesFondo.toLocaleString("es-CO")}`);
  }

  // 5. Salud (Casilla 53 en Formato 220)
  const salud = extractPattern(/Aportes\s*obligatorios\s*por\s*salud[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i) ||
    extractPattern(/salud\s*a\s*cargo\s*del\s*trabajador[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i);
  if (salud > 0 && salud !== 202511) {
    amounts["trabajo.aportesSaludObligatorios"] = salud;
    notesLines.push(`Aportes a salud: $${salud.toLocaleString("es-CO")}`);
  }

  // 6. Pensión (Casilla 54 en Formato 220)
  const pen = extractPattern(/Aportes\s*obligatorios\s*a\s*fondos\s*de\s*pensiones[\s\S]{0,90}?(\d{1,3}(?:\.\d{3})+)/i) ||
    extractPattern(/solidaridad\s*pensional[\s\S]{0,90}?(\d{1,3}(?:\.\d{3})+)/i);
  if (pen > 0 && pen !== 202511) {
    amounts["trabajo.aportesPensionObligatorios"] = pen;
    notesLines.push(`Aportes a pensión: $${pen.toLocaleString("es-CO")}`);
  }

  // 7. Retenciones en la fuente (Casilla 60 en Formato 220)
  const ret = extractPattern(/Valor\s*de\s*la\s*retenci[oó]n\s*en\s*la\s*fuente\s*por\s*rentas\s*de\s*trabajo[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i);
  if (ret > 0 && ret !== 202511) {
    amounts["extra.retenciones"] = ret;
    notesLines.push(`Retención en la fuente: $${ret.toLocaleString("es-CO")}`);
  }

  // 8. Ingreso laboral promedio últimos 6 meses (Casilla 59 en Formato 220 - Art. 206 num. 4 E.T.)
  const prom6m = extractPattern(/Ingreso\s*laboral\s*promedio\s*de\s*los\s*[uú]ltimos\s*seis\s*meses[\s\S]{0,50}?(\d{1,3}(?:\.\d{3})+)/i) ||
    extractPattern(/promedio[\s\S]{0,30}?[uú]ltimos\s*seis\s*meses[\s\S]{0,40}?(\d{1,3}(?:\.\d{3})+)/i);
  if (prom6m > 0 && prom6m !== 202511) {
    amounts["trabajo.promedioMensual6m"] = prom6m;
    notesLines.push(`Ingreso promedio 6m (C59): $${prom6m.toLocaleString("es-CO")}`);
  }

  return {
    amounts,
    notes: notesLines.join(" | ") || "Valores extraídos de Formato 220.",
  };
}

/**
 * Parsea texto de extractos o certificados bancarios de entidades financieras colombianas
 */
export function parseCertificadoBancarioText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026 && num !== 202511 && num !== 20251231) {
        return num;
      }
    }
    return 0;
  }

  // 1. Saldo Nu (Dinero en tus cajitas / Cuenta Nu al 31 de diciembre)
  const nuSaldo = extractPattern(/Dinero\s*en\s*tus\s*cajitas[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i) ||
    extractPattern(/Saldo\s*al\s*cierre[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i);
  if (nuSaldo > 0) {
    amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + nuSaldo;
    notesLines.push(`Saldo Cajitas Nu: $${nuSaldo.toLocaleString("es-CO")}`);
  }

  // 2. Saldo Bancolombia / Nequi / Davivienda / Otros Bancos
  const banSaldo = extractPattern(/Saldo\s*Dep[oó]sito\s*de\s*bajo\s*monto[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*al\s*corte[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*a\s*31\s*de\s*diciembre[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*Final[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (banSaldo > 0) {
    amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + banSaldo;
    notesLines.push(`Saldo Bancario: $${banSaldo.toLocaleString("es-CO")}`);
  }

  // 3. GMF Nu / Nequi / Bancolombia / Bogotá (4x1.000)
  const gmf = extractPattern(/Grav[aá]men(?:es)?\s*a\s*los\s*movimientos\s*financieros[\s\S]{0,100}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i) ||
    extractPattern(/Total\s*GMF[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i) ||
    extractPattern(/Vr\s*Gravamen[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/i) ||
    extractPattern(/Total\s*4x1000\s*GMF[\s\S]{0,30}?:\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/i);
  if (gmf > 0) {
    amounts["trabajo.gmf"] = (amounts["trabajo.gmf"] || 0) + gmf;
    notesLines.push(`GMF (4x1000): $${gmf.toLocaleString("es-CO")}`);
  }

  // 4. Rendimientos / Intereses Nu / Nequi / Bancolombia
  const rend = extractPattern(/Rendimientos\s*\|\s*[\d,]+%\s*Efectivo[\s\S]{0,30}?\+\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i) ||
    extractPattern(/Intereses\s*pagados[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i) ||
    extractPattern(/Rendimientos\s*financieros\s*abonados[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:,\d{2})?)/i);
  if (rend > 0) {
    amounts["capital.intereses"] = (amounts["capital.intereses"] || 0) + rend;
    notesLines.push(`Rendimientos/Intereses: $${rend.toLocaleString("es-CO")}`);
  }

  // 5. Retenciones bancarias practicadas
  const retBan = extractPattern(/Retenci[oó]n\s*en\s*la\s*fuente\s*practicada[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (retBan > 0) {
    amounts["extra.retenciones"] = (amounts["extra.retenciones"] || 0) + retBan;
    notesLines.push(`Retención bancaria: $${retBan.toLocaleString("es-CO")}`);
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
