import { CASILLA_LABELS } from "./engine.ts";
import type { ComputedDeclaration, Declaration } from "./types.ts";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Genera el documento XML oficial del Formulario 210 para personas naturales residentes,
 * compatible con la estructura de carga y prevalidador de la DIAN.
 */
export function generateFormulario210Xml(d: Declaration, c: ComputedDeclaration): string {
  const id = d.identity;
  const year = d.year;
  const isCorrection = id.esCorreccion;
  const concepto = isCorrection ? "2" : "1"; // 1 = Inicial, 2 = Corrección

  const sortedCasillas = Object.keys(c.casillas)
    .map(Number)
    .sort((a, b) => a - b);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<declaracion formulario="210" version="${year}" concepto="${concepto}" anio="${year}" periodo="1">`,
  );

  // Cabecera / Identificación
  lines.push("  <cabecera>");
  lines.push(`    <nit>${escapeXml(id.nit || "")}</nit>`);
  lines.push(`    <dv>${escapeXml(id.dv || "")}</dv>`);
  lines.push(`    <primerApellido>${escapeXml(id.primerApellido || "")}</primerApellido>`);
  lines.push(`    <segundoApellido>${escapeXml(id.segundoApellido || "")}</segundoApellido>`);
  lines.push(`    <primerNombre>${escapeXml(id.primerNombre || "")}</primerNombre>`);
  lines.push(`    <otrosNombres>${escapeXml(id.otrosNombres || "")}</otrosNombres>`);
  lines.push(`    <codSeccional>${escapeXml(id.dirSeccional || "")}</codSeccional>`);
  lines.push(`    <actividadCiiu>${escapeXml(id.actividadCiiu || "")}</actividadCiiu>`);
  lines.push(`    <esCorreccion>${isCorrection ? "true" : "false"}</esCorreccion>`);
  if (isCorrection && id.formAnterior) {
    lines.push(`    <formularioAnterior>${escapeXml(id.formAnterior)}</formularioAnterior>`);
  }
  lines.push(`    <aniosDeclarando>${id.aniosDeclarando || 1}</aniosDeclarando>`);
  lines.push(`    <responsableIva>${id.responsableIva ? "1" : "0"}</responsableIva>`);
  lines.push(`    <fechaGeneracion>${new Date().toISOString()}</fechaGeneracion>`);
  lines.push("  </cabecera>");

  // Casillas de liquidación
  lines.push("  <casillas>");
  for (const n of sortedCasillas) {
    const val = c.casillas[n];
    if (val === undefined || val === null) continue;
    const label = CASILLA_LABELS[n] ?? `Casilla ${n}`;
    const formattedVal = n === 140 ? (val ? "1" : "0") : String(Math.round(val));
    lines.push(
      `    <casilla num="${n}" valor="${formattedVal}" etiqueta="${escapeXml(label)}" />`,
    );
  }
  lines.push("  </casillas>");

  // Resumen de liquidación
  lines.push("  <totales>");
  lines.push(`    <patrimonioLiquido casilla="31">${c.casillas[31] ?? 0}</patrimonioLiquido>`);
  lines.push(`    <rentaLiquidaGravableGeneral casilla="97">${c.rentaLiquidaGravable ?? 0}</rentaLiquidaGravableGeneral>`);
  lines.push(`    <impuestoNeto casilla="126">${c.impuestoNeto ?? 0}</impuestoNeto>`);
  lines.push(`    <totalImpuestoCargo casilla="129">${c.impuestoCargo ?? 0}</totalImpuestoCargo>`);
  lines.push(`    <saldoPagar casilla="136">${c.saldoPagar ?? 0}</saldoPagar>`);
  lines.push(`    <saldoFavor casilla="137">${c.saldoFavor ?? 0}</saldoFavor>`);
  lines.push("  </totales>");

  lines.push("</declaracion>");

  return lines.join("\n");
}

/**
 * Genera un archivo CSV delimitado por punto y coma (;) estructurado exactamente por las
 * secciones del Formulario 210 oficial de la DIAN (como en el PDF oficial).
 */
export function generateFormulario210Csv(d: Declaration, c: ComputedDeclaration): string {
  const id = d.identity;
  const lines: string[] = [];

  // Metadatos y Cabecera Oficial (Casillas 1 a 24)
  lines.push(`DIAN - FORMULARIO 210 - DECLARACIÓN DE RENTA Y COMPLEMENTARIO PERSONAS NATURALES RESIDENTES`);
  lines.push(`Año Gravable (Casilla 1);${d.year}`);
  lines.push(`Número de Formulario;210`);
  lines.push(`Concepto;${id.esCorreccion ? "2 - Corrección" : "1 - Inicial"}`);
  lines.push(`NIT (Casilla 5);${id.nit || ""}`);
  lines.push(`DV (Casilla 6);${id.dv || ""}`);
  lines.push(`Primer Apellido (Casilla 7);${id.primerApellido || ""}`);
  lines.push(`Segundo Apellido (Casilla 8);${id.segundoApellido || ""}`);
  lines.push(`Primer Nombre (Casilla 9);${id.primerNombre || ""}`);
  lines.push(`Otros Nombres (Casilla 10);${id.otrosNombres || ""}`);
  lines.push(`Código Dirección Seccional (Casilla 12);${id.dirSeccional || ""}`);
  lines.push(`Actividad Económica Principal CIIU (Casilla 24);${id.actividadCiiu || ""}`);
  if (id.esCorreccion && id.formAnterior) {
    lines.push(`Número Declaración Anterior;${id.formAnterior}`);
  }
  lines.push(`Fecha de Emisión;${new Date().toLocaleDateString("es-CO")}`);
  lines.push("");

  // Secciones oficiales del Formulario 210 (PDF)
  const SECTIONS_CONFIG: { title: string; casillas: number[] }[] = [
    {
      title: "PATRIMONIO (Arts. 261 a 287 E.T.)",
      casillas: [28, 29, 30, 31],
    },
    {
      title: "CÉDULA GENERAL - RENTAS DE TRABAJO (Art. 103 E.T.)",
      casillas: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    },
    {
      title: "CÉDULA GENERAL - RENTAS POR HONORARIOS Y SERVICIOS PERSONALES CON COSTOS",
      casillas: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
    },
    {
      title: "CÉDULA GENERAL - RENTAS DE CAPITAL (Art. 335 E.T.)",
      casillas: [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    },
    {
      title: "CÉDULA GENERAL - RENTAS NO LABORALES (Art. 335 E.T.)",
      casillas: [74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
    },
    {
      title: "DEPURACIÓN CÉDULA GENERAL Y RENTAS GRAVABLES (Art. 336 E.T.)",
      casillas: [91, 92, 93, 94, 95, 96, 97, 98],
    },
    {
      title: "CÉDULA DE PENSIONES (Art. 206 Num. 5 E.T.)",
      casillas: [99, 100, 101, 102, 103],
    },
    {
      title: "CÉDULA DE DIVIDENDOS Y PARTICIPACIONES (Arts. 242 y 342 E.T.)",
      casillas: [104, 105, 106, 107, 108, 109, 110, 111],
    },
    {
      title: "GANANCIAS OCASIONALES (Arts. 299 a 317 E.T.)",
      casillas: [112, 113, 114, 115],
    },
    {
      title: "LIQUIDACIÓN PRIVADA - IMPUESTO Y DESCUENTOS",
      casillas: [116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126],
    },
    {
      title: "LIQUIDACIÓN PRIVADA - TOTAL IMPUESTO, ANTICIPOS, RETENCIONES Y SALDO",
      casillas: [127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137],
    },
    {
      title: "DATOS INFORMATIVOS Y ADICIONALES",
      casillas: [138, 139, 140, 141, 980],
    },
  ];

  lines.push("Casilla;Concepto / Descripción Oficial;Valor (COP)");

  for (const sec of SECTIONS_CONFIG) {
    lines.push("");
    lines.push(`--- ${sec.title} ---;;`);
    for (const n of sec.casillas) {
      const val = c.casillas[n];
      const label = CASILLA_LABELS[n] ?? `Casilla ${n}`;
      let formattedVal = "0";
      if (val !== undefined && val !== null) {
        formattedVal = n === 140 ? (val ? "X" : "") : String(Math.round(val));
      }
      lines.push(`${n};"${label.replace(/"/g, '""')}";${formattedVal}`);
    }
  }

  return lines.join("\n");
}

/**
 * Helper para disparar la descarga de cualquier archivo en el cliente web.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
