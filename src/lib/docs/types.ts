export type DocKind =
  | "formato220"
  | "certHonorarios"
  | "certRetencion"
  | "certCesantias"
  | "certAfc"
  | "certPensionVoluntaria"
  | "certGmf"
  | "extractoBanco"
  | "saldoCuentas"
  | "certDeudas"
  | "avaluoCatastral"
  | "certTradicion"
  | "predial"
  | "interesesHipoteca"
  | "medicinaPrepagada"
  | "pila"
  | "certDividendos"
  | "certRendimientos"
  | "arrendamiento"
  | "facturaElectronica"
  | "form210Anterior"
  | "exogenaDian"
  | "certDependientes"
  | "rut"
  | "icetex"
  | "donaciones"
  | "impuestoExterior"
  | "compraventa"
  | "escritura"
  | "seguroVida"
  | "pensionJubilacion"
  | "resolucion"
  | "decreto"
  | "conceptoDian"
  | "oficio"
  | "ley"
  | "otro";

export type VaultDoc = {
  id: string;
  kind: DocKind;
  name: string;
  mime: string;
  size: number;
  addedAt: string;
  notes: string;
  extracted?: Record<string, number | string>;
  applied?: boolean;
  dataUrl?: string;
};

export const DOC_CATALOG: {
  kind: DocKind;
  label: string;
  help: string;
  maps: { path: string; label: string }[];
  source: string;
}[] = [
  {
    kind: "formato220",
    label: "Formato 220 — Certificado de ingresos y retenciones",
    help: "Lo expide el empleador. Alimenta salarios, aportes, retenciones y cesantías de rentas de trabajo.",
    maps: [
      { path: "trabajo.salarios", label: "Pagos por salarios" },
      { path: "trabajo.cesantiasPagadas", label: "Cesantías e intereses" },
      { path: "trabajo.otrasPrestaciones", label: "Otras prestaciones y primas" },
      { path: "trabajo.aportesPensionObligatorios", label: "Aportes obligatorios a pensión" },
      { path: "trabajo.aportesSaludObligatorios", label: "Aportes obligatorios a salud" },
      { path: "extra.retenciones", label: "Retención en la fuente" },
    ],
    source: "Art. 378 E.T. · Formato 220 DIAN",
  },
  {
    kind: "certHonorarios",
    label: "Certificado de honorarios / servicios",
    help: "Pagos a independientes. Decida si imputa costos (casilla 43) o la renta exenta del 25 % (casilla 32).",
    maps: [
      { path: "honorarios.ingresos", label: "Honorarios brutos" },
      { path: "extra.retenciones", label: "Retención practicada" },
    ],
    source: "Art. 103 y num. 10 art. 206 E.T.",
  },
  {
    kind: "certRetencion",
    label: "Certificado de retención en la fuente",
    help: "Retenciones a título de renta y ganancias ocasionales practicadas en el año.",
    maps: [{ path: "extra.retenciones", label: "Retenciones" }],
    source: "Art. 378 E.T.",
  },
  {
    kind: "certCesantias",
    label: "Certificado de cesantías (fondo)",
    help: "Saldo, consignaciones y retiros del fondo de cesantías (Colfondos, Porvenir, Protección, Skandia).",
    maps: [
      { path: "trabajo.cesantiasPagadas", label: "Cesantías consignadas o retiradas" },
      { path: "trabajo.cesantiasAcumuladas2016", label: "Saldo acumulado a 31/12/2016" },
    ],
    source: "Num. 4 art. 206 E.T.",
  },
  {
    kind: "certAfc",
    label: "Certificado AFC / AVC",
    help: "Depósitos en Cuentas de Ahorro para el Fomento de la Construcción o AVC.",
    maps: [{ path: "trabajo.aportesAfcFvpAvc", label: "Aportes AFC / AVC" }],
    source: "Art. 126-4 E.T. · Ley 1114 de 2006",
  },
  {
    kind: "certPensionVoluntaria",
    label: "Certificado de pensiones voluntarias / FVP",
    help: "Aportes a fondos de pensiones voluntarias y seguros privados de pensiones.",
    maps: [{ path: "trabajo.aportesAfcFvpAvc", label: "Aportes FVP" }],
    source: "Art. 126-1 E.T.",
  },
  {
    kind: "certGmf",
    label: "Certificado de GMF (4×1.000)",
    help: "El banco certifica el gravamen a los movimientos financieros. Es deducible el 50 %.",
    maps: [{ path: "trabajo.gmf", label: "GMF pagado" }],
    source: "Art. 115 E.T.",
  },
  {
    kind: "extractoBanco",
    label: "Extractos bancarios",
    help: "Sirven para el tope de consignaciones (art. 594-3) y para cuadrar efectivo y cuentas.",
    maps: [
      { path: "topes.consignaciones", label: "Consignaciones del año" },
      { path: "patrimonio.cuentas", label: "Saldo a 31 de diciembre" },
    ],
    source: "Art. 594-3 E.T.",
  },
  {
    kind: "saldoCuentas",
    label: "Certificado de saldos (banco / fiduciaria)",
    help: "Saldo patrimonial de cuentas de ahorro, corrientes, CDT e inversiones.",
    maps: [
      { path: "patrimonio.cuentas", label: "Cuentas" },
      { path: "patrimonio.inversiones", label: "Inversiones" },
    ],
    source: "Art. 267 E.T.",
  },
  {
    kind: "certDeudas",
    label: "Certificado de deudas / obligaciones financieras",
    help: "Saldos a 31/12 de créditos de consumo, libranzas, tarjetas de crédito, créditos hipotecarios y leasing.",
    maps: [{ path: "patrimonio.obligacionesFinancieras", label: "Deudas y créditos financieros" }],
    source: "Art. 283 E.T. · Casilla 30 Formulario 210",
  },
  {
    kind: "avaluoCatastral",
    label: "Avalúo catastral",
    help: "Valor patrimonial mínimo de inmuebles (el mayor entre avalúo, costo fiscal y autoavalúo).",
    maps: [{ path: "patrimonio.inmuebles", label: "Inmuebles" }],
    source: "Art. 72 y 277 E.T.",
  },
  {
    kind: "certTradicion",
    label: "Certificado de tradición y libertad",
    help: "Acredita dominio, gravámenes e hipoteca de inmuebles.",
    maps: [{ path: "patrimonio.inmuebles", label: "Inmuebles" }],
    source: "Art. 267 E.T.",
  },
  {
    kind: "predial",
    label: "Impuesto predial",
    help: "Soporte de impuestos territoriales. Desde AG 2023 es deducible el 100 % si tiene relación de causalidad (no el de renta).",
    maps: [],
    source: "Art. 115 E.T. (Ley 2277 de 2022)",
  },
  {
    kind: "interesesHipoteca",
    label: "Certificado de intereses de vivienda",
    help: "Intereses y/o corrección monetaria de crédito hipotecario de vivienda. Tope 1.200 UVT.",
    maps: [{ path: "trabajo.interesesVivienda", label: "Intereses de vivienda" }],
    source: "Art. 119 E.T.",
  },
  {
    kind: "medicinaPrepagada",
    label: "Medicina prepagada / seguro de salud",
    help: "Contratos con entidades vigiladas. Tope 16 UVT mensuales.",
    maps: [{ path: "trabajo.medicinaPrepagada", label: "Pagos por salud" }],
    source: "Art. 387 E.T.",
  },
  {
    kind: "pila",
    label: "Planilla PILA / seguridad social",
    help: "Aportes a salud, pensión y riesgos. Independientes deben estar al día para deducir costos.",
    maps: [
      { path: "trabajo.aportesPensionObligatorios", label: "Pensión" },
      { path: "trabajo.aportesSaludObligatorios", label: "Salud" },
    ],
    source: "Art. 108 E.T. · Ley 100 de 1993",
  },
  {
    kind: "certDividendos",
    label: "Certificado de dividendos y participaciones",
    help: "La sociedad certifica si los dividendos son del num. 3 o del par. 2 del art. 49 E.T.",
    maps: [
      { path: "dividendos.subcedula1", label: "Subcédula 1 (num. 3 art. 49)" },
      { path: "dividendos.subcedula2", label: "Subcédula 2 (par. 2 art. 49)" },
      { path: "dividendos.div2016", label: "Utilidades 2016 y anteriores" },
    ],
    source: "Arts. 48, 49 y 242 E.T.",
  },
  {
    kind: "certRendimientos",
    label: "Certificado de rendimientos financieros",
    help: "Intereses, CDT, fondos. Incluye el componente inflacionario (arts. 38 y 41 E.T.).",
    maps: [
      { path: "capital.intereses", label: "Rendimientos" },
      { path: "capital.componenteInflacionario", label: "Componente inflacionario" },
    ],
    source: "Arts. 38, 39 y 41 E.T.",
  },
  {
    kind: "arrendamiento",
    label: "Contrato / certificado de arrendamiento",
    help: "Canon de inmuebles o muebles. Es renta de capital.",
    maps: [{ path: "capital.arrendamientos", label: "Arrendamientos" }],
    source: "Art. 335 E.T.",
  },
  {
    kind: "facturaElectronica",
    label: "Facturas electrónicas (deducción 1 %)",
    help: "Compras pagadas con medio electrónico, no tomadas como costo. Tope 240 UVT.",
    maps: [{ path: "trabajo.comprasFacturaElectronica", label: "Total compras que cumplen requisitos" }],
    source: "Num. 5 art. 336 E.T.",
  },
  {
    kind: "form210Anterior",
    label: "Declaración de renta del año anterior",
    help: "Anticipo, saldo a favor, impuesto neto (beneficio de auditoría) y patrimonio líquido inicial.",
    maps: [
      { path: "extra.anticipoAnterior", label: "Anticipo liquidado" },
      { path: "extra.saldoFavorAnterior", label: "Saldo a favor sin devolución" },
      { path: "extra.impuestoNetoAnterior", label: "Impuesto neto anterior" },
      { path: "patrimonio.patrimonioLiquidoAnterior", label: "Patrimonio líquido anterior" },
    ],
    source: "Instructivo Formulario 210, casillas 130 y 131",
  },
  {
    kind: "exogenaDian",
    label: "Información Exógena DIAN (Reporte de Terceros)",
    help: "Reporte anual descargado del portal DIAN con cuentas, salarios, retenciones y compras reportadas.",
    maps: [
      { path: "trabajo.salarios", label: "Salarios reportados" },
      { path: "extra.retenciones", label: "Retenciones reportadas" },
      { path: "patrimonio.cuentas", label: "Cuentas bancarias reportadas" },
    ],
    source: "Resolución DIAN · Consulta de Información Reportada por Terceros",
  },
  {
    kind: "certDependientes",
    label: "Certificado / soporte de dependientes económicos",
    help: "Certificados de estudio o declaración juramentada para deducir hasta 72 UVT por dependiente (art. 336 / 387 E.T.).",
    maps: [{ path: "deducciones.dependientes", label: "Dependientes económicos" }],
    source: "Art. 387 y num. 2 art. 336 E.T. (Ley 2277 de 2022)",
  },
  {
    kind: "rut",
    label: "RUT (Registro Único Tributario)",
    help: "NIT, DV, actividad CIIU, dirección seccional y responsabilidades tributarias.",
    maps: [],
    source: "Decreto 1625 de 2016 · RUT DIAN",
  },
  {
    kind: "icetex",
    label: "Certificado de intereses ICETEX",
    help: "Intereses de crédito educativo. Tope 100 UVT.",
    maps: [{ path: "trabajo.icetex", label: "Intereses ICETEX" }],
    source: "Inciso 3 art. 119 E.T.",
  },
  {
    kind: "donaciones",
    label: "Certificado de donación",
    help: "ESAL régimen especial: descuento del 25 % (art. 257). Tope conjunto 30 % del impuesto.",
    maps: [{ path: "descuentos.donaciones", label: "Donaciones (base del descuento)" }],
    source: "Arts. 256 y 257 E.T.",
  },
  {
    kind: "impuestoExterior",
    label: "Impuestos pagados en el exterior",
    help: "Descuento tributario por tax credit, limitado al impuesto colombiano sobre esas mismas rentas.",
    maps: [{ path: "descuentos.impuestosExterior", label: "Impuesto pagado en el exterior" }],
    source: "Art. 254 E.T.",
  },
  {
    kind: "compraventa",
    label: "Compraventa de activos fijos",
    help: "Si el activo se poseyó ≥ 2 años es ganancia ocasional; si menos, renta no laboral.",
    maps: [
      { path: "gananciasOcasionales.enajenacionActivos", label: "Ingreso (poseído ≥ 2 años)" },
      { path: "gananciasOcasionales.costos", label: "Costo fiscal" },
    ],
    source: "Arts. 300 y 311 E.T.",
  },
  {
    kind: "escritura",
    label: "Escritura pública de inmueble",
    help: "El ingreso se realiza en la fecha de la escritura (num. 2 art. 27 E.T.).",
    maps: [{ path: "gananciasOcasionales.enajenacionActivos", label: "Precio de venta" }],
    source: "Num. 2 art. 27 E.T.",
  },
  {
    kind: "seguroVida",
    label: "Indemnización de seguro de vida",
    help: "No gravada hasta 3.250 UVT; el exceso es ganancia ocasional (art. 303-1 E.T.).",
    maps: [{ path: "gananciasOcasionales.seguroVida", label: "Indemnización" }],
    source: "Art. 303-1 E.T.",
  },
  {
    kind: "pensionJubilacion",
    label: "Comprobante de pensión",
    help: "Exenta hasta 1.000 UVT mensuales (num. 5 art. 206 E.T.).",
    maps: [
      { path: "pensiones.ingresos", label: "Mesadas del año" },
      { path: "pensiones.incrngo", label: "Aportes a salud / solidaridad" },
    ],
    source: "Num. 5 art. 206 E.T.",
  },
  {
    kind: "resolucion",
    label: "Resolución DIAN / UVT / formulario",
    help: "Súbala para que el asistente y la auditoría la tengan en cuenta (p. ej. UVT, prescripción del 210, calendario).",
    maps: [],
    source: "DIAN · art. 868 E.T.",
  },
  {
    kind: "decreto",
    label: "Decreto (Hacienda / Presidencia)",
    help: "Decretos reglamentarios o de plazos (p. ej. Decreto 1226 de 2026, DUR 1625).",
    maps: [],
    source: "Presidencia / MinHacienda",
  },
  {
    kind: "conceptoDian",
    label: "Concepto o oficio DIAN",
    help: "Doctrina de la DIAN. No es ley, pero orienta la aplicación del E.T.",
    maps: [],
    source: "Normograma DIAN",
  },
  {
    kind: "oficio",
    label: "Oficio / circular",
    help: "Oficios de la DIAN o de la UAE. Péguelos para anclar el expediente.",
    maps: [],
    source: "DIAN",
  },
  {
    kind: "ley",
    label: "Ley (reforma, 1819, 2010, 2277, 1715…)",
    help: "Texto de una ley que modifica el Estatuto. El asistente la usará junto al E.T.",
    maps: [],
    source: "Secretaría del Senado",
  },
  {
    kind: "otro",
    label: "Otro soporte",
    help: "Cualquier documento idóneo (art. 771-2 E.T.). Anote a qué casilla corresponde.",
    maps: [],
    source: "Art. 771-2 E.T.",
  },
];

export function docMeta(kind: DocKind) {
  return DOC_CATALOG.find((d) => d.kind === kind) ?? DOC_CATALOG[DOC_CATALOG.length - 1];
}

export const NORMA_KINDS: DocKind[] = ["resolucion", "decreto", "conceptoDian", "oficio", "ley"];

export function isNormaKind(kind: DocKind) {
  return NORMA_KINDS.includes(kind);
}

export type IngestedNorm = {
  id: string;
  title: string;
  citation: string;
  text: string;
  addedAt: string;
  fileName?: string;
  kind: DocKind;
};

export const MAX_NORMA_CHARS = 20_000;
export const MAX_NORMAS = 20;

export function normasCorpus(normas: IngestedNorm[]): string {
  return normas
    .map((n) => `[${n.citation || n.title}]\n${n.text.slice(0, MAX_NORMA_CHARS)}`)
    .join("\n\n")
    .slice(0, 24_000);
}
