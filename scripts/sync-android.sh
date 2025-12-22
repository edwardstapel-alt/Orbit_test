#!/bin/bash

# Script om web build te synchroniseren naar Android

echo "🔨 Building web version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📱 Syncing to Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo "✅ Done! Android app is now in sync with web version."
echo ""
echo "Next steps:"
echo "1. Open Android Studio: open -a 'Android Studio' android"
echo "2. Build and run the app (Shift+F10)"
echo ""

