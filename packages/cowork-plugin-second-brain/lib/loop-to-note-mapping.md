# Loop-to-Note Mapping

Mapeo canónico entre los campos de un loop en Loopy y los campos de una nota en el vault. Esta tabla es la referencia única para los skills `loopy-kb-pull` y `loopy-kb-push`.

## Tabla de mapeo

| Campo Loopy | Campo en nota | Transformación |
|-------------|---------------|----------------|
| `nombre` | `title` en frontmatter + `# heading` | Directo |
| `descripcion` | Primer párrafo bajo el heading (blockquote `>`) | Directo |
| `que_resuelve` | Sección `## ¿Qué resuelve?` | Directo |
| `categoria` | `tag` en frontmatter (`individual`/`equipo`/`corporativo`) | Lowercase |
| `loop_id` | `loop_id` en frontmatter | Directo |
| `pasos` | Secciones bajo `## Pasos activos` | Ver template de pasos abajo |
| `monitoreo.frecuencia` | `frecuencia` en frontmatter | Directo |
| Señales recientes | Tabla bajo `## Señales recientes` | Últimas 5 señales |

## Template de pasos

Cada paso del loop se mapea a una subsección dentro de `## Pasos activos`:

```
### 🔍 Monitoreo
- **Para qué:** {monitoreo.para_que}
- **Cómo saberlo:** {monitoreo.como_lo_sabras}
- **Alerta cuando:** {monitoreo.cuando_alertar}
- **Frecuencia:** {monitoreo.frecuencia}

### 📊 Análisis *(si existe)*
- **Para qué:** {analisis.para_que}
- **Cómo hacerlo:** {analisis.como_lo_haras}
- **Frecuencia:** {analisis.frecuencia}

### ⚡ Acción *(si existe)*
- **Para qué:** {accion.para_que}
- **Qué hacer:** {accion.que_hacer}
- **Disparador:** {accion.cuando_ejecutar}

### 💡 Aprendizaje *(si existe)*
- **Para qué:** {aprendizaje.para_que}
- **Cómo hacerlo:** {aprendizaje.como_lo_haras}
- **Registrar en:** {aprendizaje.donde_registrar}
```

Solo se incluyen los pasos que existen en el loop. Si un paso no está presente, se omite la subsección completa.

## Reglas de transformación

1. **Nombres de campos**: el plugin usa los nombres en español tal como vienen del loop (el schema de Loopy está en español).
2. **Categoría a tag**: siempre convertir a lowercase. Ej: `"Equipo"` → `tag: equipo`.
3. **Señales recientes**: máximo 5. Si hay más, mostrar las 5 más recientes por fecha.
4. **Fechas**: siempre en formato `YYYY-MM-DD` (ISO 8601 sin hora).
5. **Campos ausentes**: si un campo no existe en el loop, no se incluye en la nota (no se escribe campo vacío).
