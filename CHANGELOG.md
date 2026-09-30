# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-09-30

### Added
- Implementación de **memoria de conversación contextual** en el Bot de Telegram (`sliding window` de mensajes por usuario) para mantener el hilo de la charla en tiempo real.
- Optimización del flujo de interacción eliminando saludos y muletillas de despedida repetitivas en cada respuesta una vez iniciada la conversación.
- Calibración del lenguaje del asistente IA a un tono atento, fluido, conciso y profesional, yendo directo a la información solicitada en tallos.

## [1.2.0] - 2026-09-30

### Added
- Configuración maestra en `endpoints.yaml` para incluir los módulos de floristería: `flor_bancos`, `flor_traslado_camas`, `flor_lote_siembra`, `flor_cosecha_list`, `flor_proceso_cosechas_in`, `flor_orden_venta` y `facturacion_informe_ventas_general`.
- Transformación completa a la unidad de negocio **TALLOS** (eliminación de kg).
- Modelado y visualización del flujo completo de cultivo en 5 etapas:
  1. Bancos (Propagación / Plantas Madres)
  2. Traslado (Enraizamiento / Bandejas)
  3. Lote Siembra (Siembra en campo)
  4. Cosecha (Tallos cosechados vs. diferencia pendiente en campo)
  5. Clasificación (Cuarto Caliente / Postcosecha con Grados A, B, C, Nacional, Desperdicio compost y curva de apertura al 80%).
- Módulo de Disponibilidad ATP en tallos y Semáforo de Cupos por Vendedor (Santiago, Giovanni, Finca).
- Módulo de Facturación e Informes de Ventas General extraído desde Génesis ERP con desglose por cliente, destino y precio unitario por tallo.
- Actualización de comandos y prompts del Bot de Telegram (`/hoy`, `/etapas`, `/apertura`, `/disponible`, `/cupos`, `/ventas`, `/puedo`).
- Actualización de la Mini App Comercial con dashboard interactivo glassmorphism optimizado para iPad y presentación en ExpoFlor.

### Fixed
- Error de lectura de JSON donde los parámetros incorrectos de la API (ej: `flor_cosecha_doc` y `flor_proceso_doc`) retornaban HTML; corregido y sustituido por `flor_cosecha_list`.
- Error en la agregación histórica en `update_silver.js` donde el script duplicaba sumas al iterar por extracciones repetidas en la misma fecha. Ahora deduplica apropiadamente basándose en el campo de código primario.
