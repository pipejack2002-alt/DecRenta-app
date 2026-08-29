import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Sparkles, X, CheckCircle2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { NAV } from "@/lib/catalogs";
import { useAppStore, useComputed } from "@/lib/store";
import { formatCOP } from "@/lib/tax/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { GeminiAsistenteModal } from "@/components/layout/gemini-asistente-modal";
import { ClientSwitcher } from "@/components/layout/client-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const computed = useComputed();
  const year = useAppStore((s) => s.declaration.year);
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [open, setOpen] = useState(false);
  const [asistenteOpen, setAsistenteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Atajos de teclado globales (Ctrl+K: Asistente IA, Ctrl+S: Guardar, Ctrl+B: Colapsar Menú)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAsistenteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2200);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Saltar al contenido principal
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-sm print:hidden no-print" data-print-hide>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2 hover:opacity-95 transition-opacity">
              <Logo size="md" />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center size-8 rounded-lg border border-line bg-surface hover:bg-forest-mist hover:text-forest text-muted transition-colors shadow-2xs"
              title={sidebarCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral (ganar espacio)"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
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
              variant="outline"
              size="sm"
              onClick={() => setAsistenteOpen(true)}
              className="gap-1.5 border-forest/30 bg-forest-mist/50 text-forest hover:bg-forest-mist"
              title="Abrir Asistente IA Google Gemini (Ctrl + K)"
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

      <div className={cn("mx-auto flex gap-6 px-4 py-6 print:m-0 print:p-0 print:block print:max-w-none transition-all duration-200", pathname.startsWith("/declaracion") ? "max-w-[98vw] 2xl:max-w-[1800px] px-2 sm:px-6" : "max-w-7xl")}>
        <aside
          data-print-hide
          className={cn(
            "z-30 flex-col print:hidden no-print transition-all duration-200",
            open
              ? "fixed inset-0 flex bg-bg p-6 pt-20"
              : sidebarCollapsed
                ? "hidden lg:static lg:flex lg:w-16 lg:shrink-0 lg:bg-transparent lg:p-0"
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
                  title={sidebarCollapsed ? `${item.label}: ${item.hint}` : undefined}
                  className={cn(
                    "rounded-md transition-colors duration-150",
                    sidebarCollapsed ? "px-2 py-3 text-center flex flex-col items-center justify-center font-bold text-xs" : "px-3 py-2.5",
                    active ? "bg-forest text-primary-fg shadow-xs" : "text-ink-soft hover:bg-forest-mist hover:text-forest-deep",
                  )}
                >
                  <span className="block truncate w-full text-center sm:text-left">{sidebarCollapsed ? item.label.slice(0, 4) : item.label}</span>
                  {!sidebarCollapsed && (
                    <span className={cn("block text-[11px]", active ? "text-primary-fg/70" : "text-faint")}>
                      {item.hint}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          {!sidebarCollapsed && (
            <p className="mt-8 hidden text-[11px] leading-relaxed text-faint lg:block print:hidden no-print" data-print-hide>
              Orientación con base en fuentes oficiales. No sustituye el SI de Diligenciamiento de la DIAN ni a un contador público.
            </p>
          )}
        </aside>
        <main id="contenido" className="min-w-0 flex-1 pb-16 print:p-0 print:m-0 print:w-full print:max-w-none">
          {activeProfile?.status === "presentado" && (
            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/90 px-4 py-2.5 text-xs text-purple-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-purple-200 text-purple-800 shrink-0 font-bold">
                  🔒
                </span>
                <span>
                  <strong>Declaración Radicada Oficialmente en la DIAN</strong> · Este expediente se encuentra en estado presentado.
                </span>
              </div>
              <Link
                to="/clientes"
                className="text-purple-800 font-semibold underline-offset-2 hover:underline text-[11px] shrink-0"
              >
                Gestionar en Portafolio →
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>

      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-forest px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 border border-forest-light">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span>Declaración guardada localmente con éxito (Ctrl + S)</span>
        </div>
      )}
    </div>
  );
}
