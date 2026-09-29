# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Configuración maestra en `endpoints.yaml` para incluir los módulos de floristería: `flor_bancos`, `flor_traslado_camas`, `flor_lote_siembra`, `flor_cosecha_list`.
- Lógica de extracción de datos dinámicos en `update_silver.js` (Capa Silver) para los KPIs del Dashboard:
  - Producción Semanal (deduplicada por `codigo`).
  - Calidad en gramos calculada según tallos cosechados vs bunches empacados.
  - OTIF (ponderado) con base en la salud e integridad de los lotes/bancos sin pérdidas.
  - Backlog de producción, calculado mediante la resta de proyecciones de campo contra cosechas efectivas.
- Implementación de un historial acumulativo `history_kpis.json` para dibujar gráficas temporales de los KPIs en el front.

### Fixed
- Error de lectura de JSON donde los parámetros incorrectos de la API (ej: `flor_cosecha_doc` y `flor_proceso_doc`) retornaban HTML; corregido y sustituido por `flor_cosecha_list`.
- Error en la agregación histórica en `update_silver.js` donde el script duplicaba sumas al iterar por extracciones repetidas en la misma fecha. Ahora deduplica apropiadamente basándose en el campo de código primario.
