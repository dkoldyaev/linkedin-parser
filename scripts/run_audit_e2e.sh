#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Fixed isolated project and standalone file: never use working Compose volumes.
docker compose -p linkedinparser-audit -f docker-compose.e2e.yml down -v --remove-orphans
docker compose -p linkedinparser-audit -f docker-compose.e2e.yml up -d
./.venv/bin/python scripts/audit_e2e.py
