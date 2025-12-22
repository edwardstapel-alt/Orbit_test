# Firebase Setup Stap-voor-Stap Handleiding

## Stap 1-5: Project Aanmaken
1. Ga naar https://console.firebase.google.com
2. Log in met je Google account
3. Klik op "Add project" of "Create a project"
4. Geef je project een naam (bijv. "Orbit Life Planner")
5. Volg de wizard (je kunt Google Analytics uitzetten als je wilt)

## Stap 6: Web App Toevoegen

### 6.1: Ga naar Project Settings
- In het Firebase Console dashboard, klik op het **tandwiel icoon** (⚙️) rechtsboven
- Klik op **"Project settings"**

### 6.2: Scroll naar "Your apps"
- Je ziet een sectie genaamd **"Your apps"**
- Daar staan verschillende platform iconen:
  - 📱 iOS (Apple)
  - 🤖 Android
  - 🌐 Web (</>)
  - 💻 Unity
  - etc.

### 6.3: Klik op het Web icoon (</>)
- Klik op het **Web icoon** (</>) - dit is voor web apps
- Er opent een popup/venster

### 6.4: Geef je app een naam
- In het popup venster zie je een veld "App nickname"
- Geef je app een naam (bijv. "Orbit App" of "Life Planner")
- **NIET aanvinken:** "Also set up Firebase Hosting" (tenzij je dat wilt)
- Klik op **"Register app"**

### 6.5: Kopieer de configuratie
- Je ziet nu een code blok met Firebase configuratie
- Het ziet er ongeveer zo uit:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "orbit-life-planner.firebaseapp.com",
  projectId: "orbit-life-planner",
  storageBucket: "orbit-life-planner.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 6.6: Kopieer deze configuratie
- **Selecteer de hele configuratie** (van `const firebaseConfig` tot `};`)
- **Kopieer het** (Cmd+C op Mac, Ctrl+C op Windows)
- **Plak het hieronder** of deel het met mij

---

## Wat je nu hebt

Je hebt nu:
- ✅ Firebase project aangemaakt
- ✅ Web app geregistreerd
- ✅ Firebase configuratie gekopieerd

---

## Volgende Stap: Deel de Configuratie

**Belangrijk:** De Firebase configuratie is **publiek** en **veilig** om te delen. Het is bedoeld om in je frontend code te zitten. De security komt van de Firestore Security Rules (die maken we later).

**Je kunt de configuratie op een van deze manieren delen:**
1. **Plak het hier in de chat** - ik gebruik het om de code te implementeren
2. **Of:** Ik kan je laten zien waar je het zelf moet plakken

---

## Voorbeeld van wat je moet kopiëren

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "jouw-project-naam.firebaseapp.com",
  projectId: "jouw-project-naam",
  storageBucket: "jouw-project-naam.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Kopieer dit hele blok** (inclusief de `const firebaseConfig = {` en `};` delen).

---

## Troubleshooting

### Ik zie geen "Your apps" sectie
- Zorg dat je in **Project settings** bent (tandwiel icoon)
- Scroll naar beneden, het staat onder "General" tab

### Ik zie geen Web icoon (</>)
- Klik op het **+ icoon** naast "Your apps" om een nieuwe app toe te voegen
- Kies dan het Web icoon

### De configuratie ziet er anders uit
- Dat is oké! Zolang het maar een object is met `apiKey`, `authDomain`, `projectId`, etc.
- Kopieer gewoon wat je ziet

---

## Na het kopiëren

Zodra je de configuratie hebt gekopieerd:
1. **Plak het hier in de chat** (of laat weten dat je het hebt)
2. **Ik implementeer de Firebase sync code**
3. **Ik laat je weten wat je nog moet doen** (authenticatie inschakelen, database aanmaken, etc.)

---

## Veiligheid

**Is het veilig om deze configuratie te delen?**
- ✅ **Ja!** De Firebase configuratie is **publiek** en bedoeld om in frontend code te staan
- ✅ **Security komt van:** Firestore Security Rules (die maken we later)
- ✅ **Zonder security rules:** Niemand kan je data lezen/schrijven
- ✅ **Met security rules:** Alleen jij (ingelogd) kan je eigen data lezen/schrijven

Je kunt de configuratie dus veilig delen!

