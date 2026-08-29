import {
  Check,
  Clipboard,
  Download,
  FileCheck,
  FileText,
  Mail,
  MessageCircle,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export const CHECKLIST_CATEGORIES = [
  {
    category: "1. Identificación y Antecedentes Básicos",
    items: [
      { id: "rut", name: "RUT Actualizado", desc: "Registro Único Tributario con responsabilidades y actividad económica al día." },
      { id: "cc", name: "Copia de Cédula de Ciudadanía", desc: "Del declarante y de los dependientes económicos si aplica." },
      { id: "dec_ant", name: "Declaración de Renta del Año Anterior (AG 2024)", desc: "Formulario 210 y recibo de pago para verificar saldos a favor y anticipo." },
      { id: "exogena", name: "Reporte de Información Exógena DIAN", desc: "Archivo Excel de 'Información reportada por terceros' descargado del portal Muisca." },
    ],
  },
  {
    category: "2. Ingresos Laborales y Pensiones",
    items: [
      { id: "f220", name: "Formato 220 (Certificado de Ingresos y Retenciones)", desc: "Emitido por el empleador con salarios, prestaciones, aportes y retenciones." },
      { id: "cesantias", name: "Certificado de Cesantías e Intereses de Cesantías", desc: "Pagadas o consignadas en el fondo durante el año gravable." },
      { id: "pension", name: "Certificado de Mesadas Pensionales", desc: "Emitido por Colpensiones o Fondo Privado con aportes a salud deducidos." },
    ],
  },
  {
    category: "3. Honorarios, Servicios y Actividades Comerciales",
    items: [
      { id: "cert_ret", name: "Certificados de Retención en la Fuente (Art. 381 E.T.)", desc: "Emitidos por las empresas o clientes que practicaron retención." },
      { id: "pila", name: "Planillas PILA de Seguridad Social", desc: "Soportes de pago mensual de aportes a Salud (12.5 %) y Pensión (16 %)." },
      { id: "costos", name: "Facturas Electrónicas de Costos y Gastos", desc: "Soportes con factura electrónica de insumos o gastos directos de la actividad." },
    ],
  },
  {
    category: "4. Sector Financiero y Bancario (a 31 de Diciembre)",
    items: [
      { id: "cert_banco", name: "Certificados Tributarios de Cuentas y CDTs", desc: "Saldos a 31 dic y rendimientos financieros/intereses abonados en el año." },
      { id: "gmf", name: "Certificado de 4x1000 (GMF)", desc: "Total de gravamen pagado en el año para deducir el 50 % (Art. 115 E.T.)." },
      { id: "vivienda", name: "Certificado de Intereses de Crédito Hipotecario / Leasing", desc: "Intereses y corrección monetaria pagados para deducir hasta 1.200 UVT (Art. 119 E.T.)." },
      { id: "deudas", name: "Certificado de Saldo de Deudas y Créditos", desc: "Extracto o certificación del pasivo con bancos o entidades a 31 de diciembre." },
    ],
  },
  {
    category: "5. Bienes Raíces, Vehículos e Inversiones",
    items: [
      { id: "predial", name: "Recibos de Impuesto Predial del Año Gravable", desc: "Con avalúo catastral o autoavalúo para declarar el patrimonio de inmuebles." },
      { id: "vehiculos", name: "Impuesto de Vehículos o Tarjeta de Propiedad / SOAT", desc: "Para declarar el valor comercial de automotores o motos." },
      { id: "escrituras", name: "Escrituras de Compra o Venta de Inmuebles", desc: "Si compraste o vendiste casas, lotes o apartamentos en el año." },
      { id: "acciones", name: "Certificado de Acciones o Participaciones", desc: "En sociedades colombianas o del exterior con dividendos recibidos." },
    ],
  },
  {
    category: "6. Deducciones Personales y Beneficios Tributarios",
    items: [
      { id: "dependientes", name: "Soportes de Dependientes Económicos", desc: "Registro civil de nacimiento de hijos menores de 18 años o certificados de estudio (18 a 23 años)." },
      { id: "prepagada", name: "Certificado de Medicina Prepagada o Seguros de Salud", desc: "Pagos efectuados para deducir hasta 16 UVT mensuales (Art. 387 E.T.)." },
      { id: "afc", name: "Certificado de Aportes a Cuentas AFC o Fondos Voluntarios", desc: "Aportes para vivienda o pensión voluntaria (Arts. 126-1 y 126-4 E.T.)." },
      { id: "fact_1pct", name: "Compras Personales con Factura Electrónica", desc: "Bienes y servicios pagados por medios bancarios para el 1 % de beneficio (Art. 336 E.T.)." },
    ],
  },
];

export function ClientChecklistModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const d = useAppStore((s) => s.declaration);
  const [copiedType, setCopiedType] = useState<"whatsapp" | "email" | null>(null);

  if (!isOpen) return null;

  const clientName =
    `${d.identity.primerNombre} ${d.identity.primerApellido}`.trim() ||
    "Estimado(a) Cliente";

  function getWhatsAppText() {
    let text = `📋 *LISTA DE DOCUMENTOS PARA DECLARACIÓN DE RENTA (AG ${d.year})*\n`;
    text += `👤 *Cliente:* ${clientName}\n`;
    text += `🆔 *NIT / Cédula:* ${d.identity.nit || "(Por confirmar)"}\n\n`;
    text += `Apreciado(a) ${clientName}, para preparar y liquidar correctamente su Declaración de Renta ante la DIAN, por favor reúnanos los siguientes documentos (solo los que apliquen a su caso):\n\n`;

    CHECKLIST_CATEGORIES.forEach((cat) => {
      text += `*${cat.category.toUpperCase()}*\n`;
      cat.items.forEach((it) => {
        text += `▫️ [ ] *${it.name}:* ${it.desc}\n`;
      });
      text += `\n`;
    });

    text += `📌 *Nota:* Los certificados bancarios y de empresas suelen descargarse desde el portal web de cada entidad en la sección 'Certificaciones Tributarias / Declaración de Renta'.\n\n`;
    text += `¡Quedamos atentos a sus documentos para avanzar con su liquidación!`;
    return text;
  }

  function handleCopy(type: "whatsapp" | "email") {
    const text = getWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  }

  function handlePrint() {
    window.print();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-bg/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-primary-fg shadow-sm">
              <FileCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink leading-tight">
                Lista de Documentos Requeridos al Cliente
              </h2>
              <p className="text-xs text-muted">
                Guía completa de soportes y certificados para solicitar al contribuyente (AG {d.year})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-forest-mist hover:text-forest transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Barra de Acciones Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/40 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Cliente actual:</span>
            <Badge tone="forest">{clientName}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy("whatsapp")}
              className="h-8 gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              {copiedType === "whatsapp" ? (
                <>
                  <Check className="size-3.5" />
                  ¡Copiado para WhatsApp!
                </>
              ) : (
                <>
                  <MessageCircle className="size-3.5" />
                  Copiar para WhatsApp
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy("email")}
              className="h-8 gap-1.5 text-xs"
            >
              {copiedType === "email" ? (
                <>
                  <Check className="size-3.5" />
                  ¡Texto Copiado!
                </>
              ) : (
                <>
                  <Mail className="size-3.5" />
                  Copiar Correo
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs"
            >
              <Printer className="size-3.5" />
              Imprimir / PDF
            </Button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-5">
            {CHECKLIST_CATEGORIES.map((cat, idx) => (
              <div key={`cat-${idx}`} className="rounded-2xl border border-line bg-bg/40 p-4 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2 border-b border-line/60 pb-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-forest text-primary-fg text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  {cat.category}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {cat.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3 shadow-sm hover:border-forest/50 transition-colors"
                    >
                      <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-forest text-forest">
                        <Check className="size-3" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink leading-tight">{it.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted leading-relaxed">{it.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-bg/40 px-6 py-3.5 flex items-center justify-between text-xs text-muted">
          <span>DeclaraPro · Checklist Profesional para Personas Naturales</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
