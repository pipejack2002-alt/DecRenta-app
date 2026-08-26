import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  cleanCurrency,
  parseFormato220Text,
  parseCertificadoBancarioText,
  parseCertCesantiasText,
  parseCertAfcFvpText,
  parseInteresesViviendaText,
  parseMedicinaPrepagadaText,
  parsePilaText,
  parseCertDeudasText,
  parseCertDividendosText,
  parseCertHonorariosText,
  parseAvaluoPredialText,
  parseIcetexText,
  parseDonacionesText,
  parsePensionJubilacionText,
  parseForm210AnteriorText,
} from "./pdf-extractor";
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
        /cesant[ií]as?|fondo\s*de\s*cesant[ií]as?|porvenir|protecci[oó]n|colfondos|skandia|fna/i.test(fullText) &&
        /cesant[ií]a/i.test(fullText)
      ) {
        detectedKind = "certCesantias";
      } else if (/afc|avc|voluntari[ao]s?\s*de\s*pensi[oó]n|fvp/i.test(fullText)) {
        detectedKind = "certAfc";
      } else if (/cr[eé]dito\s*hipotecario|intereses\s*de\s*vivienda|leasing\s*habitacional/i.test(fullText)) {
        detectedKind = "interesesHipoteca";
      } else if (/medicina\s*prepagada|plan\s*complementario|p[oó]liza\s*de\s*salud|sura|colsanitas|colmedica|coomeva|sanitas|allianz/i.test(fullText) && /salud|cuota|pago/i.test(fullText)) {
        detectedKind = "medicinaPrepagada";
      } else if (/planilla\s*[uú]nica|pila|aportes\s*en\s*l[ií]nea|soi|arus|simple|miplanilla/i.test(fullText) || /pila/i.test(fileName)) {
        detectedKind = "pila";
      } else if (/dividendos|participaciones|subc[eé]dula/i.test(fullText)) {
        detectedKind = "certDividendos";
      } else if (/honorarios|servicios\s*profesionales|cuenta\s*de\s*cobro/i.test(fullText)) {
        detectedKind = "certHonorarios";
      } else if (/aval[uú]o\s*catastral|impuesto\s*predial|predio/i.test(fullText)) {
        detectedKind = "avaluoCatastral";
      } else if (/icetex/i.test(fullText) || /icetex/i.test(fileName)) {
        detectedKind = "icetex";
      } else if (/donaci[oó]n|donante/i.test(fullText)) {
        detectedKind = "donaciones";
      } else if (/mesada\s*pensional|colpensiones|resoluci[oó]n\s*de\s*pensi[oó]n/i.test(fullText)) {
        detectedKind = "pensionJubilacion";
      } else if (/obligaci[oó]n\s*financiera|cr[eé]dito\s*de\s*consumo|tarjeta\s*de\s*cr[eé]dito|libranza|saldo\s*deuda/i.test(fullText)) {
        detectedKind = "certDeudas";
      } else if (/declaraci[oó]n\s*de\s*renta|formulario\s*210/i.test(fullText) && /2024|2023/i.test(fullText)) {
        detectedKind = "form210Anterior";
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

    // 1. Formato 220
    if (detectedKind === "formato220" || /220/i.test(fileName)) {
      parsedData = parseFormato220Text(fullText);
    }
    // 2. Cesantías
    else if (detectedKind === "certCesantias" || /cesant[ií]a/i.test(fileName)) {
      parsedData = parseCertCesantiasText(fullText);
    }
    // 3. AFC / FVP
    else if (["certAfc", "certPensionVoluntaria"].includes(detectedKind) || /afc|fvp|voluntari/i.test(fileName)) {
      parsedData = parseCertAfcFvpText(fullText);
    }
    // 4. Intereses Vivienda / Hipoteca
    else if (detectedKind === "interesesHipoteca" || /vivienda|hipoteca|leasing/i.test(fileName)) {
      parsedData = parseInteresesViviendaText(fullText);
    }
    // 5. Medicina Prepagada
    else if (detectedKind === "medicinaPrepagada" || /prepagada|poliza|salud/i.test(fileName)) {
      parsedData = parseMedicinaPrepagadaText(fullText);
    }
    // 6. PILA
    else if (detectedKind === "pila" || /pila|planilla/i.test(fileName)) {
      parsedData = parsePilaText(fullText);
    }
    // 7. Deudas y obligaciones financieras
    else if (detectedKind === "certDeudas" || /deuda|obligaci/i.test(fileName)) {
      parsedData = parseCertDeudasText(fullText);
    }
    // 8. Dividendos
    else if (detectedKind === "certDividendos" || /dividendo/i.test(fileName)) {
      parsedData = parseCertDividendosText(fullText);
    }
    // 9. Honorarios
    else if (detectedKind === "certHonorarios" || /honorario/i.test(fileName)) {
      parsedData = parseCertHonorariosText(fullText);
    }
    // 10. Avalúo / Predial
    else if (["avaluoCatastral", "predial", "certTradicion"].includes(detectedKind) || /avaluo|predial|catastral|tradicion/i.test(fileName)) {
      parsedData = parseAvaluoPredialText(fullText);
    }
    // 11. ICETEX
    else if (detectedKind === "icetex" || /icetex/i.test(fileName)) {
      parsedData = parseIcetexText(fullText);
    }
    // 12. Donaciones
    else if (detectedKind === "donaciones" || /donaci/i.test(fileName)) {
      parsedData = parseDonacionesText(fullText);
    }
    // 13. Pensiones
    else if (detectedKind === "pensionJubilacion" || /pension/i.test(fileName)) {
      parsedData = parsePensionJubilacionText(fullText);
    }
    // 14. Declaración 210 anterior
    else if (detectedKind === "form210Anterior" || /210.*anterior|renta.*anterior/i.test(fileName)) {
      parsedData = parseForm210AnteriorText(fullText);
    }
    // 15. Bancario / Extracto / Rendimientos / GMF / Retención
    else if (
      ["extractoBanco", "saldoCuentas", "certGmf", "certRendimientos", "certRetencion"].includes(detectedKind) ||
      /extracto|cuenta|banco|costos|nu|nequi|bogota|retencion|rendimiento/i.test(fileName) ||
      /cuenta\s*de\s*ahorros?|rendimientos|gravamen|4x1000|saldo\s*cuenta|bancolombia|nu\s*colombia/i.test(fullText)
    ) {
      parsedData = parseCertificadoBancarioText(fullText);

      // Si no encontró retención en banco y es certificado general de retención
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
    }
    // 16. RUT / Cédula
    else if (detectedKind === "rut" || /rut|cedula/i.test(fileName)) {
      const nitMatch = fullText.match(/(?:NIT|N[uú]mero\s*de\s*Identificaci[oó]n)[^\d]*(\d{7,12})/i);
      const nameMatch = fullText.match(/([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\s*(?:CL|CR|KR|AV|TV|DG|CQ|\d{2})/i);
      const nit = nitMatch ? nitMatch[1] : "";
      const name = nameMatch ? nameMatch[1].replace(/\s+/g, " ").trim() : "";
      parsedData.notes = `RUT / Documento DIAN registrado.${name ? ` Nombre: ${name}.` : ""}${nit ? ` NIT/CC: ${nit}.` : ""} Este documento no contiene montos tributarios — es un soporte de identidad.`;
    }

    // Heurística general: si no detectó montos pero hay números de moneda en el texto, dar nota de vista previa
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
