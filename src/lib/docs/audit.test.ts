import assert from "node:assert/strict";
import { test } from "node:test";
import { compute } from "../tax/engine.ts";
import { emptyDeclaration } from "../tax/types.ts";
import { auditExpediente, findingsSummary } from "./audit.ts";
import { cartaProveedor, providerAsks } from "./proveedores.ts";
import type { VaultDoc } from "./types.ts";

function doc(kind: VaultDoc["kind"]): VaultDoc {
  return {
    id: kind,
    kind,
    name: kind,
    mime: "text/plain",
    size: 1,
    addedAt: "2026-01-01",
    notes: "",
  };
}

test("sin datos: banco y DIAN se piden; empleador no", () => {
  const d = emptyDeclaration(2025);
  const c = compute(d);
  const asks = providerAsks(d, c, []);
  assert.equal(asks.find((a) => a.id === "banco")?.needed, true);
  assert.equal(asks.find((a) => a.id === "dian")?.needed, true);
  assert.equal(asks.find((a) => a.id === "empleador")?.needed, false);
  const findings = auditExpediente(d, c, []);
  assert.ok(findings.some((f) => f.id === "sin-nit"));
  assert.ok(findings.some((f) => f.id === "miss-banco-certGmf"));
  assert.ok(findings.some((f) => f.id === "miss-dian-rut"));
});

test("salarios activan al empleador y la carta cita el NIT", () => {
  const d = emptyDeclaration(2025);
  d.identity.nit = "72123456";
  d.identity.dv = "8";
  d.identity.primerNombre = "Ana";
  d.identity.primerApellido = "García";
  d.trabajo.salarios = 80_000_000;
  const c = compute(d);
  const asks = providerAsks(d, c, []);
  const emp = asks.find((a) => a.id === "empleador");
  assert.ok(emp?.needed);
  assert.ok(emp?.missing.includes("formato220"));
  const carta = cartaProveedor(emp!, d);
  assert.match(carta, /72123456-8/);
  assert.match(carta, /Formato 220/);
  assert.match(carta, /Ana García/);
});

test("vivienda mayor que inmuebles es bloqueo", () => {
  const d = emptyDeclaration(2025);
  d.patrimonio.inmuebles = 100;
  d.patrimonio.viviendaHabitacion = 200;
  const c = compute(d);
  const findings = auditExpediente(d, c, []);
  const block = findings.find((f) => f.id === "viv-mayor");
  assert.equal(block?.level, "block");
  const sum = findingsSummary(findings);
  assert.ok(sum.block >= 1);
});

test("con Formato 220 y RUT no pide esos soportes", () => {
  const d = emptyDeclaration(2025);
  d.identity.nit = "72123456";
  d.trabajo.salarios = 80_000_000;
  const c = compute(d);
  const docs = [doc("formato220"), doc("pila"), doc("rut"), doc("form210Anterior"), doc("certGmf")];
  const asks = providerAsks(d, c, docs);
  const emp = asks.find((a) => a.id === "empleador");
  assert.deepEqual(emp?.missing, []);
  const findings = auditExpediente(d, c, docs);
  assert.ok(!findings.some((f) => f.id === "miss-empleador-formato220"));
  assert.ok(!findings.some((f) => f.id === "sin-nit"));
});

test("1 % FE sin archivo genera hallazgo", () => {
  const d = emptyDeclaration(2025);
  d.trabajo.comprasFacturaElectronica = 8_500_000;
  const c = compute(d);
  const findings = auditExpediente(d, c, []);
  assert.ok(findings.some((f) => f.id === "fe-sin-archivo"));
});
