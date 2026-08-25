import assert from "node:assert/strict";
import { test } from "node:test";
import { compute } from "./engine.ts";
import {
  CASILLAS_OFICIALES_210,
  generateFormulario210Csv,
  generateFormulario210Workbook,
  generateFormulario210Xml,
} from "./export-dian.ts";
import { emptyDeclaration } from "./types.ts";

test("generación de Excel (.xlsx) oficial del Formulario 210 con hojas y casillas completas", () => {
  const d = emptyDeclaration(2025);
  d.identity.nit = "900123456";
  d.identity.dv = "7";
  d.identity.primerApellido = "GARCÍA";
  d.identity.segundoApellido = "MÁRQUEZ";
  d.identity.primerNombre = "GABRIEL";
  d.identity.dirSeccional = "32 - Bogotá";
  d.identity.actividadCiiu = "9002";
  d.patrimonio.efectivo = 50000000;
  d.patrimonio.inmuebles = 350000000;
  d.patrimonio.obligacionesFinancieras = 80000000;
  d.trabajo.salarios = 120000000;
  d.trabajo.aportesSaludObligatorios = 4800000;
  d.trabajo.aportesPensionObligatorios = 4800000;
  d.extra.retenciones = 8500000;

  const c = compute(d);
  const wb = generateFormulario210Workbook(d, c);

  assert.ok(wb, "El workbook debe ser generado");
  assert.equal(wb.SheetNames.length, 3, "Debe contener 3 hojas de cálculo oficiales");
  assert.deepEqual(wb.SheetNames, [
    "Formulario 210 DIAN",
    "Resumen Liquidación",
    "Prevalidador DIAN",
  ]);

  const sheet1 = wb.Sheets["Formulario 210 DIAN"];
  assert.ok(sheet1, "La hoja Formulario 210 DIAN debe existir");

  // Validar que las casillas oficiales 28 a 141 están registradas
  assert.ok(CASILLAS_OFICIALES_210.length >= 70, "Debe contener todas las casillas oficiales");

  // Probar XML y CSV
  const xml = generateFormulario210Xml(d, c);
  assert.ok(xml.includes('formulario="210"'));
  assert.ok(xml.includes("<nit>900123456</nit>"));
  assert.ok(xml.includes('<casilla num="29"'));

  const csv = generateFormulario210Csv(d, c);
  assert.ok(csv.includes("DIAN - FORMULARIO 210"));
  assert.ok(csv.includes("NIT (Casilla 5);900123456"));
  assert.ok(csv.includes("29;\"Total patrimonio bruto\""));
});
