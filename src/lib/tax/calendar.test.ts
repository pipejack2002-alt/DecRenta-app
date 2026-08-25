import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deadlineForNit,
  lastTwoNitDigits,
  RENTA_DEADLINES_2026,
  RENTA_DEADLINES_DECRETO_1226,
} from "./calendar.ts";

test("cédula colombiana: últimos dos dígitos sin DV", () => {
  assert.equal(lastTwoNitDigits("72123456"), "56");
  assert.equal(lastTwoNitDigits("72.123.456-8"), "56");
  assert.equal(lastTwoNitDigits("01"), "01");
  assert.equal(lastTwoNitDigits("5"), null);
});

test("calendario general 2026 coincide con Comunicado DIAN 090", () => {
  const hit = deadlineForNit("10000001");
  assert.equal(hit?.iso, "2026-08-12");
  assert.equal(hit?.regime, "general");
  assert.equal(deadlineForNit("10000014")?.iso, "2026-08-21");
  assert.equal(deadlineForNit("10000016")?.iso, "2026-08-24");
  assert.equal(deadlineForNit("10000000")?.iso, "2026-10-26");
  assert.equal(deadlineForNit("10000082")?.iso, "2026-10-13");
  assert.equal(RENTA_DEADLINES_2026.length, 50);
});

test("Decreto 1226 corre 01–26 y no toca 27–00", () => {
  const a = deadlineForNit("10000002", { zonaSismo1226: true });
  assert.equal(a?.iso, "2026-10-27");
  assert.equal(a?.regime, "decreto-1226");
  const b = deadlineForNit("10000026", { seccional: "24" });
  assert.equal(b?.iso, "2026-11-13");
  const c = deadlineForNit("10000028", { zonaSismo1226: true });
  assert.equal(c?.iso, "2026-09-01");
  assert.equal(c?.regime, "general");
  assert.equal(RENTA_DEADLINES_DECRETO_1226.length, 13);
});

test("seccional Cali activa el plazo especial; Barranquilla no", () => {
  assert.equal(deadlineForNit("10000001", { seccional: "24" })?.regime, "decreto-1226");
  assert.equal(deadlineForNit("10000001", { seccional: "01" })?.regime, "general");
});
