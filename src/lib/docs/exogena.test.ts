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
