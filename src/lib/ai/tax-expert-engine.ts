import { ARTICLES } from "@/lib/legal/articles";
import { formatCOP } from "@/lib/tax/format";

export interface TaxEngineQuery {
  question: string;
  context?: string;
  normas?: string;
}

/**
 * Motor Experto de Inteligencia Tributaria Local (Zero-Failure Engine).
 * Proporciona respuestas pedagógicas, exhaustivas y ancladas 100% en el Estatuto Tributario,
 * la Ley 2277 de 2022 y las cifras reales del Formulario 210, garantizando disponibilidad total.
 */
export function generateExpertTaxResponse({
  question,
  context,
  normas,
}: TaxEngineQuery): string {
  const q = question.toLowerCase();

  // 1. Pregunta: 25% Renta Exenta Laboral vs. Costos y Gastos en Honorarios
  if (
    (q.includes("25") || q.includes("exenta") || q.includes("exención")) &&
    (q.includes("honorario") || q.includes("costo") || q.includes("gasto") || q.includes("independiente"))
  ) {
    return `### ⚖️ Análisis Jurídico: 25 % de Renta Exenta vs. Imputación de Costos y Gastos

En el régimen tributario colombiano para personas naturales (Cédula General - Rentas de Trabajo), **la ley prohíbe de forma expresa tomar simultáneamente el 25 % de renta exenta laboral y deducir costos y gastos procedentes sobre los mismos honorarios o compensaciones por servicios personales**.

---

### 1. Fundamento Legal Principal: Artículos 206 (Numeral 10) y 103 del Estatuto Tributario
* **Artículo 206, Numeral 10 del E.T. (Modificado por Ley 2277 de 2022)**:
  Establece una renta exenta del **25 %** sobre los pagos laborales o pagos por honorarios/servicios personales percibidos por personas naturales, con un límite máximo anual de **790 UVT**.
* **Condición de Incompatibilidad (Parágrafo 5 del Art. 206 y Art. 103 E.T.)**:
  Para los trabajadores independientes u honorarios, la norma señala taxativamente que la exención del 25 % solo procede **cuando el contribuyente manifieste que no imputará costos y deducciones procedentes** asociados a dicha actividad en su declaración de renta.

---

### 2. ¿Por qué existe esta restricción?
* **Naturaleza Presuntiva del 25 %**: La exención del 25 % fue concebida por el legislador como un alivio presuntivo para cubrir los costos inherentes a la actividad laboral (transporte, indumentaria, formación, herramientas de trabajo) que los asalariados no pueden descontar de forma directa.
* **Prohibición del Doble Beneficio**: Si un profesional independiente deduce los costos reales de su oficina, insumos, nómina y viáticos (Art. 107 E.T.) y adicionalmente se toma la exención presuntiva del 25 %, estaría duplicando el beneficio fiscal sobre el mismo ingreso, lo cual está prohibido por el principio de equidad tributaria (Art. 95 y 363 C.P.).

---

### 3. Recomendación Práctica para su Declaración
* **Escenario A (Costos Reales Altos)**: Si sus costos y gastos reales demostrables superan el 25 % de sus ingresos brutos por honorarios, le conviene más **declarar en la cédula no laboral o imputar costos directos** y renunciar a la renta exenta del 25 %.
* **Escenario B (Costos Reales Bajos o Nulos)**: Si no tiene soportes con factura electrónica o sus costos son mínimos, le conviene **acogerse a la renta exenta automática del 25 % (hasta 790 UVT)** en rentas de trabajo.

---
${context ? `### 📊 Contexto de su Declaración:\n${context}\n\n` : ""}
### 📚 Fuentes y Referencias Oficiales:
- [Estatuto Tributario Art. 206 — Rentas de Trabajo Exentas](https://estatuto.co/206)
- [Estatuto Tributario Art. 336 — Renta Líquida Cedular de la Cédula General](https://estatuto.co/336)
- [Estatuto Tributario Art. 103 — Rentas Exclusivas de Trabajo](https://estatuto.co/103)
- [DIAN Portal Oficial — Orientación Tributaria Personas Naturales](https://www.dian.gov.co)
- [Ley 2277 de 2022 (Reforma Tributaria)](http://www.secretariasenado.gov.co/senado/basedoc/ley_2277_2022.html)

*Nota: Esta orientación se basa estrictamente en el Estatuto Tributario vigente y no sustituye la asesoría formal de un contador público titulado.*`;
  }

  // 2. Pregunta: Tope del 40% (1.340 UVT) y Deducciones Independientes
  if (
    q.includes("40") ||
    q.includes("1.340") ||
    q.includes("1340") ||
    (q.includes("tope") && q.includes("deducci")) ||
    (q.includes("limite") && q.includes("cedul"))
  ) {
    return `### 🛡️ Depuración Cedular: Límite del 40 % (1.340 UVT) y Deducciones Especiales

En la **Cédula General** (Rentas de Trabajo, de Capital y No Laborales), la Ley 2277 de 2022 fijó reglas estrictas para el cómputo de rentas exentas y deducciones imputables.

---

### 1. El Límite Conjunto General (Art. 336 E.T.)
La suma total de todas las deducciones imputables y rentas exentas no puede exceder el **40 % de la renta líquida ordinaria** (Ingresos Brutos − Ingresos No Constitutivos de Renta), ni superar el tope absoluto de **1.340 UVT anuales**.

#### Conceptos que entran en la limitación del 40 % / 1.340 UVT:
1. **Renta exenta laboral del 25 %** (Art. 206 Numeral 10 E.T., máx. 790 UVT).
2. **Intereses de crédito de vivienda** o leasing habitacional (Art. 119 E.T., máx. 1.200 UVT anuales).
3. **Pagos por medicina prepagada** y pólizas de salud (Art. 387 E.T., máx. 16 UVT mensuales / 192 UVT anuales).
4. **Deducción tradicional de dependientes económicos** (Art. 387 E.T., 10 % de ingresos de trabajo, máx. 384 UVT anuales).
5. **Aportes voluntarios a fondos de pensiones voluntarias y cuentas AFC** (Art. 126-1 y 126-4 E.T., máx. 30 % del ingreso o 3.800 UVT).

---

### 2. Deducciones Especiales que NO están sujetas al Límite del 40 % (Son Adicionales)
La reforma tributaria (Ley 2277 de 2022) introdujo dos beneficios que se pueden restar **por encima y de manera independiente al tope del 40 % o 1.340 UVT**:

1. **Deducción por Dependientes Adicionales (Inciso 2, Art. 336 E.T.)**:
   - Puede deducir **72 UVT anuales por cada dependiente económico**, hasta un máximo de **4 dependientes** (hasta 288 UVT anuales).
   - Esta deducción no afecta el cupo del 40 % y se resta directamente de la renta líquida gravable.
2. **Deducción del 1 % por Compras con Factura Electrónica (Numeral 5, Art. 336 E.T.)**:
   - Puede deducir el **1 % del valor total de bienes o servicios adquiridos** para su consumo propio, respaldados con factura electrónica con CUFE y pagados por medios bancarizados (tarjeta débito, crédito o transferencia).
   - Límite propio: hasta **240 UVT anuales**. Tampoco computa para el tope del 40 %.

---

### 3. Fórmula Oficial de Depuración:
\`\`\`
Base Gravable (Casilla 94) = Renta Líquida Ordinaria 
                             − [Rentas Exentas y Deducciones limitadas al 40 % o 1.340 UVT] 
                             − [Dependientes Adicionales: 72 UVT c/u, máx 4] 
                             − [1 % de Compras con Factura Electrónica: máx 240 UVT]
\`\`\`

---
${context ? `### 📊 Contexto y Cifras de su Formulario 210:\n${context}\n\n` : ""}
### 📚 Fuentes y Referencias Oficiales:
- [Estatuto Tributario Art. 336 — Renta Líquida Cedular de la Cédula General](https://estatuto.co/336)
- [Estatuto Tributario Art. 387 — Deducción por Dependientes y Salud Prepagada](https://estatuto.co/387)
- [Estatuto Tributario Art. 119 — Deducción de Intereses de Vivienda](https://estatuto.co/119)
- [DIAN Portal Oficial — Guía Renta Personas Naturales](https://www.dian.gov.co)

*Nota: Esta orientación se basa en el Estatuto Tributario y no sustituye la asesoría formal de un contador público.*`;
  }

  // 3. Pregunta: Explicación de la Tabla del Art. 241 E.T. y Cálculo de Impuesto
  if (
    q.includes("241") ||
    (q.includes("tabla") && q.includes("tarifa")) ||
    (q.includes("calcul") && q.includes("impuesto"))
  ) {
    return `### 📈 Liquidación del Impuesto de Renta: Tabla Progresiva del Artículo 241 E.T.

El impuesto sobre la renta de las personas naturales residentes para la Cédula General y Pensiones se liquida aplicando la tabla progresiva y marginal en Unidades de Valor Tributario (UVT) prevista en el **Artículo 241 del Estatuto Tributario**.

---

### 1. Rangos y Tarifas Marginales Vigentes:
| Rango en UVT | Tarifa Marginal | Impuesto Básico | Fórmula de Liquidación |
| :--- | :---: | :---: | :--- |
| **0 a 1.090 UVT** | **0 %** | $0 | No genera impuesto (Rango exento) |
| **> 1.090 a 1.700 UVT** | **19 %** | $0 | (Base en UVT − 1.090) × 19 % |
| **> 1.700 a 4.100 UVT** | **28 %** | 116 UVT | (Base en UVT − 1.700) × 28 % + 116 UVT |
| **> 4.100 a 8.670 UVT** | **33 %** | 788 UVT | (Base en UVT − 4.100) × 33 % + 788 UVT |
| **> 8.670 a 18.970 UVT** | **35 %** | 2.296 UVT | (Base en UVT − 8.670) × 35 % + 2.296 UVT |
| **> 18.970 a 31.000 UVT**| **37 %** | 5.901 UVT | (Base en UVT − 18.970) × 37 % + 5.901 UVT |
| **> 31.000 UVT en adelante** | **39 %** | 10.352 UVT | (Base en UVT − 31.000) × 39 % + 10.352 UVT |

---

### 2. Pasos para la Determinación del Saldo a Pagar o a Favor:
1. **Conversión a UVT**: Se toma la Renta Líquida Gravable (Casilla 94) y se divide entre el valor de la UVT del año gravable respectivo.
2. **Aplicación de la Tarifa**: Se ubica el rango correspondiente y se calcula el impuesto en UVT, convirtiéndolo nuevamente a pesos colombianos.
3. **Descuentos Tributarios (Art. 254 a 259 E.T.)**: Se restan donaciones e impuestos pagados en el exterior para obtener el **Impuesto Neto de Renta (Casilla 129)**.
4. **Retenciones y Anticipos**:
   \`\`\`
   Saldo Final = Impuesto Neto 
                 + Anticipo Año Siguiente (Art. 807 E.T.) 
                 − Retenciones en la Fuente Practicadas (Art. 373 E.T.) 
                 − Anticipo Año Anterior 
                 − Saldo a Favor Anterior
   \`\`\`

---
${context ? `### 📊 Cifras Actuales de su Declaración:\n${context}\n\n` : ""}
### 📚 Fuentes y Referencias Oficiales:
- [Estatuto Tributario Art. 241 — Tarifa para las personas naturales residentes](https://estatuto.co/241)
- [Estatuto Tributario Art. 807 — Cálculo del Anticipo de Renta](https://estatuto.co/807)
- [Estatuto Tributario Art. 373 — Imputación de Retenciones en la Fuente](https://estatuto.co/373)
- [DIAN Portal Oficial](https://www.dian.gov.co)

*Nota: Esta orientación se basa en el Estatuto Tributario y no sustituye la asesoría formal de un contador público.*`;
  }

  // 4. Pregunta: Soportes Probatorios y Auditoría DIAN
  if (
    q.includes("soporte") ||
    q.includes("auditor") ||
    q.includes("fiscaliz") ||
    q.includes("documento") ||
    q.includes("prueba")
  ) {
    return `### 🛡️ Blindaje y Soportes Probatorios Exigidos por la DIAN (Art. 771-2 y 771-5 E.T.)

Para que las cifras declaradas en el Formulario 210 tengan plena validez fiscal y resistan un requerimiento ordinario o inspección tributaria de la DIAN, el declarante debe conservar durante el término de firmeza (3 a 5 años) los siguientes soportes:

---

### 1. Soportes de Ingresos y Retenciones:
* **Formato 220 (Certificado de Ingresos y Retenciones)**: Expedido por empleadores o contratantes para rentas de trabajo (salarios, cesantías, aportes de seguridad social y retenciones practicadas).
* **Certificados de Rendimientos Financieros y Retenciones Bancarias**: Expedidos por entidades financieras que certifican intereses pagados, retención en la fuente y saldos de cuentas a 31 de diciembre.
* **Certificados de Dividendos y Participaciones**: Con indicación expresa de la calidad de gravados o no gravados (Art. 48 y 49 E.T.).

---

### 2. Soportes de Costos y Deducciones:
* **Factura Electrónica de Venta con Validación Previa (CUFE)**: Requisito obligatorio para la aceptación de cualquier costo o deducción (Art. 771-2 E.T.).
* **Bancarización Obligatoria (Art. 771-5 E.T.)**: Todos los pagos deben haberse realizado a través del sistema financiero (transferencias, cheques, tarjetas de crédito/débito).
* **Certificados de Créditos Hipotecarios / Leasing Habitacional**: Con discriminación estricta de la porción correspondiente a intereses pagados en el año gravable.
* **Certificados de Medicina Prepagada o Pólizas de Salud**: Con el valor pagado por el contribuyente y los beneficiarios con parentesco legal.
* **Documentos de Dependientes Económicos (Art. 387 E.T.)**: Registro civil de nacimiento (hijos menores de 18 o de 18 a 23 estudiantes con certificado de estudios vigente, o cónyuge/padres en dependencia económica con certificación juramentada).

---

### 3. Soportes de Patrimonio y Deudas:
* **Escrituras Públicas y Recibos de Impuesto Predial / Avalúo Catastral** para bienes inmuebles.
* **Tarjetas de Propiedad y Declaraciones de Impuesto Vehicular** para vehículos.
* **Certificados de Deudas a 31 de Diciembre**: Expedidos por entidades financieras o acreedores con NIT y personería jurídica.

---
${context ? `### 📊 Contexto del Declarante:\n${context}\n\n` : ""}
### 📚 Fuentes y Referencias Oficiales:
- [Estatuto Tributario Art. 771-2 — Procedencia de costos y deducciones con factura](https://estatuto.co/771-2)
- [Estatuto Tributario Art. 771-5 — Medios de pago para aceptación de costos y deducciones](https://estatuto.co/771-5)
- [Estatuto Tributario Art. 638 y 714 — Término de Firmeza de las Declaraciones](https://estatuto.co/714)
- [DIAN Portal Oficial — Facturación Electrónica y Fiscalización](https://www.dian.gov.co)

*Nota: Esta orientación se basa en el Estatuto Tributario y no sustituye la asesoría formal de un contador público.*`;
  }

  // 5. Pregunta General o Análisis de Cifras del Contexto
  const matchedArticles = ARTICLES.filter((a) => {
    const text = `${a.citation} ${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    return words.some((w) => text.includes(w));
  }).slice(0, 3);

  const articlesBlock =
    matchedArticles.length > 0
      ? matchedArticles
          .map(
            (a) =>
              `* **${a.citation} — ${a.title}**:\n  ${a.summary}\n  *Fuente oficial:* [Consultar ${a.citation}](${a.url})`,
          )
          .join("\n\n")
      : `* **Artículo 26 del E.T. — Depuración de la Renta**:\n  De los ingresos brutos se restan las devoluciones, costos e ingresos no constitutivos de renta para obtener la renta líquida.\n* **Artículo 336 del E.T. — Depuración de la Cédula General**:\n  Régimen aplicable a rentas de trabajo, capital y no laborales con límite conjunto del 40 % o 1.340 UVT.`;

  return `### 💡 Orientación Tributaria Experta: Formulario 210 DIAN

Estimado declarante, a continuación se presenta la respuesta técnica y el marco normativo aplicable a su consulta:

---

### 1. Marco Normativo Aplicable del Estatuto Tributario:
${articlesBlock}

---

### 2. Aspectos Clave para su Liquidación:
1. **Determinación de Ingresos**: Clasifique adecuadamente los ingresos en la cédula correspondiente (Trabajo, Honorarios, Capital, No Laborales, Pensiones o Dividendos).
2. **Depuración Rigurosa**:
   - Reste únicamente los aportes obligatorios a Salud y Pensión como Ingresos No Constitutivos de Renta (Art. 55 y 56 E.T.).
   - Aplique las deducciones imputables respetando el límite legal conjunto del **40 % o 1.340 UVT** (Art. 336 E.T.).
   - Reste las deducciones no sujetas al límite (hasta 4 dependientes adicionales de 72 UVT c/u y el 1 % de compras con factura electrónica).
3. **Cálculo del Impuesto**: Aplique la tabla progresiva del Art. 241 E.T. sobre la base gravable final y deduzca las retenciones en la fuente efectivamente practicadas.

---
${context ? `### 📊 Cifras y Estado del Expediente:\n${context}\n\n` : ""}
${normas ? `### 📜 Normativa Específica del Expediente:\n${normas}\n\n` : ""}
### 📚 Fuentes y Referencias Oficiales:
- [Estatuto Tributario de Colombia (Versión Oficial en Línea)](https://estatuto.co/)
- [DIAN Portal Oficial — Información de Renta Personas Naturales](https://www.dian.gov.co)
- [Secretaría del Senado — Ley 2277 de 2022](http://www.secretariasenado.gov.co/senado/basedoc/ley_2277_2022.html)
- [Decreto Único Reglamentario 1625 de 2016 (DUR Tributario)](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77801)

*Nota: Esta orientación se basa estrictamente en el Estatuto Tributario colombiano vigente y no sustituye la asesoría formal de un contador público titulado.*`;
}
