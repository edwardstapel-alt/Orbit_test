# 📤 Code naar GitHub pushen

Je code is klaar om gepusht te worden! Hier zijn 3 eenvoudige methoden:

## 🎯 Methode 1: Automatisch Script (Aanbevolen)

Run dit script en volg de instructies:

```bash
./scripts/push-to-github.sh
```

Het script vraagt om een Personal Access Token en pusht automatisch.

---

## 🔑 Methode 2: Personal Access Token (Handmatig)

### Stap 1: Maak een GitHub Token

1. Ga naar: **https://github.com/settings/tokens**
2. Klik **"Generate new token"** → **"Generate new token (classic)"**
3. Geef het een naam: `Orbit Deploy`
4. Selecteer scope: **`repo`** (vink alle repo opties aan)
5. Scroll naar beneden en klik **"Generate token"**
6. **⚠️ Kopieer de token direct!** (je ziet hem maar 1x)

### Stap 2: Push met token

```bash
# Vervang YOUR_TOKEN met je gekopieerde token
git push https://YOUR_TOKEN@github.com/edwardstapel-alt/Orbit_test.git main
```

Of gebruik als username:
```bash
git push https://YOUR_TOKEN@github.com/edwardstapel-alt/Orbit_test.git main
# Username: [je GitHub username]
# Password: [plak je token hier]
```

---

## 🚀 Methode 3: GitHub CLI (Permanent)

Installeer GitHub CLI voor permanente authenticatie:

```bash
# Installeer GitHub CLI
brew install gh

# Login
gh auth login

# Push
git push origin main
```

---

## ✅ Verificatie

Na een succesvolle push, check op GitHub:
- Ga naar: **https://github.com/edwardstapel-alt/Orbit_test**
- Je zou je laatste commits moeten zien!

---

## 🎯 Volgende Stap: Deploy naar Vercel

Zodra je code op GitHub staat:
1. Ga naar [vercel.com](https://vercel.com)
2. Log in met GitHub
3. Import je repository
4. Klik Deploy!

Zie `QUICK_DEPLOY.md` voor volledige instructies.

