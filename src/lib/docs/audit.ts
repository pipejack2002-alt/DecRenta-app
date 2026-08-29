import { DOC_CATALOG, type DocKind, type VaultDoc } from "./types.ts";
import { providerAsks } from "./proveedores.ts";
import type { ComputedDeclaration, Declaration, TaxAlert } from "@/lib/tax/types.ts";

export type Finding = {
  id: string;
  level: TaxAlert["level"];
  title: string;
  detail: string;
  source: string;
  askFrom?: string;
  docKind?: DocKind;
};

function has(docs: VaultDoc[], kind: DocKind) {
  return docs.some((d) => d.kind === kind);
}

export function auditExpediente(d: Declaration, c: ComputedDeclaration, docs: VaultDoc[]): Finding[] {
  const out: Finding[] = [];
  const t = d.trabajo;
  const h = d.honorarios;
  const p = d.patrimonio;

  for (const a of c.alerts) {
    out.push({
      id: `eng-${a.id}`,
      level: a.level,
      title: a.title,
      detail: a.detail,
      source: a.source,
    });
  }

  const asks = providerAsks(d, c, docs);
  for (const ask of asks) {
    if (!ask.needed) continue;
    for (const kind of ask.missing) {
      const meta = DOC_CATALOG.find((x) => x.kind === kind);
      const spec = ask.documents.find((x) => x.kind === kind);
      out.push({
        id: `miss-${ask.id}-${kind}`,
        level: kind === "formato220" || kind === "rut" || kind === "certGmf" ? "warn" : "info",
        title: `Falta: ${spec?.what ?? meta?.label ?? kind}`,
        detail: `${spec?.why ?? meta?.help ?? ""} Pídaselo a: ${ask.provider}.`,
        source: spec?.article ?? meta?.source ?? "",
        askFrom: ask.provider,
        docKind: kind,
      });
    }
  }

  if (t.dependientes > 0 && !has(docs, "certDependientes")) {
    out.push({
      id: "dep-soporte",
      level: "warn",
      title: "Dependientes sin soporte en el expediente",
      detail: `Declaró ${t.dependientes} dependiente(s). Conserve: registro civil o documento de identidad; certificado de estudio si tiene 18-23 años; certificado de Medicina Legal o de un médico si hay dependencia física/psicológica; certificación de contador si el cónyuge/padre/hermano no tiene ingresos o tiene ingresos menores a 260 UVT. Un mismo dependiente no se duplica (DUR 1.2.1.20.3).`,
      source: "Art. 387 E.T. · art. 1.2.1.20.3 DUR 1625/2016",
      askFrom: "Cliente / Notaría / Institución Educativa",
      docKind: "certDependientes",
    });
  }

  if (t.medicinaPrepagada > 0 && !has(docs, "medicinaPrepagada")) {
    out.push({
      id: "prep-soporte",
      level: "warn",
      title: "Medicina prepagada sin certificado en el expediente",
      detail: "Declaró deducción de medicina prepagada o seguros de salud. Solicite el certificado a la entidad vigilada para soportar hasta 16 UVT mensuales.",
      source: "Art. 387 E.T.",
      askFrom: "Compañía de medicina prepagada / seguros de salud",
      docKind: "medicinaPrepagada",
    });
  }

  if (t.interesesVivienda > 0 && !has(docs, "interesesHipoteca")) {
    out.push({
      id: "hip-soporte",
      level: "warn",
      title: "Intereses de crédito hipotecario sin certificado en el expediente",
      detail: "Declaró deducción de intereses de crédito de vivienda o leasing habitacional. Descargue el certificado tributario de la entidad financiera.",
      source: "Art. 119 E.T.",
      askFrom: "Banco / Entidad financiera acreedora",
      docKind: "interesesHipoteca",
    });
  }

  if (h.usarCostos && h.costos > 0 && !has(docs, "facturaElectronica")) {
    out.push({
      id: "costos-sin-fe",
      level: "warn",
      title: "Costos de honorarios sin factura electrónica",
      detail: "Los costos y gastos de la casilla 45 deben estar soportados con factura electrónica, nómina electrónica o documento equivalente (arts. 107 y 771-2). Si superan el 60 %, además se marca la casilla 140.",
      source: "Arts. 107, 336-1 y 771-2 E.T.",
      askFrom: "Proveedor (factura electrónica de compra)",
      docKind: "facturaElectronica",
    });
  }

  if (t.comprasFacturaElectronica > 0 && !has(docs, "facturaElectronica")) {
    out.push({
      id: "fe-sin-archivo",
      level: "warn",
      title: "1 % de factura electrónica sin las facturas en el expediente",
      detail: "La DIAN puede pedir el CUFE, el medio de pago electrónico y que la compra no se haya tomado como costo, IVA descontable u otro beneficio. Suba las facturas o péguelas.",
      source: "Num. 5 art. 336 E.T.",
      askFrom: "Proveedor (factura electrónica de compra)",
      docKind: "facturaElectronica",
    });
  }

  if (p.inmuebles > 0 && p.viviendaHabitacion > p.inmuebles) {
    out.push({
      id: "viv-mayor",
      level: "block",
      title: "La vivienda de habitación supera el total de inmuebles",
      detail: "El valor de la casa de habitación no puede ser mayor que el total de inmuebles de la casilla 29. Corrija patrimonio.",
      source: "Arts. 261, 72 y 277 E.T.",
    });
  }

  if (!d.identity.nit || d.identity.nit.length < 5) {
    out.push({
      id: "sin-nit",
      level: "warn",
      title: "Falta la cédula / NIT",
      detail: "Sin NIT no hay vencimiento del calendario ni coincidencia con el RUT. Digítelo en Identificación.",
      source: "Art. 555-2 E.T. · RUT",
    });
  }

  if (d.identity.llevaLibros === false && (c.casillas[30] ?? 0) > 0 && !has(docs, "certTradicion") && !has(docs, "extractoBanco")) {
    out.push({
      id: "pasivo-fecha",
      level: "warn",
      title: "Pasivos de quien no lleva libros",
      detail: "Los no obligados a llevar contabilidad solo pueden solicitar deudas respaldadas en documentos de fecha cierta (art. 283). Hipoteca en el certificado de tradición, pagaré con reconocimiento de firma, o extracto de obligación financiera.",
      source: "Art. 283 E.T. · arts. 767 y 770 E.T. · arts. 48-61 C. Co.",
      askFrom: "Banco / notaría",
    });
  }

  for (const doc of docs) {
    if (!doc.extracted) continue;
    for (const [path, value] of Object.entries(doc.extracted)) {
      if (typeof value !== "number" || value <= 0) continue;
      const current = getPath(d, path);
      if (typeof current === "number" && current > 0 && Math.abs(current - value) > Math.max(1000, value * 0.02)) {
        out.push({
          id: `diff-${doc.id}-${path}`,
          level: "info",
          title: `El ${doc.name} no cuadra con la declaración`,
          detail: `${path}: el soporte trae ${value.toLocaleString("es-CO")} y en la declaración hay ${current.toLocaleString("es-CO")}. Revise cuál es el valor fiscal (a veces el certificado trae base de retención, no el ingreso).`,
          source: DOC_CATALOG.find((x) => x.kind === doc.kind)?.source ?? "Soporte vs. casilla",
          docKind: doc.kind,
        });
      }
    }
  }

  const order: Record<Finding["level"], number> = { block: 0, warn: 1, info: 2, ok: 3 };
  out.sort((a, b) => order[a.level] - order[b.level]);
  return out;
}

function getPath(d: Declaration, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = d;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function findingsSummary(findings: Finding[]) {
  return {
    block: findings.filter((f) => f.level === "block").length,
    warn: findings.filter((f) => f.level === "warn").length,
    info: findings.filter((f) => f.level === "info").length,
    total: findings.length,
  };
}
