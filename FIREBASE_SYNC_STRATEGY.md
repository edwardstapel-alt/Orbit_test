# Firebase Sync Strategie

## Wat wordt gesynchroniseerd?

**Alle data types worden gesynchroniseerd:**
- ✅ Tasks
- ✅ Habits
- ✅ Objectives
- ✅ Key Results
- ✅ Life Areas
- ✅ Time Slots
- ✅ Friends
- ✅ Status Updates
- ✅ User Profile

## Wanneer wordt gesynchroniseerd?

### 1. Bij login/authenticatie (Initial Sync)
- Haalt alle data op uit Firebase
- Als Firebase data heeft → merge met lokale data (timestamp-based)
- Als Firebase leeg is → lokale data wordt geüpload naar Firebase

### 2. Bij wijzigingen (Auto-sync)
- Elke `add`, `update`, of `delete` operatie sync automatisch naar Firebase
- Gebeurt direct na de lokale state update
- Timestamp (`lastModified`) wordt automatisch toegevoegd

### 3. Real-time listeners
- Luisteren naar wijzigingen in Firebase
- Wanneer Firebase data verandert → lokale state wordt geüpdatet
- **Timestamp-based merge**: nieuwste versie wint

## Sync Flow

```
Web App (wijziging) 
  → updateTask/addTask (met timestamp)
  → syncEntityToFirebase() 
  → Firebase Firestore (met updatedAt + lastModified)
  → Real-time listener op mobiel detecteert wijziging
  → Timestamp vergelijking
  → Nieuwste versie wint
  → Update lokale state
```

## Merge Strategie (Timestamp-based)

**Nieuwste versie wint:**
```typescript
// Vergelijk timestamps
const firebaseTime = firebaseItem.updatedAt || firebaseItem.lastModified || '';
const localTime = localItem.updatedAt || localItem.lastModified || '';

if (firebaseTime > localTime) {
  // Firebase is nieuwer → gebruik Firebase versie
} else if (localTime > firebaseTime) {
  // Lokale versie is nieuwer → behoud lokale versie
  // Sync lokale versie terug naar Firebase
} else {
  // Zelfde timestamp → Firebase wint (default)
}
```

## Bron van waarheid

**Firebase is de centrale bron van waarheid**, maar:
- Lokale wijzigingen met nieuwere timestamps worden behouden
- Lokale wijzigingen worden automatisch teruggesynchroniseerd naar Firebase
- Real-time listeners zorgen voor directe synchronisatie tussen devices

## Debugging

**Console logs tonen:**
- `✅ Synced [entity] to Firebase` - wanneer data wordt gesynchroniseerd
- `📡 Real-time update: X [entities] from Firebase` - wanneer real-time updates binnenkomen
- `🔄 Real-time update: [id] from Firebase (newer)` - wanneer Firebase versie wordt gebruikt
- `💾 Keeping local version: [id] (local is newer)` - wanneer lokale versie wordt behouden
- `➕ New [entity] from Firebase: [id]` - wanneer nieuwe items worden toegevoegd

## Testen

1. **Maak wijziging op web app**
2. **Check console logs** - zie je `✅ Synced`?
3. **Open mobiel app** - zie je `📡 Real-time update`?
4. **Check of wijziging zichtbaar is** - zou binnen enkele seconden moeten verschijnen

## Mogelijke problemen

1. **Real-time listeners niet actief** - check of gebruiker is ingelogd
2. **Timestamps ontbreken** - oude data heeft mogelijk geen timestamps
3. **Network issues** - Firebase sync vereist internetverbinding
4. **Cache issues** - probeer app te herstarten

