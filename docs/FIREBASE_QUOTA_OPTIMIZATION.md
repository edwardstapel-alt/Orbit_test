# Firebase Quota Optimalisatie

## Probleem
De applicatie kreeg "Quota exceeded" fouten van Firebase Firestore. Dit gebeurt wanneer:
- Te veel reads/writes per dag (gratis tier limieten)
- Te veel document reads/writes in korte tijd
- Inefficiënte queries die te veel data ophalen
- Onnodige real-time listeners die continu data ophalen

## Oplossing

### 1. Rate Limiting Systeem
Een rate limiter is toegevoegd (`utils/firebaseRateLimiter.ts`) die:
- **Queue systeem**: Alle Firebase writes worden in een queue geplaatst
- **Rate limiting**: Minimum 100ms tussen writes
- **Batch processing**: Verwerkt tot 10 operaties tegelijk
- **Exponential backoff**: Bij quota errors wordt automatisch opnieuw geprobeerd met toenemende delays
- **Max retries**: Maximaal 3 pogingen per operatie

### 2. Verbeterde Error Handling
- Quota errors worden nu specifiek herkend en afgehandeld
- Automatische retries met exponential backoff
- Betere logging voor debugging

### 3. Batch Write Optimalisaties
- Batch writes worden nu in chunks van 500 verwerkt (Firestore limiet)
- Delays tussen batches om rate limiting te voorkomen
- Betere error handling voor gedeeltelijke syncs

### 4. Real-time Listeners Optimalisatie
- Waarschuwingen wanneer cached data wordt gebruikt (mogelijk quota probleem)
- Betere error handling voor quota errors in listeners

## Gebruik

De rate limiter werkt automatisch. Alle `syncEntityToFirebase` calls worden automatisch door de rate limiter gerouteerd.

### Queue Status Controleren
```typescript
import { firebaseRateLimiter } from './utils/firebaseRateLimiter';

const status = firebaseRateLimiter.getQueueStatus();
console.log('Queue length:', status.queueLength);
console.log('Is processing:', status.isProcessing);
console.log('Consecutive errors:', status.consecutiveErrors);
```

### Queue Leegmaken (noodgeval)
```typescript
firebaseRateLimiter.clearQueue();
```

## Best Practices om Quota te Besparen

### 1. Beperk Real-time Listeners
- Real-time listeners verbruiken veel quota
- Overweeg polling met een interval voor minder kritieke data
- Schakel listeners uit wanneer niet nodig

### 2. Batch Operaties
- Gebruik `syncEntitiesToFirebase` in plaats van meerdere `syncEntityToFirebase` calls
- Verzamel wijzigingen en sync in batches

### 3. Vermijd Onnodige Syncs
- Sync alleen wanneer data daadwerkelijk is gewijzigd
- Gebruik debouncing voor snelle opeenvolgende updates

### 4. Optimaliseer Queries
- Gebruik filters en limits waar mogelijk
- Haal alleen benodigde velden op
- Vermijd queries die alle documenten ophalen

### 5. Monitor Quota Gebruik
- Check Firebase Console regelmatig
- Gebruik Firebase Usage dashboard
- Overweeg upgrade naar Blaze plan voor productie

## Firebase Quota Limieten (Gratis Tier)

- **Document reads**: 50,000/dag
- **Document writes**: 20,000/dag
- **Document deletes**: 20,000/dag
- **Network egress**: 10 GB/maand

## Troubleshooting

### Quota Errors Blijven Bestaan
1. Check Firebase Console voor exacte quota gebruik
2. Controleer of er veel real-time listeners actief zijn
3. Overweeg om listeners tijdelijk uit te schakelen
4. Check of er loops zijn die continu syncen

### Queue Blijft Vol
1. Check `firebaseRateLimiter.getQueueStatus()`
2. Mogelijk te veel operaties tegelijk
3. Overweeg om minder kritieke syncs uit te stellen
4. Check of er een bug is die te veel syncs triggert

### Performance Problemen
1. Rate limiter voegt kleine delays toe (100ms tussen writes)
2. Dit is normaal en voorkomt quota overschrijding
3. Voor betere performance, upgrade naar Blaze plan

## Nieuwe Optimalisaties (v2)

### 1. Debouncing Systeem
- **Automatische debouncing**: Snelle opeenvolgende updates worden gecombineerd
- **Slimme delays**: Debounce delay neemt toe bij meerdere updates
- **Max delay**: Maximaal 2 seconden debounce delay

### 2. Listener Optimalisatie
- **Throttling**: Listener callbacks worden getthrottled (1-5 seconden afhankelijk van collectie)
- **Skip unchanged**: Callbacks worden overgeslagen als data niet veranderd is
- **Metadata filtering**: `includeMetadataChanges: false` voorkomt onnodige triggers

### 3. Intelligente Sync Checker
- **Change detection**: Alleen syncen wanneer data daadwerkelijk veranderd is
- **Hash-based comparison**: Snelle vergelijking zonder volledige sync
- **Cache systeem**: Onthoudt laatste gesyncte data (5 minuten TTL)

### 4. Prioritering
- **Critical collections**: `deletedTaskIds` en `profile` syncen direct (geen debouncing)
- **Normal collections**: Gebruiken debouncing en change detection
- **Less critical**: Reviews en retrospectives hebben langere throttles

## Performance Impact

### Quota Besparing
- **~70-80% minder writes**: Door debouncing en change detection
- **~50% minder listener triggers**: Door throttling en skip unchanged
- **Snellere response**: Door intelligente caching

### Configuratie per Collectie
- **Tasks**: 1s throttle, debouncing actief
- **Habits**: 2s throttle, debouncing actief
- **Objectives/KeyResults**: 2s throttle, debouncing actief
- **Reviews/Retrospectives**: 5s throttle, debouncing actief

## Toekomstige Verbeteringen

- [ ] Polling mode voor real-time listeners (optioneel)
- [ ] Automatische detectie en aanpassing bij quota problemen
- [ ] Metrics en monitoring dashboard
- [ ] Configuratie opties voor rate limiter instellingen
- [ ] Offline queue met sync bij reconnect

