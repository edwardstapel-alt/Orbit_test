# Fix: "This domain is not authorized" Error

## Het Probleem

Je krijgt de error: **"This domain is not authorized. Please add it in Firebase Console"**

Dit betekent dat het domain waarop je de app draait niet is toegevoegd aan de authorized domains in Firebase.

## Oplossing: Domain Toevoegen aan Firebase

### Stap 1: Ga naar Firebase Console
1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Selecteer je project: **orbit-e1a7e**

### Stap 2: Ga naar Authentication Settings
1. Klik op **Authentication** in het menu (links)
2. Klik op de **Settings** tab (bovenaan, naast "Users" en "Sign-in method")
3. Scroll naar beneden naar **"Authorized domains"**

### Stap 3: Voeg je Domain Toe

Klik op **"Add domain"** en voeg deze domains toe:

#### Voor Lokale Development:
- `localhost` (zonder poort nummer)
- `127.0.0.1` (optioneel, als localhost niet werkt)

#### Voor Android App:
- `localhost` (voor development)
- Je eigen domain (als je de app deployed hebt)

#### Voor Web Deployment:
- Je deployment URL (bijv. `orbit-dashboard.vercel.app` of `orbit-dashboard.netlify.app`)
- Je custom domain (als je die hebt)

### Stap 4: Save

Na het toevoegen van de domains:
- Klik op **"Add"** of **"Save"**
- Wacht even (kan 1-2 minuten duren voordat het actief is)

## Welk Domain Moet Je Toevoegen?

### Als je lokaal test (localhost:3000):
- Voeg toe: `localhost`

### Als je op Android test:
- Voeg toe: `localhost` (voor development)
- Android apps gebruiken `localhost` als domain voor OAuth callbacks

### Als je deployed hebt:
- Voeg je deployment URL toe (bijv. `orbit-dashboard.vercel.app`)

## Testen

Na het toevoegen:
1. Wacht 1-2 minuten
2. Refresh de app
3. Probeer opnieuw in te loggen met Google

## Troubleshooting

### "Domain nog steeds niet geautoriseerd"
- ✅ Check of je het juiste project hebt geselecteerd
- ✅ Check of je `localhost` hebt toegevoegd (zonder `:3000`)
- ✅ Wacht 2-3 minuten en probeer opnieuw
- ✅ Clear browser cache en cookies
- ✅ Check of je de juiste Firebase project gebruikt

### "Werkt op web maar niet op Android"
- ✅ Zorg dat `localhost` is toegevoegd
- ✅ Rebuild de Android app na het toevoegen van het domain
- ✅ Check of de app de juiste Firebase configuratie gebruikt

### "Werkt lokaal maar niet na deployment"
- ✅ Voeg je deployment URL toe aan authorized domains
- ✅ Check of je deployment URL correct is (zonder `https://`)

## Belangrijk

- **Geen trailing slash**: Voeg `localhost` toe, niet `localhost/`
- **Geen protocol**: Voeg `localhost` toe, niet `http://localhost`
- **Geen poort**: Voeg `localhost` toe, niet `localhost:3000`

## Voorbeeld

**Goed:**
- `localhost`
- `orbit-dashboard.vercel.app`
- `mijnapp.nl`

**Fout:**
- `http://localhost`
- `localhost:3000`
- `https://orbit-dashboard.vercel.app`
- `localhost/`

