# Trámites Perú RAG

Chat en español sobre trámites SUNAT para trabajadores independientes. Siempre con la fuente oficial. Si no sabe, dice "No sé".

> **Demo en construcción (semana 2 de 3).** No es un servicio oficial de SUNAT. No es asesoría tributaria. Las reglas cambian: verifica siempre en la fuente oficial.

## Estado

- Fuentes: 12 páginas oficiales de `gob.pe` y `orientacion.sunat.gob.pe` (ver `corpus/sources.json`, con la fecha de revisión de cada una).
- Búsqueda en el navegador: MiniSearch (BM25) + stemmer Snowball en español. Sin servidor, sin costo.
- Puerta "No sé": código, no IA. Umbral congelado en `evals/threshold.json`, fijado solo con `evals/tune.json`.
- Evaluación con preguntas no usadas para ajustar (`evals/test.json`, 24 casos, 2026-11-19): fuente correcta en el top 3 en **14/16**; "No sé" con precisión **0.71** y recall **0.63** (8 casos fuera de tema). Es un set pequeño. Detalle en `evals/results/`.

Próximo (semana 3): interfaz web, respuestas de ejemplo con citas verificadas, modo opcional con tu propia clave de Anthropic (Claude), despliegue en GitHub Pages.

## Correr localmente

```bash
npm ci
npm run build-index
npm test && npm run eval
```

Otros: `npm run snapshot` (vuelve a descargar las fuentes), `npm run check-live` (revisa que las páginas oficiales no cambiaron).

## Fuentes

Texto de páginas públicas del Estado peruano (gob.pe, SUNAT). Cada fuente guarda su URL y la fecha de revisión. El texto pertenece a su fuente. Código: MIT.

Hecho por [Mapagino](https://mapagino.com/services).
