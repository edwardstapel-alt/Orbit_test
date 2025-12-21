# Cloud Sync Implementatie Plan

## Overzicht

Cloud sync zorgt ervoor dat je data automatisch wordt gesynchroniseerd tussen verschillende devices en een backup heeft in de cloud.

---

## Opties voor Cloud Sync

### Optie 1: Firebase (Aanbevolen voor snelheid) ⭐
**Voordelen:**
- ✅ Gratis tier (tot 1GB storage, 50K reads/day)
- ✅ Real-time sync out-of-the-box
- ✅ Authenticatie ingebouwd (Google, Email, etc.)
- ✅ Offline support automatisch
- ✅ Geen backend server nodig
- ✅ Eenvoudig te implementeren

**Nadelen:**
- ⚠️ Vendor lock-in (Firebase)
- ⚠️ Kosten bij schaal (maar voor persoonlijk gebruik gratis)

**Wat je nodig hebt:**
1. Firebase account (gratis)
2. Firebase project aanmaken
3. Firebase SDK installeren
4. Authenticatie configureren
5. Firestore database setup

**Implementatie tijd:** 2-4 uur

---

### Optie 2: Supabase (Open Source alternatief)
**Voordelen:**
- ✅ Open source
- ✅ PostgreSQL database (SQL, niet NoSQL)
- ✅ Real-time sync
- ✅ Authenticatie ingebouwd
- ✅ Gratis tier (500MB database, 2GB bandwidth)
- ✅ Row Level Security (RLS) voor privacy

**Nadelen:**
- ⚠️ Iets complexer dan Firebase
- ⚠️ SQL kennis handig (maar niet vereist)

**Wat je nodig hebt:**
1. Supabase account (gratis)
2. Supabase project aanmaken
3. Supabase client SDK installeren
4. Database schema maken
5. Authenticatie configureren

**Implementatie tijd:** 3-5 uur

---

### Optie 3: Eigen Backend (Volledige controle)
**Voordelen:**
- ✅ Volledige controle over data
- ✅ Geen vendor lock-in
- ✅ Aangepaste logica mogelijk
- ✅ Privacy volledig in eigen hand

**Nadelen:**
- ⚠️ Server hosting nodig (kosten)
- ⚠️ Veel meer werk (backend + frontend)
- ⚠️ Onderhoud en security zelf regelen
- ⚠️ Veel langer om te implementeren

**Wat je nodig hebt:**
1. Server (VPS, AWS, etc.)
2. Database (PostgreSQL, MongoDB, etc.)
3. Backend API (Node.js, Python, etc.)
4. Authenticatie systeem
5. SSL certificaat
6. Backup strategie

**Implementatie tijd:** 1-2 weken

---

### Optie 4: Google Drive / Dropbox API (Eenvoudig maar beperkt)
**Voordelen:**
- ✅ Gebruikt bestaande cloud storage
- ✅ Geen extra account nodig (als je al Google gebruikt)
- ✅ Gratis (binnen quota)

**Nadelen:**
- ⚠️ Geen real-time sync
- ⚠️ Geen query mogelijkheden
- ⚠️ File-based (niet database)
- ⚠️ Conflict resolution moeilijker

**Implementatie tijd:** 4-6 uur

---

## Aanbeveling: Firebase

Voor jouw use case raad ik **Firebase** aan omdat:
1. **Snel te implementeren** - binnen een paar uur werkend
2. **Real-time sync** - wijzigingen direct zichtbaar op alle devices
3. **Offline support** - werkt ook zonder internet
4. **Gratis tier** - meer dan genoeg voor persoonlijk gebruik
5. **Goede documentatie** - veel voorbeelden beschikbaar
6. **Google integratie** - je gebruikt al Google, dus makkelijk te koppelen

---

## Firebase Implementatie Plan

### Fase 1: Firebase Setup (30 min)
- [ ] Firebase account aanmaken
- [ ] Nieuw project aanmaken
- [ ] Firebase configuratie ophalen (API keys)
- [ ] Firebase SDK installeren in project

### Fase 2: Authenticatie (1-2 uur)
- [ ] Firebase Authentication inschakelen
- [ ] Email/Password auth configureren
- [ ] Google Sign-In toevoegen (optioneel, je hebt al Google OAuth)
- [ ] Login/Register UI maken
- [ ] Auth state management in app

### Fase 3: Database Schema (1 uur)
- [ ] Firestore database aanmaken
- [ ] Collections structureren:
  - `users/{userId}/tasks`
  - `users/{userId}/habits`
  - `users/{userId}/objectives`
  - `users/{userId}/keyResults`
  - `users/{userId}/lifeAreas`
  - `users/{userId}/timeSlots`
  - `users/{userId}/friends`
  - `users/{userId}/settings`
- [ ] Security rules schrijven (alleen eigen data lezen/schrijven)

### Fase 4: Sync Service (2-3 uur)
- [ ] `utils/firebaseSync.ts` maken
- [ ] Functies voor:
  - `syncToFirebase()` - upload data naar cloud
  - `syncFromFirebase()` - download data van cloud
  - `watchFirebaseChanges()` - real-time updates
- [ ] Conflict resolution logica
- [ ] Offline queue voor wijzigingen

### Fase 5: DataContext Integratie (1-2 uur)
- [ ] DataContext uitbreiden met Firebase sync
- [ ] Auto-sync bij wijzigingen
- [ ] Initial sync bij app start
- [ ] Sync status indicators
- [ ] Error handling

### Fase 6: UI Updates (1 uur)
- [ ] Sync status indicator in UI
- [ ] "Sync Now" button
- [ ] Last sync timestamp
- [ ] Conflict resolution UI (als nodig)

---

## Technische Details

### Firebase Collections Structuur

```
users/
  {userId}/
    profile/
      - firstName
      - lastName
      - email
      - image
      - dob
    tasks/
      {taskId}/
        - id
        - title
        - completed
        - scheduledDate
        - ... (alle Task fields)
        - updatedAt (timestamp)
        - syncedAt (timestamp)
    habits/
      {habitId}/
        - ... (alle Habit fields)
    objectives/
      {objectiveId}/
        - ... (alle Objective fields)
    keyResults/
      {keyResultId}/
        - ... (alle KeyResult fields)
    lifeAreas/
      {lifeAreaId}/
        - ... (alle LifeArea fields)
    timeSlots/
      {timeSlotId}/
        - ... (alle TimeSlot fields)
    settings/
      - accentColor
      - darkMode
      - showCategory
      - syncConfig
```

### Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Sync Strategie

1. **Initial Sync:**
   - Bij app start: check of er data in Firebase is
   - Als Firebase nieuwer is: download van Firebase
   - Als localStorage nieuwer is: upload naar Firebase
   - Merge bij conflicten (last-write-wins of user choice)

2. **Real-time Sync:**
   - Luister naar Firebase changes
   - Update localStorage automatisch
   - Update UI automatisch

3. **Offline Support:**
   - Queue wijzigingen lokaal
   - Upload naar Firebase zodra online
   - Merge met remote changes

4. **Conflict Resolution:**
   - Timestamp vergelijken (last-write-wins)
   - Of: user choice per conflict
   - Of: merge strategie (veld-voor-veld)

---

## Kosten Overzicht

### Firebase (Gratis Tier)
- **Storage:** 1GB gratis
- **Reads:** 50,000/day gratis
- **Writes:** 20,000/day gratis
- **Bandwidth:** 10GB/month gratis

**Voor persoonlijk gebruik:** Meer dan genoeg gratis!

### Supabase (Gratis Tier)
- **Database:** 500MB gratis
- **Bandwidth:** 2GB/month gratis
- **API requests:** Unlimited (binnen bandwidth)

**Voor persoonlijk gebruik:** Meer dan genoeg gratis!

---

## Implementatie Stappen (Firebase)

### Stap 1: Firebase Project Aanmaken
1. Ga naar https://console.firebase.google.com
2. Klik "Add project"
3. Geef project een naam (bijv. "Orbit Life Planner")
4. Disable Google Analytics (optioneel)
5. Klik "Create project"

### Stap 2: Firebase Config Ophalen
1. In Firebase Console: Project Settings
2. Scroll naar "Your apps"
3. Klik Web icon (</>)
4. Geef app een naam
5. Kopieer de config object:
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Stap 3: Firebase SDK Installeren
```bash
npm install firebase
```

### Stap 4: Firebase Initialiseren
Maak `utils/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // ... je config hier
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Stap 5: Authenticatie Setup
1. In Firebase Console: Authentication
2. Enable "Email/Password" sign-in
3. Optioneel: Enable "Google" sign-in

### Stap 6: Firestore Database Aanmaken
1. In Firebase Console: Firestore Database
2. Klik "Create database"
3. Start in "Production mode" (we maken later security rules)
4. Kies locatie (bijv. europe-west1 voor Nederland)

### Stap 7: Security Rules
1. In Firestore: Rules tab
2. Plak de security rules (zie hierboven)
3. Publish rules

---

## Code Voorbeelden

### Login Component
```typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';

// Login
const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register
const register = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};
```

### Sync Service
```typescript
import { doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

// Upload data naar Firebase
export const syncToFirebase = async (dataType: string, data: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const docRef = doc(db, `users/${user.uid}/${dataType}`, data.id);
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString()
  });
};

// Download data van Firebase
export const syncFromFirebase = async (dataType: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const docRef = doc(db, `users/${user.uid}/${dataType}`, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Real-time listener
export const watchFirebaseChanges = (dataType: string, callback: (data: any) => void) => {
  const user = auth.currentUser;
  if (!user) return;
  
  const collectionRef = collection(db, `users/${user.uid}/${dataType}`);
  return onSnapshot(collectionRef, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    callback(data);
  });
};
```

---

## Volgende Stappen

1. **Kies een optie** (aanbeveling: Firebase)
2. **Account aanmaken** en project setup
3. **Ik implementeer de code** voor sync
4. **Testen** op meerdere devices
5. **Deploy** en gebruik!

---

## Vragen?

Als je vragen hebt over:
- Welke optie te kiezen
- Firebase setup
- Implementatie details
- Kosten
- Privacy/security

Laat het weten en ik help je verder!

