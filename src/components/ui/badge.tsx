import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "forest" | "ok" | "warn" | "stamp";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-bg-raised text-muted border-line",
    forest: "bg-forest-mist text-forest-deep border-forest/15",
    ok: "bg-ok-mist text-ok border-ok/20",
    warn: "bg-warn-mist text-warn border-warn/20",
    stamp: "bg-stamp-mist text-stamp border-stamp/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
