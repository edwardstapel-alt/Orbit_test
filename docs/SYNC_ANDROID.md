# Android en Web Versies Synchroniseren

## Het Probleem

De Android app en web versie gebruiken **dezelfde code**, maar:
- **Web**: Gebruikt de `dist` folder (nieuwste build)
- **Android**: Gebruikt `android/app/src/main/assets/public` (oude build)

Als je code wijzigt, moet je **beide** updaten!

## Oplossing: Automatische Sync

### Stap 1: Build de web versie
```bash
npm run build
```

Dit maakt een nieuwe build in de `dist` folder.

### Stap 2: Sync naar Android
```bash
npx cap sync android
```

Dit kopieert de `dist` folder naar `android/app/src/main/assets/public`.

### Stap 3: Rebuild Android app
```bash
# In Android Studio:
# Build > Rebuild Project
# Of via command line:
cd android
./gradlew assembleDebug
```

## Automatisch Script

Ik heb een script gemaakt dat dit automatisch doet:

```bash
./scripts/sync-android.sh
```

Of handmatig:

```bash
npm run build && npx cap sync android
```

## Workflow voor Development

### Tijdens Development (Web):
```bash
npm run dev
```
- Werkt alleen op web (localhost:3000)
- Android app wordt NIET automatisch geüpdatet

### Voor Android Testing:
1. **Stop de dev server** (Ctrl+C)
2. **Build en sync:**
   ```bash
   npm run build
   npx cap sync android
   ```
3. **Open Android Studio:**
   ```bash
   open -a "Android Studio" android
   ```
4. **Run de app** (Shift+F10 of klik Run)

### Snelle Test (zonder Android Studio):
```bash
npm run build
npx cap sync android
npx cap run android
```

## Belangrijk om te Weten

1. **Code is hetzelfde**: Beide versies gebruiken exact dezelfde React code
2. **Build is anders**: Web gebruikt `dist`, Android gebruikt `android/app/src/main/assets/public`
3. **Sync is nodig**: Na elke code wijziging moet je `npx cap sync android` draaien
4. **Firebase werkt op beide**: Firebase sync werkt op zowel web als Android (als je ingelogd bent)

## Troubleshooting

### "Android app toont oude versie"
- ✅ Run `npm run build` (nieuwe build maken)
- ✅ Run `npx cap sync android` (sync naar Android)
- ✅ Rebuild Android app in Android Studio

### "Android app crasht"
- ✅ Check of alle dependencies zijn geïnstalleerd: `npm install`
- ✅ Check of build succesvol was: `npm run build`
- ✅ Check Android Studio logs voor errors

### "Firebase werkt niet op Android"
- ✅ Check of je ingelogd bent (Settings → Cloud Sync)
- ✅ Check of Firebase configuratie correct is
- ✅ Check Android logs voor Firebase errors

## Tips

- 💡 **Development**: Gebruik web (`npm run dev`) voor snelle iteratie
- 💡 **Testing**: Build en sync naar Android voor echte device testing
- 💡 **Production**: Build beide versies voor deployment

