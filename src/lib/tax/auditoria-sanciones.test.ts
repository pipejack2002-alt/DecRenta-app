import test from "node:test";
import assert from "node:assert/strict";
import { calcularBeneficioAuditoria, calcularSancionExtemporaneidad } from "./auditoria-sanciones.ts";

test("beneficio de auditoria: +35 % otorga firmeza en 6 meses", () => {
  const res = calcularBeneficioAuditoria({
    impuestoNetoAnterior: 5_000_000,
    impuestoNetoActual: 7_000_000, // +40 %
  });

  assert.equal(res.cumpleBaseMinima71Uvt, true);
  assert.equal(res.aplicaFirmeza6Meses, true);
  assert.equal(res.estado, "firme_6m");
});

test("beneficio de auditoria: +25 % otorga firmeza en 12 meses", () => {
  const res = calcularBeneficioAuditoria({
    impuestoNetoAnterior: 5_000_000,
    impuestoNetoActual: 6_300_000, // +26 %
  });

  assert.equal(res.cumpleBaseMinima71Uvt, true);
  assert.equal(res.aplicaFirmeza12Meses, true);
  assert.equal(res.estado, "firme_12m");
});

test("beneficio de auditoria: no aplica si no supera las 71 UVT del año anterior", () => {
  const res = calcularBeneficioAuditoria({
    impuestoNetoAnterior: 500_000, // Menos de 71 UVT
    impuestoNetoActual: 1_000_000,
  });

  assert.equal(res.cumpleBaseMinima71Uvt, false);
  assert.equal(res.estado, "no_aplica");
});

test("sancion extemporaneidad: dentro de plazo da cero", () => {
  const res = calcularSancionExtemporaneidad({
    fechaVencimiento: "2026-09-15",
    fechaPresentacion: "2026-09-10",
    impuestoCargo: 2_000_000,
  });

  assert.equal(res.sancionFinal, 0);
  assert.equal(res.diasMora, 0);
});

test("sancion extemporaneidad: mora con sanción mínima legal", () => {
  const res = calcularSancionExtemporaneidad({
    fechaVencimiento: "2026-08-15",
    fechaPresentacion: "2026-09-01", // 17 días de mora (1 mes)
    impuestoCargo: 100_000, // Sanción 5% = $ 5.000 -> sube a la mínima de 10 UVT ($ 523.000)
    yearPresentacion: 2026,
  });

  assert.equal(res.mesesExtemporaneidad, 1);
  assert.equal(res.sancionFinal, 523_740); // 10 UVT de 2026 ($ 52.374 * 10)
});

test("sancion extemporaneidad: aplica reduccion del 50 % (Art. 640 E.T.)", () => {
  const res = calcularSancionExtemporaneidad({
    fechaVencimiento: "2026-08-15",
    fechaPresentacion: "2026-09-20", // 36 días (2 meses)
    impuestoCargo: 30_000_000, // 10% = 3M
    aplicaReduccion640: true,
    porcentajeReduccion: 50,
  });

  assert.equal(res.sancionPlena, 3_000_000);
  assert.equal(res.sancionConReduccion, 1_500_000);
  assert.equal(res.sancionFinal, 1_500_000);
});
