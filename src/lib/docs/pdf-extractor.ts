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

  // 1. Saldo Nu / Bancolombia / Nequi / Davivienda / BBVA / Occidente / Otros Bancos
  const banSaldo = extractPattern(/Saldo\s*cuenta\s*(?:de\s*)?ahorros[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*cuenta\s*corriente[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Dinero\s*en\s*tus\s*cajitas[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i) ||
    extractPattern(/Saldo\s*al\s*cierre[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*Dep[oó]sito\s*de\s*bajo\s*monto[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*al\s*corte[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*a(?:l)?\s*31\s*de\s*diciembre[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*Final[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Saldo[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (banSaldo > 0) {
    amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + banSaldo;
    notesLines.push(`Saldo Bancario: $${banSaldo.toLocaleString("es-CO")}`);
  }

  // 1b. Nequi extracto — "Total cargos Saldo actual $X,XXX.XX $Y,YYY.YY"
  if (!amounts["patrimonio.cuentas"]) {
    const nequiSaldoMatch = text.match(/Total\s+cargos\s+Saldo\s+actual\s+\$[0-9,\.]+\s+\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i) ||
      text.match(/Saldo\s+actual\s+\$[0-9,\.]+\s+\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
    if (nequiSaldoMatch && nequiSaldoMatch[1]) {
      const nequiSaldo = cleanCurrency(nequiSaldoMatch[1]);
      if (nequiSaldo > 0) {
        amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + nequiSaldo;
        notesLines.push(`Saldo Actual (Nequi): $${nequiSaldo.toLocaleString("es-CO")}`);
      }
    }
  }

  // 1c. Banco Bogotá extracto — "Saldo Final:   1,234.56" (formato US)
  const bogSaldo = extractPattern(/Saldo\s+Final:\s+([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (bogSaldo > 0 && !amounts["patrimonio.cuentas"]) {
    amounts["patrimonio.cuentas"] = (amounts["patrimonio.cuentas"] || 0) + bogSaldo;
    notesLines.push(`Saldo Final (Banco Bogotá): $${bogSaldo.toLocaleString("es-CO")}`);
  }

  // 2. GMF (4x1.000) Nu / Nequi / Bancolombia / Bogotá / Otros
  const gmf = extractPattern(/Grav[aá]men(?:es)?\s*a\s*los\s*movimientos\s*financieros[\s\S]{0,100}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*GMF[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/GMF\s*(?:o\s*4x1000)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Vr\s*Gravamen[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/i);
  if (gmf > 0) {
    amounts["trabajo.gmf"] = (amounts["trabajo.gmf"] || 0) + gmf;
    notesLines.push(`GMF (4x1000): $${gmf.toLocaleString("es-CO")}`);
  }

  // 2b. Banco Bogotá extracto GMF — "Total   4x1000 GMF:   1,234.56" (formato US)
  const bogGmf = extractPattern(/Total\s+4x1000\s+GMF:\s+([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (bogGmf > 0 && !amounts["trabajo.gmf"]) {
    amounts["trabajo.gmf"] = (amounts["trabajo.gmf"] || 0) + bogGmf;
    notesLines.push(`GMF 4x1000 (Banco Bogotá): $${bogGmf.toLocaleString("es-CO")}`);
  }

  // 3. Rendimientos / Intereses (Rentas de Capital) Nu / Nequi / Bancolombia / Davivienda / BBVA
  const rend = extractPattern(/Rendimientos\s*(?:totales|financieros|causados|abonados|brutos|pagados)?(?:\s*del\s*a[ñn]o)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Rendimientos\s*\|\s*[\d,]+%\s*Efectivo[\s\S]{0,30}?\+\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i) ||
    extractPattern(/Valor\s+de\s+intereses\s+pagados\s+\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i) ||
    extractPattern(/Intereses\s*(?:totales|financieros|causados|abonados|pagados)?(?:\s*del\s*a[ñn]o)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Rendimientos[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (rend > 0) {
    amounts["capital.intereses"] = (amounts["capital.intereses"] || 0) + rend;
    notesLines.push(`Rendimientos/Intereses: $${rend.toLocaleString("es-CO")}`);
  }

  // 3b. Banco Bogotá extracto intereses — "Total   Intereses:   123.45" (formato US)
  const bogIntereses = extractPattern(/Total\s+Intereses:\s+([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (bogIntereses > 0 && !amounts["capital.intereses"]) {
    amounts["capital.intereses"] = (amounts["capital.intereses"] || 0) + bogIntereses;
    notesLines.push(`Intereses (Banco Bogotá): $${bogIntereses.toLocaleString("es-CO")}`);
  }

  // 4. Retenciones bancarias practicadas
  const retBan = extractPattern(/Retenci[oó]n\s*en\s*la\s*fuente(?:\s*practicada)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (retBan > 0) {
    amounts["extra.retenciones"] = (amounts["extra.retenciones"] || 0) + retBan;
    notesLines.push(`Retención bancaria: $${retBan.toLocaleString("es-CO")}`);
  }

  // 4b. Banco Bogotá extracto retención — "Total   Retencion:   123.45" (formato US)
  const bogRet = extractPattern(/Total\s+Retenci[oó]n:\s+([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (bogRet > 0 && !amounts["extra.retenciones"]) {
    amounts["extra.retenciones"] = (amounts["extra.retenciones"] || 0) + bogRet;
    notesLines.push(`Retención (Banco Bogotá): $${bogRet.toLocaleString("es-CO")}`);
  }

  // Detectar entidad bancaria para nota informativa
  const entityNote = /nu\s*colombia|nu\s*bank|cuentanu/i.test(text) ? "Nu Colombia" :
    /bancolombia/i.test(text) ? "Bancolombia" :
    /nequi/i.test(text) ? "Nequi" :
    /banco\s*de\s*bogot[aá]|banco\s*bogot[aá]/i.test(text) ? "Banco de Bogotá" :
    /davivienda/i.test(text) ? "Davivienda" :
    /bbva/i.test(text) ? "BBVA" :
    /occidente/i.test(text) ? "Banco de Occidente" :
    /popular/i.test(text) ? "Banco Popular" :
    /itau|itaú/i.test(text) ? "Itaú" :
    /scotiabank|colpatria/i.test(text) ? "Scotiabank Colpatria" : null;

  const defaultNote = notesLines.length === 0
    ? `Documento bancario leído${entityNote ? ` (${entityNote})` : ""}. No se encontraron montos con valor positivo (pueden ser cuentas en $0 o documentos sin cifras tributarias).`
    : null;

  return {
    amounts,
    notes: notesLines.join(" | ") || defaultNote || "Certificado bancario registrado.",
  };
}

/**
 * Parsea certificados de Fondos de Cesantías (Porvenir, Protección, Colfondos, Skandia, FNA)
 */
export function parseCertCesantiasText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const retiros = extractPattern(/(?:retiros?|pagos?|desembolsos?)(?:\s*de\s*cesant[ií]as?)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Retiros?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (retiros > 0) {
    amounts["trabajo.cesantiasPagadas"] = retiros;
    notesLines.push(`Cesantías pagadas/retiradas: $${retiros.toLocaleString("es-CO")}`);
  }

  const consig = extractPattern(/(?:consignaciones?|aportes?)(?:\s*del\s*a[ñn]o)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Aportes?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (consig > 0 && consig !== retiros) {
    amounts["trabajo.cesantiasFondo"] = consig;
    notesLines.push(`Cesantías consignadas al fondo: $${consig.toLocaleString("es-CO")}`);
  }

  const saldo2016 = extractPattern(/(?:saldo|acumulado)\s*(?:a|al)?\s*31\s*de\s*diciembre\s*(?:de\s*)?2016[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (saldo2016 > 0) {
    amounts["trabajo.cesantiasAcumuladas2016"] = saldo2016;
    notesLines.push(`Saldo cesantías a 31/12/2016: $${saldo2016.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de cesantías registrado." };
}

/**
 * Parsea certificados de AFC / Fondos Voluntarios de Pensión (FVP / AVC)
 */
export function parseCertAfcFvpText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const aportes = extractPattern(/(?:aportes?|dep[oó]sitos?)(?:\s*(?:del\s*a[ñn]o|voluntarios?))?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Aportes?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Valor\s*(?:del\s*)?Aporte[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (aportes > 0) {
    amounts["trabajo.aportesAfcFvpAvc"] = aportes;
    notesLines.push(`Aportes AFC/FVP (Renta Exenta): $${aportes.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado AFC/FVP registrado." };
}

/**
 * Parsea certificados de Intereses de Vivienda / Leasing Habitacional
 */
export function parseInteresesViviendaText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const intViv = extractPattern(/(?:intereses|correcci[oó]n\s*monetaria)(?:\s*pagados?)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Intereses\s*Pagados[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Valor\s*Deducible[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (intViv > 0) {
    amounts["trabajo.interesesVivienda"] = intViv;
    notesLines.push(`Intereses de vivienda: $${intViv.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de crédito de vivienda registrado." };
}

/**
 * Parsea certificados de Medicina Prepagada / Seguros de Salud
 */
export function parseMedicinaPrepagadaText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const prepagada = extractPattern(/(?:total\s*pagado|valor\s*pagado|pagos\s*realizados)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*(?:Aportes|Cuotas)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (prepagada > 0) {
    amounts["trabajo.medicinaPrepagada"] = prepagada;
    notesLines.push(`Medicina prepagada / salud: $${prepagada.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de medicina prepagada registrado." };
}

/**
 * Parsea planillas PILA / Seguridad Social
 */
export function parsePilaText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const salud = extractPattern(/(?:salud|eps)[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Aporte\s*Salud[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (salud > 0) {
    amounts["trabajo.aportesSaludObligatorios"] = salud;
    notesLines.push(`PILA Salud: $${salud.toLocaleString("es-CO")}`);
  }

  const pen = extractPattern(/(?:pensi[oó]n|afp)[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Aporte\s*Pensi[oó]n[\s\S]{0,30}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (pen > 0) {
    amounts["trabajo.aportesPensionObligatorios"] = pen;
    notesLines.push(`PILA Pensión: $${pen.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Planilla PILA registrada." };
}

/**
 * Parsea certificados de Deudas y Obligaciones Financieras a 31 de Diciembre
 */
export function parseCertDeudasText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const deuda = extractPattern(/(?:saldo|deuda|capital|saldo\s*pendiente|obligaci[oó]n)(?:\s*(?:a|al)?\s*31\s*de\s*diciembre)?[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Saldo\s*Capital[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Obligaciones[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (deuda > 0) {
    amounts["patrimonio.obligacionesFinancieras"] = deuda;
    notesLines.push(`Deudas / Obligaciones financieras: $${deuda.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de deuda financiera registrado." };
}

/**
 * Parsea certificados de Dividendos y Participaciones
 */
export function parseCertDividendosText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const divNoGrav = extractPattern(/(?:no\s*gravados?|subc[eé]dula\s*1|art[ií]culo\s*49\s*num\s*3)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (divNoGrav > 0) {
    amounts["dividendos.subcedula1"] = divNoGrav;
    notesLines.push(`Dividendos No Gravados (Subcédula 1): $${divNoGrav.toLocaleString("es-CO")}`);
  }

  const divGrav = extractPattern(/(?:gravados?|subc[eé]dula\s*2|par[aá]grafo\s*2\s*art[ií]culo\s*49)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (divGrav > 0) {
    amounts["dividendos.subcedula2"] = divGrav;
    notesLines.push(`Dividendos Gravados (Subcédula 2): $${divGrav.toLocaleString("es-CO")}`);
  }

  const totalDiv = extractPattern(/Total\s*Dividendos[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (totalDiv > 0 && !divNoGrav && !divGrav) {
    amounts["dividendos.subcedula1"] = totalDiv;
    notesLines.push(`Total Dividendos: $${totalDiv.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de dividendos registrado." };
}

/**
 * Parsea certificados de Honorarios y Servicios (Independientes)
 */
export function parseCertHonorariosText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const honorarios = extractPattern(/(?:total\s*pagado|valor\s*bruto|honorarios|servicios)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Valor\s*Total\s*del\s*Contrato[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (honorarios > 0) {
    amounts["honorarios.ingresos"] = honorarios;
    notesLines.push(`Honorarios brutos: $${honorarios.toLocaleString("es-CO")}`);
  }

  const ret = extractPattern(/(?:retenci[oó]n|valor\s*retenido)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (ret > 0) {
    amounts["extra.retenciones"] = ret;
    notesLines.push(`Retención practicada: $${ret.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de honorarios registrado." };
}

/**
 * Parsea Avalúos Catastrales e Impuesto Predial
 */
export function parseAvaluoPredialText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const avaluo = extractPattern(/(?:aval[uú]o\s*catastral|base\s*gravable|autoaval[uú]o)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Valor\s*Aval[uú]o[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (avaluo > 0) {
    amounts["patrimonio.inmuebles"] = avaluo;
    notesLines.push(`Avalúo fiscal inmueble: $${avaluo.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Soporte de inmueble / predial registrado." };
}

/**
 * Parsea Certificados de Intereses ICETEX
 */
export function parseIcetexText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const icetex = extractPattern(/(?:intereses|valor\s*intereses|intereses\s*pagados)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i) ||
    extractPattern(/Total\s*Intereses[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (icetex > 0) {
    amounts["trabajo.icetex"] = icetex;
    notesLines.push(`Intereses ICETEX (deducción): $${icetex.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado ICETEX registrado." };
}

/**
 * Parsea Certificados de Donaciones
 */
export function parseDonacionesText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const donacion = extractPattern(/(?:donaci[oó]n|valor\s*donado|monto\s*donaci[oó]n)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (donacion > 0) {
    amounts["descuentos.donaciones"] = donacion;
    notesLines.push(`Donaciones ESAL (Descuento 25%): $${donacion.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de donación registrado." };
}

/**
 * Parsea Certificados de Pensiones de Jubilación / Invalidez
 */
export function parsePensionJubilacionText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const mesadas = extractPattern(/(?:total\s*mesadas|mesadas\s*pensionales|ingresos\s*por\s*pensi[oó]n|total\s*pagado)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (mesadas > 0) {
    amounts["pensiones.ingresos"] = mesadas;
    notesLines.push(`Ingresos por pensión: $${mesadas.toLocaleString("es-CO")}`);
  }

  const salud = extractPattern(/(?:descuento\s*salud|aportes?\s*a\s*salud)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (salud > 0) {
    amounts["pensiones.incrngo"] = salud;
    notesLines.push(`Descuento salud pensiones: $${salud.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Certificado de pensiones registrado." };
}

/**
 * Parsea Formulario 210 del Año Anterior
 */
export function parseForm210AnteriorText(text: string): { amounts: Record<string, number>; notes: string } {
  const amounts: Record<string, number> = {};
  const notesLines: string[] = [];

  function extractPattern(regex: RegExp): number {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = cleanCurrency(match[1]);
      if (num > 0 && num !== 2024 && num !== 2025 && num !== 2026) return num;
    }
    return 0;
  }

  const ant = extractPattern(/(?:anticipo\s*renta\s*a[ñn]o\s*gravable\s*siguiente|casilla\s*130)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (ant > 0) {
    amounts["extra.anticipoAnterior"] = ant;
    notesLines.push(`Anticipo liquidado año anterior: $${ant.toLocaleString("es-CO")}`);
  }

  const sf = extractPattern(/(?:saldo\s*a\s*favor\s*sin\s*solicitud\s*de\s*devoluci[oó]n|casilla\s*131)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (sf > 0) {
    amounts["extra.saldoFavorAnterior"] = sf;
    notesLines.push(`Saldo a favor año anterior: $${sf.toLocaleString("es-CO")}`);
  }

  const impNeto = extractPattern(/(?:impuesto\s*neto\s*de\s*renta|casilla\s*125)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (impNeto > 0) {
    amounts["extra.impuestoNetoAnterior"] = impNeto;
    notesLines.push(`Impuesto neto año anterior: $${impNeto.toLocaleString("es-CO")}`);
  }

  const patLiq = extractPattern(/(?:patrimonio\s*l[ií]quido|casilla\s*31)[\s\S]{0,40}?\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,]\d{2})?)/i);
  if (patLiq > 0) {
    amounts["patrimonio.patrimonioLiquidoAnterior"] = patLiq;
    notesLines.push(`Patrimonio líquido inicial: $${patLiq.toLocaleString("es-CO")}`);
  }

  return { amounts, notes: notesLines.join(" | ") || "Declaración anterior registrada." };
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
