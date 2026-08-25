import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ARTICLES, SOURCE_META, type LegalSource } from "@/lib/legal/articles";
import { ET_INDEX, ET_OFFICIAL, searchEt, senadoArt, type EtRelevance } from "@/lib/legal/estatuto-index";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHint } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const FILTERS: { id: LegalSource | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "ET", label: "Estatuto" },
  { id: "DUR", label: "DUR 1625" },
  { id: "CP", label: "Constitución" },
  { id: "CCO", label: "Comercio" },
  { id: "LEY", label: "Leyes" },
  { id: "RES", label: "Resoluciones" },
  { id: "CAN", label: "CAN" },
  { id: "DIAN", label: "DIAN" },
];

function BibliotecaPage() {
  const [view, setView] = useState<"et" | "corpus">("et");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<LegalSource | "ALL">("ALL");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      if (src !== "ALL" && a.source !== src) return false;
      if (!s) return true;
      const blob = `${a.citation} ${a.title} ${a.summary} ${a.text} ${a.tags.join(" ")}`.toLowerCase();
      return s.split(/\s+/).every((w) => blob.includes(w));
    });
  }, [q, src]);

  const et = useMemo(() => searchEt(q), [q]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Marco Legal · DIAN & Congreso de la República</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Estatuto Tributario y Normativa</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Compendio legal para la liquidación del impuesto sobre la renta (Decreto 624 de 1989, DUR 1625 de 2016 y Ley 2277 de 2022). Incluye el articulado del Formulario 210 y enlaces directos a las fuentes oficiales de la Secretaría del Senado y la DIAN.
        </p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setView("et")}
          className={cn(
            "h-11 shrink-0 rounded-full px-4 text-sm",
            view === "et" ? "bg-forest text-primary-fg" : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)]",
          )}
        >
          Índice E.T.
        </button>
        <button
          type="button"
          onClick={() => setView("corpus")}
          className={cn(
            "h-11 shrink-0 rounded-full px-4 text-sm",
            view === "corpus" ? "bg-forest text-primary-fg" : "bg-surface text-ink-soft shadow-[0_0_0_1px_var(--color-line)]",
          )}
        >
          Corpus 210
        </button>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={view === "et" ? "Artículo 336, vivienda, firmeza…" : "Buscar: 336, cesantías, UVT, dependientes…"}
      />

      {view === "et" ? (
        <EtIndex q={q} chapters={et.chapters} arts={et.arts} />
      ) : (
        <CorpusView q={q} src={src} setSrc={setSrc} list={list} />
      )}
    </div>
  );
}

function EtIndex({
  q,
  chapters,
  arts,
}: {
  q: string;
  chapters: typeof ET_INDEX;
  arts: ReturnType<typeof searchEt>["arts"];
}) {
  const tone: Record<EtRelevance, "stamp" | "warn" | "forest"> = {
    alta: "stamp",
    media: "warn",
    baja: "forest",
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Secretaría del Senado", ET_OFFICIAL.senado],
            ["Función Pública", ET_OFFICIAL.funcionPublica],
            ["Normograma DIAN", ET_OFFICIAL.dianNormograma],
          ] as const
        ).map(([label, href]) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line bg-surface px-4 py-3 text-sm hover:border-forest/30"
          >
            <span className="font-medium">{label}</span>
            <span className="mt-1 block break-all text-xs text-faint">{href}</span>
          </a>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Libros y títulos</h2>
        <ul className="space-y-2">
          {chapters.map((c) => (
            <li key={c.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone[c.relevance]}>{c.relevance}</Badge>
                  <a
                    href={senadoArt(c.from)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-forest underline"
                  >
                    arts. {c.from}–{c.to}
                  </a>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">{c.libro}</p>
                <p className="font-display text-xl">{c.titulo}</p>
                <CardHint>{c.for210}</CardHint>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Artículos ancla del 210</h2>
        <p className="text-sm text-muted">
          {q.trim() ? `${arts.length} coincidencias.` : `${arts.length} artículos indexados con nota operativa. Pulse el número para abrir el Senado.`}
        </p>
        <ul className="space-y-2">
          {arts.map((a) => (
            <li key={a.n}>
              <a href={senadoArt(a.n)} target="_blank" rel="noreferrer" className="block">
                <Card className="p-4 transition-[transform] duration-150 hover:-translate-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="forest">Art. {a.n}</Badge>
                    <Badge tone={tone[a.relevance]}>{a.relevance}</Badge>
                  </div>
                  <p className="mt-2 font-medium">{a.title}</p>
                  <CardHint>{a.for210}</CardHint>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-faint">
        Este índice no es el articulado verbatim. El texto vigente se lee en {ET_OFFICIAL.senado}
      </p>
    </div>
  );
}

function CorpusView({
  q,
  src,
  setSrc,
  list,
}: {
  q: string;
  src: LegalSource | "ALL";
  setSrc: (s: LegalSource | "ALL") => void;
  list: typeof ARTICLES;
}) {
  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSrc(f.id)}
            className={
              src === f.id
                ? "h-10 shrink-0 rounded-full bg-forest px-3 text-sm text-primary-fg"
                : "h-10 shrink-0 rounded-full bg-surface px-3 text-sm text-ink-soft shadow-[0_0_0_1px_var(--color-line)]"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(SOURCE_META) as LegalSource[]).map((k) => (
          <a
            key={k}
            href={SOURCE_META[k].official}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line bg-surface px-4 py-3 text-sm hover:border-forest/30"
          >
            <span className="font-medium">{SOURCE_META[k].label}</span>
            <span className="mt-1 block break-all text-xs text-faint">{SOURCE_META[k].official}</span>
          </a>
        ))}
      </div>

      <ul className="space-y-3">
        {list.map((a) => (
          <li key={a.id}>
            <Link to="/biblioteca/$id" params={{ id: a.id }} className="block">
              <Card className="transition-[transform] duration-150 hover:-translate-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="forest">{a.citation}</Badge>
                  {a.casillas?.slice(0, 3).map((c) => (
                    <Badge key={c} tone="neutral">
                      cas. {c}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 font-display text-xl">{a.title}</p>
                <CardHint>{a.summary}</CardHint>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint">
        {list.length} piezas del corpus operativo del 210{q ? ` · filtro «${q}»` : ""}. No es el Estatuto completo.
      </p>
    </>
  );
}
