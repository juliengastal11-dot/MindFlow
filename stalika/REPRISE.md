# Reprise du travail sur Stalika (passage de relais du 2026-10-01)

À lire en premier par la session qui reprend. Le détail des choix est dans `BLUEPRINT.md`
(dont la section « Plus tard : l'assistant de discussion »).

## Où est le code

- Dépôt `juliengastal11-dot/MindFlow`, dossier `stalika/` (Next.js 15, TypeScript, Tailwind 4,
  GSAP + ScrollTrigger, Lenis, Prisma SQLite, Auth.js).
- Branche de travail `claude/jolly-heisenberg-1uq9pg`, fusionnée dans `main` à chaque étape.
- Aperçu : stalika-apercu.netlify.app, reconstruit par Netlify à chaque push sur `main`
  (`netlify.toml` à la racine, base `stalika`).
- Garde-fou du kit : `node <buildyoursite>/scripts/verifier-projet.mjs --projet .`
  (état actuel : 0 bloquant, 6 avertissements connus).
- Compte admin de dev : `admin@stalika.local` / `stalika-dev` (variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Structure actuelle de l'accueil (`app/page.tsx`)

1. `Ciel` (`components/ui/ciel.tsx`) : un seul plan du haut de page jusqu'à la discussion.
   - En haut, la vidéo du hero (`public/hero/video*.webm|mp4`, aller-retour 20 s, la caméra
     s'approche, rafale de poussière au début). Au premier défilement elle se met en pause et
     la caméra recule vraiment (30 images `public/hero/recul/`).
   - Puis 111 images (`public/ciel/bureau|mobile`) : lumière du hero → crépuscule → nuit →
     nuit où le personnage s'étire → aube → lumière dorée. Heure linéaire avec le défilement.
     Étoiles filantes dessinées en code la nuit.
   - Par-dessus : `Hero` (section transparente), `SceneModele` (#sur-mesure), `SceneUtile`
     (#utile), `SceneRelecture` (#relecture), puis `Plongee` (`components/ui/plongee.tsx`) :
     zoom dans l'ordinateur (61 images `public/hero/plongee/`), logo Stalika qui scintille sur
     l'écran (`lib/plongee-ecran.ts`), puis la fenêtre de discussion qui s'ouvre en « feuille ».
2. `Discussion` (`components/ui/discussion.tsx`) : premier message écrit tout seul, réponse
   fixe, puis relais honnête (créneau → WhatsApp pré-rempli). L'API Claude n'est PAS branchée.
3. `SceneLivre` (prix), `Confiance`, `Julien`, `Faq`, `Appel`, pied de page.

## Ce qui reste à faire ou à vérifier

- Tests de J sur iPhone : fluidité du recul au premier défilement, clavier dans la discussion.
- Mode « animations réduites » non revérifié après les derniers changements.
- Assistant de discussion (API Claude, agenda, RGPD, transparence IA) : plus tard, voir `BLUEPRINT.md`.
- Mentions légales et données marquées `[[À CONFIRMER PAR L'UTILISATEUR : …]]`.

## Médias générés (Higgsfield, compte de J, 62,67 crédits restants)

Les fichiers bruts de la session précédente sont perdus avec son conteneur ; ils restent
téléchargeables depuis Higgsfield par leur identifiant de tâche :

| Plan | Tâche Higgsfield |
|---|---|
| Hero 10 s (plan large → image B) | `c0a43cd4-bfba-4632-ac7d-d315b8564518` |
| Lumière du hero → crépuscule | `2455a96d-7484-4fbc-9bf2-64db9afd98e5` |
| Crépuscule → nuit | `f7f1aabb-2eee-4247-9af6-3eb6a689b3e1` |
| Nuit, le personnage s'étire | `1760f812-3716-45cc-bea1-ac238e55ef20` |
| Nuit → aube | `a41b3f0a-20c1-4c1b-84f9-7795cd23c463` |
| Aube → lumière dorée (fin = 1re image de la plongée) | `0c2f7efb-c6bd-4933-9d38-b7ca5fa6a7f8` |

Montage : la vidéo du hero suit une courbe cosinus (aller 10 s, retour 10 s) ; version mobile
recadrée à 600/1924 de large depuis 277/1924, pleine hauteur, comme la série mobile du ciel.

## Règles de travail avec J (à respecter)

- L'appeler « J », le tutoyer, répondre en français.
- Ne jamais inventer : « Je ne sais pas » si ce n'est pas vérifiable ; citer les sources.
- Aucune génération ni achat sans le prix annoncé et l'accord explicite de J, élément par élément.
- Le dépôt est public : aucun secret dans le code.
- Des références tierces (21st…), reprendre l'idée seulement, jamais le code ni les médias.
- Pas de tiret cadratin dans les textes.
- Pousser sur la branche puis fusionner dans `main` pour mettre l'aperçu à jour.

## Mettre en place le skill /overlay

Le skill est dans le dépôt `juliengastal11-dot/overlay`. Il lui faut Claude Code sur
l'ordinateur de J, avec le panneau navigateur, et Node 20 ou plus (README du skill).
Stalika ayant été construit avec `/buildyoursite`, le skill passe en proxy devant
`npx next dev` et les commentaires arrivent dans `.buildyoursite/comments.json`.
