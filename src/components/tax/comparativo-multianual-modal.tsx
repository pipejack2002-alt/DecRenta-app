import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  X,
  Calendar,
  Building2,
  Coins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/tax/format";
import { compute } from "@/lib/tax/engine";
import { useAppStore, type ClientProfile } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ComparativoMultianualModal({ isOpen, onClose }: Props) {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const declaration = useAppStore((s) => s.declaration);

  // Perfil activo
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId);
  }, [profiles, activeProfileId]);

  // Filtrar perfiles del mismo cliente (mismo NIT o nombre)
  const clientProfiles = useMemo(() => {
    if (!activeProfile) return [];
    const targetNit = (activeProfile.nit || "").trim();
    const targetName = activeProfile.name.trim().toLowerCase();

    const related = profiles.filter((p) => {
      const pNit = (p.nit || "").trim();
      const pName = p.name.trim().toLowerCase();
      if (targetNit && targetNit !== "Sin NIT" && pNit === targetNit) return true;
      return pName.includes(targetName) || targetName.includes(pName);
    });

    // Ordenar por año ascendente (ej: 2024 -> 2025 -> 2026)
    return related
      .map((p) => {
        const decl = p.id === activeProfileId ? declaration : p.declaration;
        const c = compute(decl);
        return {
          ...p,
          declaration: decl,
          computed: c,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [profiles, activeProfileId, activeProfile, declaration]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest-mist text-forest">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Evolución y Comparativo Multianual del Contribuyente
              </h3>
              <p className="text-xs text-muted">
                Historial comparativo de patrimonio, ingresos e impuesto entre periodos gravables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-ink transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Datos del Cliente */}
        <div className="rounded-xl border border-line bg-bg-raised p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase text-muted block">Contribuyente Analizado:</span>
            <strong className="text-sm font-bold text-ink">{activeProfile?.name || "Cliente"}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted block">NIT / Cédula:</span>
            <strong className="font-mono text-sm text-ink">{activeProfile?.nit || "Sin NIT"}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted block">Años con Expediente:</span>
            <span className="font-semibold text-forest">
              {clientProfiles.map((p) => `AG ${p.year}`).join(" · ") || "Solo año actual"}
            </span>
          </div>
        </div>

        {/* Tabla Comparativa Multianual */}
        {clientProfiles.length <= 1 ? (
          <div className="rounded-xl border-2 border-dashed border-line bg-bg-raised/40 p-8 text-center space-y-3">
            <Calendar className="size-8 text-muted mx-auto" />
            <h4 className="text-xs font-bold text-ink">Solo se encontró 1 año gravable registrado</h4>
            <p className="text-xs text-muted max-w-md mx-auto">
              Para ver la comparativa multianual, duplica esta declaración o crea una nueva para el año gravable anterior/siguiente desde el <strong>Gestor de Clientes</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg-raised text-[11px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-3">Concepto Tributario</th>
                  {clientProfiles.map((p) => (
                    <th key={p.id} className="p-3 text-right">
                      AG {p.year}
                      {p.id === activeProfileId && (
                        <span className="block text-[9px] text-forest font-semibold">(Activo)</span>
                      )}
                    </th>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <th className="p-3 text-right text-forest">Variación ($\Delta$)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {/* Patrimonio Bruto */}
                <tr>
                  <td className="p-3 font-medium">Patrimonio Bruto (Casilla 29)</td>
                  {clientProfiles.map((p) => (
                    <td key={p.id} className="p-3 text-right font-mono">
                      {formatCOP(p.computed.casillas[29] || 0)}
                    </td>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono font-semibold">
                      {(() => {
                        const first = clientProfiles[0].computed.casillas[29] || 0;
                        const last = clientProfiles[clientProfiles.length - 1].computed.casillas[29] || 0;
                        const diff = last - first;
                        return (
                          <span className={diff >= 0 ? "text-emerald-700" : "text-red-700"}>
                            {diff >= 0 ? "+" : ""}{formatCOP(diff)}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                </tr>

                {/* Deudas */}
                <tr>
                  <td className="p-3 font-medium text-muted">Deudas / Pasivos (Casilla 30)</td>
                  {clientProfiles.map((p) => (
                    <td key={p.id} className="p-3 text-right font-mono text-muted">
                      {formatCOP(p.computed.casillas[30] || 0)}
                    </td>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono text-muted">
                      {(() => {
                        const first = clientProfiles[0].computed.casillas[30] || 0;
                        const last = clientProfiles[clientProfiles.length - 1].computed.casillas[30] || 0;
                        const diff = last - first;
                        return `${diff >= 0 ? "+" : ""}${formatCOP(diff)}`;
                      })()}
                    </td>
                  )}
                </tr>

                {/* Patrimonio Líquido */}
                <tr className="bg-forest-mist/20 font-semibold text-forest">
                  <td className="p-3">Patrimonio Líquido (Casilla 31)</td>
                  {clientProfiles.map((p) => (
                    <td key={p.id} className="p-3 text-right font-mono">
                      {formatCOP(p.computed.casillas[31] || 0)}
                    </td>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono">
                      {(() => {
                        const first = clientProfiles[0].computed.casillas[31] || 0;
                        const last = clientProfiles[clientProfiles.length - 1].computed.casillas[31] || 0;
                        const diff = last - first;
                        return `${diff >= 0 ? "+" : ""}${formatCOP(diff)}`;
                      })()}
                    </td>
                  )}
                </tr>

                {/* Renta Líquida Gravable */}
                <tr>
                  <td className="p-3 font-medium">Renta Líquida Gravable (Casilla 97)</td>
                  {clientProfiles.map((p) => (
                    <td key={p.id} className="p-3 text-right font-mono">
                      {formatCOP(p.computed.rentaLiquidaGravable || 0)}
                    </td>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono font-semibold">
                      {(() => {
                        const first = clientProfiles[0].computed.rentaLiquidaGravable || 0;
                        const last = clientProfiles[clientProfiles.length - 1].computed.rentaLiquidaGravable || 0;
                        const diff = last - first;
                        return `${diff >= 0 ? "+" : ""}${formatCOP(diff)}`;
                      })()}
                    </td>
                  )}
                </tr>

                {/* Impuesto Neto */}
                <tr>
                  <td className="p-3 font-medium">Impuesto Neto de Renta (Casilla 126)</td>
                  {clientProfiles.map((p) => (
                    <td key={p.id} className="p-3 text-right font-mono font-bold">
                      {formatCOP(p.computed.impuestoNeto || 0)}
                    </td>
                  ))}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono font-bold">
                      {(() => {
                        const first = clientProfiles[0].computed.impuestoNeto || 0;
                        const last = clientProfiles[clientProfiles.length - 1].computed.impuestoNeto || 0;
                        const diff = last - first;
                        return `${diff >= 0 ? "+" : ""}${formatCOP(diff)}`;
                      })()}
                    </td>
                  )}
                </tr>

                {/* Saldo a Pagar / a Favor */}
                <tr className="bg-bg-raised font-bold">
                  <td className="p-3">Saldo a Pagar (o a Favor)</td>
                  {clientProfiles.map((p) => {
                    const c = p.computed;
                    const val = c.saldoPagar > 0 ? c.saldoPagar : -c.saldoFavor;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 text-right font-mono ${
                          c.saldoPagar > 0 ? "text-red-700" : c.saldoFavor > 0 ? "text-emerald-700" : "text-ink"
                        }`}
                      >
                        {formatCOP(val)}
                      </td>
                    );
                  })}
                  {clientProfiles.length >= 2 && (
                    <td className="p-3 text-right font-mono text-muted">—</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Pie */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar Comparativo
          </Button>
        </div>
      </div>
    </div>
  );
}
