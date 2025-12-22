# APK Build Instructies

## Status

✅ **Web build**: Klaar (`dist` folder)
✅ **Android sync**: Klaar (code gekopieerd naar Android)
❌ **APK build**: Vereist Android Studio of Java SDK

## Optie 1: Via Android Studio (Aanbevolen)

1. **Open Android Studio:**
   ```bash
   open -a "Android Studio" android
   ```

2. **Wacht tot project is geladen** (kan even duren de eerste keer)

3. **Build de APK:**
   - Klik op **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Of gebruik de shortcut: **Ctrl+Shift+A** (Windows/Linux) of **Cmd+Shift+A** (Mac)
   - Type "Build APK" en druk Enter

4. **APK locatie:**
   - Na build: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Android Studio toont een notificatie met "locate" link

## Optie 2: Via Command Line (vereist Java SDK)

Als je Java SDK hebt geïnstalleerd:

```bash
cd android
./gradlew assembleDebug
```

APK wordt gemaakt in: `android/app/build/outputs/apk/debug/app-debug.apk`

## Optie 3: Release APK (voor distributie)

Voor een release APK (geoptimaliseerd, kleiner):

```bash
cd android
./gradlew assembleRelease
```

APK wordt gemaakt in: `android/app/build/outputs/apk/release/app-release.apk`

**Let op:** Release APK moet worden gesigneerd. Zie Android Studio documentatie.

## Installeren op je Pixel 9 Pro

1. **Zet APK over naar je telefoon:**
   - Via USB: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
   - Via email/cloud: Upload APK en download op telefoon

2. **Installeer op telefoon:**
   - Open APK bestand
   - Sta "Install from unknown sources" toe (als nodig)
   - Klik "Install"

## Troubleshooting

### "Java not found"
- Installeer Java SDK: https://www.oracle.com/java/technologies/downloads/
- Of gebruik Android Studio (heeft ingebouwde Java)

### "Gradle build failed"
- Open Android Studio en laat het project synchroniseren
- Check of alle dependencies zijn gedownload
- Probeer: **File** → **Sync Project with Gradle Files**

### "APK is te groot"
- Dit is normaal voor development builds
- Release builds zijn kleiner (maar vereisen signing)

## Snelle Commands

```bash
# Build web + sync Android
npm run sync:android

# Open Android Studio
open -a "Android Studio" android

# Build APK via command line (als Java beschikbaar is)
cd android && ./gradlew assembleDebug
```

