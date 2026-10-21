# 🔐 Configuration des Secrets GitHub Actions (Signature Android & Releases)

Ce guide détaille la configuration des variables et secrets dans GitHub pour la génération automatique des versions signées Android (**APK** et **AAB / Google Play Store**) ainsi que le déploiement Web automatique.

---

## 📍 Où renseigner ces secrets sur GitHub ?

1. Rendez-vous sur votre dépôt GitHub : `https://github.com/Connacri/MARKETPOS`
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans le menu de gauche, dépliez **Secrets and variables** puis cliquez sur **Actions**.
4. Cliquez sur le bouton vert **New repository secret**.

---

## 🔑 Liste des 4 Secrets à ajouter

### 1. `ANDROID_KEYSTORE_BASE64`
- **Nom du secret :** `ANDROID_KEYSTORE_BASE64`
- **Valeur :** Copiez l'intégralité du bloc Base64 ci-dessous (sans saut de ligne) :

```text
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
```

### 2. `KEYSTORE_PASSWORD`
- **Nom du secret :** `KEYSTORE_PASSWORD`
- **Valeur :** `SherwoodPos2026SecretKey!`

### 3. `KEY_ALIAS`
- **Nom du secret :** `KEY_ALIAS`
- **Valeur :** `marketpos`

### 4. `KEY_PASSWORD`
- **Nom du secret :** `KEY_PASSWORD`
- **Valeur :** `SherwoodPos2026SecretKey!`

---

## 🛡️ Empreintes numériques du certificat (Fingerprints)

Ces empreintes peuvent être associées à Firebase Authentication, Google Play Console ou Google Cloud OAuth :

- **SHA-1 :**
  ```text
  9A:CF:7F:89:F2:37:95:92:82:FA:98:44:F7:3F:FF:33:D8:E8:7A:A0
  ```

- **SHA-256 :**
  ```text
  BC:53:D6:A9:2B:A4:5D:1D:0A:EE:F6:42:26:61:6E:E8:76:26:77:2E:B7:4C:BC:A2:97:3D:81:92:B6:DC:4C:C8
  ```

---

## 🚀 Fonctionnement des Workflows GitHub Actions (`deploy.yml` / `release.yml`)

Dès qu'un commit est poussé sur la branche `main` (ou via déclenchement manuel dans l'onglet **Actions > Deploy & Release > Run workflow**) :

1. **Génération & Signature Android :**
   - L'APK Release est automatiquement signé avec ce Keystore (`pos-module-pro-vX.Y.Z.apk`).
   - Le bundle Google Play AAB est automatiquement généré et signé (`pos-module-pro-vX.Y.Z-signed.aab`).
   - L'APK universel debug reste disponible pour tests rapides (`pos-module-pro-vX.Y.Z-debug.apk`).
2. **Déploiement Web automatique :**
   - L'application Web de production est déployée instantanément sur **GitHub Pages**.
   - L'archive ZIP de production Web (`pos-module-web-vX.Y.Z.zip`) est jointe à la Release GitHub.
3. **Résilience intégrée :**
   - Même si les secrets GitHub ne sont pas encore configurés, le workflow génère automatiquement un keystore de secours temporaire afin que la compilation et la release ne soient jamais bloquées.
