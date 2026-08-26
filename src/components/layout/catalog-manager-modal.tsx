import { useState } from "react";
import {
  Building2,
  Briefcase,
  Check,
  Edit2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CatalogItem } from "@/lib/catalogs";
import { useAppStore } from "@/lib/store";

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "seccionales" | "ciiu";
  onSelectSeccional?: (code: string) => void;
  onSelectCiiu?: (code: string) => void;
}

export function CatalogManagerModal({
  isOpen,
  onClose,
  defaultTab = "seccionales",
  onSelectSeccional,
  onSelectCiiu,
}: CatalogManagerModalProps) {
  const [tab, setTab] = useState<"seccionales" | "ciiu">(defaultTab);
  const [search, setSearch] = useState("");

  const seccionales = useAppStore((s) => s.customSeccionales);
  const addOrUpdateSeccional = useAppStore((s) => s.addOrUpdateSeccional);
  const deleteSeccional = useAppStore((s) => s.deleteSeccional);
  const resetSeccionales = useAppStore((s) => s.resetSeccionales);

  const ciiuList = useAppStore((s) => s.customCiiu);
  const addOrUpdateCiiu = useAppStore((s) => s.addOrUpdateCiiu);
  const deleteCiiu = useAppStore((s) => s.deleteCiiu);
  const resetCiiu = useAppStore((s) => s.resetCiiu);

  // Formulario de agregar / editar
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const currentList = tab === "seccionales" ? seccionales : ciiuList;
  const filteredList = currentList.filter(
    (item) =>
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleStartEdit(item: CatalogItem) {
    setEditingCode(item.code);
    setFormCode(item.code);
    setFormName(item.name);
    setFormError("");
  }

  function handleCancelEdit() {
    setEditingCode(null);
    setFormCode("");
    setFormName("");
    setFormError("");
  }

  function handleSubmit() {
    const code = formCode.trim().padStart(tab === "seccionales" ? 2 : 4, "0");
    const name = formName.trim();

    if (!code) {
      setFormError("El código es obligatorio.");
      return;
    }
    if (!name) {
      setFormError("El nombre o descripción es obligatorio.");
      return;
    }

    if (tab === "seccionales") {
      addOrUpdateSeccional(code, name);
    } else {
      addOrUpdateCiiu(code, name);
    }

    handleCancelEdit();
  }

  function handleReset() {
    if (
      confirm(
        `¿Desea restaurar el catálogo oficial completo de la DIAN para ${
          tab === "seccionales" ? "Direcciones Seccionales" : "Actividades CIIU"
        }? Se conservarán los valores estándar.`,
      )
    ) {
      if (tab === "seccionales") {
        resetSeccionales();
      } else {
        resetCiiu();
      }
      handleCancelEdit();
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-forest-mist/30">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-forest/15 text-forest flex items-center justify-center font-bold">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h3 className="font-bold text-ink text-base">Gestor de Catálogos DIAN Personalizables</h3>
              <p className="text-xs text-muted">Añade, edita y ajusta Direcciones Seccionales y Actividades CIIU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-muted hover:text-ink hover:bg-muted-mist flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line bg-bg/50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("seccionales");
              handleCancelEdit();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              tab === "seccionales"
                ? "border-forest text-forest bg-surface rounded-t-lg"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Building2 className="size-3.5" />
            12. Direcciones Seccionales ({seccionales.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("ciiu");
              handleCancelEdit();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              tab === "ciiu"
                ? "border-forest text-forest bg-surface rounded-t-lg"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Briefcase className="size-3.5" />
            24. Actividades CIIU ({ciiuList.length})
          </button>
        </div>

        {/* Formulario para Crear / Editar */}
        <div className="p-4 bg-forest-mist/20 border-b border-line">
          <h4 className="text-xs font-bold uppercase tracking-wider text-forest mb-2 flex items-center gap-1.5">
            {editingCode ? <Edit2 className="size-3.5" /> : <Plus className="size-3.5" />}
            {editingCode ? `Editar ${tab === "seccionales" ? "Seccional" : "CIIU"} (${editingCode})` : `Añadir Nueva ${tab === "seccionales" ? "Seccional" : "Actividad CIIU"}`}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-ink">
                {tab === "seccionales" ? "Código (ej: 02, 05, 99)" : "Código (ej: 3312)"}
              </Label>
              <Input
                placeholder={tab === "seccionales" ? "02" : "3312"}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.replace(/\D/g, "").slice(0, tab === "seccionales" ? 3 : 5))}
                className="h-8 font-mono text-xs font-bold"
              />
            </div>
            <div className="sm:col-span-6 space-y-1">
              <Label className="text-[11px] font-semibold text-ink">
                {tab === "seccionales" ? "Nombre de la Ciudad / Seccional" : "Descripción de la Actividad Económica"}
              </Label>
              <Input
                placeholder={tab === "seccionales" ? "Ej: Barranquilla" : "Ej: Mantenimiento de maquinaria y equipo"}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <Button size="sm" onClick={handleSubmit} className="h-8 px-3 text-xs bg-forest text-white flex-1 font-semibold">
                <Check className="mr-1 size-3.5" /> Guardar
              </Button>
              {editingCode && (
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8 px-2 text-xs">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
          {formError && <p className="text-[11px] text-red-600 font-medium mt-1">{formError}</p>}
        </div>

        {/* Buscador y Lista de Elementos */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs text-muted hover:text-ink"
              title="Restaurar la lista oficial completa de la DIAN"
            >
              <RotateCcw className="mr-1 size-3" /> Restaurar Oficiales DIAN
            </Button>
          </div>

          <div className="grid gap-1.5 max-h-[320px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-bg/50 rounded-xl border border-line">
                No se encontraron resultados para "{search}".
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelectedForEdit = editingCode === item.code;
                return (
                  <div
                    key={item.code}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                      isSelectedForEdit
                        ? "border-forest bg-forest-mist/50 ring-1 ring-forest"
                        : "border-line bg-surface hover:bg-bg/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono font-bold bg-muted-mist px-2 py-0.5 rounded text-forest-deep shrink-0">
                        {item.code}
                      </span>
                      <span className="font-medium text-ink truncate" title={item.name}>
                        {item.name}
                      </span>
                      {item.isCustom && (
                        <Badge tone="warn" className="text-[9px] py-0 px-1 shrink-0">
                          Personalizado
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Botón Seleccionar si se pasó callback */}
                      {((tab === "seccionales" && onSelectSeccional) ||
                        (tab === "ciiu" && onSelectCiiu)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            if (tab === "seccionales" && onSelectSeccional) {
                              onSelectSeccional(item.code);
                            } else if (tab === "ciiu" && onSelectCiiu) {
                              onSelectCiiu(item.code);
                            }
                            onClose();
                          }}
                        >
                          Usar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted hover:text-ink"
                        onClick={() => handleStartEdit(item)}
                        title="Editar código o nombre"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`¿Eliminar "${item.code} - ${item.name}" del catálogo?`)) {
                            if (tab === "seccionales") {
                              deleteSeccional(item.code);
                            } else {
                              deleteCiiu(item.code);
                            }
                          }
                        }}
                        title="Eliminar del catálogo"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="p-3 bg-bg/40 border-t border-line flex items-center justify-between text-[11px] text-muted">
          <span>Los cambios se guardan localmente y aplican a toda la aplicación.</span>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs h-8">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
