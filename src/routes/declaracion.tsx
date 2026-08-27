import { createFileRoute, Link } from '@tanstack/react-router';
import { Columns2, Eye, FileText, History, Maximize2, Settings2, Sparkles, Plus, Sliders, Minimize2 } from "lucide-react";
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
  const [splitRatio, setSplitRatio] = useState<number>(45);
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

  const fieldGrid = cn("grid gap-4", splitScreen ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2");

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
            className={cn(splitScreen ? "bg-forest text-white" : "")}
          >
            <Columns2 className="mr-1.5 size-4" />
            {splitScreen ? "Modo dividido activo" : "Modo dividido (210 en vivo)"}
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

      {/* Barra de control de proporción de pantalla para modo dividido */}
      {splitScreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-forest-mist/60 border border-forest/30 rounded-xl shadow-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-forest flex items-center gap-1.5">
              <Sliders className="size-3.5" />
              Proporción de pantalla:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSplitRatio(35)}
                className={cn("px-2.5 py-1 text-xs rounded-md font-mono transition-colors", splitRatio === 35 ? "bg-forest text-white font-bold shadow-xs" : "bg-surface border border-line text-ink hover:bg-forest-mist")}
                title="35% Formulario · 65% PDF 210"
              >
                35 / 65
              </button>
              <button
                type="button"
                onClick={() => setSplitRatio(45)}
                className={cn("px-2.5 py-1 text-xs rounded-md font-mono transition-colors", splitRatio === 45 ? "bg-forest text-white font-bold shadow-xs" : "bg-surface border border-line text-ink hover:bg-forest-mist")}
                title="45% Formulario · 55% PDF 210"
              >
                45 / 55 (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setSplitRatio(55)}
                className={cn("px-2.5 py-1 text-xs rounded-md font-mono transition-colors", splitRatio === 55 ? "bg-forest text-white font-bold shadow-xs" : "bg-surface border border-line text-ink hover:bg-forest-mist")}
                title="55% Formulario · 45% PDF 210"
              >
                55 / 45
              </button>
              <button
                type="button"
                onClick={() => setSplitRatio(65)}
                className={cn("px-2.5 py-1 text-xs rounded-md font-mono transition-colors", splitRatio === 65 ? "bg-forest text-white font-bold shadow-xs" : "bg-surface border border-line text-ink hover:bg-forest-mist")}
                title="65% Formulario · 35% PDF 210"
              >
                65 / 35
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="text-xs text-muted font-mono hidden sm:inline">Formulario: <strong>{splitRatio}%</strong> · 210 DIAN: <strong>{100 - splitRatio}%</strong></span>
            <input
              type="range"
              min={25}
              max={75}
              value={splitRatio}
              onChange={(e) => setSplitRatio(Number(e.target.value))}
              className="w-28 accent-[var(--color-forest)] cursor-pointer"
              title="Arrastra para ajustar el tamaño de cada panel milimétricamente"
            />
          </div>
        </div>
      )}

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

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        <div
          className="w-full min-w-0 space-y-4 transition-all duration-150"
          style={{
            flex: splitScreen ? `0 0 ${splitRatio}%` : "1 1 auto",
            maxWidth: splitScreen ? `${splitRatio}%` : "100%",
          }}
        >
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
                <MoneyField label="Inmuebles (Bienes raíces)" year={y} value={d.patrimonio.inmuebles} onChange={(n) => patch((x) => (x.patrimonio.inmuebles = n))} hint="Incluya apartamentos, casas, lotes, fincas y locales comerciales." />
                <MoneyField label="De los anteriores: Casa o apartamento de habitación" year={y} value={d.patrimonio.viviendaHabitacion} onChange={(n) => patch((x) => (x.patrimonio.viviendaHabitacion = n))} hint="Art. 189 lit. f E.T. Indique el valor de su vivienda principal (se excluyen hasta 8.000 UVT de renta presuntiva)." />
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
              <CardTitle>Rentas de trabajo (Cédula General)</CardTitle>
              <CardHint>Art. 103, 206 y 336 E.T. Incluye todos los ingresos originados en contratos laborales, prestaciones y pagos no salariales. Las deducciones y rentas exentas se depuran automáticamente con sus topes legales.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Salarios y sueldos directos"
                  casilla={32}
                  year={y}
                  value={d.trabajo.salarios}
                  onChange={(n) => patch((x) => (x.trabajo.salarios = n))}
                  source="Formato 220 casilla 36 / Formato 2276 Pagos salariales"
                  hint="Sueldos básicos, comisiones, horas extras, recargos y sobresueldos devengados en el año."
                />
                <MoneyField
                  label="Prestaciones sociales y primas legales"
                  year={y}
                  value={d.trabajo.otrasPrestaciones}
                  onChange={(n) => patch((x) => (x.trabajo.otrasPrestaciones = n))}
                  source="Formato 220 casilla 38 / Formato 2276 Prestaciones"
                  hint="Primas de servicios legales o extralegales, vacaciones en dinero o tiempo y descansos remunerados."
                />
                <MoneyField
                  label="Otros pagos laborales (Bonos, auxilios no salariales)"
                  year={y}
                  value={d.trabajo.otrosPagosLaborales || 0}
                  onChange={(n) => patch((x) => (x.trabajo.otrosPagosLaborales = n))}
                  source="Formato 2276 casilla Otros pagos"
                  hint="Bonos de fin de año, auxilios habituales y pagos no salariales acordados según Art. 128 C.S.T."
                />
                <MoneyField
                  label="Cesantías e intereses de cesantías consignadas o pagadas"
                  year={y}
                  value={d.trabajo.cesantiasPagadas}
                  onChange={(n) => patch((x) => (x.trabajo.cesantiasPagadas = n))}
                  source="Formato 220 casilla 39-40 / Formato 2276 Cesantías"
                  hint="Cesantías consignadas al fondo o pagadas directamente al trabajador durante el año."
                />
                <MoneyField
                  label="Honorarios y compensación de servicios (Sin costos)"
                  year={y}
                  value={d.trabajo.honorariosSinCostos}
                  onChange={(n) => patch((x) => (x.trabajo.honorariosSinCostos = n))}
                  hint="Para trabajadores independientes que NO restan costos y deducciones, para tomar la renta exenta del 25 %."
                />
                <MoneyField
                  label="Pagos e ingresos en especie"
                  year={y}
                  value={d.trabajo.ingresosEspecie}
                  onChange={(n) => patch((x) => (x.trabajo.ingresosEspecie = n))}
                  source="Art. 29-1 E.T."
                  hint="Vivienda, vehículos, medicina u otros bienes y servicios costeados directamente por el empleador."
                />
                <MoneyField
                  label="Ingresos laborales del exterior"
                  year={y}
                  value={d.trabajo.ingresosExterior}
                  onChange={(n) => patch((x) => (x.trabajo.ingresosExterior = n))}
                  hint="Salarios o compensaciones por servicios personales prestados fuera de Colombia (renta mundial)."
                />
                <MoneyField
                  label="Salario mensual promedio últimos 6 meses"
                  year={y}
                  value={d.trabajo.promedioMensual6m}
                  onChange={(n) => patch((x) => (x.trabajo.promedioMensual6m = n))}
                  hint="Base para determinar el porcentaje exento de cesantías (Art. 206 Num. 4 E.T.). 100 % exentas si promedio ≤ 350 UVT."
                />
                <MoneyField
                  label="Cesantías acumuladas a 31/12/2016 (Retiradas)"
                  year={y}
                  value={d.trabajo.cesantiasAcumuladas2016}
                  onChange={(n) => patch((x) => (x.trabajo.cesantiasAcumuladas2016 = n))}
                  hint="Cesantías del régimen tradicional acumuladas antes de 2017 y retiradas en el año (Art. 1.2.1.20.7 DUR)."
                />
              </div>

              <h3 className="font-display text-lg">Aportes a Seguridad Social y conceptos no gravados · Casilla 33</h3>
              <div className={fieldGrid}>
                <MoneyField
                  label="Aportes obligatorios a pensión"
                  casilla={33}
                  year={y}
                  value={d.trabajo.aportesPensionObligatorios}
                  onChange={(n) => patch((x) => (x.trabajo.aportesPensionObligatorios = n))}
                  source="Art. 55 E.T. · Formato 220 casilla 48"
                  hint="Aporte obligatorio del 4 % a cargo del trabajador al fondo de pensiones (Colpensiones o privados)."
                />
                <MoneyField
                  label="Aportes obligatorios a salud"
                  year={y}
                  value={d.trabajo.aportesSaludObligatorios}
                  onChange={(n) => patch((x) => (x.trabajo.aportesSaludObligatorios = n))}
                  source="Art. 56 E.T. · Formato 220 casilla 47"
                  hint="Aporte obligatorio del 4 % a cargo del trabajador a su EPS."
                />
                <MoneyField
                  label="Cotizaciones voluntarias a pensión obligatoria (RAIS)"
                  year={y}
                  value={d.trabajo.aportesVoluntariosRais}
                  onChange={(n) => patch((x) => (x.trabajo.aportesVoluntariosRais = n))}
                  source="Art. 55 E.T. · Par. 1 Art. 135 Ley 100/1993"
                  hint="Aportes voluntarios al fondo de pensión obligatoria. Tope 25 % del ingreso laboral y 2.500 UVT globales."
                />
                <MoneyField
                  label="Apoyos económicos educativos (Becas no reembolsables)"
                  year={y}
                  value={d.trabajo.apoyosEducativos}
                  onChange={(n) => patch((x) => (x.trabajo.apoyosEducativos = n))}
                  source="Art. 46 E.T."
                  hint="Apoyos económicos estatales o empresariales entregados para programas de estudio e investigación (no gravables)."
                />
                <MoneyField
                  label="Otros ingresos no constitutivos de renta (INCRNGO)"
                  year={y}
                  value={d.trabajo.otrosINCRNGO}
                  onChange={(n) => patch((x) => (x.trabajo.otrosINCRNGO = n))}
                  hint="Demás conceptos expresamente calificados por el Estatuto Tributario como no constitutivos de renta ni ganancia ocasional."
                />
              </div>

              <h3 className="font-display text-lg">Rentas Exentas y Deducciones Imputables (Casillas 35 a 41)</h3>
              <div className={fieldGrid}>
                <MoneyField
                  label="Aportes voluntarios a FVP y cuentas AFC / AVC"
                  casilla={35}
                  year={y}
                  value={d.trabajo.aportesAfcFvpAvc}
                  onChange={(n) => patch((x) => (x.trabajo.aportesAfcFvpAvc = n))}
                  source="Arts. 126-1 y 126-4 E.T."
                  hint="Aportes a Fondos de Pensiones Voluntarias y ahorro en cuentas AFC/AVC. Límite 30 % del ingreso y 3.800 UVT. Permanencia 10 años."
                />
                <MoneyField
                  label="Indemnizaciones exentas (Accidente, maternidad, muerte)"
                  year={y}
                  value={d.trabajo.indemnizaciones}
                  onChange={(n) => patch((x) => (x.trabajo.indemnizaciones = n))}
                  source="Art. 206 Nums. 1, 2 y 3 E.T."
                  hint="Indemnizaciones por accidentes de trabajo, auxilio de maternidad y gastos de entierro (Exentas fuera del límite del 40%)."
                />
                <MoneyField
                  label="Gastos de representación exentos"
                  year={y}
                  value={d.trabajo.gastosRepresentacion}
                  onChange={(n) => patch((x) => (x.trabajo.gastosRepresentacion = n))}
                  source="Art. 206 Nums. 6 y 8 E.T."
                  hint="Magistrados 50 %, jueces y fiscales 25 %, rectores y profesores de universidades públicas 50 % (Exentos fuera del 40%)."
                />
                <MoneyField
                  label="Prestaciones y seguro por muerte FF.MM. y Policía"
                  year={y}
                  value={d.trabajo.ffmmPrestaciones}
                  onChange={(n) => patch((x) => (x.trabajo.ffmmPrestaciones = n))}
                  source="Art. 206 Num. 7 E.T."
                  hint="Indemnizaciones y prestaciones sociales por muerte de miembros de las FF.MM. y Policía Nacional."
                />
                <MoneyField
                  label="Exceso del salario básico FF.MM. y Policía Nacional"
                  year={y}
                  value={d.trabajo.ffmmExcesoSalario}
                  onChange={(n) => patch((x) => (x.trabajo.ffmmExcesoSalario = n))}
                  source="Art. 206 Num. 7 E.T."
                  hint="Exceso del salario básico percibido por oficiales y suboficiales de las FF.MM. y Policía."
                />
                <MoneyField
                  label="Rentas exentas por Convenios CAN (Decisión 578)"
                  year={y}
                  value={d.trabajo.rentasCan}
                  onChange={(n) => patch((x) => (x.trabajo.rentasCan = n))}
                  source="Decisión 578 CAN (Colombia, Perú, Ecuador, Bolivia)"
                  hint="Ingresos laborales obtenidos y gravados en países miembros de la Comunidad Andina (Exentos fuera del 40%)."
                />
                <MoneyField
                  label="Primas diplomáticas y de costo de vida en el exterior"
                  year={y}
                  value={d.trabajo.primasDiplomaticas}
                  onChange={(n) => patch((x) => (x.trabajo.primasDiplomaticas = n))}
                  source="Art. 206-1 E.T."
                  hint="Primas de servicio y de costo de vida en el exterior de diplomáticos colombianos."
                />
                <MoneyField
                  label="Otras rentas exentas laborales ilimitadas"
                  year={y}
                  value={d.trabajo.otrasExentasIlimitadas}
                  onChange={(n) => patch((x) => (x.trabajo.otrasExentasIlimitadas = n))}
                  hint="Rentas exentas que por ley expresa no se someten al límite conjunto del 40 % ni 1.340 UVT."
                />
                <MoneyField
                  label="Otras rentas exentas laborales limitadas"
                  year={y}
                  value={d.trabajo.otrasExentas}
                  onChange={(n) => patch((x) => (x.trabajo.otrasExentas = n))}
                  hint="Demás rentas exentas laborales sujetas al límite conjunto del 40 % o 1.340 UVT."
                />
                <MoneyField
                  label="Intereses de crédito de vivienda / leasing habitacional"
                  casilla={38}
                  year={y}
                  value={d.trabajo.interesesVivienda}
                  onChange={(n) => patch((x) => (x.trabajo.interesesVivienda = n))}
                  source="Art. 119 E.T. · Formato 220 casilla 52"
                  hint="Intereses y corrección monetaria pagados en créditos hipotecarios para adquisición de vivienda. Límite 1.200 UVT anuales."
                />
                <MoneyField
                  label="Medicina prepagada y seguros de salud"
                  year={y}
                  value={d.trabajo.medicinaPrepagada}
                  onChange={(n) => patch((x) => (x.trabajo.medicinaPrepagada = n))}
                  source="Art. 387 E.T. · Formato 220 casilla 53"
                  hint="Pagos por planes adicionales de salud y medicina prepagada del trabajador o su familia. Límite 16 UVT mensuales (192 UVT anuales)."
                />
                <MoneyField
                  label="Gravamen a los Movimientos Financieros - 4x1000 (Deducción 50%)"
                  year={y}
                  value={d.trabajo.gmf}
                  onChange={(n) => patch((x) => (x.trabajo.gmf = n))}
                  source="Art. 115 E.T. · Certificado anual del banco"
                  hint="Se deduce el 50 % del total del GMF (4x1000) efectivamente pagado y certificado por entidades financieras."
                />
                <MoneyField
                  label="Intereses en créditos educativos ICETEX"
                  year={y}
                  value={d.trabajo.icetex}
                  onChange={(n) => patch((x) => (x.trabajo.icetex = n))}
                  source="Art. 119 E.T."
                  hint="Intereses pagados por el contribuyente en créditos educativos con el ICETEX. Límite máximo 100 UVT anuales."
                />
                <MoneyField
                  label="Deducción anual FNCE / Movilidad eléctrica"
                  year={y}
                  value={d.trabajo.fnceAnual}
                  onChange={(n) => patch((x) => (x.trabajo.fnceAnual = n))}
                  source="Art. 11 Ley 1715/2014 modificada por Ley 2099/2021"
                  hint="50 % de la inversión en Fuentes No Convencionales de Energía y vehículos eléctricos amortizable en 15 años. Requiere certificado UPME."
                />
                <MoneyField
                  label="Otras deducciones imputables laborales"
                  year={y}
                  value={d.trabajo.otrasDeducciones}
                  onChange={(n) => patch((x) => (x.trabajo.otrasDeducciones = n))}
                  hint="Demás deducciones autorizadas por ley sujetas al límite conjunto del 40 % o 1.340 UVT."
                />
                <MoneyField
                  label="Compras con Factura Electrónica (Base para deducción del 1 %)"
                  casilla={28}
                  year={y}
                  value={d.trabajo.comprasFacturaElectronica}
                  onChange={(n) => patch((x) => (x.trabajo.comprasFacturaElectronica = n))}
                  source="Num. 5 Art. 336 E.T."
                  hint="Total de compras de bienes y servicios respaldadas con Factura Electrónica de Venta y pagadas por medios electrónicos. Tope 240 UVT (No entra al límite del 40%)."
                />
              </div>
              <div className="space-y-1.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Dependientes económicos a cargo (Art. 387 E.T. - Máx. 4)</p>
                  <span className="text-xs font-mono text-forest font-bold bg-forest-mist px-2 py-0.5 rounded-md">
                    {d.trabajo.dependientes} dependiente(s) seleccionado(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patch((x) => (x.trabajo.dependientes = n))}
                      className={cn(
                        "h-11 flex-1 rounded-lg border text-sm font-bold font-mono transition-colors",
                        d.trabajo.dependientes === n ? "border-forest bg-forest text-white shadow-xs" : "border-line bg-surface text-ink hover:bg-forest-mist",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  <strong>Beneficio doble por dependientes:</strong> 1) Deducción del 10 % del ingreso bruto laboral (máx. 32 UVT mensuales = {formatCOP((c.uvt || 0) * 32)}/mes) dentro del límite del 40 %. 2) Además, <strong>72 UVT anuales adicionales por cada dependiente</strong> ({formatCOP((c.uvt || 0) * 72)}) que salen del límite del 40 % y se restan directamente en la Casilla 139 (Art. 336 num. 2 E.T. y DUR 1.2.1.20.3).
                </p>
              </div>
            </Card>
          )}

          {sec === "hon" && (
            <Card className="space-y-4">
              <CardTitle>Honorarios y servicios personales (Cédula General)</CardTitle>
              <CardHint>
                Parágrafo 5 art. 206 y art. 336 E.T.: el profesional independiente puede optar por restar costos y deducciones procedentes (Art. 107) O tomar la renta exenta del 25 % laboral, no ambas simultáneamente sobre el mismo ingreso.
              </CardHint>
              <ToggleField
                label="Resta costos y deducciones procedentes en honorarios"
                hint="Si está activo, se habilitan costos (Casilla 45) y se inhabilita el 25 % de renta exenta laboral sobre esta subcédula."
                checked={d.honorarios.usarCostos}
                onChange={(v: boolean) => patch((x) => (x.honorarios.usarCostos = v))}
              />
              <div className={fieldGrid}>
                <MoneyField
                  label="Ingresos brutos por honorarios y servicios (Casilla 43)"
                  casilla={43}
                  year={y}
                  value={d.honorarios.ingresos}
                  onChange={(n) => patch((x) => (x.honorarios.ingresos = n))}
                  hint="Ingresos por asesorías, consultorías, servicios calificados y profesiones liberales independientes."
                  source="Formato 1001 / Formato 2276 Pagos por honorarios"
                />
                <MoneyField
                  label="Otros ingresos no constitutivos de renta (Casilla 44)"
                  casilla={44}
                  year={y}
                  value={d.honorarios.incrngo}
                  onChange={(n) => patch((x) => (x.honorarios.incrngo = n))}
                  hint="Componentes no constitutivos de renta aplicables a honorarios."
                />
                <MoneyField
                  label="Aportes obligatorios a pensión del independiente"
                  year={y}
                  value={d.honorarios.aportesPension}
                  onChange={(n) => patch((x) => (x.honorarios.aportesPension = n))}
                  source="Art. 55 E.T."
                  hint="Aportes obligatorios a pensión pagados por el independiente sobre su IBC."
                />
                <MoneyField
                  label="Aportes obligatorios a salud (EPS) del independiente"
                  year={y}
                  value={d.honorarios.aportesSalud}
                  onChange={(n) => patch((x) => (x.honorarios.aportesSalud = n))}
                  source="Art. 56 E.T."
                  hint="Aportes obligatorios a salud pagados por el independiente sobre su IBC."
                />
                <MoneyField
                  label="Cotización voluntaria a pensión obligatoria (RAIS)"
                  year={y}
                  value={d.honorarios.aportesRais}
                  onChange={(n) => patch((x) => (x.honorarios.aportesRais = n))}
                  hint="Aportes voluntarios del independiente al RAIS (Tope 25% y 2.500 UVT globales)."
                />
                <MoneyField
                  label="Costos y deducciones procedentes (Casilla 45)"
                  casilla={45}
                  year={y}
                  value={d.honorarios.costos}
                  onChange={(n) => patch((x) => (x.honorarios.costos = n))}
                  hint="Gastos con relación de causalidad y necesidad (Art. 107 E.T.). Requiere factura electrónica."
                />
                <MoneyField
                  label="Aportes voluntarios a FVP y cuentas AFC / AVC (Casilla 47)"
                  casilla={47}
                  year={y}
                  value={d.honorarios.aportesAfc}
                  onChange={(n) => patch((x) => (x.honorarios.aportesAfc = n))}
                  hint="Fondos de pensiones voluntarias y cuentas AFC (Arts. 126-1 y 126-4 E.T.). Límite 30% y 3.800 UVT."
                />
                <MoneyField
                  label="Rentas exentas por Convenios CAN (Decisión 578)"
                  year={y}
                  value={d.honorarios.rentasCan}
                  onChange={(n) => patch((x) => (x.honorarios.rentasCan = n))}
                  hint="Honorarios obtenidos en países de la Comunidad Andina (Fuera del 40%)."
                />
                <MoneyField
                  label="Otras rentas exentas de honorarios (Casilla 49)"
                  year={y}
                  value={d.honorarios.otrasExentas}
                  onChange={(n) => patch((x) => (x.honorarios.otrasExentas = n))}
                />
                <MoneyField
                  label="Intereses de crédito hipotecario de vivienda (Casilla 50)"
                  casilla={50}
                  year={y}
                  value={d.honorarios.interesesVivienda}
                  onChange={(n) => patch((x) => (x.honorarios.interesesVivienda = n))}
                  hint="Intereses de vivienda (Art. 119 E.T. - Tope 1.200 UVT globales)."
                />
                <MoneyField
                  label="Gravamen a los Movimientos Financieros - 4x1000 (Deducción 50%)"
                  year={y}
                  value={d.honorarios.gmf}
                  onChange={(n) => patch((x) => (x.honorarios.gmf = n))}
                  source="Art. 115 E.T."
                  hint="50% del 4x1000 pagado en cuentas bancarias de la actividad profesional."
                />
                <MoneyField
                  label="Intereses de créditos educativos ICETEX (Casilla 51)"
                  year={y}
                  value={d.honorarios.icetex}
                  onChange={(n) => patch((x) => (x.honorarios.icetex = n))}
                  hint="Intereses ICETEX (Art. 119 E.T. - Tope 100 UVT globales)."
                />
                <MoneyField
                  label="Medicina prepagada y seguros de salud"
                  year={y}
                  value={d.honorarios.medicinaPrepagada}
                  onChange={(n) => patch((x) => (x.honorarios.medicinaPrepagada = n))}
                  hint="Planes adicionales de salud (Art. 387 E.T. - Máx. 16 UVT mensuales)."
                />
                <MoneyField
                  label="Aportes a fondos de cesantías del independiente"
                  year={y}
                  value={d.honorarios.aportesCesantiasIndependiente}
                  onChange={(n) => patch((x) => (x.honorarios.aportesCesantiasIndependiente = n))}
                  hint="Ahorro en fondos de cesantías para independientes (Art. 126-1 E.T. - Tope 2.500 UVT y 1/12 del ingreso)."
                />
                <MoneyField
                  label="Deducción anual FNCE / Movilidad eléctrica"
                  year={y}
                  value={d.honorarios.fnceAnual}
                  onChange={(n) => patch((x) => (x.honorarios.fnceAnual = n))}
                  hint="Inversiones en energías limpias y vehículos eléctricos (Ley 1715/2014)."
                />
                <MoneyField
                  label="Otras deducciones imputables de honorarios (Casilla 52)"
                  year={y}
                  value={d.honorarios.otrasDeducciones}
                  onChange={(n) => patch((x) => (x.honorarios.otrasDeducciones = n))}
                />
                <MoneyField
                  label="Compensación de pérdidas de honorarios (Casilla 56)"
                  casilla={56}
                  year={y}
                  value={d.honorarios.compensacionPerdidas}
                  onChange={(n) => patch((x) => (x.honorarios.compensacionPerdidas = n))}
                  hint="Pérdidas fiscales generadas en años anteriores compensables según Art. 147 E.T."
                />
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
                  Casilla 140 marcada: los costos superan el 60 % de los ingresos. Deben estar soportados con factura electrónica.
                </p>
              ) : null}
            </Card>
          )}

          {sec === "cap" && (
            <Card className="space-y-4">
              <CardTitle>Rentas de capital (Cédula General)</CardTitle>
              <CardHint>Art. 335 E.T.: intereses bancarios, rendimientos financieros, arrendamientos, regalías y explotación de intangibles.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Intereses y rendimientos financieros (Casilla 58)"
                  casilla={58}
                  year={y}
                  value={d.capital.intereses}
                  onChange={(n) => patch((x) => (x.capital.intereses = n))}
                  hint="Intereses de cuentas de ahorro, CDT, fondos de inversión y rendimientos financieros (ej. Nu, Bancolombia)."
                  source="Certificados tributarios bancarios / Formato 1007"
                />
                <MoneyField
                  label="Ingresos por arrendamientos de bienes muebles e inmuebles"
                  year={y}
                  value={d.capital.arrendamientos}
                  onChange={(n) => patch((x) => (x.capital.arrendamientos = n))}
                  hint="Cánones de arrendamiento de apartamentos, locales, oficinas, bodegas, vehículos o maquinaria."
                />
                <MoneyField
                  label="Ingresos por regalías y derechos de autor"
                  year={y}
                  value={d.capital.regalias}
                  onChange={(n) => patch((x) => (x.capital.regalias = n))}
                  hint="Pagos por propiedad intelectual, marcas, patentes o derechos de explotación."
                />
                <MoneyField
                  label="Otros rendimientos financieros y fiducias"
                  year={y}
                  value={d.capital.rendimientosFinancieros}
                  onChange={(n) => patch((x) => (x.capital.rendimientosFinancieros = n))}
                />
                <MoneyField
                  label="Explotación de bienes intangibles"
                  year={y}
                  value={d.capital.explotacionIntangibles}
                  onChange={(n) => patch((x) => (x.capital.explotacionIntangibles = n))}
                  hint="Licenciamiento de software, franquicias y derechos comerciales."
                />
                <MoneyField
                  label="Rentas de capital obtenidas en el exterior"
                  year={y}
                  value={d.capital.ingresosExterior}
                  onChange={(n) => patch((x) => (x.capital.ingresosExterior = n))}
                  hint="Intereses, dividendos o alquileres percibidos fuera de Colombia (renta mundial)."
                />
                <MoneyField
                  label="Componente inflacionario no gravado (Casilla 59)"
                  casilla={59}
                  year={y}
                  value={d.capital.componenteInflacionario}
                  onChange={(n) => patch((x) => (x.capital.componenteInflacionario = n))}
                  source="Arts. 38 a 41 E.T."
                  hint="Porcentaje no constitutivo de renta de los rendimientos financieros fijado anualmente por decreto."
                />
                <MoneyField
                  label="Aportes obligatorios a pensión y salud del rentista"
                  year={y}
                  value={d.capital.aportesPension}
                  onChange={(n) => patch((x) => (x.capital.aportesPension = n))}
                  hint="Seguridad social obligatoria pagada sobre el IBC de las rentas de capital (Arts. 55 y 56 E.T.)."
                />
                <MoneyField
                  label="Cotización voluntaria a pensión obligatoria (RAIS)"
                  year={y}
                  value={d.capital.aportesRais}
                  onChange={(n) => patch((x) => (x.capital.aportesRais = n))}
                />
                <MoneyField
                  label="Otros ingresos no constitutivos de renta de capital"
                  year={y}
                  value={d.capital.incrngo}
                  onChange={(n) => patch((x) => (x.capital.incrngo = n))}
                />
                <MoneyField
                  label="Costos y gastos procedentes de capital (Casilla 60)"
                  casilla={60}
                  year={y}
                  value={d.capital.costos}
                  onChange={(n) => patch((x) => (x.capital.costos = n))}
                  hint="Gastos de mantenimiento, comisiones inmobiliarias, administración e impuestos de bienes arrendados (Art. 107 E.T.)."
                />
                <MoneyField
                  label="Rentas pasivas ECE - Sociedades en el exterior (Casilla 62)"
                  casilla={62}
                  year={y}
                  value={d.capital.ecePasiva}
                  onChange={(n) => patch((x) => (x.capital.ecePasiva = n))}
                  hint="Rentas pasivas de Entidades Controladas del Exterior (Régimen ECE - Arts. 882 a 893 E.T.)."
                />
                <MoneyField
                  label="Aportes voluntarios a FVP y cuentas AFC / AVC (Casilla 64)"
                  year={y}
                  value={d.capital.aportesAfc}
                  onChange={(n) => patch((x) => (x.capital.aportesAfc = n))}
                />
                <MoneyField
                  label="Rentas exentas por Convenios CAN (Decisión 578)"
                  year={y}
                  value={d.capital.rentasCan}
                  onChange={(n) => patch((x) => (x.capital.rentasCan = n))}
                />
                <MoneyField
                  label="Otras rentas exentas de capital (Casilla 66)"
                  year={y}
                  value={d.capital.otrasExentas}
                  onChange={(n) => patch((x) => (x.capital.otrasExentas = n))}
                />
                <MoneyField
                  label="Intereses de crédito de vivienda (Casilla 67)"
                  year={y}
                  value={d.capital.interesesVivienda}
                  onChange={(n) => patch((x) => (x.capital.interesesVivienda = n))}
                />
                <MoneyField
                  label="Gravamen a los Movimientos Financieros - 4x1000 (Deducción 50%)"
                  year={y}
                  value={d.capital.gmf}
                  onChange={(n) => patch((x) => (x.capital.gmf = n))}
                />
                <MoneyField
                  label="Intereses en créditos educativos ICETEX (Casilla 68)"
                  year={y}
                  value={d.capital.icetex}
                  onChange={(n) => patch((x) => (x.capital.icetex = n))}
                />
                <MoneyField
                  label="Aportes a cesantías del independiente (Casilla 69)"
                  year={y}
                  value={d.capital.aportesCesantiasIndependiente}
                  onChange={(n) => patch((x) => (x.capital.aportesCesantiasIndependiente = n))}
                />
                <MoneyField
                  label="Deducción anual FNCE / Movilidad eléctrica"
                  year={y}
                  value={d.capital.fnceAnual}
                  onChange={(n) => patch((x) => (x.capital.fnceAnual = n))}
                />
                <MoneyField
                  label="Otras deducciones imputables de capital (Casilla 70)"
                  year={y}
                  value={d.capital.otrasDeducciones}
                  onChange={(n) => patch((x) => (x.capital.otrasDeducciones = n))}
                />
                <MoneyField
                  label="Compensación de pérdidas de capital (Casilla 72)"
                  casilla={72}
                  year={y}
                  value={d.capital.compensacionPerdidas}
                  onChange={(n) => patch((x) => (x.capital.compensacionPerdidas = n))}
                />
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
              <CardTitle>Rentas no laborales (Cédula General)</CardTitle>
              <CardHint>Comercio, servicios empresariales, agricultura, notarios, curadores, ventas de activos poseídos menos de 2 años y lo no clasificado en otra cédula.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Ingresos brutos por comercio, servicios y actividades no laborales (Casilla 74)"
                  casilla={74}
                  year={y}
                  value={d.noLaborales.ingresos}
                  onChange={(n) => patch((x) => (x.noLaborales.ingresos = n))}
                  hint="Total de ingresos brutos por ventas, comercio, prestación de servicios empresariales y actividades mercantiles."
                />
                <MoneyField
                  label="Venta de activos fijos poseídos menos de 2 años"
                  year={y}
                  value={d.noLaborales.ventas}
                  onChange={(n) => patch((x) => (x.noLaborales.ventas = n))}
                  hint="Si el activo se poseyó por 2 años o más, califica como Ganancia Ocasional."
                />
                <MoneyField
                  label="Devoluciones, rebajas y descuentos en ventas (Casilla 75)"
                  casilla={75}
                  year={y}
                  value={d.noLaborales.devoluciones}
                  onChange={(n) => patch((x) => (x.noLaborales.devoluciones = n))}
                  hint="Anulaciones, devoluciones y descuentos comerciales pie de factura concedidos a clientes."
                />
                <MoneyField
                  label="Apoyos educativos no gravados (Art. 46 E.T.)"
                  year={y}
                  value={d.noLaborales.apoyosEducativos}
                  onChange={(n) => patch((x) => (x.noLaborales.apoyosEducativos = n))}
                />
                <MoneyField
                  label="Indemnizaciones por seguro de daño emergente (Art. 45 E.T.)"
                  year={y}
                  value={d.noLaborales.indemnizacionesSeguroDano}
                  onChange={(n) => patch((x) => (x.noLaborales.indemnizacionesSeguroDano = n))}
                  source="Art. 45 E.T."
                  hint="Ingreso no constitutivo de renta que cubre la pérdida material de un bien asegurado."
                />
                <MoneyField
                  label="Aportes obligatorios a pensión y salud no laborales"
                  year={y}
                  value={d.noLaborales.aportesPension}
                  onChange={(n) => patch((x) => (x.noLaborales.aportesPension = n))}
                />
                <MoneyField
                  label="Otros ingresos no constitutivos de renta (INCRNGO)"
                  year={y}
                  value={d.noLaborales.incrngo}
                  onChange={(n) => patch((x) => (x.noLaborales.incrngo = n))}
                />
                <MoneyField
                  label="Costos y deducciones procedentes (Casilla 77)"
                  casilla={77}
                  year={y}
                  value={d.noLaborales.costos}
                  onChange={(n) => patch((x) => (x.noLaborales.costos = n))}
                  hint="Costo de ventas de mercancías, nómina, arriendos y gastos operativos soportados con factura electrónica."
                />
                <MoneyField
                  label="Rentas pasivas ECE - Sociedades en el exterior (Casilla 79)"
                  casilla={79}
                  year={y}
                  value={d.noLaborales.ecePasiva}
                  onChange={(n) => patch((x) => (x.noLaborales.ecePasiva = n))}
                />
                <MoneyField
                  label="Aportes voluntarios a FVP y cuentas AFC / AVC (Casilla 81)"
                  year={y}
                  value={d.noLaborales.aportesAfc}
                  onChange={(n) => patch((x) => (x.noLaborales.aportesAfc = n))}
                />
                <MoneyField
                  label="Rentas exentas por Convenios CAN (Decisión 578)"
                  year={y}
                  value={d.noLaborales.rentasCan}
                  onChange={(n) => patch((x) => (x.noLaborales.rentasCan = n))}
                />
                <MoneyField
                  label="Otras rentas exentas no laborales (Casilla 83)"
                  year={y}
                  value={d.noLaborales.otrasExentas}
                  onChange={(n) => patch((x) => (x.noLaborales.otrasExentas = n))}
                />
                <MoneyField
                  label="Intereses de crédito hipotecario de vivienda (Casilla 84)"
                  year={y}
                  value={d.noLaborales.interesesVivienda}
                  onChange={(n) => patch((x) => (x.noLaborales.interesesVivienda = n))}
                />
                <MoneyField
                  label="Gravamen a los Movimientos Financieros - 4x1000 (Deducción 50%)"
                  year={y}
                  value={d.noLaborales.gmf}
                  onChange={(n) => patch((x) => (x.noLaborales.gmf = n))}
                />
                <MoneyField
                  label="Intereses en créditos educativos ICETEX (Casilla 85)"
                  year={y}
                  value={d.noLaborales.icetex}
                  onChange={(n) => patch((x) => (x.noLaborales.icetex = n))}
                />
                <MoneyField
                  label="Aportes a cesantías del independiente (Casilla 86)"
                  year={y}
                  value={d.noLaborales.aportesCesantiasIndependiente}
                  onChange={(n) => patch((x) => (x.noLaborales.aportesCesantiasIndependiente = n))}
                />
                <MoneyField
                  label="Deducción anual FNCE / Movilidad eléctrica"
                  year={y}
                  value={d.noLaborales.fnceAnual}
                  onChange={(n) => patch((x) => (x.noLaborales.fnceAnual = n))}
                />
                <MoneyField
                  label="Otras deducciones imputables no laborales (Casilla 87)"
                  year={y}
                  value={d.noLaborales.otrasDeducciones}
                  onChange={(n) => patch((x) => (x.noLaborales.otrasDeducciones = n))}
                />
                <MoneyField
                  label="Compensación de pérdidas no laborales (Casilla 89)"
                  casilla={89}
                  year={y}
                  value={d.noLaborales.compensacionPerdidas}
                  onChange={(n) => patch((x) => (x.noLaborales.compensacionPerdidas = n))}
                />
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
              <CardHint>Num. 5 art. 206 E.T.: exenta la parte que no supere 1.000 UVT mensuales ({formatCOP(c.uvt * 1000)}/mes), después de descontar aportes obligatorios a salud y solidaridad.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Ingresos brutos por pensiones (país y exterior - Casilla 99)"
                  casilla={99}
                  year={y}
                  value={d.pensiones.ingresos}
                  onChange={(n) => patch((x) => (x.pensiones.ingresos = n))}
                  hint="Mesadas pensionales de jubilación, vejez, invalidez y sobrevivientes pagadas por Colpensiones, fondos privados o aseguradoras."
                />
                <MoneyField
                  label="Aportes obligatorios a salud y solidaridad pensional (Casilla 100)"
                  casilla={100}
                  year={y}
                  value={d.pensiones.incrngo}
                  onChange={(n) => patch((x) => (x.pensiones.incrngo = n))}
                  hint="Descuentos obligatorios efectuados en la mesada para el sistema de salud (EPS) y fondo de solidaridad."
                />
              </div>
              <div className="space-y-1.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Meses de mesada pensional pagados en el año</p>
                  <span className="text-xs font-mono text-forest font-bold bg-forest-mist px-2 py-0.5 rounded-md">
                    {d.pensiones.meses} meses seleccionados
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={d.pensiones.meses}
                  onChange={(e) => patch((x) => (x.pensiones.meses = Number(e.target.value)))}
                  className="w-full accent-[var(--color-forest)] cursor-pointer"
                />
                <p className="text-xs text-muted">
                  Exención máxima calculada para {d.pensiones.meses} mesadas: <strong>{formatCOP((c.casillas[102] ?? 0))}</strong> (Art. 206 Num. 5 E.T.).
                </p>
              </div>
            </Card>
          )}

          {sec === "div" && (
            <Card className="space-y-4">
              <CardTitle>Dividendos y participaciones</CardTitle>
              <CardHint>El certificado tributario emitido por la sociedad detalla el año de origen de las utilidades y si corresponden al Numeral 3 o Parágrafo 2 del Art. 49 del E.T.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Dividendos año 2016 y anteriores gravados (Casilla 104)"
                  casilla={104}
                  year={y}
                  value={d.dividendos.div2016}
                  onChange={(n) => patch((x) => (x.dividendos.div2016 = n))}
                />
                <MoneyField
                  label="Dividendos año 2016 y anteriores no gravados (Casilla 105)"
                  casilla={105}
                  year={y}
                  value={d.dividendos.incrngo2016}
                  onChange={(n) => patch((x) => (x.dividendos.incrngo2016 = n))}
                />
                <MoneyField
                  label="1ª Subcédula 2017+ (No gravados en sociedad - Num. 3 Art. 49 - Casilla 107)"
                  casilla={107}
                  year={y}
                  value={d.dividendos.subcedula1}
                  onChange={(n) => patch((x) => (x.dividendos.subcedula1 = n))}
                  hint="Se integran a la base de la tabla del Art. 241 E.T. con descuento tributario del 19 % (Art. 242 E.T.)."
                />
                <MoneyField
                  label="2ª Subcédula 2017+ (Gravados en sociedad - Par. 2 Art. 49 - Casilla 108)"
                  casilla={108}
                  year={y}
                  value={d.dividendos.subcedula2}
                  onChange={(n) => patch((x) => (x.dividendos.subcedula2 = n))}
                  hint="Tributan primero a la tarifa general de sociedades (35%) y el remanente a la tabla general."
                />
                <MoneyField
                  label="Dividendos recibidos del exterior (Casilla 109)"
                  casilla={109}
                  year={y}
                  value={d.dividendos.exterior}
                  onChange={(n) => patch((x) => (x.dividendos.exterior = n))}
                />
                <MoneyField
                  label="Rentas exentas de dividendos del exterior CAN / CDI (Casilla 110)"
                  casilla={110}
                  year={y}
                  value={d.dividendos.exentasExterior}
                  onChange={(n) => patch((x) => (x.dividendos.exentasExterior = n))}
                />
              </div>
            </Card>
          )}

          {sec === "go" && (
            <Card className="space-y-4">
              <CardTitle>Ganancias ocasionales</CardTitle>
              <CardHint>Tarifa general del 15 % (enajenación de activos fijos poseídos 2 años o más, herencias, donaciones) y 20 % en loterías, rifas y apuestas (Arts. 300 a 317 E.T.).</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Venta de activos fijos poseídos 2 años o más (Casilla 112)"
                  casilla={112}
                  year={y}
                  value={d.gananciasOcasionales.enajenacionActivos}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.enajenacionActivos = n))}
                  hint="Valor de la enajenación de inmuebles, vehículos o acciones poseídos por 2 años o más (Art. 300 E.T.)."
                />
                <MoneyField
                  label="Costo fiscal de los activos fijos enajenados (Casilla 113)"
                  casilla={113}
                  year={y}
                  value={d.gananciasOcasionales.costos}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.costos = n))}
                  hint="Mayor entre costo de adquisición, avalúo catastral o autoavalúo declarado (Arts. 72, 73 y 277 E.T.)."
                />
                <MoneyField
                  label="Herencias, legados y porción conyugal"
                  year={y}
                  value={d.gananciasOcasionales.herencias}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.herencias = n))}
                  hint="Bienes y derechos recibidos por causa de muerte / sucesión ilíquida (Art. 302 E.T.)."
                />
                <MoneyField
                  label="Donaciones y actos a título gratuito"
                  year={y}
                  value={d.gananciasOcasionales.donaciones}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.donaciones = n))}
                  hint="Bienes y recursos recibidos como donación entre vivos (Art. 302 E.T.)."
                />
                <MoneyField
                  label="Premios por loterías, rifas, apuestas y similares"
                  year={y}
                  value={d.gananciasOcasionales.loterias}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.loterias = n))}
                  hint="Tarifa especial del 20 % retenida en la fuente por el operador del juego (Arts. 306 y 317 E.T.)."
                />
                <MoneyField
                  label="Indemnizaciones por seguro de vida"
                  year={y}
                  value={d.gananciasOcasionales.seguroVida}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.seguroVida = n))}
                  hint="No gravado hasta 3.250 UVT (Art. 303-1 E.T.). El exceso tributa al 15%."
                />
                <MoneyField
                  label="Venta de casa o apartamento de habitación"
                  year={y}
                  value={d.gananciasOcasionales.ventaVivienda}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.ventaVivienda = n))}
                  hint="Hasta 5.000 UVT exentas si el valor se destina a adquirir otra vivienda o pagar crédito hipotecario (Art. 311-1 E.T.)."
                />
                <MoneyField
                  label="Otros ingresos por ganancia ocasional"
                  year={y}
                  value={d.gananciasOcasionales.otros}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.otros = n))}
                />
                <MoneyField
                  label="Ganancias ocasionales no gravadas y exentas (Casilla 114)"
                  casilla={114}
                  year={y}
                  value={d.gananciasOcasionales.goNoGravadas}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.goNoGravadas = n))}
                />
                <MoneyField
                  label="Impuesto pagado en el exterior por ganancia ocasional (Casilla 128)"
                  casilla={128}
                  year={y}
                  value={d.gananciasOcasionales.impuestoExterior}
                  onChange={(n) => patch((x) => (x.gananciasOcasionales.impuestoExterior = n))}
                />
              </div>
            </Card>
          )}

          {sec === "dsc" && (
            <Card className="space-y-4">
              <CardTitle>Descuentos tributarios, retenciones y liquidación privada</CardTitle>
              <CardHint>Descuentos que restan directamente del impuesto a cargo (Arts. 254 a 258 E.T.), retenciones en la fuente practicadas y saldos a favor anteriores.</CardHint>
              <div className={fieldGrid}>
                <MoneyField
                  label="Compras con Factura Electrónica (Base para deducción del 1 %)"
                  casilla={28}
                  year={y}
                  value={d.trabajo.comprasFacturaElectronica}
                  onChange={(n) => patch((x) => (x.trabajo.comprasFacturaElectronica = n))}
                  hint={`Art. 336 num. 5 E.T. Deducción del 1% calculada: ${formatCOP(c.casillas[28] ?? 0)} (tope máx. 240 UVT).`}
                />
                <MoneyField
                  label="Impuestos pagados en el exterior (Tax Credit - Casilla 122)"
                  casilla={122}
                  year={y}
                  value={d.descuentos.impuestosExterior}
                  onChange={(n) => patch((x) => (x.descuentos.impuestosExterior = n))}
                  source="Art. 254 E.T."
                  hint="Descuento tributario por impuestos pagados en otros países sobre rentas de fuente extranjera."
                />
                <MoneyField
                  label="Donaciones a entidades sin ánimo de lucro ESAL (Casilla 123)"
                  casilla={123}
                  year={y}
                  value={d.descuentos.donaciones}
                  onChange={(n) => patch((x) => (x.descuentos.donaciones = n))}
                  hint="Donaciones a entidades del Régimen Tributario Especial (25 % de descuento) o proyectos de I+D+i (30 %). Límite conjunto 30 % del impuesto."
                />
                <MoneyField
                  label="IVA de activos fijos reales productivos (Casilla 124)"
                  year={y}
                  value={d.descuentos.ivaActivosFijos}
                  onChange={(n) => patch((x) => (x.descuentos.ivaActivosFijos = n))}
                  hint="Descuento tributario del IVA pagado en la importación o adquisición de maquinaria pesada (Art. 258-1 E.T.)."
                />
                <MoneyField
                  label="Otros descuentos tributarios legalmente autorizados"
                  year={y}
                  value={d.descuentos.otros}
                  onChange={(n) => patch((x) => (x.descuentos.otros = n))}
                />
                <MoneyField
                  label="Retenciones en la fuente practicadas en el año (Casilla 132)"
                  casilla={132}
                  year={y}
                  value={d.extra.retenciones}
                  onChange={(n) => patch((x) => (x.extra.retenciones = n))}
                  hint="Total de retenciones en la fuente que le practicaron en el año gravable. Se restan directamente del impuesto."
                />
                <MoneyField
                  label="Anticipo de renta liquidado el año anterior (Casilla 130)"
                  casilla={130}
                  year={y}
                  value={d.extra.anticipoAnterior}
                  onChange={(n) => patch((x) => (x.extra.anticipoAnterior = n))}
                  hint="Anticipo liquidado en la declaración del año gravable anterior para este período."
                />
                <MoneyField
                  label="Saldo a favor del año anterior sin devolución (Casilla 131)"
                  casilla={131}
                  year={y}
                  value={d.extra.saldoFavorAnterior}
                  onChange={(n) => patch((x) => (x.extra.saldoFavorAnterior = n))}
                  hint="Saldo a favor de la declaración del año previo arrastrado sin solicitud de devolución o compensación."
                />
                <MoneyField
                  label="Impuesto neto de renta del año anterior"
                  year={y}
                  value={d.extra.impuestoNetoAnterior}
                  onChange={(n) => patch((x) => (x.extra.impuestoNetoAnterior = n))}
                  hint="Para calcular la procedencia del Beneficio de Auditoría del Art. 689-3 del E.T."
                />
                <MoneyField
                  label="Rentas gravables por omisión de activos o comparación (Casilla 96)"
                  casilla={96}
                  year={y}
                  value={d.extra.rentasGravables}
                  onChange={(n) => patch((x) => (x.extra.rentasGravables = n))}
                  hint="Renta líquida por omisión de activos o inclusión de pasivos inexistentes (Arts. 236-239 E.T.)."
                />
                <MoneyField
                  label="Compensación de pérdidas 2018 y anteriores (Casilla 94)"
                  casilla={94}
                  year={y}
                  value={d.extra.compensacionPerdidas2018}
                  onChange={(n) => patch((x) => (x.extra.compensacionPerdidas2018 = n))}
                />
                <MoneyField
                  label="Compensación exceso de renta presuntiva (Casilla 95)"
                  casilla={95}
                  year={y}
                  value={d.extra.compensacionExcesoPresuntiva}
                  onChange={(n) => patch((x) => (x.extra.compensacionExcesoPresuntiva = n))}
                />
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
                <MoneyField
                  label="Renta presuntiva manual (si aplica - Casilla 98)"
                  casilla={98}
                  year={y}
                  value={d.extra.rentaPresuntivaManual}
                  onChange={(n) => patch((x) => (x.extra.rentaPresuntivaManual = n))}
                  hint="Tarifa 0 % en años recientes; informe únicamente rentas de activos exceptuados (Art. 189 E.T.)."
                />
                <MoneyField
                  label="Sanciones tributarias liquidadas (Casilla 135)"
                  casilla={135}
                  year={y}
                  value={d.extra.sanciones}
                  onChange={(n) => patch((x) => (x.extra.sanciones = n))}
                  hint={`Mínima 10 UVT ${formatCOP(c.uvtFiling * 10)} (UVT año de presentación).`}
                />
                <MoneyField
                  label="Aporte voluntario a programas sociales (Casilla 141)"
                  casilla={141}
                  year={y}
                  value={d.extra.aporteVoluntario}
                  onChange={(n) => patch((x) => (x.extra.aporteVoluntario = n))}
                  hint="Aporte voluntario no reembolsable del Art. 244-1 del E.T."
                />
              </div>
            </Card>
          )}
        </div>

        {splitScreen ? (
          <aside
            className="hidden lg:flex flex-col sticky top-20 h-[calc(100vh-6rem)] min-w-0 transition-all duration-150 shrink-0"
            style={{
              flex: `0 0 calc(${100 - splitRatio}% - 1.5rem)`,
              maxWidth: `calc(${100 - splitRatio}% - 1.5rem)`,
            }}
          >
            <LiveFormPreview />
          </aside>
        ) : (
          <aside className="space-y-3 lg:sticky lg:top-24 h-[calc(100vh-7rem)] flex flex-col min-h-0 w-full lg:w-72 shrink-0">
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
