import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink tabular-nums shadow-[inset_0_1px_0_rgba(28,36,31,0.03)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:border-forest/40 disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
