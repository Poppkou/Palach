#!/bin/sh
# Wraps the artifact body (game.html) into a standalone page for GitHub Pages.
cd "$(dirname "$0")"
{ printf '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n</head><body>\n'; cat game.html; printf '\n</body></html>\n'; } > index.html
