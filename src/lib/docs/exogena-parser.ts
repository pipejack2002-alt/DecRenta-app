import * as XLSX from "xlsx";

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

      for (let i = 0; i < Math.min(30, rawRows.length); i++) {
        const row = rawRows[i] || [];
        const rowText = row.map((c) => String(c || "").trim()).join(" ");

        if (/(?:año|vigencia|periodo|gravable)/i.test(rowText) && !year) {
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
        if (/(?:Identificación|NIT|Número de documento|Consultante)/i.test(rowText) && !nit) {
          const numMatch = rowText.match(/(?:Identificación|NIT|Número de documento|Consultante)[:\s]*([0-9]{6,12})/i);
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
        if (/(?:Nombres\s*\/\s*Razón social|Nombres y Apellidos|Consultante):/i.test(rowText) && !nombre) {
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || "").trim();
            if (val && !/(?:Nombres|Razón social|Consultante|Identificación|NIT|\d{6,12})/i.test(val) && val.length > 3) {
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

      // Detectar fila de encabezados de la tabla
      let dataHeaderIndex = -1;
      let colFormato = -1;
      let colConcepto = -1;
      let colNitInf = -1;
      let colNomInf = -1;
      let colNitTerc = -1;
      let colNomTerc = -1;
      let colDetalle = -1;
      let colCasilla = -1;

      const colHeaders: Record<number, string> = {};

      for (let i = 0; i < Math.min(40, rawRows.length); i++) {
        const row = rawRows[i] || [];
        const rowStr = row.map((c) => String(c || "")).join("|").toLowerCase();

        if (
          (rowStr.includes("formato") || rowStr.includes("concepto") || rowStr.includes("nit") || rowStr.includes("identifica")) &&
          (rowStr.includes("informante") || rowStr.includes("razon") || rowStr.includes("nombre") || rowStr.includes("valor") || rowStr.includes("saldo") || rowStr.includes("pago") || rowStr.includes("monto") || rowStr.includes("retenci") || rowStr.includes("detalle"))
        ) {
          dataHeaderIndex = i;

          for (let c = 0; c < row.length; c++) {
            const head = String(row[c] || "").trim();
            const headLower = head.toLowerCase();
            colHeaders[c] = head;

            if (/^formato$|c[oó]d.*formato/i.test(headLower)) colFormato = c;
            else if (/^concepto$|c[oó]d.*concepto/i.test(headLower)) colConcepto = c;
            else if (/nit.*informante|identificaci[oó]n.*informante|nit.*persona.*reporta/i.test(headLower)) colNitInf = c;
            else if (/nombre.*informante|raz[oó]n.*informante|primer.*apellido.*informante|raz[oó]n.*social/i.test(headLower)) {
              if (colNomInf === -1) colNomInf = c;
            } else if (/nit.*tercero|identificaci[oó]n.*reportad|identificaci[oó]n.*tercero/i.test(headLower)) colNitTerc = c;
            else if (/nombre.*tercero|raz[oó]n.*reportad|nombre.*reportado/i.test(headLower)) colNomTerc = c;
            else if (/detalle|descripci[oó]n/i.test(headLower)) colDetalle = c;
            else if (/casilla|sugerid/i.test(headLower)) colCasilla = c;
          }
          break;
        }
      }

      const startIndex = dataHeaderIndex !== -1 ? dataHeaderIndex + 1 : 0;

      // Procesar cada fila de datos
      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i] || [];
        if (!row || row.length === 0) continue;

        const rowStr = row.map((c) => String(c || "")).join(" ").trim();
        // Ignorar filas de encabezado repetidas o vacías
        if (!rowStr || /DIAN|INFORMACIÓN REPORTADA|AÑO GRAVABLE|CONSULTANTE|TOTALES/i.test(rowStr)) continue;

        let formato = colFormato !== -1 ? String(row[colFormato] || "").trim() : "";
        let concepto = colConcepto !== -1 ? String(row[colConcepto] || "").trim() : "";
        let informanteNit = colNitInf !== -1 ? String(row[colNitInf] || "").trim() : "";
        let informanteNombre = colNomInf !== -1 ? String(row[colNomInf] || "").trim() : "";
        const reportadoNit = colNitTerc !== -1 ? String(row[colNitTerc] || "").trim() : "";
        const reportadoNombre = colNomTerc !== -1 ? String(row[colNomTerc] || "").trim() : "";
        const rowDetalle = colDetalle !== -1 ? String(row[colDetalle] || "").trim() : "";
        const casillaSugerida = colCasilla !== -1 ? String(row[colCasilla] || "").trim() : "";

        // Si no se detectaron columnas fijas, buscar formato y concepto en las primeras celdas
        if (!concepto) {
          for (let c = 0; c < Math.min(4, row.length); c++) {
            const valStr = String(row[c] || "").trim();
            if (/^(?:500[1-9]|501[0-9]|1019|1020|1009|1008|1007|1003|1001|1056|400[1-9])$/.test(valStr)) {
              concepto = valStr;
              break;
            }
          }
        }
        if (!formato) {
          for (let c = 0; c < Math.min(4, row.length); c++) {
            const valStr = String(row[c] || "").trim();
            if (/^(?:2276|1001|1003|1007|1008|1009|1019|1020|1056|1023)$/.test(valStr)) {
              formato = valStr;
              break;
            }
          }
        }
        if (!informanteNit) {
          for (let c = 0; c < Math.min(6, row.length); c++) {
            const valStr = String(row[c] || "").trim();
            if (/^\d{6,12}$/.test(valStr) && valStr !== concepto && valStr !== formato && valStr !== nit) {
              informanteNit = valStr;
              break;
            }
          }
        }
        if (!informanteNombre) {
          for (let c = 0; c < Math.min(8, row.length); c++) {
            const valStr = String(row[c] || "").trim();
            if (valStr && isNaN(Number(valStr)) && valStr.length > 3 && !/Formato|Concepto|NIT/i.test(valStr)) {
              informanteNombre = valStr;
              break;
            }
          }
        }

        // Extraer todos los valores numéricos de la fila
        for (let c = 0; c < row.length; c++) {
          if (c === colFormato || c === colConcepto || c === colNitInf || c === colNomInf || c === colNitTerc || c === colNomTerc) {
            continue;
          }

          const rawValor = row[c];
          const valor = parseExogenaValor(rawValor);
          if (valor <= 0) continue;

          const colHeader = colHeaders[c] || `Columna ${c + 1}`;

          // Construir descripción contextual completa
          const contextParts: string[] = [];
          if (formato) contextParts.push(`Formato ${formato}`);
          if (concepto) contextParts.push(`Concepto ${concepto}`);
          if (colHeader && !colHeader.startsWith("Columna")) contextParts.push(colHeader);
          if (rowDetalle) contextParts.push(rowDetalle);
          if (sheetName && sheetName !== "Sheet1" && sheetName !== "Hoja1" && sheetName !== "Hoja 1") contextParts.push(sheetName);

          const fullDetalle = contextParts.length > 0 ? contextParts.join(" - ") : "Reporte Exógena DIAN";

          const item: ExogenaTerceroItem = {
            informanteNit: informanteNit || "DIAN",
            informanteNombre: informanteNombre || "Tercero Informante",
            reportadoNit,
            reportadoNombre,
            detalle: fullDetalle,
            valor,
            casillaSugerida,
            infoAdicional: `Concepto: ${concepto || "N/A"} | ${colHeader}`,
          };

          items.push(item);
          classifyItem(item, resumen, amountsToApply, concepto, formato, colHeader);
        }
      }
    }

    // 3. Consolidar automáticamente los topes para el módulo "1. Obligados y Topes"
    const totalIngresos =
      resumen.ingresosTrabajo +
      resumen.ingresosHonorarios +
      resumen.ingresosCapital +
      resumen.ingresosNoLaborales +
      resumen.pensiones +
      resumen.dividendos +
      resumen.gananciasOcasionales;

    if (totalIngresos > 0) {
      amountsToApply["topes.ingresosBrutos"] = totalIngresos;
    }
    if (resumen.patrimonioBruto > 0) {
      amountsToApply["topes.patrimonioBruto"] = resumen.patrimonioBruto;
    }
    if (resumen.consignacionesBancarias > 0) {
      amountsToApply["topes.consignaciones"] = resumen.consignacionesBancarias;
    }
    if (resumen.consumosTarjetas > 0) {
      amountsToApply["topes.consumosTarjeta"] = resumen.consumosTarjetas;
    }
    if (resumen.comprasTotales > 0) {
      amountsToApply["topes.compras"] = resumen.comprasTotales;
    }

    // Filtrar items válidos
    const finalItems = items.length > 0 ? items.filter((x) => x.valor > 0) : items;

    return {
      ok: true,
      year: year || 2025,
      tipoDocumento: tipoDocumento || "C. C.",
      nit: nit || "",
      nombre: nombre || "",
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

function parseExogenaValor(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return Math.round(val);
  const str = String(val).trim();
  if (!str) return 0;

  // Manejo de moneda y formatos numéricos
  // Ejemplo: "$ 50.000.000,00" o "50,000,000.00" o "50000000"
  const clean = str.replace(/[\$,\s]/g, "");
  const num = Number(clean);
  if (Number.isFinite(num) && num > 0) return Math.round(num);

  const cleanDot = str.replace(/[\$,\s]/g, "").replace(/\./g, "").replace(/,/, ".");
  const numDot = parseFloat(cleanDot);
  return Number.isFinite(numDot) && numDot > 0 ? Math.round(numDot) : 0;
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
  conceptoCode: string = "",
  formatoCode: string = "",
  columnHeader: string = "",
) {
  const d = (item.detalle + " " + item.casillaSugerida + " " + item.infoAdicional + " " + columnHeader).toLowerCase();
  const v = item.valor;
  if (v <= 0) return;

  const add = (path: string, val: number) => {
    amounts[path] = (amounts[path] || 0) + val;
  };

  // 1. Salarios y pagos laborales (Formato 2276 / 1001, Conceptos 5001, 5003, 5004, 5010)
  if (
    conceptoCode === "5001" ||
    conceptoCode === "5003" ||
    conceptoCode === "5004" ||
    /salario|emolumento|sueldo|pago laboral|comisi[oó]n laboral|horas extra|recargo nocturno|vi[aá]tico|bonificaci[oó]n laboral|indemnizaci[oó]n laboral|concepto 5001|formato 2276/i.test(d)
  ) {
    resumen.ingresosTrabajo += v;
    add("trabajo.salarios", v);
  }
  // Cesantías e intereses sobre cesantías (Concepto 5002)
  else if (conceptoCode === "5002" || /cesant[ií]a|intereses.*cesant[ií]a|concepto 5002/i.test(d)) {
    resumen.cesantias += v;
    add("trabajo.cesantiasPagadas", v);
  }
  // Salud obligatoria (Concepto 5007 / EPS)
  else if (conceptoCode === "5007" || /aporte.*salud|salud obligatoria|cotizaci[oó]n.*salud|pago.*eps|concepto 5007/i.test(d)) {
    resumen.saludObligatoria += v;
    add("trabajo.aportesSaludObligatorios", v);
  }
  // Pensión obligatoria y Fondo de Solidaridad Pensional (Concepto 5008)
  else if (conceptoCode === "5008" || /aporte.*pensi[oó]n|pensi[oó]n obligatoria|cotizaci[oó]n.*pensi[oó]n|fondo de solidaridad|concepto 5008/i.test(d)) {
    resumen.pensionObligatoria += v;
    add("trabajo.aportesPensionObligatorios", v);
  }
  // Pensiones de jubilación, vejez o invalidez
  else if (/mesada pensional|pensi[oó]n.*vejez|pensi[oó]n.*jubilaci[oó]n|pensi[oó]n.*invalidez|pensi[oó]n.*sobreviviente/i.test(d)) {
    resumen.pensiones += v;
    add("pensiones.ingresos", v);
  }
  // 2. Honorarios, servicios y comisiones independientes (Conceptos 5005, 5006, 5016 / Formato 1001)
  else if (conceptoCode === "5005" || conceptoCode === "5006" || /honorario|servicio personal|servicio profesional|servicio t[eé]cnico|compensaci[oó]n servicio|concepto 5005|concepto 5006/i.test(d)) {
    resumen.ingresosHonorarios += v;
    add("honorarios.ingresos", v);
  }
  else if (/costo.*honorario|deducci[oó]n.*honorario|gasto.*servicio/i.test(d)) {
    add("honorarios.costos", v);
  }
  // 3. Rentas de Capital, Arriendos y Rendimientos Financieros (Conceptos 1019, 1020, 1007, 1001)
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
    add("capital.regalias", v);
  }
  // 4. Rentas No Laborales / Comercio / Negocios
  else if (formatoCode === "1007" && /ingreso.*comercio|venta.*bienes|venta.*mercanc[ií]a|ingreso no laboral|actividad agropecuaria/i.test(d)) {
    resumen.ingresosNoLaborales += v;
    add("noLaborales.ingresos", v);
  }
  else if (/devoluci[oó]n.*venta|rebaja.*venta|descuento.*venta/i.test(d)) {
    add("noLaborales.devoluciones", v);
  }
  else if (/costo.*compra|compra.*mercanc[ií]a|adquisici[oó]n.*materia prima|costo no laboral/i.test(d)) {
    add("noLaborales.costos", v);
  }
  // 5. Dividendos y participaciones
  else if (/dividendo|participaci[oó]n.*societaria|utilidad.*socio/i.test(d)) {
    resumen.dividendos += v;
    add("dividendos.subcedula1", v);
  }
  // 6. Ganancias Ocasionales (Notarías, Loterías, Herencias)
  else if (/herencia|legado|donaci[oó]n|loter[ií]a|rifa|apuesta|premio|venta.*activo fijo/i.test(d)) {
    resumen.gananciasOcasionales += v;
    add("gananciasOcasionales.enajenacionActivos", v);
  }
  // 7. Retenciones en la fuente a favor (Formato 1003 o columnas de Retención)
  else if (formatoCode === "1003" || /retenci[oó]n.*fuente|autorretenci[oó]n|retenci[oó]n practicada|formato 1003/i.test(d)) {
    resumen.retencionesFuente += v;
    add("extra.retenciones", v);
  }
  // 8. Cuentas bancarias, CDTs y Activos (Formato 1019, 1020, 1008)
  else if (
    formatoCode === "1019" ||
    conceptoCode === "1019" ||
    /saldo.*cuenta|cuenta.*ahorro|cuenta.*corriente|dep[oó]sito.*electr[oó]nico|nequi|daviplata|certificado.*dep[oó]sito|cdt|fiducia|fondo.*inversi[oó]n|concepto 1019/i.test(d)
  ) {
    resumen.patrimonioBruto += v;
    add("patrimonio.cuentas", v);
  }
  else if (formatoCode === "1020" || conceptoCode === "1020" || /inversiones.*31|saldo.*cdt|saldo.*inversi[oó]n/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.inversiones", v);
  }
  else if (/inmueble.*escritura|compra.*inmueble|adquisici[oó]n.*predio/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.inmuebles", v);
  }
  else if (/veh[ií]culo.*adquisici[oó]n|compra.*automotor|matr[ií]cula.*veh[ií]culo/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.vehiculos", v);
  }
  else if (formatoCode === "1008" || /cuenta.*por cobrar|saldo.*a favor.*cliente|pr[eé]stamo.*otorgado|formato 1008/i.test(d)) {
    resumen.patrimonioBruto += v;
    add("patrimonio.cuentasPorCobrar", v);
  }
  // 9. Deudas y obligaciones financieras a 31 dic (Formato 1009)
  else if (
    formatoCode === "1009" ||
    conceptoCode === "1009" ||
    /saldo.*deuda|saldo.*cr[eé]dito|obligaci[oó]n financiera|pr[eé]stamo.*bancario|saldo.*tarjeta|concepto 1020|formato 1009/i.test(d)
  ) {
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
  }
  else if (/aporte.*afc|aporte.*fvp|pensi[oó]n voluntaria/i.test(d)) {
    resumen.afcFvp += v;
    add("trabajo.aportesAfcFvpAvc", v);
  }
  else if (/gmf|gravamen.*movimientos financieros|4x1000/i.test(d)) {
    resumen.gmf += v;
    add("trabajo.gmf", v);
  }
  else if (conceptoCode === "1056" || /factura electr[oó]nica|1%.*compras|concepto 1056/i.test(d)) {
    resumen.facturaElectronica += v;
    add("trabajo.comprasFacturaElectronica", v);
  }
  // 11. Consignaciones / Consumos para control de topes de declaración
  else if (conceptoCode === "4001" || /consignaci[oó]n|movimiento cr[eé]dito|dep[oó]sito bancario/i.test(d)) {
    resumen.consignacionesBancarias += v;
    add("topes.consignaciones", v);
  }
  else if (conceptoCode === "4002" || /tarjeta.*cr[eé]dito|consumo.*tarjeta/i.test(d)) {
    resumen.consumosTarjetas += v;
    add("topes.consumosTarjeta", v);
  }
  else if (conceptoCode === "4003" || /compra|adquisici[oó]n/i.test(d)) {
    resumen.comprasTotales += v;
    add("topes.compras", v);
  }
  // Si no clasificó pero es una columna de pago o abono general
  else if (/pago.*abono|ingreso|cuant[ií]a/i.test(columnHeader)) {
    resumen.ingresosTrabajo += v;
    add("trabajo.salarios", v);
  }
}
