import { useState } from "react";
import {
  Users,
  UserPlus,
  Copy,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Plus,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
} from "lucide-react";
import { useAppStore, type ProfileStatus, type ClientProfile } from "@/lib/store";
import type { TaxYear } from "@/lib/tax/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadFile } from "@/lib/tax/export-dian";

export function ClientSwitcher() {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const declaration = useAppStore((s) => s.declaration);
  const reset = useAppStore((s) => s.reset);
  const switchProfile = useAppStore((s) => s.switchProfile);
  const createProfile = useAppStore((s) => s.createProfile);
  const duplicateProfile = useAppStore((s) => s.duplicateProfile);
  const deleteProfile = useAppStore((s) => s.deleteProfile);
  const updateProfileStatus = useAppStore((s) => s.updateProfileStatus);
  const updateProfileInfo = useAppStore((s) => s.updateProfileInfo);
  const exportAllProfilesJson = useAppStore((s) => s.exportAllProfilesJson);
  const importProfilesJson = useAppStore((s) => s.importProfilesJson);

  const [modalOpen, setModalOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);

  // Formulario Crear
  const [newClientName, setNewClientName] = useState("");
  const [newClientNit, setNewClientNit] = useState("");
  const [newClientYear, setNewClientYear] = useState<TaxYear>(2025);

  // Formulario Editar
  const [editName, setEditName] = useState("");
  const [editNit, setEditNit] = useState("");
  const [editYear, setEditYear] = useState<TaxYear>(2025);

  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Nombre y NIT del perfil activo
  const currentName =
    [declaration.identity.primerNombre, declaration.identity.primerApellido].filter(Boolean).join(" ") ||
    "Cliente Principal";
  const currentNit = declaration.identity.nit || "Sin NIT";

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || {
    id: activeProfileId || "default",
    name: currentName,
    nit: currentNit,
    year: declaration.year,
    status: "borrador" as ProfileStatus,
  };

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || p.nit.toLowerCase().includes(term);
  });

  function handleCreate() {
    if (!newClientName.trim()) return;
    const id = createProfile(newClientName.trim(), newClientNit.trim(), newClientYear);
    setNewClientName("");
    setNewClientNit("");
    setShowCreateForm(false);
    switchProfile(id);
  }

  function handleStartEdit(p: ClientProfile) {
    setEditingProfile(p);
    setEditName(p.name);
    setEditNit(p.nit === "Sin NIT" ? "" : p.nit);
    setEditYear(p.year || 2025);
  }

  function handleSaveEdit() {
    if (!editingProfile || !editName.trim()) return;
    updateProfileInfo(editingProfile.id, editName.trim(), editNit.trim(), editYear);
    setEditingProfile(null);
  }

  function handleDelete(p: ClientProfile) {
    if (profiles.length > 1) {
      if (confirm(`¿Está seguro de eliminar definitivamente la declaración de "${p.name}"?`)) {
        deleteProfile(p.id);
      }
    } else {
      if (confirm(`Solo tiene un cliente registrado. ¿Desea reiniciar y limpiar todos los datos de "${p.name}" a ceros para empezar de nuevo?`)) {
        reset();
      }
    }
  }

  function handleExportAll() {
    const json = exportAllProfilesJson();
    downloadFile(`tributoapp-clientes-respaldo-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importProfilesJson(content);
      if (!res.ok) {
        setImportError(res.error);
      } else {
        alert(`¡Se importaron con éxito ${res.count} cliente(s) a su gestor!`);
        setModalOpen(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      {/* Botón en el Navbar */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-line bg-surface/90 px-3 py-1.5 text-left text-xs transition-all hover:border-forest hover:bg-surface hover:shadow-sm focus:outline-none"
        title="Cambiar, editar o crear clientes y declaraciones (Gestor Multi-Cliente)"
      >
        <Users className="size-4 text-forest shrink-0" />
        <div className="max-w-[130px] sm:max-w-[170px] truncate">
          <span className="block font-semibold leading-tight text-ink truncate">{activeProfile.name || currentName}</span>
          <span className="block text-[10px] text-muted truncate">NIT: {activeProfile.nit || currentNit}</span>
        </div>
        <StatusPill status={activeProfile.status} />
        <ChevronDown className="size-3 text-muted shrink-0 ml-0.5" />
      </button>

      {/* Modal Principal de Gestión de Clientes */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Gestor de Clientes y Declaraciones
                  </h3>
                  <p className="text-xs text-muted">
                    Cree, edite, duplique o elimine declaraciones de renta independientes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowCreateForm((v) => !v)}
                  className="gap-1.5 bg-forest text-primary-fg hover:bg-forest-deep text-xs"
                >
                  <UserPlus className="size-3.5" />
                  <span>{showCreateForm ? "Ocultar Formulario" : "+ Nuevo Cliente"}</span>
                </Button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-forest"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Formulario de Creación de Nuevo Cliente */}
              {showCreateForm && (
                <div className="rounded-xl border-2 border-forest/30 bg-forest-mist/20 p-4 space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                      <UserPlus className="size-4" /> Crear Nueva Declaración / Cliente
                    </h4>
                    <span className="text-[11px] text-muted">Se abrirá un borrador en blanco independiente</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Nombre Completo del Declarante *</Label>
                      <Input
                        placeholder="Ej: Laura Victoria Morales"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="mt-1 text-xs"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cédula / NIT (sin DV)</Label>
                      <Input
                        placeholder="Ej: 1020304050"
                        value={newClientNit}
                        onChange={(e) => setNewClientNit(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-forest/20">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted">Año Gravable:</Label>
                      <select
                        value={newClientYear}
                        onChange={(e) => setNewClientYear(Number(e.target.value) as TaxYear)}
                        className="rounded border border-line bg-surface px-2 py-1 text-xs font-semibold text-ink"
                      >
                        <option value={2025}>AG 2025 (Declarar en 2026)</option>
                        <option value={2024}>AG 2024 (Declarar en 2025)</option>
                        <option value={2023}>AG 2023</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)} className="text-xs">
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={!newClientName.trim()}
                        className="gap-1.5 bg-forest text-primary-fg"
                      >
                        <Plus className="size-3.5" /> Crear y Activar Cliente
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Barra de Búsqueda y Estadísticas */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Declaraciones Guardadas ({profiles.length || 1})
                  </h4>
                </div>
                <Input
                  placeholder="🔍 Buscar por nombre o NIT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs text-xs h-8"
                />
              </div>

              {/* Lista de Clientes */}
              <div className="space-y-2.5">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-line bg-bg/30 p-8 text-center text-xs text-muted">
                    No se encontraron clientes con el criterio "{search}".
                  </div>
                ) : (
                  filtered.map((p) => {
                    const isActive = p.id === activeProfileId;
                    return (
                      <div
                        key={p.id}
                        className={`group relative flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                          isActive
                            ? "border-forest bg-forest-mist/40 shadow-sm ring-1 ring-forest/30"
                            : "border-line bg-surface hover:border-forest/40 hover:bg-bg/40"
                        }`}
                      >
                        {/* Info del Cliente y Click para Activar */}
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            switchProfile(p.id);
                            setModalOpen(false);
                          }}
                          title="Haga clic para activar este cliente y editar su declaración"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-ink truncate">{p.name}</span>
                            {isActive && <Badge tone="ok">Activo Ahora</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-muted">
                            <span className="font-mono text-[11px] bg-bg/60 px-1.5 py-0.5 rounded border border-line">
                              NIT: {p.nit || "Sin NIT"}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-ink-soft">AG {p.year || 2025}</span>
                          </div>
                        </div>

                        {/* Botones de Acción (Estado, Editar, Duplicar, Eliminar) */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line w-full sm:w-auto justify-end">
                          {/* Selector de Estado */}
                          <select
                            value={p.status}
                            onChange={(e) => updateProfileStatus(p.id, e.target.value as ProfileStatus)}
                            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-forest"
                            title="Cambiar estado de la declaración"
                          >
                            <option value="borrador">📝 Borrador</option>
                            <option value="revision">⏳ En Revisión</option>
                            <option value="listo">✨ Listo</option>
                            <option value="presentado">✅ Presentado DIAN</option>
                          </select>

                          {/* Botón Editar Información */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(p);
                            }}
                            title="Editar nombre, NIT o año gravable"
                            className="gap-1 text-xs h-8 px-2.5"
                          >
                            <Edit2 className="size-3.5 text-forest" />
                            <span className="hidden md:inline">Editar</span>
                          </Button>

                          {/* Botón Duplicar */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateProfile(p.id);
                            }}
                            title="Duplicar como nueva declaración"
                            className="gap-1 text-xs h-8 px-2.5"
                          >
                            <Copy className="size-3.5 text-muted" />
                            <span className="hidden md:inline">Duplicar</span>
                          </Button>

                          {/* Botón Eliminar / Reiniciar */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p);
                            }}
                            title={
                              profiles.length > 1
                                ? "Eliminar este cliente definitivamente"
                                : "Reiniciar datos a blanco"
                            }
                            className="gap-1 text-xs h-8 px-2.5 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden md:inline">
                              {profiles.length > 1 ? "Eliminar" : "Reiniciar"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Guía explicativa */}
              <div className="rounded-lg bg-bg/50 border border-line p-3 text-xs text-muted flex items-start gap-2.5">
                <Info className="size-4 text-forest shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-ink">¿Cómo funciona el Gestor Multi-Cliente?</span>
                  <p className="mt-0.5 leading-relaxed">
                    Cada cliente mantiene su propio patrimonio, ingresos cedulares, deducciones, documentos y auditorías de forma 100 % aislada. Al hacer clic sobre cualquier cliente, el sistema carga automáticamente toda su información en el Formulario 210.
                  </p>
                </div>
              </div>

              {/* Respaldo Masivo JSON */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-1.5 text-xs">
                    <Download className="size-3.5 text-forest" /> Exportar Todo (JSON)
                  </Button>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg">
                      <Upload className="size-3.5 text-forest" /> Importar Respaldo
                    </span>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cerrar
                </Button>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Secundario para Editar Nombre / NIT del Cliente */}
      {editingProfile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Edit2 className="size-4 text-forest" /> Editar Datos del Cliente
              </h4>
              <button
                onClick={() => setEditingProfile(null)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre Completo del Declarante</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej: Carlos Eduardo Gómez"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Cédula / NIT (sin DV)</Label>
                <Input
                  value={editNit}
                  onChange={(e) => setEditNit(e.target.value)}
                  placeholder="Ej: 1018456789"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Año Gravable</Label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(Number(e.target.value) as TaxYear)}
                  className="mt-1 w-full rounded border border-line bg-surface p-2 text-xs font-semibold text-ink"
                >
                  <option value={2025}>AG 2025 (Declarar en 2026)</option>
                  <option value={2024}>AG 2024 (Declarar en 2025)</option>
                  <option value={2023}>AG 2023</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button size="sm" variant="ghost" onClick={() => setEditingProfile(null)} className="text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="gap-1 bg-forest text-primary-fg text-xs">
                <Check className="size-3.5" /> Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status?: ProfileStatus }) {
  switch (status) {
    case "presentado":
      return (
        <span className="flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
          ✓ Presentado
        </span>
      );
    case "listo":
      return (
        <span className="flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800">
          Listo
        </span>
      );
    case "revision":
      return (
        <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
          Revisión
        </span>
      );
    case "borrador":
    default:
      return (
        <span className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-700">
          Borrador
        </span>
      );
  }
}
