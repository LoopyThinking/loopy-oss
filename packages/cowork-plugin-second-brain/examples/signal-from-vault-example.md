# Ejemplo: Señal emitida desde un Daily Note

Este documento muestra cómo se vería una señal generada por `loopy-kb-push` a partir de actividad detectada en un daily note del vault. La señal se emite via `loopy-bridge` con intent `"send_signal"`.

---

## Origen: Daily Note `2026-05-06.md`

Contenido relevante detectado en el daily note:

```markdown
## Decisiones
- Decidido: Migrar el pipeline de datos a Apache Iceberg en lugar de seguir con particiones manuales.
  Motivo: El equipo de data engineering reportó que el esquema actual no escala para Q3.
  Responsable: @maria
  Loop relacionado: Pipeline de datos

## Tareas completadas
- [x] Terminé el spike de Iceberg con Apache Spark — resultados positivos, formato validado
- [x] Revisé el PR #342 de la API de eventos — aprobado y mergeado

## Aprendizajes
- Aprendido: El nuevo formato de Iceberg reduce el time-to-query en 40% vs el esquema de particiones anterior.
  Fuente: Spike de validación con datos reales de producción (2TB)
```

## Señal generada

El plugin `loopy-kb-push` detecta una decisión, una tarea completada y un aprendizaje relacionados con el loop "Pipeline de datos". Construye esta señal:

```json
{
  "session_key": "<LOOPY_SESSION_KEY>",
  "intent": "send_signal",
  "to": "echo",
  "message": {
    "loop_name": "Pipeline de datos",
    "signal_type": "insight",
    "source": "daily_note",
    "source_date": "2026-05-06",
    "result": "Decisión tomada: migrar a Apache Iceberg. Spike de validación completado con resultados positivos (40% mejora en time-to-query). PR #342 mergeado.",
    "severity": "info",
    "context": {
      "decision": "Migrar pipeline de datos a Apache Iceberg",
      "motivo": "El esquema actual no escala para Q3",
      "responsable": "@maria",
      "validacion": "Spike con Apache Spark sobre 2TB de datos reales — time-to-query reducido en 40%",
      "accion_completada": "PR #342 (API de eventos) revisado y mergeado"
    }
  }
}
```

## Preview mostrado al usuario

Antes de emitir, el plugin muestra:

```
📤 Señal a emitir ──────────────────────────────
Loop:       Pipeline de datos
Tipo:       insight
Resultado:  Decisión tomada: migrar a Apache Iceberg.
            Spike validado: 40% mejora en queries.
            PR #342 mergeado.
Severidad:  info
Origen:     Daily note 2026-05-06
─────────────────────────────────────────────────
¿Emitir esta señal? [sí] [no] [editar antes de enviar]
```

## Flujo completo

```
Daily Note (vault)
    │
    ▼
loopy-kb-push detecta contenido relevante
    │
    ▼
Mapea contenido → loop "Pipeline de datos"
    │
    ▼
Construye signal_data (JSON arriba)
    │
    ▼
Muestra preview al usuario
    │
    ▼
[Usuario confirma]
    │
    ▼
loopy-bridge emite POST a Loopy API
    │
    ▼
Loop "Pipeline de datos" recibe la señal
    │
    ▼
Reporte: "Emitida 1 señal al loop Pipeline de datos."
```

## Reglas aplicadas en este ejemplo

1. **No emitir sin preview** — el plugin siempre muestra lo que va a enviar antes de enviarlo.
2. **Mapeo por nombre de loop** — el plugin detecta "Pipeline de datos" mencionado en el daily note y lo asocia al loop correspondiente.
3. **Solo contenido concreto** — decisiones, tareas completadas y aprendizajes. No se emiten señales por notas sueltas o borradores.
4. **Contexto enriquecido** — la señal incluye el motivo de la decisión, responsable y datos de validación.
5. **Fuente trazable** — la señal registra que viene del daily note del 2026-05-06 para evitar duplicados.
