import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, applyPathAmounts } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { parseExogenaExcel, type ExogenaParseResult } from "@/lib/docs/exogena-parser";

export function ExogenaImportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const addDoc = useAppStore((s) => s.addDoc);

  const [fileData, setFileData] = useState<ExogenaParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [updateIdentity, setUpdateIdentity] = useState(true);

  if (!isOpen) return null;

  function handleFile(file: File) {
    setError(null);
    setIsApplied(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        setError("No se pudo leer el archivo seleccionado.");
        return;
      }
      const result = parseExogenaExcel(buffer);
      if (!result.ok) {
        setError(result.error || "El archivo no tiene el formato estándar de Exógena DIAN.");
      } else {
        setFileData(result);
      }
    };
    reader.onerror = () => {
      setError("Error al cargar el archivo.");
    };
    reader.readAsArrayBuffer(file);
  }

  function handleApply() {
    if (!fileData) return;

    patch((draft) => {
      // 1. Actualizar identidad si está marcado y hay datos
      if (updateIdentity) {
        if (fileData.nit) {
          draft.identity.nit = fileData.nit;
          if (fileData.nit.length >= 2) {
            draft.identity.dv = calcularDV(fileData.nit);
          }
        }
        if (fileData.nombre) {
          const parts = fileData.nombre.split(" ").filter(Boolean);
          if (parts.length >= 3) {
            draft.identity.primerApellido = parts[0];
            draft.identity.segundoApellido = parts[1];
            draft.identity.primerNombre = parts.slice(2).join(" ");
          } else if (parts.length === 2) {
            draft.identity.primerApellido = parts[0];
            draft.identity.primerNombre = parts[1];
          } else {
            draft.identity.primerNombre = fileData.nombre;
          }
        }
        if (fileData.year) {
          draft.year = fileData.year as any;
        }
      }

      // 2. Aplicar montos clasificados a las cédulas correspondientes
      applyPathAmounts(draft, fileData.amountsToApply);

      // Respaldo directo por resumen consolidado
      const res = fileData.resumen;
      if (res.ingresosTrabajo > 0) draft.trabajo.salarios = Math.max(draft.trabajo.salarios, res.ingresosTrabajo);
      if (res.saludObligatoria > 0) draft.trabajo.aportesSaludObligatorios = Math.max(draft.trabajo.aportesSaludObligatorios, res.saludObligatoria);
      if (res.pensionObligatoria > 0) draft.trabajo.aportesPensionObligatorios = Math.max(draft.trabajo.aportesPensionObligatorios, res.pensionObligatoria);
      if (res.cesantias > 0) draft.trabajo.cesantiasPagadas = Math.max(draft.trabajo.cesantiasPagadas, res.cesantias);
      if (res.ingresosHonorarios > 0) draft.honorarios.ingresos = Math.max(draft.honorarios.ingresos, res.ingresosHonorarios);
      if (res.ingresosCapital > 0) draft.capital.intereses = Math.max(draft.capital.intereses, res.ingresosCapital);
      if (res.ingresosNoLaborales > 0) draft.noLaborales.ingresos = Math.max(draft.noLaborales.ingresos, res.ingresosNoLaborales);
      if (res.pensiones > 0) draft.pensiones.ingresos = Math.max(draft.pensiones.ingresos, res.pensiones);
      if (res.dividendos > 0) draft.dividendos.subcedula1 = Math.max(draft.dividendos.subcedula1, res.dividendos);
      if (res.gananciasOcasionales > 0) draft.gananciasOcasionales.enajenacionActivos = Math.max(draft.gananciasOcasionales.enajenacionActivos, res.gananciasOcasionales);
      if (res.retencionesFuente > 0) draft.extra.retenciones = Math.max(draft.extra.retenciones, res.retencionesFuente);
      if (res.patrimonioBruto > 0) draft.patrimonio.cuentas = Math.max(draft.patrimonio.cuentas, res.patrimonioBruto);
      if (res.deudas > 0) draft.patrimonio.obligacionesFinancieras = Math.max(draft.patrimonio.obligacionesFinancieras, res.deudas);
      if (res.interesesVivienda > 0) draft.trabajo.interesesVivienda = Math.max(draft.trabajo.interesesVivienda, res.interesesVivienda);
      if (res.medicinaPrepagada > 0) draft.trabajo.medicinaPrepagada = Math.max(draft.trabajo.medicinaPrepagada, res.medicinaPrepagada);
      if (res.facturaElectronica > 0) draft.trabajo.comprasFacturaElectronica = Math.max(draft.trabajo.comprasFacturaElectronica, res.facturaElectronica);

      // 3. Topes de obligación
      const totalIng = res.ingresosTrabajo + res.ingresosHonorarios + res.ingresosCapital + res.ingresosNoLaborales + res.pensiones + res.dividendos + res.gananciasOcasionales;
      if (totalIng > 0) draft.topes.ingresosBrutos = Math.max(draft.topes.ingresosBrutos, totalIng);
      if (res.patrimonioBruto > 0) draft.topes.patrimonioBruto = Math.max(draft.topes.patrimonioBruto, res.patrimonioBruto);
      if (res.consignacionesBancarias > 0) draft.topes.consignaciones = Math.max(draft.topes.consignaciones, res.consignacionesBancarias);
      if (res.consumosTarjetas > 0) draft.topes.consumosTarjeta = Math.max(draft.topes.consumosTarjeta, res.consumosTarjetas);
      if (res.comprasTotales > 0) draft.topes.compras = Math.max(draft.topes.compras, res.comprasTotales);
    });

    // 3. Registrar documento en la bóveda
    addDoc({
      id: crypto.randomUUID(),
      name: `Exógena DIAN AG ${fileData.year || 2025} (${fileData.nombre || fileName})`,
      kind: "otro",
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 0,
      addedAt: new Date().toISOString(),
      notes: `Información Exógena DIAN procesada con ${fileData.items.length} registros de terceros.`,
      extracted: fileData.amountsToApply,
      applied: true,
    });

    setIsApplied(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-bg/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-primary-fg shadow-sm">
              <FileSpreadsheet className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink leading-tight">
                Importador de Información Exógena DIAN
              </h2>
              <p className="text-xs text-muted">
                Carga el archivo Excel descargado de la DIAN para auto-rellenar la declaración
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-forest transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Zona de Arrastre de Archivo */}
          {!fileData && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line hover:border-forest bg-bg/40 p-8 text-center transition-colors cursor-pointer"
              onClick={() => {
                const input = document.getElementById("exogena-file-input") as HTMLInputElement;
                input?.click();
              }}
            >
              <input
                id="exogena-file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="flex size-12 items-center justify-center rounded-full bg-forest-mist text-forest mb-3">
                <Upload className="size-6" />
              </div>
              <p className="text-sm font-bold text-ink">
                Arrastra tu archivo Excel de Exógena DIAN o haz clic para seleccionarlo
              </p>
              <p className="mt-1 text-xs text-muted">
                Formatos compatibles: .xlsx y .xls (Reporte de Información reportada por terceros)
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al interpretar el archivo</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Vista Previa de Datos Extraídos de la Exógena */}
          {fileData && (
            <div className="space-y-6 animate-in fade-in">
              {/* Tarjeta del Contribuyente Detectado */}
              <div className="rounded-2xl border border-line bg-bg/60 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-forest" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Contribuyente Identificado por la DIAN
                    </span>
                  </div>
                  <Badge tone="forest">Año Gravable {fileData.year}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">Nombres / Razón Social:</span>
                    <span className="font-bold text-ink text-sm">{fileData.nombre || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Documento / NIT:</span>
                    <span className="font-mono font-bold text-ink">{fileData.tipoDocumento} {fileData.nit || "(sin NIT)"}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Registros de Terceros:</span>
                    <span className="font-bold text-forest">{fileData.items.length} informantes reportados</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-update-id"
                    checked={updateIdentity}
                    onChange={(e) => setUpdateIdentity(e.target.checked)}
                    className="size-4 accent-forest rounded"
                  />
                  <label htmlFor="chk-update-id" className="text-xs font-medium text-ink cursor-pointer">
                    Actualizar automáticamente los datos de identificación (NIT, DV y Nombres) del cliente
                  </label>
                </div>
              </div>

              {/* Resumen de Cifras Detectadas */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  Resumen de Conceptos Extraídos:
                </p>
                {Object.values(fileData.resumen).every((v) => v === 0) ? (
                  <div className="rounded-xl border border-line bg-amber-50/50 p-4 text-xs text-ink space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-600" />
                      Consulta sin retenciones de empresas reportadas
                    </p>
                    <p className="text-muted leading-relaxed">
                      El reporte oficial de la DIAN no contiene salarios, honorarios ni retenciones con empresas informantes en esta fecha de corte. Esto confirma que la obligación formal de declarar se originó por <strong>movimientos bancarios, compras o consignaciones</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {fileData.resumen.ingresosTrabajo > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Salarios y Pagos Laborales:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.ingresosTrabajo)}</span>
                      </div>
                    )}
                    {fileData.resumen.ingresosHonorarios > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Honorarios y Servicios:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.ingresosHonorarios)}</span>
                      </div>
                    )}
                    {fileData.resumen.ingresosCapital > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Rendimientos e Intereses:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.ingresosCapital)}</span>
                      </div>
                    )}
                    {fileData.resumen.ingresosNoLaborales > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Ventas y Comercio (No Laboral):</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.ingresosNoLaborales)}</span>
                      </div>
                    )}
                    {fileData.resumen.pensiones > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Pensiones de Vejez/Invalidez:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.pensiones)}</span>
                      </div>
                    )}
                    {fileData.resumen.dividendos > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Dividendos y Participaciones:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.dividendos)}</span>
                      </div>
                    )}
                    {fileData.resumen.gananciasOcasionales > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Ganancias Ocasionales:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.gananciasOcasionales)}</span>
                      </div>
                    )}
                    {fileData.resumen.saludObligatoria > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Aportes a Salud Obligatoria:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.saludObligatoria)}</span>
                      </div>
                    )}
                    {fileData.resumen.pensionObligatoria > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Aportes a Pensión Obligatoria:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.pensionObligatoria)}</span>
                      </div>
                    )}
                    {fileData.resumen.retencionesFuente > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Retenciones en la Fuente:</span>
                        <span className="text-sm font-bold text-emerald-700 font-mono">{formatCOP(fileData.resumen.retencionesFuente)}</span>
                      </div>
                    )}
                    {fileData.resumen.patrimonioBruto > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Saldos Bancarios / CDTs / Bienes:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.patrimonioBruto)}</span>
                      </div>
                    )}
                    {fileData.resumen.deudas > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Deudas y Créditos a 31 dic:</span>
                        <span className="text-sm font-bold text-red-700">{formatCOP(fileData.resumen.deudas)}</span>
                      </div>
                    )}
                    {fileData.resumen.interesesVivienda > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Intereses Crédito Vivienda:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.interesesVivienda)}</span>
                      </div>
                    )}
                    {fileData.resumen.medicinaPrepagada > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Medicina Prepagada:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.medicinaPrepagada)}</span>
                      </div>
                    )}
                    {fileData.resumen.facturaElectronica > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Compras Factura Electrónica (1%):</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.facturaElectronica)}</span>
                      </div>
                    )}
                    {fileData.resumen.gmf > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">GMF (4x1000) Pagado:</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.gmf)}</span>
                      </div>
                    )}
                    {fileData.resumen.consignacionesBancarias > 0 && (
                      <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                        <span className="text-[11px] text-muted block">Consignaciones Bancarias (Topes):</span>
                        <span className="text-sm font-bold text-ink">{formatCOP(fileData.resumen.consignacionesBancarias)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tabla Detallada de Terceros Reportantes */}
              {fileData.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Detalle de Información Reportada por Terceros ({fileData.items.length}):
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-line bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-line bg-bg/90 font-semibold text-muted text-[11px]">
                        <tr>
                          <th className="p-2.5">NIT Informante</th>
                          <th className="p-2.5">Nombre / Razón Social</th>
                          <th className="p-2.5">Concepto / Detalle</th>
                          <th className="p-2.5 text-right">Valor Reportado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {fileData.items.map((it, idx) => (
                          <tr key={`ex-item-${idx}`} className="hover:bg-bg/40">
                            <td className="p-2.5 font-mono text-[11px] text-muted">{it.informanteNit || "—"}</td>
                            <td className="p-2.5 font-medium text-ink max-w-[200px] truncate">{it.informanteNombre || "—"}</td>
                            <td className="p-2.5 text-ink-soft max-w-[250px] truncate">{it.detalle || "—"}</td>
                            <td className="p-2.5 text-right font-mono font-semibold text-ink">{formatCOP(it.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-bg/40 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          {fileData ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFileData(null);
                setFileName("");
              }}
            >
              Cambiar Archivo
            </Button>
          ) : (
            <span className="text-muted">DIAN · Muisca Información Exógena Tributaria</span>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            {fileData && (
              <Button
                onClick={handleApply}
                disabled={isApplied}
                className="gap-2 bg-forest text-primary-fg hover:bg-forest-deep px-5 shadow-sm font-semibold text-xs"
              >
                {isApplied ? (
                  <>
                    <Check className="size-4" />
                    ¡Cargado a la Declaración!
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Cargar a la Declaración
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function calcularDV(nit: string): string {
  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const clean = nit.replace(/\D/g, "");
  let z = 0;
  for (let i = 0; i < clean.length; i++) {
    const digito = parseInt(clean[clean.length - 1 - i], 10);
    z += digito * vpri[i];
  }
  const x = z % 11;
  if (x === 0 || x === 1) return String(x);
  return String(11 - x);
}
