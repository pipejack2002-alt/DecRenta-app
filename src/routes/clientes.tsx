import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Check,
  Calendar,
  Building2,
  Coins,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  Printer,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore, type ClientProfile, type ProfileStatus } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { compute } from "@/lib/tax/engine";
import { downloadFile } from "@/lib/tax/export-dian";
import type { TaxYear } from "@/lib/tax/types";
import { InformeClienteModal } from "@/components/tax/informe-cliente-modal";
import { ComparativoMultianualModal } from "@/components/tax/comparativo-multianual-modal";

export const Route = createFileRoute("/clientes")({
  component: ClientesRoute,
});

function ClientesRoute() {
  const navigate = useNavigate();

  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const declaration = useAppStore((s) => s.declaration);
  const switchProfile = useAppStore((s) => s.switchProfile);
  const createProfile = useAppStore((s) => s.createProfile);
  const duplicateProfile = useAppStore((s) => s.duplicateProfile);
  const deleteProfile = useAppStore((s) => s.deleteProfile);
  const updateProfileStatus = useAppStore((s) => s.updateProfileStatus);
  const updateProfileInfo = useAppStore((s) => s.updateProfileInfo);
  const exportAllProfilesJson = useAppStore((s) => s.exportAllProfilesJson);
  const importProfilesJson = useAppStore((s) => s.importProfilesJson);
  const reset = useAppStore((s) => s.reset);

  // Estados locales
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComparativoModal, setShowComparativoModal] = useState(false);
  const [selectedForInforme, setSelectedForInforme] = useState<{ profile: ClientProfile; computed: any; decl: any } | null>(null);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<ClientProfile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Formulario Crear
  const [newName, setNewName] = useState("");
  const [newNit, setNewNit] = useState("");
  const [newYearStr, setNewYearStr] = useState<string>("2025");

  // Formulario Editar
  const [editName, setEditName] = useState("");
  const [editNit, setEditNit] = useState("");
  const [editYearStr, setEditYearStr] = useState<string>("2025");
  const [editStatus, setEditStatus] = useState<ProfileStatus>("borrador");

  // Lista de perfiles enriquecidos con su liquidación computada
  const enrichedProfiles = useMemo(() => {
    return profiles.map((p) => {
      const decl = p.id === activeProfileId ? declaration : p.declaration;
      const c = compute(decl);
      return {
        ...p,
        declaration: decl,
        computed: c,
      };
    });
  }, [profiles, activeProfileId, declaration]);

  // Filtros de búsqueda
  const filteredProfiles = useMemo(() => {
    return enrichedProfiles.filter((p) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.nit.toLowerCase().includes(term) ||
        (p.declaration.identity.dirSeccional || "").toLowerCase().includes(term);

      const matchesYear = filterYear === "todos" || String(p.year) === filterYear;
      const matchesStatus = filterStatus === "todos" || p.status === filterStatus;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [enrichedProfiles, search, filterYear, filterStatus]);

  // Métricas globales
  const stats = useMemo(() => {
    let totalPagar = 0;
    let totalFavor = 0;
    let listos = 0;
    let borradores = 0;

    for (const p of enrichedProfiles) {
      if (p.computed.saldoPagar > 0) totalPagar += p.computed.saldoPagar;
      if (p.computed.saldoFavor > 0) totalFavor += p.computed.saldoFavor;
      if (p.status === "listo" || p.status === "presentado") listos++;
      else borradores++;
    }

    return {
      total: enrichedProfiles.length,
      totalPagar,
      totalFavor,
      listos,
      borradores,
    };
  }, [enrichedProfiles]);

  // Handlers
  function handleCreate() {
    if (!newName.trim()) return;
    const yearNum = Number(newYearStr) || 2025;
    const id = createProfile(newName.trim(), newNit.trim(), yearNum as TaxYear);
    setNewName("");
    setNewNit("");
    setNewYearStr("2025");
    setShowCreateModal(false);
    switchProfile(id);
    navigate({ to: "/declaracion" });
  }

  function handleStartEdit(p: ClientProfile) {
    setEditingProfile(p);
    setEditName(p.name);
    setEditNit(p.nit === "Sin NIT" ? "" : p.nit);
    setEditYearStr(String(p.year || 2025));
    setEditStatus(p.status || "borrador");
  }

  function handleSaveEdit() {
    if (!editingProfile || !editName.trim()) return;
    const yearNum = Number(editYearStr) || 2025;
    updateProfileInfo(editingProfile.id, editName.trim(), editNit.trim(), yearNum as TaxYear);
    updateProfileStatus(editingProfile.id, editStatus);
    setEditingProfile(null);
  }

  function handleConfirmDelete() {
    if (!deletingProfile) return;
    if (profiles.length > 1) {
      deleteProfile(deletingProfile.id);
    } else {
      reset();
    }
    setDeletingProfile(null);
  }

  function handleDuplicate(p: ClientProfile) {
    const newId = duplicateProfile(p.id);
    switchProfile(newId);
  }

  function handleExportAll() {
    const json = exportAllProfilesJson();
    downloadFile(`tributoapp-portafolio-declaraciones-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
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
        alert(`¡Se importaron con éxito ${res.count} declaración(es) a su gestor!`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-forest-mist text-forest">
              <Users className="size-5" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Gestor de Declaraciones y Clientes
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Portafolio centralizado: administra, busca, duplica y respalda los expedientes y declaraciones de renta de todos tus clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-forest text-primary-fg hover:bg-forest-deep shadow-sm text-xs font-semibold gap-1.5"
          >
            <UserPlus className="size-4" />
            Nueva Declaración / Cliente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparativoModal(true)}
            className="text-xs border-line hover:bg-forest-mist gap-1.5"
            title="Comparar evolución multianual entre años gravables del contribuyente"
          >
            <BarChart3 className="size-3.5 text-forest" />
            Comparativo Multianual
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            className="text-xs border-line hover:bg-forest-mist gap-1.5"
            title="Descargar copia de seguridad JSON con todos los clientes y declaraciones"
          >
            <Download className="size-3.5 text-forest" />
            Exportar Respaldo
          </Button>

          <label
            htmlFor="import-profiles-input"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink cursor-pointer hover:bg-forest-mist transition-colors shadow-xs"
            title="Restaurar o importar clientes desde archivo JSON"
          >
            <Upload className="size-3.5 text-forest" />
            Importar
            <input
              id="import-profiles-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error al importar respaldo JSON</p>
            <p className="mt-0.5">{importError}</p>
          </div>
        </div>
      )}

      {/* Métricas / Resumen Ejecutivo del Portafolio */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-line bg-surface p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Users className="size-3.5 text-forest" />
            Total Declaraciones
          </span>
          <p className="text-2xl font-bold font-display text-ink">{stats.total}</p>
          <span className="text-[11px] text-muted block">Expedientes en memoria local</span>
        </Card>

        <Card className="border-line bg-surface p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Listas / Presentadas
          </span>
          <p className="text-2xl font-bold font-display text-emerald-800">{stats.listos}</p>
          <span className="text-[11px] text-muted block">Listas para firma o radicadas</span>
        </Card>

        <Card className="border-line bg-surface p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-600" />
            En Proceso / Borrador
          </span>
          <p className="text-2xl font-bold font-display text-amber-800">{stats.borradores}</p>
          <span className="text-[11px] text-muted block">En captura de datos o depuración</span>
        </Card>

        <Card className="border-line bg-surface p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
            <Coins className="size-3.5 text-forest" />
            Saldo a Pagar Consolidado
          </span>
          <p className="text-2xl font-bold font-mono text-forest-deep">{formatCOP(stats.totalPagar)}</p>
          <span className="text-[11px] text-muted block">Saldo a favor: {formatCOP(stats.totalFavor)}</span>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface border border-line rounded-2xl p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-muted" />
          <Input
            type="text"
            placeholder="Buscar por nombre, NIT, cédula o seccional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-bg/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-muted hover:text-ink text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted">Año:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-8 rounded-lg border border-line bg-bg px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="todos">Todos los Años</option>
              <option value="2025">AG 2025</option>
              <option value="2024">AG 2024</option>
              <option value="2023">AG 2023</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded-lg border border-line bg-bg px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="todos">Todos los Estados</option>
              <option value="borrador">Borrador</option>
              <option value="revision">En Revisión</option>
              <option value="listo">Lista para Presentar</option>
              <option value="presentado">Presentada DIAN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado de Tarjetas de Declaraciones */}
      <div className="space-y-4">
        {filteredProfiles.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line bg-surface/50 p-12 text-center space-y-3">
            <Users className="size-10 text-muted mx-auto" />
            <h3 className="text-sm font-bold text-ink">No se encontraron declaraciones</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {search || filterYear !== "todos" || filterStatus !== "todos"
                ? "No hay declaraciones que coincidan con los filtros aplicados. Intenta restablecer la búsqueda."
                : "Aún no tienes clientes registrados. Crea una nueva declaración para comenzar."}
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-forest text-primary-fg hover:bg-forest-deep text-xs font-semibold"
            >
              <Plus className="mr-1 size-3.5" />
              Crear Primera Declaración
            </Button>
          </div>
        ) : (
          filteredProfiles.map((p) => {
            const isActive = p.id === activeProfileId;
            const iden = p.declaration.identity;
            const fullName = [iden.primerNombre, iden.otrosNombres, iden.primerApellido, iden.segundoApellido]
              .filter(Boolean)
              .join(" ") || p.name;

            const c = p.computed;

            return (
              <div
                key={p.id}
                className={`group relative rounded-2xl border transition-all duration-200 bg-surface p-5 shadow-xs hover:shadow-md ${
                  isActive
                    ? "border-forest ring-2 ring-forest/20 bg-forest-mist/20"
                    : "border-line hover:border-forest/50"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información Principal del Cliente */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                          <Check className="size-3" />
                          Declaración Activa en Pantalla
                        </span>
                      )}

                      <Badge tone={p.year === 2025 ? "forest" : "neutral"} className="font-mono text-[11px]">
                        AG {p.year}
                      </Badge>

                      {/* Dropdown de Estado */}
                      <select
                        value={p.status || "borrador"}
                        onChange={(e) => updateProfileStatus(p.id, e.target.value as ProfileStatus)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          p.status === "presentado"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : p.status === "listo"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : p.status === "revision"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <option value="borrador">⏳ Borrador</option>
                        <option value="revision">🔍 En Revisión</option>
                        <option value="listo">✅ Lista para Presentar</option>
                        <option value="presentado">🏛️ Presentada DIAN</option>
                      </select>

                      <span className="text-[11px] text-muted">
                        Modificado: {new Date(p.updatedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-display text-ink truncate group-hover:text-forest transition-colors">
                        {fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                        <span className="font-mono font-semibold text-ink-soft">
                          NIT: {p.nit || iden.nit || "Sin NIT"}{iden.dv ? `-${iden.dv}` : ""}
                        </span>
                        {iden.dirSeccional && (
                          <span>Seccional: {iden.dirSeccional}</span>
                        )}
                        {iden.actividadCiiu && (
                          <span>CIIU: {iden.actividadCiiu}</span>
                        )}
                        <span>Docs adjuntos: {p.docs.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cifras Clave de la Liquidación */}
                  <div className="grid grid-cols-3 gap-3 border-y lg:border-y-0 lg:border-x border-line py-3 lg:py-0 lg:px-6 text-center">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted block">Patrimonio Bruto</span>
                      <span className="font-mono text-xs font-bold text-ink">{formatCOP(c.casillas[29] || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted block">Deudas / Pasivos</span>
                      <span className="font-mono text-xs font-bold text-red-700">{formatCOP(c.casillas[30] || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                        {c.saldoPagar > 0 ? "Saldo a Pagar" : c.saldoFavor > 0 ? "Saldo a Favor" : "Total a Pagar"}
                      </span>
                      <span
                        className={`font-mono text-sm font-bold ${
                          c.saldoPagar > 0
                            ? "text-red-700"
                            : c.saldoFavor > 0
                              ? "text-emerald-700"
                              : "text-forest-deep"
                        }`}
                      >
                        {formatCOP(c.saldoPagar || c.saldoFavor || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    {!isActive ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          switchProfile(p.id);
                          navigate({ to: "/formulario" });
                        }}
                        className="bg-forest text-primary-fg hover:bg-forest-deep text-xs font-semibold gap-1"
                        title="Abrir y cargar esta declaración en el espacio de trabajo"
                      >
                        <ArrowRight className="size-3.5" />
                        Abrir Declaración
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate({ to: "/formulario" })}
                        className="text-xs font-semibold gap-1 text-forest-deep bg-forest-mist hover:bg-forest-mist/80"
                        title="Ir a ver el Formulario 210 de este cliente"
                      >
                        <FileText className="size-3.5 text-forest" />
                        Ver Formulario 210
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted hover:text-forest"
                      onClick={() =>
                        setSelectedForInforme({
                          profile: p,
                          computed: p.computed,
                          decl: p.declaration,
                        })
                      }
                      title="Generar e imprimir informe ejecutivo para este cliente"
                    >
                      <FileText className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted hover:text-forest"
                      onClick={() => handleDuplicate(p)}
                      title="Duplicar o crear nuevo año gravable para este cliente"
                    >
                      <Copy className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted hover:text-ink"
                      onClick={() => handleStartEdit(p)}
                      title="Editar nombre, NIT o año gravable"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted hover:text-red-600"
                      onClick={() => setDeletingProfile(p)}
                      title="Eliminar declaración"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          MODAL: CREAR NUEVA DECLARACIÓN / CLIENTE
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-forest-mist text-forest">
                  <UserPlus className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Nueva Declaración / Cliente</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="new-name" className="text-xs font-semibold text-ink">
                  Nombres y Apellidos del Contribuyente *
                </Label>
                <Input
                  id="new-name"
                  type="text"
                  placeholder="Ej: MARÍA FERNANDA PÉREZ GÓMEZ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-nit" className="text-xs font-semibold text-ink">
                    NIT / Cédula (Sin DV)
                  </Label>
                  <Input
                    id="new-nit"
                    type="text"
                    placeholder="Ej: 1044608716"
                    value={newNit}
                    onChange={(e) => setNewNit(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-year" className="text-xs font-semibold text-ink">
                    Año Gravable (Formulario 210)
                  </Label>
                  <select
                    id="new-year"
                    value={newYearStr}
                    onChange={(e) => setNewYearStr(e.target.value)}
                    className="w-full h-9 rounded-lg border border-line bg-bg px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="2026">AG 2026 (Declarar en 2027)</option>
                    <option value="2025">AG 2025 (Declarar en 2026) · Oficial Vigente</option>
                    <option value="2024">AG 2024 (Declarar en 2025)</option>
                    <option value="2023">AG 2023</option>
                    <option value="2022">AG 2022</option>
                    <option value="2021">AG 2021</option>
                    <option value="2020">AG 2020</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                💡 Se creará una declaración limpia en ceros para este cliente, manteniendo guardadas tus declaraciones anteriores.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold shadow-md shadow-emerald-950/20"
              >
                Crear y Abrir Declaración
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR DATOS DEL CLIENTE / DECLARACIÓN
          ========================================================================= */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-forest-mist text-forest">
                  <Edit2 className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Editar Datos del Expediente</h3>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold text-ink">
                  Nombres y Apellidos
                </Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-nit" className="text-xs font-semibold text-ink">
                    NIT / Cédula
                  </Label>
                  <Input
                    id="edit-nit"
                    type="text"
                    value={editNit}
                    onChange={(e) => setEditNit(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-year" className="text-xs font-semibold text-ink">
                    Año Gravable
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <select
                      id="edit-year"
                      value={["2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"].includes(editYearStr) ? editYearStr : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") setEditYearStr(e.target.value);
                      }}
                      className="flex-1 h-9 rounded-lg border border-line bg-bg px-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-forest font-semibold cursor-pointer"
                    >
                      <option value="2027">AG 2027 (Declarar en 2028)</option>
                      <option value="2026">AG 2026 (Declarar en 2027)</option>
                      <option value="2025">AG 2025 (Declarar en 2026)</option>
                      <option value="2024">AG 2024 (Declarar en 2025)</option>
                      <option value="2023">AG 2023</option>
                      <option value="2022">AG 2022</option>
                      <option value="2021">AG 2021</option>
                      <option value="2020">AG 2020</option>
                      <option value="2019">AG 2019</option>
                      <option value="2018">AG 2018</option>
                      {!["2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"].includes(editYearStr) && editYearStr && (
                        <option value={editYearStr}>AG {editYearStr}</option>
                      )}
                    </select>
                    <Input
                      type="text"
                      maxLength={4}
                      placeholder="2025"
                      value={editYearStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setEditYearStr(val);
                      }}
                      className="w-18 h-9 text-xs font-mono font-bold text-center border-line bg-bg"
                      title="Digita cualquier año gravable libremente"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold text-ink">
                  Estado de la Declaración
                </Label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProfileStatus)}
                  className="w-full h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-forest"
                >
                  <option value="borrador">⏳ Borrador (En captura)</option>
                  <option value="revision">🔍 En Revisión / Auditoría</option>
                  <option value="listo">✅ Lista para Presentar en DIAN</option>
                  <option value="presentado">🏛️ Presentada / Radicada DIAN</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className="bg-forest text-primary-fg hover:bg-forest-deep text-xs font-semibold"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMAR ELIMINACIÓN
          ========================================================================= */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-surface p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="flex size-10 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">¿Eliminar declaración?</h3>
                <p className="text-xs text-muted">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-ink/80 leading-relaxed">
              Está a punto de eliminar definitivamente el expediente y los cálculos de:{" "}
              <strong className="text-ink font-bold block mt-1">
                {deletingProfile.name} (AG {deletingProfile.year})
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProfile(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
              >
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Informe Ejecutivo para el Cliente */}
      {selectedForInforme && (
        <InformeClienteModal
          isOpen={!!selectedForInforme}
          onClose={() => setSelectedForInforme(null)}
          computed={selectedForInforme.computed}
          declaration={selectedForInforme.decl}
        />
      )}

      {/* Modal Comparativo Multianual */}
      <ComparativoMultianualModal
        isOpen={showComparativoModal}
        onClose={() => setShowComparativoModal(false)}
      />
    </div>
  );
}
