import { createFileRoute, Link } from "@tanstack/react-router";
import { Columns2, Eye, FileText, History, Maximize2, Settings2, Sparkles, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CatalogManagerModal } from "@/components/layout/catalog-manager-modal";
import { CompensacionesDialog } from "@/components/layout/compensaciones-dialog";
import { LiveFormPreview } from "@/components/layout/live-form-preview";
import { MoneyField, TextField, ToggleField } from "@/components/layout/money-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { CASILLA_LABELS } from "@/lib/tax/engine";
import { deadlineForNit, daysUntil, isZonaSismo1226 } from "@/lib/tax/calendar";
import { type TipoCompensacion } from "@/lib/tax/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/declaracion")({ component: DeclaracionPage });

const SECTIONS = [
  { id: "id", label: "Identificación" },
  { id: "pat", label: "Patrimonio" },
  { id: "tr", label: "Trabajo" },
  { id: "hon", label: "Honorarios" },
  { id: "cap", label: "Capital" },
  { id: "nl", label: "No laborales" },
  { id: "pen", label: "Pensiones" },
  { id: "div", label: "Dividendos" },
  { id: "go", label: "Ganancia ocasional" },
  { id: "dsc", label: "Descuentos y cierre" },
] as const;

function DeclaracionPage() {
  const [sec, setSec] = useState<(typeof SECTIONS)[number]["id"]>("id");
  const [splitScreen, setSplitScreen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [compensacionesOpen, setCompensacionesOpen] = useState(false);
  const [initialCompTipo, setInitialCompTipo] = useState<TipoCompensacion>("capital");
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogModalTab, setCatalogModalTab] = useState<"seccionales" | "ciiu">("seccionales");
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const seccionales = useAppStore((s) => s.customSeccionales);
  const ciiuList = useAppStore((s) => s.customCiiu);
  const c = useComputed();
  const y = d.year;

  const [declYearInput, setDeclYearInput] = useState(String(d.year));
  useEffect(() => {
    setDeclYearInput(String(d.year));
  }, [d.year]);

  function openCompensaciones(tipo: TipoCompensacion) {
    setInitialCompTipo(tipo);
    setCompensacionesOpen(true);
  }

  const live = useMemo(() => {
    const pick = (n: number) => ({ n, v: c.casillas[n] ?? 0, l: CASILLA_LABELS[n] });
    return [29, 30, 31, 32, 42, 97, 126, 136, 137].map(pick);
  }, [c.casillas]);

      const fieldGrid = cn("grid gap-4", splitScreen ? "grid-cols-1" : "sm:grid-cols-2");

      return (
        <div className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Formulario 210 · Año Gravable {d.year}</p>
              <h1 className="mt-1 font-display text-4xl font-bold">Diligenciamiento de Cédulas</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Diligencie la información patrimonial y cedular con soporte normativo por casilla. Las rentas exentas (25 % laboral, AFC), deducciones imputables (vivienda, dependientes, GMF) y el límite conjunto del 40 % o 1.340 UVT se aplican automáticamente.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={splitScreen ? "default" : "outline"}
                size="sm"
                onClick={() => setSplitScreen(!splitScreen)}
                title="Alternar vista dividida con el Formulario 210 en tiempo real"
              >
                <Columns2 className="mr-1.5 size-4" />
                {splitScreen ? "Vista estándar" : "Modo dividido (210 en vivo)"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                title="Previsualizar el Formulario 210 en ventana flotante"
              >
                <Maximize2 className="mr-1.5 size-4" />
                Previsualizar 210
              </Button>
            </div>
          </header>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSec(s.id)}
                className={cn(
                  "h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
                  sec === s.id ? "bg-forest text-primary-fg" : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)]",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className={cn("grid gap-6", splitScreen ? "xl:grid-cols-[1fr_1.3fr] lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_18rem]")}>
            <div className="space-y-4 min-w-0">
              {sec === "id" && (
                <Card className="space-y-4">
                  <CardTitle>Datos del declarante y encabezado</CardTitle>
                  <CardHint>Deben coincidir con la hoja principal del RUT (casillas 1 a 12 y 24 a 28).</CardHint>

                  {/* Año gravable y Número de formulario */}
                  <div className={cn("grid gap-4 p-4 bg-muted-mist/40 rounded-xl border border-line", splitScreen ? "grid-cols-1" : "md:grid-cols-2")}>
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">1. Año gravable</p>
                        <span className="text-xs font-mono font-bold text-forest-deep px-2 py-0.5 bg-forest-mist rounded-md">AG {d.year} (Presentación en {d.year + 1})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {([2026, 2025, 2024, 2023] as const).map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => patch((x) => (x.year = yr))}
                            className={cn(
                              "h-9 px-3 rounded-lg border text-xs font-mono font-bold transition-colors",
                              d.year === yr ? "border-forest bg-forest text-white shadow-xs" : "border-line bg-surface text-ink-soft hover:bg-forest-mist",
                            )}
                          >
                            {yr}
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-xs text-muted">Otro:</span>
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="2030"
                            className="w-16 h-9 font-mono text-xs font-bold text-center rounded-lg border border-line bg-white shadow-2xs"
                            value={declYearInput}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setDeclYearInput(val);
                              const y = Number(val);
                              if (y >= 1990 && y <= 2100) patch((x) => (x.year = y));
                            }}
                            onBlur={() => {
                              const y = Number(declYearInput);
                              if (y >= 1990 && y <= 2100) {
                                patch((x) => (x.year = y));
                              } else {
                                setDeclYearInput(String(d.year));
                              }
                            }}
                            title="Digita cualquier año"
                          />
                        </div>
                      </div>
                    </div>
                    <TextField
                      label="4. Número de formulario (Autogenerado o Manual)"
                      value={d.identity.numeroFormulario || ""}
                      placeholder={`210${d.year}000${d.identity.nit ? d.identity.nit.slice(-5) : "41029"}`}
                      onChange={(v) => patch((x) => (x.identity.numeroFormulario = v))}
                      hint="Si lo dejas vacío, se autogenera según nomenclatura DIAN."
                    />
                  </div>

                  {/* NIT, DV y Nombres */}
                  <div className={fieldGrid}>
                    <TextField
                      label="5. Cédula / NIT (sin DV)"
                      value={d.identity.nit}
                      inputMode="numeric"
                      onChange={(v) => patch((x) => (x.identity.nit = v.replace(/\D/g, "")))}
                      hint="Los dos últimos dígitos fijan el vencimiento del calendario DIAN 2026."
                    />
                    <TextField
                      label="6. DV (Dígito de verificación)"
                      value={d.identity.dv}
                      onChange={(v) => patch((x) => (x.identity.dv = v.slice(0, 1)))}
                    />
                    <TextField label="7. Primer apellido" value={d.identity.primerApellido} onChange={(v) => patch((x) => (x.identity.primerApellido = v))} />
                    <TextField label="8. Segundo apellido" value={d.identity.segundoApellido} onChange={(v) => patch((x) => (x.identity.segundoApellido = v))} />
                    <TextField label="9. Primer nombre" value={d.identity.primerNombre} onChange={(v) => patch((x) => (x.identity.primerNombre = v))} />
                    <TextField label="10. Otros nombres" value={d.identity.otrosNombres} onChange={(v) => patch((x) => (x.identity.otrosNombres = v))} />
                  </div>

                  <DeadlineInline nit={d.identity.nit} seccional={d.identity.dirSeccional} zonaManual={d.identity.zonaSismo1226} />

                  {/* Seccional y Actividad CIIU */}
                  <div className={fieldGrid}>
                <div className="space-y-2 p-3.5 rounded-xl border border-line bg-surface min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink truncate">12. Dirección seccional</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogModalTab("seccionales");
                        setCatalogModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-forest hover:text-forest-deep flex items-center gap-1 bg-forest-mist/70 hover:bg-forest-mist px-2 py-0.5 rounded-md transition-colors shrink-0"
                      title="Editar o añadir nuevas direcciones seccionales"
                    >
                      <Settings2 className="size-3" /> Gestionar catálogo
                    </button>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      maxLength={3}
                      className="w-14 h-10 px-2 font-mono text-xs font-bold text-center rounded-lg border border-line bg-white shadow-2xs shrink-0"
                      value={d.identity.dirSeccional || "02"}
                      onChange={(e) => patch((x) => (x.identity.dirSeccional = e.target.value.replace(/\D/g, "").slice(0, 3)))}
                      placeholder="02"
                      title="Digita el código de seccional directamente"
                    />
                    <select
                      className="h-10 flex-1 min-w-0 w-full truncate rounded-lg border border-line bg-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-forest"
                      value={d.identity.dirSeccional || "02"}
                      onChange={(e) => patch((x) => (x.identity.dirSeccional = e.target.value))}
                    >
                      {seccionales.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} · {s.name} {s.isCustom ? "⭐" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl border border-line bg-surface min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink truncate">24. Actividad económica CIIU</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogModalTab("ciiu");
                        setCatalogModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-forest hover:text-forest-deep flex items-center gap-1 bg-forest-mist/70 hover:bg-forest-mist px-2 py-0.5 rounded-md transition-colors shrink-0"
                      title="Editar o añadir nuevas actividades económicas CIIU"
                    >
                      <Settings2 className="size-3" /> Gestionar catálogo
                    </button>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      maxLength={4}
                      className="w-18 h-10 px-2 font-mono text-xs font-bold text-center rounded-lg border border-line bg-white shadow-2xs shrink-0"
                      value={d.identity.actividadCiiu || "0010"}
                      onChange={(e) => patch((x) => (x.identity.actividadCiiu = e.target.value.replace(/\D/g, "").slice(0, 4)))}
                      placeholder="0010"
                      title="Digita cualquier código CIIU de 4 dígitos (ej: 3312)"
                    />
                    <select
                      className="h-10 flex-1 min-w-0 w-full truncate rounded-lg border border-line bg-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-forest"
                      value={d.identity.actividadCiiu || "0010"}
                      onChange={(e) => patch((x) => (x.identity.actividadCiiu = e.target.value))}
                    >
                      {ciiuList.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} · {s.name} {s.isCustom ? "⭐" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Correcciones y Fracción de año */}
              <div className="p-3 bg-muted-mist/40 rounded-lg border border-line space-y-3">
                <ToggleField
                  label="25. ¿Esta declaración es una corrección? (Art. 588 y 589 E.T.)"
                  hint="Si marcas SÍ, se habilitarán los campos de código de corrección y número de formulario anterior."
                  checked={d.identity.esCorreccion}
                  onChange={(v) => patch((x) => (x.identity.esCorreccion = v))}
                />
                {d.identity.esCorreccion && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">25. Código de corrección</p>
                      <select
                        className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                        value={d.identity.codCorreccion || "1"}
                        onChange={(e) => patch((x) => (x.identity.codCorreccion = e.target.value))}
                      >
                        <option value="1">1 · Corrección que aumenta impuesto o disminuye saldo a favor (Art. 588)</option>
                        <option value="2">2 · Corrección que disminuye impuesto o aumenta saldo a favor (Art. 589)</option>
                        <option value="3">3 · Corrección por emplazamiento para corregir o auto de inspección (Art. 709 / 713)</option>
                        <option value="4">4 · Otras correcciones autorizadas</option>
                      </select>
                    </div>
                    <TextField
                      label="26. No. Formulario anterior"
                      value={d.identity.formAnterior}
                      placeholder="Ej. 210202400041029"
                      onChange={(v) => patch((x) => (x.identity.formAnterior = v))}
                      hint="Número de autoadhesivo o radicado de la declaración que se corrige."
                    />
                  </div>
                )}

                <ToggleField
                  label="27. ¿Fracción de año gravable siguiente?"
                  hint="Aplica en liquidación de sucesiones ilíquidas durante el transcurso del año o personas que cancelan su RUT."
                  checked={Boolean(d.identity.fraccionAnioSiguiente)}
                  onChange={(v) => patch((x) => (x.identity.fraccionAnioSiguiente = v))}
                />

                <div className="pt-2 border-t border-line">
                  <MoneyField
                    label="28. Compras con Factura Electrónica (Base para deducción del 1 %)"
                    casilla={28}
                    year={y}
                    value={d.trabajo.comprasFacturaElectronica}
                    onChange={(n) => patch((x) => (x.trabajo.comprasFacturaElectronica = n))}
                    hint={`Art. 336 num. 5 E.T. Ingrese el monto de facturación electrónica. Deducción del 1% calculada: ${formatCOP(c.casillas[28] ?? 0)} (tope 240 UVT).`}
                  />
                </div>
              </div>

              <ToggleField
                label="Domicilio fiscal al 10 de agosto de 2026 en zona del sismo"
                hint="Palmira, Tuluá, Buenaventura o Quibdó (además de Cali, Pereira, Armenia, Manizales y Popayán, que se detectan por seccional). Decreto 1226: plazo especial si el NIT termina en 01–26."
                checked={d.identity.zonaSismo1226}
                onChange={(v) => patch((x) => (x.identity.zonaSismo1226 = v))}
              />
              <ToggleField
                label="Residente fiscal en Colombia"
                hint="Si no lo es, el formulario correcto es el 110, no el 210 (arts. 9 y 10 E.T.)."
                checked={d.identity.residente}
                onChange={(v) => patch((x) => (x.identity.residente = v))}
              />
              <ToggleField
                label="Obligado a llevar libros de contabilidad"
                hint="Los no obligados solo pueden solicitar pasivos de fecha cierta (art. 283 E.T. y arts. 48-61 C. Co.)."
                checked={d.identity.llevaLibros}
                onChange={(v) => patch((x) => (x.identity.llevaLibros = v))}
              />
              <ToggleField
                label="Declara por primera vez"
                hint="El anticipo del año siguiente es 25 %, 50 % o 75 % según sea el 1.º, 2.º o 3.er año (instructivo casilla 133)."
                checked={d.identity.primeraVez}
                onChange={(v) => patch((x) => (x.identity.primeraVez = v))}
              />
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Años que lleva declarando</p>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patch((x) => (x.identity.aniosDeclarando = n))}
                      className={cn(
                        "h-11 flex-1 rounded-md border text-sm",
                        d.identity.aniosDeclarando === n ? "border-forest bg-forest-mist" : "border-line bg-surface",
                      )}
                    >
                      {n === 3 ? "3 o más" : n}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {sec === "pat" && (
            <Card className="space-y-4">
              <CardTitle>Patrimonio</CardTitle>
              <CardHint>Art. 261 E.T. Valor patrimonial al 31 de diciembre. Inmuebles: el mayor entre costo fiscal, avalúo catastral y autoavalúo (arts. 72 y 277).</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Efectivo" casilla={29} year={y} value={d.patrimonio.efectivo} onChange={(n) => patch((x) => (x.patrimonio.efectivo = n))} />
                <MoneyField label="Cuentas bancarias" year={y} value={d.patrimonio.cuentas} onChange={(n) => patch((x) => (x.patrimonio.cuentas = n))} />
                <MoneyField label="Inversiones" year={y} value={d.patrimonio.inversiones} onChange={(n) => patch((x) => (x.patrimonio.inversiones = n))} />
                <MoneyField label="Inmuebles" year={y} value={d.patrimonio.inmuebles} onChange={(n) => patch((x) => (x.patrimonio.inmuebles = n))} hint="Incluya casa de habitación." />
                <MoneyField label="De esa, vivienda de habitación" year={y} value={d.patrimonio.viviendaHabitacion} onChange={(n) => patch((x) => (x.patrimonio.viviendaHabitacion = n))} hint="Se excluyen 8.000 UVT de la base de renta presuntiva (art. 189)." />
                <MoneyField label="Vehículos" year={y} value={d.patrimonio.vehiculos} onChange={(n) => patch((x) => (x.patrimonio.vehiculos = n))} />
                <MoneyField label="Muebles y enseres" year={y} value={d.patrimonio.muebles} onChange={(n) => patch((x) => (x.patrimonio.muebles = n))} />
                <MoneyField label="Cuentas por cobrar" year={y} value={d.patrimonio.cuentasPorCobrar} onChange={(n) => patch((x) => (x.patrimonio.cuentasPorCobrar = n))} />
                <MoneyField label="Criptoactivos" year={y} value={d.patrimonio.cripto} onChange={(n) => patch((x) => (x.patrimonio.cripto = n))} />
                <MoneyField label="Otros activos" year={y} value={d.patrimonio.otrosActivos} onChange={(n) => patch((x) => (x.patrimonio.otrosActivos = n))} />
                <MoneyField label="Aportes en sociedades nacionales" year={y} value={d.patrimonio.aportesSociedadesNacionales} onChange={(n) => patch((x) => (x.patrimonio.aportesSociedadesNacionales = n))} hint="Se restan de la base de renta presuntiva." />
              </div>
              <h3 className="font-display text-lg">Deudas · casilla 30</h3>
              <div className={fieldGrid}>
                <MoneyField label="Obligaciones financieras" casilla={30} year={y} value={d.patrimonio.obligacionesFinancieras} onChange={(n) => patch((x) => (x.patrimonio.obligacionesFinancieras = n))} />
                <MoneyField label="Cuentas por pagar" year={y} value={d.patrimonio.cuentasPorPagar} onChange={(n) => patch((x) => (x.patrimonio.cuentasPorPagar = n))} />
                <MoneyField label="Impuestos por pagar" year={y} value={d.patrimonio.impuestosPorPagar} onChange={(n) => patch((x) => (x.patrimonio.impuestosPorPagar = n))} />
                <MoneyField label="Otras deudas" year={y} value={d.patrimonio.otrasDeudas} onChange={(n) => patch((x) => (x.patrimonio.otrasDeudas = n))} />
                <MoneyField label="Patrimonio líquido 31/12 del año anterior" year={y} value={d.patrimonio.patrimonioLiquidoAnterior} onChange={(n) => patch((x) => (x.patrimonio.patrimonioLiquidoAnterior = n))} hint="Sirve para comparación patrimonial (arts. 236-239) y renta presuntiva." />
              </div>
            </Card>
          )}

          {sec === "tr" && (
            <Card className="space-y-4">
              <CardTitle>Rentas de trabajo</CardTitle>
              <CardHint>Art. 103 E.T. Incluya honorarios aquí solo si NO va a restar costos (para tomar el 25 % del num. 10 art. 206).</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Salarios" casilla={32} year={y} value={d.trabajo.salarios} onChange={(n) => patch((x) => (x.trabajo.salarios = n))} source="Formato 220, casilla de pagos laborales" />
                <MoneyField label="Honorarios sin costos" year={y} value={d.trabajo.honorariosSinCostos} onChange={(n) => patch((x) => (x.trabajo.honorariosSinCostos = n))} hint="Independiente que opta por la renta exenta del 25 %." />
                <MoneyField label="Cesantías pagadas o consignadas" year={y} value={d.trabajo.cesantiasPagadas} onChange={(n) => patch((x) => (x.trabajo.cesantiasPagadas = n))} />
                <MoneyField label="Otras prestaciones y primas" year={y} value={d.trabajo.otrasPrestaciones} onChange={(n) => patch((x) => (x.trabajo.otrasPrestaciones = n))} />
                <MoneyField label="Ingresos en especie" year={y} value={d.trabajo.ingresosEspecie} onChange={(n) => patch((x) => (x.trabajo.ingresosEspecie = n))} source="Art. 29-1 E.T." />
                <MoneyField label="Ingresos del exterior" year={y} value={d.trabajo.ingresosExterior} onChange={(n) => patch((x) => (x.trabajo.ingresosExterior = n))} />
                <MoneyField label="Promedio salarial últimos 6 meses" year={y} value={d.trabajo.promedioMensual6m} onChange={(n) => patch((x) => (x.trabajo.promedioMensual6m = n))} hint="Define el % exento de cesantías (tabla num. 4 art. 206). 100 % si ≤ 350 UVT." />
                <MoneyField label="Cesantías acumuladas a 31/12/2016 (retiradas)" year={y} value={d.trabajo.cesantiasAcumuladas2016} onChange={(n) => patch((x) => (x.trabajo.cesantiasAcumuladas2016 = n))} />
              </div>
              <h3 className="font-display text-lg">Aportes a Seguridad Social y conceptos no gravados · Casilla 33</h3>
              <div className={fieldGrid}>
                <MoneyField label="Aportes obligatorios a pensión" casilla={33} year={y} value={d.trabajo.aportesPensionObligatorios} onChange={(n) => patch((x) => (x.trabajo.aportesPensionObligatorios = n))} source="Art. 55 E.T." />
                <MoneyField label="Aportes obligatorios a salud" year={y} value={d.trabajo.aportesSaludObligatorios} onChange={(n) => patch((x) => (x.trabajo.aportesSaludObligatorios = n))} source="Art. 56 E.T." />
                <MoneyField label="Cotizaciones voluntarias RAIS" year={y} value={d.trabajo.aportesVoluntariosRais} onChange={(n) => patch((x) => (x.trabajo.aportesVoluntariosRais = n))} hint="Tope 25 % y 2.500 UVT, global entre cédulas." />
                <MoneyField label="Apoyos económicos educativos" year={y} value={d.trabajo.apoyosEducativos} onChange={(n) => patch((x) => (x.trabajo.apoyosEducativos = n))} hint="Ingreso no gravable. No aplica a honorarios ni a capital." source="Art. 46 E.T." />
                <MoneyField label="Otros ingresos no constitutivos de renta" year={y} value={d.trabajo.otrosINCRNGO} onChange={(n) => patch((x) => (x.trabajo.otrosINCRNGO = n))} />
              </div>
              <h3 className="font-display text-lg">Exentas y deducciones</h3>
              <div className={fieldGrid}>
                <MoneyField label="Aportes AFC / FVP / AVC" casilla={35} year={y} value={d.trabajo.aportesAfcFvpAvc} onChange={(n) => patch((x) => (x.trabajo.aportesAfcFvpAvc = n))} hint="30 % del ingreso y 3.800 UVT. Permanencia 10 años." source="Arts. 126-1 y 126-4 E.T." />
                <MoneyField label="Indemnizaciones exentas" year={y} value={d.trabajo.indemnizaciones} onChange={(n) => patch((x) => (x.trabajo.indemnizaciones = n))} hint="Accidente de trabajo, maternidad, entierro. No entran al 40 %." source="Nums. 1-3 art. 206." />
                <MoneyField label="Gastos de representación" year={y} value={d.trabajo.gastosRepresentacion} onChange={(n) => patch((x) => (x.trabajo.gastosRepresentacion = n))} hint="Magistrados 50 %, jueces 25 %, rectores públicos 50 %. Fuera del 40 %." source="Nums. 6 y 8 art. 206." />
                <MoneyField label="Prestaciones / seguro de muerte FF.MM. y Policía" year={y} value={d.trabajo.ffmmPrestaciones} onChange={(n) => patch((x) => (x.trabajo.ffmmPrestaciones = n))} source="Num. 7 art. 206." />
                <MoneyField label="Exceso del salario básico FF.MM. y POLINAL" year={y} value={d.trabajo.ffmmExcesoSalario} onChange={(n) => patch((x) => (x.trabajo.ffmmExcesoSalario = n))} source="Num. 7 art. 206." />
                <MoneyField label="Rentas CAN (exentas, fuera del 40 %)" year={y} value={d.trabajo.rentasCan} onChange={(n) => patch((x) => (x.trabajo.rentasCan = n))} source="Decisión 578 CAN" />
                <MoneyField label="Primas diplomáticas / costo de vida" year={y} value={d.trabajo.primasDiplomaticas} onChange={(n) => patch((x) => (x.trabajo.primasDiplomaticas = n))} source="Art. 206-1 E.T." />
                <MoneyField label="Otras exentas ilimitadas" year={y} value={d.trabajo.otrasExentasIlimitadas} onChange={(n) => patch((x) => (x.trabajo.otrasExentasIlimitadas = n))} />
                <MoneyField label="Otras exentas limitadas" year={y} value={d.trabajo.otrasExentas} onChange={(n) => patch((x) => (x.trabajo.otrasExentas = n))} />
                <MoneyField label="Intereses de vivienda" casilla={38} year={y} value={d.trabajo.interesesVivienda} onChange={(n) => patch((x) => (x.trabajo.interesesVivienda = n))} hint="Tope 1.200 UVT, art. 119. Global entre cédulas." />
                <MoneyField label="Medicina prepagada / seguro de salud" year={y} value={d.trabajo.medicinaPrepagada} onChange={(n) => patch((x) => (x.trabajo.medicinaPrepagada = n))} hint="16 UVT mensuales. Art. 387." />
                <MoneyField label="GMF pagado (se toma el 50 %)" year={y} value={d.trabajo.gmf} onChange={(n) => patch((x) => (x.trabajo.gmf = n))} source="Art. 115 E.T. Certificado del banco." />
                <MoneyField label="Intereses ICETEX" year={y} value={d.trabajo.icetex} onChange={(n) => patch((x) => (x.trabajo.icetex = n))} hint="Tope 100 UVT, art. 119." />
                <MoneyField label="Deducción anual FNCE / vehículo eléctrico" year={y} value={d.trabajo.fnceAnual} onChange={(n) => patch((x) => (x.trabajo.fnceAnual = n))} hint="50 % de la inversión en 15 años. Certificado UPME." source="Art. 11 Ley 1715/2014" />
                <MoneyField label="Otras deducciones imputables" year={y} value={d.trabajo.otrasDeducciones} onChange={(n) => patch((x) => (x.trabajo.otrasDeducciones = n))} />
                <MoneyField label="Compras con factura electrónica (base del 1 %)" casilla={28} year={y} value={d.trabajo.comprasFacturaElectronica} onChange={(n) => patch((x) => (x.trabajo.comprasFacturaElectronica = n))} hint="Pagadas con tarjeta o medio electrónico. Tope de la deducción: 240 UVT. No se pueden haber tomado como costo." source="Num. 5 art. 336 E.T." />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Dependientes económicos (máx. 4)</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patch((x) => (x.trabajo.dependientes = n))}
                      className={cn(
                        "h-11 flex-1 rounded-md border text-sm tabular-nums",
                        d.trabajo.dependientes === n ? "border-forest bg-forest-mist" : "border-line bg-surface",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Art. 387: 10 % de la renta de trabajo (máx. 32 UVT/mes = {formatCOP((c.uvt || 0) * 32)} ) entra al 40 %. Además, 72 UVT anuales por persona salen del 40 % (casilla 139). Un mismo dependiente no se duplica. DUR 1.2.1.20.3.
                </p>
              </div>
            </Card>
          )}

          {sec === "hon" && (
            <Card className="space-y-4">
              <CardTitle>Honorarios y compensación de servicios personales</CardTitle>
              <CardHint>
                Parágrafo 5 art. 206 y art. 336: el contribuyente puede restar costos y deducciones procedentes (art. 107) O tomar la renta exenta del 25 %, no ambas simultáneamente sobre el mismo ingreso.
              </CardHint>
              <ToggleField
                label="Resta costos y deducciones procedentes en honorarios"
                hint="Si está activo, se habilitan costos (casilla 45) y se inhabilita el 25 % de renta exenta laboral sobre esta subcédula."
                checked={d.honorarios.usarCostos}
                onChange={(v: boolean) => patch((x) => (x.honorarios.usarCostos = v))}
              />
              <div className={fieldGrid}>
                <MoneyField label="Ingresos brutos" casilla={43} year={y} value={d.honorarios.ingresos} onChange={(n) => patch((x) => (x.honorarios.ingresos = n))} />
                <MoneyField label="Otros ingresos no constitutivos de renta" casilla={44} year={y} value={d.honorarios.incrngo} onChange={(n) => patch((x) => (x.honorarios.incrngo = n))} />
                <MoneyField label="Aportes pensión obligatorios" year={y} value={d.honorarios.aportesPension} onChange={(n) => patch((x) => (x.honorarios.aportesPension = n))} source="Art. 55 E.T." />
                <MoneyField label="Aportes salud obligatorios" year={y} value={d.honorarios.aportesSalud} onChange={(n) => patch((x) => (x.honorarios.aportesSalud = n))} source="Art. 56 E.T." />
                <MoneyField label="Cotización voluntaria RAIS" year={y} value={d.honorarios.aportesRais} onChange={(n) => patch((x) => (x.honorarios.aportesRais = n))} hint="25 % y 2.500 UVT globales." />
                <MoneyField label="Costos y deducciones procedentes" casilla={45} year={y} value={d.honorarios.costos} onChange={(n) => patch((x) => (x.honorarios.costos = n))} />
                <MoneyField label="AFC / FVP / AVC" casilla={47} year={y} value={d.honorarios.aportesAfc} onChange={(n) => patch((x) => (x.honorarios.aportesAfc = n))} />
                <MoneyField label="Rentas CAN (fuera del 40 %)" year={y} value={d.honorarios.rentasCan} onChange={(n) => patch((x) => (x.honorarios.rentasCan = n))} />
                <MoneyField label="Otras exentas" year={y} value={d.honorarios.otrasExentas} onChange={(n) => patch((x) => (x.honorarios.otrasExentas = n))} />
                <MoneyField label="Intereses de vivienda" casilla={50} year={y} value={d.honorarios.interesesVivienda} onChange={(n) => patch((x) => (x.honorarios.interesesVivienda = n))} />
                <MoneyField label="GMF pagado (50 %)" year={y} value={d.honorarios.gmf} onChange={(n) => patch((x) => (x.honorarios.gmf = n))} source="Art. 115 E.T." />
                <MoneyField label="Intereses ICETEX" year={y} value={d.honorarios.icetex} onChange={(n) => patch((x) => (x.honorarios.icetex = n))} hint="Tope 100 UVT globales." />
                <MoneyField label="Medicina prepagada" year={y} value={d.honorarios.medicinaPrepagada} onChange={(n) => patch((x) => (x.honorarios.medicinaPrepagada = n))} hint="16 UVT/mes, compartido con trabajo." />
                <MoneyField label="Aportes a cesantías (independiente)" year={y} value={d.honorarios.aportesCesantiasIndependiente} onChange={(n) => patch((x) => (x.honorarios.aportesCesantiasIndependiente = n))} hint="2.500 UVT y 1/12 del ingreso gravable. Art. 126-1. No aplica a asalariados." />
                <MoneyField label="FNCE / vehículo eléctrico (cuota anual)" year={y} value={d.honorarios.fnceAnual} onChange={(n) => patch((x) => (x.honorarios.fnceAnual = n))} />
                <MoneyField label="Otras deducciones" year={y} value={d.honorarios.otrasDeducciones} onChange={(n) => patch((x) => (x.honorarios.otrasDeducciones = n))} />
                <MoneyField label="Compensación de pérdidas de años anteriores" casilla={56} year={y} value={d.honorarios.compensacionPerdidas} onChange={(n) => patch((x) => (x.honorarios.compensacionPerdidas = n))} />
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs text-forest"
                    onClick={() => openCompensaciones("honorarios")}
                  >
                    <History className="mr-1.5 size-3.5" />
                    Gestionar historial de pérdidas de honorarios (Art. 147 E.T.)
                  </Button>
                </div>
              </div>
              {c.casillas[140] ? (
                <p className="rounded-md bg-warn-mist px-3 py-2 text-sm text-warn">
                  Casilla 140 marcada: los costos superan el 60 % de los ingresos. Deben estar soportados con factura o nómina electrónica.
                </p>
              ) : null}
            </Card>
          )}

          {sec === "cap" && (
            <Card className="space-y-4">
              <CardTitle>Rentas de capital</CardTitle>
              <CardHint>Art. 335: intereses, arrendamientos, regalías, rendimientos financieros y explotación de intangibles.</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Intereses" casilla={58} year={y} value={d.capital.intereses} onChange={(n) => patch((x) => (x.capital.intereses = n))} />
                <MoneyField label="Arrendamientos" year={y} value={d.capital.arrendamientos} onChange={(n) => patch((x) => (x.capital.arrendamientos = n))} />
                <MoneyField label="Regalías" year={y} value={d.capital.regalias} onChange={(n) => patch((x) => (x.capital.regalias = n))} />
                <MoneyField label="Rendimientos financieros" year={y} value={d.capital.rendimientosFinancieros} onChange={(n) => patch((x) => (x.capital.rendimientosFinancieros = n))} />
                <MoneyField label="Explotación de intangibles" year={y} value={d.capital.explotacionIntangibles} onChange={(n) => patch((x) => (x.capital.explotacionIntangibles = n))} />
                <MoneyField label="Ingresos del exterior" year={y} value={d.capital.ingresosExterior} onChange={(n) => patch((x) => (x.capital.ingresosExterior = n))} />
                <MoneyField label="Componente inflacionario no gravado" casilla={59} year={y} value={d.capital.componenteInflacionario} onChange={(n) => patch((x) => (x.capital.componenteInflacionario = n))} source="Arts. 38 a 41 E.T. Solo capital, y si no está obligado a llevar libros." />
                <MoneyField label="Aportes pensión / salud / RAIS" year={y} value={d.capital.aportesPension} onChange={(n) => patch((x) => (x.capital.aportesPension = n))} hint="Arts. 55 y 56. RAIS en el campo siguiente." />
                <MoneyField label="Cotización voluntaria RAIS" year={y} value={d.capital.aportesRais} onChange={(n) => patch((x) => (x.capital.aportesRais = n))} />
                <MoneyField label="Aportes salud" year={y} value={d.capital.aportesSalud} onChange={(n) => patch((x) => (x.capital.aportesSalud = n))} />
                <MoneyField label="Otros ingresos no constitutivos de renta" year={y} value={d.capital.incrngo} onChange={(n) => patch((x) => (x.capital.incrngo = n))} />
                <MoneyField label="Costos y gastos" casilla={60} year={y} value={d.capital.costos} onChange={(n) => patch((x) => (x.capital.costos = n))} />
                <MoneyField label="Rentas pasivas ECE" casilla={62} year={y} value={d.capital.ecePasiva} onChange={(n) => patch((x) => (x.capital.ecePasiva = n))} />
                <MoneyField label="AFC / FVP / AVC" year={y} value={d.capital.aportesAfc} onChange={(n) => patch((x) => (x.capital.aportesAfc = n))} />
                <MoneyField label="Rentas CAN" year={y} value={d.capital.rentasCan} onChange={(n) => patch((x) => (x.capital.rentasCan = n))} />
                <MoneyField label="Otras exentas" year={y} value={d.capital.otrasExentas} onChange={(n) => patch((x) => (x.capital.otrasExentas = n))} />
                <MoneyField label="Intereses de vivienda" year={y} value={d.capital.interesesVivienda} onChange={(n) => patch((x) => (x.capital.interesesVivienda = n))} />
                <MoneyField label="GMF pagado (50 %)" year={y} value={d.capital.gmf} onChange={(n) => patch((x) => (x.capital.gmf = n))} />
                <MoneyField label="Intereses ICETEX" year={y} value={d.capital.icetex} onChange={(n) => patch((x) => (x.capital.icetex = n))} />
                <MoneyField label="Aportes cesantías (independiente)" year={y} value={d.capital.aportesCesantiasIndependiente} onChange={(n) => patch((x) => (x.capital.aportesCesantiasIndependiente = n))} hint="2.500 UVT y 1/12. No para asalariados." />
                <MoneyField label="FNCE / vehículo eléctrico" year={y} value={d.capital.fnceAnual} onChange={(n) => patch((x) => (x.capital.fnceAnual = n))} />
                <MoneyField label="Otras deducciones" year={y} value={d.capital.otrasDeducciones} onChange={(n) => patch((x) => (x.capital.otrasDeducciones = n))} />
                <MoneyField label="Compensación de pérdidas" casilla={72} year={y} value={d.capital.compensacionPerdidas} onChange={(n) => patch((x) => (x.capital.compensacionPerdidas = n))} />
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs text-forest"
                    onClick={() => openCompensaciones("capital")}
                  >
                    <History className="mr-1.5 size-3.5" />
                    Gestionar historial de pérdidas de capital (Art. 147 E.T.)
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {sec === "nl" && (
            <Card className="space-y-4">
              <CardTitle>Rentas no laborales</CardTitle>
              <CardHint>Ventas de activos poseídos menos de 2 años, notarios, curadores, apoyos, recompensas y lo no clasificado en otra cédula.</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Ingresos brutos (otros)" casilla={74} year={y} value={d.noLaborales.ingresos} onChange={(n) => patch((x) => (x.noLaborales.ingresos = n))} hint="Use los campos de abajo para desglosar. Se suman." />
                <MoneyField label="Ventas de muebles o inmuebles" year={y} value={d.noLaborales.ventas} onChange={(n) => patch((x) => (x.noLaborales.ventas = n))} hint="Si el activo se poseyó ≥ 2 años, es ganancia ocasional." />
                <MoneyField label="Recompensas" year={y} value={d.noLaborales.recompensas} onChange={(n) => patch((x) => (x.noLaborales.recompensas = n))} />
                <MoneyField label="Apoyos económicos" year={y} value={d.noLaborales.apoyosEconomicos} onChange={(n) => patch((x) => (x.noLaborales.apoyosEconomicos = n))} />
                <MoneyField label="Notarios" year={y} value={d.noLaborales.notarios} onChange={(n) => patch((x) => (x.noLaborales.notarios = n))} />
                <MoneyField label="Curadores" year={y} value={d.noLaborales.curadores} onChange={(n) => patch((x) => (x.noLaborales.curadores = n))} />
                <MoneyField label="Donaciones a campañas políticas" year={y} value={d.noLaborales.donacionesCampanas} onChange={(n) => patch((x) => (x.noLaborales.donacionesCampanas = n))} />
                <MoneyField label="Demás no clasificados" year={y} value={d.noLaborales.demas} onChange={(n) => patch((x) => (x.noLaborales.demas = n))} />
                <MoneyField label="Devoluciones, rebajas y descuentos" casilla={75} year={y} value={d.noLaborales.devoluciones} onChange={(n) => patch((x) => (x.noLaborales.devoluciones = n))} />
                <MoneyField label="Apoyos educativos no gravados (Art. 46 E.T.)" year={y} value={d.noLaborales.apoyosEducativos} onChange={(n) => patch((x) => (x.noLaborales.apoyosEducativos = n))} />
                <MoneyField label="Indemnizaciones por seguro de daño" year={y} value={d.noLaborales.indemnizacionesSeguroDano} onChange={(n) => patch((x) => (x.noLaborales.indemnizacionesSeguroDano = n))} source="Art. 45 E.T." hint="Ingreso no constitutivo de renta. El seguro de vida va a ganancia ocasional (art. 303-1)." />
                <MoneyField label="Aportes pensión" year={y} value={d.noLaborales.aportesPension} onChange={(n) => patch((x) => (x.noLaborales.aportesPension = n))} />
                <MoneyField label="Aportes salud" year={y} value={d.noLaborales.aportesSalud} onChange={(n) => patch((x) => (x.noLaborales.aportesSalud = n))} />
                <MoneyField label="RAIS voluntario" year={y} value={d.noLaborales.aportesRais} onChange={(n) => patch((x) => (x.noLaborales.aportesRais = n))} />
                <MoneyField label="Otros ingresos no constitutivos de renta" year={y} value={d.noLaborales.incrngo} onChange={(n) => patch((x) => (x.noLaborales.incrngo = n))} />
                <MoneyField label="Costos y gastos" casilla={77} year={y} value={d.noLaborales.costos} onChange={(n) => patch((x) => (x.noLaborales.costos = n))} />
                <MoneyField label="Rentas pasivas ECE" casilla={79} year={y} value={d.noLaborales.ecePasiva} onChange={(n) => patch((x) => (x.noLaborales.ecePasiva = n))} />
                <MoneyField label="AFC / FVP / AVC" year={y} value={d.noLaborales.aportesAfc} onChange={(n) => patch((x) => (x.noLaborales.aportesAfc = n))} />
                <MoneyField label="Rentas CAN" year={y} value={d.noLaborales.rentasCan} onChange={(n) => patch((x) => (x.noLaborales.rentasCan = n))} />
                <MoneyField label="Otras exentas (hoteles)" year={y} value={d.noLaborales.otrasExentas} onChange={(n) => patch((x) => (x.noLaborales.otrasExentas = n))} />
                <MoneyField label="Intereses de vivienda" year={y} value={d.noLaborales.interesesVivienda} onChange={(n) => patch((x) => (x.noLaborales.interesesVivienda = n))} />
                <MoneyField label="GMF pagado (50 %)" year={y} value={d.noLaborales.gmf} onChange={(n) => patch((x) => (x.noLaborales.gmf = n))} />
                <MoneyField label="Intereses ICETEX" year={y} value={d.noLaborales.icetex} onChange={(n) => patch((x) => (x.noLaborales.icetex = n))} />
                <MoneyField label="Aportes cesantías (independiente)" year={y} value={d.noLaborales.aportesCesantiasIndependiente} onChange={(n) => patch((x) => (x.noLaborales.aportesCesantiasIndependiente = n))} />
                <MoneyField label="FNCE / vehículo eléctrico" year={y} value={d.noLaborales.fnceAnual} onChange={(n) => patch((x) => (x.noLaborales.fnceAnual = n))} />
                <MoneyField label="Otras deducciones" year={y} value={d.noLaborales.otrasDeducciones} onChange={(n) => patch((x) => (x.noLaborales.otrasDeducciones = n))} />
                <MoneyField label="Compensación de pérdidas" casilla={89} year={y} value={d.noLaborales.compensacionPerdidas} onChange={(n) => patch((x) => (x.noLaborales.compensacionPerdidas = n))} />
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs text-forest"
                    onClick={() => openCompensaciones("noLaborales")}
                  >
                    <History className="mr-1.5 size-3.5" />
                    Gestionar historial de pérdidas no laborales (Art. 147 E.T.)
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {sec === "pen" && (
            <Card className="space-y-4">
              <CardTitle>Cédula de pensiones</CardTitle>
              <CardHint>Num. 5 art. 206: exenta la parte que no supere 1.000 UVT mensuales, después de aportes a salud y solidaridad.</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Ingresos por pensiones (país y exterior)" casilla={99} year={y} value={d.pensiones.ingresos} onChange={(n) => patch((x) => (x.pensiones.ingresos = n))} />
                <MoneyField label="Aportes obligatorios a salud y solidaridad" casilla={100} year={y} value={d.pensiones.incrngo} onChange={(n) => patch((x) => (x.pensiones.incrngo = n))} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Meses de mesada en el año</p>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={d.pensiones.meses}
                  onChange={(e) => patch((x) => (x.pensiones.meses = Number(e.target.value)))}
                  className="w-full accent-[var(--color-forest)]"
                />
                <p className="text-sm tabular-nums">{d.pensiones.meses} meses · exención máx. {formatCOP((c.casillas[102] ?? 0))}</p>
              </div>
            </Card>
          )}

          {sec === "div" && (
            <Card className="space-y-4">
              <CardTitle>Dividendos y participaciones</CardTitle>
              <CardHint>El certificado de la sociedad dice si son num. 3 o par. 2 del art. 49, y el año de origen.</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Dividendos 2016 y anteriores" casilla={104} year={y} value={d.dividendos.div2016} onChange={(n) => patch((x) => (x.dividendos.div2016 = n))} />
                <MoneyField label="Dividendos no gravados (2016 y anteriores)" casilla={105} year={y} value={d.dividendos.incrngo2016} onChange={(n) => patch((x) => (x.dividendos.incrngo2016 = n))} />
                <MoneyField label="1ª subcédula 2017+ (num. 3 art. 49)" casilla={107} year={y} value={d.dividendos.subcedula1} onChange={(n) => patch((x) => (x.dividendos.subcedula1 = n))} hint="Se suman a la base del art. 241." />
                <MoneyField label="2ª subcédula 2017+ (par. 2 art. 49)" casilla={108} year={y} value={d.dividendos.subcedula2} onChange={(n) => patch((x) => (x.dividendos.subcedula2 = n))} hint="Se gravan a la tarifa del art. 240 (35 % general)." />
                <MoneyField label="Dividendos del exterior" casilla={109} year={y} value={d.dividendos.exterior} onChange={(n) => patch((x) => (x.dividendos.exterior = n))} />
                <MoneyField label="Exentas del exterior (CAN / CDI)" casilla={110} year={y} value={d.dividendos.exentasExterior} onChange={(n) => patch((x) => (x.dividendos.exentasExterior = n))} />
              </div>
            </Card>
          )}

          {sec === "go" && (
            <Card className="space-y-4">
              <CardTitle>Ganancias ocasionales</CardTitle>
              <CardHint>15 % general, 20 % loterías. Poseídos ≥ 2 años. Escritura = momento de realización (art. 27-2).</CardHint>
              <div className={fieldGrid}>
                <MoneyField label="Enajenación de activos fijos ≥ 2 años" casilla={112} year={y} value={d.gananciasOcasionales.enajenacionActivos} onChange={(n) => patch((x) => (x.gananciasOcasionales.enajenacionActivos = n))} />
                <MoneyField label="Herencias, legados, porción conyugal" year={y} value={d.gananciasOcasionales.herencias} onChange={(n) => patch((x) => (x.gananciasOcasionales.herencias = n))} />
                <MoneyField label="Donaciones" year={y} value={d.gananciasOcasionales.donaciones} onChange={(n) => patch((x) => (x.gananciasOcasionales.donaciones = n))} />
                <MoneyField label="Loterías, rifas y apuestas" year={y} value={d.gananciasOcasionales.loterias} onChange={(n) => patch((x) => (x.gananciasOcasionales.loterias = n))} hint="Tarifa 20 %." />
                <MoneyField label="Seguro de vida" year={y} value={d.gananciasOcasionales.seguroVida} onChange={(n) => patch((x) => (x.gananciasOcasionales.seguroVida = n))} hint="No gravado hasta 3.250 UVT (art. 303-1)." />
                <MoneyField label="Venta de casa de habitación" year={y} value={d.gananciasOcasionales.ventaVivienda} onChange={(n) => patch((x) => (x.gananciasOcasionales.ventaVivienda = n))} hint="Hasta 5.000 UVT exentas si van a AFC o hipoteca (art. 311-1)." />
                <MoneyField label="Otros ingresos ocasionales" year={y} value={d.gananciasOcasionales.otros} onChange={(n) => patch((x) => (x.gananciasOcasionales.otros = n))} />
                <MoneyField label="Costos fiscales" casilla={113} year={y} value={d.gananciasOcasionales.costos} onChange={(n) => patch((x) => (x.gananciasOcasionales.costos = n))} />
                <MoneyField label="GO no gravadas y exentas" casilla={114} year={y} value={d.gananciasOcasionales.goNoGravadas} onChange={(n) => patch((x) => (x.gananciasOcasionales.goNoGravadas = n))} />
                <MoneyField label="Impuesto pagado en el exterior (GO)" casilla={128} year={y} value={d.gananciasOcasionales.impuestoExterior} onChange={(n) => patch((x) => (x.gananciasOcasionales.impuestoExterior = n))} />
              </div>
            </Card>
          )}

          {sec === "dsc" && (
            <Card className="space-y-4">
              <CardTitle>Descuentos, retenciones y cierre</CardTitle>
              <div className={fieldGrid}>
                <MoneyField
                  label="Compras con Factura Electrónica (Base del 1 %)"
                  casilla={28}
                  year={y}
                  value={d.trabajo.comprasFacturaElectronica}
                  onChange={(n) => patch((x) => (x.trabajo.comprasFacturaElectronica = n))}
                  hint={`Art. 336 num. 5 E.T. Deducción del 1% calculada: ${formatCOP(c.casillas[28] ?? 0)} (máx. 240 UVT).`}
                />
                <MoneyField label="Impuestos pagados en el exterior" casilla={122} year={y} value={d.descuentos.impuestosExterior} onChange={(n) => patch((x) => (x.descuentos.impuestosExterior = n))} source="Art. 254 E.T." />
                <MoneyField label="Donaciones (base del descuento)" casilla={123} year={y} value={d.descuentos.donaciones} onChange={(n) => patch((x) => (x.descuentos.donaciones = n))} hint="ESAL régimen especial: 25 %. I+D+i: 30 %. Tope conjunto 30 % del impuesto." />
                <MoneyField label="IVA de activos fijos reales productivos" year={y} value={d.descuentos.ivaActivosFijos} onChange={(n) => patch((x) => (x.descuentos.ivaActivosFijos = n))} />
                <MoneyField label="Otros descuentos" year={y} value={d.descuentos.otros} onChange={(n) => patch((x) => (x.descuentos.otros = n))} />
                <MoneyField label="Retenciones del año" casilla={132} year={y} value={d.extra.retenciones} onChange={(n) => patch((x) => (x.extra.retenciones = n))} />
                <MoneyField label="Anticipo liquidado el año anterior" casilla={130} year={y} value={d.extra.anticipoAnterior} onChange={(n) => patch((x) => (x.extra.anticipoAnterior = n))} />
                <MoneyField label="Saldo a favor anterior (sin devolución)" casilla={131} year={y} value={d.extra.saldoFavorAnterior} onChange={(n) => patch((x) => (x.extra.saldoFavorAnterior = n))} />
                <MoneyField label="Impuesto neto del año anterior" year={y} value={d.extra.impuestoNetoAnterior} onChange={(n) => patch((x) => (x.extra.impuestoNetoAnterior = n))} hint="Para beneficio de auditoría art. 689-3." />
                <MoneyField label="Rentas gravables (omitidos, comparación)" casilla={96} year={y} value={d.extra.rentasGravables} onChange={(n) => patch((x) => (x.extra.rentasGravables = n))} />
                <MoneyField label="Compensación pérdidas 2018 y anteriores" casilla={94} year={y} value={d.extra.compensacionPerdidas2018} onChange={(n) => patch((x) => (x.extra.compensacionPerdidas2018 = n))} />
                <MoneyField label="Compensación exceso renta presuntiva" casilla={95} year={y} value={d.extra.compensacionExcesoPresuntiva} onChange={(n) => patch((x) => (x.extra.compensacionExcesoPresuntiva = n))} />
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs text-forest"
                    onClick={() => openCompensaciones("presuntiva")}
                  >
                    <History className="mr-1.5 size-3.5" />
                    Gestionar historial de pérdidas 2018 y excesos de renta presuntiva (Arts. 147, 189 y 330 E.T.)
                  </Button>
                </div>
                <MoneyField label="Renta presuntiva (si la liquida)" casilla={98} year={y} value={d.extra.rentaPresuntivaManual} onChange={(n) => patch((x) => (x.extra.rentaPresuntivaManual = n))} hint="Tarifa 0 %; informe renta de activos exceptuados." />
                <MoneyField label="Sanciones" casilla={135} year={y} value={d.extra.sanciones} onChange={(n) => patch((x) => (x.extra.sanciones = n))} hint={`Mínima 10 UVT ${formatCOP(c.uvtFiling * 10)} (UVT ${c.filingYear}).`} />
                <MoneyField label="Aporte voluntario art. 244-1" casilla={141} year={y} value={d.extra.aporteVoluntario} onChange={(n) => patch((x) => (x.extra.aporteVoluntario = n))} />
              </div>
            </Card>
          )}
        </div>

        {splitScreen ? (
          <aside className="sticky top-20 h-[calc(100vh-6rem)] hidden lg:block">
            <LiveFormPreview />
          </aside>
        ) : (
          <aside className="space-y-3 lg:sticky lg:top-24 h-[calc(100vh-7rem)] flex flex-col min-h-0">
            <Card className="flex flex-col h-full overflow-hidden p-3.5 sm:p-4 gap-2">
              {/* 1. Encabezado Fijo */}
              <div className="shrink-0 flex items-center justify-between border-b border-line pb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Cifras vivas</p>
                {c.casillas[136] > 0 ? (
                  <Badge tone="warn" className="text-[10px]">Saldo a pagar</Badge>
                ) : c.casillas[137] > 0 ? (
                  <Badge tone="forest" className="text-[10px]">Saldo a favor</Badge>
                ) : (
                  <Badge tone="ok" className="text-[10px]">En tiempo real</Badge>
                )}
              </div>

              {/* 2. Indicador Principal Fijo */}
              <div
                className={cn(
                  "shrink-0 rounded-xl p-2.5 border space-y-0.5",
                  c.casillas[136] > 0
                    ? "border-amber-200 bg-amber-50/70"
                    : c.casillas[137] > 0
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-line bg-muted-mist/40",
                )}
              >
                <span className="text-[10.5px] font-medium text-muted block">
                  {c.casillas[136] > 0
                    ? "136. Total Saldo a Pagar"
                    : c.casillas[137] > 0
                    ? "137. Total Saldo a Favor"
                    : "126. Impuesto Neto de Renta"}
                </span>
                <span
                  className={cn(
                    "text-xl font-bold tracking-tight font-display block leading-tight",
                    c.casillas[136] > 0
                      ? "text-amber-800"
                      : c.casillas[137] > 0
                      ? "text-emerald-700 font-mono"
                      : "text-ink",
                  )}
                >
                  {formatCOP(c.casillas[136] || c.casillas[137] || c.casillas[126] || 0)}
                </span>
              </div>

              {/* 3. Cuerpo Desplazable Autónomo */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 text-xs">
                {/* Sección 1: Patrimonio */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted/80 block">Patrimonio</span>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted">
                      <span className="font-mono text-[10px] text-faint">29</span> Patrimonio bruto
                    </span>
                    <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[29] ?? 0)}</span>
                  </div>
                  {Boolean(c.casillas[30]) && (
                    <div className="flex justify-between py-0.5 text-red-700">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">30</span> Deudas
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[30] ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-0.5 font-semibold text-ink border-t border-line/50 pt-1">
                    <span>
                      <span className="font-mono text-[10px] text-faint">31</span> Patrimonio líquido
                    </span>
                    <span className="tabular-nums">{formatCOP(c.casillas[31] ?? 0)}</span>
                  </div>
                </div>

                {/* Sección 2: Cédulas e Ingresos Activos */}
                <div className="space-y-1 border-t border-line pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted/80 block">Cédula General e Ingresos</span>

                  {Boolean(c.casillas[32]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">32</span> Ingresos trabajo
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[32])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[33]) && (
                    <div className="flex justify-between py-0.5 text-forest">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">33</span> Aportes salud y pensión
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[33])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[41]) && (
                    <div className="flex justify-between py-0.5 text-forest">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">41</span> Exentas y deducciones
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[41])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[42]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">42</span> Renta líquida trabajo
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[42])}</span>
                    </div>
                  )}

                  {Boolean(c.casillas[43]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">43</span> Ingresos honorarios
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[43])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[58]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">58</span> Ingresos capital
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[58])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[74]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">74</span> Ingresos no laborales
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[74])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[99]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">99</span> Pensiones
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[99])}</span>
                    </div>
                  )}
                  {Boolean((c.casillas[104] || 0) + (c.casillas[107] || 0)) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">107</span> Dividendos
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP((c.casillas[104] || 0) + (c.casillas[107] || 0))}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[112]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">112</span> Ganancia ocasional
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[112])}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-0.5 font-semibold text-ink border-t border-line/50 pt-1">
                    <span>
                      <span className="font-mono text-[10px] text-faint">97</span> Renta gravable general
                    </span>
                    <span className="tabular-nums">{formatCOP(c.casillas[97] ?? 0)}</span>
                  </div>
                </div>

                {/* Sección 3: Liquidación e Impuesto */}
                <div className="space-y-1 border-t border-line pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted/80 block">Liquidación Privada</span>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted">
                      <span className="font-mono text-[10px] text-faint">126</span> Impuesto neto renta
                    </span>
                    <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[126] ?? 0)}</span>
                  </div>
                  {Boolean(c.casillas[127]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">127</span> Impuesto ganancia ocasional
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[127])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[132]) && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">132</span> Retenciones a favor
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[132])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[130]) && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">130</span> Anticipo año anterior
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[130])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[131]) && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>
                        <span className="font-mono text-[10px] opacity-70">131</span> Saldo a favor anterior
                      </span>
                      <span className="font-medium tabular-nums">−{formatCOP(c.casillas[131])}</span>
                    </div>
                  )}
                  {Boolean(c.casillas[133]) && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted">
                        <span className="font-mono text-[10px] text-faint">133</span> Anticipo año siguiente
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatCOP(c.casillas[133])}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Botones de Acción Fijos al Pie */}
              <div className="shrink-0 pt-2 border-t border-line space-y-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-full justify-center text-xs h-8"
                >
                  <Eye className="mr-1.5 size-3.5" />
                  Previsualizar 210
                </Button>
                <Button asChild variant="secondary" size="sm" className="w-full justify-center text-xs h-8">
                  <Link to="/formulario">
                    <FileText className="mr-1.5 size-3.5" />
                    Ir al Formulario 210
                  </Link>
                </Button>
              </div>
            </Card>
          </aside>
        )}
      </div>

      {previewModalOpen && (
        <LiveFormPreview isModal onClose={() => setPreviewModalOpen(false)} />
      )}

      <CompensacionesDialog
        open={compensacionesOpen}
        onClose={() => setCompensacionesOpen(false)}
        initialTipo={initialCompTipo}
      />

      <CatalogManagerModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        defaultTab={catalogModalTab}
        onSelectSeccional={(code) => patch((x) => (x.identity.dirSeccional = code))}
        onSelectCiiu={(code) => patch((x) => (x.identity.actividadCiiu = code))}
      />
    </div>
  );
}

function DeadlineInline({
  nit,
  seccional,
  zonaManual,
}: {
  nit: string;
  seccional: string;
  zonaManual: boolean;
}) {
  const zona = isZonaSismo1226(seccional, zonaManual);
  const hit = deadlineForNit(nit, { zonaSismo1226: zona, seccional });
  if (!hit) return null;
  const days = daysUntil(hit.iso);
  return (
    <div className={cn("rounded-lg px-4 py-3", hit.regime === "decreto-1226" ? "bg-warn-mist" : "bg-forest-mist")}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
        Vencimiento · dígitos {hit.digits.join(" y ")}
      </p>
      <p className="mt-1 font-display text-2xl leading-none">{hit.date}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {days > 0 ? `Faltan ${days} días.` : days === 0 ? "Vence hoy." : `Venció hace ${Math.abs(days)} días.`}
        {hit.regime === "decreto-1226" ? " Plazo especial del Decreto 1226." : ""}
      </p>
    </div>
  );
}
