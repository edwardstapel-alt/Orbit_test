# Deployment Guide - Orbit Dashboard op Pixel 9 Pro

Deze guide legt uit hoe je de Orbit app op je Pixel 9 Pro kunt krijgen. Er zijn drie opties, van simpel tot geavanceerd.

## 📱 Optie 1: Lokaal via je netwerk (Snelste start)

**Voordelen:**
- ✅ Snel op te zetten
- ✅ Geen externe services nodig
- ✅ Data blijft lokaal

**Nadelen:**
- ❌ Alleen beschikbaar op hetzelfde WiFi netwerk
- ❌ Computer moet aan staan

### Stappen:

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Start de development server:**
   ```bash
   npm run dev
   ```

3. **Vind je lokale IP adres:**
   - **Mac:** Ga naar System Preferences > Network, of run `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows:** Run `ipconfig` in Command Prompt
   - **Linux:** Run `hostname -I`

4. **Open op je Pixel 9 Pro:**
   - Zorg dat je telefoon op hetzelfde WiFi netwerk zit
   - Open Chrome op je telefoon
   - Ga naar: `http://[JE-IP-ADRES]:3000`
   - Bijvoorbeeld: `http://192.168.1.100:3000`

5. **Installeer als app:**
   - In Chrome, klik op het menu (3 puntjes)
   - Selecteer "Add to Home screen" of "Install app"
   - De app verschijnt nu op je home screen!

---

## 🌐 Optie 2: Hosten op Vercel (Aanbevolen - Altijd beschikbaar)

**Voordelen:**
- ✅ Altijd beschikbaar, overal ter wereld
- ✅ Gratis hosting
- ✅ Automatische HTTPS
- ✅ Automatische deployments via GitHub
- ✅ Snelle laadtijden

**Nadelen:**
- ❌ Data wordt lokaal opgeslagen (geen synchronisatie tussen devices standaard)

### Stappen:

1. **Push je code naar GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [JE-GITHUB-REPO-URL]
   git push -u origin main
   ```

2. **Deploy op Vercel:**
   - Ga naar [vercel.com](https://vercel.com)
   - Log in met je GitHub account
   - Klik "New Project"
   - Selecteer je repository
   - Vercel detecteert automatisch Vite
   - Klik "Deploy"

3. **Open op je Pixel 9 Pro:**
   - Je krijgt een URL zoals: `https://orbit-dashboard.vercel.app`
   - Open deze URL in Chrome op je telefoon
   - Installeer als app (zie stap 5 van Optie 1)

4. **Optioneel: Custom domain:**
   - In Vercel dashboard: Settings > Domains
   - Voeg je eigen domain toe

---

## 🌐 Optie 3: Hosten op Netlify (Alternatief)

**Voordelen:**
- ✅ Gelijk aan Vercel
- ✅ Gratis hosting
- ✅ Automatische HTTPS

### Stappen:

1. **Push naar GitHub** (zie Optie 2, stap 1)

2. **Deploy op Netlify:**
   - Ga naar [netlify.com](https://netlify.com)
   - Log in met GitHub
   - Klik "Add new site" > "Import an existing project"
   - Selecteer je repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Klik "Deploy site"

3. **Open op je Pixel 9 Pro:**
   - Je krijgt een URL zoals: `https://orbit-dashboard.netlify.app`
   - Open in Chrome en installeer als app

---

## 🔄 Synchronisatie tussen devices (Optioneel)

Momenteel gebruikt de app `localStorage` voor data opslag. Voor synchronisatie tussen devices kun je later toevoegen:

### Opties voor synchronisatie:
1. **Firebase Firestore** - Real-time database, gratis tier beschikbaar
2. **Supabase** - Open source Firebase alternatief
3. **Cloudflare Durable Objects** - Serverless database
4. **Eigen backend** - Node.js + PostgreSQL/MySQL

Voor nu werkt de app prima offline met lokale opslag per device.

---

## 🎨 App iconen toevoegen

De app heeft placeholder iconen nodig. Maak deze aan:

1. **Maak twee PNG bestanden:**
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)

2. **Plaats ze in de `public` folder**

3. **Tip:** Gebruik een tool zoals:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Of maak ze zelf in Figma/Photoshop

---

## 🚀 Build voor productie

Voor lokale productie build:

```bash
npm run build
npm run preview
```

Dit maakt een geoptimaliseerde versie in de `dist` folder.

---

## 📝 Troubleshooting

### App werkt niet op telefoon:
- ✅ Controleer dat je telefoon op hetzelfde WiFi netwerk zit (voor lokale optie)
- ✅ Controleer firewall instellingen op je computer
- ✅ Probeer HTTPS (Vercel/Netlify gebruiken automatisch HTTPS)

### PWA installatie optie verschijnt niet:
- ✅ Gebruik Chrome browser (niet Firefox/Safari)
- ✅ Zorg dat je HTTPS gebruikt (of localhost)
- ✅ Controleer dat manifest.json correct is

### Data verdwijnt:
- ✅ Data wordt opgeslagen in browser localStorage
- ✅ Bij "Clear site data" wordt alles gewist
- ✅ Voor synchronisatie, zie "Synchronisatie tussen devices" sectie

---

## 🎯 Aanbeveling

Voor de beste ervaring raad ik aan:
1. **Start met Optie 1** (lokaal) om snel te testen
2. **Deploy naar Vercel** (Optie 2) voor altijd beschikbare toegang
3. **Voeg later synchronisatie toe** als je meerdere devices gebruikt

Veel succes! 🚀




