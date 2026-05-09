# Vault Conventions

Convenciones por defecto cuando el vault no tiene `_CLAUDE.md`. Estas reglas gobiernan cómo el plugin lee y escribe en el vault del usuario.

## Convenciones por defecto

| Convención | Valor | Notas |
|------------|-------|-------|
| Carpeta de loops | `Projects/Loops/` | Fallback: raíz del vault |
| Carpeta de señales | `00 - Inbox/` | Fallback: raíz del vault |
| Frontmatter mínimo | `date`, `tags`, `status` | Todo archivo creado por el plugin debe incluir estos tres campos |
| Tag de loop | `loop` | Todo archivo que represente un loop debe tener este tag |
| Formato de fecha | `YYYY-MM-DD` | ISO 8601 sin hora |
| Wikilinks | `[[nombre-sin-extensión]]` | Formato estándar de Obsidian |

## Frontmatter mínimo requerido

```yaml
---
date: YYYY-MM-DD
tags:
  - loop
  - loopy
status: activo
---
```

Si el vault tiene frontmatter obligatorio adicional (detectado en `_CLAUDE.md`), incluirlo siempre.

## Detección automática de estructura

El plugin determina dónde guardar las notas según la estructura existente del vault, en este orden:

1. **Leer `_CLAUDE.md`** — Si existe, extraer el folder map y usar las rutas que defina.
2. **Detectar carpeta `00 - Inbox/`** — Indica estructura PARA (Obsidian Second Brain). Los loops van en `Projects/Loops/`.
3. **Detectar carpeta `wiki/`** — Indica estructura wiki-style. Los loops van en `wiki/loops/`.
4. **Sin estructura clara** — Crear carpeta `Loops/` en la raíz del vault. Señales van a la raíz.

## Reglas de lectura

- Leer `_CLAUDE.md` completo si existe para entender reglas de frontmatter y carpetas.
- Respetar cualquier convención de nomenclatura definida por el usuario.
- No asumir estructura sin verificarla primero.

## Reglas de escritura

- Nunca borrar contenido escrito por el usuario. Solo agregar o actualizar secciones delimitadas por el plugin.
- La sección `## Notas personales` es inviolable — el plugin nunca la toca.
- Si una nota ya existe, solo actualizar: señales recientes, estado del loop, pasos modificados.
- Mantener el frontmatter existente; solo agregar campos que falten.
