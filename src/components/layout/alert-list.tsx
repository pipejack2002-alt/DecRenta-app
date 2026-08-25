import { Badge } from "@/components/ui/badge";
import type { TaxAlert } from "@/lib/tax/types";
import { cn } from "@/lib/utils";

export function AlertList({ alerts, compact }: { alerts: TaxAlert[]; compact?: boolean }) {
  if (!alerts.length) {
    return (
      <p className="text-sm text-muted">
        Sin alertas por ahora. A medida que llene casillas, Cedulario le dirá por qué un tope aplica o no.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li
          key={a.id}
          className={cn(
            "rounded-lg border px-3 py-3",
            a.level === "ok" && "border-ok/20 bg-ok-mist",
            a.level === "warn" && "border-warn/20 bg-warn-mist",
            a.level === "block" && "border-stamp/25 bg-stamp-mist",
            a.level === "info" && "border-line bg-bg-raised",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                a.level === "ok"
                  ? "ok"
                  : a.level === "warn"
                    ? "warn"
                    : a.level === "block"
                      ? "stamp"
                      : "forest"
              }
            >
              {a.level === "ok" ? "Procede" : a.level === "warn" ? "Tope / requisito" : a.level === "block" ? "No procede" : "Nota"}
            </Badge>
            <p className="font-medium text-sm">{a.title}</p>
          </div>
          {compact ? null : <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{a.detail}</p>}
          <p className="mt-1 text-[11px] text-faint">{a.source}</p>
        </li>
      ))}
    </ul>
  );
}
