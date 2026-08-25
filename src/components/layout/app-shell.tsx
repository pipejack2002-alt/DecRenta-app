import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Menu, Sparkles, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { NAV } from "@/lib/catalogs";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GeminiAsistenteModal } from "@/components/layout/gemini-asistente-modal";
import { ClientSwitcher } from "@/components/layout/client-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const computed = useComputed();
  const year = useAppStore((s) => s.declaration.year);
  const [open, setOpen] = useState(false);
  const [asistenteOpen, setAsistenteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Saltar al contenido principal
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-forest text-primary-fg font-display font-bold text-lg">
                T
              </span>
              <span className="min-w-0 hidden sm:block">
                <span className="block font-display text-lg leading-none tracking-tight font-bold">
                  TributoApp
                </span>
                <span className="mt-0.5 block text-[11px] uppercase tracking-[0.16em] text-muted">
                  Renta 210 · AG {year}
                </span>
              </span>
            </Link>
            <ClientSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                {computed.saldoPagar > 0
                  ? "Saldo a pagar"
                  : computed.saldoFavor > 0
                    ? "Saldo a favor"
                    : "Impuesto a cargo"}
              </p>
              <p className="font-display text-lg tabular-nums leading-none">
                {formatCOP(computed.saldoPagar || computed.saldoFavor || computed.impuestoCargo)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setAsistenteOpen(true)}
              className="gap-1.5 bg-forest text-primary-fg hover:bg-forest-deep shadow-sm"
              title="Abrir Asistente IA Google Gemini"
            >
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">Asistente IA</span>
            </Button>
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
              >
                {open ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <GeminiAsistenteModal isOpen={asistenteOpen} onClose={() => setAsistenteOpen(false)} />

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside
          className={cn(
            "z-30 flex-col",
            open
              ? "fixed inset-0 flex bg-bg p-6 pt-20"
              : "hidden lg:static lg:flex lg:w-56 lg:shrink-0 lg:bg-transparent lg:p-0",
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 transition-colors duration-150",
                    active ? "bg-forest text-primary-fg" : "text-ink-soft hover:bg-forest-mist hover:text-forest-deep",
                  )}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className={cn("block text-[11px]", active ? "text-primary-fg/70" : "text-faint")}>
                    {item.hint}
                  </span>
                </Link>
              );
            })}
          </nav>
          <p className="mt-8 hidden text-[11px] leading-relaxed text-faint lg:block">
            Orientación con base en fuentes oficiales. No sustituye el SI de Diligenciamiento de la DIAN ni a un contador público.
          </p>
        </aside>
        <main id="contenido" className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
