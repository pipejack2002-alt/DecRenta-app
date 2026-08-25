import { AlertTriangle, Check, Clock, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import type { RegistroPerdidaCompensable, TipoCompensacion } from "@/lib/tax/types";

const TIPOS: { id: TipoCompensacion; label: string; casilla: number; limiteAnios: number; desc: string }[] = [
  {
    id: "capital",
    label: "Rentas de Capital",
    casilla: 72,
    limiteAnios: 12,
    desc: "Art. 147 E.T. Se compensa contra la renta líquida de capital (máx. Casilla 70).",
  },
  {
    id: "noLaborales",
    label: "Rentas No Laborales",
    casilla: 89,
    limiteAnios: 12,
    desc: "Art. 147 E.T. Se compensa contra la renta líquida no laboral (máx. Casilla 87).",
  },
  {
    id: "honorarios",
    label: "Honorarios con Costos",
    casilla: 56,
    limiteAnios: 12,
    desc: "Art. 147 E.T. Para independientes que declaran honorarios con costos (máx. Casilla 54).",
  },
  {
    id: "general2018",
    label: "Pérdidas 2018 y anteriores (Cédula General)",
    casilla: 94,
    limiteAnios: 99,
    desc: "Art. 330 E.T. Saldo de pérdidas acumuladas generadas hasta el año 2018.",
  },
  {
    id: "presuntiva",
    label: "Exceso de Renta Presuntiva",
    casilla: 95,
    limiteAnios: 5,
    desc: "Parágrafo Art. 189 E.T. Compensable dentro de los 5 periodos gravables siguientes.",
  },
];

export function CompensacionesDialog({
  open,
  onClose,
  initialTipo,
}: {
  open: boolean;
  onClose: () => void;
  initialTipo?: TipoCompensacion;
}) {
  const d = useAppStore((s) => s.declaration);
  const patch = useAppStore((s) => s.patch);
  const c = useComputed();
  const year = d.year;

  const list = d.historialPerdidas ?? [];

  const [tipo, setTipo] = useState<TipoCompensacion>(initialTipo ?? "capital");
  const [anioOrigen, setAnioOrigen] = useState<number>(year - 1);
  const [perdidaOriginal, setPerdidaOriginal] = useState<string>("");
  const [compensadoPrevio, setCompensadoPrevio] = useState<string>("0");
  const [valorACompensar, setValorACompensar] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(list.length === 0);

  if (!open) return null;

  function handleAdd() {
    const orig = Number(perdidaOriginal) || 0;
    const prev = Number(compensadoPrevio) || 0;
    const aComp = Number(valorACompensar) || Math.max(0, orig - prev);
    if (orig <= 0) return;

    const nuevo: RegistroPerdidaCompensable = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      anioOrigen,
      tipo,
      perdidaOriginal: orig,
      compensadoPrevio: prev,
      valorACompensar: aComp,
      notas: notas.trim() || undefined,
    };

    const nextList = [...list, nuevo];
    syncToDeclaration(nextList);
    setPerdidaOriginal("");
    setCompensadoPrevio("0");
    setValorACompensar("");
    setNotas("");
    setShowAddForm(false);
  }

  function handleRemove(id: string) {
    const nextList = list.filter((x) => x.id !== id);
    syncToDeclaration(nextList);
  }

  function handleUpdateCompensar(id: string, nuevoValor: number) {
    const nextList = list.map((item) => (item.id === id ? { ...item, valorACompensar: Math.max(0, nuevoValor) } : item));
    syncToDeclaration(nextList);
  }

  function syncToDeclaration(items: RegistroPerdidaCompensable[]) {
    patch((x) => {
      x.historialPerdidas = items;

      // Calcular totales por cada concepto para sincronizar las casillas
      let sumCap = 0;
      let sumNL = 0;
      let sumHon = 0;
      let sum2018 = 0;
      let sumPres = 0;

      for (const item of items) {
        if (item.tipo === "capital") sumCap += item.valorACompensar;
        else if (item.tipo === "noLaborales") sumNL += item.valorACompensar;
        else if (item.tipo === "honorarios") sumHon += item.valorACompensar;
        else if (item.tipo === "general2018") sum2018 += item.valorACompensar;
        else if (item.tipo === "presuntiva") sumPres += item.valorACompensar;
      }

      x.capital.compensacionPerdidas = sumCap;
      x.noLaborales.compensacionPerdidas = sumNL;
      x.honorarios.compensacionPerdidas = sumHon;
      x.extra.compensacionPerdidas2018 = sum2018;
      x.extra.compensacionExcesoPresuntiva = sumPres;
    });
  }

  function getStatus(item: RegistroPerdidaCompensable) {
    const config = TIPOS.find((t) => t.id === item.tipo);
    const limite = config?.limiteAnios ?? 12;
    const diff = year - item.anioOrigen;

    if (item.tipo === "general2018" || item.anioOrigen <= 2016) {
      return { tone: "ok" as const, text: "Vigente (sin límite temporal)" };
    }
    if (diff > limite) {
      return { tone: "stamp" as const, text: `Vencida (${diff} años transcurridos, máx. ${limite})` };
    }
    const left = limite - diff;
    return {
      tone: "forest" as const,
      text: `Vigente (${diff} de ${limite} años, restan ${left})`,
    };
  }

  const totalCompensadoActual = list.reduce((acc, it) => acc + (it.valorACompensar || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1 text-muted hover:bg-bg-raised"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>

        <header className="pr-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Estatuto Tributario · Arts. 147 y 189</p>
          <h2 className="font-display text-2xl">Historial de Pérdidas Fiscales y Renta Presuntiva</h2>
          <p className="mt-1 text-sm text-muted">
            Lleve la cuenta de las pérdidas de años anteriores por cédula, controle los años de firmeza y sincronice los valores con las casillas del Formulario 210 para el AG {year}.
          </p>
        </header>

        {/* Resumen de totales */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-bg-raised p-3">
            <p className="text-[11px] uppercase text-muted">Pérdidas registradas</p>
            <p className="mt-1 font-display text-xl">{list.length}</p>
          </div>
          <div className="rounded-xl border border-line bg-bg-raised p-3">
            <p className="text-[11px] uppercase text-muted">Compensando en {year}</p>
            <p className="mt-1 font-display text-lg tabular-nums text-forest">{formatCOP(totalCompensadoActual)}</p>
          </div>
          <div className="rounded-xl border border-line bg-bg-raised p-3">
            <p className="text-[11px] uppercase text-muted">Renta Capital Disp.</p>
            <p className="mt-1 font-display text-lg tabular-nums">{formatCOP(c.casillas[70] ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-line bg-bg-raised p-3">
            <p className="text-[11px] uppercase text-muted">Renta No Laboral Disp.</p>
            <p className="mt-1 font-display text-lg tabular-nums">{formatCOP(c.casillas[87] ?? 0)}</p>
          </div>
        </div>

        {/* Lista de pérdidas registradas */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-soft">Pérdidas y excesos registrados</h3>
            {!showAddForm && (
              <Button size="sm" variant="secondary" onClick={() => setShowAddForm(true)}>
                <Plus className="size-4" />
                Agregar pérdida anterior
              </Button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
              No hay pérdidas fiscales registradas. Si declaró pérdidas en años anteriores (2017–{year - 1}) o tiene excesos de renta presuntiva, agréguelas aquí para compensarlas legalmente.
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((item) => {
                const status = getStatus(item);
                const saldoDisp = Math.max(0, item.perdidaOriginal - item.compensadoPrevio);
                const tipoMeta = TIPOS.find((t) => t.id === item.tipo);

                return (
                  <Card key={item.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-semibold">
                            AG {item.anioOrigen} · {tipoMeta?.label}
                          </span>
                          <Badge tone={status.tone}>{status.text}</Badge>
                        </div>
                        <p className="text-xs text-muted">Casilla {tipoMeta?.casilla} · {tipoMeta?.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-faint hover:text-stamp"
                        title="Eliminar pérdida"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-faint">Pérdida original:</span>
                        <p className="font-mono font-medium">{formatCOP(item.perdidaOriginal)}</p>
                      </div>
                      <div>
                        <span className="text-faint">Compensado antes:</span>
                        <p className="font-mono font-medium">{formatCOP(item.compensadoPrevio)}</p>
                      </div>
                      <div>
                        <span className="text-faint">Saldo disponible:</span>
                        <p className="font-mono font-medium text-forest">{formatCOP(saldoDisp)}</p>
                      </div>
                      <div>
                        <label className="text-faint font-medium">A compensar en {year}:</label>
                        <input
                          type="number"
                          value={item.valorACompensar}
                          onChange={(e) => handleUpdateCompensar(item.id, Number(e.target.value))}
                          className="mt-0.5 w-full rounded-md border border-line bg-surface px-2 py-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    {item.notas && <p className="text-xs italic text-ink-soft">Nota: {item.notas}</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulario para agregar una nueva pérdida */}
        {showAddForm && (
          <Card className="mt-6 space-y-4 border-forest/30 bg-forest-mist/30 p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Registrar pérdida o exceso de presuntiva</CardTitle>
              {list.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Tipo de concepto</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoCompensacion)}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                >
                  {TIPOS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} (Casilla {t.casilla})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Año gravable de origen</label>
                <input
                  type="number"
                  min="2000"
                  max={year - 1}
                  value={anioOrigen}
                  onChange={(e) => setAnioOrigen(Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Pérdida generada en ese año ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 15000000"
                  value={perdidaOriginal}
                  onChange={(e) => setPerdidaOriginal(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Valor ya compensado previamente ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={compensadoPrevio}
                  onChange={(e) => setCompensadoPrevio(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Valor a compensar en {year} ($)</label>
                <input
                  type="number"
                  placeholder="Dejar vacío para compensar el saldo disponible"
                  value={valorACompensar}
                  onChange={(e) => setValorACompensar(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Notas / Referencia (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Formulario 210 AG 2021"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                />
              </div>
            </div>

            <Button onClick={handleAdd} className="w-full">
              <Plus className="size-4" />
              Guardar y sincronizar casilla
            </Button>
          </Card>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={onClose}>Listo</Button>
        </div>
      </div>
    </div>
  );
}
