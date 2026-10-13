#!/usr/bin/env bash
cd "$(dirname "$0")"
./deploy-aws.sh "$@"
echo ""
echo "Press [Enter] to exit..."
read -r
