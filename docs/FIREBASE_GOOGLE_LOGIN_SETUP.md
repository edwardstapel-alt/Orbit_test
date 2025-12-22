# Firebase Google Login Setup

Als je een error krijgt bij Google login, volg deze stappen:

## Stap 1: Enable Google Provider in Firebase

1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Selecteer je project: **orbit-e1a7e**
3. Ga naar **Authentication** → **Sign-in method**
4. Klik op **Google** in de lijst
5. Zet de **Enable** toggle aan
6. Vul in:
   - **Project support email**: Je email adres
   - **Project public-facing name**: Orbit Dashboard (of wat je wilt)
7. Klik op **Save**

## Stap 2: Configure OAuth Consent Screen (als nodig)

Als je een error krijgt over "OAuth consent screen":

1. Ga naar [Google Cloud Console](https://console.cloud.google.com)
2. Selecteer project: **orbit-e1a7e**
3. Ga naar **APIs & Services** → **OAuth consent screen**
4. Vul de verplichte velden in:
   - **User Type**: External (of Internal als je Google Workspace gebruikt)
   - **App name**: Orbit Dashboard
   - **User support email**: Je email
   - **Developer contact information**: Je email
5. Klik op **Save and Continue**
6. Voeg **Scopes** toe (optioneel, Firebase voegt deze automatisch toe)
7. Klik op **Save and Continue**
8. Voeg **Test users** toe (als je in testing mode bent)
9. Klik op **Save and Continue**

## Stap 3: Add Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Zorg dat deze domains zijn toegevoegd:
   - `localhost` (voor lokale ontwikkeling)
   - `orbit-e1a7e.firebaseapp.com` (Firebase hosting)
   - Je eigen domain (als je die gebruikt)

## Stap 4: Check Browser Settings

- **Popup blockers**: Zorg dat popups niet geblokkeerd zijn voor localhost:3000
- **Cookies**: Zorg dat cookies zijn toegestaan
- **Third-party cookies**: Sommige browsers blokkeren deze standaard

## Stap 5: Test opnieuw

Na het configureren:
1. Refresh de pagina
2. Probeer opnieuw in te loggen met Google
3. Check de browser console (F12) voor eventuele errors

## Veelvoorkomende Errors:

### "auth/operation-not-allowed"
- **Oplossing**: Enable Google provider in Firebase Console (Stap 1)

### "auth/unauthorized-domain"
- **Oplossing**: Voeg je domain toe aan Authorized domains (Stap 3)

### "auth/popup-blocked"
- **Oplossing**: Allow popups voor localhost:3000 in je browser

### "auth/configuration-not-found"
- **Oplossing**: Configureer OAuth consent screen (Stap 2)

### "Popup was closed"
- **Oplossing**: Dit is normaal als je de popup sluit. Probeer opnieuw.

## Als het nog steeds niet werkt:

1. Check de browser console (F12) voor de exacte error code
2. Check Firebase Console → Authentication → Sign-in method → Google
3. Zorg dat je de juiste Firebase project hebt geselecteerd
4. Probeer een andere browser (Chrome werkt meestal het beste)

