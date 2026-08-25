import { createFileRoute, Link } from "@tanstack/react-router";
import { articleById, ARTICLES, SOURCE_META } from "@/lib/legal/articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/biblioteca/$id")({ component: ArticuloPage });

function ArticuloPage() {
  const { id } = Route.useParams();
  const a = articleById(id);
  if (!a) {
    return (
      <Card>
        <CardTitle>No está en el corpus</CardTitle>
        <CardHint>Vuelva a la biblioteca o ábralo en la fuente oficial.</CardHint>
        <Button asChild className="mt-4">
          <Link to="/biblioteca">Normativa</Link>
        </Button>
      </Card>
    );
  }
  const related = ARTICLES.filter((x) => x.id !== a.id && x.tags.some((t) => a.tags.includes(t))).slice(0, 5);
  return (
    <article className="space-y-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{SOURCE_META[a.source].label}</p>
      <h1 className="font-display text-4xl">{a.title}</h1>
      <div className="flex flex-wrap gap-2">
        <Badge tone="forest">{a.citation}</Badge>
        {a.casillas?.map((c) => (
          <Badge key={c}>casilla {c}</Badge>
        ))}
      </div>
      <Card>
        <p className="text-base leading-relaxed text-ink-soft">{a.text}</p>
      </Card>
      <p className="text-sm text-muted">{a.summary}</p>
      <p className="text-xs text-faint">
        Texto de trabajo compilado para orientar el Formulario 210. Contraste siempre con la norma vigente en:
      </p>
      <a className="text-sm text-forest underline" href={a.url} target="_blank" rel="noreferrer">
        {a.url}
      </a>
      {related.length ? (
        <section>
          <h2 className="font-display text-2xl">Relacionados</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link to="/biblioteca/$id" params={{ id: r.id }} className="text-sm text-forest hover:underline">
                  {r.citation} — {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
