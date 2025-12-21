# Hoe test je Firebase Sync tussen Android en Web?

## Stap 1: Zorg dat je op beide devices ingelogd bent

### Op Web (localhost:3000):
1. Ga naar **Settings** → **Cloud Sync**
2. Log in met je email/password of Google account
3. Je ziet nu "Authenticated!" met sync status

### Op Android:
1. Open de app op je telefoon
2. Ga naar **Settings** → **Cloud Sync**
3. Log in met **hetzelfde account** als op web
4. Je ziet ook "Authenticated!" met sync status

## Stap 2: Test de sync

### Test 1: Web → Android
1. **Op web**: Maak een nieuwe taak aan (bijv. "Test sync van web")
2. Wacht 2-3 seconden
3. **Op Android**: Refresh de app (swipe down of herstart)
4. ✅ De taak zou nu moeten verschijnen op Android

### Test 2: Android → Web
1. **Op Android**: Maak een nieuwe taak aan (bijv. "Test sync van Android")
2. Wacht 2-3 seconden
3. **Op Web**: Refresh de pagina (F5)
4. ✅ De taak zou nu moeten verschijnen op web

### Test 3: Real-time sync (geavanceerd)
1. Open beide devices naast elkaar
2. Maak een taak op één device
3. ✅ De taak zou **automatisch** moeten verschijnen op het andere device (zonder refresh)

## Stap 3: Check sync status

### In de app:
- **Settings** → **Cloud Sync** → Je ziet:
  - ✅ "Authenticated!" = Je bent ingelogd
  - ✅ "Sync Status: Active" = Sync werkt
  - ✅ "Real-time Sync: Enabled" = Real-time updates actief

### In Firebase Console:
1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Selecteer project: **orbit-e1a7e**
3. Ga naar **Firestore Database** → **Data** tab
4. Je zou moeten zien: `users/{jouw-user-id}/tasks/...`
5. Maak een taak aan in de app → Je zou deze direct moeten zien verschijnen in Firebase

## Troubleshooting

### "Ik zie mijn data niet op het andere device"
- ✅ Check of je op beide devices met **hetzelfde account** bent ingelogd
- ✅ Check of je "Authenticated!" ziet op beide devices
- ✅ Wacht 5-10 seconden (sync kan even duren)
- ✅ Refresh de app/website
- ✅ Check de browser console (F12) voor errors

### "Ik zie 'Not connected' in Settings"
- ✅ Je bent niet ingelogd → Ga naar Settings → Cloud Sync → Log in

### "Sync werkt niet"
- ✅ Check of je internetverbinding hebt
- ✅ Check of Firebase Security Rules correct zijn ingesteld
- ✅ Check de browser console (F12) voor errors
- ✅ Probeer uit te loggen en opnieuw in te loggen

### "Data verschijnt niet in Firebase Console"
- ✅ Check of je de juiste Firebase project hebt geselecteerd
- ✅ Check of Security Rules zijn gepubliceerd
- ✅ Check of je ingelogd bent in de app

## Belangrijk om te weten

1. **Sync is automatisch**: Alle wijzigingen worden automatisch gesynchroniseerd
2. **Real-time**: Wijzigingen verschijnen binnen enkele seconden op andere devices
3. **Offline support**: Wijzigingen worden opgeslagen lokaal en gesynchroniseerd zodra je weer online bent
4. **Eerste sync**: Bij eerste login wordt je lokale data geüpload naar Firebase
5. **Conflicten**: Als je op beide devices tegelijk wijzigt, wint de laatste wijziging (Firebase timestamp)

## Tips

- 💡 Test eerst met simpele data (zoals taken) voordat je complexe data test
- 💡 Gebruik verschillende kleuren/namen op verschillende devices om te zien welke data van welk device komt
- 💡 Check Firebase Console om te zien of data daadwerkelijk wordt gesynchroniseerd
- 💡 Real-time sync werkt het beste als beide devices online zijn

