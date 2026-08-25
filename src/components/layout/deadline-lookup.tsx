import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  deadlineForNit,
  daysUntil,
  isZonaSismo1226,
  SECCIONALES_DECRETO_1226_LABEL,
} from "@/lib/tax/calendar";
import { cn } from "@/lib/utils";

export function DeadlineLookup({ compact = false }: { compact?: boolean }) {
  const nit = useAppStore((s) => s.declaration.identity.nit);
  const seccional = useAppStore((s) => s.declaration.identity.dirSeccional);
  const zonaManual = useAppStore((s) => s.declaration.identity.zonaSismo1226);
  const patch = useAppStore((s) => s.patch);
  const zona = isZonaSismo1226(seccional, zonaManual);
  const hit = deadlineForNit(nit, { zonaSismo1226: zona, seccional });
  const days = hit ? daysUntil(hit.iso) : null;

  return (
    <Card className={cn(compact ? "p-4" : "p-5 sm:p-6")}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-forest text-primary-fg">
          <CalendarClock className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Calendario oficial 2026</p>
          <CardTitle className="text-lg sm:text-xl">¿Cuándo se le vence?</CardTitle>
          <CardHint>
            Escriba la cédula o el NIT del RUT, sin dígito de verificación. El plazo sale de los dos últimos dígitos.
          </CardHint>
        </div>
      </div>

      <div className="mt-4 max-w-sm">
        <Label htmlFor="cedula-plazo">Cédula / NIT</Label>
        <Input
          id="cedula-plazo"
          className="mt-1.5"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 72.123.456"
          value={nit}
          onChange={(e) => patch((x) => (x.identity.nit = e.target.value.replace(/\D/g, "")))}
        />
      </div>

      {hit ? (
        <div
          className={cn(
            "mt-4 rounded-lg px-4 py-4",
            hit.regime === "decreto-1226" ? "bg-warn-mist" : "bg-forest-mist",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={hit.regime === "decreto-1226" ? "warn" : "forest"}>
              {hit.regime === "decreto-1226" ? "Decreto 1226 · sismo" : "Calendario general"}
            </Badge>
            <span className="text-xs text-muted">Dígitos {hit.digits.join(" y ")} · su NIT termina en {hit.lastTwo}</span>
          </div>
          <p className="mt-2 font-display text-3xl leading-none tracking-tight sm:text-4xl">{hit.date}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {days === null
              ? null
              : days > 0
                ? `Faltan ${days} días para declarar y pagar en una sola cuota.`
                : days === 0
                  ? "Vence hoy, en horario hábil de la DIAN."
                  : `Venció hace ${Math.abs(days)} días. La extemporaneidad es el 5 % mensual (art. 641), con mínima de 10 UVT (art. 639).`}
          </p>
          {hit.regime === "decreto-1226" ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Plazo especial porque el domicilio fiscal al 10 de agosto de 2026 está en {SECCIONALES_DECRETO_1226_LABEL}. El resto del país sigue el calendario general.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Con dos dígitos ya aparece la fecha. Los vencimientos generales corren del 12 de agosto al 26 de octubre de 2026.
        </p>
      )}

      <div className="mt-4">
        <Button asChild variant="link" className="h-auto px-0">
          <Link to="/calendario">Ver tabla completa de dígitos</Link>
        </Button>
      </div>
    </Card>
  );
}
