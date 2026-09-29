#!/usr/bin/env bash
set -euo pipefail

# 1. Run Genesis Extractor
echo "Running Genesis Extractor..."
cd /home/mlogacho/genesis-extractor
source .venv/bin/activate
./run.sh
deactivate

# 2. Update Silver KPIs
echo "Updating Silver KPIs..."
cd /home/mlogacho/gypso-app
export BRONZE_DIR="/home/mlogacho/genesis-extractor/bronze/genesis_agricola_actividades"
node update_silver.js

echo "Sync completed successfully."
