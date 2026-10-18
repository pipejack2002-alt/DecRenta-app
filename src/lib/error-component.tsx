import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink">
      <span className="text-stamp" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl">Algo salió mal</h1>
      <p className="max-w-md text-sm wrap-break-word text-muted">
        {error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Ocurrió un error inesperado. Recargue la página."}
      </p>
    </main>
  );
}
