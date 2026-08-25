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

type AppState = {
  declaration: Declaration;
  docs: VaultDoc[];
  normas: IngestedNorm[];
  aiSettings: AiSettings;
  setYear: (year: TaxYear) => void;
  setUvtOverride: (year: number, value: number | null) => void;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  patch: (fn: (d: Declaration) => void) => void;
  reset: () => void;
  loadExample: () => void;
  addDoc: (doc: VaultDoc) => void;
  updateDoc: (id: string, patch: Partial<VaultDoc>) => void;
  removeDoc: (id: string) => void;
  addNorma: (n: IngestedNorm) => { ok: true } | { ok: false; error: string };
  removeNorma: (id: string) => void;
  applyAmounts: (amounts: Record<string, number>) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      declaration: emptyDeclaration(2025),
      docs: [],
      normas: [],
      aiSettings: {
        geminiApiKey: "",
        geminiModel: "gemini-3.6-flash",
      },
      setYear: (year) =>
        set((s) => ({ declaration: { ...s.declaration, year } })),
      setUvtOverride: (year, value) =>
        set((s) => {
          const next: UvtOverrides = { ...normalizeOverrides(s.declaration.uvtOverrides) };
          if (value == null || value <= 0) delete next[year];
          else next[year] = Math.round(value);
          return { declaration: { ...s.declaration, uvtOverrides: next } };
        }),
      setAiSettings: (settings) =>
        set((s) => ({ aiSettings: { ...s.aiSettings, ...settings } })),
      patch: (fn) =>
        set((s) => {
          const next = structuredClone(hydrateDeclaration(s.declaration));
          fn(next);
          return { declaration: next };
        }),
      reset: () => set({ declaration: emptyDeclaration(2025) }),
      loadExample: () => set({ declaration: exampleDeclaration() }),
      addDoc: (doc) => set((s) => ({ docs: [doc, ...s.docs] })),
      updateDoc: (id, patch) =>
        set((s) => ({
          docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      removeDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
      addNorma: (n) => {
        let result: { ok: true } | { ok: false; error: string } = { ok: true };
        set((s) => {
          if (s.normas.length >= MAX_NORMAS) {
            result = { ok: false, error: `Tope de ${MAX_NORMAS} normas en este navegador.` };
            return s;
          }
          const next: IngestedNorm = {
            ...n,
            text: n.text.slice(0, MAX_NORMA_CHARS),
            title: n.title.slice(0, 200),
            citation: n.citation.slice(0, 200),
          };
          return { normas: [next, ...s.normas] };
        });
        return result;
      },
      removeNorma: (id) => set((s) => ({ normas: s.normas.filter((x) => x.id !== id) })),
      applyAmounts: (amounts) =>
        set((s) => {
          const next = structuredClone(hydrateDeclaration(s.declaration));
          applyPathAmounts(next, amounts);
          return { declaration: next };
        }),
    }),
    {
      name: "cedulario-ag-2025",
      storage: safeStorage,
      partialize: (s) => ({
        declaration: s.declaration,
        docs: s.docs.map(({ dataUrl: _d, ...rest }) => rest),
        normas: s.normas,
        aiSettings: s.aiSettings,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        return {
          ...current,
          ...p,
          declaration: hydrateDeclaration((p?.declaration ?? current.declaration) as Declaration),
          docs: Array.isArray(p?.docs) ? p.docs : current.docs,
          normas: hydrateNormas(p?.normas),
          aiSettings: {
            geminiApiKey: p?.aiSettings?.geminiApiKey ?? current.aiSettings.geminiApiKey,
            geminiModel: p?.aiSettings?.geminiModel ?? current.aiSettings.geminiModel,
          },
        };
      },
    },
  ),
);

export function useComputed(): ComputedDeclaration {
  const declaration = useAppStore((s) => s.declaration);
  return compute(hydrateDeclaration(declaration));
}

function applyPathAmounts(d: Declaration, amounts: Record<string, number>) {
  for (const [path, value] of Object.entries(amounts)) {
    if (!Number.isFinite(value)) continue;
    const parts = path.split(".");
    let cur: Record<string, unknown> = d as unknown as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!cur[key] || typeof cur[key] !== "object") return;
      cur = cur[key] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (last in cur) cur[last] = value;
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
