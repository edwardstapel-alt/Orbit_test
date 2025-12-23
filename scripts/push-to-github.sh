#!/bin/bash

# Script om naar GitHub te pushen met Personal Access Token

echo "🚀 GitHub Push Helper"
echo ""
echo "Je hebt een Personal Access Token nodig van GitHub."
echo ""
echo "📝 Stappen:"
echo "1. Ga naar: https://github.com/settings/tokens"
echo "2. Klik 'Generate new token' → 'Generate new token (classic)'"
echo "3. Geef het een naam (bijv. 'Orbit Deploy')"
echo "4. Selecteer scope: 'repo' (alle repo rechten)"
echo "5. Klik 'Generate token'"
echo "6. Kopieer de token (je ziet hem maar 1x!)"
echo ""
read -p "Druk op Enter als je de token hebt gekopieerd..."

read -sp "Plak je GitHub Personal Access Token hier: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Geen token ingevoerd. Probeer opnieuw."
    exit 1
fi

# Update remote URL met token
git remote set-url origin https://${TOKEN}@github.com/edwardstapel-alt/Orbit_test.git

echo ""
echo "📤 Pushen naar GitHub..."
git push origin main

# Reset remote naar normale URL (zonder token in URL)
git remote set-url origin https://github.com/edwardstapel-alt/Orbit_test.git

echo ""
echo "✅ Klaar! Je code staat nu op GitHub."
echo ""
echo "💡 Tip: Voor toekomstige pushes, gebruik GitHub CLI:"
echo "   brew install gh"
echo "   gh auth login"






