import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  RefreshCw,
  Sparkles,
  Info,
  Building2,
  Wallet,
  Briefcase,
  Coins,
  Receipt,
} from "lucide-react";
import { AlertList } from "@/components/layout/alert-list";
import { MoneyField, ToggleField } from "@/components/layout/money-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { dianRoundThousands, pesosFromUvt, uvtFromPesos } from "@/lib/tax/uvt";

export const Route = createFileRoute("/topes")({ component: TopesPage });

export function TopesPage() {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();
  const year = d.year;
  const ov = d.uvtOverrides;

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  // 1. Ingresos brutos consolidados desde la declaración (todas las cédulas y ganancias ocasionales)
  const sumCedulas = {
    trabajo: c.casillas[32] || 0,
    honorarios: c.casillas[43] || 0,
    capital: c.casillas[58] || 0,
    noLaborales: c.casillas[74] || 0,
    pensiones: c.casillas[99] || 0,
    dividendos:
      (c.casillas[104] || 0) +
      (c.casillas[107] || 0) +
      (c.casillas[108] || 0) +
      (c.casillas[109] || 0),
    gananciasOcasionales: c.casillas[112] || 0,
  };

  const ingBrutosDeclarados =
    sumCedulas.trabajo +
    sumCedulas.honorarios +
    sumCedulas.capital +
    sumCedulas.noLaborales +
    sumCedulas.pensiones +
    sumCedulas.dividendos +
    sumCedulas.gananciasOcasionales;

  // 2. Patrimonio bruto consolidado desde la declaración (Casilla 29)
  const patrimonioDeclarado = c.casillas[29] || 0;
  const comprasFE = d.trabajo.comprasFacturaElectronica || 0;
  const hasDeclarationData = patrimonioDeclarado > 0 || ingBrutosDeclarados > 0 || comprasFE > 0;

  // 3. Modo de sincronización automática (por defecto activo)
  const isAutoSync = d.topes.autoSyncFromDeclaration !== false;

  // 4. Sincronización reactiva automática en tiempo real con el Diligenciamiento 210
  useEffect(() => {
    if (!isAutoSync) return;
    const needsPat = patrimonioDeclarado > 0 && d.topes.patrimonioBruto !== patrimonioDeclarado;
    const needsIng = ingBrutosDeclarados > 0 && d.topes.ingresosBrutos !== ingBrutosDeclarados;
    if (needsPat || needsIng) {
      patch((x) => {
        if (patrimonioDeclarado > 0) x.topes.patrimonioBruto = patrimonioDeclarado;
        if (ingBrutosDeclarados > 0) x.topes.ingresosBrutos = ingBrutosDeclarados;
      });
    }
  }, [
    isAutoSync,
    patrimonioDeclarado,
    ingBrutosDeclarados,
    d.topes.patrimonioBruto,
    d.topes.ingresosBrutos,
    patch,
  ]);

  function handleSyncFromDeclaration() {
    patch((x) => {
      x.topes.autoSyncFromDeclaration = true;
      if (patrimonioDeclarado > 0) x.topes.patrimonioBruto = patrimonioDeclarado;
      if (ingBrutosDeclarados > 0) x.topes.ingresosBrutos = ingBrutosDeclarados;
      if (comprasFE > 0 && x.topes.compras === 0) x.topes.compras = comprasFE;
    });
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2500);
  }

  const ROWS: {
    key: "patrimonioBruto" | "ingresosBrutos" | "consumosTarjeta" | "compras" | "consignaciones";
    label: string;
    hint: string;
    uvt: number;
    source: string;
    origin?: string;
  }[] = [
    {
      key: "patrimonioBruto",
      label: "Patrimonio bruto al 31 de diciembre",
      hint: "Bienes y derechos apreciables en dinero, en el país o en el exterior (Casilla 29 del Formulario 210).",
      uvt: 4500,
      source: "Art. 592 E.T.",
      origin: isAutoSync && patrimonioDeclarado > 0 ? "Casilla 29 · Diligenciamiento 210" : undefined,
    },
    {
      key: "ingresosBrutos",
      label: "Ingresos brutos del año",
      hint: "Suma de todos los ingresos ordinarios y extraordinarios de todas las cédulas y ganancias ocasionales.",
      uvt: 1400,
      source: "Art. 592 E.T.",
      origin:
        isAutoSync && ingBrutosDeclarados > 0
          ? "Suma de 7 Cédulas y GO · Diligenciamiento 210"
          : undefined,
    },
    {
      key: "consumosTarjeta",
      label: "Consumos con tarjeta de crédito",
      hint: "Incluye consumos con tarjetas de crédito propias y de terceros utilizadas en el año.",
      uvt: 1400,
      source: "Art. 594-3 E.T.",
      origin: d.topes.consumosTarjeta > 0 ? "Extractos Bancarios / Exógena" : undefined,
    },
    {
      key: "compras",
      label: "Compras y consumos totales",
      hint: "Adquisiciones del año con cualquier medio de pago, con o sin factura.",
      uvt: 1400,
      source: "Art. 594-3 E.T.",
      origin:
        comprasFE > 0 && d.topes.compras === comprasFE
          ? "Factura Electrónica (Art. 336 num. 5)"
          : undefined,
    },
    {
      key: "consignaciones",
      label: "Consignaciones, depósitos e inversiones",
      hint: "Valor acumulado consignado en cuentas bancarias, fiduciarias o fondos.",
      uvt: 1400,
      source: "Art. 594-3 E.T.",
      origin: d.topes.consignaciones > 0 ? "Extractos Bancarios / Exógena" : undefined,
    },
  ];

  const getRowValue = (key: (typeof ROWS)[number]["key"]): number => {
    if (key === "patrimonioBruto" && isAutoSync && patrimonioDeclarado > 0) {
      return patrimonioDeclarado;
    }
    if (key === "ingresosBrutos" && isAutoSync && ingBrutosDeclarados > 0) {
      return ingBrutosDeclarados;
    }
    if (key === "compras" && isAutoSync && comprasFE > 0 && d.topes.compras === 0) {
      return comprasFE;
    }
    return d.topes[key] || 0;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Paso 1 · Criterios de Obligación · Arts. 592, 593 y 594-3 E.T.
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold">1. Diagnóstico de Topes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Evaluación técnica de topes al 31 de diciembre de {year} con la UVT oficial de{" "}
            {formatCOP(c.uvt)}. Basta con superar <em>uno</em> de los umbrales legales para estar
            obligado a presentar el Formulario 210 en el calendario oficial de la DIAN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasDeclarationData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncFromDeclaration}
              className="gap-2 text-xs border-forest/30 text-forest hover:bg-forest-mist shadow-2xs"
              title="Actualiza los topes con los montos actuales de la declaración o archivo de exógena"
            >
              {syncToast ? <Check className="size-3.5 text-emerald-600" /> : <RefreshCw className="size-3.5" />}
              {syncToast ? "¡Cifras sincronizadas!" : "Sincronizar Cifras de la Declaración"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowBreakdown((v) => !v)}
            className="gap-1.5 text-xs text-muted hover:text-ink"
            title="Ver de dónde provienen los ingresos y patrimonio calculados"
          >
            <Layers className="size-3.5" />
            {showBreakdown ? "Ocultar desglose" : "Ver desglose de partidas"}
            {showBreakdown ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </header>

      {/* Tarjeta de Control: Sincronización Automática */}
      <div className="rounded-xl border border-forest/30 bg-forest-mist/50 p-4 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-forest" />
              <span className="text-sm font-semibold text-ink">
                Sincronización automática con el Diligenciamiento 210
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAutoSync
                    ? "bg-forest text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {isAutoSync ? "ACTIVA EN TIEMPO REAL" : "MODO MANUAL"}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Al ingresar datos en el <strong>Paso 3 (Diligenciamiento 210)</strong> o cargar{" "}
              <strong>Exógena (Paso 2)</strong>, los ingresos de todas las cédulas y el patrimonio
              bruto se suman y sincronizan automáticamente aquí en el diagnóstico.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={isAutoSync ? "default" : "outline"}
              size="sm"
              onClick={() =>
                patch((x) => {
                  const nextVal = !isAutoSync;
                  x.topes.autoSyncFromDeclaration = nextVal;
                  if (nextVal) {
                    if (patrimonioDeclarado > 0) x.topes.patrimonioBruto = patrimonioDeclarado;
                    if (ingBrutosDeclarados > 0) x.topes.ingresosBrutos = ingBrutosDeclarados;
                  }
                })
              }
              className={`text-xs gap-1.5 font-semibold ${
                isAutoSync ? "bg-forest text-white hover:bg-forest-deep" : ""
              }`}
            >
              <RefreshCw className={`size-3.5 ${isAutoSync ? "animate-spin-slow" : ""}`} />
              {isAutoSync ? "Sincronización Automática: SÍ" : "Activar Sincronización"}
            </Button>
          </div>
        </div>
      </div>

      {/* Desglose Expandible de Partidas */}
      {showBreakdown && (
        <Card className="border-forest/30 bg-surface shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-forest" />
                Desglose de Partidas del Diligenciamiento 210
              </CardTitle>
              <CardHint>
                Suma detallada de los conceptos ingresados en la declaración que alimentan los topes
              </CardHint>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs gap-1">
              <Link to="/declaracion">
                Ir a Diligenciamiento 210 <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Columna 1: Patrimonio Bruto */}
            <div className="p-3 bg-muted-mist/40 rounded-lg border border-line space-y-2">
              <div className="flex items-center justify-between border-b border-line pb-1.5 font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-forest" />
                  Patrimonio Bruto (Casilla 29)
                </span>
                <span className="font-mono text-sm font-bold text-forest-deep">
                  {formatCOP(patrimonioDeclarado)}
                </span>
              </div>
              <ul className="space-y-1 font-mono text-ink-soft">
                <li className="flex justify-between">
                  <span>Inmuebles:</span>
                  <span>{formatCOP(d.patrimonio.inmuebles)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cuentas bancarias y efectivo:</span>
                  <span>{formatCOP(d.patrimonio.cuentas + d.patrimonio.efectivo)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Inversiones y fondos de cesantías:</span>
                  <span>
                    {formatCOP(d.patrimonio.inversiones + (d.patrimonio.cesantiasFondos || 0))}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Vehículos:</span>
                  <span>{formatCOP(d.patrimonio.vehiculos)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cuentas por cobrar:</span>
                  <span>{formatCOP(d.patrimonio.cuentasPorCobrar)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Muebles, enseres y otros activos:</span>
                  <span>
                    {formatCOP(
                      d.patrimonio.muebles +
                        d.patrimonio.cripto +
                        d.patrimonio.inventarios +
                        d.patrimonio.otrosActivos,
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Columna 2: Ingresos Brutos */}
            <div className="p-3 bg-muted-mist/40 rounded-lg border border-line space-y-2">
              <div className="flex items-center justify-between border-b border-line pb-1.5 font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-forest" />
                  Ingresos Brutos (Todas las Cédulas y GO)
                </span>
                <span className="font-mono text-sm font-bold text-forest-deep">
                  {formatCOP(ingBrutosDeclarados)}
                </span>
              </div>
              <ul className="space-y-1 font-mono text-ink-soft">
                <li className="flex justify-between">
                  <span>Cédula Trabajo (c.32):</span>
                  <span>{formatCOP(sumCedulas.trabajo)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cédula Honorarios con costos (c.43):</span>
                  <span>{formatCOP(sumCedulas.honorarios)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cédula Rentas de Capital (c.58):</span>
                  <span>{formatCOP(sumCedulas.capital)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cédula No Laborales (c.74):</span>
                  <span>{formatCOP(sumCedulas.noLaborales)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cédula Pensiones (c.99):</span>
                  <span>{formatCOP(sumCedulas.pensiones)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Cédula Dividendos (c.104/107/108/109):</span>
                  <span>{formatCOP(sumCedulas.dividendos)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Ganancias Ocasionales (c.112):</span>
                  <span>{formatCOP(sumCedulas.gananciasOcasionales)}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Resultado del Diagnóstico */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Resultado del Diagnóstico</CardTitle>
          <CardHint>
            {c.obligado
              ? "Con los datos actuales SÍ está obligado a presentar el Formulario 210 ante la DIAN."
              : "Ningún tope legal se ha cruzado todavía. Puede presentar la declaración de forma voluntaria para solicitar devolución de retenciones."}
          </CardHint>
          {c.razonesObligado && c.razonesObligado.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {c.razonesObligado.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-stamp-mist text-stamp px-2.5 py-0.5 rounded-full border border-stamp/20"
                >
                  • {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <Badge tone={c.obligado ? "stamp" : "ok"} className="text-sm px-3 py-1 font-bold">
          {c.obligado ? "🚨 OBLIGADO A DECLARAR" : "✅ NO OBLIGADO (POR AHORA)"}
        </Badge>
      </Card>

      <ToggleField
        label={`Fue responsable de IVA al 31 de diciembre de ${year}`}
        hint="Si estaba en el régimen de IVA, debe declarar renta aunque no cruce los demás topes (art. 592 E.T.)."
        checked={d.identity.responsableIva}
        onChange={(v) =>
          patch((x) => {
            x.identity.responsableIva = v;
          })
        }
      />

      {/* Listado de las 5 Casillas de Topes */}
      <div className="grid gap-4">
        {ROWS.map((row) => {
          const pesos = dianRoundThousands(pesosFromUvt(row.uvt, year, ov));
          const value = getRowValue(row.key);
          const over = value >= pesos;
          const pct = Math.min(100, (value / pesos) * 100);

          return (
            <Card key={row.key} className={over ? "border-stamp/30 bg-stamp-mist/10" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">{row.label}</p>
                    {row.origin && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest bg-forest-mist border border-forest/30 px-2 py-0.5 rounded-full">
                        <Sparkles className="size-3" />
                        {row.origin}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{row.hint}</p>
                </div>
                <Badge tone={over ? "stamp" : "forest"} className="font-mono text-xs">
                  Tope {formatUvt(row.uvt, 0)} · {formatCOP(pesos)}
                </Badge>
              </div>

              <div className="mt-4 max-w-md">
                <MoneyField
                  label="Su valor"
                  value={value}
                  year={year}
                  onChange={(n) =>
                    patch((x) => {
                      x.topes[row.key] = n;
                      // Si el usuario cambia manualmente el valor en modo autoSync, preservamos su valor
                    })
                  }
                />
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full transition-all duration-300 ${over ? "bg-stamp" : "bg-forest"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between text-[11.5px]">
                <p className={over ? "font-semibold text-stamp" : "text-faint"}>
                  {over
                    ? `Superó el tope por ${formatCOP(value - pesos)} (${formatUvt(uvtFromPesos(value - pesos, year, ov))}). Está obligado por este criterio.`
                    : `Le faltan ${formatCOP(pesos - value)} para el umbral.`}
                </p>
                <span className="font-medium text-muted">{row.source}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardTitle className="text-lg">Asalariados (Art. 593 E.T.)</CardTitle>
        <CardHint>
          Aunque el patrimonio e ingresos estén por debajo, el asalariado debe declarar si no cumple
          todos los requisitos extra: que al menos el 80 % de los ingresos provengan de una relación
          laboral, y que no se superen los topes de consumos, consignaciones y compras. Cedulario
          trata el cruce de cualquiera de los umbrales de 594-3 como obligación, que es la lectura
          más prudente del micrositio DIAN AG {year}.
        </CardHint>
        <p className="mt-3 text-xs text-faint">
          1.400 UVT × {formatCOP(c.uvt)} = {formatCOP(pesosFromUvt(1400, year, ov))} (DIAN publica ${" "}
          {formatCOP(dianRoundThousands(pesosFromUvt(1400, year, ov)))}). 4.500 UVT ={" "}
          {formatCOP(pesosFromUvt(4500, year, ov))} (DIAN publica ${" "}
          {formatCOP(dianRoundThousands(pesosFromUvt(4500, year, ov)))}).
        </p>
      </Card>

      <AlertList alerts={c.alerts.filter((a) => a.section === "identidad" || a.id.startsWith("ba"))} />

      <div className="flex items-center justify-between pt-2">
        <Button asChild variant="outline">
          <Link to="/clientes">← Gestor de Clientes</Link>
        </Button>
        <Button asChild className="gap-2 bg-forest hover:bg-forest-deep text-white">
          <Link to="/documentos">2. Continuar a Soportes y Documentos →</Link>
        </Button>
      </div>
    </div>
  );
}
