import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertList } from "@/components/layout/alert-list";
import { MoneyField, ToggleField } from "@/components/layout/money-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP, formatUvt } from "@/lib/tax/format";
import { dianRoundThousands, pesosFromUvt, uvtFromPesos } from "@/lib/tax/uvt";

export const Route = createFileRoute("/topes")({ component: TopesPage });

const ROWS: { key: "ingresosBrutos" | "patrimonioBruto" | "consumosTarjeta" | "compras" | "consignaciones"; label: string; hint: string; uvt: number; source: string }[] = [
  {
    key: "patrimonioBruto",
    label: "Patrimonio bruto al 31 de diciembre",
    hint: "Bienes y derechos apreciables en dinero, en el país o en el exterior.",
    uvt: 4500,
    source: "Art. 592 E.T.",
  },
  {
    key: "ingresosBrutos",
    label: "Ingresos brutos del año",
    hint: "Todos los ingresos, gravados o no, de cualquier cédula.",
    uvt: 1400,
    source: "Art. 592 E.T.",
  },
  {
    key: "consumosTarjeta",
    label: "Consumos con tarjeta de crédito",
    hint: "Incluye tarjetas propias y de terceros que usted use.",
    uvt: 1400,
    source: "Art. 594-3 E.T.",
  },
  {
    key: "compras",
    label: "Compras y consumos",
    hint: "Adquisiciones del año, con o sin factura.",
    uvt: 1400,
    source: "Art. 594-3 E.T.",
  },
  {
    key: "consignaciones",
    label: "Consignaciones, depósitos e inversiones",
    hint: "Valor acumulado en bancos, fiduciarias y similares.",
    uvt: 1400,
    source: "Art. 594-3 E.T.",
  },
];

function TopesPage() {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();
  const year = d.year;
  const ov = d.uvtOverrides;

  const ingBrutosDeclarados =
    (c.casillas[32] || 0) +
    (c.casillas[43] || 0) +
    (c.casillas[58] || 0) +
    (c.casillas[74] || 0) +
    (c.casillas[99] || 0) +
    (c.casillas[104] || 0) +
    (c.casillas[107] || 0) +
    (c.casillas[108] || 0) +
    (c.casillas[109] || 0) +
    (c.casillas[112] || 0);

  const patrimonioDeclarado = c.casillas[29] || 0;
  const hasDeclarationData = patrimonioDeclarado > 0 || ingBrutosDeclarados > 0;

  function handleSyncFromDeclaration() {
    patch((x) => {
      if (patrimonioDeclarado > 0) x.topes.patrimonioBruto = patrimonioDeclarado;
      if (ingBrutosDeclarados > 0) x.topes.ingresosBrutos = ingBrutosDeclarados;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Criterios de Obligación · Arts. 592, 593 y 594-3 E.T.</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Obligación de Declarar Renta</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Evaluación técnica de topes al 31 de diciembre de {year} con la UVT oficial de {formatCOP(c.uvt)}. Basta con superar <em>uno</em> de los umbrales legales para estar obligado a presentar el Formulario 210 en el calendario oficial de la DIAN.
          </p>
        </div>

        {hasDeclarationData && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncFromDeclaration}
            className="gap-2 text-xs border-forest/30 text-forest hover:bg-forest-mist"
          >
            Sincronizar Cifras de la Declaración / Exógena
          </Button>
        )}
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Resultado del Diagnóstico</CardTitle>
          <CardHint>
            {c.obligado
              ? "Con los datos actuales SÍ está obligado a presentar el Formulario 210 ante la DIAN."
              : "Ningún tope legal se ha cruzado todavía. Puede presentar la declaración de forma voluntaria para solicitar devolución de retenciones."}
          </CardHint>
        </div>
        <Badge tone={c.obligado ? "stamp" : "ok"} className="text-sm px-3 py-1">
          {c.obligado ? "🚨 OBLIGADO A DECLARAR" : "✅ NO OBLIGADO (POR AHORA)"}
        </Badge>
      </Card>

      <ToggleField
        label="Fue responsable de IVA al 31 de diciembre de 2025"
        hint="Si estaba en el régimen de IVA, debe declarar renta aunque no cruce los demás topes (art. 592 E.T.)."
        checked={d.identity.responsableIva}
        onChange={(v) =>
          patch((x) => {
            x.identity.responsableIva = v;
          })
        }
      />

      <div className="grid gap-4">
        {ROWS.map((row) => {
          const pesos = dianRoundThousands(pesosFromUvt(row.uvt, year, ov));
          const value = d.topes[row.key];
          const over = value >= pesos;
          const pct = Math.min(100, (value / pesos) * 100);
          return (
            <Card key={row.key}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.label}</p>
                  <p className="text-xs text-muted">{row.hint}</p>
                </div>
                <Badge tone={over ? "stamp" : "forest"}>
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
                    })
                  }
                />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full ${over ? "bg-stamp" : "bg-forest"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-faint">
                {over
                  ? `Superó el tope por ${formatCOP(value - pesos)} (${formatUvt(uvtFromPesos(value - pesos, year, ov))}).`
                  : `Le faltan ${formatCOP(pesos - value)} para el umbral.`}{" "}
                {row.source}
              </p>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardTitle className="text-lg">Asalariados (art. 593)</CardTitle>
        <CardHint>
          Aunque el patrimonio e ingresos estén por debajo, el asalariado debe declarar si no cumple todos los requisitos extra: que al menos el 80 % de los ingresos provengan de una relación laboral, y que no se superen los topes de consumos, consignaciones y compras. Cedulario trata el cruce de cualquiera de los umbrales de 594-3 como obligación, que es la lectura más prudente del micrositio DIAN AG 2025.
        </CardHint>
        <p className="mt-3 text-xs text-faint">
          1.400 UVT × {formatCOP(c.uvt)} = {formatCOP(pesosFromUvt(1400, year, ov))} (DIAN publica $ 69.719.000). 4.500 UVT = {formatCOP(pesosFromUvt(4500, year, ov))} (DIAN publica $ 224.096.000).
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
