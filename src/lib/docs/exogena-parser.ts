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
    pensiones: number;
    dividendos: number;
    gananciasOcasionales: number;
    retencionesFuente: number;
    saludObligatoria: number;
    pensionObligatoria: number;
    cesantias: number;
    interesesVivienda: number;
    medicinaPrepagada: number;
    icetex: number;
    afcFvp: number;
    facturaElectronica: number;
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
    pensiones: 0,
    dividendos: 0,
    gananciasOcasionales: 0,
    retencionesFuente: 0,
    saludObligatoria: 0,
    pensionObligatoria: 0,
    cesantias: 0,
    interesesVivienda: 0,
    medicinaPrepagada: 0,
    icetex: 0,
    afcFvp: 0,
    facturaElectronica: 0,
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

  // 1. Salarios y pagos laborales (Formato 2276 / 1001)
  if (/salario|emolumento|sueldo|pago laboral|comisi[oó]n laboral|horas extra|recargo nocturno|vi[aá]tico|bonificaci[oó]n laboral|indemnizaci[oó]n laboral/i.test(d)) {
    resumen.ingresosTrabajo += v;
    add("trabajo.salarios", v);
  }
  // Cesantías e intereses sobre cesantías
  else if (/cesant[ií]a|intereses.*cesant[ií]a/i.test(d)) {
    resumen.cesantias += v;
    add("trabajo.cesantiasPagadas", v);
  }
  // Salud obligatoria (EPS / ADRES)
  else if (/aporte.*salud|salud obligatoria|cotizaci[oó]n.*salud|pago.*eps/i.test(d)) {
    resumen.saludObligatoria += v;
    add("trabajo.aportesSaludObligatorios", v);
  }
  // Pensión obligatoria y Fondo de Solidaridad Pensional
  else if (/aporte.*pensi[oó]n|pensi[oó]n obligatoria|cotizaci[oó]n.*pensi[oó]n|fondo de solidaridad/i.test(d)) {
    resumen.pensionObligatoria += v;
    add("trabajo.aportesPensionObligatorios", v);
  }
  // Pensiones de jubilación, vejez o invalidez
  else if (/mesada pensional|pensi[oó]n.*vejez|pensi[oó]n.*jubilaci[oó]n|pensi[oó]n.*invalidez|pensi[oó]n.*sobreviviente/i.test(d)) {
    resumen.pensiones += v;
    add("pensiones.ingresosBrutos", v);
  }
  // 2. Honorarios, servicios y comisiones independientes (Formato 1001 / 1007)
  else if (/honorario|servicio personal|servicio profesional|servicio t[eé]cnico|compensaci[oó]n servicio/i.test(d)) {
    resumen.ingresosHonorarios += v;
    add("honorarios.ingresos", v);
  }
  else if (/costo.*honorario|deducci[oó]n.*honorario|gasto.*servicio/i.test(d)) {
    add("honorarios.costosProcedentes", v);
  }
  // 3. Rentas de Capital, Arriendos y Rendimientos Financieros (Formato 1019 / 1020 / 1001 / 1007)
  else if (/rendimiento.*financiero|inter[eé]s.*financiero|intereses abonados|rendimiento.*cdt|intereses.*dep[oó]sito|rendimiento.*fiduciario/i.test(d)) {
    resumen.ingresosCapital += v;
    add("capital.intereses", v);
  }
  else if (/arrendamiento|alquiler.*inmueble|alquiler.*veh[ií]culo|arriendo/i.test(d)) {
    resumen.ingresosCapital += v;
    add("capital.arrendamientos", v);
  }
  else if (/regal[ií]a|propiedad intelectual|derecho de autor/i.test(d)) {
    resumen.ingresosCapital += v;
    add("capital.otros", v);
  }
  // 4. Rentas No Laborales / Comercio / Negocios (Formato 1007 / 1001)
  else if (/ingreso.*comercio|venta.*bienes|venta.*mercanc[ií]a|ingreso no laboral|actividad agropecuaria/i.test(d)) {
    resumen.ingresosNoLaborales += v;
    add("noLaborales.ingresos", v);
  }
  else if (/devoluci[oó]n.*venta|rebaja.*venta|descuento.*venta/i.test(d)) {
    add("noLaborales.devoluciones", v);
  }
  else if (/costo.*compra|compra.*mercanc[ií]a|adquisici[oó]n.*materia prima|costo no laboral/i.test(d)) {
    add("noLaborales.costosProcedentes", v);
  }
  // 5. Dividendos y participaciones
  else if (/dividendo|participaci[oó]n.*societaria|utilidad.*socio/i.test(d)) {
    resumen.dividendos += v;
    add("dividendos.ordinarios2017", v);
  }
  // 6. Ganancias Ocasionales (Notarías, Loterías, Herencias)
  else if (/herencia|legado|donaci[oó]n|loter[ií]a|rifa|apuesta|premio|venta.*activo fijo/i.test(d)) {
    resumen.gananciasOcasionales += v;
    add("gananciasOcasionales.ingresosBrutos", v);
  }
  // 7. Retenciones en la fuente a favor (Formato 1003)
  else if (/retenci[oó]n.*fuente|autorretenci[oó]n|retenci[oó]n practicada/i.test(d)) {
    resumen.retencionesFuente += v;
    add("extra.retenciones", v);
  }
  // 8. Cuentas bancarias, CDTs y Activos (Patrimonio a 31 dic - Formato 1019 / 1020 / 1008)
  else if (/saldo.*cuenta|cuenta.*ahorro|cuenta.*corriente|dep[oó]sito.*electr[oó]nico|nequi|daviplata|certificado.*dep[oó]sito|cdt|fiducia|fondo.*inversi[oó]n/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.cuentas", v);
  }
  else if (/inmueble.*escritura|compra.*inmueble|adquisici[oó]n.*predio/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.bienesInmuebles", v);
  }
  else if (/veh[ií]culo.*adquisici[oó]n|compra.*automotor|matr[ií]cula.*veh[ií]culo/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.vehiculos", v);
  }
  else if (/cuenta.*por cobrar|saldo.*a favor.*cliente|pr[eé]stamo.*otorgado/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.cuentasPorCobrar", v);
  }
  // 9. Deudas y obligaciones financieras a 31 dic (Formato 1009 / 1019 / 1020)
  else if (/saldo.*deuda|saldo.*cr[eé]dito|obligaci[oó]n financiera|pr[eé]stamo.*bancario|saldo.*tarjeta/i.test(d)) {
    resumen.deudas += v;
    add("patrimonio.obligacionesFinancieras", v);
  }
  else if (/cuenta.*por pagar|deuda.*proveedor|acreedor/i.test(d)) {
    resumen.deudas += v;
    add("patrimonio.otrasDeudas", v);
  }
  // 10. Deducciones Imputables
  else if (/inter[eé]s.*vivienda|cr[eé]dito hipotecario|leasing habitacional/i.test(d)) {
    resumen.interesesVivienda += v;
    add("trabajo.interesesVivienda", v);
  }
  else if (/medicina prepagada|plan complementario|p[oó]liza de salud/i.test(d)) {
    resumen.medicinaPrepagada += v;
    add("trabajo.medicinaPrepagada", v);
  }
  else if (/interes.*icetex|cr[eé]dito educativo/i.test(d)) {
    resumen.icetex += v;
    add("trabajo.interesesIcetex", v);
  }
  else if (/aporte.*afc|aporte.*fvp|pensi[oó]n voluntaria/i.test(d)) {
    resumen.afcFvp += v;
    add("trabajo.rentasExentasAfc", v);
  }
  else if (/gmf|gravamen.*movimientos financieros|4x1000/i.test(d)) {
    resumen.gmf += v;
    add("trabajo.gmf", v);
  }
  else if (/factura electr[oó]nica|1%.*compras/i.test(d)) {
    resumen.facturaElectronica += v;
    add("extra.comprasFacturaElectronica", v);
  }
  // 11. Consignaciones / Consumos para control de topes de declaración
  else if (/consignaci[oó]n|movimiento cr[eé]dito|dep[oó]sito bancario/i.test(d)) {
    resumen.consignacionesBancarias += v;
    add("topes.consignaciones", v);
  }
  else if (/tarjeta.*cr[eé]dito|consumo.*tarjeta/i.test(d)) {
    resumen.consumosTarjetas += v;
    add("topes.consumosTarjetas", v);
  }
  else if (/compra|adquisici[oó]n/i.test(d)) {
    resumen.comprasTotales += v;
    add("topes.comprasTotales", v);
  }
}
