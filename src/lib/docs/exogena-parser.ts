import * as XLSX from "xlsx";
import type { Declaration } from "@/lib/tax/types";

export interface ExogenaTerceroItem {
  informanteNit: string;
  informanteNombre: string;
  reportadoNit: string;
  reportadoNombre: string;
  detalle: string;
  valor: number;
  casillaSugerida?: string;
  infoAdicional?: string;
}

export interface ExogenaParseResult {
  ok: boolean;
  error?: string;
  year?: number;
  tipoDocumento?: string;
  nit?: string;
  nombre?: string;
  items: ExogenaTerceroItem[];
  resumen: {
    patrimonioBruto: number;
    deudas: number;
    ingresosTrabajo: number;
    ingresosHonorarios: number;
    ingresosCapital: number;
    ingresosNoLaborales: number;
    retencionesFuente: number;
    saludObligatoria: number;
    pensionObligatoria: number;
    cesantias: number;
    interesesVivienda: number;
    gmf: number;
    consignacionesBancarias: number;
    consumosTarjetas: number;
    comprasTotales: number;
  };
  amountsToApply: Record<string, number>;
}

export function parseExogenaExcel(bufferOrArray: ArrayBuffer | Uint8Array): ExogenaParseResult {
  try {
    const wb = XLSX.read(bufferOrArray, { type: "array" });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        ok: false,
        error: "El archivo Excel no contiene hojas de datos válidas.",
        items: [],
        resumen: emptyResumen(),
        amountsToApply: {},
      };
    }

    let year = 2025;
    let tipoDocumento = "C. C.";
    let nit = "";
    let nombre = "";

    const items: ExogenaTerceroItem[] = [];
    const resumen = emptyResumen();
    const amountsToApply: Record<string, number> = {};

    // 1. Extraer Metadatos del Encabezado en todas las hojas
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;
      const rawRows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      for (let i = 0; i < Math.min(25, rawRows.length); i++) {
        const row = rawRows[i] || [];
        const rowText = row.map((c) => String(c || "").trim()).join(" ");

        if (/Año al que se refiere/i.test(rowText) && !year) {
          const found = rowText.match(/\b(202[0-9])\b/);
          if (found) year = parseInt(found[1], 10);
        }
        if (/Tipo de documento:/i.test(rowText) && tipoDocumento === "C. C.") {
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || "").trim();
            if (/C\.?\s*C\.?|NIT|C\.?\s*E\.?|Pasaporte/i.test(val) && !val.includes("Tipo de documento")) {
              tipoDocumento = val;
              break;
            }
          }
        }
        if (/Identificación:/i.test(rowText) && !nit && !/consultante/i.test(rowText)) {
          const numMatch = rowText.match(/Identificación:\s*([0-9]+)/i);
          if (numMatch) {
            nit = numMatch[1];
          } else {
            for (let j = 0; j < row.length; j++) {
              const val = String(row[j] || "").trim();
              if (/^\d{6,12}$/.test(val)) {
                nit = val;
                break;
              }
            }
          }
        }
        if (/Nombres\s*\/\s*Razón social:/i.test(rowText) && !nombre) {
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || "").trim();
            if (val && !val.includes("Nombres") && !val.includes("Razón social") && val.length > 3) {
              nombre = val;
              break;
            }
          }
        }
      }
    }

    // 2. Procesar Tablas de Datos en todas las hojas del archivo Excel
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;
      const rawRows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rawRows.length === 0) continue;

      // Detectar fila de encabezados de la tabla y mapeo de columnas
      let dataHeaderIndex = -1;
      let colNitInf = 0;
      let colNomInf = 1;
      let colNitTerc = 2;
      let colNomTerc = 3;
      let colDetalle = 4;
      let colValor = 5;
      let colSugerida = 6;
      let colInfoAdic = 7;

      for (let i = 0; i < Math.min(30, rawRows.length); i++) {
        const row = rawRows[i] || [];
        const rowStr = row.map((c) => String(c || "")).join("|");

        if (/NIT/i.test(rowStr) && (/Detalle|Concepto/i.test(rowStr) || /Valor|Saldo|Monto/i.test(rowStr) || /Razón Social|Nombre/i.test(rowStr))) {
          dataHeaderIndex = i;

          // Mapear columnas dinámicamente si los nombres coinciden
          for (let c = 0; c < row.length; c++) {
            const head = String(row[c] || "").trim().toLowerCase();
            if (/nit.*informante|nit.*persona.*reporta/i.test(head)) colNitInf = c;
            else if (/nombre.*informante|raz[oó]n.*informante/i.test(head)) colNomInf = c;
            else if (/nit.*tercero|identificaci[oó]n.*reportad/i.test(head)) colNitTerc = c;
            else if (/nombre.*tercero|raz[oó]n.*reportad/i.test(head)) colNomTerc = c;
            else if (/detalle|concepto|descripci[oó]n/i.test(head)) colDetalle = c;
            else if (/valor|saldo|monto|cuant[ií]a/i.test(head)) colValor = c;
            else if (/sugerid|casilla/i.test(head)) colSugerida = c;
            else if (/adicional|informaci[oó]n.*adic/i.test(head)) colInfoAdic = c;
          }
          break;
        }
      }

      const startIndex = dataHeaderIndex !== -1 ? dataHeaderIndex + 1 : 14;

      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i] || [];
        if (!row || row.length === 0) continue;

        const informanteNit = String(row[colNitInf] || "").trim();
        const informanteNombre = String(row[colNomInf] || "").trim();
        const reportadoNit = String(row[colNitTerc] || "").trim();
        const reportadoNombre = String(row[colNomTerc] || "").trim();
        const detalle = String(row[colDetalle] || "").trim();
        const rawValor = row[colValor];
        const casillaSugerida = String(row[colSugerida] || "").trim();
        const infoAdicional = String(row[colInfoAdic] || "").trim();

        const valor = typeof rawValor === "number" ? Math.round(rawValor) : parseValorNumber(rawValor);

        // Ignorar filas vacías
        if (!detalle && valor === 0 && !informanteNombre) continue;

        // Ignorar encabezados repetidos
        if (/NIT.*Informante|Concepto.*Detalle|Razón Social/i.test(informanteNit + informanteNombre + detalle)) continue;

        const item: ExogenaTerceroItem = {
          informanteNit,
          informanteNombre,
          reportadoNit,
          reportadoNombre,
          detalle,
          valor,
          casillaSugerida,
          infoAdicional,
        };

        items.push(item);
        classifyItem(item, resumen, amountsToApply);
      }
    }

    // Filtrar si hay múltiples registros y solo uno era un resumen de $0
    const finalItems = items.length > 1 ? items.filter((x) => x.valor > 0 || x.informanteNombre || !x.detalle.includes("Tope")) : items;

    return {
      ok: true,
      year,
      tipoDocumento,
      nit,
      nombre,
      items: finalItems,
      resumen,
      amountsToApply,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al procesar el archivo Excel de Exógena.",
      items: [],
      resumen: emptyResumen(),
      amountsToApply: {},
    };
  }
}

function parseValorNumber(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return Math.round(val);
  const clean = String(val).replace(/[\$,\s]/g, "").replace(/\./g, "");
  const parsed = parseInt(clean, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyResumen() {
  return {
    patrimonioBruto: 0,
    deudas: 0,
    ingresosTrabajo: 0,
    ingresosHonorarios: 0,
    ingresosCapital: 0,
    ingresosNoLaborales: 0,
    retencionesFuente: 0,
    saludObligatoria: 0,
    pensionObligatoria: 0,
    cesantias: 0,
    interesesVivienda: 0,
    gmf: 0,
    consignacionesBancarias: 0,
    consumosTarjetas: 0,
    comprasTotales: 0,
  };
}

function classifyItem(
  item: ExogenaTerceroItem,
  resumen: ReturnType<typeof emptyResumen>,
  amounts: Record<string, number>,
) {
  const d = item.detalle.toLowerCase();
  const v = item.valor;
  if (v <= 0) return;

  const add = (path: string, val: number) => {
    amounts[path] = (amounts[path] || 0) + val;
  };

  // Salarios y pagos laborales
  if (/salario|emolumento|sueldo|pago laboral|comisi[oó]n laboral/i.test(d)) {
    resumen.ingresosTrabajo += v;
    add("trabajo.salarios", v);
  }
  // Cesantías e intereses
  else if (/cesant[ií]a/i.test(d)) {
    resumen.cesantias += v;
    add("trabajo.cesantiasPagadas", v);
  }
  // Salud obligatoria
  else if (/aporte.*salud|salud obligatoria|cotizaci[oó]n.*salud/i.test(d)) {
    resumen.saludObligatoria += v;
    add("trabajo.aportesSaludObligatorios", v);
  }
  // Pensión obligatoria
  else if (/aporte.*pensi[oó]n|pensi[oó]n obligatoria|cotizaci[oó]n.*pensi[oó]n/i.test(d)) {
    resumen.pensionObligatoria += v;
    add("trabajo.aportesPensionObligatorios", v);
  }
  // Retenciones en la fuente
  else if (/retenci[oó]n.*fuente|autorretenci[oó]n/i.test(d)) {
    resumen.retencionesFuente += v;
    add("extra.retenciones", v);
  }
  // Cuentas bancarias y CDTs (Patrimonio)
  else if (/saldo.*cuenta|cuenta.*ahorro|cuenta.*corriente|certificado de dep[oó]sito|cdt|fiducia/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.cuentas", v);
  }
  // Deudas y créditos
  else if (/saldo.*deuda|saldo.*cr[eé]dito|obligaci[oó]n financiera|pr[eé]stamo/i.test(d)) {
    resumen.deudas += v;
    add("patrimonio.obligacionesFinancieras", v);
  }
  // Rendimientos e intereses financieros
  else if (/rendimiento.*financiero|inter[eé]s.*financiero|intereses abonados/i.test(d)) {
    resumen.ingresosCapital += v;
    add("capital.intereses", v);
  }
  // Intereses de vivienda
  else if (/inter[eé]s.*vivienda|cr[eé]dito hipotecario|leasing habitacional/i.test(d)) {
    resumen.interesesVivienda += v;
    add("trabajo.interesesVivienda", v);
  }
  // GMF (4x1000)
  else if (/gmf|gravamen.*movimientos financieros|4x1000/i.test(d)) {
    resumen.gmf += v;
    add("trabajo.gmf", v);
  }
  // Honorarios y servicios
  else if (/honorario|servicio personal|compensaci[oó]n servicio/i.test(d)) {
    resumen.ingresosHonorarios += v;
    add("honorarios.ingresos", v);
  }
  // Consignaciones / Consumos para control de topes
  else if (/consignaci[oó]n|movimiento cr[eé]dito/i.test(d)) {
    resumen.consignacionesBancarias += v;
  } else if (/tarjeta.*cr[eé]dito|consumo.*tarjeta/i.test(d)) {
    resumen.consumosTarjetas += v;
  } else if (/compra|adquisici[oó]n/i.test(d)) {
    resumen.comprasTotales += v;
  }
}
