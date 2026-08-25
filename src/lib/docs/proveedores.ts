import type { VaultDoc, DocKind } from "./types.ts";
import type { ComputedDeclaration, Declaration } from "@/lib/tax/types.ts";

export type ProviderId =
  | "empleador"
  | "pagadorHonorarios"
  | "banco"
  | "fondoCesantias"
  | "afp"
  | "afc"
  | "catastro"
  | "notaria"
  | "sociedad"
  | "arrendatario"
  | "proveedorFE"
  | "icetex"
  | "prepagada"
  | "esal"
  | "fondoPension"
  | "aseguradora"
  | "dian";

export type ProviderDoc = {
  kind: DocKind;
  what: string;
  why: string;
  article: string;
};

export type ProviderAsk = {
  id: ProviderId;
  provider: string;
  role: string;
  needed: boolean;
  reason: string;
  documents: ProviderDoc[];
  howToAsk: string;
  have: DocKind[];
  missing: DocKind[];
};

function has(docs: VaultDoc[], kind: DocKind) {
  return docs.some((d) => d.kind === kind);
}

export function providerAsks(d: Declaration, c: ComputedDeclaration, docs: VaultDoc[]): ProviderAsk[] {
  const t = d.trabajo;
  const h = d.honorarios;
  const k = d.capital;
  const nl = d.noLaborales;
  const p = d.patrimonio;
  const pen = d.pensiones;
  const div = d.dividendos;
  const go = d.gananciasOcasionales;
  const C = c.casillas;

  const all: Omit<ProviderAsk, "have" | "missing">[] = [
    {
      id: "empleador",
      provider: "Empleador / pagador de salarios",
      role: "Quien le pagó salarios, prestaciones o pensiones de jubilación patronal",
      needed: t.salarios > 0 || t.otrasPrestaciones > 0 || t.cesantiasPagadas > 0 || (C[32] ?? 0) > 0,
      reason: "Sin el Formato 220 no hay cómo cuadrar salarios, aportes ni la retención que le practicaron.",
      documents: [
        { kind: "formato220", what: "Formato 220 (certificado de ingresos y retenciones) AG 2025", why: "Ingresos laborales, aportes y retención.", article: "Arts. 378 y 381 E.T." },
        { kind: "pila", what: "Comprobante de PILA / seguridad social del año", why: "Cuadra pensión y salud obligatorias (INCRNGO arts. 55 y 56).", article: "Arts. 55, 56 y 108 E.T." },
      ],
      howToAsk: "Solicite el Formato 220 del año gravable, firmado, con NIT del agente y el desglose de salarios, cesantías, aportes y retención. Pídalo por escrito; el empleador está obligado a expedirlo (art. 378 E.T.).",
    },
    {
      id: "pagadorHonorarios",
      provider: "Pagador de honorarios / servicios",
      role: "Cliente o contratante que le pagó como independiente",
      needed: h.ingresos > 0 || t.honorariosSinCostos > 0,
      reason: "El certificado de retención y el valor pagado definen si va a casilla 32 (25 %) o 43 (con costos).",
      documents: [
        { kind: "certHonorarios", what: "Certificado de pagos por honorarios / servicios y retención", why: "Ingreso bruto y retención practicada.", article: "Arts. 103, 378 y 381 E.T." },
        { kind: "facturaElectronica", what: "Facturas electrónicas de venta que usted expidió", why: "Soporte de ingresos si es responsable de facturar.", article: "Art. 615 E.T." },
      ],
      howToAsk: "Pida a cada contratante el certificado de retención por rentas de trabajo (honorarios) del AG, con base, tarifa y valor retenido. Si facturó, conserve la factura electrónica con validación previa.",
    },
    {
      id: "banco",
      provider: "Banco / cooperativa / fiduciaria / comisionista",
      role: "Entidad vigilada donde tiene cuentas, CDT, tarjeta o hipoteca",
      needed:
        true,
      reason: "Aunque no tenga rendimientos, el certificado de GMF y los extractos cubren el tope de consignaciones (1.400 UVT) y el 50 % deducible.",
      documents: [
        { kind: "certGmf", what: "Certificado de GMF (4×1.000) del año", why: "El 50 % es deducible sin causalidad.", article: "Art. 115 E.T." },
        { kind: "extractoBanco", what: "Extractos de todo el año (todas las cuentas)", why: "Tope de consignaciones, depósitos e inversiones, art. 594-3.", article: "Art. 594-3 E.T." },
        { kind: "saldoCuentas", what: "Certificado de saldos a 31 de diciembre", why: "Patrimonio bruto de cuentas e inversiones.", article: "Art. 267 E.T." },
        { kind: "certRendimientos", what: "Certificado de rendimientos financieros e INCRNGO inflacionario", why: "Renta de capital y componente inflacionario (arts. 38-41).", article: "Arts. 38 a 41 E.T." },
        { kind: "interesesHipoteca", what: "Certificado de intereses de crédito hipotecario de vivienda", why: "Deducción hasta 1.200 UVT.", article: "Art. 119 E.T." },
      ],
      howToAsk: "En la sucursal o la app del banco pida: (1) certificado de GMF del año gravable, (2) certificado de retención y rendimientos, (3) saldos a 31 de diciembre, (4) si tiene vivienda, el certificado de intereses hipotecarios. Los extractos bájelos en PDF de los 12 meses.",
    },
    {
      id: "fondoCesantias",
      provider: "Fondo de cesantías (Colfondos, Porvenir, Protección, Skandia)",
      role: "Administradora del auxilio de cesantía",
      needed: t.cesantiasPagadas > 0 || t.cesantiasAcumuladas2016 > 0 || t.salarios > 0,
      reason: "La exención del num. 4 art. 206 depende del salario promedio de 6 meses y del saldo a 2016.",
      documents: [
        { kind: "certCesantias", what: "Certificado de consignaciones, retiros y saldo, con corte a 31/12/2016 si hay retiro de saldo antiguo", why: "Tabla de exención de cesantías.", article: "Num. 4 art. 206 E.T." },
      ],
      howToAsk: "En el portal del fondo descargue el certificado tributario del año y, si retiró cesantías antiguas, el saldo a 31 de diciembre de 2016.",
    },
    {
      id: "afp",
      provider: "AFP / fondo de pensiones voluntarias",
      role: "Administradora de pensión obligatoria o voluntaria (RAIS, FVP)",
      needed: t.aportesVoluntariosRais > 0 || t.aportesAfcFvpAvc > 0 || t.aportesPensionObligatorios > 0 || h.aportesRais > 0,
      reason: "RAIS 25 % / 2.500 UVT y FVP 30 % / 3.800 UVT se prueban con el certificado del fondo. El retiro antes de 10 años hace perder el beneficio.",
      documents: [
        { kind: "certPensionVoluntaria", what: "Certificado de aportes obligatorios, voluntarios RAIS y FVP, y de retiros", why: "INCRNGO art. 55 y renta exenta arts. 126-1.", article: "Arts. 55 y 126-1 E.T." },
      ],
      howToAsk: "Pida el certificado tributario del año con: cotización obligatoria, cotización voluntaria al RAIS, aportes a pensión voluntaria y fecha de cada retiro (para el requisito de 10 años).",
    },
    {
      id: "afc",
      provider: "Banco de la cuenta AFC / AVC",
      role: "Entidad donde está la Cuenta de Ahorro para el Fomento de la Construcción",
      needed: t.aportesAfcFvpAvc > 0 || h.aportesAfc > 0 || k.aportesAfc > 0 || nl.aportesAfc > 0,
      reason: "Sin certificado no se sostiene la renta exenta. El retiro para algo distinto de vivienda antes de 10 años se grava.",
      documents: [
        { kind: "certAfc", what: "Certificado de depósitos, retiros y destinación (vivienda)", why: "Tope 30 % y 3.800 UVT, permanencia 10 años.", article: "Art. 126-4 E.T." },
      ],
      howToAsk: "Solicite el certificado AFC/AVC del año gravable con saldos, consignaciones, retiros y si el retiro se destinó a vivienda.",
    },
    {
      id: "catastro",
      provider: "Catastro / IGAC / Secretaría de Hacienda local",
      role: "Quien fija el avalúo catastral y recauda el predial",
      needed: p.inmuebles > 0 || p.viviendaHabitacion > 0,
      reason: "El valor patrimonial del inmueble es el mayor entre costo fiscal, avalúo catastral y autoavalúo (arts. 72 y 277).",
      documents: [
        { kind: "avaluoCatastral", what: "Avalúo catastral vigente al 31 de diciembre", why: "Piso del valor patrimonial.", article: "Arts. 72 y 277 E.T." },
        { kind: "predial", what: "Recibo de impuesto predial pagado", why: "Soporte; el predial de la casa de habitación no siempre es deducible (falta causalidad con renta).", article: "Art. 115 E.T." },
      ],
      howToAsk: "Descargue el avalúo catastral del folio en el portal de catastro o IGAC. Guarde el predial pagado del año.",
    },
    {
      id: "notaria",
      provider: "Notaría / Oficina de Registro de Instrumentos Públicos",
      role: "Donde se escrituró o se registró el inmueble, vehículo o sociedad",
      needed: p.inmuebles > 0 || go.enajenacionActivos > 0 || go.ventaVivienda > 0 || nl.ventas > 0,
      reason: "El ingreso de inmuebles se realiza en la fecha de la escritura (art. 27-2). El certificado de tradición prueba dominio y deudas con fecha cierta.",
      documents: [
        { kind: "escritura", what: "Escritura pública (compra, venta, donación, hipoteca)", why: "Momento de realización y costo fiscal.", article: "Num. 2 art. 27 E.T." },
        { kind: "certTradicion", what: "Certificado de tradición y libertad (folio completo)", why: "Dominio, gravámenes, hipoteca.", article: "Arts. 267 y 283 E.T." },
        { kind: "compraventa", what: "Promesa / compraventa y comprobante de pago del precio", why: "Si poseyó ≥ 2 años es GO; si menos, no laboral.", article: "Arts. 300 y 311 E.T." },
      ],
      howToAsk: "En la notaría pida copia de la escritura. En la Oficina de Registro, el certificado de tradición del folio (vigencia reciente, idealmente enero del año de presentación).",
    },
    {
      id: "sociedad",
      provider: "Sociedad que le pagó dividendos o participaciones",
      role: "S.A., S.A.S., limitada o fondo que distribuyó utilidades",
      needed: div.subcedula1 > 0 || div.subcedula2 > 0 || div.div2016 > 0 || div.exterior > 0,
      reason: "Sin el certificado no se sabe si son num. 3 o par. 2 del art. 49, ni el año de origen (2016 vs. 2017+).",
      documents: [
        { kind: "certDividendos", what: "Certificado de dividendos y participaciones (desglose art. 49)", why: "Subcédula 1 (tabla 241) vs. subcédula 2 (tarifa 240).", article: "Arts. 48, 49 y 242 E.T." },
      ],
      howToAsk: "Pida a la sociedad el certificado del art. 49: utilidad máxima distribuible como INCRNGO (num. 3), utilidad gravada (par. 2), año de origen y retención practicada.",
    },
    {
      id: "arrendatario",
      provider: "Arrendatario / inmobiliaria",
      role: "Quien le paga el canon de arrendamiento",
      needed: k.arrendamientos > 0,
      reason: "El canon es renta de capital. Si le retuvieron, necesita el certificado para la casilla 132.",
      documents: [
        { kind: "arrendamiento", what: "Contrato y certificado de cánones pagados y retención", why: "Ingreso de capital y retención.", article: "Art. 335 E.T. · art. 383 y ss. si hay retención" },
      ],
      howToAsk: "Solicite al arrendatario o a la inmobiliaria una certificación de los cánones del año y de la retención en la fuente practicada, si aplica.",
    },
    {
      id: "proveedorFE",
      provider: "Proveedor (factura electrónica de compra)",
      role: "Quien le vendió bienes o servicios que quiere tomar en el 1 % o como costo",
      needed: t.comprasFacturaElectronica > 0 || h.costos > 0 || k.costos > 0 || nl.costos > 0,
      reason: "El 1 % (num. 5 art. 336) y los costos (107 y 771-2) se caen si la factura no cumple requisitos o si ya se tomó como IVA descontable.",
      documents: [
        { kind: "facturaElectronica", what: "Factura electrónica con validación previa, a su nombre y NIT, pagada con medio electrónico", why: "Deducción 1 % (240 UVT, fuera del 40 %) o costo procedente.", article: "Num. 5 art. 336 · arts. 107 y 771-2 E.T." },
      ],
      howToAsk: "A cada proveedor pida: (1) factura electrónica de venta con CUFE y validación DIAN, (2) que figure su nombre y NIT, (3) constancia de pago con tarjeta o transferencia de entidad vigilada, (4) confirmación de que usted no la usó como IVA descontable ni como otro beneficio. Si es costo de honorarios, también sirve nómina electrónica o documento equivalente.",
    },
    {
      id: "icetex",
      provider: "ICETEX",
      role: "Crédito educativo de educación superior",
      needed: t.icetex > 0 || h.icetex > 0 || k.icetex > 0 || nl.icetex > 0,
      reason: "La deducción de intereses es de 100 UVT al año y solo de créditos ICETEX de educación superior del contribuyente.",
      documents: [
        { kind: "icetex", what: "Certificado de intereses pagados en el año", why: "Tope 100 UVT, art. 119.", article: "Art. 119 E.T." },
      ],
      howToAsk: "En el portal ICETEX descargue el certificado de intereses pagados del año gravable a nombre del deudor (usted).",
    },
    {
      id: "prepagada",
      provider: "Medicina prepagada / aseguradora de salud",
      role: "Entidad vigilada que le cobra el plan de salud",
      needed: t.medicinaPrepagada > 0 || h.medicinaPrepagada > 0,
      reason: "Solo procede si el contrato es con entidad vigilada y no supera 16 UVT mensuales. Un mismo dependiente no duplica el beneficio.",
      documents: [
        { kind: "medicinaPrepagada", what: "Certificado de primas pagadas en el año, con NIT de la entidad", why: "Deducción art. 387, 16 UVT/mes.", article: "Art. 387 E.T." },
      ],
      howToAsk: "Pida el certificado tributario de primas de medicina prepagada o seguro de salud del año, a su nombre, expedido por la entidad vigilada.",
    },
    {
      id: "esal",
      provider: "ESAL / entidad donataria",
      role: "Fundación, iglesia o régimen especial a la que donó",
      needed: d.descuentos.donaciones > 0,
      reason: "El descuento del 25 % (art. 257) exige certificado de la donataria del régimen especial. Sin él, el descuento no procede.",
      documents: [
        { kind: "donaciones", what: "Certificado de donación (art. 125 / 257) con NIT y calificación de la ESAL", why: "Descuento 25 %, tope conjunto 30 % del impuesto.", article: "Arts. 125, 256 y 257 E.T." },
      ],
      howToAsk: "Solicite el certificado de donación del año, con valor, fecha, NIT y la calidad de régimen especial o no contribuyente (arts. 22 y 23).",
    },
    {
      id: "fondoPension",
      provider: "Colpensiones / fondo de pensión de vejez",
      role: "Quien le paga la mesada pensional",
      needed: pen.ingresos > 0,
      reason: "La exención es 1.000 UVT mensuales después de salud y FSP. El comprobante debe distinguir mesada, salud y solidaridad.",
      documents: [
        { kind: "pensionJubilacion", what: "Comprobante de pensión del año (mesadas, salud, FSP)", why: "Casillas 99 a 103.", article: "Num. 5 art. 206 E.T." },
      ],
      howToAsk: "En el fondo pida el certificado de ingresos de pensión del año gravable, con descuentos de salud y fondo de solidaridad.",
    },
    {
      id: "aseguradora",
      provider: "Aseguradora",
      role: "Compañía que pagó indemnización de vida o de daño",
      needed: go.seguroVida > 0 || nl.indemnizacionesSeguroDano > 0,
      reason: "Vida: GO no gravada hasta 3.250 UVT (303-1). Daño: INCRNGO del daño emergente (art. 45), en no laborales.",
      documents: [
        { kind: "seguroVida", what: "Certificado de indemnización (vida o daño), con valor y concepto", why: "Clasificar GO vs. INCRNGO.", article: "Arts. 45 y 303-1 E.T." },
      ],
      howToAsk: "Pida la liquidación de la indemnización: valor pagado, si es daño emergente o lucro cesante, y si es seguro de vida.",
    },
    {
      id: "dian",
      provider: "DIAN (usted mismo, del año anterior)",
      role: "Su declaración anterior y el RUT",
      needed: true,
      reason: "El RUT fija seccional, CIIU y responsabilidades. El 210 anterior da anticipo, saldo a favor, impuesto neto (689-3) y patrimonio líquido inicial.",
      documents: [
        { kind: "rut", what: "RUT vigente (hoja principal)", why: "NIT, DV, seccional, CIIU, IVA.", article: "DUR 1625 de 2016" },
        { kind: "form210Anterior", what: "Formulario 210 del año anterior (presentado)", why: "Casillas 130, 131, 126 anterior, patrimonio líquido.", article: "Instructivo 210 · art. 689-3 E.T." },
      ],
      howToAsk: "En el portal DIAN: descargue el RUT y la declaración de renta del año anterior (copia de la presentada). No pida cita para esto.",
    },
  ];

  return all.map((row) => {
    const have = row.documents.map((x) => x.kind).filter((k) => has(docs, k));
    const missing = row.documents.map((x) => x.kind).filter((k) => !has(docs, k));
    return { ...row, have, missing };
  });
}

export function cartaProveedor(ask: ProviderAsk, d: Declaration) {
  const nombre = [d.identity.primerNombre, d.identity.otrosNombres, d.identity.primerApellido, d.identity.segundoApellido]
    .filter(Boolean)
    .join(" ") || "[nombre completo]";
  const nit = d.identity.nit ? `${d.identity.nit}${d.identity.dv ? `-${d.identity.dv}` : ""}` : "[NIT]";
  const lista = ask.documents.map((x, i) => `${i + 1}. ${x.what} — ${x.article}.`).join("\n");
  return `Solicitud de soportes tributarios · año gravable ${d.year}

Señores
${ask.provider}

Yo, ${nombre}, identificado(a) con NIT ${nit}, solicito se me expidan los siguientes documentos del año gravable ${d.year}, a más tardar en los plazos legales de certificación:

${lista}

${ask.howToAsk}

Estos soportes son necesarios para la declaración de renta (Formulario 210) conforme al Estatuto Tributario. Quedo atento(a) al envío en PDF al correo registrado.

Cordialmente,
${nombre}
NIT ${nit}`;
}
