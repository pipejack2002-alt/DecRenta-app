import test from "node:test";
import assert from "node:assert/strict";
import { emptyDeclaration } from "./types.ts";
import { compute } from "./engine.ts";
import { calcularComparacionPatrimonial } from "./comparacion-patrimonial.ts";

test("comparacion patrimonial: detecta incremento justificado con rentas del año", () => {
  const d = emptyDeclaration(2025);
  d.patrimonio.patrimonioLiquidoAnterior = 100_000_000;
  d.patrimonio.cuentas = 120_000_000; // Incremento de 20M
  d.trabajo.salarios = 50_000_000;

  const c = compute(d);
  const comp = calcularComparacionPatrimonial(d, c);

  assert.equal(comp.incrementoPatrimonial, 20_000_000);
  assert.equal(comp.esRentaPorComparacion, false);
  assert.equal(comp.semaforo, "justificado");
});

test("comparacion patrimonial: detecta descuadre patrimonial no justificado", () => {
  const d = emptyDeclaration(2025);
  d.patrimonio.patrimonioLiquidoAnterior = 50_000_000;
  d.patrimonio.inmuebles = 300_000_000; // Incremento de 250M
  d.trabajo.salarios = 30_000_000; // Ingresos de solo 30M

  const c = compute(d);
  const comp = calcularComparacionPatrimonial(d, c);

  assert.equal(comp.incrementoPatrimonial, 250_000_000);
  assert.equal(comp.esRentaPorComparacion, true);
  assert.equal(comp.semaforo, "descuadre");
  assert.ok(comp.montoRentaPorComparacion > 200_000_000);
});

test("comparacion patrimonial: ajustes por herencia y valorizacion neutralizan el descuadre", () => {
  const d = emptyDeclaration(2025);
  d.patrimonio.patrimonioLiquidoAnterior = 50_000_000;
  d.patrimonio.inmuebles = 300_000_000; // Incremento de 250M
  d.patrimonio.herenciasLegadosDonaciones = 200_000_000;
  d.patrimonio.valorizacionesJustificadas = 50_000_000;

  const c = compute(d);
  const comp = calcularComparacionPatrimonial(d, c);

  assert.equal(comp.esRentaPorComparacion, false);
  assert.equal(comp.semaforo, "justificado");
});
