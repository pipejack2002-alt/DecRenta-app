import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseMoney } from "@/lib/tax/format";
import { formatUvt } from "@/lib/tax/format";
import { uvtFromPesos } from "@/lib/tax/uvt";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MoneyField({
  label,
  hint,
  source,
  value,
  onChange,
  casilla,
  year = 2025,
  disabled,
}: {
  label: string;
  hint?: string;
  source?: string;
  value: number;
  onChange: (n: number) => void;
  casilla?: number;
  year?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const overrides = useAppStore((s) => s.declaration.uvtOverrides);
  const uvt = uvtFromPesos(value, year, overrides);
  return (
    <div className="space-y-1.5 min-w-0 w-full">
      <div className="flex items-start justify-between gap-2">
        <Label htmlFor={id} className="flex-1 min-w-0">{label}</Label>
        {casilla ? (
          <span className="font-mono text-[10px] font-bold text-forest bg-forest-mist px-1.5 py-0.5 rounded shrink-0 self-start">
            c.{casilla}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-medium">
          $
        </span>
        <Input
          id={id}
          inputMode="numeric"
          disabled={disabled}
          className="pl-7 pr-20 font-mono"
          value={value ? formatNumber(value) : ""}
          placeholder="0"
          onChange={(e) => onChange(parseMoney(e.target.value))}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums font-mono text-muted">
          {value ? formatUvt(uvt, 1) : ""}
        </span>
      </div>
      {hint ? <p className="text-xs leading-relaxed text-muted break-words">{hint}</p> : null}
      {source ? <p className="text-[11px] text-faint break-words font-medium">{source}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start justify-between gap-4 rounded-lg border px-3 py-3 text-left transition-colors duration-150",
        checked ? "border-forest/30 bg-forest-mist" : "border-line bg-surface",
      )}
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors",
          checked ? "bg-forest" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-surface shadow-sm transition-transform duration-150",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
