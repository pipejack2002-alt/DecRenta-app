import test from "node:test";
import assert from "node:assert/strict";
import { calcularAnticipoRenta } from "./anticipo.ts";

test("anticipo: primer año aplica 25 %", () => {
  const res = calcularAnticipoRenta({
    impuestoNetoActual: 10_000_000,
    retencionesSufridas: 1_000_000,
    tipoDeclaracion: "primer_ano",
  });

  assert.equal(res.porcentajeAnticipo, 25);
  // 25% de 10M = 2.5M - 1M = 1.5M
  assert.equal(res.anticipoProcedimiento1, 1_500_000);
});

test("anticipo: tercer año aplica 75 % y compara con promedio", () => {
  const res = calcularAnticipoRenta({
    impuestoNetoActual: 10_000_000,
    impuestoNetoAnterior: 4_000_000, // Promedio = 7M
    retencionesSufridas: 1_000_000,
    tipoDeclaracion: "tercer_ano_mas",
  });

  assert.equal(res.porcentajeAnticipo, 75);
  // Proc 1: 75% de 10M = 7.5M - 1M = 6.5M
  assert.equal(res.anticipoProcedimiento1, 6_500_000);
  // Proc 2: 75% de 7M = 5.25M - 1M = 4.25M
  assert.equal(res.anticipoProcedimiento2, 4_250_000);
  // Recomendación: Opción 2 con ahorro de 2.25M
  assert.equal(res.opcionRecomendada, 2);
  assert.equal(res.anticipoSugerido, 4_250_000);
  assert.equal(res.ahorroPorOpcion, 2_250_000);
});
