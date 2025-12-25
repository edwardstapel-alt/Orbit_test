#!/bin/bash

echo "🔐 GitHub Push met Personal Access Token"
echo ""
echo "Je hebt een Personal Access Token nodig van GitHub."
echo ""
echo "📝 Maak een token aan:"
echo "1. Ga naar: https://github.com/settings/tokens"
echo "2. Klik 'Generate new token' → 'Generate new token (classic)'"
echo "3. Naam: 'Orbit Deploy'"
echo "4. Scope: vink 'repo' aan"
echo "5. Klik 'Generate token'"
echo "6. Kopieer de token (je ziet hem maar 1x!)"
echo ""
read -p "Druk op Enter als je de token hebt gekopieerd..."

read -sp "Plak je GitHub Personal Access Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Geen token ingevoerd."
    exit 1
fi

echo ""
echo "📤 Pushen naar GitHub..."
git push https://${TOKEN}@github.com/edwardstapel-alt/Orbit_test.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Succesvol gepusht naar GitHub!"
    echo "🌐 Check: https://github.com/edwardstapel-alt/Orbit_test"
else
    echo ""
    echo "❌ Push gefaald. Controleer je token en rechten."
fi










