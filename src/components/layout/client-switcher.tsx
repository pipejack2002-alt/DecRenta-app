import { useState } from "react";
import { Users, UserPlus, Copy, Trash2, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, Download, Upload, Plus } from "lucide-react";
import { useAppStore, type ProfileStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadFile } from "@/lib/tax/export-dian";

export function ClientSwitcher() {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const declaration = useAppStore((s) => s.declaration);
  const switchProfile = useAppStore((s) => s.switchProfile);
  const createProfile = useAppStore((s) => s.createProfile);
  const duplicateProfile = useAppStore((s) => s.duplicateProfile);
  const deleteProfile = useAppStore((s) => s.deleteProfile);
  const updateProfileStatus = useAppStore((s) => s.updateProfileStatus);
  const exportAllProfilesJson = useAppStore((s) => s.exportAllProfilesJson);
  const importProfilesJson = useAppStore((s) => s.importProfilesJson);

  const [modalOpen, setModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientNit, setNewClientNit] = useState("");
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Perfil activo actual
  const currentName =
    [declaration.identity.primerNombre, declaration.identity.primerApellido].filter(Boolean).join(" ") ||
    "Cliente Actual";
  const currentNit = declaration.identity.nit || "Sin NIT";

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || {
    id: activeProfileId || "default",
    name: currentName,
    nit: currentNit,
    status: "borrador" as ProfileStatus,
  };

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || p.nit.toLowerCase().includes(term);
  });

  function handleCreate() {
    if (!newClientName.trim()) return;
    const id = createProfile(newClientName.trim(), newClientNit.trim(), declaration.year);
    setNewClientName("");
    setNewClientNit("");
    switchProfile(id);
    setModalOpen(false);
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
        alert(`¡Se importaron con éxito ${res.count} cliente(s)!`);
        setModalOpen(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-line bg-surface/80 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-forest/50 hover:bg-surface focus:outline-none"
        title="Cambiar o administrar clientes (Modo Contador)"
      >
        <Users className="size-3.5 text-forest" />
        <div className="max-w-[140px] truncate sm:max-w-[180px]">
          <span className="block font-medium leading-tight text-ink truncate">{activeProfile.name || currentName}</span>
          <span className="block text-[10px] text-muted truncate">NIT: {activeProfile.nit || currentNit}</span>
        </div>
        <StatusPill status={activeProfile.status} />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">Gestor de Clientes y Declaraciones</h3>
                  <p className="text-xs text-muted">Administre múltiples declaraciones de renta sin mezclar datos</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-forest"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form Crear Nuevo */}
              <div className="rounded-lg border border-line bg-bg/50 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <UserPlus className="size-3.5" /> Agregar Nuevo Cliente / Declaración
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre Completo del Declarante</Label>
                    <Input
                      placeholder="Ej: Carlos Eduardo Gómez"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cédula / NIT (sin DV)</Label>
                    <Input
                      placeholder="Ej: 1018456789"
                      value={newClientNit}
                      onChange={(e) => setNewClientNit(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={handleCreate} disabled={!newClientName.trim()} className="gap-1.5 bg-forest text-primary-fg">
                    <Plus className="size-3.5" /> Crear y Activar
                  </Button>
                </div>
              </div>

              {/* Búsqueda y Lista */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Declaraciones Guardadas ({profiles.length || 1})
                  </h4>
                  <Input
                    placeholder="Buscar por nombre o NIT..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs text-xs h-8"
                  />
                </div>

                <div className="divide-y divide-line rounded-lg border border-line bg-surface max-h-60 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted">
                      No se encontraron clientes con el criterio de búsqueda.
                    </div>
                  ) : (
                    filtered.map((p) => {
                      const isActive = p.id === activeProfileId;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 transition-colors ${
                            isActive ? "bg-forest-mist/50 border-l-4 border-l-forest" : "hover:bg-bg/40"
                          }`}
                        >
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { switchProfile(p.id); setModalOpen(false); }}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-ink truncate">{p.name}</span>
                              {isActive && <Badge tone="ok">Activo</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                              <span>NIT: {p.nit}</span>
                              <span>•</span>
                              <span>AG {p.year}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Selector de Estado */}
                            <select
                              value={p.status}
                              onChange={(e) => updateProfileStatus(p.id, e.target.value as ProfileStatus)}
                              className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus:border-forest"
                            >
                              <option value="borrador">Borrador</option>
                              <option value="revision">En Revisión</option>
                              <option value="listo">Listo</option>
                              <option value="presentado">Presentado DIAN</option>
                            </select>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateProfile(p.id)}
                              title="Duplicar declaración"
                              className="size-8 text-muted hover:text-ink"
                            >
                              <Copy className="size-3.5" />
                            </Button>

                            {profiles.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`¿Eliminar la declaración de ${p.name}?`)) {
                                    deleteProfile(p.id);
                                  }
                                }}
                                title="Eliminar cliente"
                                className="size-8 text-muted hover:text-red-600"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
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
    </>
  );
}

function StatusPill({ status }: { status: ProfileStatus }) {
  switch (status) {
    case "presentado":
      return <span className="flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">✓ Presentado</span>;
    case "listo":
      return <span className="flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800">Listo</span>;
    case "revision":
      return <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">Revisión</span>;
    case "borrador":
    default:
      return <span className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-700">Borrador</span>;
  }
}
