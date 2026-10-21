# 🔐 Secrets GitHub — Signature Android & Clés API

Tous les secrets de production vivent **uniquement dans GitHub Actions**.
Aucun keystore, mot de passe ou clé API ne doit être commité dans le dépôt.

Dépôt : `https://github.com/Connacri/MARKETPOS`

---

## 1. Où configurer les secrets ?

1. Ouvrir **Settings → Secrets and variables → Actions**.
2. Cliquer sur **New repository secret**.
3. Ajouter chaque secret ci-dessous.

En ligne de commande (recommandé) :

```bash
gh secret set ANDROID_KEYSTORE_BASE64 --repo Connacri/MARKETPOS < credentials/keystore.base64
gh secret set KEYSTORE_PASSWORD --repo Connacri/MARKETPOS
gh secret set KEY_ALIAS --repo Connacri/MARKETPOS
gh secret set KEY_PASSWORD --repo Connacri/MARKETPOS
gh secret set VITE_SUPABASE_URL --repo Connacri/MARKETPOS
gh secret set VITE_SUPABASE_ANON_KEY --repo Connacri/MARKETPOS
```

---

## 2. Secrets de signature Android

| Secret | Description |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Keystore `.jks` / `.p12` encodé en Base64 sur une seule ligne |
| `KEYSTORE_PASSWORD` | Mot de passe du keystore |
| `KEY_ALIAS` | Alias de la clé (`marketpos`) |
| `KEY_PASSWORD` | Mot de passe de la clé (souvent identique au keystore) |

Génération d'un keystore de production **en local** (jamais commité) :

```bash
export KEY_ALIAS=marketpos
export KEYSTORE_PASSWORD="$(openssl rand -base64 32)"
export KEY_PASSWORD="$KEYSTORE_PASSWORD"

bash scripts/generate-release-keystore.sh ./credentials
# → credentials/release.keystore
# → credentials/keystore.base64
```

Sauvegarder `credentials/` dans un gestionnaire de mots de passe (le dossier est ignoré par Git).
**Sans ce keystore, il est impossible de publier une mise à jour de l'application sur Google Play.**

---

## 3. Secrets des clés API (Web + Android)

Ces valeurs sont injectées au build par Vite (`VITE_*`). Elles ne sont jamais écrites dans le code.

| Secret | Exemple | Visibilité |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Configuration |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` ou clé `anon` | Publique par conception (protégée par RLS) |

Pour un build local :

```bash
cp .env.example .env
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run build
```

> ⚠️ Ne jamais utiliser la clé `service_role` côté client. Elle contourne les policies RLS.

---

## 4. Ce que fait le pipeline

Workflow : `.github/workflows/release.yml`

1. `version` : calcule `versionName`, `versionCode` et le tag (`v1.0.<run_number>` par défaut).
2. `build` :
   - installe Node 22 et **Java 21** (obligatoire pour Capacitor 8 / AGP 8.13) ;
   - lint TypeScript + build Web avec les secrets Supabase ;
   - `cap sync android` ;
   - reconstruit le keystore depuis `ANDROID_KEYSTORE_BASE64` ;
   - compile `assembleRelease` (APK) et `bundleRelease` (AAB) ;
   - vérifie la signature avec `apksigner` + `jarsigner` et compare l'empreinte SHA-256 du certificat ;
   - publie `APK`, `AAB`, ZIP Web et `SHA256SUMS.txt` dans **GitHub Releases** ;
   - supprime le keystore du runner même en cas d'échec.
3. `.github/workflows/deploy-pages.yml` déploie le Web sur GitHub Pages.

Le build échoue volontairement si un secret de signature est absent : aucun keystore de secours n'est généré (un APK signé avec une clé différente ne pourrait jamais mettre à jour l'application installée).

---

## 5. Vérifications après un release

```bash
gh run list --workflow "Release Android (APK + AAB signés)"
gh release view --repo Connacri/MARKETPOS
```

Contrôle local d'un APK téléchargé :

```bash
apksigner verify --print-certs pos-module-pro-vX.Y.Z.apk
sha256sum -c SHA256SUMS.txt
```

---

## 6. Rotation / incident

Si un keystore ou un mot de passe a été exposé (commit, capture, log) :

1. Générer un nouveau keystore avec `scripts/generate-release-keystore.sh`.
2. Mettre à jour les 4 secrets Android.
3. Si l'application est déjà publiée sur Google Play, utiliser **Play App Signing** et contacter le support Google pour réinitialiser la clé d'upload.
4. Révoquer et régénérer toute clé API concernée (Supabase, etc.).
