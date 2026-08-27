import {
  Baby,
  GraduationCap,
  HeartHandshake,
  Info,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCOP, formatNumber } from "@/lib/tax/format";
import type {
  DependienteItem,
  ParentescoDependiente,
  TipoDocumentoDependiente,
} from "@/lib/tax/types";

interface DependientesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dependientes: number;
  dependientesDetalle?: DependienteItem[];
  uvt: number;
  salarioBase: number;
  onSave: (count: number, detalle: DependienteItem[]) => void;
}

const PARENTESCO_OPTIONS: { id: ParentescoDependiente; label: string; hint: string }[] = [
  {
    id: "hijo_menor_18",
    label: "Hijo(a) menor de 18 años",
    hint: "Acreditado con Registro Civil de Nacimiento.",
  },
  {
    id: "hijo_estudiante_18_23",
    label: "Hijo(a) entre 18 y 23 años (Estudiante)",
    hint: "Que curse programas de educación superior o técnica acreditados por MinEducación.",
  },
  {
    id: "hijo_discapacidad",
    label: "Hijo(a) en situación de dependencia por discapacidad",
    hint: "Certificado de medicina legal o entidad de salud competente.",
  },
  {
    id: "conyuge_dependiente",
    label: "Cónyuge o compañero permanente dependiente",
    hint: "Que no tenga ingresos propios o sus ingresos sean inferiores a 260 UVT en el año.",
  },
  {
    id: "padres_dependientes",
    label: "Padres del contribuyente en dependencia económica",
    hint: "Sin ingresos propios o con ingresos inferiores a 260 UVT anuales.",
  },
  {
    id: "hermano_dependiente",
    label: "Hermano(a) menor de edad o con discapacidad",
    hint: "En situación de orfandad o dependencia justificada.",
  },
];

const TIPO_DOC_OPTIONS: { id: TipoDocumentoDependiente; label: string }[] = [
  { id: "RC", label: "Registro Civil (RC)" },
  { id: "TI", label: "Tarjeta de Identidad (TI)" },
  { id: "CC", label: "Cédula de Ciudadanía (CC)" },
  { id: "CE", label: "Cédula de Extranjería (CE)" },
  { id: "PPT", label: "Permiso por Protección Temporal (PPT)" },
  { id: "PAS", label: "Pasaporte (PAS)" },
];

export function DependientesManagerModal({
  isOpen,
  onClose,
  dependientes,
  dependientesDetalle,
  uvt,
  salarioBase,
  onSave,
}: DependientesManagerModalProps) {
  const [list, setList] = useState<DependienteItem[]>(() => {
    if (dependientesDetalle && dependientesDetalle.length > 0) {
      return [...dependientesDetalle];
    }
    // Si no hay lista pero sí conteo, inicializar con placeholders
    if (dependientes > 0) {
      return Array.from({ length: dependientes }, (_, i) => ({
        id: `dep-${Date.now()}-${i}`,
        tipoDocumento: i === 0 ? "TI" : "RC",
        numeroDocumento: "",
        nombresApellidos: `Dependiente ${i + 1}`,
        parentesco: "hijo_menor_18",
      }));
    }
    return [];
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (list.length >= 4) return;
    const newItem: DependienteItem = {
      id: `dep-${Date.now()}`,
      tipoDocumento: "TI",
      numeroDocumento: "",
      nombresApellidos: "",
      parentesco: "hijo_menor_18",
    };
    setList([...list, newItem]);
  };

  const handleRemove = (id: string) => {
    setList(list.filter((x) => x.id !== id));
  };

  const handleUpdate = (id: string, patch: Partial<DependienteItem>) => {
    setList(list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const handleSaveAndClose = () => {
    onSave(list.length, list);
    onClose();
  };

  // Cálculos de beneficios
  const deduc10Pct = list.length > 0 ? Math.min(salarioBase * 0.1, uvt * 384) : 0;
  const deduc72Uvt = list.length * uvt * 72;
  const beneficioTotal = deduc10Pct + deduc72Uvt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-forest-mist/30">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-forest/15 text-forest flex items-center justify-center font-bold">
              <Users className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base">
                  Perfil de Dependientes Económicos
                </h3>
                <span className="text-[10px] font-semibold text-forest-deep bg-forest/15 px-2 py-0.5 rounded-full font-mono">
                  {list.length} de 4 registrados
                </span>
              </div>
              <p className="text-xs text-muted">
                Arts. 387 y 336 Num. 2 del Estatuto Tributario (Ley 2277 de 2022)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-muted hover:text-ink hover:bg-muted-mist flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Explicación del Doble Beneficio Legal */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="size-4 text-emerald-700" />
              <span>Doble Beneficio Tributario Concurrente</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Por cada dependiente registrado tienes derecho a <strong>dos beneficios independientes y acumulables</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-bold text-emerald-950 text-xs">1. Deducción del 10% (Art. 387 E.T.)</span>
                <p className="text-[11px] text-gray-600">
                  Deduce hasta el 10% de tu ingreso laboral (máx. 384 UVT = {formatCOP(uvt * 384)}). Aplica en la <strong>Casilla 39 / 40</strong> dentro del 40%.
                </p>
                <p className="font-mono font-bold text-emerald-900 text-xs pt-0.5">
                  Monto estimado: {formatCOP(deduc10Pct)}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-bold text-emerald-950 text-xs">2. 72 UVT Adicionales (Art. 336 E.T.)</span>
                <p className="text-[11px] text-gray-600">
                  Deducción de 72 UVT ({formatCOP(uvt * 72)}) por cada uno (hasta 4). Aplica en la <strong>Casilla 139 / 92</strong> <u>fuera del límite del 40%</u>.
                </p>
                <p className="font-mono font-bold text-emerald-900 text-xs pt-0.5">
                  Monto ({list.length} dep.): {formatCOP(deduc72Uvt)}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Dependientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-ink text-xs uppercase tracking-wide">
                Información de los Dependientes a Cargo
              </h4>
              {list.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAdd}
                  className="text-xs h-8 border-forest/30 text-forest hover:bg-forest-mist"
                >
                  <Plus className="size-3.5 mr-1" />
                  Agregar Dependiente ({list.length}/4)
                </Button>
              )}
            </div>

            {list.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-line text-center space-y-2 bg-surface">
                <Users className="size-8 text-muted mx-auto opacity-50" />
                <p className="font-semibold text-ink text-sm">No tienes dependientes económicos registrados</p>
                <p className="text-xs text-muted max-w-md mx-auto">
                  Si tienes hijos menores, hijos estudiantes hasta 23 años, cónyuge o padres que dependan de ti, agrégalos para aprovechar la deducción tributaria.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAdd}
                  className="bg-forest text-white hover:bg-forest-deep mt-2"
                >
                  <Plus className="size-3.5 mr-1" />
                  Agregar Primer Dependiente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((dep, idx) => (
                  <div
                    key={dep.id}
                    className="p-4 rounded-xl border border-line bg-surface shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-md bg-forest/15 text-forest font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-ink text-xs">
                          {dep.nombresApellidos.trim() || `Dependiente #${idx + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(dep.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Eliminar dependiente"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Nombres */}
                      <div>
                        <label className="text-[11px] font-semibold text-ink block mb-1">
                          Nombres y Apellidos Completos *
                        </label>
                        <input
                          type="text"
                          value={dep.nombresApellidos}
                          onChange={(e) => handleUpdate(dep.id, { nombresApellidos: e.target.value })}
                          placeholder="Ej. Sofía Bernal Gómez"
                          className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-surface text-ink focus:border-forest focus:ring-1 focus:ring-forest outline-hidden"
                        />
                      </div>

                      {/* Parentesco */}
                      <div>
                        <label className="text-[11px] font-semibold text-ink block mb-1">
                          Parentesco o Condición Legal *
                        </label>
                        <select
                          value={dep.parentesco}
                          onChange={(e) =>
                            handleUpdate(dep.id, {
                              parentesco: e.target.value as ParentescoDependiente,
                            })
                          }
                          className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-surface text-ink focus:border-forest outline-hidden font-medium"
                        >
                          {PARENTESCO_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tipo Doc */}
                      <div>
                        <label className="text-[11px] font-semibold text-ink block mb-1">
                          Tipo de Documento *
                        </label>
                        <select
                          value={dep.tipoDocumento}
                          onChange={(e) =>
                            handleUpdate(dep.id, {
                              tipoDocumento: e.target.value as TipoDocumentoDependiente,
                            })
                          }
                          className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-surface text-ink focus:border-forest outline-hidden font-medium"
                        >
                          {TIPO_DOC_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Número Doc */}
                      <div>
                        <label className="text-[11px] font-semibold text-ink block mb-1">
                          Número de Identificación / NUIP *
                        </label>
                        <input
                          type="text"
                          value={dep.numeroDocumento}
                          onChange={(e) => handleUpdate(dep.id, { numeroDocumento: e.target.value })}
                          placeholder="Ej. 1024567890"
                          className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-surface text-ink font-mono focus:border-forest outline-hidden"
                        />
                      </div>

                      {/* Institución educativa si es estudiante */}
                      {dep.parentesco === "hijo_estudiante_18_23" && (
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-ink block mb-1 flex items-center gap-1">
                            <GraduationCap className="size-3 text-forest" />
                            Institución Educativa Superior / Técnica
                          </label>
                          <input
                            type="text"
                            value={dep.institucionEducativa || ""}
                            onChange={(e) =>
                              handleUpdate(dep.id, { institucionEducativa: e.target.value })
                            }
                            placeholder="Ej. Universidad Nacional de Colombia"
                            className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-surface text-ink focus:border-forest outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen Total */}
          {list.length > 0 && (
            <div className="p-4 rounded-xl border border-line bg-muted-mist/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase">Beneficio Total en Depuración</span>
                <p className="text-xl font-bold font-mono text-forest-deep mt-0.5">
                  {formatCOP(beneficioTotal)}
                </p>
                <p className="text-[10px] text-muted">
                  ({formatCOP(deduc10Pct)} dentro del 40% + {formatCOP(deduc72Uvt)} fuera del 40%)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-ink uppercase">Casillas Afectadas:</span>
                <p className="font-mono text-xs font-bold text-ink-soft mt-0.5">
                  Casilla 39, 40, 92, 138, 139
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAndClose}
            className="bg-forest hover:bg-forest-deep text-white font-semibold"
          >
            <UserCheck className="size-3.5 mr-1.5" />
            Guardar {list.length} Dependiente(s)
          </Button>
        </div>
      </div>
    </div>
  );
}
