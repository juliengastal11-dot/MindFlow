# Déployer MindFlow Business en HTTPS

Le HTTPS est indispensable : sans lui, pas d'installation PWA sur le téléphone, pas de notifications, pas de service worker (sauf sur `localhost`).

L'application tient dans **une seule image Docker** (le backend sert le front buildé) avec **un dossier de données** à conserver : `/app/backend/data` (base SQLite + clé secrète). Toute plateforme capable de lancer un conteneur avec un disque persistant convient.

## Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `SECRET_KEY` | oui | Signature des sessions et chiffrement des clés IA / Google. Longue chaîne aléatoire : `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `FRONTEND_URL` | oui | URL publique, ex. `https://mindflow.exemple.fr` (retour de connexion Google) |
| `COOKIE_SECURE` | oui | `true` derrière HTTPS |
| `SEED_DEMO` | non | `false` en production (sinon le compte démo est créé) |
| `PORT` | non | Port d'écoute, imposé par Railway / Render / Fly (`8000` par défaut) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | non | Google Calendar. Redirection : `https://VOTRE-DOMAINE/api/oauth/calendar/callback` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | non | Clé IA serveur (sinon chaque utilisateur met la sienne dans Paramètres) |
| `DATABASE_URL` | non | Vide = SQLite dans `data/`. PostgreSQL possible : `postgresql+psycopg://…` (ajouter `psycopg[binary]` à `backend/requirements.txt`) |

## Option A — Railway (le plus rapide, ~10 minutes)

1. Poussez le dépôt sur GitHub.
2. Sur [railway.app](https://railway.app) : **New Project → Deploy from GitHub repo**. Railway détecte le `Dockerfile`.
3. Onglet **Variables** : `SECRET_KEY`, `COOKIE_SECURE=true`, `SEED_DEMO=false`, `FRONTEND_URL` (l'URL fournie à l'étape 5).
4. Onglet **Volumes** : ajoutez un volume monté sur `/app/backend/data`.
5. Onglet **Settings → Networking → Generate Domain** : vous obtenez `https://xxx.up.railway.app`. Un domaine personnalisé se branche au même endroit (un enregistrement CNAME).
6. Redéployez après avoir renseigné `FRONTEND_URL`. Vérifiez `https://…/api/health`.

## Option B — Render

1. Poussez le dépôt sur GitHub.
2. Sur [render.com](https://render.com) : **New → Blueprint**, choisissez le dépôt : le fichier `render.yaml` crée le service web (Docker) et le disque persistant.
3. Renseignez `FRONTEND_URL` (`https://mindflow.onrender.com` ou votre domaine) dans les variables du service, puis redéployez.

Le disque persistant demande l'offre Starter. Sans disque, la base serait perdue à chaque déploiement.

## Option C — Fly.io

```bash
fly launch --copy-config --no-deploy          # utilise fly.toml, choisissez le nom de l'app
fly volumes create mindflow_data --size 1 --region cdg
fly secrets set SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')" FRONTEND_URL="https://mindflow-business.fly.dev"
fly deploy
fly scale count 1                             # une seule machine : la base est sur le volume
```

## Option D — Votre propre serveur (VPS) avec Docker Compose et Caddy

Caddy obtient et renouvelle les certificats Let's Encrypt tout seul.

1. Serveur avec Docker installé, ports 80 et 443 ouverts.
2. Enregistrement DNS `A` (et `AAAA`) de votre domaine vers l'IP du serveur.
3. Sur le serveur :

```bash
git clone <votre dépôt> mindflow && cd mindflow
cp deploy/env.production.example .env        # remplir DOMAIN et SECRET_KEY
docker compose up -d --build
docker compose logs -f app                    # « Application startup complete »
```

4. Ouvrez `https://VOTRE-DOMAINE`. Mise à jour : `git pull && docker compose up -d --build`.

## Après le déploiement

- **Compte** : créez le vôtre via « Créer un compte ». Laissez `SEED_DEMO=false` pour ne pas exposer le compte démo.
- **Installer la PWA** : Chrome / Edge → icône « Installer » dans la barre d'adresse ou Paramètres → Installer. iPhone : Safari → Partager → « Sur l'écran d'accueil ».
- **Notifications** : Paramètres → « Activer les notifications » (sur iPhone, uniquement depuis l'app installée, iOS 16.4+).
- **Google Calendar** : dans la console Google Cloud, ajoutez l'URI de redirection de production, renseignez les variables, redéployez, puis Paramètres → « Connecter Google Calendar ».
- **Sauvegarde** : le fichier `data/mindflow.db` (sur le volume). Par exemple `docker compose exec app python -c "import sqlite3; sqlite3.connect('data/mindflow.db').backup(sqlite3.connect('data/backup.db'))"` puis copiez `backup.db`.
- **Santé** : `GET /api/health` répond `{"status": "ok"}` ; la documentation interactive est sur `/api/docs`.

## Tester l'image en local (si Docker est installé)

```bash
docker build -t mindflow .
docker run --rm -p 8000:8000 -e SECRET_KEY=test -e SEED_DEMO=true -v mindflow-data:/app/backend/data mindflow
```

Puis http://localhost:8000 (compte démo `demo@mindflow.app` / `demo1234`).
