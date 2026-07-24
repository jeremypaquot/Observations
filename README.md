# Jérémy Paquot - Observations Animalières

Application web personnelle permettant d’enregistrer et de cartographier des
observations d’animaux réalisées pendant des sorties photo.

## Fonctionnalités

- authentification par mot de passe avec session signée ;
- API protégée par cookie `HttpOnly` ;
- carte Leaflet/OpenStreetMap des observations ;
- popups détaillées ;
- formulaire alimenté par les tables D1 ;
- sélection GPS par clic ou géolocalisation ;
- interface responsive, sans framework ni compilation.

## Structure

```text
.
├── index.html
├── css/styles.css
├── js/
│   ├── api.js
│   ├── app.js
│   ├── config.js
│   ├── map.js
│   └── observation-form.js
└── worker/
    ├── src/
    │   ├── auth.js
    │   ├── database.js
    │   ├── index.js
    │   ├── responses.js
    │   └── validation.js
    ├── test/validation.test.js
    ├── package.json
    └── wrangler.toml
```

## Développement local du frontend

Depuis la racine :

```powershell
python -m http.server 8080
```

Ouvrir ensuite <http://localhost:8080>.

Le Worker autorise `localhost:8080` et `127.0.0.1:8080` pour le développement.

## Configuration Cloudflare

### 1. Prérequis

- Node.js récent ;
- un compte Cloudflare ;
- Wrangler authentifié avec `npx wrangler login` ;
- la base D1 `obs` et ses tables existantes.

### 2. Lier D1

Récupérer l’identifiant :

```powershell
cd worker
npx wrangler d1 list
```

Remplacer `REMPLACER_PAR_L_ID_D1` dans `worker/wrangler.toml` par l’identifiant
de la base `obs`.

Le binding attendu par le code est `DB`. Aucune migration métier n’est requise
et aucune table existante n’est modifiée.

### 3. Enregistrer les secrets

```powershell
npx wrangler secret put APP_PASSWORD
npx wrangler secret put SESSION_SECRET
```

- `APP_PASSWORD` est le mot de passe de connexion.
- `SESSION_SECRET` doit être une longue valeur aléatoire différente du mot de passe.
- aucun de ces secrets ne doit être ajouté à Git.

Pour le développement local seulement, copier `.dev.vars.example` vers
`.dev.vars`, puis remplacer ses valeurs. `.dev.vars` est ignoré par Git.

### 4. Origine autorisée

La variable `ALLOWED_ORIGIN` de `wrangler.toml` vaut par défaut :

```text
https://jeremypaquot.github.io
```

Si GitHub Pages utilise un domaine personnalisé, remplacer cette valeur par
l’origine exacte du site, sans chemin ni barre oblique finale.

### 5. Tester et déployer

```powershell
cd worker
npm install
npm run check
npm run dev
npm run deploy
```

Après le déploiement, vérifier que l’URL du Worker correspond à `apiBaseUrl`
dans `js/config.js`.

## Déploiement GitHub Pages

1. Pousser les fichiers sur la branche `main`.
2. Ouvrir **Settings → Pages** dans GitHub.
3. Dans **Build and deployment**, choisir **Deploy from a branch**.
4. Sélectionner la branche `main` et le dossier `/ (root)`.
5. Enregistrer et attendre la publication.

Le site sera disponible à une adresse de la forme :

```text
https://jeremypaquot.github.io/Observations/
```

## Contrat API

Routes publiques :

- `POST /login`

Routes authentifiées :

- `GET /session`
- `POST /logout`
- `GET /especes`
- `GET /espaces`
- `GET /comportements`
- `GET /observations`
- `POST /observations`

Les requêtes frontend utilisent `credentials: "include"`. Le Worker renvoie un
cookie signé, `HttpOnly`, `Secure`, partitionné pour l’appel intersite et limité
par une durée de sept jours.

## Vérification après déploiement

1. Une requête non authentifiée à `/observations` doit renvoyer `401`.
2. Un mauvais mot de passe doit renvoyer `401`.
3. Une connexion valide doit ouvrir la carte.
4. Les marqueurs doivent afficher toutes les informations demandées.
5. Les listes du formulaire doivent provenir de D1.
6. Un clic sur la carte doit remplir latitude et longitude.
7. Après enregistrement, l’observation doit apparaître sur la carte.
8. La déconnexion doit rendre les routes métier inaccessibles.
