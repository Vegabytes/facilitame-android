#!/bin/bash
# Run this after March 1 when EAS credits reset
# Usage: cd C:\f && bash build-and-submit.sh

echo "=== Building Android + iOS production ==="
npx eas build --platform all --profile production --non-interactive

echo ""
echo "=== When builds finish, run: ==="
echo "npx eas submit --platform all --profile production"
