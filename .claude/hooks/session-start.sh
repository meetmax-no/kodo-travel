#!/bin/bash
# Oppstarts-hook for Claude Code på web.
# Kjører automatisk når en ny økt starter, og installerer avhengigheter
# HVIS prosjektet har dem. Trygg å kjøre flere ganger (idempotent).
set -euo pipefail

echo "🔧 Starter oppsett av prosjektet…"

# --- Node / npm ---
if [ -f package.json ]; then
  echo "📦 Fant package.json → installerer npm-avhengigheter"
  npm install
fi

# --- Python ---
if [ -f requirements.txt ]; then
  echo "🐍 Fant requirements.txt → installerer Python-avhengigheter"
  pip install -r requirements.txt
elif [ -f pyproject.toml ]; then
  echo "🐍 Fant pyproject.toml → installerer med pip"
  pip install -e . || true
fi

# --- Vercel CLI ---
# Sørger for at Vercel CLI er tilgjengelig i økta. Feiler ikke hooken hvis
# installasjonen ikke går gjennom (f.eks. blokkert nett) — da hoppes den bare over.
if command -v vercel >/dev/null 2>&1; then
  echo "▲ Vercel CLI er allerede på plass ($(vercel --version 2>/dev/null))"
else
  echo "▲ Installerer Vercel CLI…"
  if npm install -g vercel >/dev/null 2>&1; then
    echo "▲ Vercel CLI installert ($(vercel --version 2>/dev/null))"
  else
    echo "⚠️  Klarte ikke installere Vercel CLI (hopper over) — kjør «npm i -g vercel» manuelt ved behov."
  fi
fi

echo "✅ Prosjektet er klart. God koding!"
