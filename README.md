<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1epT3FuWUpK3UhJB8WEzchNyZyNORLG0n

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (optioneel)

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open in browser: `http://localhost:3000`

## 📱 App installeren op je telefoon

Deze app is een Progressive Web App (PWA) en kan geïnstalleerd worden op je Pixel 9 Pro!

**Zie [DEPLOYMENT.md](./DEPLOYMENT.md) voor uitgebreide instructies.**

**Quick start:**
- **Lokaal:** Start `npm run dev`, open `http://[JE-IP]:3000` op je telefoon (zelfde WiFi)
- **Online:** Deploy naar [Vercel](https://vercel.com) of [Netlify](https://netlify.com) voor altijd beschikbare toegang

## 🎨 App iconen

Genereer placeholder iconen:
```bash
node scripts/generate-icons.js
```

Converteer de SVG naar PNG (192x192 en 512x512) en plaats ze in de `public` folder.
