#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Sincronización Automática Diaria con Génesis ERP (Cada 24 horas)
# Gypsophila Polar Bear - Arquitectura de Datos Bronze & Silver
# ==============================================================================

LOG_DIR="/home/mlogacho/logs"
LOG_FILE="${LOG_DIR}/sync.log"
mkdir -p "${LOG_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Rotación de logs simple para proteger espacio en disco (< 5 MB)
if [ -f "${LOG_FILE}" ]; then
    FILE_SIZE=$(stat -c%s "${LOG_FILE}" 2>/dev/null || stat -f%z "${LOG_FILE}" 2>/dev/null || echo 0)
    if [ "${FILE_SIZE}" -gt 5242880 ]; then
        mv "${LOG_FILE}" "${LOG_DIR}/sync_$(date '+%Y%m%d_%H%M%S').log.bak"
        # Mantener solo los últimos 7 respaldos de logs
        ls -tp "${LOG_DIR}"/sync_*.log.bak 2>/dev/null | grep -v '/$' | tail -n +8 | xargs -I {} rm -- "{}" 2>/dev/null || true
    fi
fi

log "========================================================================"
log "INICIO DE SINCRONIZACIÓN DIARIA (GÉNESIS ERP -> BRONZE -> SILVER)"
log "========================================================================"

START_TIME=$(date +%s)

# 1. Extracción de Capa Bronze (Genesis Extractor)
log "Paso 1: Ejecutando extractor de Génesis (Python)..."
cd /home/mlogacho/genesis-extractor

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

if ./run.sh >> "${LOG_FILE}" 2>&1; then
    log "✓ Extracción Bronze completada con éxito."
else
    log "⚠️ Alerta: El extractor de Génesis reportó advertencias o errores. Continuando con actualización Silver..."
fi

if [ -d ".venv" ]; then
    deactivate || true
fi

# 2. Agregación de Capa Silver & Histórico (Node.js)
log "Paso 2: Procesando Capa Silver y KPIs de Floración/Ventas (Node.js)..."
cd /home/mlogacho/gypso-app
export BRONZE_DIR="/home/mlogacho/genesis-extractor/bronze/genesis_agricola_actividades"

if node update_silver.js >> "${LOG_FILE}" 2>&1; then
    log "✓ Capa Silver y Bitácora de Sincronización (history_kpis.json) actualizadas correctamente."
else
    log "❌ Error al procesar update_silver.js"
    exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log "========================================================================"
log "SINCRONIZACIÓN FINALIZADA CON ÉXITO en ${DURATION} segundos."
log "Próxima ejecución programada: Dentro de 24 horas (04:00 AM)."
log "========================================================================"
