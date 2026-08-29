import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ARTICLES, SOURCE_META, type LegalArticle, type LegalSource } from "@/lib/legal/articles";
import {
  ET_INDEX,
  ET_OFFICIAL,
  searchEt,
  estatutoCoArt,
  dianNormogramaArt,
  type EtArt,
  type EtChapter,
  type EtRelevance,
} from "@/lib/legal/estatuto-index";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GeminiAsistenteModal } from "@/components/layout/gemini-asistente-modal";
import {
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  X,
  Scale,
  ShieldCheck,
  Layers,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const FILTERS: { id: LegalSource | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "ET", label: "Estatuto Tributario" },
  { id: "DUR", label: "DUR 1625" },
  { id: "CP", label: "Constitución" },
  { id: "CCO", label: "Código de Comercio" },
  { id: "LEY", label: "Leyes (2277/2022)" },
  { id: "RES", label: "Resoluciones DIAN" },
  { id: "DIAN", label: "Doctrina DIAN" },
];

type SelectedArticleData = {
  citation: string;
  title: string;
  relevance?: EtRelevance;
  for210?: string;
  text?: string;
  summary?: string;
  source?: LegalSource;
  casillas?: number[];
  articleNumber?: number | string;
  url?: string;
};

function BibliotecaPage() {
  const [view, setView] = useState<"et" | "corpus">("et");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<LegalSource | "ALL">("ALL");

  // Estado del modal de detalle de artículo
  const [selectedArticle, setSelectedArticle] = useState<SelectedArticleData | null>(null);

  // Estado de Gemini
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiInitialText, setGeminiInitialText] = useState("");

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

  function handleOpenArticuloET(a: EtArt) {
    // Buscar si existe en el corpus detallado para enriquecer la vista
    const corpusMatch = ARTICLES.find(
      (item) => item.citation.toLowerCase().includes(`art. ${a.n} `) || item.citation.toLowerCase() === `art. ${a.n} e.t.`
    );

    setSelectedArticle({
      citation: `Art. ${a.n} E.T.`,
      title: a.title,
      relevance: a.relevance,
      for210: a.for210,
      text: corpusMatch?.text || undefined,
      summary: corpusMatch?.summary || a.for210,
      casillas: corpusMatch?.casillas || undefined,
      articleNumber: a.n,
      source: "ET",
      url: estatutoCoArt(a.n),
    });
  }

  function handleOpenCorpusArticle(a: LegalArticle) {
    const artNumMatch = a.citation.match(/\d+/);
    setSelectedArticle({
      citation: a.citation,
      title: a.title,
      text: a.text,
      summary: a.summary,
      source: a.source,
      casillas: a.casillas,
      articleNumber: artNumMatch ? artNumMatch[0] : undefined,
      url: a.url,
    });
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-forest text-primary-fg shadow-sm">
            <Scale className="size-4" />
          </span>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold">
            Marco Legal · DIAN & Congreso de la República
          </p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">Estatuto Tributario y Normativa</h1>
        <p className="max-w-3xl text-sm text-muted leading-relaxed">
          Compendio jurídico y normativo oficial para la liquidación del impuesto sobre la renta (Decreto 624 de 1989, DUR 1625 de 2016 y Ley 2277 de 2022). Consulte el articulado interactivo, las casillas que afecta en el Formulario 210 y acceda directamente al texto legal oficial.
        </p>
      </header>

      {/* Selector de Pestañas con Explicación Visual */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setView("et")}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer",
            view === "et"
              ? "border-forest bg-forest-mist/30 ring-1 ring-forest shadow-sm"
              : "border-line bg-surface hover:border-forest/40 hover:bg-forest-mist/10"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("flex size-6 items-center justify-center rounded-md text-xs font-bold", view === "et" ? "bg-forest text-primary-fg" : "bg-bg-raised text-muted")}>
              🏛️
            </span>
            <span className="font-bold text-sm text-ink">1. Índice General del E.T. (900+ Artículos)</span>
          </div>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Estructura completa del Estatuto Tributario por Libros y Capítulos, con artículos ancla y visor directo de cada norma oficial.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setView("corpus")}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer",
            view === "corpus"
              ? "border-forest bg-forest-mist/30 ring-1 ring-forest shadow-sm"
              : "border-line bg-surface hover:border-forest/40 hover:bg-forest-mist/10"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("flex size-6 items-center justify-center rounded-md text-xs font-bold", view === "corpus" ? "bg-forest text-primary-fg" : "bg-bg-raised text-muted")}>
              📋
            </span>
            <span className="font-bold text-sm text-ink">2. Corpus Operativo del Formulario 210</span>
          </div>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Compendio de artículos clave que alimentan directamente las casillas de personas naturales, con notas operativas y fórmulas.
          </p>
        </button>
      </div>

      {/* Buscador Rápido */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10 h-11 text-sm bg-surface border-line"
          placeholder={
            view === "et"
              ? "Buscar en el Estatuto: Art. 115, GMF, 336, 206, vivienda, firmeza, dependientes…"
              : "Buscar en el Corpus 210: 336, cesantías, UVT, retenciones, dependientes, 25%..."
          }
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink px-1.5 py-0.5 rounded bg-bg-raised"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido de la Vista Seleccionada */}
      {view === "et" ? (
        <EtIndex
          q={q}
          chapters={et.chapters}
          arts={et.arts}
          onSelectArticle={handleOpenArticuloET}
        />
      ) : (
        <CorpusView
          q={q}
          src={src}
          setSrc={setSrc}
          list={list}
          onSelectArticle={handleOpenCorpusArticle}
        />
      )}

      {/* Modal Interactivo de Detalle del Artículo */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onAskAi={(prompt) => {
            setGeminiInitialText(prompt);
            setGeminiModalOpen(true);
          }}
        />
      )}

      {/* Modal de Asistente Gemini */}
      <GeminiAsistenteModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        initialText={geminiInitialText}
      />
    </div>
  );
}

function EtIndex({
  q,
  chapters,
  arts,
  onSelectArticle,
}: {
  q: string;
  chapters: typeof ET_INDEX;
  arts: ReturnType<typeof searchEt>["arts"];
  onSelectArticle: (art: EtArt) => void;
}) {
  const tone: Record<EtRelevance, "stamp" | "warn" | "forest"> = {
    alta: "stamp",
    media: "warn",
    baja: "forest",
  };

  return (
    <div className="space-y-6">
      {/* Enlaces Rápidos a Fuentes Oficiales */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Estatuto.co (Directo)", href: ET_OFFICIAL.estatutoCo, desc: "Búsqueda y texto vigente con reformas" },
          { label: "Normograma DIAN", href: ET_OFFICIAL.dianNormograma, desc: "Doctrina oficial y concordancias DIAN" },
          { label: "Función Pública / Senado", href: ET_OFFICIAL.funcionPublica, desc: "Compilación oficial del Estado" },
        ].map((f) => (
          <a
            key={f.label}
            href={f.href}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-3.5 transition-all hover:border-forest/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink group-hover:text-forest">{f.label}</span>
                <ExternalLink className="size-3.5 text-muted group-hover:text-forest" />
              </div>
              <p className="mt-1 text-[11px] text-muted">{f.desc}</p>
            </div>
            <span className="mt-2 text-[10px] text-faint font-mono truncate">{f.href}</span>
          </a>
        ))}
      </div>

      {/* Artículos Ancla Más Consultados */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Artículos Ancla del Formulario 210 ({arts.length})
          </h2>
          <span className="text-xs text-muted">
            Haga clic en cualquier artículo para abrir su análisis interactivo
          </span>
        </div>

        {arts.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-xs text-muted">No se encontraron artículos que coincidan con «{q}».</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {arts.map((a) => (
              <button
                key={a.n}
                type="button"
                onClick={() => onSelectArticle(a)}
                className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:border-forest hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
                      Art. {a.n}
                    </span>
                    <Badge tone={tone[a.relevance]} className="text-[10px] uppercase font-semibold">
                      {a.relevance}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-forest leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-muted leading-relaxed line-clamp-3">
                    {a.for210}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-[11px] text-forest font-medium">
                  <span>Ver detalle y casillas</span>
                  <ExternalLink className="size-3 text-muted group-hover:text-forest" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Estructura Completa por Libros y Capítulos */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Estructura del Estatuto (Libros y Títulos)</h2>
          <span className="text-xs text-muted">{chapters.length} capítulos indexados</span>
        </div>

        <ul className="space-y-2.5">
          {chapters.map((c) => (
            <li key={c.id}>
              <Card className="p-4 border border-line hover:border-forest/30 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={tone[c.relevance]} className="text-[10px] uppercase font-semibold">
                      {c.relevance}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-forest">
                      Arts. {c.from} al {c.to}
                    </span>
                  </div>
                  <a
                    href={estatutoCoArt(c.from)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-forest hover:underline font-medium"
                  >
                    <span>Abrir en Estatuto.co</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">{c.libro}</p>
                <h3 className="font-display text-lg font-bold text-ink">{c.titulo}</h3>
                <CardHint className="mt-1 text-xs text-muted leading-relaxed">{c.for210}</CardHint>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CorpusView({
  q,
  src,
  setSrc,
  list,
  onSelectArticle,
}: {
  q: string;
  src: LegalSource | "ALL";
  setSrc: (s: LegalSource | "ALL") => void;
  list: typeof ARTICLES;
  onSelectArticle: (a: LegalArticle) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filtros por Fuente Legal */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSrc(f.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-xs font-medium transition-all cursor-pointer",
              src === f.id
                ? "bg-forest text-primary-fg shadow-sm"
                : "bg-surface text-ink-soft border border-line hover:border-forest/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Fichas del Corpus 210 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Fichas Normativas del Formulario 210 ({list.length})
          </h2>
          <span className="text-xs text-muted">
            Mapeo directo de artículos a casillas de la declaración
          </span>
        </div>

        {list.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-xs text-muted">No se encontraron artículos del corpus con ese criterio de búsqueda.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectArticle(a)}
                className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:border-forest hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="forest" className="text-xs font-bold">{a.citation}</Badge>
                    {a.casillas?.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="rounded bg-bg-raised px-1.5 py-0.5 text-[10px] font-mono font-medium text-ink-soft border border-line"
                      >
                        Casilla {c}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-ink group-hover:text-forest leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                    {a.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-forest font-medium">
                  <span>Ver articulado y análisis</span>
                  <ExternalLink className="size-3 text-muted group-hover:text-forest" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleDetailModal({
  article,
  onClose,
  onAskAi,
}: {
  article: SelectedArticleData;
  onClose: () => void;
  onAskAi: (prompt: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const directEstatutoUrl = article.articleNumber
    ? estatutoCoArt(article.articleNumber)
    : article.url || ET_OFFICIAL.estatutoCo;

  const directDianUrl = article.articleNumber
    ? dianNormogramaArt(article.articleNumber)
    : ET_OFFICIAL.dianNormograma;

  function copyCitation() {
    const textToCopy = `${article.citation}: ${article.title}\n\n${article.summary || ""}\n\n${article.text || ""}\n\nFuente: ${directEstatutoUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between border-b border-line bg-bg-raised p-5">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-forest text-primary-fg shadow-sm">
                {article.citation}
              </span>
              {article.relevance ? (
                <Badge tone={article.relevance === "alta" ? "stamp" : article.relevance === "media" ? "warn" : "forest"}>
                  Relevancia {article.relevance}
                </Badge>
              ) : null}
              {article.source ? (
                <Badge tone="forest">
                  {SOURCE_META[article.source]?.label || article.source}
                </Badge>
              ) : null}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
              {article.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Casillas Afectadas en el Formulario 210 */}
          {article.casillas && article.casillas.length > 0 && (
            <div className="rounded-xl border border-forest/30 bg-forest-mist/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-forest mb-2">
                Casillas que Alimenta en el Formulario 210:
              </p>
              <div className="flex flex-wrap gap-2">
                {article.casillas.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-ink border border-forest/30 shadow-xs font-mono"
                  >
                    ✓ Casilla {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resumen Práctico / Nota Operativa */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Impacto y Aplicación Práctica en la Declaración:
            </h3>
            <div className="rounded-xl bg-bg-raised p-4 border border-line text-sm text-ink-soft leading-relaxed">
              {article.for210 || article.summary || "Consulte el articulado oficial para la liquidación correspondiente."}
            </div>
          </div>

          {/* Texto del Articulado */}
          {article.text && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Texto del Articulado:
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-surface p-4 text-xs leading-relaxed text-ink font-mono border border-line shadow-inner">
                {article.text}
              </pre>
            </div>
          )}

          {/* Enlaces Directos Oficiales */}
          <div className="rounded-xl border border-line bg-bg-raised p-4 space-y-2">
            <p className="text-xs font-bold text-ink">Enlaces Oficiales Directos:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={directEstatutoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-bold text-primary-fg hover:bg-forest-deep shadow-sm"
              >
                <span>Abrir en Estatuto.co (Directo)</span>
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href={directDianUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink border border-line hover:border-forest/40"
              >
                <span>Normograma DIAN</span>
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href={ET_OFFICIAL.senado}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink border border-line hover:border-forest/40"
              >
                <span>Secretaría del Senado</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg-raised px-5 py-3.5">
          <Button
            size="sm"
            variant="outline"
            onClick={copyCitation}
            className="gap-1.5 text-xs"
          >
            {copied ? <Check className="size-3.5 text-forest" /> : <Copy className="size-3.5" />}
            {copied ? "Cita Copiada" : "Copiar Cita Jurídica"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onClose();
                onAskAi(`Por favor analiza el ${article.citation} (${article.title}) en el contexto de la declaración de renta 2025 del cliente actual.\n\nNota operativa: ${article.for210 || article.summary}`);
              }}
              className="gap-1.5 text-xs bg-forest hover:bg-forest-deep text-white"
            >
              <Sparkles className="size-3.5" />
              Consultar con Asistente IA
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
