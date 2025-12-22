# 📱 Android Build Instructies

Je Orbit Dashboard app is nu klaar om als Android app gebouwd te worden!

## ✅ Wat is er al gedaan

- ✅ Capacitor is geïnstalleerd
- ✅ Android platform is toegevoegd
- ✅ Project is gebouwd en gesynchroniseerd
- ✅ Android project staat in de `android/` directory

## 🚀 APK Bouwen (Clean Install)

### Stap 1: Open Android Studio

**Optie A: Via Capacitor (als Android Studio geïnstalleerd is)**
```bash
npx cap open android
```

**Optie B: Handmatig openen**
1. Open Android Studio
2. **File** → **Open**
3. Navigeer naar: `Orbit_test/android` directory
4. Klik **OK**

**Optie C: Via script**
```bash
./scripts/open-android.sh
```

> **⚠️ Als je een error krijgt**: Android Studio is niet geïnstalleerd. Zie `INSTALL_ANDROID_STUDIO.md` voor installatie-instructies.

### Stap 2: Wacht tot Android Studio klaar is

- Android Studio laadt het project (kan een paar minuten duren)
- Gradle sync wordt automatisch uitgevoerd
- Wacht tot alle dependencies zijn gedownload

### Stap 3: Build de APK

1. Ga in Android Studio naar het menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wacht tot de build klaar is (ongeveer 1-2 minuten)
3. Je krijgt een melding: **"APK(s) generated successfully"**
4. Klik op **"locate"** om de APK te vinden

### Stap 4: APK Locatie

De APK staat meestal in:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Installeren op je Telefoon

### Optie 1: Via USB (ADB)
```bash
# Verbind je telefoon via USB
# Zorg dat USB debugging aan staat
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Optie 2: Handmatig
1. Kopieer `app-debug.apk` naar je telefoon (via email, cloud, etc.)
2. Open het bestand op je telefoon
3. Sta "Installeren van onbekende bronnen" toe als dat gevraagd wordt
4. Installeer de app

## 🔄 Workflow voor Updates

Elke keer als je code wijzigt:

```bash
# 1. Build je web app
npm run build

# 2. Sync naar Android
npx cap sync

# 3. Open Android Studio
npx cap open android

# 4. Build opnieuw in Android Studio
```

## ⚙️ Configuratie

De app configuratie staat in `capacitor.config.ts`:
- **App ID**: `com.orbit.dashboard`
- **App Name**: `Orbit Dashboard`
- **Web Directory**: `dist`

## 📝 Belangrijke Notities

- **Debug APK**: De eerste build is een debug versie (groot, niet geoptimaliseerd)
- **Release APK**: Voor productie moet je een signed release APK maken (zie Android Studio docs)
- **Permissions**: De app vraagt standaard geen speciale permissions (alleen internet voor fonts)
- **Offline**: Je app werkt offline dankzij PWA caching!

## 🐛 Troubleshooting

### Android Studio opent niet
- Installeer Android Studio: https://developer.android.com/studio
- Zorg dat Java/JDK is geïnstalleerd

### Build errors
- Run `npx cap sync` opnieuw
- In Android Studio: **File** → **Sync Project with Gradle Files**

### App crasht bij openen
- Check de logs in Android Studio (Logcat)
- Run `npm run build` opnieuw en sync

## 🎉 Klaar!

Je hebt nu een volledig werkende Android app van je Orbit Dashboard!

