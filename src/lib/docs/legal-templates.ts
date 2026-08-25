/**
 * Generador de Plantillas y Cartas Legales Tributarias
 * Certificados oficiales colombianos para la Declaración de Renta
 */

import type { Declaration } from "../tax/types";

export interface LegalTemplate {
  id: string;
  title: string;
  category: "dependientes" | "independientes" | "bancos" | "retenciones";
  articleEt: string;
  description: string;
  generateText: (d: Declaration) => string;
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: "dependientes-art387",
    title: "Certificado de Dependientes Económicos (Art. 387 y 336 E.T.)",
    category: "dependientes",
    articleEt: "Arts. 387 y 336 E.T. (Ley 2277 de 2022)",
    description:
      "Manifestación bajo gravedad de juramento de personas a cargo para imputar la deducción del 10 % o las 72 UVT por dependiente.",
    generateText: (d) => {
      const nombre = [d.identity.primerNombre, d.identity.otrosNombres, d.identity.primerApellido, d.identity.segundoApellido]
        .filter(Boolean)
        .join(" ") || "___________________________";
      const nit = d.identity.nit || "________________";
      const depsCount = d.trabajo.dependientes || 1;

      return `CERTIFICADO Y MANIFESTACIÓN BAJO GRAVEDAD DE JURAMENTO
DEDUCCIÓN POR DEPENDIENTES ECONÓMICOS (ARTS. 387 Y 336 DEL E.T.)

Ciudad: ________________________, Fecha: ${new Date().toLocaleDateString("es-CO")}

Yo, ${nombre}, identificado(a) con Cédula de Ciudadanía / NIT No. ${nit}, en cumplimiento de lo establecido en el artículo 387 del Estatuto Tributario y el artículo 336 del mismo estatuto (modificado por la Ley 2277 de 2022), manifiesto bajo la gravedad del juramento que:

1. Tengo a mi cargo económico a (${depsCount}) dependiente(s) durante el año gravable ${d.year}.
2. Los dependientes cumplen con los requisitos legales estipulados en el parágrafo 2 del artículo 387 del Estatuto Tributario (hijos menores de 18 años, hijos entre 18 y 23 años que estudian, cónyuge o padres en situación de dependencia económica demostrable).
3. Dichos dependientes no reciben ingresos propios suficientes ni han sido imputados simultáneamente por otro contribuyente para las mismas deducciones.
4. La presente manifestación se rige por el principio de veracidad y servirá de soporte probatorio formal para la deducción en mi Declaración de Renta y Complementarios del Formulario 210.

Se firma para los fines pertinentes ante la Dirección de Impuestos y Aduanas Nacionales (DIAN) y/o mi agente retenedor.


________________________________________
Firma del Contribuyente
Nombre: ${nombre}
C.C. / NIT: ${nit}`;
    },
  },
  {
    id: "no-trabajadores-independiente",
    title: "Manifestación de No Vinculación de Trabajadores (Costos vs. 25 % Exento)",
    category: "independientes",
    articleEt: "Arts. 103, 107 y 206 Num. 10 E.T.",
    description:
      "Manifestación para profesionales independientes y prestadores de servicios sobre la contratación o no de 2 o más trabajadores asociados a la actividad.",
    generateText: (d) => {
      const nombre = [d.identity.primerNombre, d.identity.otrosNombres, d.identity.primerApellido, d.identity.segundoApellido]
        .filter(Boolean)
        .join(" ") || "___________________________";
      const nit = d.identity.nit || "________________";

      return `MANIFESTACIÓN DE NO CONTRATACIÓN DE TRABAJADORES O EMPLEADOS
(RÉGIMEN DE RENTAS DE TRABAJO NO LABORALES / HONORARIOS - ART. 103 Y 206 E.T.)

Ciudad: ________________________, Fecha: ${new Date().toLocaleDateString("es-CO")}

Señores:
DIRECCIÓN DE IMPUESTOS Y ADUANAS NACIONALES (DIAN) / AGENTES DE RETENCIÓN

Yo, ${nombre}, identificado(a) con Cédula de Ciudadanía / NIT No. ${nit}, para efectos de la determinación del impuesto sobre la renta y la procedencia de costos y deducciones o la renta exenta del 25 % consagrada en el numeral 10 del artículo 206 del Estatuto Tributario, manifiesto bajo la gravedad del juramento que:

1. Durante el año gravable ${d.year}, desarrollé mis actividades económicas de forma personal o independiente sin haber vinculado o contratado dos (2) o más trabajadores o contratistas asociados directamente a mi actividad por un término continuo o discontinuo igual o superior a noventa (90) días.
2. En consecuencia, mis ingresos por concepto de honorarios, comisiones y servicios se encuentran sujetos al tratamiento fiscal de la Cédula General del Formulario 210.
3. Certifico que los soportes y facturas electrónicas de los costos y gastos imputados cumplen con los requisitos del artículo 107 y 771-2 del Estatuto Tributario.

En constancia se firma a los ${new Date().getDate()} días del mes de ${new Date().toLocaleString("es-CO", { month: "long" })} de ${new Date().getFullYear()}.


________________________________________
Firma del Contribuyente
Nombre: ${nombre}
C.C. / NIT: ${nit}`;
    },
  },
  {
    id: "solicitud-intereses-vivienda",
    title: "Solicitud de Certificado de Intereses de Crédito de Vivienda / Leasing",
    category: "bancos",
    articleEt: "Art. 119 E.T.",
    description:
      "Modelo de carta para solicitar a entidades bancarias el certificado fiscal de intereses pagados para crédito hipotecario o leasing habitacional.",
    generateText: (d) => {
      const nombre = [d.identity.primerNombre, d.identity.otrosNombres, d.identity.primerApellido, d.identity.segundoApellido]
        .filter(Boolean)
        .join(" ") || "___________________________";
      const nit = d.identity.nit || "________________";

      return `SOLICITUD DE CERTIFICADO DE INTERESES DE CRÉDITO DE VIVIENDA (AÑO GRAVABLE ${d.year})

Ciudad: ________________________, Fecha: ${new Date().toLocaleDateString("es-CO")}

Señores:
ENTIDAD FINANCIERA / BANCO
Departamento de Certificaciones Tributarias

Asunto: Solicitud de Certificado Tributario de Intereses de Crédito Hipotecario / Leasing Habitacional (Art. 119 E.T.)

Respetados Señores:

Yo, ${nombre}, mayor de edad, identificado(a) con Cédula de Ciudadanía / NIT No. ${nit}, en calidad de titular del crédito hipotecario / contrato de leasing habitacional No. ________________________, solicito de manera respetuosa se sirvan expedir el Certificado Tributario correspondiente al año gravable ${d.year}.

Dicho documento debe certificar de manera expresa:
1. El saldo de la obligación financiera al 31 de diciembre de ${d.year}.
2. El monto total de intereses y/o corrección monetaria pagados durante el año ${d.year} destinados a la adquisición de vivienda de habitación (Art. 119 del Estatuto Tributario).

Este certificado es indispensable como soporte probatorio para mi Declaración de Renta Persona Natural (Formulario 210). Agradezco remitirlo al correo electrónico: ________________________________________.

Cordialmente,


________________________________________
${nombre}
C.C. / NIT: ${nit}
Teléfono: ____________________`;
    },
  },
  {
    id: "solicitud-certificado-retenciones",
    title: "Solicitud de Certificado de Retención en la Fuente (Art. 381 E.T.)",
    category: "retenciones",
    articleEt: "Art. 381 E.T.",
    description:
      "Carta formal de requerimiento a clientes o empresas pagadoras para la expedición obligatoria de certificados de retención sufridas.",
    generateText: (d) => {
      const nombre = [d.identity.primerNombre, d.identity.otrosNombres, d.identity.primerApellido, d.identity.segundoApellido]
        .filter(Boolean)
        .join(" ") || "___________________________";
      const nit = d.identity.nit || "________________";

      return `SOLICITUD DE CERTIFICADO DE RETENCIÓN EN LA FUENTE (ART. 381 E.T.)

Ciudad: ________________________, Fecha: ${new Date().toLocaleDateString("es-CO")}

Señores:
EMPRESA / AGENTE DE RETENCIÓN: ________________________________________
NIT: ________________________

Asunto: Solicitud Certificado de Retención en la Fuente a Título de Renta - Año Gravable ${d.year}

Respetados Señores:

De conformidad con lo establecido en el artículo 381 del Estatuto Tributario Colombiano, solicito comedidamente la expedición y entrega del Certificado de Retención en la Fuente a título de Impuesto sobre la Renta practicado a mi nombre durante el año gravable ${d.year}.

Datos del Sujeto Pasivo / Beneficiario:
- Nombre / Razón Social: ${nombre}
- NIT / Cédula de Ciudadanía: ${nit}
- Conceptos aplicados: Honorarios / Servicios / Rendimientos Financieros / Comisiones.

Agradezco su oportuna gestión y remisión del certificado al correo electrónico: ________________________________________ con el fin de consolidar la información en mi Declaración de Renta Formulario 210.

Atentamente,


________________________________________
${nombre}
C.C. / NIT: ${nit}`;
    },
  },
];
