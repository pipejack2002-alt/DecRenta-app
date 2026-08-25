import React from "react";

export function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  // 1. Limpieza de bloques de LaTeX multilínea o fórmulas ($$ ... $$)
  // ¡IMPORTANTE!: NO reemplazar '$' individuales porque en Colombia '$' es el signo de pesos ($ 49.799).
  let clean = content
    .replace(/\$\$\\text\{([^}]+)\}\s*=\s*\\text\{([^}]+)\}\s*-\s*\\text\{([^}]+)\}\$\$/g, "🔹 $1 = $2 − $3")
    .replace(/\$\$([^$]+)\$\$/g, (_, math) => cleanLatex(math))
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\\$/g, "$");

  const lines = clean.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let isOrderedList = false;

  function flushList() {
    if (listItems.length > 0) {
      if (isOrderedList) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-5 list-decimal text-xs text-ink/90 leading-relaxed">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-4 list-disc marker:text-forest text-xs text-ink/90 leading-relaxed">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Separador horizontal
    if (line === "---" || line === "***" || line === "___") {
      flushList();
      elements.push(<hr key={`hr-${idx}`} className="my-3 border-line/70" />);
      return;
    }

    // Encabezados
    if (line.startsWith("#### ")) {
      flushList();
      elements.push(
        <h5 key={`h5-${idx}`} className="mt-3.5 mb-1 text-xs font-bold uppercase tracking-wider text-forest">
          {renderInline(line.replace(/^####\s+/, "").replace(/^\*\*|\*\*$/g, ""))}
        </h5>
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="mt-4 mb-1.5 text-xs font-bold uppercase tracking-wider text-ink border-b border-line/60 pb-1">
          {renderInline(line.replace(/^###\s+/, "").replace(/^\*\*|\*\*$/g, ""))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="mt-4 mb-1.5 text-sm font-bold text-ink">
          {renderInline(line.replace(/^##\s+/, "").replace(/^\*\*|\*\*$/g, ""))}
        </h3>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${idx}`} className="mt-4 mb-2 text-base font-bold text-ink">
          {renderInline(line.replace(/^#\s+/, "").replace(/^\*\*|\*\*$/g, ""))}
        </h2>
      );
      return;
    }

    // Listas ordenadas (1. , 2. )
    const matchOrdered = line.match(/^(\d+)\.\s+(.+)$/);
    if (matchOrdered) {
      if (inList && !isOrderedList) flushList();
      inList = true;
      isOrderedList = true;
      listItems.push(
        <li key={`li-ord-${idx}`} className="pl-1">
          {renderInline(matchOrdered[2])}
        </li>
      );
      return;
    }

    // Listas no ordenadas (* , - )
    const matchUnordered = line.match(/^[\*\-•]\s+(.+)$/);
    if (matchUnordered) {
      if (inList && isOrderedList) flushList();
      inList = true;
      isOrderedList = false;
      listItems.push(
        <li key={`li-unord-${idx}`} className="pl-1">
          {renderInline(matchUnordered[1])}
        </li>
      );
      return;
    }

    // Bloque de fórmula destacada
    if (line.startsWith("🔹 ") || line.startsWith("Formula:") || line.startsWith("Fórmula:")) {
      flushList();
      elements.push(
        <div key={`formula-${idx}`} className="my-2.5 rounded-xl border border-forest/30 bg-forest-mist/30 px-3.5 py-2.5 font-medium text-xs text-forest-deep shadow-sm">
          {renderInline(line)}
        </div>
      );
      return;
    }

    // Párrafo estándar
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="my-1.5 text-xs leading-relaxed text-ink/90">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function cleanLatex(math: string): string {
  return math
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\ge/g, "≥")
    .replace(/\\le/g, "≤")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "$")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .trim();
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex para capturar **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const fullMatch = match[0];
    if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-ink">
          {match[2]}
        </strong>
      );
    } else if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
      parts.push(
        <code key={`c-${keyIdx++}`} className="rounded bg-bg/80 border border-line px-1.5 py-0.5 font-mono text-[11px] text-forest font-semibold">
          {match[4]}
        </code>
      );
    } else if (fullMatch.startsWith("[") && fullMatch.includes("](")) {
      parts.push(
        <a
          key={`a-${keyIdx++}`}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest font-semibold underline hover:text-forest-deep"
        >
          {match[5]}
        </a>
      );
    } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic text-ink-soft">
          {match[3]}
        </em>
      );
    } else {
      parts.push(fullMatch);
    }

    remaining = remaining.substring(match.index + fullMatch.length);
  }

  return <>{parts}</>;
}
