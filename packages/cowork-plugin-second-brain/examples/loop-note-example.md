---
date: 2026-05-06
tags:
  - loop
  - loopy
  - individual
status: activo
loop_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
loop_url: https://loopythinking.ai/loops/a1b2c3d4-e5f6-7890-abcd-ef1234567890
frecuencia: Cada 6 horas
ultima_senal: 2026-05-06
---

# Revisión de métricas de crecimiento

> Loop personal que monitorea las métricas clave de crecimiento del producto y alerta sobre desviaciones significativas.

## ¿Qué resuelve?

Detectar tempranamente caídas en métricas de adopción y retención antes de que se conviertan en problemas estructurales. Centraliza la información de múltiples fuentes (analytics, encuestas, soporte) en un solo pulso operativo.

## Pasos activos

### 🔍 Monitoreo
- **Para qué:** Detectar desviaciones en DAU, WoW growth y churn rate
- **Cómo saberlo:** Comparando los datos diarios de analytics contra los thresholds definidos
- **Alerta cuando:** DAU cae >5% vs semana anterior, o churn rate supera 3% mensual
- **Frecuencia:** Cada 6 horas

### 📊 Análisis
- **Para qué:** Entender la causa raíz de cualquier desviación detectada
- **Cómo hacerlo:** Correlacionar con releases recientes, cambios en onboarding, y feedback de soporte
- **Frecuencia:** Bajo demanda (al detectar alerta)

### ⚡ Acción
- **Para qué:** Activar el plan de respuesta cuando se confirma una desviación negativa
- **Qué hacer:** Notificar al equipo de producto, preparar dashboard de impacto, convocar war room si es crítico
- **Disparador:** Alerta confirmada por el paso de análisis

### 💡 Aprendizaje
- **Para qué:** Documentar patrones de crecimiento y decay para mejorar predicciones futuras
- **Cómo hacerlo:** Registrar cada incidente con causa, acción tomada y resultado
- **Registrar en:** Base de conocimiento de producto > Patrones de crecimiento

## Señales recientes

| Fecha | Resultado | Severidad |
|-------|-----------|-----------|
| 2026-05-06 | DAU estable. WoW growth +2.1%. Sin alertas. | normal |
| 2026-05-05 | DAU estable. WoW growth +1.8%. Churn 1.9%. | normal |
| 2026-05-04 | Leve caída en DAU (-2.1%). Analizado: día feriado en 3 mercados. Falso positivo. | baja |
| 2026-05-03 | DAU en recuperación. WoW growth +1.2%. | normal |
| 2026-05-02 | DAU estable. Sin novedades. | normal |

## Contexto del vault

> Esta sección es generada por loopy-kb-enrich. Vincula este loop con tu conocimiento existente.

- [[Métricas de Producto Q1 2026]] — Dashboard de métricas del último quarter
- [[Estrategia de Crecimiento 2026]] — Documento de estrategia que define los targets de este loop
- [[Onboarding V3]] — Proyecto relacionado: el nuevo onboarding podría impactar las métricas de retención

## Notas personales

<!-- Tus reflexiones sobre este loop. Claude no toca esta sección. -->

---
*Sincronizado desde Loopy · 2026-05-06 · [[index]]*
