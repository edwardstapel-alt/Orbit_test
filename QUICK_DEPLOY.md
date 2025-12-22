# 🚀 Snelle Deployment naar Vercel (Gratis & Permanent)

Je code is al gecommit! Volg deze stappen voor een gratis, permanente deploy:

## Stap 1: Push naar GitHub

Als je nog niet gepusht hebt, run:

```bash
git push origin main
```

Als je authenticatie nodig hebt, gebruik een van deze opties:

**Optie A: GitHub CLI (aanbevolen)**
```bash
gh auth login
git push origin main
```

**Optie B: Personal Access Token**
1. Ga naar GitHub.com → Settings → Developer settings → Personal access tokens
2. Maak een nieuwe token met `repo` rechten
3. Gebruik de token als wachtwoord bij `git push`

**Optie C: SSH key**
```bash
git remote set-url origin git@github.com:edwardstapel-alt/Orbit_test.git
git push origin main
```

## Stap 2: Deploy naar Vercel (5 minuten)

1. **Ga naar [vercel.com](https://vercel.com)**
   - Klik "Sign Up" of "Log In"
   - Log in met je **GitHub account** (aanbevolen)

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Selecteer je repository: `edwardstapel-alt/Orbit_test`
   - Vercel detecteert automatisch dat het een Vite project is

3. **Configureer (meestal niet nodig)**
   - Framework Preset: **Vite** (automatisch gedetecteerd)
   - Build Command: `npm run build` (automatisch)
   - Output Directory: `dist` (automatisch)
   - Install Command: `npm install` (automatisch)

4. **Environment Variables (optioneel)**
   - Als je `GEMINI_API_KEY` gebruikt, voeg deze toe:
     - Name: `GEMINI_API_KEY`
     - Value: [jouw API key]

5. **Deploy!**
   - Klik "Deploy"
   - Wacht 1-2 minuten
   - 🎉 Je app is live!

## Stap 3: Je app gebruiken

Na deployment krijg je een URL zoals:
- `https://orbit-test.vercel.app` (of je eigen subdomain)

**Op je Pixel 9 Pro:**
1. Open Chrome
2. Ga naar je Vercel URL
3. Klik menu (3 puntjes) → "Add to Home screen" of "Install app"
4. De app verschijnt op je home screen! 🎉

## ✨ Automatische Updates

Elke keer als je `git push` doet naar `main`, wordt je app automatisch opnieuw gedeployed!

## 🔒 Gratis Tier Features

Vercel gratis tier geeft je:
- ✅ Onbeperkte deployments
- ✅ Automatische HTTPS
- ✅ Custom domain support
- ✅ CDN wereldwijd
- ✅ 100GB bandwidth per maand
- ✅ Onbeperkte team members

## 📱 PWA Features

Je app heeft nu:
- ✅ Offline functionaliteit
- ✅ Installatie als native app
- ✅ Snelle laadtijden
- ✅ Automatische updates

## 🎨 App Iconen (optioneel)

Voor mooiere iconen:
```bash
node scripts/generate-icons.js
```

Converteer de SVG naar PNG (192x192 en 512x512) en plaats ze in `public/`.

---

**Klaar!** Je app is nu permanent online en gratis! 🚀



