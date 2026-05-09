# Plan: Generador de Informes Opinados desde Analítica

**Estado:** Propuesta para validación
**Fecha:** 2026-05-08
**Owner:** Jaime Villatoro
**Repositorio:** loopy-thinking/loopy-oss

---

## 1. Contexto y problema

Loopy permite identificar loops con alto potencial de impacto productivo, pero la ejecución de muchos de ellos requiere intervención de áreas externas a Loopy: TI interno, partners externos, consultoras. Hoy esa transición es informal — el operador o jefatura tiene la evidencia en su cabeza pero carece de un artefacto estructurado para canalizarla.

Este feature agrega a la sección de analítica la capacidad de generar informes estáticos y opinados que empaquetan un loop como caso accionable para audiencias externas a Loopy. Loopy no resuelve la ejecución; entrega el caso documentado para que la organización decida.

**Decisión clave:** los loops más relevantes para canalizar a TI son frecuentemente aquellos que aún no pueden ejecutarse plenamente porque les falta la integración misma. Por eso el feature soporta dos modos de brief desde el inicio: **Validado** (loop maduro con signals) e **Hipótesis** (loop con potencial articulado pero sin operación validada todavía).

## 2. Decisiones de diseño confirmadas

| Decisión | Elección | Implicación |
|---|---|---|
| Tipo de informe | Estático (snapshot) | Documento fechado, no se refresca solo |
| Configurabilidad | Opinado | Usuario elige plantilla/modo; no hay filtros custom |
| Librería | Cerrada | Plantillas mantenidas por el equipo Loopy |
| Plantillas MVP | 2 | Project Brief + Endoso de Jefatura |
| Modo de Project Brief | Bimodal | Validado / Hipótesis con criterios distintos |
| Modelo de IPL | Bimodal | Realizado (medido) + Proyectado (declarado) |
| Atestación de sponsor | Obligatoria en modo Hipótesis | Sustituye signals automáticos por dato declarado-y-firmado |
| Formato de salida | PDF descargable | Sin links compartibles, sin hosting |
| Ubicación UX | Detalle del loop en analítica | Sin vista agregada de candidatos |

## 3. Alcance del MVP

Dos plantillas. La principal (Project Brief) opera en dos modos. Output siempre en PDF.

### Plantilla 1 — Project Brief de Loop *(prioridad alta)*

Audiencia: TI interno o partner externo.
Objetivo: que reciban un caso completo, evidenciado y listo para evaluar como proyecto.

#### Modo Validado

Para loops que ya están operando con signals reales acumulados.

**Secciones del documento:**

1. **Encabezado** — nombre del loop, owner, sponsor, fecha de generación, scope (individual / equipo / organización), badge **"Brief Validado"**.
2. **Contexto operativo** — descripción del proceso que el loop está cubriendo, capa cognitiva, áreas involucradas.
3. **Evidencia cuantitativa** — total de ejecuciones, frecuencia, IPL Realizado acumulado, IPL Proyectado anual con integración, índice de confianza, tasa de hipótesis validadas. Cada cifra con badge de provenance ("medido" / "proyectado").
4. **Estado actual** — qué hace hoy el loop con apoyo de IA, qué pasos siguen siendo manuales, fuentes conectadas.
5. **Oportunidad de formalización** — qué se ganaría al convertirlo en un sistema/integración nativa (delta entre IPL Realizado e IPL Proyectado, reducción de fricción, calidad).
6. **Evaluación preliminar de sensibilidad** — clasificación heurística de los datos involucrados (público / interno / sensible / regulado), sistemas a integrar.
7. **Próximos pasos sugeridos** — 3 acciones concretas para evaluar si avanzar como proyecto formal.

#### Modo Hipótesis

Para loops con alto potencial articulado pero que aún no pueden operar plenamente porque les falta la integración o recurso que justifican.

**Diferencias respecto al modo Validado:**

- **Encabezado** lleva badge visible **"Brief de Hipótesis — pendiente de validación operacional"** y nota explícita en cabecera de página.
- **Evidencia cuantitativa** se reemplaza por **Evidencia declarada y atestiguada**: muestra IPL Proyectado calculado a partir de inputs estructurados del sponsor (frecuencia × tiempo por ejecución × # personas × tasa de adopción esperada). IPL Realizado puede ser 0; se muestra explícitamente.
- Se agrega sección nueva: **Supuestos críticos a validar** — listado explícito de qué supone el caso (ej. "asumimos que con acceso a CRM se elimina el paso de exportación manual semanal de 4 horas") y cómo cada supuesto podría refutarse antes de invertir.
- Toda cifra del documento lleva badge "estimado" o "atestiguado por sponsor".
- Tono narrativo más prudente: "se proyecta", "se estima", en lugar de las afirmaciones del modo Validado.

**Tono narrativo (ambos modos):** ejecutivo, basado en evidencia o en supuestos explícitos según corresponda, sin jerga interna de Loopy. El lector probablemente no usa el producto.

### Plantilla 2 — Endoso de Jefatura *(prioridad media)*

Audiencia: jefe directo del owner del loop.
Objetivo: que la jefatura lea, valide y firme el caso antes de que escale.

**Secciones del documento:**

1. **Resumen en 5 líneas** — qué loop, qué impacto (IPL Realizado y/o Proyectado según modo), qué se pide.
2. **Evidencia clave** — cifras principales en formato ejecutivo de una página, con provenance visible.
3. **Espacio de endoso** — campos para nombre del jefe, fecha, comentarios y firma.

Esta plantilla no se construye en la primera iteración si el tiempo aprieta — el Project Brief solo ya entrega la mayor parte del valor.

## 4. Criterios de elegibilidad (maturity gate bimodal)

El botón "Generar Brief" se habilita si al menos uno de los dos modos está disponible. El modal de generación muestra qué modos puede usar y cuáles no.

### Gate para modo Validado

- Loop con nombre y descripción definidos
- Capa cognitiva y scope asignados
- Owner y sponsor designados
- Mínimo 5 work signals acumulados
- IPL Realizado calculado desde signals
- Índice de confianza ≥ 50
- Al menos una fuente de datos conectada

### Gate para modo Hipótesis

- Loop con nombre y descripción definidos
- Capa cognitiva y scope asignados
- Owner y sponsor designados
- **Atestación del sponsor completada y firmada** (ver sección 6)
- IPL Proyectado calculado desde inputs declarados
- Mínimo 3 supuestos críticos articulados por el usuario

Si un loop cumple ambos gates, el usuario puede elegir el modo que prefiera. Si cumple solo Hipótesis, solo ese modo está disponible. Si no cumple ninguno, el botón está deshabilitado con mensaje explícito de qué falta para cada modo.

## 5. UX y ubicación en el producto

**Punto de entrada único:** página de detalle del loop, dentro de la sección de analítica, en la barra de acciones del loop.

**Flujo del usuario:**

1. Usuario abre el loop en analítica.
2. Si elegible para al menos un modo, ve botón "Generar Brief". Si no, ve botón deshabilitado con tooltip explicativo.
3. Click → modal con:
   - Selector de plantilla (Project Brief / Endoso de Jefatura).
   - Si Project Brief: selector de modo (Validado / Hipótesis), con modos no elegibles deshabilitados y razón visible.
   - Campo libre para "destinatario / contexto" opcional.
4. Si modo Hipótesis y la atestación del sponsor no está completa todavía: el modal redirige al flujo de atestación antes de generar.
5. Click "Generar" → spinner breve → descarga directa del PDF.
6. El evento de generación queda registrado como metadata del loop (audit trail interno) — no es un signal nuevo.

**Flujo de atestación del sponsor (única vez por loop, reutilizable):**

1. Usuario invita al sponsor a completar la atestación (link interno).
2. Sponsor abre formulario estructurado con campos: frecuencia mensual del proceso manual actual, duración promedio por ejecución, número de personas que lo ejecutan, tasa de adopción esperada post-integración, comentario libre.
3. Sponsor confirma con su identidad de Loopy. La atestación queda guardada en el loop con timestamp y autor.
4. La atestación tiene vigencia indefinida pero puede regenerarse si el contexto cambia.

**No hay:**
- Vista de listado cross-loop de "candidatos para brief".
- Historial visible al usuario de briefs generados (solo telemetría interna).
- Edición del PDF dentro del producto.
- Versionado de plantillas visible al usuario.
- Firma criptográfica del sponsor (la atestación se basa en identidad Loopy, no en firma digital externa).

## 6. Componentes técnicos (alto nivel)

Sin entrar en stack, los bloques que el feature necesita:

1. **Modelo bimodal de IPL** — el loop almacena IPL Realizado (calculado desde signals) e IPL Proyectado (calculado desde inputs declarados). Ambos campos son consultables independientemente y se exponen con provenance en cualquier vista o brief.

2. **Sistema de atestación de sponsor** — entidad asociada al loop con: inputs declarados (frecuencia, duración, # personas, tasa de adopción esperada), comentario, autor (sponsor), timestamp. Una atestación por loop, regenerable. UI dedicada para completarla.

3. **Servicio de elegibilidad bimodal** — función que dado un `loop_id` retorna `{validated_mode: {eligible: bool, missing: [...]}, hypothesis_mode: {eligible: bool, missing: [...]}}`. Usa los gates del punto 4.

4. **Motor de plantillas PDF** — sistema que toma una plantilla declarativa, un modo (validado/hipótesis), y datos del loop, y produce un PDF. Decisión técnica: HTML → PDF (Puppeteer / WeasyPrint / similar) es la ruta más mantenible vs librerías directas de PDF.

5. **Generador de narrativa** — capa que produce los textos en prosa de cada sección, sensible al modo (lenguaje afirmativo en Validado, lenguaje proyectivo en Hipótesis). Para MVP: plantillas con interpolación + reglas. LLM-generation se puede sumar después.

6. **Endpoint de generación** — recibe `loop_id` + `template_id` + `mode` + `context_text` opcional, retorna PDF binario. Valida elegibilidad antes de generar.

7. **Telemetría** — registro de cada generación: quién, cuándo, qué loop, qué plantilla, qué modo. Base para medir adopción y ratio Validado/Hipótesis.

## 7. Hitos sugeridos

| Hito | Entregable | Criterio de cierre |
|---|---|---|
| H1 — Definición de plantillas y modos | Plantilla 1 en formato declarativo con renderizados de muestra para ambos modos | PDFs de muestra (uno por modo) revisados y aprobados por Jaime |
| H2 — Modelo bimodal de IPL | Campos Realizado/Proyectado en el modelo del loop, exposición con provenance en API y UI mínima | Loop puede mostrar ambas cifras con badges correctos |
| H3 — Sistema de atestación de sponsor | Entidad de atestación + UI de completado + flujo de invitación | Sponsor puede completar atestación end-to-end |
| H4 — Servicio de elegibilidad bimodal | Endpoint que evalúa elegibilidad para cada modo | Tests con loops en cada combinación de elegibilidad |
| H5 — Motor de generación | Generador funcionando end-to-end con Plantilla 1 en ambos modos | Genera PDF correcto desde un loop real para cada modo |
| H6 — Integración UX | Botón habilitado/deshabilitado en analítica + modal con selector de modo + redirección a atestación + descarga | Usuario puede generar PDF desde la app en cualquiera de los dos modos |
| H7 — Telemetría y dogfooding | Eventos de generación registrados con modo; uso interno por 2 semanas | Datos de adopción inicial y ratio Validado/Hipótesis |
| H8 — Plantilla 2 (opcional) | Endoso de Jefatura en producción | Decidir antes de H8 si justifica el esfuerzo |

Secuencialidad: H1 → H2 → H3 → H4 → H5 → H6. H7 corre desde H6. H8 opcional al final.

## 8. Métricas de éxito y señal para profundizar

Para decidir si invertir más en este feature después del MVP:

**Adopción (4-8 semanas post-lanzamiento):**
- Briefs generados por usuario activo mensual.
- % de loops elegibles que generan al menos un brief.
- **Ratio Validado / Hipótesis** — proporciones esperadas a observar y entender.

**Uso real fuera de Loopy:**
- Encuesta corta de seguimiento al usuario que generó un brief: ¿lo compartiste?, ¿con quién?, ¿generó conversación o decisión?
- Sin esto, no sabes si resolviste el problema. La descarga sola es señal débil.

**Calidad del modo Hipótesis:**
- ¿Cuántos briefs de hipótesis terminan convertidos en proyectos reales en TI o externos?
- ¿Cuántos briefs de hipótesis terminan convertidos eventualmente en briefs validados (porque la integración se construyó)?
- Si la conversión a proyecto real es muy baja, el modo Hipótesis está siendo usado pero no creído por TI — hay que iterar el formato.

**Demanda revelada:**
- Solicitudes espontáneas de "¿pueden agregar la sección X?" o "¿se puede ver Y?".
- Cantidad y tipo de plantillas adicionales pedidas.

**Umbrales para profundizar:**
- Si > 30% de usuarios activos generan al menos un brief al mes → señal fuerte, justifica plantilla 3-4.
- Si < 10% → el formato no encaja, antes de agregar plantillas hay que entender por qué.

## 9. Fuera de alcance explícitamente

Para que el MVP no se infle, estas cosas quedan fuera y se evalúan solo si el feature demuestra valor:

- Filtros configurables o cortes custom de los informes.
- Comparación entre loops o ranking de oportunidades.
- Vista cross-organización agregada de candidatos a brief.
- Integración con sistemas de ticketing externos (Jira, ServiceNow).
- Flujos de aprobación o firma electrónica dentro de Loopy.
- Versiones del brief en otros idiomas más allá del idioma del usuario.
- Plantillas para audiencias adicionales (CFO, RRHH, Compliance, externos especializados).
- Informes vivos / dashboards refrescables.
- Plantillas comunitarias o configurables por organización.
- Anonimización para benchmarking cross-empresa.
- Loops de referencia análogos como anclaje del modo Hipótesis (descartado para MVP por falta de masa crítica).
- Etapa explícita del loop (Hipótesis/Activo/Maduro) en el modelo de datos — el bimodal del brief lo aproxima sin reestructurar el modelo.

## 10. Riesgos conocidos

**Calidad del dato.** El brief hereda el ruido del loop. Si IPL, signals e índice de confianza son sucios, el brief lo expone. Las maturity gates mitigan parcialmente, pero la calidad de los inputs sigue siendo precondición.

**PDF estático envejece.** El usuario puede compartir un brief y semanas después la situación del loop cambió. Mitigación: el PDF lleva fecha visible y nota explícita de "snapshot al [fecha]".

**Brief no tiene CTA claro hacia afuera.** El documento puede quedarse en la bandeja de TI sin acción. Mitigación: la sección "Próximos pasos sugeridos" tiene que ser concreta y específica, no genérica. Iterarla con feedback real.

**Modo Hipótesis se vuelve vía libre y quema credibilidad.** Si el modo Hipótesis se usa para todo y los briefs generados no llegan a nada, TI deja de tomarlos en serio y el feature se vuelve ruido. Mitigación: atestación obligatoria del sponsor (no es solo el operador firmando; hay un nivel jerárquico encima), badges visuales muy distintos por modo, sección de "Supuestos críticos" que fuerza articulación honesta.

**Atestación del sponsor introduce fricción y depende de su participación.** Si el sponsor no completa la atestación, el loop queda atrapado. Mitigación: UI de invitación clara con recordatorios, posibilidad de que el owner pre-llene la atestación y el sponsor solo confirme/edite/firme.

**Sobreuso del feature en loops inmaduros.** Si las maturity gates son muy laxas, se genera ruido. Mitigación: empezar con criterios estrictos en ambos modos, relajar después si hace falta.

---

## Próximos puntos a decidir antes de implementar

1. **Diseño visual del PDF.** ¿Reutilizamos los tokens de marca de la app o tratamos el PDF como artefacto de marca distinto? Esta decisión afecta H1.
2. **Diferenciación visual entre modos Validado e Hipótesis.** Más allá del badge: ¿color de cabecera distinto, marca de agua, estilo de tipografía? Crítico para que el lector no confunda modos.
3. **Generación narrativa: plantilla con interpolación vs LLM en runtime.** Recomiendo plantilla con interpolación para MVP. Si después H7 muestra que la prosa se siente seca, sumar generación con LLM en una iteración posterior.
4. **Idioma.** ¿MVP solo en español o español + inglés desde el inicio? Recomiendo solo el idioma del usuario en MVP.
5. **Quién valida el contenido del Project Brief antes de cerrar H1.** Idealmente alguien con experiencia recibiendo briefs reales en TI o consultoría — para verificar que el formato es accionable. Vale la pena validar específicamente el modo Hipótesis con ellos: ¿lo tomarían en serio?
6. **Datos exactos en la atestación del sponsor.** Los cuatro inputs propuestos (frecuencia, duración, # personas, tasa de adopción) son una primera apuesta — vale la pena validar con un sponsor real qué inputs realmente tiene a mano y qué no.
