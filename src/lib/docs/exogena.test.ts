import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseExogenaExcel } from "./exogena-parser.ts";

test("exogena parser: lee archivo oficial de la DIAN y extrae metadatos del consultante", () => {
  const filePath = path.resolve(process.cwd(), "reporteExogena2025 1.xlsx");
  if (!fs.existsSync(filePath)) {
    console.log("Archivo de prueba no disponible, omitiendo");
    return;
  }

  const buf = fs.readFileSync(filePath);
  const result = parseExogenaExcel(buf);

  assert.equal(result.ok, true);
  assert.equal(result.year, 2025);
  assert.equal(result.nit, "1044608716");
  assert.equal(result.nombre, "VUELBAS VERJEL PRISCILA ALEJANDRA");
  assert.equal(result.tipoDocumento, "C. C.");
});

test("exogena parser: clasifica correctamente topes, salarios, honorarios, cuentas y deudas", () => {
  const filePath = "Exogena Andres Bernal.xlsx";
  if (!fs.existsSync(filePath)) {
    return;
  }

  const buf = fs.readFileSync(filePath);
  const result = parseExogenaExcel(buf);

  assert.equal(result.ok, true);
  assert.equal(result.nit, "1001880133");
  assert.equal(result.nombre, "BERNAL OSORIO ANDRES FELIPE");
  assert.equal(result.items.length, 24);
  assert.equal(result.resumen.ingresosTrabajo, 25342904);
  assert.equal(result.resumen.saludObligatoria, 748800);
  assert.equal(result.resumen.pensionObligatoria, 748800);
  assert.equal(result.resumen.patrimonioBruto, 7271226);
  assert.equal(result.amountsToApply["topes.ingresosBrutos"], 27331800);
  assert.equal(result.amountsToApply["topes.patrimonioBruto"], 7271226);
  assert.equal(result.amountsToApply["topes.consumosTarjeta"], 3792412);
  assert.equal(result.amountsToApply["topes.consignaciones"], 65506416);
});
