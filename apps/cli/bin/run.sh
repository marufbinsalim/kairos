#!/usr/bin/env bash
# Run as ts-node during development
ts-node --project "$(dirname "$0")/../tsconfig.json" "$(dirname "$0")/../src/index.ts" "$@"
