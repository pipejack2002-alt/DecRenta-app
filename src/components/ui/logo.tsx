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
      {/* Icono Isotipo HD */}
      <div className={cn("relative shrink-0 flex items-center justify-center", iconSizes[size])}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Gradiente principal Esmeralda Profundo */}
            <linearGradient id="tributoEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="50%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#042F2E" />
            </linearGradient>

            {/* Gradiente Oro Financiero Premium */}
            <linearGradient id="tributoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Gradiente de brillo reflectante */}
            <linearGradient id="tributoShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Sombra suave interna */}
            <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
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
            fill="url(#tributoEmerald)"
            stroke="url(#tributoGold)"
            strokeWidth="1.5"
          />

          {/* Brillo superior en bisel */}
          <rect
            x="3"
            y="3"
            width="42"
            height="21"
            rx="10"
            fill="url(#tributoShine)"
          />

          {/* Emblema 'T' Estilizada y Balanza Fiscal */}
          <g filter="url(#logoShadow)">
            {/* Barra horizontal superior de la T (Hoja / Pliegue Tributario) */}
            <path
              d="M11 14C11 12.8954 11.8954 12 13 12H35C36.1046 12 37 12.8954 37 14V17C37 17.5523 36.5523 18 36 18H12C11.4477 18 11 17.5523 11 17V14Z"
              fill="#F8FAFC"
            />
            {/* Acento dorado en el ala derecha de la T */}
            <path
              d="M31 12H35C36.1046 12 37 12.8954 37 14V18H31V12Z"
              fill="url(#tributoGold)"
            />

            {/* Columna / Tronco central de la T (Pilar de Solidez) */}
            <path
              d="M20.5 18H27.5V33C27.5 34.6569 26.1569 36 24.5 36H23.5C21.8431 36 20.5 34.6569 20.5 33V18Z"
              fill="#F8FAFC"
            />

            {/* Balanza / Casillas de verificación en verde neón */}
            <circle cx="15.5" cy="24.5" r="2.2" fill="url(#tributoGold)" />
            <circle cx="32.5" cy="24.5" r="2.2" fill="url(#tributoGold)" />
            
            {/* Micro-líneas de soporte de balanza */}
            <line x1="15.5" y1="18" x2="15.5" y2="22.5" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="32.5" y1="18" x2="32.5" y2="22.5" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />

            {/* Checkmark central en el pilar */}
            <path
              d="M22 26.5L23.5 28L26 24.5"
              stroke="#064E3B"
              strokeWidth="1.5"
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
              Tributo<span className="text-emerald-600">App</span>
            </span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 border border-amber-500/30">
              Pro
            </span>
          </div>
          <span
            className={cn(
              "font-medium uppercase tracking-[0.18em]",
              subtextSizes[size],
              variant === "light" ? "text-emerald-200/80" : "text-muted"
            )}
          >
            Renta 210 · DIAN
          </span>
        </div>
      )}
    </div>
  );
}
