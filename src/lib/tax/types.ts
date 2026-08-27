import type { UvtOverrides } from "./uvt.ts";

export type TaxYear = number;

export type AlertLevel = "info" | "warn" | "block" | "ok";

export type TaxAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
  source: string;
  casilla?: number;
  section?: string;
};

export type Identity = {
  nit: string;
  dv: string;
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  otrosNombres: string;
  dirSeccional: string;
  actividadCiiu: string;
  numeroFormulario?: string;
  esCorreccion: boolean;
  codCorreccion?: string;
  formAnterior: string;
  fraccionAnioSiguiente?: boolean;
  primeraVez: boolean;
  aniosDeclarando: 1 | 2 | 3;
  responsableIva: boolean;
  llevaLibros: boolean;
  sucursalIliquida: boolean;
  residente: boolean;
  /** Domicilio fiscal al 10/08/2026 en seccional no listada (Palmira, Tuluá, Buenaventura, Quibdó). */
  zonaSismo1226: boolean;
};

export type TopesInput = {
  ingresosBrutos: number;
  patrimonioBruto: number;
  consumosTarjeta: number;
  compras: number;
  consignaciones: number;
};

export type Patrimonio = {
  efectivo: number;
  cuentas: number;
  inversiones: number;
  inventarios: number;
  inmuebles: number;
  vehiculos: number;
  muebles: number;
  cuentasPorCobrar: number;
  cripto: number;
  otrosActivos: number;
  viviendaHabitacion: number;
  aportesSociedadesNacionales: number;
  obligacionesFinancieras: number;
  cuentasPorPagar: number;
  impuestosPorPagar: number;
  otrasDeudas: number;
  patrimonioLiquidoAnterior: number;
  consumosEstimadosAnio?: number;
  valorizacionesJustificadas?: number;
  desvalorizacionesJustificadas?: number;
  herenciasLegadosDonaciones?: number;
  otrosAjustesJustificativos?: number;
};

export type Trabajo = {
  salarios: number;
  honorariosSinCostos: number;
  cesantiasPagadas: number;
  otrasPrestaciones: number;
  otrosPagosLaborales?: number;
  ingresosEspecie: number;
  ingresosExterior: number;
  promedioMensual6m: number;
  aportesPensionObligatorios: number;
  aportesSaludObligatorios: number;
  aportesVoluntariosRais: number;
  apoyosEducativos: number;
  otrosINCRNGO: number;
  aportesAfcFvpAvc: number;
  cesantiasAcumuladas2016: number;
  indemnizaciones: number;
  primasDiplomaticas: number;
  gastosRepresentacion: number;
  ffmmPrestaciones: number;
  ffmmExcesoSalario: number;
  rentasCan: number;
  otrasExentasIlimitadas: number;
  otrasExentas: number;
  interesesVivienda: number;
  medicinaPrepagada: number;
  gmf: number;
  dependientes: number;
  icetex: number;
  fnceAnual: number;
  otrasDeducciones: number;
  comprasFacturaElectronica: number;
};

export type Honorarios = {
  usarCostos: boolean;
  ingresos: number;
  incrngo: number;
  aportesPension: number;
  aportesSalud: number;
  aportesRais: number;
  costos: number;
  aportesAfc: number;
  rentasCan: number;
  otrasExentas: number;
  interesesVivienda: number;
  gmf: number;
  icetex: number;
  medicinaPrepagada: number;
  aportesCesantiasIndependiente: number;
  fnceAnual: number;
  otrasDeducciones: number;
  compensacionPerdidas: number;
};

export type Capital = {
  intereses: number;
  arrendamientos: number;
  regalias: number;
  rendimientosFinancieros: number;
  explotacionIntangibles: number;
  ingresosExterior: number;
  incrngo: number;
  componenteInflacionario: number;
  aportesPension: number;
  aportesSalud: number;
  aportesRais: number;
  costos: number;
  ecePasiva: number;
  aportesAfc: number;
  rentasCan: number;
  otrasExentas: number;
  interesesVivienda: number;
  gmf: number;
  icetex: number;
  aportesCesantiasIndependiente: number;
  fnceAnual: number;
  otrasDeducciones: number;
  compensacionPerdidas: number;
};

export type NoLaborales = {
  ingresos: number;
  ventas: number;
  recompensas: number;
  apoyosEconomicos: number;
  notarios: number;
  curadores: number;
  donacionesCampanas: number;
  demas: number;
  devoluciones: number;
  incrngo: number;
  apoyosEducativos: number;
  indemnizacionesSeguroDano: number;
  aportesPension: number;
  aportesSalud: number;
  aportesRais: number;
  costos: number;
  ecePasiva: number;
  aportesAfc: number;
  rentasCan: number;
  otrasExentas: number;
  interesesVivienda: number;
  gmf: number;
  icetex: number;
  aportesCesantiasIndependiente: number;
  fnceAnual: number;
  otrasDeducciones: number;
  compensacionPerdidas: number;
};

export type Pensiones = {
  ingresos: number;
  incrngo: number;
  meses: number;
};

export type Dividendos = {
  div2016: number;
  incrngo2016: number;
  subcedula1: number;
  subcedula2: number;
  tarifaSub2: number;
  exterior: number;
  exentasExterior: number;
};

export type GananciasOcasionales = {
  enajenacionActivos: number;
  herencias: number;
  donaciones: number;
  loterias: number;
  seguroVida: number;
  ventaVivienda: number;
  otros: number;
  costos: number;
  goNoGravadas: number;
  impuestoExterior: number;
};

export type Descuentos = {
  impuestosExterior: number;
  donaciones: number;
  ivaActivosFijos: number;
  otros: number;
};

export type LiquidacionExtra = {
  anticipoAnterior: number;
  saldoFavorAnterior: number;
  retenciones: number;
  sanciones: number;
  aporteVoluntario: number;
  impuestoNetoAnterior: number;
  usarPromedioAnticipo: boolean;
  rentaPresuntivaManual: number;
  rentasGravables: number;
  compensacionPerdidas2018: number;
  compensacionExcesoPresuntiva: number;
};

export type TipoCompensacion = "capital" | "noLaborales" | "honorarios" | "general2018" | "presuntiva";

export type RegistroPerdidaCompensable = {
  id: string;
  anioOrigen: number;
  tipo: TipoCompensacion;
  perdidaOriginal: number;
  compensadoPrevio: number;
  reajusteFiscalPct?: number;
  valorACompensar: number;
  notas?: string;
};

export type Declaration = {
  year: TaxYear;
  /** UVT digitada por el usuario. Si hay valor > 0 para un año, sustituye la tabla oficial. */
  uvtOverrides: UvtOverrides;
  identity: Identity;
  topes: TopesInput;
  patrimonio: Patrimonio;
  trabajo: Trabajo;
  honorarios: Honorarios;
  capital: Capital;
  noLaborales: NoLaborales;
  pensiones: Pensiones;
  dividendos: Dividendos;
  gananciasOcasionales: GananciasOcasionales;
  descuentos: Descuentos;
  extra: LiquidacionExtra;
  /** Historial detallado de pérdidas fiscales y excesos de presuntiva (Arts. 147 y 189 E.T.) */
  historialPerdidas?: RegistroPerdidaCompensable[];
};

export type CasillaMap = Record<number, number>;

export type ComputedDeclaration = {
  year: TaxYear;
  filingYear: number;
  uvt: number;
  uvtFiling: number;
  uvtOverridden: boolean;
  casillas: CasillaMap;
  alerts: TaxAlert[];
  obligado: boolean;
  razonesObligado: string[];
  saldoPagar: number;
  saldoFavor: number;
  impuestoNeto: number;
  impuestoCargo: number;
  rentaLiquidaGravable: number;
  progress: { filled: number; total: number; pct: number };
  depuracion: DepuracionCedula;
};

export type DepuracionCedula = {
  ingresosBrutos: number;
  incrngo: number;
  subtotal: number;
  cuarentaPct: number;
  tope1340: number;
  poolLimit: number;
  limitedUsed: number;
  ilimitadas: number;
  dependientes72: number;
  facturaElectronica: number;
  total92: number;
};

export const emptyIdentity = (): Identity => ({
  nit: "",
  dv: "",
  primerApellido: "",
  segundoApellido: "",
  primerNombre: "",
  otrosNombres: "",
  dirSeccional: "03",
  actividadCiiu: "0010",
  numeroFormulario: "",
  esCorreccion: false,
  codCorreccion: "",
  formAnterior: "",
  fraccionAnioSiguiente: false,
  primeraVez: false,
  aniosDeclarando: 3,
  responsableIva: false,
  llevaLibros: false,
  sucursalIliquida: false,
  residente: true,
  zonaSismo1226: false,
});

export const emptyTopes = (): TopesInput => ({
  ingresosBrutos: 0,
  patrimonioBruto: 0,
  consumosTarjeta: 0,
  compras: 0,
  consignaciones: 0,
});

export const emptyPatrimonio = (): Patrimonio => ({
  efectivo: 0,
  cuentas: 0,
  inversiones: 0,
  inventarios: 0,
  inmuebles: 0,
  vehiculos: 0,
  muebles: 0,
  cuentasPorCobrar: 0,
  cripto: 0,
  otrosActivos: 0,
  viviendaHabitacion: 0,
  aportesSociedadesNacionales: 0,
  obligacionesFinancieras: 0,
  cuentasPorPagar: 0,
  impuestosPorPagar: 0,
  otrasDeudas: 0,
  patrimonioLiquidoAnterior: 0,
});

export const emptyTrabajo = (): Trabajo => ({
  salarios: 0,
  honorariosSinCostos: 0,
  cesantiasPagadas: 0,
  otrasPrestaciones: 0,
  otrosPagosLaborales: 0,
  ingresosEspecie: 0,
  ingresosExterior: 0,
  promedioMensual6m: 0,
  aportesPensionObligatorios: 0,
  aportesSaludObligatorios: 0,
  aportesVoluntariosRais: 0,
  apoyosEducativos: 0,
  otrosINCRNGO: 0,
  aportesAfcFvpAvc: 0,
  cesantiasAcumuladas2016: 0,
  indemnizaciones: 0,
  primasDiplomaticas: 0,
  gastosRepresentacion: 0,
  ffmmPrestaciones: 0,
  ffmmExcesoSalario: 0,
  rentasCan: 0,
  otrasExentasIlimitadas: 0,
  otrasExentas: 0,
  interesesVivienda: 0,
  medicinaPrepagada: 0,
  gmf: 0,
  dependientes: 0,
  icetex: 0,
  fnceAnual: 0,
  otrasDeducciones: 0,
  comprasFacturaElectronica: 0,
});

export const emptyHonorarios = (): Honorarios => ({
  usarCostos: false,
  ingresos: 0,
  incrngo: 0,
  aportesPension: 0,
  aportesSalud: 0,
  aportesRais: 0,
  costos: 0,
  aportesAfc: 0,
  rentasCan: 0,
  otrasExentas: 0,
  interesesVivienda: 0,
  gmf: 0,
  icetex: 0,
  medicinaPrepagada: 0,
  aportesCesantiasIndependiente: 0,
  fnceAnual: 0,
  otrasDeducciones: 0,
  compensacionPerdidas: 0,
});

export const emptyCapital = (): Capital => ({
  intereses: 0,
  arrendamientos: 0,
  regalias: 0,
  rendimientosFinancieros: 0,
  explotacionIntangibles: 0,
  ingresosExterior: 0,
  incrngo: 0,
  componenteInflacionario: 0,
  aportesPension: 0,
  aportesSalud: 0,
  aportesRais: 0,
  costos: 0,
  ecePasiva: 0,
  aportesAfc: 0,
  rentasCan: 0,
  otrasExentas: 0,
  interesesVivienda: 0,
  gmf: 0,
  icetex: 0,
  aportesCesantiasIndependiente: 0,
  fnceAnual: 0,
  otrasDeducciones: 0,
  compensacionPerdidas: 0,
});

export const emptyNoLaborales = (): NoLaborales => ({
  ingresos: 0,
  ventas: 0,
  recompensas: 0,
  apoyosEconomicos: 0,
  notarios: 0,
  curadores: 0,
  donacionesCampanas: 0,
  demas: 0,
  devoluciones: 0,
  incrngo: 0,
  apoyosEducativos: 0,
  indemnizacionesSeguroDano: 0,
  aportesPension: 0,
  aportesSalud: 0,
  aportesRais: 0,
  costos: 0,
  ecePasiva: 0,
  aportesAfc: 0,
  rentasCan: 0,
  otrasExentas: 0,
  interesesVivienda: 0,
  gmf: 0,
  icetex: 0,
  aportesCesantiasIndependiente: 0,
  fnceAnual: 0,
  otrasDeducciones: 0,
  compensacionPerdidas: 0,
});

export const emptyPensiones = (): Pensiones => ({
  ingresos: 0,
  incrngo: 0,
  meses: 12,
});

export const emptyDividendos = (): Dividendos => ({
  div2016: 0,
  incrngo2016: 0,
  subcedula1: 0,
  subcedula2: 0,
  tarifaSub2: 0.35,
  exterior: 0,
  exentasExterior: 0,
});

export const emptyGO = (): GananciasOcasionales => ({
  enajenacionActivos: 0,
  herencias: 0,
  donaciones: 0,
  loterias: 0,
  seguroVida: 0,
  ventaVivienda: 0,
  otros: 0,
  costos: 0,
  goNoGravadas: 0,
  impuestoExterior: 0,
});

export const emptyDescuentos = (): Descuentos => ({
  impuestosExterior: 0,
  donaciones: 0,
  ivaActivosFijos: 0,
  otros: 0,
});

export const emptyExtra = (): LiquidacionExtra => ({
  anticipoAnterior: 0,
  saldoFavorAnterior: 0,
  retenciones: 0,
  sanciones: 0,
  aporteVoluntario: 0,
  impuestoNetoAnterior: 0,
  usarPromedioAnticipo: false,
  rentaPresuntivaManual: 0,
  rentasGravables: 0,
  compensacionPerdidas2018: 0,
  compensacionExcesoPresuntiva: 0,
});

export function emptyDeclaration(year: TaxYear = 2025): Declaration {
  return {
    year,
    uvtOverrides: {},
    identity: emptyIdentity(),
    topes: emptyTopes(),
    patrimonio: emptyPatrimonio(),
    trabajo: emptyTrabajo(),
    honorarios: emptyHonorarios(),
    capital: emptyCapital(),
    noLaborales: emptyNoLaborales(),
    pensiones: emptyPensiones(),
    dividendos: emptyDividendos(),
    gananciasOcasionales: emptyGO(),
    descuentos: emptyDescuentos(),
    extra: emptyExtra(),
    historialPerdidas: [],
  };
}
