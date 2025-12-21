# 📱 Android SDK Installatie Instructies

## ⚠️ Belangrijk: SDK moet eerst geïnstalleerd worden

De Android SDK is nog niet geïnstalleerd. Volg deze stappen:

## Stap 1: Open Android Studio

```bash
npx cap open android
```

Of open Android Studio handmatig en open het `android` project.

## Stap 2: Installeer SDK via SDK Manager

1. In Android Studio: **Tools** → **SDK Manager**
2. Ga naar het tabblad **"SDK Platforms"**
3. Vink aan:
   - ✅ **Android 15.0 (API 36)** - Dit is vereist voor je project
   - ✅ **Android 14.0 (API 34)** - Aanbevolen als fallback
4. Ga naar het tabblad **"SDK Tools"**
5. Vink aan:
   - ✅ **Android SDK Build-Tools**
   - ✅ **Android SDK Command-line Tools**
   - ✅ **Android SDK Platform-Tools**
   - ✅ **Android SDK Tools**
6. Klik **"Apply"** en wacht tot alles is gedownload (10-15 minuten)

## Stap 3: Controleer SDK Locatie

Na installatie staat de SDK meestal in:
```
~/Library/Android/sdk
```

## Stap 4: Build de APK

Zodra de SDK is geïnstalleerd:

### Via Android Studio (aanbevolen):
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wacht tot build klaar is
3. Klik **"locate"** om de APK te vinden

### Via Command Line:
```bash
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew assembleDebug
```

De APK staat dan in: `android/app/build/outputs/apk/debug/app-debug.apk`

## ✅ Na installatie

Zodra de SDK is geïnstalleerd, kun je de APK bouwen zonder problemen!

