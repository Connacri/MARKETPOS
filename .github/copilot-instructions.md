# Instructions du Projet (Custom Instructions) — POS Module Pro (MARKETPOS)

Collez ce texte dans la section **Custom Instructions** de votre projet AI Studio pour encadrer tous les futurs prompts et modifications de l'agent.

---

## 1. Gestion des Dépendances & CI/CD (GitHub Actions)
- **Gestionnaire de paquets exclusif** : Utilisez UNIQUEMENT `npm`. Ne jamais utiliser ni introduire `bun`, `yarn` ou `pnpm`.
- **Fichier de verrouillage obligatoire** : Ne JAMAIS supprimer `package-lock.json`. Toujours le conserver et le mettre à jour lors de l'ajout de nouvelles dépendances.
- **Actions GitHub robustes** :
  - Dans les workflows `.github/workflows/`, pour l'étape `actions/setup-node@v4`, ne pas forcer `cache: 'npm'` si un risque d'absence du lockfile existe.
  - Toujours utiliser une commande d'installation résiliente :
    ```bash
    if [ -f package-lock.json ]; then
      npm ci || npm install
    else
      npm install
    fi
    ```
- **Pas de conflits de verrous** : Ne jamais recréer `bun.lock`, `yarn.lock` ou `pnpm-lock.yaml`.

---

## 2. Architecture & Pile Technique
- **Frontend** : React 19, Vite 6, TypeScript (mode strict), Tailwind CSS v4 (`@tailwindcss/vite`).
- **Base de Données Locale** : IndexedDB (`ultraLocalDb` dans `src/services/localDb.ts`) avec indexation mémoire O(1) pour scans code-barres ultra-rapides.
- **Synchronisation Cloud** : PostgreSQL / Supabase (`src/services/supabaseSyncService.ts`).
- **Mobile / Android** : Capacitor 8 (`android/`), compilation APK via `./gradlew assembleDebug`.
- **Port de développement** : Vite doit toujours tourner sur le port `3000` et écouter sur `0.0.0.0` avec `allowedHosts: true`.

---

## 3. Charte Graphique & Design Responsif (Sherwood Forest)
- **Palette** : Vert forêt profond (`#1f3d29`, `#234931`), tons sable chaleureux (`#fdfbf7`, `#f7f2e7`, `#ece3d4`), bordures douces (`#d8cdba`).
- **Composants & Chips** :
  - Toujours prévoir un padding généreux (`px-4` à `px-6`, `py-2` à `py-3`) dans les chips, boutons et sélecteurs de filtres (ex: *Aujourd'hui*, *7 jours*, *30 jours*).
  - Éviter le texte condensé (`tracking-tight`) sur les petits écrans ; préférer `tracking-normal`.
  - Cibles tactiles d'au moins 44px de hauteur (`min-h-[44px]`).
- **Adaptabilité mobile** :
  - Ne jamais compresser plusieurs éléments complexes côte à côte sans séparateur ou disposition fluide.
  - Utiliser des grilles symétriques (`grid grid-cols-3` adaptées) ou des dispositions flexibles avec retour à la ligne (`flex-wrap`).

---

## 4. Vérification et Qualité du Code
- Après chaque modification :
  1. Exécuter la vérification TypeScript : `npm run lint` (`tsc --noEmit`).
  2. Exécuter la compilation de production : `npm run build` (`tsc -b && vite build`).
  3. S'assurer qu'aucune erreur de syntaxe ou d'import manquant ne subsiste.
