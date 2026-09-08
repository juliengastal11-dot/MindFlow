# MindFlow Business

Application PWA de productivité pour entrepreneurs : capturez tout ce qui vous passe par la tête, triez, planifiez, concentrez-vous, et voyez ce que vous repoussez.

Cinq écrans : **Aujourd'hui** · **Inbox** · **Planning** · **Buckets** · **Vue d'ensemble**, plus un bouton « Capturer » permanent et un mode **Focus**.

## Fonctionnalités

- **Inbox universelle** : capture en un instant, puis triage → 📅 Planifier · ✅ Tâche · 💡 Idée · 🗂️ Bucket · 📝 Note · 🅿️ Parking · 🗑️ Ignorer.
- **Priorité en 3 couleurs** : 🔴 Prioritaire (urgent + important) · 🟠 Important · 🟡 Urgent · ⚪ le reste attend. Visible partout.
- **Date vs échéance** : un créneau planifié (« quand je compte le faire ») et une échéance (« la limite »).
- **Aujourd'hui** : regroupé par priorité, avec le total de temps planifié.
- **Planning** : vue semaine et vue jour heure par heure, glisser-déposer pour replanifier.
- **Buckets** et **Parking** : espaces personnels (projets, envies, listes) ; le parking garde les idées sans encombrer le quotidien.
- **Organiser (IA)** / **Suggérer (IA)** : importance, type, durée et action proposés pour chaque élément. Avec votre clé Anthropic, OpenAI ou Gemini ; sans clé, un moteur heuristique par mots-clés.
- **Focus** : une mission, un minuteur (25 / 45 / 60 min), zéro distraction.
- **Rappels** : « Avez-vous fini cette tâche ? » après l'heure de fin (délai réglable, notifications navigateur).
- **Vue d'ensemble** : semaine (terminées, priorités, temps, captures), tâches en retard, ce que vous repoussez souvent.
- **Google Calendar** : synchronisation des créneaux planifiés (optionnel, voir plus bas).
- **PWA** installable, fonctionne hors ligne pour l'interface.

Compte de démonstration : `demo@mindflow.app` / `demo1234`.

## Stack

| Partie | Techno |
| --- | --- |
| Front | React 19, Vite, Tailwind CSS 3, Radix UI (shadcn), TanStack Query, framer-motion |
| Back | Python 3.11+, FastAPI, SQLAlchemy 2, SQLite (PostgreSQL possible), JWT, bcrypt |
| IA | SDK `anthropic` (Claude Opus 5), OpenAI et Gemini via REST, heuristiques en repli |

```
MindFlow/
├─ frontend/            # app React (Vite)
│  ├─ src/pages/        # Landing, Auth, Onboarding, AppShell, Today, Inbox, Planning, Buckets, Overview, Settings
│  ├─ src/components/   # CaptureDialog, ItemDialog, ItemCard, TriageRow, FocusDialog, badges, ui/ (shadcn)
│  └─ public/           # manifest.json, service-worker.js, icônes
├─ backend/
│  ├─ app/main.py       # application FastAPI (API sous /api + front buildé)
│  ├─ app/routers/      # auth, items, buckets, views (today/overview), user_settings, calendar, ai
│  ├─ app/services/     # ai.py (IA + heuristiques), gcal.py (Google Calendar), buckets.py
│  ├─ app/models.py     # User, Bucket, Item
│  └─ data/             # base SQLite (créée au premier lancement)
└─ dev.ps1              # lance back + front en développement
```

## Installation

Prérequis : Node.js 18+ et Python 3.11+.

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt      # (Linux/macOS : .venv/bin/pip)
copy .env.example .env                              # puis adaptez si besoin

# Front
cd ../frontend
npm install
copy .env.example .env
```

## Lancer en développement

Sous Windows, une seule commande :

```powershell
.\dev.ps1
```

Ou manuellement, dans deux terminaux :

```bash
cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload --reload-dir app --port 8000
```

```bash
cd frontend && npm run dev
```

- Front : http://localhost:3000 (Vite relaie `/api` vers le backend, pas de CORS à gérer)
- API : http://127.0.0.1:8000/api · documentation interactive : http://127.0.0.1:8000/api/docs

## Mettre en production

1. Construire le front : `cd frontend && npm run build` (résultat dans `frontend/dist`).
2. Le backend sert automatiquement `frontend/dist` s'il existe : l'application complète est alors disponible sur le port du backend, même origine pour le front et l'API.

```bash
cd backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Variables à régler dans `backend/.env` pour la production :

- `SECRET_KEY` : une longue chaîne aléatoire (sinon générée dans `backend/data/.secret_key`).
- `FRONTEND_URL` : l'URL publique (ex. `https://mindflow.exemple.fr`), utilisée pour le retour OAuth Google.
- `COOKIE_SECURE=true` derrière HTTPS.
- `CORS_ORIGINS` : inutile si le backend sert le front ; sinon listez les origines du front.
- `DATABASE_URL` : laissez vide pour SQLite, ou `postgresql+psycopg://…` (installer `psycopg[binary]`).

Le HTTPS est indispensable pour l'installation PWA, les notifications et le service worker (hors localhost). Hébergement simple : un VPS avec un reverse proxy (Caddy ou Nginx) devant uvicorn, ou une plateforme type Railway, Render ou Fly.io avec un volume persistant pour `backend/data`.

## Google Calendar (optionnel)

1. Console Google Cloud → créer un projet → activer l'API Google Calendar.
2. Identifiants → « ID client OAuth 2.0 » de type application Web. URI de redirection autorisée : `http://localhost:8000/api/oauth/calendar/callback` (et l'équivalent en production).
3. Renseigner `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI` dans `backend/.env`, redémarrer.
4. Dans l'application : Paramètres → « Connecter Google Calendar ». Les créneaux planifiés sont ensuite créés, déplacés et supprimés dans l'agenda principal (titre préfixé par la priorité, ✅ quand c'est terminé).

## Assistant IA

- Chaque utilisateur peut enregistrer sa propre clé (Paramètres → Assistant IA) : Anthropic, OpenAI ou Gemini. Les clés sont stockées chiffrées (Fernet, dérivé de `SECRET_KEY`).
- À défaut, `ANTHROPIC_API_KEY` dans `backend/.env` sert de clé serveur pour tous les comptes.
- Sans aucune clé, les boutons « Organiser » et « Suggérer » utilisent le moteur heuristique (mots-clés français : urgence, importance, verbes d'action, envies « un jour »…).
- Modèles : `ANTHROPIC_MODEL` (défaut `claude-opus-5`), `OPENAI_MODEL` (défaut `gpt-4o-mini`), `GEMINI_MODEL` (défaut `gemini-2.5-flash`).

## API (résumé)

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | Compte, session (JWT en Bearer + cookie) |
| GET | `/api/auth/me` | Profil courant |
| GET / POST | `/api/items?status=inbox,active,parked,done&planned=true` | Liste / création |
| PATCH / DELETE | `/api/items/{id}` | Modification (`clear_planned`, `clear_bucket`, `status`…) / suppression |
| POST | `/api/items/{id}/triage` | `{action: planifier|tache|idee|bucket|note|parking|ignorer, bucket_id?}` |
| POST | `/api/items/{id}/postpone` | Report d'un créneau (compteur de reports) |
| GET / POST / PATCH / DELETE | `/api/buckets` | Buckets |
| GET | `/api/today` · `/api/overview` | Vues agrégées (fuseau via l'en-tête `X-Timezone`) |
| PATCH | `/api/settings` | Nom, centres d'intérêt, délai de rappel, onboarding |
| POST / DELETE | `/api/settings/ai-key` | Clé IA de l'utilisateur |
| POST | `/api/ai/suggest` · `/api/ai/organize` | Suggestions IA |
| GET / POST | `/api/oauth/calendar/connect` · `/callback` · `/disconnect` | Google Calendar |

## Historique

Le projet a été démarré sur Emergent (prototype MVP puis refonte « 5 écrans »). Cette version reprend intégralement le front (récupéré depuis le bundle de prévisualisation) et réécrit le backend, avec quelques choix pour pouvoir tourner partout sans service externe : Vite à la place de Create React App, SQLite à la place de MongoDB (migration PostgreSQL possible via `DATABASE_URL`), synchronisation Google Calendar et assistant IA réellement câblés.

## Pistes suivantes

- Vue jour : blocs proportionnels à la durée, glisser pour redimensionner.
- « Combien de temps ça va me prendre ? » : proposer les tâches qui rentrent dans un trou de l'agenda.
- Bilan de fin de semaine par notification.
- Revue hebdomadaire du parking (« Tu as 8 éléments dans ton parking »).
- Tests automatisés (pytest côté API, Playwright côté front).
