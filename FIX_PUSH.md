# 🔧 Fix: Permission Denied bij Push

Het probleem: Git gebruikt nog de oude credentials van `estapel-ai` (de fork).

## ✅ Oplossing: Push met Personal Access Token

### Stap 1: Maak een GitHub Token

1. Ga naar: **https://github.com/settings/tokens**
2. Klik **"Generate new token"** → **"Generate new token (classic)"**
3. Naam: `Orbit Deploy`
4. Scope: vink **`repo`** aan (alle repo rechten)
5. Klik **"Generate token"**
6. **⚠️ Kopieer de token direct!** (je ziet hem maar 1x)

### Stap 2: Push met Token

**Optie A: Gebruik het script (aanbevolen)**
```bash
./scripts/push-with-token.sh
```

**Optie B: Handmatig**
```bash
# Vervang YOUR_TOKEN met je gekopieerde token
git push https://YOUR_TOKEN@github.com/edwardstapel-alt/Orbit_test.git main
```

**Optie C: Via Git prompt**
```bash
git push origin main
# Username: edwardstapel-alt
# Password: [plak hier je token]
```

---

## 🔄 Alternatief: SSH gebruiken (permanent)

Voor permanente authenticatie zonder tokens:

1. **Genereer SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Druk Enter voor default locatie
   # Optioneel: voeg een passphrase toe
   ```

2. **Voeg SSH key toe aan GitHub:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Kopieer de output
   ```
   - Ga naar: https://github.com/settings/keys
   - Klik "New SSH key"
   - Plak de key en klik "Add SSH key"

3. **Wijzig remote naar SSH:**
   ```bash
   git remote set-url origin git@github.com:edwardstapel-alt/Orbit_test.git
   ```

4. **Push:**
   ```bash
   git push origin main
   ```

---

## ✅ Na succesvolle push

Check je code op: **https://github.com/edwardstapel-alt/Orbit_test**

Daarna kun je deployen naar Vercel! 🚀

