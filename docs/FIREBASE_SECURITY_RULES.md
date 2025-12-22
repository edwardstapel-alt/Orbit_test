# Firebase Security Rules

## Belangrijk: Security Rules Instellen

Om je data veilig te houden, moet je Security Rules instellen in Firebase Console.

### Stap 1: Ga naar Firestore Database
1. In Firebase Console: Klik op **"Firestore Database"** in het menu
2. Klik op de **"Rules"** tab (bovenaan)

### Stap 2: Plak deze Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      // Allow read/write only if authenticated and accessing own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Stap 3: Publish Rules
- Klik op **"Publish"** om de rules op te slaan

---

## Wat deze Rules doen

- ✅ **Alleen ingelogde gebruikers** kunnen data lezen/schrijven
- ✅ **Gebruikers kunnen alleen hun eigen data** zien (`users/{userId}/...`)
- ✅ **Geen toegang** tot data van andere gebruikers
- ✅ **Alle andere paden** zijn geblokkeerd

---

## Test de Rules

Na het publiceren van de rules:
1. Test in je app of je data kunt lezen/schrijven (zou moeten werken)
2. Test of je data van andere gebruikers NIET kunt lezen (zou moeten falen)

---

## Troubleshooting

### "Permission denied" errors
- Check of je ingelogd bent
- Check of de rules correct zijn gepubliceerd
- Check of `userId` in de rules overeenkomt met `auth.uid`

### Rules worden niet opgeslagen
- Zorg dat je "Publish" hebt geklikt
- Check of er geen syntax errors zijn
- Refresh de pagina en check opnieuw

