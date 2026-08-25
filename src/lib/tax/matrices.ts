/** Matrices cedulares DIAN — capacitación Renta AG 2025 (determinación cedular).
 *  Fuentes: arts. 46, 55, 56, 103, 115–119, 126-1, 206, 336, 387 E.T.;
 *  DUR 1625/2016 arts. 1.2.1.20.3 y 1.2.1.20.4; Ley 1715/2014 art. 11.
 */

export type CedulaCol = "trabajo" | "honorarios" | "capital" | "noLaborales";

export const CEDULA_COLS: { id: CedulaCol; short: string; long: string; arts: string }[] = [
  { id: "trabajo", short: "Trabajo", long: "Rentas de trabajo", arts: "Art. 103 E.T." },
  {
    id: "honorarios",
    short: "Honorarios",
    long: "Trabajo — no laborales, legales y reglamentarias",
    arts: "Art. 103 y par. 5 art. 206 E.T.",
  },
  { id: "capital", short: "Capital", long: "Rentas de capital", arts: "Art. 335 E.T." },
  { id: "noLaborales", short: "No laborales", long: "Rentas no laborales", arts: "Art. 335 E.T." },
];

export type MatrixRow = {
  id: string;
  label: string;
  article: string;
  articleId: string;
  cap?: string;
  capUvt?: number;
  capNote?: string;
  cols: Record<CedulaCol, boolean>;
  whyNot: Partial<Record<CedulaCol, string>>;
  kind: "incr" | "exenta" | "deduccion";
  limited40: boolean;
};

const all = (except: CedulaCol[] = []): Record<CedulaCol, boolean> => ({
  trabajo: !except.includes("trabajo"),
  honorarios: !except.includes("honorarios"),
  capital: !except.includes("capital"),
  noLaborales: !except.includes("noLaborales"),
});

export const INCR_ROWS: MatrixRow[] = [
  {
    id: "pension-obl",
    label: "Aportes obligatorios a pensiones",
    article: "Art. 55 E.T.",
    articleId: "et-55",
    cols: all(),
    whyNot: {},
    kind: "incr",
    limited40: false,
  },
  {
    id: "salud-obl",
    label: "Aportes obligatorios a salud",
    article: "Art. 56 E.T.",
    articleId: "et-56",
    cols: all(),
    whyNot: {},
    kind: "incr",
    limited40: false,
  },
  {
    id: "rais",
    label: "Cotización voluntaria a pensión obligatoria — RAIS",
    article: "Art. 55 E.T. · par. 1 art. 135 Ley 100/1993",
    articleId: "et-55",
    cap: "25 % del ingreso tributario anual, máx. 2.500 UVT",
    capUvt: 2500,
    cols: all(),
    whyNot: {},
    kind: "incr",
    limited40: false,
  },
  {
    id: "apoyos-edu",
    label: "Apoyos económicos para financiar programas educativos",
    article: "Art. 46 E.T.",
    articleId: "et-46",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: true },
    whyNot: {
      honorarios: "El art. 46 solo cubre apoyos para programas educativos en rentas de trabajo (relación laboral) y no laborales. En honorarios con costos no es INCRNGO autónomo.",
      capital: "Los rendimientos de capital no son apoyos educativos. El art. 46 no aplica a intereses, arrendamientos ni regalías.",
    },
    kind: "incr",
    limited40: false,
  },
  {
    id: "inflacionario",
    label: "Componente inflacionario de los rendimientos financieros (no obligados a llevar contabilidad)",
    article: "Arts. 38 a 41 E.T.",
    articleId: "et-38",
    cols: { trabajo: false, honorarios: false, capital: true, noLaborales: false },
    whyNot: {
      trabajo: "El componente inflacionario recae sobre rendimientos financieros, que van a la cédula de capital, no a salarios.",
      honorarios: "No hay rendimientos financieros en honorarios. Use la cédula de capital.",
      noLaborales: "El art. 38 está reservado a rendimientos financieros de personas naturales no obligadas a llevar contabilidad.",
    },
    kind: "incr",
    limited40: false,
  },
  {
    id: "seguro-dano",
    label: "Indemnizaciones por seguros de daño",
    article: "Art. 45 E.T.",
    articleId: "et-45",
    cols: { trabajo: false, honorarios: false, capital: false, noLaborales: true },
    whyNot: {
      trabajo: "La indemnización de un seguro de daño no es renta de trabajo. Si es seguro de vida, va a ganancia ocasional (art. 303-1, 3.250 UVT).",
      honorarios: "No es honorario. Llévela a rentas no laborales o, si es de vida, a ganancia ocasional.",
      capital: "No es rendimiento de capital. El art. 45 la trata como INCRNGO en no laborales.",
    },
    kind: "incr",
    limited40: false,
  },
  {
    id: "demas-incr",
    label: "Demás contempladas por la ley",
    article: "E.T. y normas especiales",
    articleId: "et-26",
    cols: { trabajo: false, honorarios: false, capital: false, noLaborales: true },
    whyNot: {
      trabajo: "Lo que no esté en los arts. 55, 56 o 46 para trabajo no es INCRNGO residual. Revise si es renta exenta del art. 206.",
      honorarios: "No hay un residual de INCRNGO en honorarios. Use costos (art. 107) o el 25 % si no resta costos.",
      capital: "En capital el residual típico es el componente inflacionario (arts. 38-41), no un cajón de sastre.",
    },
    kind: "incr",
    limited40: false,
  },
];

export const EXENTA_ROWS: MatrixRow[] = [
  {
    id: "afc",
    label: "Aportes voluntarios a pensiones, cuentas AFC o AVC",
    article: "Arts. 126-1 y 126-4 E.T.",
    articleId: "et-126-1",
    cap: "30 % del ingreso tributario del año, máx. 3.800 UVT (tope global, no por cédula)",
    capUvt: 3800,
    cols: all(),
    whyNot: {},
    kind: "exenta",
    limited40: true,
  },
  {
    id: "cesantias",
    label: "Auxilio de cesantía",
    article: "Num. 4 art. 206 E.T.",
    articleId: "et-206",
    cap: "100 % si el salario promedio de 6 meses ≤ 350 UVT; tabla decreciente hasta 650 UVT",
    capUvt: 350,
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "Las cesantías del Código Sustantivo del Trabajo solo existen en relación laboral, legal o reglamentaria. El independiente deduce aportes a fondo de cesantías (2.500 UVT / 1/12), que es otra figura.",
      capital: "No hay cesantías en rentas de capital.",
      noLaborales: "El independiente no tiene auxilio de cesantía laboral. Puede deducir aportes propios al fondo (art. 126-1).",
    },
    kind: "exenta",
    limited40: true,
  },
  {
    id: "gastos-rep",
    label: "Gasto de representación",
    article: "Nums. 6 y 8 art. 206 E.T.",
    articleId: "et-206",
    cap: "Magistrados 50 %; jueces 25 %; rectores y profesores de universidades públicas 50 %",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "El gasto de representación del art. 206 es para servidores públicos con relación legal y reglamentaria, no para independientes.",
      capital: "No es renta de capital.",
      noLaborales: "Reservado a rentas de trabajo de magistrados, jueces, rectores y profesores de universidades públicas.",
    },
    kind: "exenta",
    limited40: false,
  },
  {
    id: "ffmm-muerte",
    label: "Seguro por muerte, compensaciones por muerte y prestaciones de FF.MM. y Policía Nacional",
    article: "Num. 7 art. 206 E.T.",
    articleId: "et-206",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "Solo aplica a miembros de la Fuerza Pública con relación legal y reglamentaria.",
      capital: "No es renta de capital.",
      noLaborales: "Prestación de la Fuerza Pública: cédula de trabajo.",
    },
    kind: "exenta",
    limited40: false,
  },
  {
    id: "ffmm-exceso",
    label: "Exceso del salario básico FF.MM. y POLINAL",
    article: "Num. 7 art. 206 E.T.",
    articleId: "et-206",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "Solo Fuerza Pública.",
      capital: "No es renta de capital.",
      noLaborales: "Cédula de trabajo.",
    },
    kind: "exenta",
    limited40: false,
  },
  {
    id: "indemniza",
    label: "Indemnizaciones por accidente de trabajo, enfermedad, maternidad o gastos de entierro",
    article: "Nums. 1, 2 y 3 art. 206 E.T.",
    articleId: "et-206",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "El art. 206 nums. 1 a 3 cubre indemnizaciones laborales. Un independiente no tiene maternidad ni accidente de trabajo del CST.",
      capital: "No es rendimiento de capital.",
      noLaborales: "Si es seguro de daño, es INCRNGO (art. 45), no renta exenta.",
    },
    kind: "exenta",
    limited40: false,
  },
  {
    id: "exenta-25",
    label: "25 % de los pagos laborales",
    article: "Num. 10 art. 206 E.T.",
    articleId: "et-206",
    cap: "Limitada a 790 UVT anuales",
    capUvt: 790,
    capNote: "Se calcula después de restar INCRNGO, demás exentas y deducciones. Quien reste costos en honorarios pierde este 25 % sobre esos ingresos (par. 5).",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: false },
    whyNot: {
      honorarios: "Si imputa costos (casilla 43) pierde el 25 %. Para tomarlo, lleve los honorarios a la casilla 32 y no reste costos.",
      capital: "El 25 % es exclusivo de rentas de trabajo que provengan de relación laboral o de honorarios sin costos.",
      noLaborales: "No hay 25 % en actividad mercantil ni en venta de activos. Ahí hay costos (art. 107), no renta exenta laboral.",
    },
    kind: "exenta",
    limited40: true,
  },
  {
    id: "can",
    label: "Rentas provenientes de la CAN",
    article: "Decisión 578 de 2004 CAN",
    articleId: "can-578",
    cols: all(),
    whyNot: {},
    kind: "exenta",
    limited40: false,
  },
  {
    id: "demas-ex",
    label: "Las demás señaladas por la ley",
    article: "Art. 206 y normas especiales",
    articleId: "et-206",
    cols: { trabajo: true, honorarios: false, capital: false, noLaborales: true },
    whyNot: {
      honorarios: "En honorarios con costos no hay un residual de rentas exentas laborales. El 25 % se perdió al restar costos.",
      capital: "Las exentas de capital son puntuales (CAN, CDI, hoteles art. 207-2). No hay cajón residual.",
    },
    kind: "exenta",
    limited40: true,
  },
];

export const DEDUCCION_ROWS: MatrixRow[] = [
  {
    id: "vivienda",
    label: "Intereses sobre préstamos para adquisición de vivienda",
    article: "Art. 119 E.T.",
    articleId: "et-119",
    cap: "1.200 UVT anuales (tope global entre cédulas)",
    capUvt: 1200,
    cols: all(),
    whyNot: {},
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "icetex",
    label: "Intereses sobre préstamos educativos ICETEX",
    article: "Art. 119 E.T.",
    articleId: "et-119",
    cap: "100 UVT anuales (tope global)",
    capUvt: 100,
    cols: all(),
    whyNot: {},
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "dependiente-387",
    label: "Dependiente económico",
    article: "Art. 387 E.T. · art. 1.2.1.20.3 DUR",
    articleId: "et-387",
    cap: "10 % de la renta de trabajo, máx. 32 UVT mensuales; más 72 UVT anuales por dependiente (máx. 4) fuera del 40 %",
    capUvt: 32,
    capNote: "32 UVT/mes entran al 40 %. Las 72 UVT del num. 4 art. 336 van a la casilla 139 y no se someten al 40 % / 1.340 UVT.",
    cols: { trabajo: true, honorarios: true, capital: false, noLaborales: false },
    whyNot: {
      capital: "El art. 387 y el DUR 1.2.1.20.3 circunscriben la deducción por dependientes a rentas de trabajo (salarios u honorarios). No se imputa a intereses ni arrendamientos.",
      noLaborales: "No hay dependientes en la cédula no laboral. Si además tiene salarios, use trabajo; si solo honorarios, use esa cédula.",
    },
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "medicina",
    label: "Medicina prepagada y seguros de salud",
    article: "Art. 387 E.T.",
    articleId: "et-387",
    cap: "16 UVT mensuales (192 UVT año)",
    capUvt: 16,
    cols: { trabajo: true, honorarios: true, capital: false, noLaborales: false },
    whyNot: {
      capital: "El art. 387 disminuye la base de retención de rentas de trabajo, no de capital.",
      noLaborales: "Solo rentas de trabajo. Una póliza de salud no se deduce contra la actividad mercantil.",
    },
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "gmf",
    label: "Gravamen a los movimientos financieros",
    article: "Art. 115 E.T.",
    articleId: "et-115",
    cap: "50 % del GMF certificado por el agente retenedor, sin exigir causalidad",
    cols: all(),
    whyNot: {},
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "ces-ind",
    label: "Aportes de independiente a fondo de cesantías",
    article: "Art. 126-1 E.T.",
    articleId: "et-126-1",
    cap: "2.500 UVT, sin exceder 1/12 del ingreso gravable de la cédula",
    capUvt: 2500,
    cols: { trabajo: false, honorarios: true, capital: true, noLaborales: true },
    whyNot: {
      trabajo: "El asalariado ya tiene cesantías pagadas por el empleador (renta exenta del num. 4 art. 206). Esta deducción es para quien aporta como independiente a un fondo de cesantías.",
    },
    kind: "deduccion",
    limited40: true,
  },
  {
    id: "fnce",
    label: "Generación con FNCE y vehículos híbridos / eléctricos",
    article: "Art. 11 Ley 1715 de 2014 · art. 1.2.1.25 DUR",
    articleId: "ley-1715",
    cap: "50 % de la inversión, en cuotas iguales durante 15 años, con certificado UPME",
    cols: all(),
    whyNot: {},
    kind: "deduccion",
    limited40: true,
  },
];

export const FACTURA_ELECTRONICA_REQS: { id: string; text: string }[] = [
  { id: "fe-1", text: "La adquisición del bien o servicio está soportada con factura electrónica de venta con validación previa." },
  { id: "fe-2", text: "La factura identifica al adquirente con nombres y apellidos y el NIT o documento de identificación." },
  { id: "fe-3", text: "La adquisición no se solicitó como costo o gasto en renta, IVA descontable, INCR u otro beneficio tributario." },
  { id: "fe-4", text: "La factura se pagó con tarjeta débito/crédito o cualquier medio electrónico de entidad vigilada por la Superintendencia Financiera." },
  { id: "fe-5", text: "El emisor está obligado a expedir factura electrónica." },
  { id: "fe-6", text: "Tope de la deducción: 240 UVT. No genera pérdida fiscal." },
];

export const CAPITAL_CATS = [
  { id: "intereses", label: "Intereses" },
  { id: "arrendamientos", label: "Arrendamientos" },
  { id: "regalias", label: "Regalías" },
  { id: "rendimientos", label: "Rendimientos financieros" },
  { id: "intangibles", label: "Explotación de intangibles" },
] as const;

export const NL_CATS = [
  { id: "ventas", label: "Ventas de muebles o inmuebles" },
  { id: "recompensas", label: "Recompensas" },
  { id: "apoyos", label: "Apoyos económicos" },
  { id: "notarios", label: "Notarios" },
  { id: "curadores", label: "Curadores" },
  { id: "campanas", label: "Donaciones a campañas políticas" },
  { id: "demas", label: "Demás no clasificados en otra renta o cédula" },
] as const;

export function whyCannot(row: MatrixRow, col: CedulaCol): string | null {
  if (row.cols[col]) return null;
  return row.whyNot[col] ?? `Este beneficio no se imputa a la cédula de ${col}. ${row.article}.`;
}
