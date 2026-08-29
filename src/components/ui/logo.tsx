import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark" | "colored";
}

export function Logo({
  className,
  size = "md",
  showText = true,
  variant = "colored",
}: LogoProps) {
  const iconSizes = {
    sm: "size-7",
    md: "size-9",
    lg: "size-11",
    xl: "size-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const subtextSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Icono Isotipo HD DeclaraPro */}
      <div className={cn("relative shrink-0 flex items-center justify-center", iconSizes[size])}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Gradiente principal Esmeralda Profundo */}
            <linearGradient id="declaraEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="50%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#042F2E" />
            </linearGradient>

            {/* Gradiente Oro Financiero Premium */}
            <linearGradient id="declaraGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Gradiente de brillo reflectante */}
            <linearGradient id="declaraShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Sombra suave interna */}
            <filter id="declaraShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Escudo / Fondo Geométrico redondeado */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#declaraEmerald)"
            stroke="url(#declaraGold)"
            strokeWidth="1.5"
          />

          {/* Brillo superior en bisel */}
          <rect
            x="3"
            y="3"
            width="42"
            height="21"
            rx="10"
            fill="url(#declaraShine)"
          />

          {/* Emblema 'D' Estilizada y Balanza Fiscal */}
          <g filter="url(#declaraShadow)">
            {/* Trazo vertical de la D */}
            <path
              d="M13 13C13 12.4477 13.4477 12 14 12H24C31.1797 12 37 17.8203 37 25C37 32.1797 31.1797 38 24 38H14C13.4477 38 13 37.5523 13 37V13Z"
              fill="none"
              stroke="#F8FAFC"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Arco dorado de aceleración */}
            <path
              d="M24 12C31.1797 12 37 17.8203 37 25"
              fill="none"
              stroke="url(#declaraGold)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Balanza / Casillas de verificación en verde neón */}
            <circle cx="21" cy="24" r="2.2" fill="url(#declaraGold)" />
            <circle cx="29" cy="24" r="2.2" fill="url(#declaraGold)" />
            
            {/* Checkmark central en el pilar */}
            <path
              d="M20 28.5L23.5 32L31 22.5"
              stroke="#34D399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Texto de Marca */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={cn(
                "font-display font-extrabold tracking-tight",
                textSizes[size],
                variant === "light"
                  ? "text-white"
                  : "text-forest-deep"
              )}
            >
              Declara<span className="text-emerald-600">Pro</span>
            </span>
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-500/30">
              210
            </span>
          </div>
          <span
            className={cn(
              "font-medium uppercase tracking-[0.18em]",
              subtextSizes[size],
              variant === "light" ? "text-emerald-200/80" : "text-muted"
            )}
          >
            Renta Persona Natural · DIAN
          </span>
        </div>
      )}
    </div>
  );
}
