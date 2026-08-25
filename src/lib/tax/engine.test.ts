import assert from "node:assert/strict";
import { test } from "node:test";
import { compute } from "./engine.ts";
import { emptyDeclaration } from "./types.ts";
import { dianRoundThousands, pesosFromUvt } from "./uvt.ts";
import { taxArt241 } from "./tarifas.ts";

test("UVT 2025 topes DIAN", () => {
  assert.equal(pesosFromUvt(1, 2025), 49799);
  assert.equal(dianRoundThousands(pesosFromUvt(1400, 2025)), 69719000);
  assert.equal(dianRoundThousands(pesosFromUvt(4500, 2025)), 224096000);
});

test("tabla art. 241: 0 % bajo 1.090 UVT y 19 % encima", () => {
  assert.equal(taxArt241(0, 2025), 0);
  assert.equal(taxArt241(pesosFromUvt(1090, 2025), 2025), 0);
  const mid = taxArt241(pesosFromUvt(1400, 2025), 2025);
  assert.ok(Math.abs(mid - Math.round(58.9 * 49799)) < 2);
});

test("ejemplo asalariada: obligado, 40 % aplica, impuesto neto 0, saldo a favor", () => {
  const d = emptyDeclaration(2025);
  d.identity.nit = "72123456";
  d.identity.residente = true;
  d.identity.aniosDeclarando = 3;
  d.topes = {
    ingresosBrutos: 92400000,
    patrimonioBruto: 268000000,
    consumosTarjeta: 18400000,
    compras: 22100000,
    consignaciones: 96800000,
  };
  d.patrimonio.efectivo = 1200000;
  d.patrimonio.cuentas = 18500000;
  d.patrimonio.inversiones = 8000000;
  d.patrimonio.inmuebles = 220000000;
  d.patrimonio.vehiculos = 18500000;
  d.patrimonio.muebles = 2500000;
  d.patrimonio.viviendaHabitacion = 220000000;
  d.patrimonio.obligacionesFinancieras = 92000000;
  d.patrimonio.patrimonioLiquidoAnterior = 158000000;
  d.trabajo.salarios = 78000000;
  d.trabajo.cesantiasPagadas = 6500000;
  d.trabajo.otrasPrestaciones = 7900000;
  d.trabajo.promedioMensual6m = 6500000;
  d.trabajo.aportesPensionObligatorios = 3120000;
  d.trabajo.aportesSaludObligatorios = 3120000;
  d.trabajo.aportesAfcFvpAvc = 2400000;
  d.trabajo.interesesVivienda = 7800000;
  d.trabajo.medicinaPrepagada = 2100000;
  d.trabajo.gmf = 420000;
  d.trabajo.dependientes = 1;
  d.trabajo.comprasFacturaElectronica = 8500000;
  d.capital.intereses = 980000;
  d.capital.componenteInflacionario = 210000;
  d.extra.retenciones = 2850000;
  d.extra.impuestoNetoAnterior = 2100000;

  const c = compute(d);
  assert.equal(c.casillas[32], 92400000);
  assert.equal(c.casillas[33], 6240000);
  assert.equal(c.casillas[34], 86160000);
  assert.equal(c.casillas[35], 2400000);
  assert.equal(c.casillas[28], 85000);
  assert.equal(c.casillas[138], 1);
  assert.equal(c.casillas[139], 72 * 49799);
  assert.ok(c.obligado, "patrimonio e ingresos cruzan topes");
  assert.ok(c.alerts.some((a) => a.id === "limite-40"));
  assert.equal(c.impuestoNeto, 0);
  assert.equal(c.saldoFavor, 2850000);
  assert.equal(c.saldoPagar, 0);
  assert.equal(c.casillas[29], 268700000);
  assert.equal(c.casillas[31], 176700000);
});

test("25 % art. 206 se calcula después de INCRNGO, exentas y deducciones, tope 790 UVT", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 40_000_000;
  d.trabajo.aportesPensionObligatorios = 1_600_000;
  d.trabajo.aportesSaludObligatorios = 1_600_000;
  const c = compute(d);
  assert.equal(c.casillas[36], 9_200_000);
});

test("AFC global no supera 3.800 UVT entre cédulas", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 800_000_000;
  d.trabajo.aportesAfcFvpAvc = 400_000_000;
  d.capital.intereses = 800_000_000;
  d.capital.aportesAfc = 400_000_000;
  const c = compute(d);
  assert.equal(c.casillas[35] + c.casillas[63], pesosFromUvt(3800, 2025));
  assert.ok(c.alerts.some((a) => a.id === "afc-global"));
});

test("seguro de vida: 3.250 UVT exentos, exceso a GO 15 %", () => {
  const d = emptyDeclaration(2025);
  d.gananciasOcasionales.seguroVida = pesosFromUvt(4000, 2025);
  const c = compute(d);
  assert.equal(c.casillas[114], pesosFromUvt(3250, 2025));
  assert.equal(c.casillas[115], pesosFromUvt(750, 2025));
  assert.equal(c.casillas[127], Math.round(pesosFromUvt(750, 2025) * 0.15));
});

test("no residente: alerta de bloqueo formulario 210", () => {
  const d = emptyDeclaration(2025);
  d.identity.residente = false;
  const c = compute(d);
  assert.ok(c.alerts.some((a) => a.id === "no-residente" && a.level === "block"));
});

test("casilla 140 si costos honorarios > 60 %", () => {
  const d = emptyDeclaration(2025);
  d.honorarios.usarCostos = true;
  d.honorarios.ingresos = 10_000_000;
  d.honorarios.costos = 7_000_000;
  const c = compute(d);
  assert.equal(c.casillas[140], 1);
  assert.ok(c.alerts.some((a) => a.id === "tope-336-1"));
});

test("descuento donación ESAL es el 25 % de la base", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 200_000_000;
  d.descuentos.donaciones = 4_000_000;
  const c = compute(d);
  assert.ok((c.casillas[121] ?? 0) > 0);
  assert.equal(c.casillas[123], 1_000_000);
});

test("UVT digitada recalcula 72 UVT de dependientes y topes", () => {
  const d = emptyDeclaration(2025);
  d.uvtOverrides = { 2025: 50_000 };
  d.trabajo.salarios = 80_000_000;
  d.trabajo.dependientes = 1;
  d.topes.patrimonioBruto = 224_096_000;
  const c = compute(d);
  assert.equal(c.uvt, 50_000);
  assert.equal(c.casillas[139], 72 * 50_000);
  assert.equal(c.uvtOverridden, true);
  assert.equal(dianRoundThousands(pesosFromUvt(4500, 2025, d.uvtOverrides)), 225_000_000);
});

test("UVT de presentación rige la sanción mínima", () => {
  const d = emptyDeclaration(2025);
  d.uvtOverrides = { 2026: 60_000 };
  d.extra.sanciones = 100_000;
  const c = compute(d);
  assert.equal(c.uvtFiling, 60_000);
  assert.ok(c.alerts.some((a) => a.id === "sancion-minima"));
});

test("depuración 40 % replica el ejemplo DIAN (150 M, 20 M INCR, 2 dependientes, 1 % FE)", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 150_000_000;
  d.trabajo.aportesPensionObligatorios = 10_000_000;
  d.trabajo.aportesSaludObligatorios = 10_000_000;
  d.trabajo.otrasExentasIlimitadas = 10_000_000;
  d.trabajo.dependientes = 2;
  d.trabajo.comprasFacturaElectronica = 200_000_000;
  const c = compute(d);
  assert.equal(c.depuracion.ingresosBrutos, 150_000_000);
  assert.equal(c.depuracion.incrngo, 20_000_000);
  assert.equal(c.depuracion.subtotal, 130_000_000);
  assert.equal(c.depuracion.cuarentaPct, 52_000_000);
  assert.equal(c.depuracion.poolLimit, 52_000_000);
  assert.equal(c.depuracion.ilimitadas, 10_000_000);
  assert.equal(c.depuracion.dependientes72, 2 * 72 * 49799);
  assert.equal(c.depuracion.facturaElectronica, 2_000_000);
  assert.equal(c.casillas[92], c.depuracion.total92);
});

test("ICETEX global no supera 100 UVT entre cédulas (art. 119)", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 80_000_000;
  d.trabajo.icetex = 8_000_000;
  d.capital.intereses = 40_000_000;
  d.capital.icetex = 8_000_000;
  const c = compute(d);
  const ice = (c.casillas[39] ?? 0) + (c.casillas[67] ?? 0);
  assert.ok(ice <= pesosFromUvt(100, 2025) + 1);
  assert.ok(c.alerts.some((a) => a.id === "icetex-global"));
});

test("cesantías de independiente: tope 1/12 y 2.500 UVT, no en trabajo", () => {
  const d = emptyDeclaration(2025);
  d.honorarios.usarCostos = true;
  d.honorarios.ingresos = 120_000_000;
  d.honorarios.aportesCesantiasIndependiente = 20_000_000;
  const c = compute(d);
  const cap12 = Math.round(c.casillas[46] / 12);
  assert.ok((c.casillas[51] ?? 0) <= cap12 + 1);
  assert.ok((c.casillas[51] ?? 0) <= pesosFromUvt(2500, 2025) + 1);
});

test("apoyos educativos art. 46 entran a INCRNGO de trabajo", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.salarios = 50_000_000;
  d.trabajo.apoyosEducativos = 2_000_000;
  const c = compute(d);
  assert.equal(c.casillas[33], 2_000_000);
  assert.equal(c.casillas[34], 48_000_000);
});

test("exportación XML DIAN y CSV contiene casillas y estructura requerida", async () => {
  const { generateFormulario210Xml, generateFormulario210Csv } = await import("./export-dian.ts");
  const d = emptyDeclaration(2025);
  d.identity.nit = "900123456";
  d.identity.dv = "7";
  d.identity.primerNombre = "Carlos";
  d.identity.primerApellido = "Gómez";
  d.trabajo.salarios = 80_000_000;
  const c = compute(d);

  const xml = generateFormulario210Xml(d, c);
  assert.ok(xml.includes('formulario="210"'));
  assert.ok(xml.includes("<nit>900123456</nit>"));
  assert.ok(xml.includes("<primerNombre>Carlos</primerNombre>"));
  assert.ok(xml.includes('<casilla num="32"'));

  const csv = generateFormulario210Csv(d, c);
  assert.ok(csv.includes("NIT (Casilla 5);900123456"));
  assert.ok(csv.includes("DV (Casilla 6);7"));
  assert.ok(csv.includes("32;"));
});

test("historial de pérdidas: alerta de caducidad cuando se superan 12 años o 5 en presuntiva", () => {
  const d = emptyDeclaration(2025);
  d.historialPerdidas = [
    {
      id: "p1",
      anioOrigen: 2010, // > 12 años en post-2016, pero 2010 fue pre-2016
      tipo: "capital",
      perdidaOriginal: 10_000_000,
      compensadoPrevio: 0,
      valorACompensar: 5_000_000,
    },
    {
      id: "p2",
      anioOrigen: 2017, // 2025 - 2017 = 8 años <= 12 años (vigente)
      tipo: "noLaborales",
      perdidaOriginal: 20_000_000,
      compensadoPrevio: 0,
      valorACompensar: 5_000_000,
    },
    {
      id: "p3",
      anioOrigen: 2018, // Presuntiva: 2025 - 2018 = 7 años > 5 años (vencida)
      tipo: "presuntiva",
      perdidaOriginal: 15_000_000,
      compensadoPrevio: 0,
      valorACompensar: 3_000_000,
    },
  ];
  const c = compute(d);
  assert.ok(c.alerts.some((a) => a.id === "presuntiva-vencida-p3"));
  assert.ok(!c.alerts.some((a) => a.id === "perdida-vencida-p2"));
});

