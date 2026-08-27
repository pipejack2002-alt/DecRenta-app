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

    case 36: {
      const t = d.trabajo;
      const cesantiasExentas = t.promedioMensual6m <= (uvt * 350) ? t.cesantiasPagadas : 0;
      const baseRenta25 = Math.max(0, (c.casillas[34] ?? 0) - cesantiasExentas);
      const renta25 = Math.min(baseRenta25 * 0.25, uvt * 790);

      const items: ItemBreakdown[] = [
        {
          label: "Cesantías e intereses de cesantías 100% exentas",
          value: formatCOP(cesantiasExentas),
          legal: `Art. 206 Num. 4 E.T. (Salario promedio mensual $${formatNumber(t.promedioMensual6m)} ≤ 350 UVT $${formatNumber(uvt * 350)})`,
          source: "100% exentas por estar en el rango de ingresos de la tabla legal",
        },
        {
          label: "Renta exenta laboral del 25% automática",
          value: formatCOP(renta25),
          legal: `Art. 206 Num. 10 E.T. (25% sobre renta líquida previa, tope máx. 790 UVT = $${formatNumber(uvt * 790)})`,
          source: "Cálculo automático sobre base depurada de salarios y prestaciones",
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
        description: "Beneficios tributarios de exención legal aplicables a los ingresos laborales del contribuyente:",
        items,
        totalLabel: "Total Otras Rentas Exentas (Casilla 36)",
        totalValue: c.casillas[36] ?? 0,
        footnote: "Tus cesantías e intereses ($1.691.125) están 100% exentos porque tu ingreso promedio mensual es inferior a 350 UVT. Además, la ley te otorga el 25% de exención laboral sobre tus demás ingresos netos.",
      };
    }

    case 58: {
      const k = d.capital;
      const items: ItemBreakdown[] = [];
      if (k.intereses > 0) {
        items.push({
          label: "Intereses y rendimientos financieros (Cuentas, CDT, FVP, Cesantías)",
          value: formatCOP(k.intereses),
          source: "Certificados tributarios bancarios (ej. Nu $234.098 + Colfondos $63.673) / Formato 1007 / Formato 5063",
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
        description: "Rendimientos financieros, intereses bancarios y rentabilidad de fondos generados durante el año gravable (Art. 335 E.T.):",
        items,
        totalLabel: "Total Ingresos Brutos de Capital (Casilla 58)",
        totalValue: c.casillas[58] ?? 0,
        footnote: "Los rendimientos del fondo de cesantías ($63.673) son la ganancia financiera que produjo el dinero guardado y se declaran en capital, mientras que el capital de cesantías va en la cédula de trabajo.",
      };
    }

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

    default:
      return null;
  }
}
