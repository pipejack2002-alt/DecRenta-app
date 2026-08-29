import { formatCOP, formatNumber } from "@/lib/tax/format";
import type { Declaration, ComputedDeclaration } from "@/lib/tax/types";

export interface ItemBreakdown {
  label: string;
  value: number | string;
  source?: string;
  legal?: string;
  highlight?: boolean;
}

export interface CasillaBreakdownInfo {
  title: string;
  description: string;
  items: ItemBreakdown[];
  totalLabel?: string;
  totalValue?: number;
  footnote?: string;
}

export function getCasillaItemizedBreakdown(
  casillaNum: number,
  d: Declaration,
  c: ComputedDeclaration
): CasillaBreakdownInfo | null {
  const uvt = c.uvt;

  switch (casillaNum) {
    // -------------------------------------------------------------------------
    // PATRIMONIO
    // -------------------------------------------------------------------------
    case 28: {
      const base = d.trabajo.comprasFacturaElectronica || 0;
      const deduccion = c.casillas[28] ?? Math.min(base * 0.01, uvt * 240);
      return {
        title: "Deducción Especial del 1% por Compras con Factura Electrónica",
        description: "Art. 336 numeral 5 del Estatuto Tributario: deducción adicional del 1% de compras de bienes o servicios soportadas con factura electrónica de validación previa pagadas por medios bancarios.",
        items: [
          {
            label: "Base de compras con factura electrónica reportadas",
            value: formatCOP(base),
            source: "Facturas electrónicas emitidas a su nombre con validación previa DIAN",
          },
          {
            label: "Porcentaje de deducción legal aplicable",
            value: "1.0 %",
            legal: "Art. 336 Num. 5 E.T. (Ley 2277 de 2022)",
          },
          {
            label: "Límite legal máximo anual (240 UVT)",
            value: formatCOP(uvt * 240),
            legal: `240 UVT × $${formatNumber(uvt)}`,
          },
        ],
        totalLabel: "Deducción neta calculada en Casilla 28",
        totalValue: deduccion,
        footnote: "Esta deducción se resta directamente en la Casilla 92 y no está sujeta al límite conjunto del 40 % ni a los 1.340 UVT.",
      };
    }

    case 29: {
      const p = d.patrimonio;
      const items: ItemBreakdown[] = [];
      const dinero = (p.efectivo || 0) + (p.cuentas || 0);
      if (dinero > 0) {
        items.push({
          label: "Efectivo, cuentas bancarias y depósitos de ahorro",
          value: formatCOP(dinero),
          source: "Certificados tributarios bancarios (ej. Nu Colombia $3.954.662 + Bancolombia $2.938) / Formato 1009",
        });
      }
      if ((p.cesantiasFondos || 0) > 0) {
        items.push({
          label: "Saldo acumulado en fondos de cesantías a 31 de diciembre",
          value: formatCOP(p.cesantiasFondos || 0),
          legal: "Arts. 261 y 271 E.T. (Colfondos, Porvenir, Protección, FNA)",
          source: "Certificado tributario para declaración de renta del fondo de cesantías a 31/12",
        });
      }
      if (p.inversiones > 0) {
        items.push({
          label: "Inversiones financieras, acciones, CDT y fiducias",
          value: formatCOP(p.inversiones),
          source: "Certificados de inversión / Formato 1010",
        });
      }
      const totalInmuebles = (p.inmuebles || 0) + (p.viviendaHabitacion || 0);
      if (totalInmuebles > 0) {
        items.push({
          label: "Bienes raíces e inmuebles (Mayor entre costo fiscal y avalúo)",
          value: formatCOP(totalInmuebles),
          legal: "Arts. 72, 73 y 277 E.T. / Recibos de impuesto predial",
        });
      }
      if (p.vehiculos > 0) {
        items.push({
          label: "Vehículos y medios de transporte (Costo de adquisición)",
          value: formatCOP(p.vehiculos),
          legal: "Art. 267 E.T. / Factura de compra o declaración anterior",
        });
      }
      if (p.cuentasPorCobrar > 0) {
        items.push({
          label: "Cuentas por cobrar a clientes o terceros",
          value: formatCOP(p.cuentasPorCobrar),
          source: "Pagarés / Letras / Contratos de mutuo",
        });
      }
      if (p.inventarios > 0) {
        items.push({
          label: "Inventarios de mercancías y materias primas",
          value: formatCOP(p.inventarios),
          source: "Inventario físico valorado a 31 de diciembre",
        });
      }
      if (p.cripto > 0) {
        items.push({
          label: "Criptoactivos y activos digitales",
          value: formatCOP(p.cripto),
        });
      }
      if (p.otrosActivos > 0) {
        items.push({
          label: "Otros activos, aportes en sociedades y derechos",
          value: formatCOP(p.otrosActivos),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin bienes ni saldos reportados",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Bienes y Derechos Patrimoniales (Casilla 29)",
        description: "Total de activos patrimoniales brutos poseídos por el contribuyente en el país y en el exterior al 31 de diciembre.",
        items,
        totalLabel: "Total Patrimonio Bruto (Casilla 29)",
        totalValue: c.casillas[29] ?? 0,
        footnote: "Los saldos en cuentas bancarias se toman a corte del 31 de diciembre. Los aportes a seguridad social (Concepto 2214) son informativos del empleador y no integran el patrimonio.",
      };
    }

    case 30: {
      const p = d.patrimonio;
      const items: ItemBreakdown[] = [];
      if (p.obligacionesFinancieras > 0) {
        items.push({
          label: "Obligaciones financieras y créditos bancarios",
          value: formatCOP(p.obligacionesFinancieras),
          source: "Certificados de crédito / Formato 1009",
        });
      }
      if (p.cuentasPorPagar > 0) {
        items.push({
          label: "Cuentas por pagar a proveedores o terceros",
          value: formatCOP(p.cuentasPorPagar),
        });
      }
      if (p.impuestosPorPagar > 0) {
        items.push({
          label: "Impuestos liquidados pendientes de pago",
          value: formatCOP(p.impuestosPorPagar),
        });
      }
      if (p.otrasDeudas > 0) {
        items.push({
          label: "Otras deudas y pasivos respaldados",
          value: formatCOP(p.otrasDeudas),
          legal: "Art. 283 E.T. (Deben cumplir requisitos de idoneidad probatoria)",
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin deudas financieras o pasivos al 31 de diciembre",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Deudas y Pasivos Financieros (Casilla 30)",
        description: "Obligaciones crediticias y comerciales legalmente exigibles a cargo del declarante a corte de 31 de diciembre (Art. 283 E.T.).",
        items,
        totalLabel: "Total Deudas (Casilla 30)",
        totalValue: c.casillas[30] ?? 0,
      };
    }

    // -------------------------------------------------------------------------
    // RENTAS DE TRABAJO
    // -------------------------------------------------------------------------
    case 32: {
      const t = d.trabajo;
      const items: ItemBreakdown[] = [];
      if (t.salarios > 0) {
        items.push({
          label: "Salarios y sueldos directos",
          value: formatCOP(t.salarios),
          source: "Formato 220 casilla 36 / Formato 2276 Pagos salariales",
        });
      }
      if (t.otrasPrestaciones > 0) {
        items.push({
          label: "Prestaciones sociales y primas legales / extralegales",
          value: formatCOP(t.otrasPrestaciones),
          source: "Formato 220 casilla 38 / Formato 2276 Prestaciones sociales",
        });
      }
      if ((t.otrosPagosLaborales || 0) > 0) {
        items.push({
          label: "Otros pagos laborales (Bonos, auxilios no salariales)",
          value: formatCOP(t.otrosPagosLaborales || 0),
          source: "Formato 2276 casilla Otros pagos / Art. 128 C.S.T.",
        });
      }
      if (t.cesantiasPagadas > 0) {
        items.push({
          label: "Cesantías e intereses de cesantías (Consignadas y pagadas)",
          value: formatCOP(t.cesantiasPagadas),
          source: "Formato 220 casillas 39-40 / Certificado Fondo de Cesantías",
        });
      }
      if (t.honorariosSinCostos > 0) {
        items.push({
          label: "Honorarios sin costos (con opción de exención laboral 25%)",
          value: formatCOP(t.honorariosSinCostos),
          source: "Formato 2276 / Facturas electrónicas de servicios",
        });
      }
      if (t.ingresosEspecie > 0) {
        items.push({
          label: "Pagos e ingresos en especie",
          value: formatCOP(t.ingresosEspecie),
          legal: "Art. 29-1 del Estatuto Tributario",
        });
      }
      if (t.ingresosExterior > 0) {
        items.push({
          label: "Ingresos laborales obtenidos en el exterior",
          value: formatCOP(t.ingresosExterior),
          source: "Rentas de trabajo de fuente extranjera",
        });
      }
      return {
        title: "Desglose de Ingresos Brutos Laborales (Casilla 32)",
        description: "Totalidad de los ingresos devengados en el año por relaciones laborales, legales y reglamentarias o compensaciones por servicios personales:",
        items,
        totalLabel: "Total Ingresos Brutos de Trabajo (Casilla 32)",
        totalValue: c.casillas[32] ?? 0,
        footnote: "Todos estos valores provienen directamente del Formato 220 oficial y el Formato 2276 de información exógena reportado por tus empleadores.",
      };
    }

    case 33: {
      const t = d.trabajo;
      const items: ItemBreakdown[] = [];
      if (t.aportesSaludObligatorios > 0) {
        items.push({
          label: "Aportes obligatorios a salud (4% a cargo del trabajador)",
          value: formatCOP(t.aportesSaludObligatorios),
          source: "Formato 220 casilla 53 / Formato 2276 Salud",
          legal: "Art. 56 del Estatuto Tributario",
        });
      }
      if (t.aportesPensionObligatorios > 0) {
        items.push({
          label: "Aportes obligatorios a pensión (4% a cargo del trabajador)",
          value: formatCOP(t.aportesPensionObligatorios),
          source: "Formato 220 casilla 54 / Formato 2276 Pensión",
          legal: "Art. 55 del Estatuto Tributario",
        });
      }
      if (t.aportesVoluntariosRais > 0) {
        items.push({
          label: "Cotización voluntaria a pensión obligatoria (RAIS)",
          value: formatCOP(t.aportesVoluntariosRais),
          legal: "Art. 135 Ley 100 de 1993 (Tope 25% y 2.500 UVT)",
        });
      }
      if (t.apoyosEducativos > 0) {
        items.push({
          label: "Apoyos económicos educativos no constitutivos",
          value: formatCOP(t.apoyosEducativos),
          legal: "Art. 46 del Estatuto Tributario",
        });
      }
      if (t.otrosINCRNGO > 0) {
        items.push({
          label: "Otros ingresos no constitutivos de renta",
          value: formatCOP(t.otrosINCRNGO),
        });
      }
      return {
        title: "Desglose de Ingresos No Constitutivos de Renta (Casilla 33)",
        description: "Aportes obligatorios a la seguridad social descontados al trabajador que por mandato legal no pagan impuesto de renta:",
        items,
        totalLabel: "Total Ingresos No Constitutivos (Casilla 33)",
        totalValue: c.casillas[33] ?? 0,
        footnote: "Solo se restan los aportes efectivamente a cargo del trabajador certificados en el Formato 220. Los pagos patronales de la empresa son informativos.",
      };
    }

    case 35: {
      return {
        title: "Aportes Voluntarios a Fondos de Pensiones (FVP) y Cuentas AFC / AVC (Casilla 35)",
        description: "Beneficio de renta exenta por ahorro voluntario para pensiones y fomento de la construcción en rentas de trabajo (Arts. 126-1 y 126-4 E.T.):",
        items: [
          {
            label: "Aportes voluntarios FVP y cuentas AFC / AVC",
            value: formatCOP(d.trabajo.aportesAfcFvpAvc),
            source: "Certificados tributarios bancarios y de FVP",
            legal: `Límite individual: 30% del ingreso laboral y hasta 3.800 UVT (${formatCOP(uvt * 3800)})`,
          },
        ],
        totalLabel: "Total Aportes AFC/FVP (Casilla 35)",
        totalValue: c.casillas[35] ?? 0,
      };
    }

    case 36: {
      const t = d.trabajo;
      const cesantiasExentas = t.promedioMensual6m <= (uvt * 350) ? t.cesantiasPagadas : 0;
      const deduccionesImputables = c.casillas[40] ?? 0;
      const afcTrabajo = c.casillas[35] ?? 0;
      const otrasEx = (t.otrasExentas || 0) + (t.rentasCan || 0) + (t.indemnizaciones || 0) + (t.cesantiasAcumuladas2016 || 0);
      const baseRenta25 = Math.max(0, (c.casillas[34] ?? 0) - afcTrabajo - cesantiasExentas - deduccionesImputables - otrasEx);
      const renta25 = Math.min(baseRenta25 * 0.25, uvt * 790);

      const items: ItemBreakdown[] = [
        {
          label: "Cesantías e intereses de cesantías 100% exentas",
          value: formatCOP(cesantiasExentas),
          legal: `Art. 206 Num. 4 E.T. (Salario promedio mensual $${formatNumber(t.promedioMensual6m)} ≤ 350 UVT $${formatNumber(uvt * 350)})`,
          source: "100% exentas por estar en el rango de ingresos de la tabla legal (Certificado Formato 220)",
        },
        {
          label: "Exención laboral del 25% (Art. 206 Num. 10 E.T.)",
          value: formatCOP(renta25),
          legal: `25% legal aplicado sobre base depurada de $${formatNumber(baseRenta25)} (Tope máx. 790 UVT = $${formatNumber(uvt * 790)})`,
          source: deduccionesImputables > 0
            ? `Cálculo de la base: Renta líquida ($${formatNumber(c.casillas[34] ?? 0)}) - Cesantías ($${formatNumber(cesantiasExentas)}) - Deducciones Casilla 40 ($${formatNumber(deduccionesImputables)}) = $${formatNumber(baseRenta25)}`
            : `Cálculo de la base: Renta líquida ($${formatNumber(c.casillas[34] ?? 0)}) - Cesantías ($${formatNumber(cesantiasExentas)}) = $${formatNumber(baseRenta25)}`,
        },
      ];

      if (t.cesantiasAcumuladas2016 > 0) {
        items.push({
          label: "Cesantías acumuladas a 31/12/2016 retiradas",
          value: formatCOP(t.cesantiasAcumuladas2016),
          legal: "Art. 1.2.1.20.7 DUR 1625",
        });
      }
      if (t.indemnizaciones > 0) {
        items.push({
          label: "Indemnizaciones por accidente de trabajo o enfermedad",
          value: formatCOP(t.indemnizaciones),
          legal: "Art. 206 Num. 1 E.T.",
        });
      }
      if (t.rentasCan > 0) {
        items.push({
          label: "Rentas exentas por Convenios CAN (Decisión 578)",
          value: formatCOP(t.rentasCan),
          legal: "Comunidad Andina (Fuera del límite del 40%)",
        });
      }
      if (t.otrasExentas > 0) {
        items.push({
          label: "Otras rentas exentas laborales",
          value: formatCOP(t.otrasExentas),
        });
      }

      return {
        title: "Desglose de Otras Rentas Exentas de Trabajo (Casilla 36)",
        description: "Beneficios tributarios de exención legal aplicables a los ingresos laborales del contribuyente (Art. 206 E.T.):",
        items,
        totalLabel: "Total Otras Rentas Exentas (Casilla 36)",
        totalValue: c.casillas[36] ?? 0,
        footnote: deduccionesImputables > 0
          ? `Tus cesantías ($${formatNumber(cesantiasExentas)}) son 100% exentas. Adicionalmente, el Art. 206 Numeral 10 te otorga el 25% de exención laboral ($${formatNumber(renta25)}) sobre tu base depurada de deducciones. La suma exacta de ambos beneficios da los $${formatNumber(c.casillas[36] ?? 0)} liquidados.`
          : `Tus cesantías ($${formatNumber(cesantiasExentas)}) están 100% exentas. La ley te otorga adicionalmente el 25% de exención laboral ($${formatNumber(renta25)}) sobre la base neta. Total exacto: $${formatNumber(c.casillas[36] ?? 0)}.`,
      };
    }

    case 38: {
      return {
        title: "Intereses de Crédito Hipotecario / Leasing de Vivienda (Casilla 38)",
        description: "Deducción de intereses pagados durante el año gravable para la adquisición de vivienda del contribuyente (Art. 119 E.T.):",
        items: [
          {
            label: "Intereses pagados en créditos hipotecarios o contratos de leasing",
            value: formatCOP(d.trabajo.interesesVivienda),
            source: "Certificado tributario bancario de crédito de vivienda",
            legal: `Límite legal anual: 1.200 UVT (${formatCOP(uvt * 1200)})`,
          },
        ],
        totalLabel: "Total Intereses de Vivienda (Casilla 38)",
        totalValue: c.casillas[38] ?? 0,
      };
    }

    case 39: {
      const t = d.trabajo;
      const items: ItemBreakdown[] = [];
      if (t.medicinaPrepagada > 0) {
        items.push({
          label: "Medicina prepagada y seguros privados de salud",
          value: formatCOP(t.medicinaPrepagada),
          source: "Certificado anual de la entidad de medicina prepagada",
          legal: `Art. 387 E.T. (Tope 16 UVT/mes = ${formatCOP(uvt * 192)}/año)`,
        });
      }
      if (t.gmf > 0) {
        items.push({
          label: "Gravamen a los Movimientos Financieros (50% del 4x1000)",
          value: formatCOP(t.gmf * 0.5),
          source: "Certificados bancarios anuales de GMF",
          legal: "Art. 115 del Estatuto Tributario",
        });
      }
      if (t.icetex > 0) {
        items.push({
          label: "Intereses de crédito educativo ICETEX",
          value: formatCOP(t.icetex),
          source: "Certificado anual expedido por el ICETEX",
          legal: `Art. 119 E.T. (Tope 100 UVT = ${formatCOP(uvt * 100)})`,
        });
      }
      if (t.dependientes > 0) {
        const isLaboral = (c.casillas[32] ?? 0) > 0;
        const depBase = isLaboral ? (c.casillas[32] ?? 0) : t.salarios;
        const deducDep = Math.min(depBase * 0.1, uvt * 384, c.casillas[34] ?? 0);
        items.push({
          label: `Deducción por dependientes (10% ingreso bruto de trabajo)`,
          value: formatCOP(deducDep),
          legal: `Art. 387 E.T. (10% sobre ingresos brutos $${formatNumber(depBase)} = $${formatNumber(deducDep)}, máx. 32 UVT/mes = ${formatCOP(uvt * 384)}/año)`,
          source: `Para ${t.dependientes} dependiente(s) a cargo dentro del 40%`,
        });
      }
      if (t.fnceAnual > 0) {
        items.push({
          label: "Deducción inversiones FNCE y movilidad eléctrica",
          value: formatCOP(t.fnceAnual),
          legal: "Ley 1715 de 2014 y Ley 2099 de 2021",
        });
      }
      if (t.otrasDeducciones > 0) {
        items.push({
          label: "Otras deducciones imputables",
          value: formatCOP(t.otrasDeducciones),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin otras deducciones reportadas",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Otras Deducciones Imputables de Trabajo (Casilla 39)",
        description: "Deducciones personales aceptadas en la ley tributaria que disminuyen la base de renta líquida:",
        items,
        totalLabel: "Total Otras Deducciones (Casilla 39)",
        totalValue: c.casillas[39] ?? 0,
      };
    }

    case 41: {
      const exentasTrabajo = c.casillas[37] ?? 0;
      const deducTrabajo = c.casillas[40] ?? 0;
      const totalBeneficiosSolicitados = exentasTrabajo + deducTrabajo;

      const ingresosCedula =
        (c.casillas[32] ?? 0) +
        (c.casillas[43] ?? 0) +
        (c.casillas[58] ?? 0) +
        (c.casillas[62] ?? 0) +
        (c.casillas[74] ?? 0) +
        (c.casillas[79] ?? 0);
      const incrngoCedula =
        (c.casillas[33] ?? 0) +
        (c.casillas[44] ?? 0) +
        (c.casillas[59] ?? 0) +
        (c.casillas[76] ?? 0);
      const base40Cedula = Math.max(0, ingresosCedula - incrngoCedula);
      const limite40Valor = base40Cedula * 0.4;
      const topeUvt1340 = uvt * 1340;
      const limiteMaximoAplicable = Math.min(limite40Valor, topeUvt1340);

      const aceptado = c.casillas[41] ?? 0;
      const superaLimite = totalBeneficiosSolicitados > limiteMaximoAplicable;

      return {
        title: "Liquidación y Control de Límites del 40% y 1.340 UVT (Casilla 41)",
        description:
          "El Art. 336 numeral 3 del Estatuto Tributario establece que la suma de rentas exentas y deducciones no puede superar el 40% de los ingresos netos de la Cédula General ni 1.340 UVT anuales:",
        items: [
          {
            label: "Paso 1: Rentas exentas de trabajo solicitadas (Casilla 37)",
            value: formatCOP(exentasTrabajo),
            source: "Suma de aportes AFC/FVP (Casilla 35) + 25% exención laboral y cesantías (Casilla 36)",
          },
          {
            label: "Paso 1: Deducciones imputables de trabajo solicitadas (Casilla 40)",
            value: formatCOP(deducTrabajo),
            source: "Suma de intereses de vivienda (Casilla 38) + medicina, GMF, dependientes e ICETEX (Casilla 39)",
          },
          {
            label: "Total beneficios y deducciones solicitados en Trabajo",
            value: formatCOP(totalBeneficiosSolicitados),
            legal: `Casilla 37 ($${formatNumber(exentasTrabajo)}) + Casilla 40 ($${formatNumber(deducTrabajo)}) = $${formatNumber(totalBeneficiosSolicitados)}`,
            highlight: true,
          },
          {
            label: "Paso 2: Base unificada Cédula General (Ingresos brutos - INCRNGO)",
            value: formatCOP(base40Cedula),
            source: `Ingresos Cédula General ($${formatNumber(ingresosCedula)}) - Salud/Pensión ($${formatNumber(incrngoCedula)}) = $${formatNumber(base40Cedula)}`,
          },
          {
            label: "Límite legal del 40% sobre la base de la Cédula General",
            value: formatCOP(limite40Valor),
            legal: `40% × $${formatNumber(base40Cedula)} = $${formatNumber(limite40Valor)}`,
          },
          {
            label: "Tope máximo legal absoluto en UVT (1.340 UVT)",
            value: formatCOP(topeUvt1340),
            legal: `1.340 UVT × $${formatNumber(uvt)} = $${formatNumber(topeUvt1340)}`,
          },
          {
            label: "Límite legal aplicable (Menor entre 40% y 1.340 UVT)",
            value: formatCOP(limiteMaximoAplicable),
            legal: "Art. 336 numeral 3 E.T. (Ley 2277 de 2022)",
            highlight: true,
          },
        ],
        totalLabel: "Valor Aceptado e Imputable en Casilla 41",
        totalValue: aceptado,
        footnote: superaLimite
          ? `Tus beneficios solicitados ($${formatNumber(totalBeneficiosSolicitados)}) superaron el límite legal ($${formatNumber(limiteMaximoAplicable)}). Por mandato del Art. 336 E.T., se restringen exactamente a $${formatNumber(aceptado)} en la Casilla 41.`
          : `Tus beneficios solicitados ($${formatNumber(totalBeneficiosSolicitados)}) son MENORES a tu límite legal del 40% ($${formatNumber(limiteMaximoAplicable)}). Por lo tanto, la ley te permite imputar el 100% de tus beneficios ($${formatNumber(aceptado)}) sin ningún recorte.`,
      };
    }

    // -------------------------------------------------------------------------
    // HONORARIOS Y SERVICIOS PERSONALES
    // -------------------------------------------------------------------------
    case 43: {
      return {
        title: "Desglose de Ingresos Brutos por Honorarios (Casilla 43)",
        description: "Honorarios, comisiones y compensación por servicios personales calificados independientes:",
        items: [
          {
            label: "Honorarios y servicios personales independientes",
            value: formatCOP(d.honorarios.ingresos),
            source: "Formato 1001 / Formato 2276 / Facturación electrónica emitida",
          },
        ],
        totalLabel: "Total Ingresos Brutos de Honorarios (Casilla 43)",
        totalValue: c.casillas[43] ?? 0,
      };
    }

    case 44: {
      const h = d.honorarios;
      const items: ItemBreakdown[] = [];
      if (h.aportesPension > 0) {
        items.push({
          label: "Aportes obligatorios a pensión del independiente (PILA)",
          value: formatCOP(h.aportesPension),
          legal: "Art. 55 E.T. (16% sobre IBC)",
        });
      }
      if (h.aportesSalud > 0) {
        items.push({
          label: "Aportes obligatorios a salud (EPS) del independiente (PILA)",
          value: formatCOP(h.aportesSalud),
          legal: "Art. 56 E.T. (12.5% sobre IBC)",
        });
      }
      if (h.aportesRais > 0) {
        items.push({
          label: "Cotización voluntaria a pensión obligatoria (RAIS)",
          value: formatCOP(h.aportesRais),
        });
      }
      if (h.incrngo > 0) {
        items.push({
          label: "Otros ingresos no constitutivos de renta",
          value: formatCOP(h.incrngo),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin ingresos no constitutivos reportados en honorarios",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Ingresos No Constitutivos de Honorarios (Casilla 44)",
        description: "Aportes obligatorios a seguridad social pagados por el independiente a través de la PILA:",
        items,
        totalLabel: "Total Ingresos No Constitutivos (Casilla 44)",
        totalValue: c.casillas[44] ?? 0,
      };
    }

    case 45: {
      return {
        title: "Costos y Deducciones Procedentes en Honorarios (Casilla 45)",
        description: "Gastos con relación de causalidad y necesidad para la actividad profesional independiente (Art. 107 E.T.):",
        items: [
          {
            label: "Costos y deducciones soportados con Factura Electrónica",
            value: formatCOP(d.honorarios.costos),
            source: "Facturas electrónicas recibidas con validación previa / Nómina electrónica",
            legal: "Art. 107 y Art. 336-1 E.T. (Inhabilita la renta exenta del 25%)",
          },
        ],
        totalLabel: "Total Costos y Deducciones (Casilla 45)",
        totalValue: c.casillas[45] ?? 0,
      };
    }

    case 47: {
      return {
        title: "Aportes Voluntarios AFC / FVP en Honorarios (Casilla 47)",
        description: "Rentas exentas por ahorro en fondos de pensiones voluntarias y cuentas AFC en honorarios:",
        items: [
          {
            label: "Aportes voluntarios FVP y cuentas AFC / AVC",
            value: formatCOP(d.honorarios.aportesAfc),
            legal: "Arts. 126-1 y 126-4 E.T. (Límite 30% y 3.800 UVT)",
          },
        ],
        totalLabel: "Total Aportes AFC/FVP (Casilla 47)",
        totalValue: c.casillas[47] ?? 0,
      };
    }

    case 48: {
      return {
        title: "Otras Rentas Exentas de Honorarios (Casilla 48)",
        description: "Rentas exentas aplicables a la subcédula de honorarios:",
        items: [
          {
            label: "Renta exenta laboral del 25% (si no restó costos en casilla 45)",
            value: formatCOP(c.casillas[48] ?? 0),
            legal: "Art. 206 Num. 10 y Parágrafo 5 E.T.",
          },
          {
            label: "Rentas exentas Convenios CAN (Decisión 578)",
            value: formatCOP(d.honorarios.rentasCan),
          },
          {
            label: "Otras rentas exentas",
            value: formatCOP(d.honorarios.otrasExentas),
          },
        ],
        totalLabel: "Total Rentas Exentas (Casilla 48)",
        totalValue: c.casillas[48] ?? 0,
      };
    }

    case 50: {
      return {
        title: "Intereses de Vivienda en Honorarios (Casilla 50)",
        description: "Intereses de crédito hipotecario o leasing imputables a honorarios (Art. 119 E.T. - Tope 1.200 UVT):",
        items: [
          {
            label: "Intereses de crédito de vivienda",
            value: formatCOP(d.honorarios.interesesVivienda),
          },
        ],
        totalLabel: "Total Intereses de Vivienda (Casilla 50)",
        totalValue: c.casillas[50] ?? 0,
      };
    }

    case 51: {
      const h = d.honorarios;
      const items: ItemBreakdown[] = [];
      if (h.gmf > 0) {
        items.push({
          label: "Deducción 50% GMF (4x1000)",
          value: formatCOP(h.gmf),
          legal: "Art. 115 E.T.",
        });
      }
      if (h.medicinaPrepagada > 0) {
        items.push({
          label: "Medicina prepagada",
          value: formatCOP(h.medicinaPrepagada),
          legal: "Art. 387 E.T.",
        });
      }
      if (h.icetex > 0) {
        items.push({
          label: "Intereses ICETEX",
          value: formatCOP(h.icetex),
        });
      }
      if (h.aportesCesantiasIndependiente > 0) {
        items.push({
          label: "Aportes a fondos de cesantías del independiente",
          value: formatCOP(h.aportesCesantiasIndependiente),
          legal: "Art. 126-1 E.T.",
        });
      }
      if (h.fnceAnual > 0) {
        items.push({
          label: "Deducción FNCE y movilidad eléctrica",
          value: formatCOP(h.fnceAnual),
        });
      }
      if (h.otrasDeducciones > 0) {
        items.push({
          label: "Otras deducciones",
          value: formatCOP(h.otrasDeducciones),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin otras deducciones en honorarios",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Otras Deducciones en Honorarios (Casilla 51)",
        description: "Deducciones fiscales imputables a los ingresos por honorarios:",
        items,
        totalLabel: "Total Otras Deducciones (Casilla 51)",
        totalValue: c.casillas[51] ?? 0,
      };
    }

    case 53: {
      const exentasH = c.casillas[49] ?? 0;
      const deducH = c.casillas[52] ?? 0;
      const totalBeneficiosH = exentasH + deducH;
      const aceptadoH = c.casillas[53] ?? 0;

      const ingresosCedula =
        (c.casillas[32] ?? 0) +
        (c.casillas[43] ?? 0) +
        (c.casillas[58] ?? 0) +
        (c.casillas[62] ?? 0) +
        (c.casillas[74] ?? 0) +
        (c.casillas[79] ?? 0);
      const incrngoCedula =
        (c.casillas[33] ?? 0) +
        (c.casillas[44] ?? 0) +
        (c.casillas[59] ?? 0) +
        (c.casillas[76] ?? 0);
      const base40Cedula = Math.max(0, ingresosCedula - incrngoCedula);
      const limite40Valor = base40Cedula * 0.4;
      const topeUvt1340 = uvt * 1340;
      const limiteMaximoAplicable = Math.min(limite40Valor, topeUvt1340);

      return {
        title: "Control de Límites del 40% y 1.340 UVT en Honorarios (Casilla 53)",
        description:
          "Rentas exentas y deducciones aceptadas en honorarios y servicios personales (Art. 336 numeral 3 del Estatuto Tributario):",
        items: [
          {
            label: "Rentas exentas solicitadas en honorarios (Casilla 49)",
            value: formatCOP(exentasH),
            source: "Aportes AFC/FVP (Casilla 47) + 25% exención laboral (Casilla 48)",
          },
          {
            label: "Deducciones imputables solicitadas en honorarios (Casilla 52)",
            value: formatCOP(deducH),
            source: "Intereses vivienda (Casilla 50) + medicina prepagada, GMF, dependientes (Casilla 51)",
          },
          {
            label: "Total beneficios solicitados en honorarios",
            value: formatCOP(totalBeneficiosH),
            highlight: true,
          },
          {
            label: "Límite legal del 40% de la Cédula General",
            value: formatCOP(limite40Valor),
            legal: `40% × base Cédula General ($${formatNumber(base40Cedula)})`,
          },
          {
            label: "Tope máximo legal anual (1.340 UVT)",
            value: formatCOP(topeUvt1340),
            legal: `1.340 UVT × $${formatNumber(uvt)}`,
          },
        ],
        totalLabel: "Valor Aceptado en Casilla 53",
        totalValue: aceptadoH,
      };
    }

    // -------------------------------------------------------------------------
    // RENTAS DE CAPITAL
    // -------------------------------------------------------------------------
    case 58: {
      const k = d.capital;
      const items: ItemBreakdown[] = [];
      if (k.intereses > 0) {
        items.push({
          label: "Intereses y rendimientos en cuentas bancarias y CDTs",
          value: formatCOP(k.intereses),
          source: "Certificados tributarios bancarios (ej. Nu Colombia $234.098) / Formato 1007",
          legal: "Art. 38 E.T. (Aplica beneficio de componente inflacionario)",
        });
      }
      if ((k.rendimientosCesantias || 0) > 0) {
        items.push({
          label: "Rendimientos causados en el fondo de cesantías",
          value: formatCOP(k.rendimientosCesantias || 0),
          source: "Certificado tributario del fondo de cesantías (ej. Colfondos $63.673) / Formato 5063",
          legal: "Doctrina DIAN (Gravado 100% en capital sin componente inflacionario)",
        });
      }
      if (k.arrendamientos > 0) {
        items.push({
          label: "Ingresos por arrendamientos de bienes muebles e inmuebles",
          value: formatCOP(k.arrendamientos),
          source: "Contratos de arrendamiento / Formato 1007",
        });
      }
      if (k.regalias > 0) {
        items.push({
          label: "Ingresos por regalías y derechos de autor",
          value: formatCOP(k.regalias),
        });
      }
      if (k.rendimientosFinancieros > 0) {
        items.push({
          label: "Otros rendimientos y fiducias mercantiles",
          value: formatCOP(k.rendimientosFinancieros),
        });
      }
      if (k.explotacionIntangibles > 0) {
        items.push({
          label: "Explotación de intangibles y software",
          value: formatCOP(k.explotacionIntangibles),
        });
      }
      if (k.ingresosExterior > 0) {
        items.push({
          label: "Rentas de capital obtenidas en el exterior",
          value: formatCOP(k.ingresosExterior),
        });
      }
      return {
        title: "Desglose de Ingresos Brutos por Rentas de Capital (Casilla 58)",
        description: "Rendimientos financieros bancarios, de fondos y de capital generados durante el año gravable (Art. 335 E.T.):",
        items,
        totalLabel: "Total Ingresos Brutos de Capital (Casilla 58)",
        totalValue: c.casillas[58] ?? 0,
        footnote: "Los rendimientos del fondo de cesantías ($63.673) son la ganancia financiera generada por el fondo y se declaran en capital, mientras que el saldo de cesantías acumulado va en patrimonio (Casilla 29).",
      };
    }

    case 59: {
      const k = d.capital;
      const items: ItemBreakdown[] = [];
      if (k.componenteInflacionario > 0) {
        items.push({
          label: "Beneficio de inflación no gravado de rendimientos financieros",
          value: formatCOP(k.componenteInflacionario),
          legal: "Arts. 38 a 41 E.T. (Fijado anualmente por Decreto Reglamentario)",
          source: "Calculado sobre rendimientos bancarios de entidades de intermediación financiera",
        });
      }
      const segSoc = (k.aportesPension || 0) + (k.aportesSalud || 0);
      if (segSoc > 0) {
        items.push({
          label: "Aportes obligatorios a salud y pensión del rentista (PILA)",
          value: formatCOP(segSoc),
          legal: "Arts. 55 y 56 E.T.",
        });
      }
      if (k.incrngo > 0) {
        items.push({
          label: "Otros ingresos no constitutivos de renta de capital",
          value: formatCOP(k.incrngo),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin ingresos no constitutivos en capital",
          value: "$0",
        });
      }
      return {
        title: "Ingresos No Constitutivos de Renta de Capital (Casilla 59)",
        description: "Componente inflacionario no gravado y aportes a seguridad social en rentas de capital:",
        items,
        totalLabel: "Total INCRNGO Capital (Casilla 59)",
        totalValue: c.casillas[59] ?? 0,
      };
    }

    case 60: {
      return {
        title: "Costos y Gastos Procedentes de Capital (Casilla 60)",
        description: "Gastos de mantenimiento, administración, predial y servicios de inmuebles arrendados (Art. 107 E.T.):",
        items: [
          {
            label: "Costos y gastos procedentes de inmuebles arrendados",
            value: formatCOP(d.capital.costos),
            source: "Facturas electrónicas / Cuentas de cobro de administración / Recibos prediales",
          },
        ],
        totalLabel: "Total Costos de Capital (Casilla 60)",
        totalValue: c.casillas[60] ?? 0,
      };
    }

    case 62: {
      return {
        title: "Rentas Pasivas del Exterior - ECE en Capital (Casilla 62)",
        description: "Rentas pasivas obtenidas a través de Entidades Controladas del Exterior (ECE) en rentas de capital (Art. 884 E.T.):",
        items: [
          {
            label: "Rentas pasivas ECE de capital atribuidas",
            value: formatCOP(d.capital.ecePasiva),
            legal: "Arts. 882 a 893 del Estatuto Tributario (Régimen ECE)",
            source: "Declaración informativa ECE / Extractos de entidades en el exterior",
          },
        ],
        totalLabel: "Total Rentas Pasivas ECE Capital (Casilla 62)",
        totalValue: c.casillas[62] ?? 0,
      };
    }

    case 63: {
      return {
        title: "Aportes Voluntarios AFC / FVP en Capital (Casilla 63)",
        description: "Rentas exentas por aportes voluntarios a fondos de pensiones y cuentas AFC imputables a rentas de capital:",
        items: [
          {
            label: "Aportes voluntarios FVP y cuentas AFC / AVC",
            value: formatCOP(d.capital.aportesAfc),
            legal: `Arts. 126-1 y 126-4 E.T. (Límite individual 30% del ingreso y hasta 3.800 UVT = ${formatCOP(uvt * 3800)})`,
            source: "Certificados tributarios bancarios y de fondos de pensiones voluntarias",
          },
        ],
        totalLabel: "Total Aportes AFC/FVP Capital (Casilla 63)",
        totalValue: c.casillas[63] ?? 0,
      };
    }

    case 64: {
      return {
        title: "Otras Rentas Exentas de Capital (Casilla 64)",
        description: "Beneficios de exención tributaria aplicables a la subcédula de rentas de capital:",
        items: [
          {
            label: "Rentas exentas Convenios CAN (Decisión 578)",
            value: formatCOP(d.capital.rentasCan),
            legal: "Decisión 578 de la Comunidad Andina de Naciones",
          },
          {
            label: "Otras rentas exentas de capital",
            value: formatCOP(d.capital.otrasExentas),
          },
        ],
        totalLabel: "Total Rentas Exentas Capital (Casilla 64)",
        totalValue: c.casillas[64] ?? 0,
      };
    }

    case 66: {
      return {
        title: "Intereses de Vivienda en Capital (Casilla 66)",
        description: "Deducción de intereses pagados por crédito hipotecario o leasing habitacional imputables a capital (Art. 119 E.T. - Tope 1.200 UVT):",
        items: [
          {
            label: "Intereses de crédito hipotecario o leasing habitacional",
            value: formatCOP(d.capital.interesesVivienda),
            legal: `Art. 119 E.T. (Límite anual 1.200 UVT = ${formatCOP(uvt * 1200)})`,
            source: "Certificado bancario de crédito de vivienda",
          },
        ],
        totalLabel: "Total Intereses de Vivienda Capital (Casilla 66)",
        totalValue: c.casillas[66] ?? 0,
      };
    }

    case 67: {
      const k = d.capital;
      const items: ItemBreakdown[] = [];
      if (k.gmf > 0) {
        items.push({
          label: "Deducción del 50% del GMF (4x1000 bancario)",
          value: formatCOP(k.gmf * 0.5),
          legal: "Art. 115 E.T. (50% del 4x1000 certificado por bancos)",
          source: "Certificados tributarios bancarios (ej. Nu Colombia + Bancolombia)",
        });
      }
      if (k.icetex > 0) {
        items.push({
          label: "Intereses de créditos educativos ICETEX",
          value: formatCOP(k.icetex),
          legal: `Art. 119 E.T. (Límite 100 UVT = ${formatCOP(uvt * 100)})`,
        });
      }
      if (k.aportesCesantiasIndependiente > 0) {
        items.push({
          label: "Aportes a fondos de cesantías como independiente",
          value: formatCOP(k.aportesCesantiasIndependiente),
          legal: `Art. 126-1 E.T. (Límite 1/12 del ingreso y 2.500 UVT = ${formatCOP(uvt * 2500)})`,
        });
      }
      if (k.fnceAnual > 0) {
        items.push({
          label: "Deducción FNCE y movilidad sostenible",
          value: formatCOP(k.fnceAnual),
          legal: "Ley 1715 de 2014 y Ley 2099 de 2021",
        });
      }
      if (k.otrasDeducciones > 0) {
        items.push({
          label: "Otras deducciones imputables",
          value: formatCOP(k.otrasDeducciones),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin otras deducciones en capital",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Otras Deducciones en Rentas de Capital (Casilla 67)",
        description: "Deducciones personales imputables a los ingresos de capital autorizadas por ley:",
        items,
        totalLabel: "Total Otras Deducciones Capital (Casilla 67)",
        totalValue: c.casillas[67] ?? 0,
      };
    }

    case 69: {
      const exentasK = c.casillas[65] ?? 0;
      const deducK = c.casillas[68] ?? 0;
      const totalBeneficiosK = exentasK + deducK;
      const aceptadoK = c.casillas[69] ?? 0;

      const ingresosCedula =
        (c.casillas[32] ?? 0) +
        (c.casillas[43] ?? 0) +
        (c.casillas[58] ?? 0) +
        (c.casillas[62] ?? 0) +
        (c.casillas[74] ?? 0) +
        (c.casillas[79] ?? 0);
      const incrngoCedula =
        (c.casillas[33] ?? 0) +
        (c.casillas[44] ?? 0) +
        (c.casillas[59] ?? 0) +
        (c.casillas[76] ?? 0);
      const base40Cedula = Math.max(0, ingresosCedula - incrngoCedula);
      const limite40Valor = base40Cedula * 0.4;
      const topeUvt1340 = uvt * 1340;

      return {
        title: "Control de Límites del 40% y 1.340 UVT en Rentas de Capital (Casilla 69)",
        description:
          "Rentas exentas y deducciones aceptadas en rentas de capital (Art. 336 numeral 3 del Estatuto Tributario):",
        items: [
          {
            label: "Rentas exentas solicitadas en capital (Casilla 65)",
            value: formatCOP(exentasK),
            source: "Aportes AFC/FVP (Casilla 63) + Otras exentas (Casilla 64)",
          },
          {
            label: "Deducciones imputables solicitadas en capital (Casilla 68)",
            value: formatCOP(deducK),
            source: "Intereses vivienda (Casilla 66) + 50% GMF, cesantías e ICETEX (Casilla 67)",
          },
          {
            label: "Total beneficios solicitados en capital",
            value: formatCOP(totalBeneficiosK),
            highlight: true,
          },
          {
            label: "Límite legal del 40% de la Cédula General",
            value: formatCOP(limite40Valor),
            legal: `40% × base Cédula General ($${formatNumber(base40Cedula)})`,
          },
          {
            label: "Tope máximo legal anual (1.340 UVT)",
            value: formatCOP(topeUvt1340),
            legal: `1.340 UVT × $${formatNumber(uvt)}`,
          },
        ],
        totalLabel: "Valor Aceptado en Casilla 69",
        totalValue: aceptadoK,
      };
    }

    case 72: {
      return {
        title: "Compensación de Pérdidas Fiscales de Capital (Casilla 72)",
        description: "Pérdidas fiscales declaradas en años gravables anteriores en la subcédula de capital que se compensan contra las utilidades del año (Art. 330 E.T.):",
        items: [
          {
            label: "Pérdidas de capital de periodos anteriores compensadas",
            value: formatCOP(d.capital.compensacionPerdidas),
            legal: "Art. 330 E.T. (Reajustadas fiscalmente hasta el límite de la renta líquida)",
            source: "Declaraciones de renta de años anteriores (Formulario 210)",
          },
        ],
        totalLabel: "Total Pérdidas Compensadas Capital (Casilla 72)",
        totalValue: c.casillas[72] ?? 0,
      };
    }

    // -------------------------------------------------------------------------
    // RENTAS NO LABORALES
    // -------------------------------------------------------------------------
    case 74: {
      const nl = d.noLaborales;
      const items: ItemBreakdown[] = [];
      if (nl.ingresos > 0) {
        items.push({
          label: "Ingresos por comercio, servicios y actividades no laborales",
          value: formatCOP(nl.ingresos),
          source: "Libro fiscal / Facturación electrónica emitida / Formato 1007",
        });
      }
      if (nl.ventas > 0) {
        items.push({
          label: "Venta de activos fijos poseídos por menos de 2 años",
          value: formatCOP(nl.ventas),
          legal: "Renta ordinaria no laboral (Art. 335 E.T.)",
        });
      }
      if (nl.demas > 0) {
        items.push({
          label: "Otros ingresos no laborales (Notarías, curadurías, recompensas)",
          value: formatCOP(nl.demas),
        });
      }
      return {
        title: "Desglose de Ingresos Brutos No Laborales (Casilla 74)",
        description: "Ingresos por actividades comerciales, mercantiles o de servicios con costos (Art. 335 E.T.):",
        items,
        totalLabel: "Total Ingresos No Laborales (Casilla 74)",
        totalValue: c.casillas[74] ?? 0,
      };
    }

    case 75: {
      return {
        title: "Devoluciones, Rebajas y Descuentos en Ventas (Casilla 75)",
        description: "Notas crédito comerciales y devoluciones en ventas mercantiles (Art. 26 E.T.):",
        items: [
          {
            label: "Devoluciones y rebajas comerciales concedidas a clientes",
            value: formatCOP(d.noLaborales.devoluciones),
            source: "Notas crédito electrónicas / Registros contables",
          },
        ],
        totalLabel: "Total Devoluciones en Ventas (Casilla 75)",
        totalValue: c.casillas[75] ?? 0,
      };
    }

    case 76: {
      const nl = d.noLaborales;
      const items: ItemBreakdown[] = [];
      if (nl.apoyosEducativos > 0) {
        items.push({
          label: "Apoyos económicos educativos no gravados",
          value: formatCOP(nl.apoyosEducativos),
          legal: "Art. 46 E.T.",
        });
      }
      if (nl.indemnizacionesSeguroDano > 0) {
        items.push({
          label: "Indemnizaciones por seguro de daño emergente",
          value: formatCOP(nl.indemnizacionesSeguroDano),
          legal: "Art. 45 E.T.",
        });
      }
      const segSoc = (nl.aportesPension || 0) + (nl.aportesSalud || 0);
      if (segSoc > 0) {
        items.push({
          label: "Aportes obligatorios a seguridad social (PILA)",
          value: formatCOP(segSoc),
          legal: "Arts. 55 y 56 E.T.",
        });
      }
      if (nl.incrngo > 0) {
        items.push({
          label: "Otros ingresos no constitutivos",
          value: formatCOP(nl.incrngo),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin ingresos no constitutivos no laborales",
          value: "$0",
        });
      }
      return {
        title: "Ingresos No Constitutivos de Rentas No Laborales (Casilla 76)",
        description: "Conceptos no constitutivos de renta aplicables a la subcédula no laboral:",
        items,
        totalLabel: "Total INCRNGO No Laboral (Casilla 76)",
        totalValue: c.casillas[76] ?? 0,
      };
    }

    case 77: {
      return {
        title: "Costos y Deducciones Procedentes No Laborales (Casilla 77)",
        description: "Costo de ventas, compras de mercancía, insumos, nómina y gastos operativos (Art. 107 E.T.):",
        items: [
          {
            label: "Costos y gastos del negocio soportados con Factura Electrónica",
            value: formatCOP(d.noLaborales.costos),
            source: "Facturas electrónicas recibidas / Documentos soporte",
          },
        ],
        totalLabel: "Total Costos No Laborales (Casilla 77)",
        totalValue: c.casillas[77] ?? 0,
      };
    }

    case 79: {
      return {
        title: "Rentas Pasivas del Exterior - ECE No Laborales (Casilla 79)",
        description: "Rentas pasivas obtenidas a través de Entidades Controladas del Exterior en actividades comerciales (Art. 884 E.T.):",
        items: [
          {
            label: "Rentas pasivas ECE no laborales atribuidas",
            value: formatCOP(d.noLaborales.ecePasiva),
            legal: "Arts. 882 a 893 del Estatuto Tributario (Régimen ECE)",
          },
        ],
        totalLabel: "Total ECE No Laborales (Casilla 79)",
        totalValue: c.casillas[79] ?? 0,
      };
    }

    case 80: {
      return {
        title: "Aportes Voluntarios AFC / FVP en No Laborales (Casilla 80)",
        description: "Rentas exentas por ahorro voluntario para pensión y fomento a la construcción en actividades no laborales:",
        items: [
          {
            label: "Aportes voluntarios FVP y cuentas AFC / AVC",
            value: formatCOP(d.noLaborales.aportesAfc),
            legal: `Arts. 126-1 y 126-4 E.T. (Límite individual 30% del ingreso y hasta 3.800 UVT = ${formatCOP(uvt * 3800)})`,
          },
        ],
        totalLabel: "Total Aportes AFC/FVP No Laborales (Casilla 80)",
        totalValue: c.casillas[80] ?? 0,
      };
    }

    case 81: {
      return {
        title: "Otras Rentas Exentas No Laborales (Casilla 81)",
        description: "Beneficios de exención tributaria aplicables a actividades comerciales y no laborales:",
        items: [
          {
            label: "Rentas exentas Convenios CAN (Decisión 578)",
            value: formatCOP(d.noLaborales.rentasCan),
            legal: "Decisión 578 de la Comunidad Andina de Naciones",
          },
          {
            label: "Otras rentas exentas no laborales",
            value: formatCOP(d.noLaborales.otrasExentas),
          },
        ],
        totalLabel: "Total Rentas Exentas No Laborales (Casilla 81)",
        totalValue: c.casillas[81] ?? 0,
      };
    }

    case 83: {
      return {
        title: "Intereses de Vivienda No Laborales (Casilla 83)",
        description: "Deducción de intereses de crédito hipotecario o leasing habitacional en actividades no laborales (Art. 119 E.T.):",
        items: [
          {
            label: "Intereses de crédito hipotecario o leasing de vivienda",
            value: formatCOP(d.noLaborales.interesesVivienda),
            legal: `Art. 119 E.T. (Límite 1.200 UVT = ${formatCOP(uvt * 1200)})`,
          },
        ],
        totalLabel: "Total Intereses Vivienda No Laborales (Casilla 83)",
        totalValue: c.casillas[83] ?? 0,
      };
    }

    case 84: {
      const nl = d.noLaborales;
      const items: ItemBreakdown[] = [];
      if (nl.gmf > 0) {
        items.push({
          label: "Deducción del 50% del GMF (4x1000 bancario)",
          value: formatCOP(nl.gmf * 0.5),
          legal: "Art. 115 E.T.",
        });
      }
      if (nl.icetex > 0) {
        items.push({
          label: "Intereses de crédito educativo ICETEX",
          value: formatCOP(nl.icetex),
          legal: `Art. 119 E.T. (Tope 100 UVT = ${formatCOP(uvt * 100)})`,
        });
      }
      if (nl.aportesCesantiasIndependiente > 0) {
        items.push({
          label: "Aportes a fondos de cesantías como independiente",
          value: formatCOP(nl.aportesCesantiasIndependiente),
          legal: `Art. 126-1 E.T. (Tope 1/12 del ingreso y 2.500 UVT = ${formatCOP(uvt * 2500)})`,
        });
      }
      if (nl.fnceAnual > 0) {
        items.push({
          label: "Deducción FNCE y movilidad eléctrica",
          value: formatCOP(nl.fnceAnual),
        });
      }
      if (nl.otrasDeducciones > 0) {
        items.push({
          label: "Otras deducciones no laborales",
          value: formatCOP(nl.otrasDeducciones),
        });
      }
      if (items.length === 0) {
        items.push({
          label: "Sin otras deducciones en no laborales",
          value: "$0",
        });
      }
      return {
        title: "Desglose de Otras Deducciones No Laborales (Casilla 84)",
        description: "Deducciones fiscales imputables a los ingresos por actividades comerciales y no laborales:",
        items,
        totalLabel: "Total Otras Deducciones No Laborales (Casilla 84)",
        totalValue: c.casillas[84] ?? 0,
      };
    }

    case 86: {
      const exentasNL = c.casillas[82] ?? 0;
      const deducNL = c.casillas[85] ?? 0;
      const totalBeneficiosNL = exentasNL + deducNL;
      const aceptadoNL = c.casillas[86] ?? 0;

      const ingresosCedula =
        (c.casillas[32] ?? 0) +
        (c.casillas[43] ?? 0) +
        (c.casillas[58] ?? 0) +
        (c.casillas[62] ?? 0) +
        (c.casillas[74] ?? 0) +
        (c.casillas[79] ?? 0);
      const incrngoCedula =
        (c.casillas[33] ?? 0) +
        (c.casillas[44] ?? 0) +
        (c.casillas[59] ?? 0) +
        (c.casillas[76] ?? 0);
      const base40Cedula = Math.max(0, ingresosCedula - incrngoCedula);
      const limite40Valor = base40Cedula * 0.4;
      const topeUvt1340 = uvt * 1340;

      return {
        title: "Control de Límites del 40% y 1.340 UVT en Rentas No Laborales (Casilla 86)",
        description:
          "Rentas exentas y deducciones aceptadas en actividades comerciales y no laborales (Art. 336 numeral 3 del Estatuto Tributario):",
        items: [
          {
            label: "Rentas exentas solicitadas en no laborales (Casilla 82)",
            value: formatCOP(exentasNL),
            source: "Aportes AFC/FVP (Casilla 80) + Otras exentas (Casilla 81)",
          },
          {
            label: "Deducciones imputables solicitadas en no laborales (Casilla 85)",
            value: formatCOP(deducNL),
            source: "Intereses vivienda (Casilla 83) + 50% GMF, cesantías e ICETEX (Casilla 84)",
          },
          {
            label: "Total beneficios solicitados en no laborales",
            value: formatCOP(totalBeneficiosNL),
            highlight: true,
          },
          {
            label: "Límite legal del 40% de la Cédula General",
            value: formatCOP(limite40Valor),
            legal: `40% × base Cédula General ($${formatNumber(base40Cedula)})`,
          },
          {
            label: "Tope máximo legal anual (1.340 UVT)",
            value: formatCOP(topeUvt1340),
            legal: `1.340 UVT × $${formatNumber(uvt)}`,
          },
        ],
        totalLabel: "Valor Aceptado en Casilla 86",
        totalValue: aceptadoNL,
      };
    }

    case 89: {
      return {
        title: "Compensación de Pérdidas Fiscales No Laborales (Casilla 89)",
        description: "Pérdidas fiscales de años anteriores originadas en actividades no laborales compensadas en el periodo (Art. 330 E.T.):",
        items: [
          {
            label: "Pérdidas no laborales de años anteriores compensadas",
            value: formatCOP(d.noLaborales.compensacionPerdidas),
            legal: "Art. 330 E.T. (Hasta el límite de la renta líquida del ejercicio)",
          },
        ],
        totalLabel: "Total Pérdidas Compensadas No Laborales (Casilla 89)",
        totalValue: c.casillas[89] ?? 0,
      };
    }

    // -------------------------------------------------------------------------
    // DEPURACIÓN CÉDULA GENERAL (Casillas 91 a 98)
    // -------------------------------------------------------------------------
    case 91: {
      return {
        title: "Renta Líquida Total de la Cédula General (Casilla 91)",
        description:
          "Suma consolidada de las ganancias netas líquidas obtenidas en las subcédulas de Trabajo, Honorarios, Capital y No Laborales (Art. 336 numeral 1 y 2 E.T.):",
        items: [
          {
            label: "Renta líquida de trabajo (Casilla 34)",
            value: formatCOP(c.casillas[34] ?? 0),
            source: "Ingresos laborales menos aportes a salud y pensión",
          },
          {
            label: "Renta líquida de honorarios y servicios (Casilla 46)",
            value: formatCOP(c.casillas[46] ?? 0),
            source: "Honorarios cobrados menos salud y pensión",
          },
          {
            label: "Renta líquida de capital (Casilla 61 + 62 ECE)",
            value: formatCOP((c.casillas[61] ?? 0) + (c.casillas[62] ?? 0)),
            source: "Rendimientos financieros y arriendos menos costos",
          },
          {
            label: "Renta líquida no laboral (Casilla 78 + 79 ECE)",
            value: formatCOP((c.casillas[78] ?? 0) + (c.casillas[79] ?? 0)),
            source: "Comercio y actividades no laborales menos costos",
          },
        ],
        totalLabel: "Total Renta Líquida Cédula General (Casilla 91)",
        totalValue: c.casillas[91] ?? 0,
        footnote:
          "Esta suma representa el 100% de la base neta de ingresos del declarante antes de restar beneficios tributarios y deducciones.",
      };
    }

    case 92: {
      const items: ItemBreakdown[] = [
        {
          label: "Rentas exentas y deducciones de trabajo (Casilla 41)",
          value: formatCOP(c.casillas[41] ?? 0),
          source: "Beneficios de trabajo aceptados bajo el límite del 40%",
        },
        {
          label: "Rentas exentas y deducciones de honorarios (Casilla 53)",
          value: formatCOP(c.casillas[53] ?? 0),
          source: "Beneficios de honorarios aceptados bajo el límite del 40%",
        },
        {
          label: "Rentas exentas y deducciones de capital (Casilla 69)",
          value: formatCOP(c.casillas[69] ?? 0),
          source: "Beneficios de capital aceptados bajo el límite del 40%",
        },
        {
          label: "Rentas exentas y deducciones no laborales (Casilla 86)",
          value: formatCOP(c.casillas[86] ?? 0),
          source: "Beneficios no laborales aceptados bajo el límite del 40%",
        },
      ];

      if ((c.casillas[28] ?? 0) > 0) {
        items.push({
          label: "Deducción del 1% por compras con factura electrónica (Casilla 28)",
          value: formatCOP(c.casillas[28] ?? 0),
          legal: "Art. 336 numeral 5 E.T. (Fuera del límite del 40%)",
          highlight: true,
        });
      }

      if ((c.casillas[139] ?? 0) > 0) {
        items.push({
          label: "Deducción adicional 72 UVT por dependientes (Casilla 139)",
          value: formatCOP(c.casillas[139] ?? 0),
          legal: `Art. 336 inciso 2 E.T. (${d.trabajo.dependientes || 0} dependiente(s) × 72 UVT = ${formatCOP(c.casillas[139] ?? 0)}) - Fuera del 40%`,
          highlight: true,
        });
      }

      return {
        title: "Total Rentas Exentas y Deducciones Imputables (Casilla 92)",
        description:
          "Consolidado de todas las rentas exentas y deducciones aceptadas por ley que disminuyen directamente el impuesto de renta de la Cédula General (Art. 336 E.T.):",
        items,
        totalLabel: "Total Beneficios Restables (Casilla 92)",
        totalValue: c.casillas[92] ?? 0,
        footnote:
          "Incluye los beneficios del 40% más los beneficios especiales otorgados por la Ley 2277 (1% de compras electrónicas y los 72 UVT por cada dependiente económico).",
      };
    }

    case 93: {
      return {
        title: "Renta Líquida Ordinaria de la Cédula General (Casilla 93)",
        description:
          "Resultado neto de restar todos los beneficios tributarios y deducciones permitidas a la renta líquida total de la Cédula General (Fórmula oficial DIAN: Casilla 91 - Casilla 92):",
        items: [
          {
            label: "Renta líquida total de la Cédula General (Casilla 91)",
            value: formatCOP(c.casillas[91] ?? 0),
            source: "Ingresos netos consolidados de todas las subcédulas",
          },
          {
            label: "Total rentas exentas y deducciones aplicadas (Casilla 92)",
            value: formatCOP(c.casillas[92] ?? 0),
            source: "Total de beneficios, deducciones, 1% compras y dependientes 72 UVT",
          },
        ],
        totalLabel: "Renta Líquida Ordinaria (Casilla 93)",
        totalValue: c.casillas[93] ?? 0,
        footnote: `Cálculo oficial: Casilla 91 ($${formatNumber(c.casillas[91] ?? 0)}) - Casilla 92 ($${formatNumber(c.casillas[92] ?? 0)}) = $${formatNumber(c.casillas[93] ?? 0)}. Sobre este valor se aplica la tabla de tarifas del impuesto.`,
      };
    }

    case 97: {
      return {
        title: "Renta Líquida Gravable de la Cédula General (Casilla 97)",
        description:
          "Base definitiva sobre la cual se calcula el impuesto de renta según la tabla progresiva del Art. 241 del Estatuto Tributario:",
        items: [
          {
            label: "Renta líquida ordinaria de la Cédula General (Casilla 93)",
            value: formatCOP(c.casillas[93] ?? 0),
          },
          {
            label: "Compensación de pérdidas de 2018 y anteriores (Casilla 94)",
            value: formatCOP(c.casillas[94] ?? 0),
          },
          {
            label: "Compensación por exceso de renta presuntiva (Casilla 95)",
            value: formatCOP(c.casillas[95] ?? 0),
          },
          {
            label: "Rentas gravables especiales adicionadas (Casilla 96)",
            value: formatCOP(c.casillas[96] ?? 0),
          },
        ],
        totalLabel: "Base Gravable Final (Casilla 97)",
        totalValue: c.casillas[97] ?? 0,
        footnote: `Esta es la base neta de tu declaración (${formatCOP(c.casillas[97] ?? 0)} = ${(c.uvt > 0 ? (c.casillas[97] / c.uvt).toFixed(1) : 0)} UVT). Si es menor a 1.090 UVT ($${formatNumber(uvt * 1090)}), la tarifa de impuesto es 0%.`,
      };
    }

    case 94: {
      return {
        title: "Compensación de Pérdidas Años 2018 y Anteriores (Casilla 94)",
        description: "Compensación general de pérdidas fiscales líquidas acumuladas hasta el año 2018 (Art. 330 Parágrafo transitorio E.T.):",
        items: [
          {
            label: "Pérdidas fiscales de 2018 y anteriores compensadas",
            value: formatCOP(d.extra.compensacionPerdidas2018),
            legal: "Art. 330 Parágrafo transitorio del Estatuto Tributario",
            source: "Declaraciones de renta año 2018 y anteriores",
          },
        ],
        totalLabel: "Total Pérdidas 2018 Compensadas (Casilla 94)",
        totalValue: c.casillas[94] ?? 0,
      };
    }

    case 95: {
      return {
        title: "Compensación por Exceso de Renta Presuntiva (Casilla 95)",
        description: "Excesos de renta presuntiva sobre renta ordinaria liquidados en los 5 periodos gravables anteriores (Art. 189 Parágrafo E.T.):",
        items: [
          {
            label: "Exceso de renta presuntiva compensado en el año",
            value: formatCOP(d.extra.compensacionExcesoPresuntiva),
            legal: "Art. 189 Parágrafo del Estatuto Tributario (Término de firmeza: 5 años)",
          },
        ],
        totalLabel: "Total Exceso Renta Presuntiva (Casilla 95)",
        totalValue: c.casillas[95] ?? 0,
      };
    }

    case 96: {
      return {
        title: "Rentas Gravables Especiales y Descuadre Patrimonial (Casilla 96)",
        description: "Rentas gravables por recuperación de deducciones, activos omitidos, pasivos inexistentes o renta por comparación patrimonial (Arts. 195 a 199, 236 a 239-1 E.T.):",
        items: [
          {
            label: "Rentas gravables especiales y activos omitidos declarados",
            value: formatCOP(d.extra.rentasGravables),
            legal: "Arts. 195, 236 y 239-1 del Estatuto Tributario",
          },
        ],
        totalLabel: "Total Rentas Gravables (Casilla 96)",
        totalValue: c.casillas[96] ?? 0,
      };
    }

    case 98: {
      return {
        title: "Renta Presuntiva de Ley (Casilla 98)",
        description: "Rendimiento mínimo presunto del patrimonio líquido del año anterior exigido por ley (Art. 188 E.T.):",
        items: [
          {
            label: "Patrimonio líquido del año anterior base",
            value: formatCOP(d.patrimonio.patrimonioLiquidoAnterior),
          },
          {
            label: "Tarifa legal vigente de renta presuntiva",
            value: "0.0 %",
            legal: "Art. 188 E.T. (Modificado por Ley 2010 de 2019: tarifa 0% a partir de 2021)",
          },
          {
            label: "Renta presuntiva liquidada",
            value: "$0",
          },
        ],
        totalLabel: "Total Renta Presuntiva (Casilla 98)",
        totalValue: 0,
        footnote: "Desde el año gravable 2021, la tarifa de renta presuntiva en Colombia es del 0%, por lo que la base gravable siempre se liquida sobre la renta ordinaria real.",
      };
    }

    // -------------------------------------------------------------------------
    // CÉDULA DE PENSIONES
    // -------------------------------------------------------------------------
    case 99: {
      const p = d.pensiones;
      return {
        title: "Desglose de Ingresos por Pensiones (Casilla 99)",
        description: "Mesadas pensionales de jubilación, vejez, invalidez, de sobrevivientes y sobre riesgos laborales recibidas en el año gravable (Art. 206 Num. 5 E.T.):",
        items: [
          {
            label: "Mesadas pensionales del país y del exterior",
            value: formatCOP(p.ingresos),
            source: "Formato 220 de pensionados / Certificado tributario del fondo de pensiones",
          },
        ],
        totalLabel: "Total Ingresos Brutos de Pensiones (Casilla 99)",
        totalValue: c.casillas[99] ?? 0,
      };
    }

    case 100: {
      return {
        title: "Aportes a Salud y Solidaridad Pensional (Casilla 100)",
        description: "Descuentos obligatorios efectuados en la mesada pensional con destino al sistema de salud (Art. 56 E.T.):",
        items: [
          {
            label: "Aportes obligatorios a salud y Fondo de Solidaridad Pensional",
            value: formatCOP(d.pensiones.incrngo),
            source: "Formato 220 de pensionados / Desprendibles de mesada",
          },
        ],
        totalLabel: "Total Aportes Salud Pensiones (Casilla 100)",
        totalValue: c.casillas[100] ?? 0,
      };
    }

    case 102: {
      const p = d.pensiones;
      return {
        title: "Desglose de Rentas Exentas de Pensiones (Casilla 102)",
        description: "Exención legal de hasta 1.000 UVT mensuales otorgada por el Numeral 5 del Artículo 206 del Estatuto Tributario:",
        items: [
          {
            label: "Mesadas pensionales pagadas en el año",
            value: `${p.meses} mesada(s)`,
          },
          {
            label: "Tope legal mensual de exención (1.000 UVT/mes)",
            value: formatCOP(uvt * 1000),
            legal: `1.000 UVT × $${formatNumber(uvt)}`,
          },
          {
            label: "Tope anual acumulado de exención",
            value: formatCOP(p.meses * uvt * 1000),
          },
        ],
        totalLabel: "Exención Pensional Calculada (Casilla 102)",
        totalValue: c.casillas[102] ?? 0,
        footnote: "Si la mesada mensual del pensionado no supera las 1.000 UVT, el 100% de la pensión está libre de impuesto de renta.",
      };
    }

    // -------------------------------------------------------------------------
    // CÉDULA DE DIVIDENDOS Y PARTICIPACIONES
    // -------------------------------------------------------------------------
    case 104: {
      return {
        title: "Dividendos Año 2016 y Anteriores Gravados (Casilla 104)",
        description: "Utilidades generadas hasta 2016 que no tributaron en la sociedad (Parágrafo 2 Art. 49 E.T.):",
        items: [
          {
            label: "Dividendos gravados de utilidades 2016 y anteriores",
            value: formatCOP(d.dividendos.div2016),
            source: "Certificado de dividendos expedido por la sociedad",
          },
        ],
        totalLabel: "Total Dividendos Gravados 2016 (Casilla 104)",
        totalValue: c.casillas[104] ?? 0,
      };
    }

    case 105: {
      return {
        title: "Dividendos Año 2016 y Anteriores No Gravados (Casilla 105)",
        description: "Utilidades generadas hasta 2016 que tributaron plenamente en la sociedad (Num. 3 Art. 49 E.T. - INCRNGO):",
        items: [
          {
            label: "Dividendos no gravados de utilidades 2016 y anteriores",
            value: formatCOP(d.dividendos.incrngo2016),
            source: "Certificado de dividendos / Formato 1010",
          },
        ],
        totalLabel: "Total Dividendos No Gravados 2016 (Casilla 105)",
        totalValue: c.casillas[105] ?? 0,
      };
    }

    case 107: {
      return {
        title: "1ª Subcédula Dividendos 2017+ No Gravados en Sociedad (Casilla 107)",
        description: "Utilidades pagaron impuesto en la sociedad (Num. 3 Art. 49 E.T.). Se integran a la base de la tabla del Art. 241 con descuento del 19% (Art. 242 E.T.):",
        items: [
          {
            label: "Dividendos 1ª subcédula 2017 y siguientes",
            value: formatCOP(d.dividendos.subcedula1),
            source: "Certificado de dividendos de la sociedad / Formato 1010",
          },
        ],
        totalLabel: "Total 1ª Subcédula Dividendos (Casilla 107)",
        totalValue: c.casillas[107] ?? 0,
      };
    }

    case 108: {
      return {
        title: "2ª Subcédula Dividendos 2017+ Gravados en Sociedad (Casilla 108)",
        description: "Utilidades NO pagaron impuesto en la sociedad (Par. 2 Art. 49 E.T.). Tributan primero al 35% de sociedades y el remanente a la tabla general:",
        items: [
          {
            label: "Dividendos 2ª subcédula 2017 y siguientes",
            value: formatCOP(d.dividendos.subcedula2),
            source: "Certificado de dividendos de la sociedad",
          },
        ],
        totalLabel: "Total 2ª Subcédula Dividendos (Casilla 108)",
        totalValue: c.casillas[108] ?? 0,
      };
    }

    case 109: {
      return {
        title: "Dividendos y Participaciones del Exterior (Casilla 109)",
        description: "Dividendos recibidos de sociedades extranjeras durante el año gravable (Art. 241 E.T.):",
        items: [
          {
            label: "Dividendos de fuente extranjera recibidos",
            value: formatCOP(d.dividendos.exterior),
            source: "Certificados de dividendos de entidades del exterior / Extractos internacionales",
          },
        ],
        totalLabel: "Total Dividendos Exterior (Casilla 109)",
        totalValue: c.casillas[109] ?? 0,
      };
    }

    case 110: {
      return {
        title: "Rentas Exentas sobre Dividendos del Exterior (Casilla 110)",
        description: "Exenciones aplicables a dividendos del exterior por convenios de doble imposición (CDI):",
        items: [
          {
            label: "Dividendos del exterior exentos por convenios CDI",
            value: formatCOP(d.dividendos.exentasExterior),
            legal: "Convenios para Evitar la Doble Imposición (CDI)",
          },
        ],
        totalLabel: "Total Exenciones Dividendos Exterior (Casilla 110)",
        totalValue: c.casillas[110] ?? 0,
      };
    }

    // -------------------------------------------------------------------------
    // GANANCIAS OCASIONALES
    // -------------------------------------------------------------------------
    case 112: {
      const go = d.gananciasOcasionales;
      const items: ItemBreakdown[] = [];
      if (go.enajenacionActivos > 0) {
        items.push({
          label: "Venta de activos fijos poseídos 2 años o más (Inmuebles, vehículos, acciones)",
          value: formatCOP(go.enajenacionActivos),
          source: "Escritura pública de compraventa / Formato 1007",
        });
      }
      if (go.herencias > 0) {
        items.push({
          label: "Herencias, legados y porción conyugal",
          value: formatCOP(go.herencias),
          legal: "Art. 302 E.T. / Escritura pública de sucesión",
        });
      }
      if (go.donaciones > 0) {
        items.push({
          label: "Donaciones y actos a título gratuito entre vivos",
          value: formatCOP(go.donaciones),
          legal: "Art. 302 E.T.",
        });
      }
      if (go.loterias > 0) {
        items.push({
          label: "Premios por loterías, rifas, apuestas y similares (Tarifa 20%)",
          value: formatCOP(go.loterias),
          legal: "Arts. 306 y 317 E.T.",
        });
      }
      if (go.seguroVida > 0) {
        items.push({
          label: "Indemnizaciones por seguro de vida",
          value: formatCOP(go.seguroVida),
          legal: "Art. 303-1 E.T. (No gravado hasta 3.250 UVT)",
        });
      }
      if (go.ventaVivienda > 0) {
        items.push({
          label: "Venta de casa o apartamento de habitación",
          value: formatCOP(go.ventaVivienda),
          legal: "Art. 311-1 E.T. (Exentas hasta 5.000 UVT)",
        });
      }
      if (go.otros > 0) {
        items.push({
          label: "Otros ingresos por ganancia ocasional",
          value: formatCOP(go.otros),
        });
      }
      return {
        title: "Desglose de Ganancias Ocasionales Brutas (Casilla 112)",
        description: "Ingresos extraordinarios por enajenación de activos poseídos por 2 o más años, herencias, donaciones y premios (Arts. 300 a 317 E.T.):",
        items,
        totalLabel: "Total Ganancias Ocasionales (Casilla 112)",
        totalValue: c.casillas[112] ?? 0,
      };
    }

    case 113: {
      return {
        title: "Costos Fiscales por Ganancias Ocasionales (Casilla 113)",
        description: "Costo fiscal de los bienes raíces, vehículos o acciones enajenados poseídos 2 años o más (Arts. 72, 73 y 277 E.T.):",
        items: [
          {
            label: "Costo fiscal declarado del bien enajenado",
            value: formatCOP(d.gananciasOcasionales.costos),
            source: "Declaración de renta del año anterior / Recibo predial",
          },
        ],
        totalLabel: "Total Costos Fiscales GO (Casilla 113)",
        totalValue: c.casillas[113] ?? 0,
      };
    }

    case 114: {
      return {
        title: "Ganancias Ocasionales No Gravadas y Exentas (Casilla 114)",
        description: "Porción exenta de herencias, vivienda de habitación e indemnizaciones de seguro de vida:",
        items: [
          {
            label: "Ganancias ocasionales exentas y no gravadas",
            value: formatCOP(d.gananciasOcasionales.goNoGravadas),
            legal: "Arts. 307 y 311-1 del Estatuto Tributario",
          },
        ],
        totalLabel: "Total Ganancias Exentas (Casilla 114)",
        totalValue: c.casillas[114] ?? 0,
      };
    }

    case 117: {
      return {
        title: "Impuesto sobre Renta Presuntiva (Casilla 117)",
        description: "Impuesto calculado sobre la renta presuntiva si esta resultase superior a la renta ordinaria:",
        items: [
          {
            label: "Impuesto sobre renta presuntiva liquidado",
            value: "$0",
            legal: "Art. 188 E.T. (Tarifa 0%)",
          },
        ],
        totalLabel: "Total Impuesto Presuntiva (Casilla 117)",
        totalValue: 0,
      };
    }

    // -------------------------------------------------------------------------
    // LIQUIDACIÓN PRIVADA, DESCUENTOS Y SALDOS
    // -------------------------------------------------------------------------
    case 122: {
      return {
        title: "Descuento por Impuestos Pagados en el Exterior (Casilla 122)",
        description: "Tax Credit por impuestos a la renta pagados en otros países sobre rentas de fuente extranjera (Art. 254 E.T.):",
        items: [
          {
            label: "Impuestos acreditados pagados en el exterior",
            value: formatCOP(d.descuentos.impuestosExterior),
            source: "Certificados tributarios de la administración fiscal extranjera",
          },
        ],
        totalLabel: "Total Descuento Exterior (Casilla 122)",
        totalValue: c.casillas[122] ?? 0,
      };
    }

    case 123: {
      return {
        title: "Descuento Tributario por Donaciones a ESAL (Casilla 123)",
        description: "Descuento del 25% del valor donado a entidades del Régimen Tributario Especial (Art. 257 E.T.) o 30% en I+D+i:",
        items: [
          {
            label: "Donaciones efectivamente realizadas en el año a entidades ESAL",
            value: formatCOP(d.descuentos.donaciones),
            legal: `Descuento del 25% (Límite 30% del impuesto básico = ${formatCOP((c.casillas[121] ?? 0) * 0.3)})`,
            source: "Certificado de donación firmado por Revisor Fiscal de la ESAL",
          },
        ],
        totalLabel: "Total Descuento Donaciones (Casilla 123)",
        totalValue: c.casillas[123] ?? 0,
      };
    }

    case 124: {
      return {
        title: "Otros Descuentos Tributarios (Casilla 124)",
        description: "Descuentos por becas por impuestos, inversiones en I+D+i y medio ambiente (Arts. 255 a 258 E.T.):",
        items: [
          {
            label: "Otros descuentos tributarios aplicados",
            value: formatCOP(d.descuentos.otros),
            legal: "Arts. 255, 256, 257-1 y 258 del Estatuto Tributario",
          },
        ],
        totalLabel: "Total Otros Descuentos (Casilla 124)",
        totalValue: c.casillas[124] ?? 0,
      };
    }

    case 128: {
      return {
        title: "Descuento Exterior en Ganancias Ocasionales (Casilla 128)",
        description: "Crédito tributario por impuestos pagados en el exterior sobre ganancias ocasionales de fuente extranjera (Art. 254 E.T.):",
        items: [
          {
            label: "Impuestos acreditables pagados en el exterior sobre GO",
            value: formatCOP(d.gananciasOcasionales.impuestoExterior),
            legal: "Art. 254 del Estatuto Tributario",
          },
        ],
        totalLabel: "Total Descuento Exterior GO (Casilla 128)",
        totalValue: c.casillas[128] ?? 0,
      };
    }

    case 130: {
      return {
        title: "Anticipo de Renta Liquidado el Año Anterior (Casilla 130)",
        description: "Anticipo liquidado en la declaración de renta del año gravable anterior para este período fiscal (Art. 807 E.T.):",
        items: [
          {
            label: "Anticipo liquidado en el Formulario 210 del año previo",
            value: formatCOP(d.extra.anticipoAnterior),
            source: "Declaración de renta del año anterior (Casilla 134)",
          },
        ],
        totalLabel: "Total Anticipo Anterior (Casilla 130)",
        totalValue: c.casillas[130] ?? 0,
      };
    }

    case 131: {
      return {
        title: "Saldo a Favor del Año Gravable Anterior (Casilla 131)",
        description: "Saldo a favor de la declaración del año previo arrastrado sin solicitud de devolución o compensación (Art. 815 E.T.):",
        items: [
          {
            label: "Saldo a favor del período gravable anterior",
            value: formatCOP(d.extra.saldoFavorAnterior),
            source: "Declaración de renta del año previo (Casilla 137)",
          },
        ],
        totalLabel: "Total Saldo a Favor Anterior (Casilla 131)",
        totalValue: c.casillas[131] ?? 0,
      };
    }

    case 132: {
      return {
        title: "Desglose de Retenciones en la Fuente Practicadas (Casilla 132)",
        description: "Retenciones en la fuente a título de renta practicadas durante el año gravable que se descuentan directamente del impuesto a cargo:",
        items: [
          {
            label: "Retenciones laborales practicadas por empleadores",
            value: formatCOP(d.extra.retenciones),
            source: "Formato 220 casilla 60 / Certificados tributarios bancarios / Formato 1003",
          },
        ],
        totalLabel: "Total Retenciones en la Fuente (Casilla 132)",
        totalValue: c.casillas[132] ?? 0,
      };
    }

    case 133: {
      return {
        title: "Anticipo de Renta para el Año Siguiente (Casilla 133)",
        description: "Anticipo obligatorio del impuesto de renta del período fiscal siguiente calculado según el Art. 807 del Estatuto Tributario:",
        items: [
          {
            label: "Porcentaje legal de anticipo aplicable",
            value: "25% (1er año) / 50% (2do año) / 75% (3er año en adelante)",
            legal: "Art. 807 del Estatuto Tributario",
          },
          {
            label: "Anticipo calculado para el año gravable siguiente",
            value: formatCOP(c.casillas[133] ?? 0),
            source: "Menor valor entre procedimiento 1 (Impuesto neto) y procedimiento 2 (Promedio dos últimos años)",
          },
        ],
        totalLabel: "Total Anticipo Año Siguiente (Casilla 133)",
        totalValue: c.casillas[133] ?? 0,
        footnote: "El anticipo pagado se resta automáticamente en la declaración de renta del año siguiente (Casilla 130).",
      };
    }

    case 135: {
      return {
        title: "Sanciones Tributarias Liquidadas (Casilla 135)",
        description: "Sanciones por extemporaneidad (Art. 641 E.T.) o corrección (Art. 644 E.T.) con sanción mínima legal:",
        items: [
          {
            label: "Sanciones liquidadas en la declaración",
            value: formatCOP(d.extra.sanciones),
            legal: `Sanción mínima legal: 10 UVT (${formatCOP(c.uvtFiling * 10)}) según Art. 639 E.T.`,
          },
        ],
        totalLabel: "Total Sanciones (Casilla 135)",
        totalValue: c.casillas[135] ?? 0,
      };
    }

    case 138: {
      return {
        title: "Número de Dependientes Económicos (Casilla 138)",
        description: "Criterios del Art. 387 del Estatuto Tributario para acreditar dependientes económicos:",
        items: [
          {
            label: "Dependientes económicos registrados a cargo (hasta 4)",
            value: `${d.trabajo.dependientes} dependiente(s)`,
            source: "Hijos menores de 18 años, hijos entre 18 y 23 estudiando, cónyuge o padres dependientes",
          },
        ],
        totalLabel: "Total Dependientes (Casilla 138)",
        totalValue: d.trabajo.dependientes,
      };
    }

    case 139: {
      const dep = d.trabajo.dependientes;
      return {
        title: "Deducción Adicional por Dependientes Económicos (Casilla 139)",
        description: "Art. 336 numeral 2 del Estatuto Tributario (Ley 2277 de 2022): deducción adicional de 72 UVT anuales por cada dependiente económico (hasta 4), que se resta directamente sin estar sujeta al límite del 40 %.",
        items: [
          {
            label: "Número de dependientes económicos a cargo",
            value: `${dep} dependiente(s)`,
          },
          {
            label: "Deducción legal por cada dependiente (72 UVT)",
            value: formatCOP(uvt * 72),
            legal: `72 UVT × $${formatNumber(uvt)}`,
          },
        ],
        totalLabel: "Total Adición Dependientes (Casilla 139)",
        totalValue: dep * uvt * 72,
        footnote: "Esta deducción se suma a las rentas exentas en la Casilla 92 y reduce directamente tu base gravable final.",
      };
    }

    case 140: {
      return {
        title: "Control Indicativo de Costos y Gastos > 60% (Casilla 140)",
        description: "Art. 336-1 del Estatuto Tributario: marca informativa si los costos y deducciones procedentes en honorarios o actividades comerciales superan el 60% de los ingresos brutos.",
        items: [
          {
            label: "¿Superó el 60% de costos sobre ingresos brutos?",
            value: c.casillas[140] ? "SÍ (Marcado con X)" : "NO",
            legal: "Art. 336-1 E.T. / Facturación electrónica obligatoria",
          },
        ],
      };
    }

    case 141: {
      return {
        title: "Aporte Voluntario a Programas Sociales (Casilla 141)",
        description: "Aporte voluntario no reembolsable del Art. 244-1 del Estatuto Tributario destinado a programas de paz y erradicación de la pobreza extrema:",
        items: [
          {
            label: "Aporte voluntario declarado",
            value: formatCOP(d.extra.aporteVoluntario),
          },
        ],
        totalLabel: "Total Aporte Voluntario (Casilla 141)",
        totalValue: c.casillas[141] ?? 0,
      };
    }

    default:
      return null;
  }
}
