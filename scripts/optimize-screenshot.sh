#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

SRC="$1"
DEST=$(echo -n "$1" | sed "s|../../dist/assets/|public/|")

if git checkout -- "$DEST" > /dev/null 2>&1; then
  if perceptualdiff -downsample 2 -colorfactor 0.5 "$SRC" "$DEST" > /dev/null; then
    echo "$DEST (unchanged)"
    exit 0
  fi
else
  mkdir -p "$(dirname "$DEST")"
fi

cp "$SRC" "$DEST"
optipng -q -o5 "$DEST"
advpng -z -q -4 "$DEST"

BEFORE=$(wc -c < "$SRC")
AFTER=$(wc -c < "$DEST")
PERCENTAGE=$(( $AFTER * 100 / $BEFORE ))

echo "$DEST ($PERCENTAGE%)"
exit 0
