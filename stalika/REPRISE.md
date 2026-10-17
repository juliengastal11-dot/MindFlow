# Reprise du travail sur Stalika (passage de relais du 2026-10-01)

À lire en premier par la session qui reprend. Le détail des choix est dans `BLUEPRINT.md`
(dont la section « Plus tard : l'assistant de discussion »).

## Où est le code

- Dépôt `juliengastal11-dot/MindFlow`, dossier `stalika/` (Next.js 15, TypeScript, Tailwind 4,
  GSAP + ScrollTrigger, Lenis, Prisma SQLite, Auth.js).
- Branche de travail `claude/jolly-heisenberg-1uq9pg`. On y commite en local ; `main` n'est mis à
  jour que quand J le demande.
- Aperçu : **https://stalika-apercu.vercel.app** (Vercel, équipe VTBON-App, projet
  `stalika-apercu`, créé par J le 2026-10-01). Relié au dépôt, dossier racine `stalika`, branche
  `main` : **chaque push sur `main` redéploie l'aperçu** (environ 1 min 30), d'où la règle :
  **on ne pousse que quand J le demande** (décision du 2026-10-01). La commande de construction
  est dans `stalika/vercel.json` (elle crée la base SQLite, non persistante : le formulaire de
  contact et l'espace privé n'enregistrent rien sur l'aperçu). Seule variable posée chez
  Vercel : `AUTH_SECRET`. Le connecteur Vercel de Claude peut lire les déploiements et leurs
  journaux, mais pas créer de projet (403).
- Netlify : abandonné (J, 2026-10-01). `netlify.toml` peut être supprimé.
- Garde-fou du kit : `node <buildyoursite>/scripts/verifier-projet.mjs --projet .`
  (état au 2026-10-01 : 0 bloquant, 7 avertissements connus).
- Compte admin de dev : `admin@stalika.local` / `stalika-dev` (variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Structure actuelle de l'accueil (`app/page.tsx`)

1. `Ciel` (`components/ui/ciel.tsx`) : un seul plan du haut de page jusqu'à la discussion.
   - En haut, la vidéo du hero (`public/hero/video*.webm|mp4`, boucle de 20 s : la caméra
     s'approche, un nuage arrive de la gauche, traverse le plateau et se déverse dans le vide,
     puis elle recule ; deux plans joués vers l'avant, montés par `outils/hero/monter.mjs`).
     Au premier défilement elle se met en pause et la caméra recule vraiment (30 images
     `public/hero/recul/`, tirées du plan retour).
   - Puis 111 images (`public/ciel/bureau|mobile`) : lumière du hero → crépuscule → nuit →
     nuit où le personnage s'étire → aube → lumière dorée. Heure linéaire avec le défilement.
     Étoiles filantes dessinées en code la nuit.
   - Par-dessus : `Hero` (section transparente), `SceneModele` (#sur-mesure, la roue des trois
     sites de Julien : `components/ui/roue.tsx`, voir `BLUEPRINT.md`), `SceneUtile`
     (#utile), `SceneRelecture` (#relecture : une piste de 3,6 écrans où le contenu reste collé et où le film suit le défilement, voir `BLUEPRINT.md`, mise à jour du 2026-10-07), puis `Plongee` (`components/ui/plongee.tsx`) :
     le vol jusque dans l'ordinateur (120 images verticales sur téléphone, 61 images Kling sur ordinateur) ; sur l'écran du
     portable, un bureau de Mac collé en perspective (`components/ui/ecran-mac.tsx`, coins et épaule mesurés dans
     `lib/plongee-ecran-mobile.ts` et `lib/plongee-ecran-bureau.ts`), d'où la fenêtre de discussion sort du Dock avec l'effet
     Génie ; puis la caméra entre dans la fenêtre et le bureau s'efface vers la page (voir `BLUEPRINT.md`, mise à jour du
     2026-10-17, soir).
2. `Discussion` (`components/ui/discussion.tsx`) : premier message écrit tout seul, réponse
   fixe, puis relais honnête (créneau → WhatsApp pré-rempli). L'API Claude n'est PAS branchée.
3. `SceneLivre` (prix), `Confiance`, `Julien`, `Faq`, `Appel`, pied de page.

## Ce qui reste à faire ou à vérifier

- Le bouton du hero (Cyber Button « Parlons projet », `components/ui/bouton-chute.tsx`) : première
  étape faite (décrochage, balancement, chute jusqu'à l'ordinateur ; **en un seul clic depuis le 2026-10-17**) ; **deuxième étape reportée par J
  (2026-10-02), jusqu'à ce qu'il ait retravaillé toutes les sections** : les perchoirs de section quand
  le visiteur ne clique pas (voir `BLUEPRINT.md`, mise à jour du 2026-10-02). Après chaque retouche de
  section, vérifier que les `data-rebond` suivent. À tester par J sur iPhone (fluidité de la chute).
- Tests de J sur iPhone : fluidité du recul au premier défilement, clavier dans la discussion.
- **Fait le 2026-10-17 : tout le chemin du téléphone en vertical** (J : « Tout le chemin en 9:16 c'est ok, bonne qualité et le chalet. Garde le
  côté où il s'allume la nuit »). Chalet en rondins, vidéo du hero, cinq passages du ciel et plongée générés en 1 080 × 1 912 : voir `BLUEPRINT.md`
  (mise à jour du 2026-10-17, suite) et `outils/hero/LISEZMOI.md` (tâches Higgsfield, commandes pour tout refaire). Mesuré sur l'iPhone de J (build de
  production) : 58 à 59 images par seconde partout. **À regarder par J** : le nuage (variante A, nouveau plan) et le sol de la plongée (retours du jour : les vols Kling faisaient lever le sol ou mettaient l'herbe à la taille ; un vol MiniMax H3 d'une seule traite jusque dans l'écran les remplace, voir `BLUEPRINT.md`), le rendu sur son téléphone (chalet, nuit, plongée dans l'écran, bouton
  qui tombe) et le poids (environ 16 Mo sur téléphone, contre 8,5 avant ; voir `BLUEPRINT.md` pour l'alléger). **L'ordinateur garde la chaîne
  paysage (la cabane)** : la refaire en 16:9, avec le chalet, coûterait environ 170 crédits ; J a répondu « plus tard ». Aucune génération sans le
  prix annoncé et l'accord de J.
- Tester sur le vrai iPhone, en direct (2026-10-17) : le skill global `/phone` (`~/.claude/skills/phone`, son README l'explique).
  Il monte un pont (relais sur le réseau local + télécommande de la page ouverte dans Safari) et rend une seule adresse à copier dans
  Safari ; ensuite Claude lit la console, mesure, défile, touche et chronomètre la fluidité sur le téléphone. Un iPhone ne se pilote pas
  depuis Windows (pas d'ADB) : on pilote la page, pas l'appareil ; pas de captures d'écran (J les envoie, ou un récepteur AirPlay sur
  le PC, non installé). Le débogage ADB sans fil, c'était pour l'application VTBON sur Android, pas pour ce site.
- Mode « animations réduites » : revérifié le 2026-10-17 au soir pour la discussion (la fenêtre posée dans la page, sans bureau) ;
  le reste de la page non revérifié.
- Sur ordinateur, la série Kling garde plusieurs haubans qui pendent dans les nuages (en diagonale, images 26 à 54) : le hauban de la
  série du téléphone a été retiré (`outils/hero/retirer-cable.py`), pas ceux-là. À traiter avec la chaîne paysage quand elle sera refaite.
- Sur ordinateur, la plongée Kling (61 images pour un grand mouvement) fait un fantôme quand deux images se fondent (deux têtes,
  deux écrans) : à reprendre avec la chaîne paysage (plus d'images, ou un vol MiniMax comme sur téléphone ; se compte en crédits).
- Pour voir la page sans le panneau navigateur de l'appli (caché : ses pages y sont figées), un Chrome sans fenêtre piloté par le
  protocole DevTools, sans paquet à installer : Node 24 a `WebSocket` ; lancer `chrome.exe --headless=new
  --remote-debugging-port=9333 --user-data-dir=<dossier jetable>`, puis `Emulation.setDeviceMetricsOverride`, `Page.navigate`,
  `Runtime.evaluate` (défiler) et `Page.captureScreenshot`.
- Plus de voiles sombres sur les scènes 01 à 03 (2026-10-07, demande de J) : le texte tient par une ombre douce (`sur-ciel`). À regarder sur téléphone au crépuscule (début de la 01) et à l'aube (fin de la 03), voir `BLUEPRINT.md`.
- Le 2026-10-09, à regarder sur téléphone : l'île du menu en verre (même verre que le bandeau de cookies), le bandeau de cookies centré (donc plus haut : 257 px) et le bouton « Parlons projet » au milieu de la page, sur sa propre rangée (voir `BLUEPRINT.md`). Le verre n'a été vu que dans Chrome : à regarder sur Safari (iPhone) aussi.
- Rechargement à chaud et films des scènes (développement seulement, constaté le 2026-10-07) : React peut remplacer les
  éléments d'une scène sans relancer les effets des primitives qui les animent ; la scène reste en place, le défilement la
  suit, et plus rien ne bouge. `Scene` expose `rebatir()` (voir son en-tête) : la fenêtre de « La relecture »
  (`relecture-fenetre.tsx`) s'en sert d'elle-même et se remet à jour toute seule. Les autres primitives (`Frappe`, `Decode`,
  `Trace`…) gardent les éléments trouvés au montage : si une modification de leur fichier fige une scène, recharger la page.
  Aucun effet en production.
- Assistant de discussion (API Claude, agenda, RGPD, transparence IA) : plus tard, voir `BLUEPRINT.md`.
- Mentions légales et données marquées `[[À CONFIRMER PAR L'UTILISATEUR : …]]`.

## Médias générés (Higgsfield, compte de J, 905 crédits restants au 2026-10-17)

Les fichiers bruts de la session précédente sont perdus avec son conteneur ; ils restent
téléchargeables depuis Higgsfield par leur identifiant de tâche :

| Plan | Tâche Higgsfield |
|---|---|
| Hero 10 s (plan large → image B), remplacé le 2026-10-04 : une bouffée de poussière y jaillissait du sol | `c0a43cd4-bfba-4632-ac7d-d315b8564518` |
| Hero, aller (plan large → image B, un nuage arrive de la gauche et se déverse dans le vide), Kling 3.0 Pro, 17,5 crédits | `56f637b9-1d4d-4d58-9ed4-e9ec3887cc65` |
| Hero, retour (image B → plan large, plateau dégagé), Kling 3.0 Pro, 17,5 crédits | `597187a2-e38a-4586-b785-a74a2ce6c2d6` |
| Lumière du hero → crépuscule | `2455a96d-7484-4fbc-9bf2-64db9afd98e5` |
| Crépuscule → nuit | `f7f1aabb-2eee-4247-9af6-3eb6a689b3e1` |
| Nuit, le personnage s'étire | `1760f812-3716-45cc-bea1-ac238e55ef20` |
| Nuit → aube | `a41b3f0a-20c1-4c1b-84f9-7795cd23c463` |
| Aube → lumière dorée (fin = 1re image de la plongée) | `0c2f7efb-c6bd-4933-9d38-b7ca5fa6a7f8` |

**La chaîne verticale du téléphone (2026-10-17)** : huit plans Kling retenus et leurs images clés, avec leurs tâches, dans `outils/hero/LISEZMOI.md`
(319 crédits dépensés ce jour-là : 19 pour les images, 12 plans Kling de 17,5 dont 5 écartés, un plan Seedance 2.5 à 70 écarté, un plan MiniMax H3 à 20 retenu pour la plongée ; le solde de J est passé de 1 224 à 905).
Les tâches du tableau ci-dessus sont celles de la chaîne paysage, toujours servie à l'ordinateur.

Montage (`outils/hero/monter.mjs`, depuis le 2026-10-04) : l'aller puis le retour, chacun
ralenti en cosinus, raccordés par des fondus de 0,4 s, la fin retombant sur le début ; version
mobile : le bandeau de 600 px pris à x = 278 de l'image de 1928, agrandi en 840 × 1506, comme
la série mobile du ciel. Les images clés données à Kling (plan large, image B) sont la première
et la dernière image du plan d'origine.

## Règles de travail avec J (à respecter)

- L'appeler « J », le tutoyer, répondre en français.
- Ne jamais inventer : « Je ne sais pas » si ce n'est pas vérifiable ; citer les sources.
- Aucune génération ni achat sans le prix annoncé et l'accord explicite de J, élément par élément.
- Le dépôt est public : aucun secret dans le code.
- Des références tierces (21st…), reprendre l'idée seulement, jamais le code ni les médias. Seule exception : quand J demande
  « exactement » ou donne son accord après qu'on lui a dit ce que coûte la récupération du code (le Cyber Button, copié tel
  quel le 2026-10-02 ; 21st donne deux récupérations de code par jour). Le carrousel d'iPhone de la section 02 (« Phone Mockups 1 »,
  demandé par J le 2026-10-02) vient du registre public de son auteur, Solace UI : gratuit, il ne compte pas dans les deux.
- Pas de tiret cadratin dans les textes.
- Commits locaux à chaque retouche ; **ne rien pousser** (ni la branche, ni `main`) tant que J ne le demande : chaque push sur `main` redéploie l'aperçu Vercel.

## Mettre en place le skill /overlay

Le skill est dans le dépôt `juliengastal11-dot/overlay`. Il lui faut Claude Code sur
l'ordinateur de J, avec le panneau navigateur, et Node 20 ou plus (README du skill).
Stalika ayant été construit avec `/buildyoursite`, le skill passe en proxy devant
`npx next dev` et les commentaires arrivent dans `.buildyoursite/comments.json`.
