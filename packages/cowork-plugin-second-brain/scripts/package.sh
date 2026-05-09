#!/usr/bin/env bash
set -euo pipefail

# Package loopy-second-brain as a .plugin bundle.
# Output: dist/loopy-second-brain-<version>.plugin (zip of plugin.json + skills/)

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./plugin.json').version" 2>/dev/null || echo "0.1.0")
OUTDIR="dist"
BUNDLE="$OUTDIR/loopy-second-brain-$VERSION.plugin"

rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

echo "Packaging loopy-second-brain v$VERSION..."

# Build a zip containing only plugin.json and skills/
zip -r "$BUNDLE" plugin.json skills/ \
  -x "*.DS_Store" \
  -x "skills/*/.DS_Store"

echo "  → $BUNDLE"
echo "  → $(unzip -l "$BUNDLE" | tail -1 | awk '{print $2}') files"
echo "Done."
