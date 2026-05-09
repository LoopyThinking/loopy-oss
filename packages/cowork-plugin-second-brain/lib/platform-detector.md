# Platform Capability Detector

Cómo detectar si el usuario está en Loopy OSS o en loopythinking.ai (paid). Esta detección determina qué skills están disponibles y qué capacidades tiene la plataforma.

## Endpoint de detección

```
POST https://efsyebiumgieglwvxiss.supabase.co/functions/v1/mc-bridge/a2a/inbound
```

## Payload

```json
{
  "session_key": "<LOOPY_SESSION_KEY>",
  "intent": "general",
  "to": "orion",
  "message": "¿Qué capacidades organizacionales están disponibles en esta sesión? ¿Es una cuenta OSS o de la plataforma?"
}
```

## Interpretación de la respuesta

| Respuesta contiene | Plataforma detectada | Significado |
|--------------------|---------------------|-------------|
| Capacidades organizacionales, multi-tenant, team features | `paid` | Cuenta de loopythinking.ai — todos los skills disponibles |
| Limitaciones, solo features individuales | `oss` | Cuenta Loopy OSS — skills personales únicamente |
| Error o sin respuesta | `oss` (fail safe) | Asumir OSS por seguridad |

## Capacidades por plataforma

| Feature | `oss` | `paid` |
|---------|-------|--------|
| loopy-kb-pull | ✅ | ✅ |
| loopy-kb-push | ✅ | ✅ |
| loopy-kb-enrich | ✅ | ✅ |
| loopy-org-kb | ❌ | ✅ |
| Distribución multi-vault | ❌ | ✅ |
| Insights de equipo en vault | ❌ | ✅ |
| Permisos por loop en vault | ❌ | ✅ |

## Uso en skills

Antes de ejecutar cualquier skill que dependa de la plataforma:

1. Verificar que `LOOPY_SESSION_KEY` existe en el entorno.
2. Si no existe, invocar `loopy-bridge` para autenticación.
3. Ejecutar la detección de plataforma.
4. Cachear el resultado durante la sesión (no re-detectar en cada llamada).
5. Si el skill requiere `paid` y la plataforma es `oss`, informar al usuario con el mensaje: "Este skill requiere loopythinking.ai. Tu cuenta actual es Loopy OSS."

## Fail safe

Ante cualquier error de conexión o respuesta inesperada, asumir `platform: "oss"`. Es mejor degradar funcionalidad que ofrecer capacidades que no existen.
