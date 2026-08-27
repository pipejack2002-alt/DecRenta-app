import { taxArt241, taxArt241_2016, discountArt254_1 } from "./tarifas.ts";
import type { CasillaMap, ComputedDeclaration, Declaration, TaxAlert } from "./types.ts";
import {
  dianRoundThousands,
  filingYearOf,
  normalizeOverrides,
  officialUvt,
  pesosFromUvt,
  pos,
  roundPesos,
  uvtFromPesos,
  uvtIsOfficial,
  uvtValue,
} from "./uvt.ts";

function min3(a: number, b: number, c: number) {
  return Math.min(a, b, c);
}

function cesantiasExemptPct(avgMonthlyUvt: number): number {
  if (avgMonthlyUvt <= 350) return 1;
  if (avgMonthlyUvt <= 410) return 0.9;
  if (avgMonthlyUvt <= 470) return 0.8;
  if (avgMonthlyUvt <= 530) return 0.6;
  if (avgMonthlyUvt <= 590) return 0.4;
  if (avgMonthlyUvt <= 650) return 0.2;
  return 0;
}

function take(pool: { left: number }, want: number, cap: number): number {
  const allowed = Math.max(0, Math.min(want, cap, pool.left));
  pool.left -= allowed;
  return allowed;
}

export function compute(d: Declaration): ComputedDeclaration {
  const year = d.year;
  const ov = normalizeOverrides(d.uvtOverrides);
  const filingYear = filingYearOf(year);
  const uvt = uvtValue(year, ov);
  const uvtFiling = uvtValue(filingYear, ov);
  const alerts: TaxAlert[] = [];
  const C: CasillaMap = {};
  const n = (v: number) => roundPesos(pos(v));

  const U = (k: number) => pesosFromUvt(k, year, ov);

  const t = d.trabajo;
  const h = d.honorarios;
  const k = d.capital;
  const nl = d.noLaborales;
  const p = d.patrimonio;
  const pen = d.pensiones;
  const div = d.dividendos;
  const go = d.gananciasOcasionales;
  const dsc = d.descuentos;
  const x = d.extra;

  // ——— Patrimonio arts. 261–287 ———
  C[29] = n(
    p.efectivo +
      p.cuentas +
      p.inversiones +
      p.inventarios +
      p.inmuebles +
      p.vehiculos +
      p.muebles +
      p.cuentasPorCobrar +
      p.cripto +
      p.otrosActivos,
  );
  C[30] = n(p.obligacionesFinancieras + p.cuentasPorPagar + p.impuestosPorPagar + p.otrasDeudas);
  C[31] = n(C[29] - C[30]);

  // ——— Rentas de trabajo arts. 103, 206, 336 ———
  const honorariosEn32 = h.usarCostos ? 0 : h.ingresos;
  C[32] = n(
    t.salarios +
      t.honorariosSinCostos +
      honorariosEn32 +
      t.cesantiasPagadas +
      t.otrasPrestaciones +
      (t.otrosPagosLaborales || 0) +
      t.ingresosEspecie +
      t.ingresosExterior,
  );

  const raisCapT = min3(t.aportesVoluntariosRais, C[32] * 0.25, U(2500));
  if (t.aportesVoluntariosRais > raisCapT && t.aportesVoluntariosRais > 0) {
    alerts.push({
      id: "rais-cap",
      level: "warn",
      title: "Aportes voluntarios RAIS limitados",
      detail: `Las cotizaciones voluntarias al RAIS son INCRNGO hasta el 25 % del ingreso laboral o tributario, con tope de 2.500 UVT (${formatU(U(2500))}). El excedente no se restó.`,
      source: "Art. 55 E.T. · par. 1 art. 135 Ley 100 de 1993",
      casilla: 33,
      section: "trabajo",
    });
  }

  C[33] = n(
    t.aportesPensionObligatorios +
      t.aportesSaludObligatorios +
      raisCapT +
      t.apoyosEducativos +
      t.otrosINCRNGO,
  );
  if (C[33] > C[32]) C[33] = C[32];
  C[34] = n(C[32] - C[33]);

  const afcCapTrabajo = min3(t.aportesAfcFvpAvc, C[32] * 0.3, U(3800));
  C[35] = C[34] > 0 ? n(afcCapTrabajo) : 0;
  if (t.aportesAfcFvpAvc > afcCapTrabajo && t.aportesAfcFvpAvc > 0) {
    alerts.push({
      id: "afc-cap",
      level: "warn",
      title: "AFC / FVP / AVC limitados",
      detail: `Los aportes AFC, fondos de pensiones voluntarias y AVC no pueden superar el 30 % del ingreso laboral o tributario ni 3.800 UVT (${formatU(U(3800))}). El retiro antes de 10 años hace perder el beneficio (art. 126-1 y 126-4 E.T.).`,
      source: "Arts. 126-1 y 126-4 E.T.",
      casilla: 35,
      section: "trabajo",
    });
  }

  const avgUvt = t.promedioMensual6m > 0 ? uvtFromPesos(t.promedioMensual6m, year, ov) : 0;
  const cesPct = cesantiasExemptPct(avgUvt);
  const cesExempt =
    t.cesantiasAcumuladas2016 > 0
      ? t.cesantiasAcumuladas2016 + t.cesantiasPagadas * cesPct
      : t.cesantiasPagadas * cesPct;

  // Deducción dependientes: 10 % de la renta de trabajo, máx. 32 UVT mensuales = 384 UVT año
  // más 72 UVT por dependiente (máx. 4) que van a casilla 139, fuera del 40 %.
  const dep = Math.max(0, Math.min(4, Math.floor(t.dependientes)));
  const depBase = C[32] > 0 ? C[32] : h.usarCostos ? h.ingresos : 0;
  const depMensual = min3(depBase * 0.1, U(32) * 12, C[32] > 0 ? C[34] : 0);
  const depDeductionT = dep > 0 && C[32] > 0 ? depMensual : 0;
  const depDeductionH = dep > 0 && C[32] === 0 && h.usarCostos ? min3(h.ingresos * 0.1, U(32) * 12, h.ingresos) : 0;

  const medCapT = min3(t.medicinaPrepagada, U(16) * 12, C[34]);
  const gmfDedT = n(t.gmf * 0.5);
  const intVivCap = min3(t.interesesVivienda, U(1200), C[34]);
  const icetexCapT = min3(t.icetex, U(100), C[34]);
  const fnceT = C[34] > 0 ? n(t.fnceAnual) : 0;

  C[38] = C[34] > 0 ? n(intVivCap) : 0;
  C[39] =
    C[34] > 0 ? n(depDeductionT + medCapT + gmfDedT + icetexCapT + fnceT + t.otrasDeducciones) : 0;
  C[40] = n(C[38] + C[39]);

  // 25 % numeral 10 art. 206 — después de INCRNGO, demás exentas y deducciones
  const otrasExLim = t.otrasExentas;
  const otrasExIlim = n(
    t.indemnizaciones +
      t.primasDiplomaticas +
      t.gastosRepresentacion +
      t.ffmmPrestaciones +
      t.ffmmExcesoSalario +
      t.rentasCan +
      t.otrasExentasIlimitadas,
  );
  const pre25 = n(C[34] - C[35] - n(cesExempt) - otrasExLim - otrasExIlim - C[40]);
  const exenta25 = C[32] > 0 ? min3(pre25 * 0.25, U(790), pos(pre25)) : 0;

  C[36] = C[34] > 0 ? n(cesExempt + otrasExLim + otrasExIlim + exenta25) : 0;
  C[37] = n(C[35] + C[36]);

  // ——— Honorarios con costos (casillas 43–57) ———
  C[43] = h.usarCostos ? n(h.ingresos) : 0;
  const raisHonLocal = h.usarCostos ? min3(h.aportesRais, C[43] * 0.25, U(2500)) : 0;
  C[44] = h.usarCostos ? n(h.incrngo + h.aportesPension + h.aportesSalud + raisHonLocal) : 0;
  if (C[44] > C[43]) C[44] = C[43];
  C[45] = h.usarCostos ? n(h.costos) : 0;
  C[46] = n(C[43] - C[44] - C[45]);
  const afcHon = C[46] > 0 ? min3(h.aportesAfc, C[43] * 0.3, U(3800)) : 0;
  C[47] = n(afcHon);
  C[48] = C[46] > 0 ? n(h.otrasExentas + h.rentasCan) : 0;
  C[49] = n(C[47] + C[48]);
  C[50] = C[46] > 0 ? min3(h.interesesVivienda, U(1200), C[46]) : 0;
  const cesIndH = C[46] > 0 ? min3(h.aportesCesantiasIndependiente, U(2500), n(C[46] / 12)) : 0;
  const icetexH = C[46] > 0 ? min3(h.icetex, U(100), C[46]) : 0;
  const medH = C[46] > 0 ? min3(h.medicinaPrepagada, U(16) * 12, C[46]) : 0;
  const gmfH = C[46] > 0 ? n(h.gmf * 0.5) : 0;
  const fnceH = C[46] > 0 ? n(h.fnceAnual) : 0;
  C[51] =
    C[46] > 0
      ? n(h.otrasDeducciones + cesIndH + icetexH + medH + gmfH + fnceH + depDeductionH)
      : 0;
  C[52] = n(C[50] + C[51]);
  const perdidaHon = n(C[44] + C[45] - C[43]);
  C[55] = C[46] === 0 ? perdidaHon : 0;

  if (h.usarCostos && C[43] > 0 && C[45] / C[43] > 0.6) {
    alerts.push({
      id: "tope-336-1",
      level: "warn",
      title: "Superó el tope indicativo del 60 %",
      detail:
        "Los costos y gastos de rentas de trabajo que no provienen de relación laboral superan el 60 % de los ingresos brutos (art. 336-1 E.T.). Debe marcar la casilla 140. Han de estar soportados con factura electrónica, nómina electrónica o documento equivalente.",
      source: "Art. 336-1 E.T.",
      casilla: 140,
      section: "honorarios",
    });
  }

  // ——— Capital ———
  C[58] = n(
    k.intereses +
      k.arrendamientos +
      k.regalias +
      k.rendimientosFinancieros +
      k.explotacionIntangibles +
      k.ingresosExterior,
  );
  const raisCapLocal = min3(k.aportesRais, C[58] * 0.25, U(2500));
  C[59] = n(k.incrngo + k.componenteInflacionario + k.aportesPension + k.aportesSalud + raisCapLocal);
  if (C[59] > C[58]) C[59] = C[58];
  C[60] = n(k.costos);
  C[61] = n(C[58] - C[59] - C[60]);
  C[62] = n(k.ecePasiva);
  const baseCap = n(C[61] + C[62]);
  C[63] = baseCap > 0 ? min3(k.aportesAfc, C[58] * 0.3, U(3800)) : 0;
  C[64] = baseCap > 0 ? n(k.otrasExentas + k.rentasCan) : 0;
  C[65] = n(C[63] + C[64]);
  C[66] = baseCap > 0 ? min3(k.interesesVivienda, U(1200), baseCap) : 0;
  const cesIndK = baseCap > 0 ? min3(k.aportesCesantiasIndependiente, U(2500), n(baseCap / 12)) : 0;
  const icetexK = baseCap > 0 ? min3(k.icetex, U(100), baseCap) : 0;
  const gmfK = baseCap > 0 ? n(k.gmf * 0.5) : 0;
  const fnceK = baseCap > 0 ? n(k.fnceAnual) : 0;
  C[67] = baseCap > 0 ? n(k.otrasDeducciones + cesIndK + icetexK + gmfK + fnceK) : 0;
  C[68] = n(C[66] + C[67]);
  C[71] = baseCap === 0 ? n(C[59] + C[60] - C[58] - C[62]) : 0;

  // ——— No laborales ———
  C[74] = n(
    nl.ingresos +
      nl.ventas +
      nl.recompensas +
      nl.apoyosEconomicos +
      nl.notarios +
      nl.curadores +
      nl.donacionesCampanas +
      nl.demas,
  );
  C[75] = n(nl.devoluciones);
  const raisNLLocal = min3(nl.aportesRais, C[74] * 0.25, U(2500));
  C[76] = n(
    nl.incrngo +
      nl.apoyosEducativos +
      nl.indemnizacionesSeguroDano +
      nl.aportesPension +
      nl.aportesSalud +
      raisNLLocal,
  );
  C[77] = n(nl.costos);
  C[78] = n(C[74] - C[75] - C[76] - C[77]);
  C[79] = n(nl.ecePasiva);
  const baseNL = n(C[78] + C[79]);
  C[80] = baseNL > 0 ? min3(nl.aportesAfc, C[74] * 0.3, U(3800)) : 0;
  C[81] = baseNL > 0 ? n(nl.otrasExentas + nl.rentasCan) : 0;
  C[82] = n(C[80] + C[81]);
  C[83] = baseNL > 0 ? min3(nl.interesesVivienda, U(1200), baseNL) : 0;
  const cesIndN = baseNL > 0 ? min3(nl.aportesCesantiasIndependiente, U(2500), n(baseNL / 12)) : 0;
  const icetexN = baseNL > 0 ? min3(nl.icetex, U(100), baseNL) : 0;
  const gmfN = baseNL > 0 ? n(nl.gmf * 0.5) : 0;
  const fnceN = baseNL > 0 ? n(nl.fnceAnual) : 0;
  C[84] = baseNL > 0 ? n(nl.otrasDeducciones + cesIndN + icetexN + gmfN + fnceN) : 0;
  C[85] = n(C[83] + C[84]);
  C[88] = baseNL === 0 ? n(C[75] + C[76] + C[77] - C[74] - C[79]) : 0;

  // Tope global AFC/FVP/AVC: 3.800 UVT al año (arts. 126-1 y 126-4), no por cédula.
  const afcWanted = C[35] + C[47] + C[63] + C[80];
  const afcPool = { left: U(3800) };
  C[35] = take(afcPool, C[35], C[34]);
  C[47] = take(afcPool, C[47], C[46]);
  C[63] = take(afcPool, C[63], baseCap);
  C[80] = take(afcPool, C[80], baseNL);
  C[37] = n(C[35] + C[36]);
  C[49] = n(C[47] + C[48]);
  C[65] = n(C[63] + C[64]);
  C[82] = n(C[80] + C[81]);
  if (afcWanted > U(3800) + 1) {
    alerts.push({
      id: "afc-global",
      level: "warn",
      title: "Tope global de 3.800 UVT en AFC / FVP / AVC",
      detail: `Los aportes a AFC, fondos de pensiones voluntarias y AVC de todas las cédulas no pueden superar 3.800 UVT al año (${formatU(U(3800))}). Cedulario los distribuyó en este orden: trabajo, honorarios, capital y no laborales.`,
      source: "Arts. 126-1 y 126-4 E.T.",
      casilla: 35,
    });
  }

  // Intereses de vivienda: tope global 1.200 UVT entre cédulas (art. 119)
  const intWanted = C[38] + C[50] + C[66] + C[83];
  const vivPool = { left: U(1200) };
  C[38] = take(vivPool, C[38], C[34]);
  C[50] = take(vivPool, C[50], C[46]);
  C[66] = take(vivPool, C[66], baseCap);
  C[83] = take(vivPool, C[83], baseNL);
  C[40] = n(C[38] + C[39]);
  C[52] = n(C[50] + C[51]);
  C[68] = n(C[66] + C[67]);
  C[85] = n(C[83] + C[84]);
  if (intWanted > U(1200) + 1) {
    alerts.push({
      id: "int-viv-global",
      level: "warn",
      title: "Intereses de vivienda recortados a 1.200 UVT",
      detail: `El art. 119 E.T. limita la deducción de intereses de vivienda a 1.200 UVT por año (${formatU(U(1200))}), sumando todas las cédulas. Cedulario aplicó el tope en orden: trabajo, honorarios, capital y no laborales.`,
      source: "Art. 119 E.T.",
      casilla: 38,
      section: "trabajo",
    });
  }

  // ICETEX: tope global 100 UVT (art. 119)
  const iceWanted = icetexCapT + icetexH + icetexK + icetexN;
  const icePool = { left: U(100) };
  const iceT = take(icePool, icetexCapT, C[34]);
  const iceHo = take(icePool, icetexH, C[46]);
  const iceC = take(icePool, icetexK, baseCap);
  const iceN = take(icePool, icetexN, baseNL);
  C[39] = n(C[39] - (icetexCapT - iceT));
  C[51] = n(C[51] - (icetexH - iceHo));
  C[67] = n(C[67] - (icetexK - iceC));
  C[84] = n(C[84] - (icetexN - iceN));
  C[40] = n(C[38] + C[39]);
  C[52] = n(C[50] + C[51]);
  C[68] = n(C[66] + C[67]);
  C[85] = n(C[83] + C[84]);
  if (iceWanted > U(100) + 1) {
    alerts.push({
      id: "icetex-global",
      level: "warn",
      title: "Intereses ICETEX recortados a 100 UVT",
      detail: `El art. 119 E.T. limita la deducción de intereses de créditos educativos del ICETEX a 100 UVT al año (${formatU(U(100))}), entre todas las cédulas.`,
      source: "Art. 119 E.T.",
      casilla: 39,
      section: "trabajo",
    });
  }

  // Medicina prepagada: 16 UVT mensuales = 192 UVT año, art. 387, solo trabajo y honorarios
  const medWanted = medCapT + medH;
  const medPool = { left: U(16) * 12 };
  const mT = take(medPool, medCapT, C[34]);
  const mH = take(medPool, medH, C[46]);
  C[39] = n(C[39] - (medCapT - mT));
  C[51] = n(C[51] - (medH - mH));
  C[40] = n(C[38] + C[39]);
  C[52] = n(C[50] + C[51]);
  if (medWanted > U(16) * 12 + 1) {
    alerts.push({
      id: "med-192",
      level: "warn",
      title: "Medicina prepagada recortada a 16 UVT mensuales",
      detail: `El art. 387 E.T. limita los pagos a medicina prepagada y seguros de salud a 16 UVT mensuales (${formatU(U(16) * 12)} al año).`,
      source: "Art. 387 E.T.",
      casilla: 39,
    });
  }

  // Cesantías de independiente: 2.500 UVT y 1/12, art. 126-1 (honorarios, capital, no laborales)
  const cesWanted = cesIndH + cesIndK + cesIndN;
  const cesPool = { left: U(2500) };
  const cH = take(cesPool, cesIndH, C[46]);
  const cC = take(cesPool, cesIndK, baseCap);
  const cN = take(cesPool, cesIndN, baseNL);
  C[51] = n(C[51] - (cesIndH - cH));
  C[67] = n(C[67] - (cesIndK - cC));
  C[84] = n(C[84] - (cesIndN - cN));
  C[52] = n(C[50] + C[51]);
  C[68] = n(C[66] + C[67]);
  C[85] = n(C[83] + C[84]);
  if (cesWanted > U(2500) + 1) {
    alerts.push({
      id: "ces-ind-2500",
      level: "warn",
      title: "Aportes de independiente a cesantías recortados a 2.500 UVT",
      detail: `El art. 126-1 E.T. limita los aportes del partícipe independiente a fondos de cesantías a 2.500 UVT y a un doceavo del ingreso gravable de la cédula.`,
      source: "Art. 126-1 E.T.",
    });
  }

  // RAIS global 2.500 UVT (art. 55) — si hay exceso se recorta de cédulas posteriores
  const raisWanted = raisCapT + raisHonLocal + raisCapLocal + raisNLLocal;
  if (raisWanted > U(2500) + 1) {
    alerts.push({
      id: "rais-global",
      level: "warn",
      title: "Cotización voluntaria RAIS recortada a 2.500 UVT",
      detail: `Las cotizaciones voluntarias al RAIS de todas las cédulas no pueden superar 2.500 UVT (${formatU(U(2500))}) ni el 25 % del ingreso tributario de cada cédula (art. 55 E.T.).`,
      source: "Art. 55 E.T.",
      casilla: 33,
    });
  }

  // ——— Límite 40 % / 1.340 UVT art. 336-3 ———
  const ingresosCedula =
    C[32] + C[43] + C[58] + C[62] + C[74] + C[79];
  const incrngoCedula = C[33] + C[44] + C[59] + C[76];
  const base40 = n(ingresosCedula - incrngoCedula);
  const poolLimit = Math.min(base40 * 0.4, U(1340));

  // Ilimitadas (nums. 1–3, 6–8 art. 206, primas, CAN): no consumen el 40 %
  const ilimTrabajo = otrasExIlim;
  const ilimHon = n(h.rentasCan);
  const ilimCap = n(k.rentasCan);
  const ilimNL = n(nl.rentasCan);
  const limitedWantTrabajo = n(C[37] + C[40] - ilimTrabajo);
  const limitedWantHon = n(C[49] + C[52] - ilimHon);
  const limitedWantCap = n(C[65] + C[68] - ilimCap);
  const limitedWantNL = n(C[82] + C[85] - ilimNL);

  const pool = { left: poolLimit };
  const limT = take(pool, limitedWantTrabajo, C[34]);
  const limH = take(pool, limitedWantHon, C[46]);
  const limC = take(pool, limitedWantCap, baseCap);
  const limN = take(pool, limitedWantNL, baseNL);

  C[41] = n(Math.min(C[34], limT + ilimTrabajo));
  C[42] = n(C[34] - C[41]);

  C[53] = n(Math.min(C[46], limH + ilimHon));
  C[54] = n(C[43] - C[44] - C[45] - C[53]);
  C[56] = C[54] > 0 ? Math.min(n(h.compensacionPerdidas), C[54]) : 0;
  C[57] = n(C[54] - C[56]);

  C[69] = n(Math.min(baseCap, limC + ilimCap));
  C[70] = n(C[58] + C[62] - C[59] - C[60] - C[69]);
  C[72] = C[70] > 0 ? Math.min(n(k.compensacionPerdidas), C[70]) : 0;
  C[73] = n(C[70] - C[72]);

  C[86] = n(Math.min(baseNL, limN + ilimNL));
  C[87] = n(C[74] + C[79] - C[75] - C[76] - C[77] - C[86]);
  C[89] = C[87] > 0 ? Math.min(n(nl.compensacionPerdidas), C[87]) : 0;
  C[90] = n(C[87] - C[89]);

  if (limitedWantTrabajo + limitedWantHon + limitedWantCap + limitedWantNL > poolLimit + 1) {
    alerts.push({
      id: "limite-40",
      level: "info",
      title: "Tope del 40 % / 1.340 UVT aplicado",
      detail: `Las rentas exentas y deducciones imputables de la cédula general no pueden superar el 40 % de la renta (máx. 1.340 UVT = ${formatU(U(1340))}). Cedulario las distribuyó en este orden: trabajo, honorarios, capital y no laborales. Quedan ${formatU(pool.left)} de cupo sin usar.`,
      source: "Num. 3 art. 336 E.T. · art. 1.2.1.20.4 DUR 1625/2016",
      casilla: 92,
      section: "liquidacion",
    });
  }

  // 1 % factura electrónica — num. 5 art. 336, no sujeta al 40 %
  const feWant = n(t.comprasFacturaElectronica * 0.01);
  C[28] = Math.min(feWant, U(240));
  if (t.comprasFacturaElectronica > 0 && C[28] === U(240)) {
    alerts.push({
      id: "fe-240",
      level: "info",
      title: "Tope de 240 UVT en el 1 % de factura electrónica",
      detail: `La deducción del 1 % de compras con factura electrónica pagadas por medio electrónico (num. 5 art. 336 E.T.) no puede superar 240 UVT (${formatU(U(240))}).`,
      source: "Num. 5 art. 336 E.T.",
      casilla: 28,
    });
  }

  C[91] = n(C[41] + C[42] + C[53] + C[57] + C[69] + C[73] + C[86] + C[90]);

  C[138] = dep;
  const extraDep = n(Math.min(dep, 4) * U(72));
  const cap139 = n(C[42] + C[57]);
  C[139] = Math.min(extraDep, cap139);

  C[92] = n(C[28] + C[41] + C[53] + C[69] + C[86] + C[139]);
  C[93] = n(C[91] - C[92]);
  C[94] = n(x.compensacionPerdidas2018);
  C[95] = n(x.compensacionExcesoPresuntiva);
  C[96] = n(x.rentasGravables);
  C[97] = n(C[93] + C[96] - C[94] - C[95]);

  if (Array.isArray(d.historialPerdidas)) {
    for (const p of d.historialPerdidas) {
      if (p.valorACompensar > 0) {
        if (p.tipo === "presuntiva" && year - p.anioOrigen > 5) {
          alerts.push({
            id: `presuntiva-vencida-${p.id}`,
            level: "warn",
            title: `Exceso de renta presuntiva del año ${p.anioOrigen} vencido`,
            detail: `El exceso de renta presuntiva del año ${p.anioOrigen} superó el término legal de 5 periodos gravables para su compensación (Par. art. 189 E.T.).`,
            source: "Par. art. 189 E.T.",
            casilla: 95,
            section: "liquidacion",
          });
        } else if (
          (p.tipo === "capital" || p.tipo === "noLaborales" || p.tipo === "honorarios") &&
          p.anioOrigen >= 2017 &&
          year - p.anioOrigen > 12
        ) {
          alerts.push({
            id: `perdida-vencida-${p.id}`,
            level: "warn",
            title: `Pérdida fiscal del año ${p.anioOrigen} (${p.tipo}) vencida`,
            detail: `Las pérdidas fiscales generadas a partir del año gravable 2017 solo pueden compensarse dentro de los 12 periodos gravables siguientes (Art. 147 E.T.).`,
            source: "Art. 147 E.T.",
            casilla: p.tipo === "capital" ? 72 : p.tipo === "noLaborales" ? 89 : 56,
            section: p.tipo === "capital" ? "capital" : p.tipo === "noLaborales" ? "noLaborales" : "honorarios",
          });
        }
      }
    }
  }

  const depuracion = {
    ingresosBrutos: n(ingresosCedula),
    incrngo: n(incrngoCedula),
    subtotal: base40,
    cuarentaPct: n(base40 * 0.4),
    tope1340: U(1340),
    poolLimit: n(poolLimit),
    limitedUsed: n(limT + limH + limC + limN),
    ilimitadas: n(ilimTrabajo + ilimHon + ilimCap + ilimNL),
    dependientes72: C[139],
    facturaElectronica: C[28],
    total92: C[92],
  };

  // Renta presuntiva art. 189 — tarifa 0 % desde Ley 1943/2010 y siguientes; se compara
  // el valor informado (renta de activos exceptuados) contra la cédula general.
  C[98] = n(x.rentaPresuntivaManual);

  const mayorCedula = Math.max(C[97], C[98]);

  // ——— Pensiones art. 206-5 ———
  C[99] = n(pen.ingresos);
  C[100] = n(pen.incrngo);
  C[101] = n(C[99] - C[100]);
  const meses = Math.max(1, Math.min(12, pen.meses || 12));
  const exentaPen = Math.min(C[101], U(1000) * meses);
  C[102] = n(exentaPen);
  C[103] = n(C[101] - C[102]);

  // ——— Dividendos arts. 48, 49, 242, 343 ———
  C[104] = n(div.div2016);
  C[105] = n(div.incrngo2016);
  C[106] = n(C[104] - C[105]);
  C[107] = n(div.subcedula1);
  C[108] = n(div.subcedula2);
  C[109] = n(div.exterior);
  C[110] = n(div.exentasExterior);

  C[118] = n(C[108] * (div.tarifaSub2 || 0.35));
  C[111] = n(mayorCedula + C[103] + C[107] + C[108] - C[118]);

  // ——— Ganancias ocasionales ———
  const ingGO = n(
    go.enajenacionActivos +
      go.herencias +
      go.donaciones +
      go.loterias +
      go.seguroVida +
      go.ventaVivienda +
      go.otros,
  );
  C[112] = ingGO;
  C[113] = n(go.costos);
  const max114 = n(C[112] - C[113]);
  const autoSeguro = min3(go.seguroVida, U(3250), max114);
  const autoVivienda = min3(go.ventaVivienda, U(5000), max114);
  const autoDonGo = min3(n(go.donaciones * 0.2), U(1625), max114);
  const autoHer = min3(go.herencias, U(3250), max114);
  const auto114 = n(autoSeguro + autoVivienda + autoDonGo + autoHer);
  C[114] = Math.min(Math.max(n(go.goNoGravadas), auto114), max114);
  if (auto114 > n(go.goNoGravadas) && auto114 > 0) {
    alerts.push({
      id: "go-auto",
      level: "info",
      title: "Exenciones de ganancia ocasional aplicadas",
      detail: `Cedulario tomó: seguro de vida hasta 3.250 UVT, utilidad en vivienda de habitación hasta 5.000 UVT (si va a AFC o hipoteca, art. 311-1), 20 % de donaciones/legados a extraños hasta 1.625 UVT, y 3.250 UVT de herencia o porción conyugal por asignatario. Si hay vivienda del causante (13.000 UVT) u otros inmuebles (6.500 UVT), súmalos en «GO no gravadas».`,
      source: "Arts. 303-1, 307, 311-1 E.T.",
      casilla: 114,
      section: "go",
    });
  }
  C[115] = n(C[112] - C[113] - C[114]);

  const goLoteria = Math.min(go.loterias, C[115]);
  const goOtras = n(C[115] - goLoteria);
  C[127] = n(goLoteria * 0.2 + goOtras * 0.15);
  C[128] = n(go.impuestoExterior);

  // ——— Impuesto ———
  const usaPresuntiva = C[98] > C[97];
  const impuesto241 = taxArt241(C[111], year, ov);
  C[116] = usaPresuntiva ? 0 : impuesto241;
  C[117] = usaPresuntiva ? impuesto241 : 0;
  C[119] = taxArt241_2016(C[106], year, ov);
  C[120] = n(n(C[109] - C[110]) * 0.35);
  C[121] = n(C[116] + C[117] + C[118] + C[119] + C[120]);

  const descDivBase = n(C[107] + C[108] - C[118]);
  const descDiv = discountArt254_1(descDivBase, year, ov);
  const donaDiscount = n(dsc.donaciones * 0.25);
  const tope30 = n(C[121] * 0.3);
  const donaCapped = Math.min(donaDiscount, tope30);
  C[122] = n(dsc.impuestosExterior);
  C[123] = donaCapped;
  C[124] = n(descDiv + dsc.ivaActivosFijos + dsc.otros);
  C[125] = n(C[122] + C[123] + C[124]);
  if (dsc.donaciones > 0) {
    alerts.push({
      id: "dona-257",
      level: "info",
      title: "Descuento por donación (art. 257)",
      detail: `Se aplicó el 25 % de la donación como descuento a ESAL del régimen especial o entidades no contribuyentes (arts. 22 y 23). El conjunto de descuentos 256, 257 y 257-1 no puede superar el 30 % del impuesto. Inversiones I+D+i (30 %, art. 256) van en «otros descuentos».`,
      source: "Arts. 256 y 257 E.T.",
      casilla: 123,
    });
  }
  if (C[125] > C[121]) {
    alerts.push({
      id: "desc-exceso",
      level: "warn",
      title: "Descuentos superiores al impuesto",
      detail: "Los descuentos tributarios no pueden generar impuesto negativo. Se recortan al impuesto de las rentas líquidas gravables.",
      source: "Arts. 254 a 259 E.T.",
      casilla: 125,
    });
  }
  C[125] = Math.min(C[125], C[121]);
  C[126] = n(C[121] - C[125]);

  C[129] = n(C[126] + C[127] - C[128]);

  C[130] = n(x.anticipoAnterior);
  C[131] = n(x.saldoFavorAnterior);
  C[132] = n(x.retenciones);

  const pctAnticipo = d.identity.primeraVez || d.identity.aniosDeclarando === 1
    ? 0.25
    : d.identity.aniosDeclarando === 2
      ? 0.5
      : 0.75;
  const baseAnticipo = C[126];
  const brutoAnticipo = n(baseAnticipo * pctAnticipo);
  C[133] = n(Math.max(0, brutoAnticipo - C[132]));

  C[135] = n(x.sanciones);
  const minSancion = 10 * uvtFiling;
  if (C[135] > 0 && C[135] < minSancion) {
    alerts.push({
      id: "sancion-minima",
      level: "warn",
      title: "Sanción por debajo de la mínima",
      detail: `La sanción mínima es de 10 UVT del año de presentación (${formatU(minSancion)} con UVT ${filingYear}).`,
      source: "Art. 639 E.T.",
      casilla: 135,
    });
  }

  C[134] = n(C[129] + C[133] - C[130] - C[131] - C[132]);
  C[136] = n(C[129] + C[133] + C[135] - C[130] - C[131] - C[132]);
  C[137] = n(C[130] + C[131] + C[132] - C[129] - C[133] - C[135]);
  C[141] = n(x.aporteVoluntario);
  C[980] = 0;

  C[140] = h.usarCostos && C[43] > 0 && C[45] / C[43] > 0.6 ? 1 : 0;

  // ——— Topes de obligación arts. 592, 593, 594-1, 594-3 ———
  const topesPesos = {
    ingresos: dianRoundThousands(U(1400)),
    patrimonio: dianRoundThousands(U(4500)),
    movimientos: dianRoundThousands(U(1400)),
  };
  const razones: string[] = [];
  if (d.identity.responsableIva) razones.push("Fue responsable de IVA al 31 de diciembre del año gravable (art. 592 E.T.).");
  if (C[29] >= topesPesos.patrimonio || d.topes.patrimonioBruto >= topesPesos.patrimonio) {
    razones.push(`Patrimonio bruto ≥ 4.500 UVT (${formatU(topesPesos.patrimonio)}).`);
  }
  const ingBrutosDeclarados =
    d.topes.ingresosBrutos || C[32] + C[43] + C[58] + C[74] + C[99] + C[104] + C[107] + C[108] + C[109] + C[112];
  if (ingBrutosDeclarados >= topesPesos.ingresos) {
    razones.push(`Ingresos brutos ≥ 1.400 UVT (${formatU(topesPesos.ingresos)}).`);
  }
  if (d.topes.consumosTarjeta >= topesPesos.movimientos) {
    razones.push("Consumos con tarjeta de crédito ≥ 1.400 UVT (art. 594-3 E.T.).");
  }
  if (d.topes.compras >= topesPesos.movimientos) {
    razones.push("Compras y consumos ≥ 1.400 UVT (art. 594-3 E.T.).");
  }
  if (d.topes.consignaciones >= topesPesos.movimientos) {
    razones.push("Consignaciones, depósitos o inversiones ≥ 1.400 UVT (art. 594-3 E.T.).");
  }
  const obligado = razones.length > 0;

  if (!d.identity.residente) {
    alerts.push({
      id: "no-residente",
      level: "block",
      title: "El Formulario 210 es para residentes",
      detail:
        "Las personas naturales no residentes declaran en el Formulario 110. El 210 cubre residentes fiscales y sucesiones ilíquidas de causantes residentes (art. 9 y 10 E.T.).",
      source: "Arts. 9 y 10 E.T. · Resolución 000044 de 2024",
      section: "identidad",
    });
  }

  if (C[29] >= U(100000) || ingBrutosDeclarados >= U(100000)) {
    alerts.push({
      id: "firma-contador",
      level: "warn",
      title: "Requiere firma de contador público",
      detail:
        "Si el patrimonio bruto o los ingresos brutos superan 100.000 UVT, la declaración debe firmarla un contador público (casilla 982).",
      source: "Art. 596 E.T. e instructivo casilla 982",
      casilla: 982,
    });
  }

  // Comparación patrimonial (art. 236 y ss. — renta por comparación)
  const aumentoPatrimonio = n(C[31] - p.patrimonioLiquidoAnterior);
  if (p.patrimonioLiquidoAnterior > 0 && aumentoPatrimonio > C[97] + C[115] + 1) {
    alerts.push({
      id: "comp-pat",
      level: "warn",
      title: "Posible renta por comparación patrimonial",
      detail: `El patrimonio líquido aumentó ${formatU(aumentoPatrimonio)} y la renta líquida gravable más ganancias ocasionales no cubren ese incremento. El art. 236 E.T. puede exigir adicionar la diferencia como renta gravable (casilla 96). Justifique con herencias, donaciones, pasivos, ajustes o ingresos no constitutivos.`,
      source: "Arts. 236 a 239 E.T.",
      casilla: 96,
      section: "patrimonio",
    });
  }

  // Beneficio de auditoría art. 689-3
  if (x.impuestoNetoAnterior > 0 && C[126] > 0) {
    const inc = (C[126] - x.impuestoNetoAnterior) / x.impuestoNetoAnterior;
    const min71 = U(71);
    if (x.impuestoNetoAnterior < min71) {
      alerts.push({
        id: "ba-71",
        level: "info",
        title: "No aplica beneficio de auditoría",
        detail: "Si el impuesto neto del año anterior es inferior a 71 UVT, no procede el beneficio de auditoría (art. 689-3 E.T.).",
        source: "Art. 689-3 E.T.",
      });
    } else if (inc >= 0.35) {
      alerts.push({
        id: "ba-35",
        level: "ok",
        title: "Posible firmeza a 6 meses",
        detail:
          "Si el impuesto neto sube al menos 35 % frente al año anterior, la declaración se presenta a tiempo y se paga en plazo, la liquidación privada puede quedar en firme en 6 meses (art. 689-3, AG 2023-2026).",
        source: "Art. 689-3 E.T.",
      });
    } else if (inc >= 0.25) {
      alerts.push({
        id: "ba-25",
        level: "ok",
        title: "Posible firmeza a 12 meses",
        detail:
          "Con un incremento de al menos 25 % del impuesto neto, la firmeza puede ser de 12 meses si se presentan y pagan en plazo.",
        source: "Art. 689-3 E.T.",
      });
    }
  }

  if (t.gmf > 0) {
    alerts.push({
      id: "gmf-cert",
      level: "info",
      title: "Certifique el GMF",
      detail: "El 50 % del gravamen a los movimientos financieros es deducible si está certificado por el agente retenedor (banco).",
      source: "Art. 115 E.T.",
      casilla: 39,
    });
  }

  if (C[28] > 0) {
    alerts.push({
      id: "fe-reqs",
      level: "info",
      title: "Requisitos del 1 % de factura electrónica",
      detail:
        "La compra no puede haberse tomado como costo, IVA descontable u otro beneficio; debe haber factura electrónica con validación previa a su nombre; pago con tarjeta o medio electrónico de entidad vigilada por la Superfinanciera; y el emisor debe estar obligado a facturar. No genera pérdida.",
      source: "Num. 5 art. 336 E.T.",
      casilla: 28,
    });
  }

  const filledKeys = countFilled(d);
  if (!uvtIsOfficial(year, ov) && !officialUvt(year) && !ov[year]) {
    alerts.push({
      id: "uvt-faltante",
      level: "warn",
      title: "UVT del año gravable no está en la tabla oficial",
      detail: `No hay UVT DIAN cargada para ${year}. Cedulario está usando ${formatU(uvt)} (último valor oficial). Digite la UVT publicada para ese año en el tablero para que topes, tarifas y casillas queden exactos.`,
      source: "Art. 868 E.T.",
    });
  } else if (ov[year] && officialUvt(year) && ov[year] !== officialUvt(year)) {
    alerts.push({
      id: "uvt-override",
      level: "info",
      title: "UVT digitada por usted",
      detail: `La UVT ${year} oficial es ${formatU(officialUvt(year) ?? 0)}. Usted está liquidando con ${formatU(uvt)}. Los topes y la tabla del art. 241 se recalculan con ese valor.`,
      source: "Art. 868 E.T.",
    });
  }

  const computed: ComputedDeclaration = {
    year,
    filingYear,
    uvt,
    uvtFiling,
    uvtOverridden: Boolean(ov[year] || ov[filingYear]),
    casillas: C,
    alerts,
    obligado,
    razonesObligado: razones,
    saldoPagar: C[136],
    saldoFavor: C[137],
    impuestoNeto: C[126],
    impuestoCargo: C[129],
    rentaLiquidaGravable: C[97],
    progress: { filled: filledKeys.filled, total: filledKeys.total, pct: filledKeys.pct },
    depuracion,
  };
  return computed;
}

function formatU(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function countFilled(d: Declaration) {
  const nums: number[] = [];
  const walk = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    for (const v of Object.values(o as Record<string, unknown>)) {
      if (typeof v === "number") nums.push(v);
      else if (v && typeof v === "object" && !Array.isArray(v)) walk(v);
    }
  };
  walk({
    topes: d.topes,
    patrimonio: d.patrimonio,
    trabajo: d.trabajo,
    honorarios: d.honorarios,
    capital: d.capital,
    noLaborales: d.noLaborales,
    pensiones: d.pensiones,
    dividendos: d.dividendos,
    gananciasOcasionales: d.gananciasOcasionales,
    descuentos: d.descuentos,
    extra: d.extra,
  });
  const total = nums.length;
  const filled = nums.filter((n) => n !== 0).length;
  return { filled, total, pct: total ? Math.round((filled / total) * 100) : 0 };
}

export const CASILLA_LABELS: Record<number, string> = {
  28: "1 % compras con factura electrónica",
  29: "Total patrimonio bruto",
  30: "Deudas",
  31: "Total patrimonio líquido",
  32: "Ingresos brutos rentas de trabajo",
  33: "Ingresos no constitutivos de renta (trabajo)",
  34: "Renta líquida rentas de trabajo",
  35: "Rentas exentas AFC / FVP / AVC",
  36: "Otras rentas exentas de trabajo",
  37: "Total rentas exentas de trabajo",
  38: "Deducción intereses de vivienda",
  39: "Otras deducciones imputables",
  40: "Total deducciones imputables de trabajo",
  41: "Exentas y deducciones limitadas (trabajo)",
  42: "Renta líquida ordinaria de trabajo",
  43: "Ingresos brutos honorarios con costos",
  44: "Ingresos no constitutivos de renta (honorarios)",
  45: "Costos y deducciones honorarios",
  46: "Renta líquida honorarios",
  47: "AFC / FVP / AVC honorarios",
  48: "Otras exentas honorarios",
  49: "Total exentas honorarios",
  50: "Intereses de vivienda honorarios",
  51: "Otras deducciones honorarios",
  52: "Total deducciones honorarios",
  53: "Exentas y deducciones limitadas (honorarios)",
  54: "Renta líquida ordinaria del ejercicio honorarios",
  55: "Pérdida líquida honorarios",
  56: "Compensación pérdidas honorarios",
  57: "Renta líquida ordinaria honorarios",
  58: "Ingresos brutos rentas de capital",
  59: "Ingresos no constitutivos de renta (capital)",
  60: "Costos y deducciones capital",
  61: "Renta líquida capital",
  62: "Rentas líquidas pasivas ECE capital",
  63: "AFC / FVP / AVC capital",
  64: "Otras exentas capital",
  65: "Total exentas capital",
  66: "Intereses de vivienda capital",
  67: "Otras deducciones capital",
  68: "Total deducciones capital",
  69: "Exentas y deducciones limitadas (capital)",
  70: "Renta líquida ordinaria del ejercicio capital",
  71: "Pérdida líquida capital",
  72: "Compensación pérdidas capital",
  73: "Renta líquida ordinaria capital",
  74: "Ingresos brutos no laborales",
  75: "Devoluciones, rebajas y descuentos",
  76: "Ingresos no constitutivos de renta (no laborales)",
  77: "Costos y deducciones no laborales",
  78: "Renta líquida no laborales",
  79: "Rentas líquidas pasivas ECE no laborales",
  80: "AFC / FVP / AVC no laborales",
  81: "Otras exentas no laborales",
  82: "Total exentas no laborales",
  83: "Intereses de vivienda no laborales",
  84: "Otras deducciones no laborales",
  85: "Total deducciones no laborales",
  86: "Exentas y deducciones limitadas (no laborales)",
  87: "Renta líquida ordinaria del ejercicio no laborales",
  88: "Pérdida líquida no laborales",
  89: "Compensación pérdidas no laborales",
  90: "Renta líquida ordinaria no laborales",
  91: "Renta líquida cédula general",
  92: "Rentas exentas y deducciones imputables limitadas",
  93: "Renta líquida ordinaria cédula general",
  94: "Compensaciones pérdidas 2018 y anteriores",
  95: "Compensaciones exceso renta presuntiva",
  96: "Rentas gravables",
  97: "Renta líquida gravable cédula general",
  98: "Renta presuntiva",
  99: "Ingresos brutos pensiones",
  100: "Ingresos no constitutivos de renta (pensiones)",
  101: "Renta líquida pensiones",
  102: "Rentas exentas pensiones",
  103: "Renta líquida gravable pensiones",
  104: "Dividendos 2016 y anteriores",
  105: "Ingresos no constitutivos de renta (dividendos 2016)",
  106: "Renta líquida ordinaria 2016 y anteriores",
  107: "1ª subcédula 2017 y siguientes (num. 3 art. 49)",
  108: "2ª subcédula 2017 y siguientes (par. 2 art. 49)",
  109: "Dividendos del exterior",
  110: "Rentas exentas casilla 109",
  111: "Renta líquida gravable (base art. 241)",
  112: "Ingresos por ganancias ocasionales",
  113: "Costos por ganancias ocasionales",
  114: "Ganancias ocasionales no gravadas y exentas",
  115: "Ganancias ocasionales gravables",
  116: "Impuesto cédula general / pensiones / dividendos",
  117: "Impuesto sobre renta presuntiva",
  118: "Impuesto 2ª subcédula (art. 240)",
  119: "Impuesto dividendos 2016",
  120: "Impuesto dividendos del exterior",
  121: "Total impuesto sobre rentas líquidas gravables",
  122: "Descuento impuestos pagados en el exterior",
  123: "Descuento por donaciones",
  124: "Descuento dividendos y otros",
  125: "Total descuentos tributarios",
  126: "Impuesto neto de renta",
  127: "Impuesto de ganancias ocasionales",
  128: "Descuento GO impuestos del exterior",
  129: "Total impuesto a cargo",
  130: "Anticipo renta año gravable anterior",
  131: "Saldo a favor año anterior",
  132: "Retenciones año gravable a declarar",
  133: "Anticipo renta año siguiente",
  134: "Saldo a pagar por impuesto",
  135: "Sanciones",
  136: "Total saldo a pagar",
  137: "Total saldo a favor",
  138: "Número de dependientes económicos",
  139: "Adición por dependientes a la casilla 92",
  140: "Superó tope indicativo art. 336-1",
  141: "Aporte voluntario art. 244-1",
  980: "Pago total",
};
