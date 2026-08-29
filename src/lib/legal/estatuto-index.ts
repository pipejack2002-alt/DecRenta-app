/** Mapa del Estatuto Tributario (Decreto 624 de 1989, con reformas).
 *  Cada rango enlaza al texto oficial de Secretaría del Senado.
 *  Cedulario no sustituye el articulado íntegro: lo indexa y opera el 210.
 */

export type EtRelevance = "alta" | "media" | "baja";

export type EtChapter = {
  id: string;
  libro: string;
  titulo: string;
  from: number;
  to: number;
  relevance: EtRelevance;
  for210: string;
};

export type EtArt = {
  n: number;
  title: string;
  relevance: EtRelevance;
  for210: string;
};

export const SENADO_ET = "https://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario.html";

export function estatutoCoArt(n: number | string) {
  return `https://estatuto.co/${n}`;
}

export function dianNormogramaArt(n: number | string) {
  return `https://normograma.dian.gov.co/dian/compilacion/docs/estatuto_tributario.htm#${n}`;
}

export function senadoArt(n: number | string) {
  return `${SENADO_ET}#${n}`;
}

export const ET_INDEX: EtChapter[] = [
  { id: "pre", libro: "Título preliminar", titulo: "Obligación tributaria", from: 1, to: 4, relevance: "baja", for210: "Origen de la obligación, contribuyentes y responsables." },
  { id: "l1-suj", libro: "Libro 1 · Renta", titulo: "Sujeto pasivo, residencia y fuente", from: 5, to: 25, relevance: "alta", for210: "Arts. 5 a 10: un solo impuesto, PN, cónyuges, residentes (210) vs. no residentes (110). Fuente nacional y extranjera (24-25)." },
  { id: "l1-ing", libro: "Libro 1 · Renta", titulo: "Ingresos y realización", from: 26, to: 35, relevance: "alta", for210: "Renta líquida (26), realización (27-28), especie (29-1), intereses presuntivos (35)." },
  { id: "l1-incr", libro: "Libro 1 · Renta", titulo: "Ingresos no constitutivos de renta", from: 36, to: 57, relevance: "alta", for210: "Componente inflacionario (38-41), seguros de daño (45), apoyos educativos (46), dividendos (48-49), pensión (55), salud (56)." },
  { id: "l1-cos", libro: "Libro 1 · Renta", titulo: "Costos y realización", from: 58, to: 66, relevance: "alta", for210: "Realización del costo para no obligados a contabilidad (58). Causalidad con honorarios, capital y no laborales." },
  { id: "l1-act", libro: "Libro 1 · Renta", titulo: "Costo fiscal de activos y enajenación", from: 67, to: 92, relevance: "alta", for210: "Avalúo como costo (72), enajenación de activos y valor comercial (90). Define GO vs. no laborales." },
  { id: "l1-dep", libro: "Libro 1 · Renta", titulo: "Depreciación y amortización", from: 93, to: 102, relevance: "media", for210: "Si hay actividad económica con costos (honorarios / no laborales)." },
  { id: "l1-tra", libro: "Libro 1 · Renta", titulo: "Rentas de trabajo", from: 103, to: 106, relevance: "alta", for210: "Art. 103: salarios, comisiones, prestaciones, honorarios, viáticos. Honorarios van a casilla 32 (25 %) o 43 (con costos)." },
  { id: "l1-ded", libro: "Libro 1 · Renta", titulo: "Deducciones (107 a 119)", from: 107, to: 119, relevance: "alta", for210: "Causalidad (107), PILA (108), GMF e impuestos (115), intereses (117), inflacionario no deducible (118), subcapitalización (118-1), vivienda e ICETEX (119)." },
  { id: "l1-don", libro: "Libro 1 · Renta", titulo: "Donaciones y ahorro de largo plazo", from: 125, to: 126, relevance: "alta", for210: "Donaciones (125 y 257), AFC/FVP/AVC y cesantías de independiente (126-1, 126-4)." },
  { id: "l1-otr", libro: "Libro 1 · Renta", titulo: "Otras deducciones y limitaciones", from: 127, to: 177, relevance: "media", for210: "Pérdidas, pagos en efectivo, no aceptación de costos (177-2), limitaciones." },
  { id: "l1-det", libro: "Libro 1 · Renta", titulo: "Determinación de la renta", from: 178, to: 205, relevance: "media", for210: "Renta presuntiva (188-189, tarifa 0 %), compensaciones." },
  { id: "l1-ex", libro: "Libro 1 · Renta", titulo: "Rentas exentas de trabajo y especiales", from: 206, to: 235, relevance: "alta", for210: "Art. 206 (25 %, cesantías, pensiones, FF.MM.), CAN, otras exentas (207-2)." },
  { id: "l1-comp", libro: "Libro 1 · Renta", titulo: "Comparación patrimonial y omitidos", from: 236, to: 239, relevance: "alta", for210: "Renta por comparación (236-239) y activos omitidos (239-1) → casilla 96." },
  { id: "l1-tar", libro: "Libro 1 · Renta", titulo: "Tarifas", from: 240, to: 246, relevance: "alta", for210: "Art. 240 (sociedades y 2ª subcédula de dividendos), 241 (PN residentes), 242 (dividendos), 244-1 (aporte voluntario)." },
  { id: "l1-dsc", libro: "Libro 1 · Renta", titulo: "Descuentos tributarios", from: 253, to: 259, relevance: "alta", for210: "Exterior (254), I+D+i (256), donaciones 25 % (257), tope de descuentos (259)." },
  { id: "l1-pat", libro: "Libro 1 · Renta", titulo: "Patrimonio", from: 261, to: 292, relevance: "alta", for210: "Patrimonio bruto (261), valor patrimonial (267-277), deudas de fecha cierta (283)." },
  { id: "l1-go", libro: "Libro 1 · Renta", titulo: "Ganancias ocasionales", from: 299, to: 317, relevance: "alta", for210: "Hecho generador (300), seguro de vida (303-1), herencias (307), vivienda (311-1), tarifas 15 % / 20 %." },
  { id: "l1-ced", libro: "Libro 1 · Renta", titulo: "Sistema cedular (PN)", from: 330, to: 343, relevance: "alta", for210: "Cédulas (330-335), 40 % / 1.340 UVT, 72 UVT, 1 % FE (336), tope 60 % (336-1), dividendos (342-343)." },
  { id: "l2-ret", libro: "Libro 2 · Retención en la fuente", titulo: "Agentes, certificados y tabla laboral", from: 365, to: 419, relevance: "alta", for210: "Facultad (365), certificado de salarios (378-379), otros certificados (381), tarifa laboral (383), dependientes y salud (387)." },
  { id: "l3-iva", libro: "Libro 3 · IVA", titulo: "Impuesto sobre las ventas", from: 420, to: 513, relevance: "media", for210: "Ser responsable de IVA al 31/12 obliga a declarar renta (592)." },
  { id: "proc-obl", libro: "Procedimiento", titulo: "Obligación de declarar y plazos", from: 574, to: 603, relevance: "alta", for210: "Clases de declaraciones (574), plazos (579), contenido (591, 596), no obligados (592-594-3), firma de contador (596)." },
  { id: "proc-corr", libro: "Procedimiento", titulo: "Corrección y sanción", from: 588, to: 658, relevance: "alta", for210: "Corrección (588-589), sanción mínima 10 UVT (639), graduación (640), extemporaneidad (641-642), inexactitud (647)." },
  { id: "proc-fis", libro: "Procedimiento", titulo: "Fiscalización y firmeza", from: 684, to: 720, relevance: "media", for210: "Facultades DIAN (684), firmeza (714), beneficio de auditoría (689-3) AG 2023-2026." },
  { id: "proc-pru", libro: "Procedimiento", titulo: "Prueba y soportes", from: 742, to: 777, relevance: "alta", for210: "Factura electrónica (771-2), medios de pago (771-5), fecha cierta de pasivos (767, 770) concordante con 283 y C. Co." },
  { id: "proc-pag", libro: "Procedimiento", titulo: "Pago, devoluciones y facultades", from: 800, to: 857, relevance: "media", for210: "Pago (800-803), plazos especiales (811) — base del Decreto 1226 de 2026." },
  { id: "uvt", libro: "Disposiciones varias", titulo: "UVT y normas antiabuso", from: 868, to: 869, relevance: "alta", for210: "UVT (868). Sanciones del año de presentación; topes del año gravable." },
  { id: "l-gmf", libro: "GMF", titulo: "Gravamen a los movimientos financieros", from: 870, to: 881, relevance: "alta", for210: "Hecho generador del 4×1.000. El 50 % es deducible con certificado del banco (115)." },
];

export const ET_ARTS: EtArt[] = [
  { n: 1, title: "Origen de la obligación sustancial", relevance: "baja", for210: "Marco. El impuesto nace de la ley." },
  { n: 5, title: "El impuesto sobre la renta y sus complementarios constituyen un solo impuesto", relevance: "alta", for210: "Renta + complementarios (GO) se liquidan juntos en el 210." },
  { n: 6, title: "Declaración voluntaria del impuesto sobre la renta", relevance: "alta", for210: "Puede declarar aunque no cruce topes. Sirve para saldos a favor y certificados." },
  { n: 7, title: "Las personas naturales están sometidas al impuesto", relevance: "alta", for210: "Sujeto del 210 (residente) o del 110 (no residente)." },
  { n: 8, title: "Los cónyuges se gravan en forma individual", relevance: "alta", for210: "Cada cónyuge declara por separado. Un mismo dependiente no se duplica (387)." },
  { n: 9, title: "Impuesto de las personas naturales, residentes y no residentes", relevance: "alta", for210: "Residente: renta mundial. No residente: solo fuente nacional." },
  { n: 10, title: "Residencia para efectos tributarios", relevance: "alta", for210: "183 días en 365, familia, nacionalidad y núcleo esencial." },
  { n: 24, title: "Ingresos de fuente nacional", relevance: "alta", for210: "Clasifica salarios, inmuebles, dividendos y servicios en Colombia." },
  { n: 26, title: "Los ingresos son rentas ordinarias salvo disposición en contrario", relevance: "alta", for210: "Base de la renta líquida." },
  { n: 27, title: "Realización del ingreso para no obligados a llevar contabilidad", relevance: "alta", for210: "Inmuebles: fecha de la escritura." },
  { n: 35, title: "Intereses presuntivos", relevance: "media", for210: "Préstamos a vinculados a tasa mínima." },
  { n: 38, title: "Componente inflacionario de los rendimientos financieros", relevance: "alta", for210: "INCRNGO de capital. Pida el certificado al banco." },
  { n: 45, title: "Indemnizaciones por seguro de daño", relevance: "alta", for210: "INCRNGO del daño emergente, en no laborales." },
  { n: 46, title: "Apoyos educativos oficiales", relevance: "alta", for210: "INCRNGO si cumplen requisitos del artículo." },
  { n: 48, title: "Dividendos y participaciones", relevance: "alta", for210: "Cédula de dividendos. Cruce con 49 y 242." },
  { n: 49, title: "Utilidad máxima a distribuir como no gravada", relevance: "alta", for210: "Subcédula 1 (num. 3) vs. subcédula 2 (par. 2)." },
  { n: 55, title: "Aportes obligatorios al sistema general de pensiones", relevance: "alta", for210: "INCRNGO de trabajo y honorarios." },
  { n: 56, title: "Aportes obligatorios a salud", relevance: "alta", for210: "INCRNGO. Distinto de medicina prepagada (387)." },
  { n: 58, title: "Realización del costo para los no obligados a llevar contabilidad", relevance: "alta", for210: "El costo se realiza con el pago efectivo, salvo reglas especiales." },
  { n: 72, title: "Avalúo como costo fiscal", relevance: "alta", for210: "El avalúo catastral puede tomarse como costo en la enajenación de inmuebles." },
  { n: 90, title: "Determinación de la renta bruta en la enajenación de activos", relevance: "alta", for210: "Precio menos costo. En raíces, el precio no puede ser inferior al avalúo / autoavalúo / costo." },
  { n: 103, title: "Rentas de trabajo", relevance: "alta", for210: "Salarios, comisiones, prestaciones, pensiones, honorarios y viáticos." },
  { n: 107, title: "Causalidad, necesidad y proporcionalidad", relevance: "alta", for210: "Filtro de todo costo y deducción." },
  { n: 108, title: "Aportes parafiscales como requisito de la deducción de salarios", relevance: "alta", for210: "PILA al día. Independientes: cotización para proceder costos." },
  { n: 115, title: "Deducción de impuestos pagados y del GMF", relevance: "alta", for210: "50 % del GMF. Predial solo con causalidad (no el de la casa de habitación, en principio)." },
  { n: 117, title: "Intereses", relevance: "alta", for210: "Deducibles si hay relación de causalidad; vivienda va por 119." },
  { n: 118, title: "Componente inflacionario de los intereses no es deducible", relevance: "media", for210: "Se resta del interés bruto." },
  { n: 119, title: "Intereses sobre préstamos para adquisición de vivienda e ICETEX", relevance: "alta", for210: "1.200 UVT vivienda; 100 UVT ICETEX. Pool global." },
  { n: 125, title: "Donaciones", relevance: "alta", for210: "Deducción (125) o descuento 25 % (257) según el régimen de la donataria. Certificado." },
  { n: 126, title: "Ahorro de largo plazo (126-1 y 126-4)", relevance: "alta", for210: "FVP/RAIS 3.800 / 2.500 UVT; AFC 3.800 UVT; cesantías de independiente 2.500 UVT + 1/12." },
  { n: 147, title: "Compensación de pérdidas fiscales", relevance: "media", for210: "Si hay actividad empresarial en no laborales." },
  { n: 177, title: "No aceptación de costos y gastos (177-2)", relevance: "media", for210: "Costos que no cumplen requisitos no se aceptan. Cruce con 771-2 y 771-5." },
  { n: 188, title: "Renta presuntiva", relevance: "media", for210: "Tarifa 0 % vigente. No suma a la casilla 97." },
  { n: 206, title: "Rentas de trabajo exentas", relevance: "alta", for210: "25 % (tope 790 UVT), cesantías, pensiones 1.000 UVT/mes, FF.MM., indemnizaciones." },
  { n: 207, title: "Otras rentas exentas (207-2)", relevance: "media", for210: "Exenciones especiales (hotelería, energías, etc.) si aún vigentes." },
  { n: 236, title: "Renta por comparación patrimonial", relevance: "alta", for210: "El incremento patrimonial no justificado es renta. Casilla 96." },
  { n: 239, title: "Renta líquida por activos omitidos o pasivos inexistentes (239-1)", relevance: "alta", for210: "El activo omitido / pasivo inexistente se integra como renta líquida gravable." },
  { n: 240, title: "Tarifa para sociedades", relevance: "alta", for210: "También tarifa de la 2ª subcédula de dividendos (par. 2 art. 49)." },
  { n: 241, title: "Tarifa para personas naturales residentes", relevance: "alta", for210: "Tabla de la casilla 97 (renta líquida gravable)." },
  { n: 242, title: "Tarifa de dividendos", relevance: "alta", for210: "Subcédulas 1 y 2 + utilidades 2016." },
  { n: 254, title: "Descuento por impuestos pagados en el exterior", relevance: "alta", for210: "Tax credit limitado al impuesto colombiano sobre esas rentas." },
  { n: 257, title: "Descuento por donaciones a ESAL del régimen especial", relevance: "alta", for210: "25 % de la donación. Tope conjunto con 256 en el 259." },
  { n: 259, title: "Límite de los descuentos tributarios", relevance: "alta", for210: "Los descuentos no pueden exceder el impuesto básico; I+D y donaciones, 25 % / 30 % según norma vigente." },
  { n: 261, title: "Patrimonio bruto", relevance: "alta", for210: "Suma de bienes y derechos poseídos a 31 de diciembre. Casilla 29." },
  { n: 267, title: "Valor patrimonial de los bienes", relevance: "alta", for210: "Regla general de valoración. Cuentas, inversiones, vehículos." },
  { n: 277, title: "Valor patrimonial de los inmuebles", relevance: "alta", for210: "El mayor entre costo fiscal, avalúo catastral y autoavalúo." },
  { n: 283, title: "Deudas de quienes no están obligados a llevar libros", relevance: "alta", for210: "Solo pasivos de fecha cierta (767, 770 y C. Co.)." },
  { n: 300, title: "Ingresos constitutivos de ganancia ocasional", relevance: "alta", for210: "Enajenación de activos fijos poseídos ≥ 2 años, herencias, donaciones, loterías." },
  { n: 303, title: "Indemnizaciones de seguros de vida (303-1)", relevance: "alta", for210: "No gravadas hasta 3.250 UVT; el exceso es GO." },
  { n: 307, title: "Herencias, legados y donaciones", relevance: "alta", for210: "Porción exenta + tarifa 10 % / 20 %." },
  { n: 330, title: "Sistema cedular", relevance: "alta", for210: "Trabajo, pensiones, capital, no laborales, dividendos." },
  { n: 335, title: "Cédula de rentas de capital", relevance: "alta", for210: "Intereses, arrendamientos, regalías, rendimientos." },
  { n: 336, title: "Renta líquida cedular de trabajo", relevance: "alta", for210: "40 % y 1.340 UVT, 72 UVT de dependientes, 1 % FE 240 UVT." },
  { n: 365, title: "Facultad para establecer retenciones", relevance: "media", for210: "Marco de la retención que luego se acredita en casilla 132." },
  { n: 378, title: "Certificado por concepto de salarios", relevance: "alta", for210: "El empleador debe expedir el Formato 220. Pídaselo." },
  { n: 379, title: "Contenido del certificado de ingresos y retenciones", relevance: "alta", for210: "Salarios, cesantías, aportes, retención. Alimenta casillas 32 a 42 y 132." },
  { n: 381, title: "Certificados por otros conceptos", relevance: "alta", for210: "Honorarios, arrendamientos, rendimientos, dividendos." },
  { n: 383, title: "Tarifa de retención laboral", relevance: "alta", for210: "Tabla de retención mensual. No es la tarifa del 210 (esa es 241)." },
  { n: 387, title: "Deducciones de la base de retención: dependientes y salud", relevance: "alta", for210: "72 UVT por dependiente (casilla 139) y 16 UVT/mes de medicina prepagada." },
  { n: 574, title: "Clases de declaraciones", relevance: "alta", for210: "Renta, IVA, retención, etc. El 210 es la de PN residente." },
  { n: 579, title: "Lugares y plazos para presentar las declaraciones", relevance: "alta", for210: "El Gobierno fija el calendario. AG 2025: 12 ago–26 oct 2026 + Decreto 1226." },
  { n: 591, title: "Contenido de la declaración", relevance: "media", for210: "Identificación, patrimonio, rentas, liquidación." },
  { n: 592, title: "Quiénes no están obligados a declarar", relevance: "alta", for210: "Topes de patrimonio 4.500 UVT e ingresos / consignaciones / compras / tarjetas 1.400 UVT. IVA sí obliga." },
  { n: 596, title: "Contenido de la declaración de renta", relevance: "alta", for210: "Firma del contribuyente y, si patrimonio o ingresos superan 100.000 UVT, de contador público." },
  { n: 634, title: "Intereses moratorios", relevance: "alta", for210: "Si paga después del vencimiento de su dígito. Tasa de usura menos 2 puntos (art. 635)." },
  { n: 639, title: "Sanción mínima", relevance: "alta", for210: "10 UVT del año de presentación (UVT 2026 = $52.374)." },
  { n: 640, title: "Principios de lesividad, proporcionalidad, gradualidad y favorabilidad", relevance: "alta", for210: "Reduce sanciones si hay historial limpio. Cruce con 640 y decretos reglamentarios." },
  { n: 641, title: "Sanción por extemporaneidad", relevance: "alta", for210: "Porcentaje sobre el impuesto a cargo o sobre ingresos, según el caso, por mes o fracción." },
  { n: 647, title: "Sanción por inexactitud", relevance: "alta", for210: "Si omite ingresos, incluye pasivos inexistentes o toma deducciones improcedentes." },
  { n: 689, title: "Beneficio de auditoría (689-3)", relevance: "alta", for210: "Firmeza de 6 o 12 meses si el impuesto neto crece el % exigido. AG 2023-2026." },
  { n: 714, title: "Firmeza de la declaración privada", relevance: "alta", for210: "Regla general 3 años; más si hay pérdidas o beneficio de auditoría." },
  { n: 771, title: "Factura y medios de pago (771-2 y 771-5)", relevance: "alta", for210: "Soporte de costos y del 1 % FE. Pagos por medios electrónicos para proceder." },
  { n: 811, title: "Facultad para fijar plazos especiales", relevance: "alta", for210: "Base legal del Decreto 1226 de 2026 (sismo)." },
  { n: 868, title: "Unidad de Valor Tributario", relevance: "alta", for210: "UVT 2025 = $49.799 (topes AG); UVT 2026 = $52.374 (sanciones al presentar)." },
  { n: 871, title: "Hecho generador del GMF", relevance: "alta", for210: "4×1.000. Pida el certificado al banco: el 50 % es deducible (115)." },
];

export const ET_OFFICIAL = {
  senado: SENADO_ET,
  funcionPublica: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6533",
  dianNormograma: "https://normograma.dian.gov.co/dian/compilacion/docs/estatuto_tributario.htm",
  estatutoCo: "https://estatuto.co/",
} as const;

export function etChapterFor(n: number) {
  const hits = ET_INDEX.filter((c) => n >= c.from && n <= c.to);
  return hits.sort((a, b) => a.to - a.from - (b.to - b.from))[0];
}

export function searchEt(q: string) {
  const s = q.trim().toLowerCase();
  const num = Number((s.match(/\d+/) ?? [])[0]);
  const hasNum = Number.isFinite(num) && num > 0;
  const chapters = !s
    ? ET_INDEX
    : ET_INDEX.filter((c) => {
        const blob = `${c.libro} ${c.titulo} ${c.for210} ${c.from} ${c.to}`.toLowerCase();
        if (blob.includes(s)) return true;
        return hasNum && num >= c.from && num <= c.to;
      });
  const arts = !s
    ? ET_ARTS
    : ET_ARTS.filter((a) => {
        const blob = `${a.n} ${a.title} ${a.for210}`.toLowerCase();
        if (blob.includes(s)) return true;
        return hasNum && a.n === num;
      });
  return { chapters, arts };
}

export function etMapForPrompt() {
  return ET_INDEX.map((c) => `${c.libro} · arts. ${c.from}–${c.to} · ${c.titulo}: ${c.for210}`).join("\n");
}
