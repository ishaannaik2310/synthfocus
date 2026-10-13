#!/usr/bin/env bash
cd "$(dirname "$0")"
./stop.sh "$@"
echo ""
echo "Press [Enter] to close this window..."
read -r
