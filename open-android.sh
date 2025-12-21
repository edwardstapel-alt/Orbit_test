#!/bin/bash

# Script om Android project te openen

ANDROID_STUDIO="/Applications/Android Studio.app"

if [ -d "$ANDROID_STUDIO" ]; then
    echo "✅ Android Studio gevonden!"
    echo "📂 Opening Android project..."
    open -a "Android Studio" "$(pwd)/android"
else
    echo "❌ Android Studio niet gevonden op: $ANDROID_STUDIO"
    echo ""
    echo "📥 Installeer Android Studio:"
    echo "   1. Download van: https://developer.android.com/studio"
    echo "   2. Sleep naar Applications folder"
    echo "   3. Run dit script opnieuw"
    echo ""
    echo "Of open handmatig:"
    echo "   1. Open Android Studio"
    echo "   2. File → Open"
    echo "   3. Selecteer: $(pwd)/android"
fi

