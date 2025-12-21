# 📱 Android Studio Installatie

## Stap 1: Download Android Studio

1. Ga naar: **https://developer.android.com/studio**
2. Klik op **"Download Android Studio"**
3. Download de versie voor macOS (Apple Silicon of Intel, afhankelijk van je Mac)

## Stap 2: Installeer Android Studio

1. Open het gedownloade `.dmg` bestand
2. Sleep **Android Studio** naar de **Applications** folder
3. Open Android Studio uit Applications
4. Volg de setup wizard:
   - Accepteer de licentie
   - Kies "Standard" installatie
   - Wacht tot alle SDK components zijn gedownload (kan 10-15 minuten duren)

## Stap 3: Configureer Capacitor

Na installatie, voer dit uit in je terminal:

```bash
# Als Android Studio op een andere locatie staat:
export CAPACITOR_ANDROID_STUDIO_PATH="/Applications/Android Studio.app"

# Of voeg dit permanent toe aan je ~/.zshrc:
echo 'export CAPACITOR_ANDROID_STUDIO_PATH="/Applications/Android Studio.app"' >> ~/.zshrc
source ~/.zshrc
```

## Stap 4: Open je Project

```bash
npx cap open android
```

## ✅ Klaar!

Android Studio opent nu automatisch met je Orbit Dashboard project.

