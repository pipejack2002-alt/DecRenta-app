import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { compute } from "@/lib/tax/engine";
import {
  emptyDeclaration,
  type ComputedDeclaration,
  type Declaration,
  type TaxYear,
} from "@/lib/tax/types";
import type { VaultDoc, IngestedNorm } from "@/lib/docs/types";
import { MAX_NORMA_CHARS, MAX_NORMAS } from "@/lib/docs/types";
import { normalizeOverrides, type UvtOverrides } from "@/lib/tax/uvt";
import {
  type CatalogItem,
  DEFAULT_SECCIONALES,
  DEFAULT_CIIU_COMMON,
} from "@/lib/catalogs";
import { saveSnapshotToIdb, getSnapshotFromIdb } from "@/lib/idb-backup";

const memory: { current: string | null } = { current: null };

const safeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => memory.current,
      setItem: (_k: string, v: string) => {
        memory.current = v;
      },
      removeItem: () => {
        memory.current = null;
      },
    };
  }
  return localStorage;
});

function hydrateDeclaration(raw: Declaration): Declaration {
  const base = emptyDeclaration(raw?.year || 2025);
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    uvtOverrides: normalizeOverrides(raw.uvtOverrides),
    identity: { ...base.identity, ...raw.identity },
    topes: { ...base.topes, ...raw.topes },
    patrimonio: { ...base.patrimonio, ...raw.patrimonio },
    trabajo: { ...base.trabajo, ...raw.trabajo },
    honorarios: { ...base.honorarios, ...raw.honorarios },
    capital: { ...base.capital, ...raw.capital },
    noLaborales: { ...base.noLaborales, ...raw.noLaborales },
    pensiones: { ...base.pensiones, ...raw.pensiones },
    dividendos: { ...base.dividendos, ...raw.dividendos },
    gananciasOcasionales: { ...base.gananciasOcasionales, ...raw.gananciasOcasionales },
    descuentos: { ...base.descuentos, ...raw.descuentos },
    extra: { ...base.extra, ...raw.extra },
    historialPerdidas: Array.isArray(raw?.historialPerdidas) ? raw.historialPerdidas : [],
  };
}

function hydrateNormas(raw: unknown): IngestedNorm[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n) => n && typeof n === "object")
    .slice(0, MAX_NORMAS)
    .map((n, i) => {
      const x = n as Partial<IngestedNorm>;
      return {
        id: String(x.id || `n-${i}`),
        title: String(x.title || "Norma").slice(0, 200),
        citation: String(x.citation || "").slice(0, 200),
        text: String(x.text || "").slice(0, MAX_NORMA_CHARS),
        addedAt: String(x.addedAt || ""),
        fileName: x.fileName ? String(x.fileName) : undefined,
        kind: (x.kind as IngestedNorm["kind"]) || "otro",
      };
    });
}

export type AiSettings = {
  geminiApiKey: string;
  geminiModel: string;
};

export type ProfileStatus = "borrador" | "revision" | "listo" | "presentado";

export type ClientProfile = {
  id: string;
  name: string;
  nit: string;
  year: number;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
  declaration: Declaration;
  docs: VaultDoc[];
  normas: IngestedNorm[];
};

type AppState = {
  declaration: Declaration;
  docs: VaultDoc[];
  normas: IngestedNorm[];
  aiSettings: AiSettings;
  profiles: ClientProfile[];
  activeProfileId: string | null;

  setYear: (year: TaxYear) => void;
  setUvtOverride: (year: number, value: number | null) => void;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  patch: (fn: (d: Declaration) => void) => void;
  reset: () => void;
  loadExample: () => void;
  loadAndresBernal: () => void;
  addDoc: (doc: VaultDoc) => void;
  updateDoc: (id: string, patch: Partial<VaultDoc>) => void;
  removeDoc: (id: string) => void;
  addNorma: (n: IngestedNorm) => { ok: true } | { ok: false; error: string };
  removeNorma: (id: string) => void;
  applyAmounts: (amounts: Record<string, number>) => void;

  // Multi-cliente
  createProfile: (name?: string, nit?: string, year?: TaxYear) => string;
  switchProfile: (id: string) => void;
  duplicateProfile: (id: string) => string;
  rolloverProfileToNextYear: (id: string, nextYear?: TaxYear) => string;
  deleteProfile: (id: string) => void;
  updateProfileStatus: (id: string, status: ProfileStatus) => void;
  updateProfileInfo: (id: string, name: string, nit: string, year?: TaxYear) => void;
  exportAllProfilesJson: () => string;
  importProfilesJson: (jsonStr: string) => { ok: true; count: number } | { ok: false; error: string };
  restoreFromIdb: () => Promise<boolean>;

  // Catálogos personalizables
  customSeccionales: CatalogItem[];
  customCiiu: CatalogItem[];
  addOrUpdateSeccional: (code: string, name: string) => void;
  deleteSeccional: (code: string) => void;
  resetSeccionales: () => void;
  addOrUpdateCiiu: (code: string, name: string) => void;
  deleteCiiu: (code: string) => void;
  resetCiiu: () => void;
};

const DEFAULT_PROFILE_ID = "p-principal";

function syncCurrentProfile(s: AppState, nextDecl?: Declaration, nextDocs?: VaultDoc[], nextNormas?: IngestedNorm[]): ClientProfile[] {
  const activeId = s.activeProfileId || DEFAULT_PROFILE_ID;
  const d = nextDecl ?? s.declaration;
  const docs = nextDocs ?? s.docs;
  const normas = nextNormas ?? s.normas;
  const name = [d.identity.primerNombre, d.identity.primerApellido].filter(Boolean).join(" ") || "Cliente Principal";
  const nit = d.identity.nit || "Sin NIT";

  const existingIndex = s.profiles.findIndex((p) => p.id === activeId);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated = [...s.profiles];
    updated[existingIndex] = {
      ...updated[existingIndex],
      name,
      nit,
      year: d.year,
      declaration: d,
      docs,
      normas,
      updatedAt: now,
    };
    return updated;
  }

  return [
    ...s.profiles,
    {
      id: activeId,
      name,
      nit,
      year: d.year,
      status: "borrador",
      createdAt: now,
      updatedAt: now,
      declaration: d,
      docs,
      normas,
    },
  ];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      declaration: emptyDeclaration(2025),
      docs: [],
      normas: [],
      aiSettings: {
        geminiApiKey: typeof window !== "undefined" ? localStorage.getItem("tributoapp_gemini_api_key") || "" : "",
        geminiModel: (typeof window !== "undefined" ? (localStorage.getItem("tributoapp_gemini_model") as any) : null) || "gemini-2.0-flash",
      },
      profiles: [],
      activeProfileId: DEFAULT_PROFILE_ID,

      setYear: (year) =>
        set((s) => {
          const nextDecl = { ...s.declaration, year };
          const nextProfiles = syncCurrentProfile(s, nextDecl);
          return { declaration: nextDecl, profiles: nextProfiles };
        }),
      setUvtOverride: (year, value) =>
        set((s) => {
          const next: UvtOverrides = { ...normalizeOverrides(s.declaration.uvtOverrides) };
          if (value == null || value <= 0) delete next[year];
          else next[year] = Math.round(value);
          const nextDecl = { ...s.declaration, uvtOverrides: next };
          const nextProfiles = syncCurrentProfile(s, nextDecl);
          return { declaration: nextDecl, profiles: nextProfiles };
        }),
      setAiSettings: (settings) => {
        if (typeof window !== "undefined") {
          if (settings.geminiApiKey !== undefined) {
            localStorage.setItem("tributoapp_gemini_api_key", settings.geminiApiKey);
          }
          if (settings.geminiModel !== undefined) {
            localStorage.setItem("tributoapp_gemini_model", settings.geminiModel);
          }
        }
        set((s) => ({ aiSettings: { ...s.aiSettings, ...settings } }));
      },
      patch: (fn) =>
        set((s) => {
          const next = structuredClone(hydrateDeclaration(s.declaration));
          fn(next);
          const nextProfiles = syncCurrentProfile(s, next);
          return { declaration: next, profiles: nextProfiles };
        }),
      reset: () =>
        set((s) => {
          const nextDecl = emptyDeclaration(2025);
          const nextProfiles = syncCurrentProfile(s, nextDecl);
          return { declaration: nextDecl, profiles: nextProfiles };
        }),
      loadExample: () =>
        set((s) => {
          const nextDecl = exampleDeclaration();
          const nextProfiles = syncCurrentProfile(s, nextDecl);
          return { declaration: nextDecl, profiles: nextProfiles };
        }),
      loadAndresBernal: () =>
        set((s) => {
          const nextDecl = andresBernalDeclaration();
          const nextProfiles = syncCurrentProfile(s, nextDecl);
          return { declaration: nextDecl, profiles: nextProfiles };
        }),
      addDoc: (doc) =>
        set((s) => {
          const nextDocs = [doc, ...s.docs];
          const nextProfiles = syncCurrentProfile(s, undefined, nextDocs);
          return { docs: nextDocs, profiles: nextProfiles };
        }),
      updateDoc: (id, patch) =>
        set((s) => {
          const nextDocs = s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d));
          const nextProfiles = syncCurrentProfile(s, undefined, nextDocs);
          return { docs: nextDocs, profiles: nextProfiles };
        }),
      removeDoc: (id) =>
        set((s) => {
          const nextDocs = s.docs.filter((d) => d.id !== id);
          const nextProfiles = syncCurrentProfile(s, undefined, nextDocs);
          return { docs: nextDocs, profiles: nextProfiles };
        }),
      addNorma: (n) => {
        let result: { ok: true } | { ok: false; error: string } = { ok: true };
        set((s) => {
          if (s.normas.length >= MAX_NORMAS) {
            result = { ok: false, error: `Tope de ${MAX_NORMAS} normas en este navegador.` };
            return s;
          }
          const nextNorma: IngestedNorm = {
            ...n,
            text: n.text.slice(0, MAX_NORMA_CHARS),
            title: n.title.slice(0, 200),
            citation: n.citation.slice(0, 200),
          };
          const nextNormas = [nextNorma, ...s.normas];
          const nextProfiles = syncCurrentProfile(s, undefined, undefined, nextNormas);
          return { normas: nextNormas, profiles: nextProfiles };
        });
        return result;
      },
      removeNorma: (id) =>
        set((s) => {
          const nextNormas = s.normas.filter((x) => x.id !== id);
          const nextProfiles = syncCurrentProfile(s, undefined, undefined, nextNormas);
          return { normas: nextNormas, profiles: nextProfiles };
        }),
      applyAmounts: (amounts) =>
        set((s) => {
          const next = structuredClone(hydrateDeclaration(s.declaration));
          applyPathAmounts(next, amounts);
          const nextProfiles = syncCurrentProfile(s, next);
          return { declaration: next, profiles: nextProfiles };
        }),

      // Acciones Multi-Cliente
      createProfile: (name = "Nuevo Cliente", nit = "", year = 2025) => {
        const id = `cli-${Date.now()}`;
        const newDecl = emptyDeclaration(year);
        if (nit) newDecl.identity.nit = nit.replace(/\D/g, "");
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          newDecl.identity.primerNombre = parts[0];
        } else if (parts.length === 2) {
          newDecl.identity.primerNombre = parts[0];
          newDecl.identity.primerApellido = parts[1];
        } else if (parts.length === 3) {
          newDecl.identity.primerNombre = parts[0];
          newDecl.identity.primerApellido = parts[1];
          newDecl.identity.segundoApellido = parts[2];
        } else if (parts.length >= 4) {
          newDecl.identity.primerNombre = parts[0];
          newDecl.identity.otrosNombres = parts[1];
          newDecl.identity.primerApellido = parts[2];
          newDecl.identity.segundoApellido = parts.slice(3).join(" ");
        }

        const now = new Date().toISOString();
        const profile: ClientProfile = {
          id,
          name,
          nit: nit || "Sin NIT",
          year,
          status: "borrador",
          createdAt: now,
          updatedAt: now,
          declaration: newDecl,
          docs: [],
          normas: [],
        };

        set((s) => {
          const updated = syncCurrentProfile(s);
          return {
            profiles: [profile, ...updated],
            activeProfileId: id,
            declaration: newDecl,
            docs: [],
            normas: [],
          };
        });

        return id;
      },

      switchProfile: (id) => {
        const s = get();
        const target = s.profiles.find((p) => p.id === id);
        if (!target) return;

        // Sincronizar el perfil actual antes de cambiar
        const synced = syncCurrentProfile(s);

        set({
          profiles: synced,
          activeProfileId: target.id,
          declaration: hydrateDeclaration(target.declaration),
          docs: target.docs || [],
          normas: hydrateNormas(target.normas),
        });
      },

      duplicateProfile: (id) => {
        const s = get();
        const source = s.profiles.find((p) => p.id === id) || {
          id: DEFAULT_PROFILE_ID,
          name: "Cliente",
          nit: "",
          year: s.declaration.year,
          status: "borrador" as ProfileStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          declaration: s.declaration,
          docs: s.docs,
          normas: s.normas,
        };

        const newId = `cli-${Date.now()}`;
        const copyDecl = structuredClone(hydrateDeclaration(source.declaration));
        const now = new Date().toISOString();

        const copy: ClientProfile = {
          id: newId,
          name: `${source.name} (Copia)`,
          nit: source.nit,
          year: source.year,
          status: "borrador",
          createdAt: now,
          updatedAt: now,
          declaration: copyDecl,
          docs: structuredClone(source.docs || []),
          normas: structuredClone(source.normas || []),
        };

        set((state) => {
          const synced = syncCurrentProfile(state);
          return {
            profiles: [copy, ...synced],
            activeProfileId: newId,
            declaration: copyDecl,
            docs: copy.docs,
            normas: copy.normas,
          };
        });

        return newId;
      },

      rolloverProfileToNextYear: (id, customNextYear) => {
        const s = get();
        const source = s.profiles.find((p) => p.id === id) || {
          id: DEFAULT_PROFILE_ID,
          name: "Cliente",
          nit: "",
          year: s.declaration.year,
          status: "borrador" as ProfileStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          declaration: s.declaration,
          docs: s.docs,
          normas: s.normas,
        };

        const targetYear = (customNextYear || (source.year + 1)) as TaxYear;
        const sourceDecl = hydrateDeclaration(source.declaration);
        const computedSource = compute(sourceDecl);

        const newDecl = emptyDeclaration(targetYear);

        // 1. Identificación idéntica (incrementa años declarando)
        newDecl.identity = {
          ...structuredClone(sourceDecl.identity),
          aniosDeclarando: Math.min(3, (sourceDecl.identity.aniosDeclarando || 1) + 1) as 1 | 2 | 3,
          numeroFormulario: "",
        };

        // 2. Traspaso patrimonial base y fijación de patrimonio líquido anterior (Casilla 31 -> Comparación Patrimonial Art. 236 E.T.)
        newDecl.patrimonio = {
          ...structuredClone(sourceDecl.patrimonio),
          patrimonioLiquidoAnterior: computedSource.casillas[31] || sourceDecl.patrimonio.patrimonioLiquidoAnterior || 0,
        };

        // 3. Traspaso de anticipos y saldos a favor (Art. 807 y ss. E.T.)
        newDecl.extra = {
          ...newDecl.extra,
          anticipoAnterior: computedSource.casillas[133] || 0, // Anticipo liquidado año anterior (Casilla 134)
          saldoFavorAnterior: computedSource.casillas[137] || 0, // Saldo a favor año anterior (Casilla 138)
          impuestoNetoAnterior: computedSource.casillas[126] || 0,
          retenciones: 0,
        };

        // 4. Historial de compensaciones pendientes (Pérdidas fiscales y excesos de renta presuntiva)
        newDecl.historialPerdidas = structuredClone(sourceDecl.historialPerdidas || []);

        const newId = `cli-${Date.now()}`;
        const now = new Date().toISOString();
        const baseName = source.name.replace(/\s*\(AG\s*\d+\)/i, "").trim();
        const rolloverProfile: ClientProfile = {
          id: newId,
          name: `${baseName} (AG ${targetYear})`,
          nit: source.nit,
          year: targetYear,
          status: "borrador",
          createdAt: now,
          updatedAt: now,
          declaration: newDecl,
          docs: structuredClone(source.docs || []),
          normas: structuredClone(source.normas || []),
        };

        set((state) => {
          const synced = syncCurrentProfile(state);
          return {
            profiles: [rolloverProfile, ...synced],
            activeProfileId: newId,
            declaration: newDecl,
            docs: rolloverProfile.docs,
            normas: rolloverProfile.normas,
          };
        });

        return newId;
      },

      deleteProfile: (id) => {
        set((s) => {
          const nextProfiles = s.profiles.filter((p) => p.id !== id);
          if (nextProfiles.length === 0) {
            const fresh = emptyDeclaration(2025);
            return {
              profiles: [],
              activeProfileId: DEFAULT_PROFILE_ID,
              declaration: fresh,
              docs: [],
              normas: [],
            };
          }
          if (s.activeProfileId === id || !nextProfiles.some((p) => p.id === s.activeProfileId)) {
            const fallback = nextProfiles[0];
            return {
              profiles: nextProfiles,
              activeProfileId: fallback.id,
              declaration: hydrateDeclaration(fallback.declaration),
              docs: fallback.docs || [],
              normas: hydrateNormas(fallback.normas),
            };
          }
          return { profiles: nextProfiles };
        });
      },

      updateProfileStatus: (id, status) => {
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
        }));
      },

      updateProfileInfo: (id, name, nit, year) => {
        set((s) => {
          const cleanName = name.trim();
          const cleanNit = nit.trim().replace(/\D/g, "");
          const parts = cleanName.split(/\s+/).filter(Boolean);
          let primerNombre = "";
          let otrosNombres = "";
          let primerApellido = "";
          let segundoApellido = "";

          if (parts.length === 1) {
            primerNombre = parts[0];
          } else if (parts.length === 2) {
            primerNombre = parts[0];
            primerApellido = parts[1];
          } else if (parts.length === 3) {
            primerNombre = parts[0];
            primerApellido = parts[1];
            segundoApellido = parts[2];
          } else if (parts.length >= 4) {
            primerNombre = parts[0];
            otrosNombres = parts[1];
            primerApellido = parts[2];
            segundoApellido = parts.slice(3).join(" ");
          }

          if (s.activeProfileId === id) {
            const nextDecl = {
              ...s.declaration,
              year: year || s.declaration.year,
              identity: {
                ...s.declaration.identity,
                primerNombre: primerNombre || s.declaration.identity.primerNombre,
                otrosNombres: otrosNombres || s.declaration.identity.otrosNombres,
                primerApellido: primerApellido || s.declaration.identity.primerApellido,
                segundoApellido: segundoApellido || s.declaration.identity.segundoApellido,
                nit: cleanNit || s.declaration.identity.nit,
              },
            };
            const synced = s.profiles.map((p) =>
              p.id === id
                ? {
                    ...p,
                    name: cleanName || p.name,
                    nit: cleanNit || p.nit,
                    year: year || p.year,
                    declaration: nextDecl,
                    updatedAt: new Date().toISOString(),
                  }
                : p
            );
            return { declaration: nextDecl, profiles: synced };
          }

          const synced = s.profiles.map((p) => {
            if (p.id !== id) return p;
            const decl = hydrateDeclaration(p.declaration);
            decl.year = year || decl.year;
            if (primerNombre) decl.identity.primerNombre = primerNombre;
            if (primerApellido) decl.identity.primerApellido = primerApellido;
            if (cleanNit) decl.identity.nit = cleanNit;
            return {
              ...p,
              name: cleanName || p.name,
              nit: cleanNit || p.nit,
              year: year || p.year,
              declaration: decl,
              updatedAt: new Date().toISOString(),
            };
          });
          return { profiles: synced };
        });
      },

      exportAllProfilesJson: () => {
        const s = get();
        const synced = syncCurrentProfile(s);
        return JSON.stringify(
          {
            version: "tributoapp-v2",
            exportedAt: new Date().toISOString(),
            profiles: synced,
          },
          null,
          2
        );
      },

      importProfilesJson: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr) as { profiles?: ClientProfile[] };
          if (!Array.isArray(data.profiles) || data.profiles.length === 0) {
            return { ok: false, error: "El archivo JSON no contiene un listado válido de clientes o declaraciones." };
          }

          const validProfiles = data.profiles.map((p) => ({
            id: p.id || `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: p.name || "Cliente Importado",
            nit: p.nit || "",
            year: p.year || 2025,
            status: (p.status as ProfileStatus) || "borrador",
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            declaration: hydrateDeclaration(p.declaration),
            docs: Array.isArray(p.docs) ? p.docs : [],
            normas: hydrateNormas(p.normas),
          }));

          set((s) => {
            const merged = [...validProfiles, ...s.profiles.filter((curr) => !validProfiles.some((vp) => vp.id === curr.id))];
            const first = validProfiles[0];
            return {
              profiles: merged,
              activeProfileId: first.id,
              declaration: hydrateDeclaration(first.declaration),
              docs: first.docs,
              normas: first.normas,
            };
          });

          return { ok: true, count: validProfiles.length };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Error al parsear el archivo JSON." };
        }
      },

      restoreFromIdb: async () => {
        try {
          const snapshot = await getSnapshotFromIdb<{
            declaration?: Declaration;
            profiles?: ClientProfile[];
            activeProfileId?: string;
            docs?: VaultDoc[];
            normas?: IngestedNorm[];
          }>("declarapro_backup_state");

          if (!snapshot) return false;

          const decl = snapshot.declaration ? hydrateDeclaration(snapshot.declaration) : null;
          const profiles = Array.isArray(snapshot.profiles)
            ? snapshot.profiles.map((p) => ({
                ...p,
                declaration: hydrateDeclaration(p.declaration),
                docs: Array.isArray(p.docs) ? p.docs : [],
                normas: hydrateNormas(p.normas),
              }))
            : [];

          if (!decl && profiles.length === 0) return false;

          set((s) => ({
            ...s,
            declaration: decl || s.declaration,
            profiles: profiles.length > 0 ? profiles : s.profiles,
            activeProfileId: snapshot.activeProfileId || s.activeProfileId,
            docs: Array.isArray(snapshot.docs) ? snapshot.docs : s.docs,
            normas: hydrateNormas(snapshot.normas) || s.normas,
          }));

          return true;
        } catch {
          return false;
        }
      },

      customSeccionales: DEFAULT_SECCIONALES,
      customCiiu: DEFAULT_CIIU_COMMON,

      addOrUpdateSeccional: (code, name) => {
        const cleanCode = code.trim();
        const cleanName = name.trim();
        if (!cleanCode || !cleanName) return;
        set((s) => {
          const idx = s.customSeccionales.findIndex((x) => x.code === cleanCode);
          let updated: CatalogItem[];
          if (idx >= 0) {
            updated = [...s.customSeccionales];
            updated[idx] = { code: cleanCode, name: cleanName, isCustom: true };
          } else {
            updated = [...s.customSeccionales, { code: cleanCode, name: cleanName, isCustom: true }].sort((a, b) =>
              a.code.localeCompare(b.code, undefined, { numeric: true }),
            );
          }
          return { customSeccionales: updated };
        });
      },

      deleteSeccional: (code) => {
        set((s) => ({
          customSeccionales: s.customSeccionales.filter((x) => x.code !== code),
        }));
      },

      resetSeccionales: () => {
        set({ customSeccionales: DEFAULT_SECCIONALES });
      },

      addOrUpdateCiiu: (code, name) => {
        const cleanCode = code.trim();
        const cleanName = name.trim();
        if (!cleanCode || !cleanName) return;
        set((s) => {
          const idx = s.customCiiu.findIndex((x) => x.code === cleanCode);
          let updated: CatalogItem[];
          if (idx >= 0) {
            updated = [...s.customCiiu];
            updated[idx] = { code: cleanCode, name: cleanName, isCustom: true };
          } else {
            updated = [...s.customCiiu, { code: cleanCode, name: cleanName, isCustom: true }].sort((a, b) =>
              a.code.localeCompare(b.code, undefined, { numeric: true }),
            );
          }
          return { customCiiu: updated };
        });
      },

      deleteCiiu: (code) => {
        set((s) => ({
          customCiiu: s.customCiiu.filter((x) => x.code !== code),
        }));
      },

      resetCiiu: () => {
        set({ customCiiu: DEFAULT_CIIU_COMMON });
      },
    }),
    {
      name: "cedulario-ag-2025",
      storage: safeStorage,
      partialize: (s) => ({
        declaration: s.declaration,
        docs: s.docs.map(({ dataUrl: _d, ...rest }) => rest),
        normas: s.normas,
        aiSettings: s.aiSettings,
        profiles: s.profiles.map((p) => ({
          ...p,
          docs: (p.docs || []).map(({ dataUrl: _d, ...rest }) => rest),
        })),
        activeProfileId: s.activeProfileId,
        customSeccionales: s.customSeccionales,
        customCiiu: s.customCiiu,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        const decl = hydrateDeclaration((p?.declaration ?? current.declaration) as Declaration);
        const docs = Array.isArray(p?.docs) ? p.docs : current.docs;
        const normas = hydrateNormas(p?.normas);
        const localKey = typeof window !== "undefined" ? localStorage.getItem("tributoapp_gemini_api_key") : null;
        const localModel = typeof window !== "undefined" ? localStorage.getItem("tributoapp_gemini_model") : null;
        const aiSettings = {
          geminiApiKey: localKey || p?.aiSettings?.geminiApiKey || current.aiSettings.geminiApiKey || "",
          geminiModel: (localModel as any) || p?.aiSettings?.geminiModel || current.aiSettings.geminiModel || "gemini-2.0-flash",
        };
        const profiles = Array.isArray(p?.profiles)
          ? p.profiles.map((prof) => ({
              ...prof,
              declaration: hydrateDeclaration(prof.declaration),
              docs: Array.isArray(prof.docs) ? prof.docs : [],
              normas: hydrateNormas(prof.normas),
            }))
          : [];

        const customSeccionales =
          Array.isArray(p?.customSeccionales) && p.customSeccionales.length > 0
            ? p.customSeccionales
            : DEFAULT_SECCIONALES;
        const customCiiu =
          Array.isArray(p?.customCiiu) && p.customCiiu.length > 0
            ? p.customCiiu
            : DEFAULT_CIIU_COMMON;

        return {
          ...current,
          ...p,
          declaration: decl,
          docs,
          normas,
          aiSettings,
          profiles,
          activeProfileId: p?.activeProfileId || DEFAULT_PROFILE_ID,
          customSeccionales,
          customCiiu,
        };
      },
    },
  ),
);

// Sincronización automática no volátil con IndexedDB (Base de Datos Local Permanente)
if (typeof window !== "undefined") {
  useAppStore.subscribe((state) => {
    saveSnapshotToIdb("declarapro_backup_state", {
      declaration: state.declaration,
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      docs: state.docs,
      normas: state.normas,
    });
  });

  // Si localStorage estaba vacío pero hay respaldo en IndexedDB, restaurar automáticamente
  setTimeout(() => {
    const s = useAppStore.getState();
    if (s.profiles.length === 0 && (!s.declaration.identity.nit || s.declaration.identity.nit === "Sin NIT")) {
      useAppStore.getState().restoreFromIdb();
    }
  }, 100);
}

export function useComputed(): ComputedDeclaration {
  const declaration = useAppStore((s) => s.declaration);
  return compute(hydrateDeclaration(declaration));
}

export function applyPathAmounts(d: Declaration, amounts: Record<string, number>) {
  for (const [path, value] of Object.entries(amounts)) {
    if (!Number.isFinite(value) || value <= 0) continue;
    const parts = path.split(".");
    let cur: Record<string, unknown> = d as unknown as Record<string, unknown>;
    let ok = true;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!cur[key] || typeof cur[key] !== "object") {
        ok = false;
        break;
      }
      cur = cur[key] as Record<string, unknown>;
    }
    if (ok) {
      const last = parts[parts.length - 1];
      cur[last] = value;
    }
  }
}

export function exampleDeclaration(): Declaration {
  const d = emptyDeclaration(2025);
  d.identity = {
    ...d.identity,
    nit: "72123456",
    dv: "8",
    primerApellido: "García",
    segundoApellido: "López",
    primerNombre: "Ana",
    otrosNombres: "María",
    dirSeccional: "03",
    actividadCiiu: "0010",
    aniosDeclarando: 3,
    responsableIva: false,
    residente: true,
  };
  d.topes = {
    ingresosBrutos: 92400000,
    patrimonioBruto: 268000000,
    consumosTarjeta: 18400000,
    compras: 22100000,
    consignaciones: 96800000,
  };
  d.patrimonio = {
    ...d.patrimonio,
    efectivo: 1200000,
    cuentas: 18500000,
    inversiones: 8000000,
    inmuebles: 220000000,
    vehiculos: 18500000,
    muebles: 2500000,
    viviendaHabitacion: 220000000,
    obligacionesFinancieras: 92000000,
    patrimonioLiquidoAnterior: 158000000,
  };
  d.trabajo = {
    ...d.trabajo,
    salarios: 78000000,
    cesantiasPagadas: 6500000,
    otrasPrestaciones: 7900000,
    promedioMensual6m: 6500000,
    aportesPensionObligatorios: 3120000,
    aportesSaludObligatorios: 3120000,
    aportesAfcFvpAvc: 2400000,
    interesesVivienda: 7800000,
    medicinaPrepagada: 2100000,
    gmf: 420000,
    dependientes: 1,
    comprasFacturaElectronica: 8500000,
  };
  d.capital = {
    ...d.capital,
    intereses: 980000,
    componenteInflacionario: 210000,
  };
  d.extra = {
    ...d.extra,
    retenciones: 2850000,
    impuestoNetoAnterior: 2100000,
    anticipoAnterior: 0,
  };
  return d;
}

export function andresBernalDeclaration(): Declaration {
  const d = emptyDeclaration(2025);
  d.identity = {
    ...d.identity,
    nit: "1001880133",
    dv: "7",
    primerApellido: "BERNAL",
    segundoApellido: "OSORIO",
    primerNombre: "ANDRES",
    otrosNombres: "FELIPE",
    dirSeccional: "32",
    actividadCiiu: "0010",
    aniosDeclarando: 2,
    responsableIva: false,
    residente: true,
  };
  d.topes = {
    ...d.topes,
    ingresosBrutos: 27331800,
  };
  d.trabajo = {
    ...d.trabajo,
    salarios: 27331800,
    aportesPensionObligatorios: 1093272,
    aportesSaludObligatorios: 1093272,
  };
  return d;
}

