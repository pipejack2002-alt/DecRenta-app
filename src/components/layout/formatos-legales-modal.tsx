import { useState, useMemo } from "react";
import { FileText, Printer, Copy, Check, Download, BookOpen } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LEGAL_TEMPLATES, type LegalTemplate } from "@/lib/docs/legal-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FormatosLegalesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const d = useAppStore((s) => s.declaration);

  const [selectedId, setSelectedId] = useState(LEGAL_TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  const currentTemplate = useMemo(
    () => LEGAL_TEMPLATES.find((t) => t.id === selectedId) || LEGAL_TEMPLATES[0],
    [selectedId]
  );

  const textContent = useMemo(
    () => currentTemplate.generateText(d),
    [currentTemplate, d]
  );

  const [customText, setCustomText] = useState(textContent);

  // Sincronizar cuando cambia la plantilla
  function handleSelectTemplate(id: string) {
    setSelectedId(id);
    const tmpl = LEGAL_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setCustomText(tmpl.generateText(d));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentTemplate.title}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; margin: 40px; color: #111; }
            pre { white-space: pre-wrap; font-family: inherit; }
            @media print { margin: 20mm; }
          </style>
        </head>
        <body>
          <pre>${customText}</pre>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-forest text-primary-fg">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Generador de Formatos y Certificados Legales
              </h3>
              <p className="text-xs text-muted">Plantillas y cartas modelo conforme al Estatuto Tributario colombiano</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-forest-mist hover:text-forest">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] flex-1 overflow-hidden">
          {/* Sidebar de Plantillas */}
          <div className="border-r border-line bg-bg/50 p-4 overflow-y-auto space-y-2 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-muted text-[10px] mb-2">
              Plantillas Disponibles
            </h4>
            {LEGAL_TEMPLATES.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    active
                      ? "border-forest bg-forest text-primary-fg shadow-sm"
                      : "border-line bg-surface text-ink hover:bg-bg"
                  }`}
                >
                  <span className="font-semibold block leading-tight">{t.title}</span>
                  <span className={`text-[10px] block mt-1 ${active ? "text-primary-fg/80" : "text-muted"}`}>
                    {t.articleEt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Área de Visualización y Edición */}
          <div className="flex flex-col flex-1 overflow-hidden p-6 bg-surface space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-ink">{currentTemplate.title}</h4>
                <p className="text-xs text-muted">{currentTemplate.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1 text-xs">
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied ? "Copiado" : "Copiar Texto"}
                </Button>
                <Button size="sm" onClick={handlePrint} className="gap-1 text-xs bg-forest text-primary-fg">
                  <Printer className="size-3.5" /> Imprimir / Guardar PDF
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border border-line bg-bg/30">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full h-full p-4 font-mono text-xs text-ink bg-transparent resize-none focus:outline-none leading-relaxed"
                placeholder="Texto del formato..."
              />
            </div>
            <span className="text-[11px] text-muted block text-right">
              ✏️ El texto es editable directamente en la caja antes de imprimir o copiar.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-line px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
