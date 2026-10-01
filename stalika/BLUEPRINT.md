# Blueprint · Stalika

Construit avec Fable 5.1 (effort non connu depuis la session), sous-agents Sonnet 5 · 2026-09-30.
Méthode : buildyoursite. Dépôt : `juliengastal11-dot/MindFlow`, dossier `stalika/`.

**En une phrase.** Le site de Stalika, l'activité de Julien Gastal : des sites sur mesure pour
restaurants, coachs, artisans et commerces, partout en France. L'accueil est **un film joué au
défilement** : cinq scènes épinglées qui racontent une seule chose chacune, puis une fin calme
qui mène à une conversation de dix questions. Deux arguments doivent apparaître, et ils sont
les scènes 2 et 4 : **pas un modèle**, et **le lien de relecture**.

Les hypothèses sont numérotées `H1…`, les sections `§1…`. Les textes sont dans `CONTENU.md` et
se posent tels quels.

---

## Mise à jour du 2026-09-30 au soir : palette « Camel Linen », film sans épinglage

J a refusé l'accueil épinglé à l'essai (la page semblait buguer) et a gardé Stalika et son logo
en abandonnant les pistes florales. Deux décisions remplacent ce qui suit là où elles le
contredisent : **les scènes ne s'épinglent plus**, chacune joue son animation une fois à
l'arrivée (`film.duree`) ; **la palette est « Camel Linen »**, fournie par J (thème shadcn/ui :
Inter, Georgia, JetBrains Mono, interlettrage -0,02 em, rayon 0,75 rem, ombre noire à 40 %,
flou 25 px, décalage 10 px). Relevé et contrastes : en tête de `app/globals.css`. Deux écarts
assumés pour la lisibilité : texte sombre sur les boutons camel, et `encre` (#7B6537) pour le
camel en texte. La nuit reprend la version sombre de la même palette.

## Mise à jour du 2026-10-01 : la roue des sites (scène « Sur mesure »)

À la demande de J, le champ de neuf cartes dessinées (`Champ3D`) laisse la place à une **roue** :
les trois sites de Julien sur un cylindre couché (`components/ui/roue.tsx`), à gauche, et le texte
du sur mesure à droite, **sur téléphone comme sur ordinateur**. Idée tirée de 21st
(« vertical-image-stack », fourni par J), avec la géométrie de « Cylinder Carousel » et l'inertie
de « Wheel Carousel » ; aucun code repris.

- **Le mouvement** : la roue tourne seule, s'attarde 2,5 s sur chaque site puis bascule vers le
  suivant (`film.roue` dans `lib/mouvement.ts`). Elle s'attrape à la souris et au doigt, se lance
  avec inertie et se pose sur la carte la plus proche ; flèches du clavier, points, bouton pause
  (WCAG 2.2.2). Elle s'arrête au survol et hors de l'écran. Entrée : elle fait un tour complet et
  se pose sur la première carte. Mouvement réduit : elle ne tourne pas seule, aucune vidéo.
- **Un vrai cylindre, pas des plaques** (demande de J, 2026-10-01) : chaque carte est un pan
  courbe, découpé en 12 bandes horizontales (de petits canevas) que la CSS pose une à une sur le
  cylindre. La carte de face est légèrement bombée, haut et bas fuyant vers l'arrière ; les deux
  autres, plus inclinées, s'enroulent derrière. Le rayon se déduit de la hauteur de la carte et de
  l'arc qu'elle couvre (57° pour trois cartes). La lumière, les reflets et les coins arrondis se
  jouent bande par bande. Le site est peint à plat par `lib/peinture-carte.ts` puis découpé en
  bandes : la vidéo joue dans un élément caché, chaque image est recopiée dans les bandes. Piège
  noté dans le code : une bande se pose AU MILIEU de la carte et c'est la rotation qui l'amène à son
  angle ; posée à son rang, elle sortirait du cylindre.
- **Les cartes** montrent le haut de chaque site sur téléphone, **en action** : la devanture de
  la pizzeria en boucle ; l'arrivée sur Popec puis sa bande qui défile. Aucun lien.
- **VTBON, en calques** : le site a un fond fixe derrière toute la page, un film (cuir surpiqué,
  puis le chauffeur et son téléphone, puis la route de nuit) que le défilement fait avancer, avec
  un voile qui s'assombrit. La première version de la carte l'avait perdu : la capture masquait les
  éléments fixes. La carte le rejoue maintenant : 40 images du film, le voile et la courbe
  d'avancement du site, et la page en tranches transparentes qui défile par-dessus. L'entrée du
  héros se rejoue bloc par bloc (surtitre, titre, texte, bouton, mentions), comme sur le site, à
  chaque arrivée de la carte. Film pris sur `vtbon.fr/video/hero-portrait.mp4`.
- **Le site défile dans la carte** de face, jusqu'au pied de page : **au doigt**, directement (on
  glisse sur la carte du milieu ; au-dessus ou en dessous, on fait tourner la roue ; sur le texte,
  on fait défiler la page) ; **à la souris**, après un clic sur la carte (Échap pour sortir). Les
  tranches de la page se chargent au fil du défilement ; la roue attend 6 s après la lecture.
- **Les sites** (`lib/realisations.ts`) : la Pizzeria des Allées, VTBON et Popec, capturés en
  ligne le 2026-10-01. Deux sites d'exemple imaginés le même jour ont été retirés à la demande de J.
- **Les outils** pour refaire les captures : `outils/realisations/` à la racine du dépôt (non
  publié).

Ce qui change ailleurs : **H5** ne tient plus (la roue montre les vrais sites des clients, à la
demande de J). Le paragraphe de la scène et ses trois points sont dans `CONTENU.md`.

## Mise à jour du 2026-10-02 : le bouton du hero qui tombe jusqu'à l'ordinateur

À la demande de J (overlay, puis tchat), le bouton pilule du hero devient un **Cyber Button** de
21st (`jahed/cyber-button`) qui lit **« Parlons projet »** et raconte un petit film. Le code de 21st
est **copié tel quel** (`components/ui/cyber-button.tsx`, avec l'accord exprès de J ; une seule
retouche : `bg-gradient-to-*` devient `bg-linear-to-*`, que le garde-fou exige, rendu identique).
Ses jetons « shadcn » (`--primary`, `--foreground`…) sont des alias de nos jetons dans
`app/globals.css`, répétés sous `.nuit` et `.jour`. Le halo pointillé et le cadre qui s'éclaire au
survol sont ceux de l'original ; la lueur est camel (`primary`).

**Le déroulé (première étape, faite)** : `components/ui/bouton-chute.tsx`.
1. **Premier clic** : le bouton s'accroupit et saute s'accrocher **au bord du menu**, par son coin
   haut gauche (le hero n'a pas la place de le laisser pendre là où il est). Il se balance 4,4 s
   comme une plaque pendue à un clou (presque debout : un rectangle long pend par un coin à la
   verticale), puis s'arrête. Un indice discret : « Encore un clic : il tombe. ».
2. **Second clic** : le clou lâche, le bouton **tombe de scène en scène** pendant que la page
   défile avec lui (5,5 à 9 s selon la longueur du trajet), rebondit sur les éléments marqués
   `data-rebond` (titres, textes, cartes), s'écrase à chaque choc, fait un tour sur lui-même quand
   il est assez haut, et **se pose à côté de l'ordinateur, sur la dernière image du ciel**, réduit
   de moitié (la falaise est loin). Un repère « Faites défiler » apparaît : on entre dans
   l'ordinateur en défilant, ou en cliquant sur le bouton, qui emmène à la fenêtre de discussion.
   Le visiteur peut passer la chute (molette, doigt, Échap, bouton « Passer »).
3. Le bouton posé s'efface sur les premiers pixels de la plongée ; en remontant, il reste là où il est
   tombé (« le bouton reste en bas », J).
- **Réglages** : `MOUVEMENT.bouton` dans `lib/mouvement.ts` (durées, gravité, rebonds, échelles).
  **Calcul** : `lib/chute.ts` (pur, déterministe : balancement, arcs de parabole, caméra monotone).
  **Où il atterrit** : `POSE_BOUTON` dans `lib/ciel.ts` (en fractions de l'image entière).
  **Défilement** : la page suit le bouton par l'instance de Lenis du site (`lib/defilement.ts`).
- **`data-rebond`** : un élément qui porte cet attribut sert d'appui. Vide : il tressaille au choc.
  `sec` : il sert d'appui sans bouger (ce que GSAP anime déjà : les cartes de la cascade). Posé
  aujourd'hui sur le texte du hero, les titres et textes des trois scènes, les cartes de « Utile »
  et la maquette de « La relecture ».
- **Accessibilité** : le vrai lien reste dans le hero (clavier, lecteurs d'écran : deux Entrées font
  le même parcours, avec annonces) ; la copie qui voyage est décorative. **Mouvement réduit, écran
  de moins de 520 px de haut, défilement fluide absent, ou sans JavaScript : un simple lien vers
  `/contact`.**
- **Pas encore fait (deuxième étape)** : si le visiteur ne clique pas, le bouton descend quand même
  de section en section : 1,5 s après qu'il s'est arrêté sur une section, le bouton y trouve un
  endroit où s'accrocher (par un coin, il se balance puis s'arrête), reste cliquable (un clic le
  fait tomber et emmène à l'ordinateur), ne remonte jamais, et finit près de l'ordinateur sur la
  dernière image. Décisions de J : coin haut gauche, balancement de quelques secondes puis arrêt,
  indice discret, le bouton reste en bas quand on remonte.

## §1 · La barre de direction

| | Décidé |
|---|---|
| Genre | Vitrine, avec un espace privé pour lire les réponses au questionnaire |
| Écran prioritaire | **Les deux autant** : composé à 375 px, vérifié de près à 1280 px |
| Qui parle | **Julien, en son nom** (« je »), vouvoiement du visiteur |
| Direction | **« La terrasse, le jour et la nuit »** (version 90°, décidée par J le 2026-09-30 sur le logo et un composant 21st) : le site est **clair et chaud**, papier crème et marine du logo, l'orange du logo pour tout ce qui appelle un geste, un serif au trait peint pour les titres. L'ouverture est une **illustration peinte à nous**, en calques, le monde des clients de Julien en plein jour. Le film passe **la nuit** pour les scènes 2 à 4 (le monde du logo, où vivent les effets), et revient au jour pour l'offre et la fin calme : un arc jour, nuit, jour |
| Élément signature | **La correction.** Un mot barré et réécrit, un texte qui se décode, une ligne reprise sur la page : le site montre partout ce qu'il vend, un site qu'on corrige jusqu'à ce qu'il soit le vôtre, pas un modèle. Test : sans elle, il reste un joli site sombre ; avec elle, on comprend le métier |
| Mouvement | Ample (vitrine, `--motion 7`) pour les arrivées ; **le film** pour l'accueil : descendre joue, remonter rembobine |
| Ce qui se tait | Les photos : il n'y en a aucune. Une seule image, l'illustration de l'ouverture, à nous. Le reste vit de ses composants dessinés, du logo et de la typographie. L'orange est rare : il remplit un bouton, souligne un mot, ne porte jamais de texte sur fond clair |
| Décor | Le jour : le papier crème, nu, et l'illustration en ouverture. La nuit : les **orbites**, deux grands arcs fins qui tournent lentement avec la page, seul décor des trois scènes sombres. Un fond SVG de plus au maximum (séparateur avant la fin calme) |

## Relevé de design (§2)

**Requêtes** (moteur Pro Max, `search.py`, rendu le 2026-09-30) :

1. `web design studio building custom websites for local restaurants shops and artisans, dark premium, motion driven storytelling --design-system --stack nextjs --variance 3 | 5 | 8 --motion 7`
2. `--domain color` sur onze mondes réels (terrasse la nuit, passe en cuisine, enseigne néon, bar de nuit, ciel étoilé, livraison de nuit, musique, podcast, portfolio photo, cinéma, terminal)
3. `--domain typography` : `web studio freelance developer geometric sans friendly confident french small business`, puis deux requêtes de contrôle (display géométrique ; grotesk neutre)
4. `--domain landing` : `Storytelling-Driven`, `Portfolio Grid`, `Bento Grid Showcase`
5. `--domain gsap` : `scroll pinned scenes storytelling scrub timeline text scramble decode split text`
6. `--domain style` : `dark glow glassmorphism scroll storytelling depth`

| | Ce que le moteur a rendu | Ce qu'on garde |
|---|---|---|
| Design system (1) | « Premium black + gold », Cormorant, fond clair, **identique aux trois niveaux d'audace** | **Non** : c'est la palette-réflexe « premium / sombre », la requête nommait l'ambiance et non le métier |
| Palette (2) | « Time amber + night indigo on dark » (Alarm & World Clock) : Primary #D97706 · Accent #6366F1 · Background #0F172A · Foreground #FFFFFF | **Oui**, rôles réattribués : l'ambre devient l'accent (l'action), l'indigo le secondaire |
| Typographie (3) | « Friendly SaaS » : Plus Jakarta Sans, seule | **Oui**, une seule famille variable, les titres montent en graisse |
| Motif de page (4) | Scroll-Triggered Storytelling : accroche > chapitres (problème, chemin, réponse) > appel final ; indicateur de progression ; mobile simplifié ; état final en mouvement réduit | **Oui**, c'est le film. Portfolio Grid et Bento écartés comme structure, le bento gardé comme agencement de la scène 3 |
| GSAP (5) | `pin` + `scrub`, pas plus d'une ou deux sections épinglées par page, SplitText incluse dans GSAP 3.13, état final en mouvement réduit | **Oui pour la mécanique. Cinq épinglages, décision de J**, avec des épinglages courts sur mobile et un test sur vrai téléphone |
| Style (6) | Glassmorphism : voile translucide, bord clair, flou 10 à 20 px | **En partie** : voile et bord clair sur la barre de recherche, les bulles et les cartes ; **aucun flou animé** (coût sur mobile) |

**Ajusté, et pourquoi.** Texte #FFFFFF → #F8FAFC (jamais blanc pur). Texte sur ambre : blanc
donnait 3,4:1, la nuit (#0F172A) donne 5,9:1, c'est elle. Indigo #6366F1 → #4F46E5 dès qu'il
porte du texte (6:1 au lieu de 4,3:1) ; le #6366F1 reste pour les halos et les orbites. Cartes,
sourdine et bordures dérivées de la nuit : #1E293B, #172033, #283449. Rayon des cartes 1 rem.

**Version 90° (2026-09-30).** J a envoyé son logo (marine #070F27, crème, orange #FF8F03,
baseline « Digital & Conseil ») et proposé une direction claire et illustrée d'après le composant
21st « ghibli-robot-hero ». Décision : ni la nuit seule, ni le 180°. **Le jour** : fond #FBF6EE
(papier crème), texte #070F27 (17,6:1), cartes blanches, sourdine #F1EADF, bordures #E2D9C9, gris
#4B5470 (7:1), secondaire ciel #DBE8F4, accent #FF8F03 avec texte marine dessus (8,3:1). L'orange
ne porte jamais de texte sur clair (2,1:1). **La nuit** (classe `.nuit`, mêmes noms de variables) :
fond #070F27, texte #F6F1E8 (16,9:1), cartes #111A3A, gris #AAB2C8 (9:1), orange inchangé (8,3:1).
Typographie : Averia Serif Libre (Google Fonts, via `next/font`) pour les titres, Plus Jakarta Sans
pour le reste. General Sans, la police du composant, vient de Fontshare : pas de CDN autorisé et
licence non vérifiée, écartée. L'indigo de la palette « Time amber + night indigo » disparaît.

**Écarté, et pourquoi.** Le doré (« Dramatic dark + spotlight gold ») : trop proche de l'identité
noir et or de la Pizzeria des Allées, un client. Le vert néon (« Dark audio + play green ») : la
famille de la vidéo de référence et la palette-réflexe « tech », J a choisi la terrasse.

## §3 · Voix des clients

Relevé sur le web le 2026-09-30, formulations exactes ou presque. Ce sont *leurs* mots, pas ceux
du métier vu de l'intérieur ; ils nourrissent `CONTENU.md`.

| La douleur | Le résultat espéré | L'objection, avant de signer |
|---|---|---|
| « impossible de mettre à jour le menu autrement qu'en image » (litl.it, 2023) | « je peux publier mes nouveaux projets moi-même en vingt minutes » (témoignage, blog Wix) | « site créé depuis une page blanche ou à partir d'un template ? » (avivasigorta.fr) |
| « le coût d'un site d'agence, trop élevé pour une entreprise récente » (litl.it) | « six à neuf demandes qualifiées par mois » (idem) | « combien d'allers-retours de modifications sont prévus ? » (idem) |
| « 500 € promis en pub, 1 500 à 8 000 € réels » (mkz-consulting.fr, ipaoo.fr, 2026) | « réactif, à l'écoute, force de proposition », « rien à redire » (avis clients de freelances : super-webmaster, 2vcreation, antoine-koe, multiverseweb) | « à qui appartiennent les droits sur le design, le contenu, les visuels ? » (avivasigorta.fr) |
| « 20 à 40 heures de votre temps » pour le faire soi-même (cenligne.com, 2026) | | « demandez à voir la console d'administration, testez l'ajout d'un texte » (idem) |
| « un concours pour cacher les horaires d'ouverture » (litl.it) | | « le devis couvre-t-il les trois prochaines années : hébergement, domaine, mises à jour ? » (idem) |
| « Instagram attire l'attention mais ne structure pas l'offre » (orizuru.fr) | | « pour un artisan à 2 000 ou 3 000 € par mois, 3 000 € d'un coup, c'est compliqué » (sk-web.fr, cenligne.com) |

Ce que ça décide : le héros parle du client qui cherche sur son téléphone ; la scène 2 répond à
« template ou page blanche » ; la scène 4 répond à « je ne peux pas modifier » ; la scène 5 répond
aux droits, au prix et au délai ; « payable en plusieurs fois, sans frais » répond au budget ; la
FAQ reprend les six objections, une par question. Aucun témoignage inventé : la section « preuve
chiffrée » de la vidéo de référence n'existe pas ici, faute de chiffre mesuré.

## Relevé d'inspiration (§4)

Bibliothèque : le connecteur 21st (recherche par besoin, images de rendu regardées sur une
planche-contact, aucun code récupéré). Le skill `bibliotheques-ui` n'est pas dans cette session,
c'est dit. Les fiches du moteur Pro Max complètent.

| Section | Consulté | Ce qu'on reprend | Ce qu'on laisse |
|---|---|---|---|
| Scène 1 · recherche | 21st « Autocomplete » (cubby-ui), « Search Empty State » (arihantcodes), images regardées | barre pleine largeur, loupe à gauche, liste de suggestions collée sous la barre, la suggestion choisie surlignée | l'état vide, la grille de raccourcis |
| Scène 2 · champ 3D | 21st « 3D Parallax Unfurling Gallery » (piyushxdev), « Scroll Cards » (ishamsu), « Scroll Hero Section » (rahil1202) | la matrice de cartes inclinées qui se dévoile en colonnes ; la liste de mots qui s'allument un à un, pour les qualificatifs | les photos, les particules, le survol qui incline |
| Scène 3 · bento | 21st « bento grid 01 » (avanishverma4), « Bento » (kinfe123) ; Pro Max « Bento Grid Showcase » | grille 2×2 sombre, une carte plus haute que les autres, un glyphe géant par carte, mobile en pile | les images de fond, le survol vidéo |
| Scène 4 · relecture | 21st « Chat Messages » (nexus-ui), « Typing Indicator » (ddoemonn) ; le mode relecture de la Pizzeria des Allées (`docs/relecture.md` de son dépôt) | bulle à queue, indicateur de frappe ; le surlignage pointillé au survol puis trait plein au clic | le fil de discussion complet |
| Scène 5 · offre | 21st « Logo Cloud 15 » (shadcnui-blocks) pour la carte bordée à halo ; Pro Max « climax CTA » | une carte d'offre bordée, halo ambre sur le bord, le chiffre en display | le faisceau qui court sur la bordure |
| Ouverture · illustration | 21st « ghibli-robot-hero » (composant trouvé par J) | la composition : une grande image peinte plein cadre, un voile dégradé vers le bas pour poser le texte, un serif de titre sur un sans de texte, un bouton translucide à bord clair | **l'image elle-même** (elle appartient à son auteur), le robot, les polices chargées depuis un CDN, le « style Ghibli » nommé comme tel |
| Bandeau de confiance | 21st « Logo Cloud Marquee » (olewandowski1), « Logo Cloud Marquee » (scrollxui) | le défilement continu, fondu sur les bords, pause au survol ; le titre court au-dessus | le double sens, les logos en couleur |
| Décor · orbites | 21st « Spinning Arc Logo with Gradient Text » (minhxthanh) | arcs concentriques fins, vitesses différentes, sur fond nuit | le dégradé animé du texte |
| Conversation | 21st « Questionnaire » (uiable), « Segmented Progress Questionnaire » (sean0205), « Chat Messages » (nexus-ui) | une question à la fois, les choix en cartes qu'on touche, la barre de progression segmentée, les réponses en bulles à droite | la validation croisée, le récapitulatif en puces |
| FAQ | à consulter par l'agent avant d'écrire, deux sources (accordéon) | | |
| Espace privé | dessiné d'après le module `admin` du socle et `structures.md` (back-office) | tableau, filtres légers, confirmation avant suppression | |

## §5 · Pages et squelettes

Cinq champs : nom, hauteur (`bandeau`, `normal`, `grand`, `plein`), fond, contenu, mouvement.

```squelette Accueil /
Nav | bandeau | background | Monogramme + Stalika, bouton Contact, lien WhatsApp, lien d'évitement
Scène 1 · Ils vous cherchent | plein | background (jour, illustration en calques) | Eyebrow, H1, texte, barre de recherche qui se tape, suggestions, 2 boutons, indice de défilement | EntreeHero, Paysage, Scene, Frappe
Scène 2 · Pas un modèle | plein | background **nuit** | Eyebrow 01, H2, mot qui se décode, texte · neuf cartes en perspective, d'abord identiques, qui deviennent différentes | Scene, Decode, Champ3D
Scène 3 · Utile | plein | primary **nuit** | Eyebrow 02, H2, texte · bento de 4 cartes : agenda qui se remplit, courbe qui se trace, PDF qui s'empile, étoiles | Scene, Cascade, Trace
Scène 4 · La relecture | plein | background **nuit** | Eyebrow 03, H2, texte · maquette client : surlignage, bulle, ligne barrée puis réécrite, tampon | Scene, Frappe, Barre
Scène 5 · Livré | plein | background (jour) | Eyebrow 04, H2, 4 coches · carte d'offre : 300 €, plusieurs fois, 72 h en rouleaux, France, bouton | Scene, Rouleaux
Ils m'ont fait confiance | bandeau | muted | Trois noms et leur sous-titre, en défilement, liens | Defilant
Julien | normal | background | Eyebrow, H2, un paragraphe | Reveal
Questions fréquentes | normal | background | Eyebrow, H2, six questions en accordéon | Reveal
On en parle ? | grand | primary | Eyebrow, H2, 2 boutons | Reveal
Pied de page | normal | background | Stalika · Julien Gastal, phrase, WhatsApp, liens légaux, Cookies, Espace privé
```

```squelette Contact /contact
Nav | bandeau | background | Monogramme + Stalika, retour à l'accueil, WhatsApp
Conversation | plein | background | H1, bulle d'accueil, dix questions une à une (bulles à gauche, réponses à droite, choix en cartes ou champ), progression n/10, retour, envoi, succès | Reveal sur la première bulle, puis le fil se déroule au clic
Pied de page | normal | background | Liens légaux, WhatsApp
```

```squelette Espace privé /admin
Nav admin | bandeau | card | Demandes, Voir le site, Déconnexion
Demandes | normal | background | Compteur à traiter, tableau date · prénom · activité · budget · délai · statut, état vide
Détail /admin/demandes/[id] | normal | background | Retour, H1, toutes les réponses, boutons WhatsApp ou e-mail, statut, archiver, supprimer avec confirmation
```

```squelette Légal /mentions-legales /confidentialite /connexion /404
Nav | bandeau | background | Monogramme + Stalika, retour
Texte | normal | background | Gabarits du module, trous marqués ; confidentialité : questionnaire et cookies ; connexion : formulaire du module ; 404 : deux boutons
Pied de page | normal | background | Liens légaux, WhatsApp
```

## §6 · Le film, scène par scène

Toutes les scènes : une `Scene` épinglée, chronologie GSAP liée au défilement (`scrub`, lissage
`MOUVEMENT.film.lissage`), hauteur `film.hauteur` écrans sur ordinateur et `film.hauteurMobile`
sur téléphone. **Mouvement réduit : rien n'est épinglé, chaque scène affiche son état final,
défilement natif.** Sans JavaScript, tout le texte est là, dans l'ordre de lecture. Uniquement
`transform` et `opacity` en animation, aucun `filter` animé, `will-change` posé à l'entrée de la
scène et retiré à la sortie.

| Scène | Ce qui bouge, dans l'ordre de la chronologie | Ce qui répond |
|---|---|---|
| 1 · Ils vous cherchent | Au chargement : `EntreeHero` sur eyebrow, H1, texte, boutons, l'illustration déjà là. Au défilement : les calques de l'illustration glissent à des vitesses différentes (`Paysage` : ciel lent, collines, terrasse au premier plan plus vite) et le voile monte ; la barre se tape lettre à lettre (`Frappe`), les trois suggestions se déplient, la première se surligne, la barre glisse vers le haut et la phrase de fin apparaît | les deux boutons (accent, contour) ; le lien WhatsApp |
| 2 · Pas un modèle | Le champ de neuf cartes identiques s'incline et la caméra glisse (`Champ3D`) ; une carte sur deux devient son métier, puis les autres ; le mot en accent se décode trois fois (`Decode`) ; le texte arrive en dernier | rien : les cartes ne mènent nulle part, elles ne réagissent pas au curseur |
| 3 · Utile | Les quatre cartes entrent en `Cascade` ; puis, au fil du défilement : les créneaux se remplissent un à un, la courbe se trace (`Trace`), les pages du contrat s'empilent et la coche apparaît, les étoiles s'allument et le bouton Itinéraire se pose | rien : cartes non cliquables |
| 4 · La relecture | La maquette se pose ; un pointeur glisse vers la ligne d'horaires, contour pointillé puis plein ; la bulle s'ouvre et se tape (`Frappe`) ; la ligne d'origine se barre (`Barre`) et la nouvelle se tape à sa place ; le tampon se pose ; la légende apparaît | rien |
| 5 · Livré | Les quatre coches se cochent une à une ; la carte d'offre glisse, « 300 € » apparaît immobile, « 72 h » roule de 00 à 72 (`Rouleaux`), la zone et le bouton arrivent | le bouton (accent) |
| Fin calme | `Defilant` pour le bandeau, `Reveal` sur Julien, la FAQ et l'appel ; les orbites terminent leur rotation | les trois noms du bandeau (liens, `lien-fleche`) ; l'accordéon (`<details>`, focus visible) ; les deux boutons |

**L'arc jour, nuit, jour.** La scène 1 est le jour : l'illustration, le papier. Entre la scène 1
et la scène 2, le fond passe à la nuit sur la fin de l'épinglage de la scène 1 (une transition de
couleur de fond, `background-color` sur la section suivante, jamais un fondu d'image). Les scènes
2, 3 et 4 portent `.nuit` et les orbites. La scène 5 revient au jour et la fin calme reste claire.
Le logo suit : version crème sur la nuit, version marine sur le jour (`public/logo-clair.png`,
`public/logo-nuit.png`, nommés par le fond qu'ils attendent).

**Mobile.** Mêmes scènes, épinglage plus court, six cartes dans le champ, la maquette de la scène
4 en pleine largeur sous le texte, le bento en pile. `ScrollTrigger.normalizeScroll(true)` activé
sur tactile et **testé sur un vrai iPhone par J** : la barre d'adresse de Safari fait sauter les
épinglages, c'est le risque connu de cette page.

**Ce qu'on refuse.** Rebond, élastique, rotation gratuite ; un compteur sur le prix ; une scène
sans message ; rejouer une arrivée.

## §7 · Modèles, routes, actions

**Base (SQLite, Prisma).** `Demande` (les réponses du questionnaire, un statut `a_traiter |
repondu | archive`), `User`, `Account`, `Session`, `VerificationToken` (module auth), `Reglage`
(socle). Schéma déjà poussé.

**Routes.** `/`, `/contact`, `/admin`, `/admin/demandes/[id]`, `/connexion`,
`/mentions-legales`, `/confidentialite`, `/api/auth/*`, `not-found`.

**Server actions.**

| Action | Fichier | Garde |
|---|---|---|
| `envoyerDemande(fd)` → `{ succes, message }` | `lib/actions/demandes.ts` | validation serveur de chaque champ (prénom non vide, contact WhatsApp = numéro français ou e-mail valide, consentement coché, choix parmi les libellés de `lib/questionnaire.ts`), champ pot-de-miel vide, **débit limité** : cinq envois par adresse et par heure, en mémoire |
| `changerStatut(id, statut)`, `supprimerDemande(id)` | `lib/actions/admin-demandes.ts` | `exigeAdmin()` en tête de chaque action, statut parmi les trois valeurs, `revalidatePath` |

Côté formulaire, l'action est enveloppée (`useActionState`), jamais branchée nue sur
`action={…}` : elle renvoie un état.

**Fichiers-contrats** (écrits par l'orchestrateur avant les agents) : `lib/site.ts` (fait),
`lib/mouvement.ts` (fait), `lib/formats.ts` (socle), `lib/reglages.ts` (défauts : téléphone =
WhatsApp affiché, e-mail vide), `lib/questionnaire.ts` (les dix questions, pur : id, type,
libellé, choix, facultatif ; source unique de la conversation et des libellés de l'espace
privé), `app/layout.tsx` (fait), `app/page.tsx` (assemblage), `prisma/seed.ts` (fait), et les
primitives du film.

**Primitives du film**, dans `components/ui/`, valeurs dans `lib/mouvement.ts` :

| Primitive | Contrat |
|---|---|
| `Scene` | épingle sa section, expose une chronologie liée au défilement aux enfants (contexte), hauteur selon l'écran, garde mouvement réduit (pas d'épinglage, chronologie à 1) |
| `Frappe` | un texte qui se tape entre deux positions de la chronologie, curseur qui clignote ; rendu serveur : le texte complet |
| `Decode` | un mot qui se décode vers le suivant à une position donnée ; rendu serveur : le premier mot ; les autres `aria-hidden` |
| `Barre` | un trait qui barre un mot entre deux positions |
| `Trace` | un `path` SVG qui se trace selon la progression (`stroke-dasharray`) |
| `Champ3D` | un plan incliné de cartes en perspective, caméra qui glisse, chaque carte avec un état « modèle » et un état « métier » qui se croisent à une position donnée |
| `Rouleaux` | un nombre dont chaque chiffre roule jusqu'à sa valeur ; rendu serveur : la valeur finale |
| `Orbites` | le décor fixe des scènes de nuit : deux arcs qui tournent de `film.orbites.rotation` degrés sur la page |
| `Paysage` | l'illustration de l'ouverture en calques (ciel, lointain, premier plan) : chaque calque glisse selon la progression, à sa vitesse (`film.paysage`) ; mouvement réduit : immobile ; rendu serveur : les calques posés, l'image au premier plan avec `priority` |
| `Pile` | **non retenue** : la scène « notifications » de la vidéo n'a pas d'équivalent sans chiffre vrai |

## §8 · Qui écrit quoi

| Périmètre exclusif | Agent | Fichiers |
|---|---|---|
| Contrats et primitives | l'orchestrateur | `lib/questionnaire.ts`, `lib/reglages.ts`, `app/page.tsx`, `components/ui/{scene,frappe,decode,barre,trace,champ3d,rouleaux,orbites,paysage}.tsx`, `app/icon.svg`, `public/logo-*.png`, `public/paysage/*`, `.buildyoursite/consignes-agents.md` |
| Scènes 1 et 2 | agent A | `components/sections/scene-recherche.tsx`, `scene-modele.tsx`, `carte-metier.tsx` |
| Scènes 3, 4 et 5 | agent B | `components/sections/scene-utile.tsx`, `scene-relecture.tsx`, `scene-livre.tsx` |
| Le cadre | agent C | `components/sections/nav.tsx`, `pied-de-page.tsx`, `confiance.tsx`, `julien.tsx`, `faq.tsx`, `appel.tsx`, `consentement.tsx`, `components/seo/json-ld.tsx`, `app/not-found.tsx` (habillage), `app/mentions-legales/page.tsx` et `app/confidentialite/page.tsx` (habillage et sections ajoutées) |
| La conversation | agent D | `app/contact/page.tsx`, `components/conversation/*.tsx`, `lib/actions/demandes.ts` |
| L'espace privé | agent E | `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/demandes/[id]/page.tsx`, `lib/actions/admin-demandes.ts`, `components/admin/*.tsx` |

Section → réglages consommés → prop :

| Section | Lit | Par |
|---|---|---|
| Nav, pied de page, appel, conversation | `SITE.whatsapp`, `lienWhatsApp()` | import direct de `lib/site.ts` |
| Mentions légales, confidentialité | `lireReglages()` (e-mail, téléphone) | serveur |
| Conversation, détail d'une demande | `QUESTIONS` de `lib/questionnaire.ts` | import direct |
| Toutes les scènes | `MOUVEMENT.film` | via les primitives, jamais en direct |

## §9 · SEO et lancement

| Point | Qui | État |
|---|---|---|
| Titres, descriptions, canoniques par page | agents (chaque page exporte `metadata`) | à construire, vérifié par le garde-fou |
| Image de partage | socle, couleurs de la direction | fait |
| Logo | fourni par J (sans fond), deux versions dérivées : crème pour la nuit, marine pour le jour | fait |
| Favicon | l'orchestrateur : le « A » du logo, triangle crème et triangle orange sur marine | fait |
| Illustration d'ouverture | à nous : générée (Higgsfield, accord de J image par image) ou dessinée en SVG ; en calques pour la parallaxe ; jamais l'image du composant 21st | à produire, accord attendu |
| `robots.txt`, `sitemap.xml` | socle, pages `/` et `/contact`, privés exclus | fait |
| Données structurées `ProfessionalService` (nom, zone France, téléphone, « à partir de 300 € ») | agent C | à construire |
| Page 404 habillée | agent C | à construire |
| Pages légales | module, trous marqués (voir plus bas) | greffées |
| Mobile, composé à 375 px | tous | vérifié à l'auto-test |
| Polices servies par le site | `next/font` | fait |
| Statistiques : **Google Analytics 4, chargé après consentement seulement**, bandeau à deux boutons de même poids, choix gardé six mois, ré-ouvrable par le lien « Cookies » | agent C ; l'identifiant `NEXT_PUBLIC_GA_ID` par J | à construire, identifiant à fournir |
| Search Console | J, après la mise en ligne (sans cookie) | plus tard |
| URL publique `NEXT_PUBLIC_SITE_URL` | J (nom de domaine à acheter, hors de ce chantier) | à confirmer |
| Hébergement | J (Hostinger, formule avec Node.js). **La base SQLite exige un disque persistant** ; sinon, passer à Postgres avant la mise en ligne | à confirmer |
| Compte administrateur en production | J : `ADMIN_EMAIL`, `ADMIN_PASSWORD` dans `.env` ; sans mot de passe, le seed refuse en production | à confirmer |
| Performance | aucune image lourde, `npm run build` sans avertissement | vérifié à l'auto-test |

**Sécurité, verdict à la remise (2026-09-30)** : relu, conforme. `lib/actions/demandes.ts` valide
chaque champ contre `lib/questionnaire.ts`, refuse un pot-de-miel rempli, limite à cinq envois par
adresse et par heure, ne redirige jamais ; `lib/actions/admin-demandes.ts` appelle `exigeAdmin()`
en tête de chaque action, borne l'identifiant et le statut ; `app/admin/layout.tsx` revérifie la
session et le rôle ; les deux `dangerouslySetInnerHTML` (script `html.js` et JSON-LD) portent du
contenu écrit par nous ; `.env` est hors git, le seed refuse un mot de passe absent en production.
Testé de bout en bout dans un navigateur : envoi d'une demande, connexion, changement de statut,
suppression. La liste d'origine : `.env` hors git ; aucune
clé dans le code ; `dangerouslySetInnerHTML` seulement pour le script `html.js` du socle et le
JSON-LD (contenu construit par nous, jamais par un visiteur) ; chaque action d'administration
derrière `exigeAdmin()` ; `?suite=` limité à un chemin interne (module) ; validation serveur et
débit limité sur l'envoi public ; aucune requête construite depuis une entrée utilisateur.

## Hypothèses

**Si je me trompe ici, on reconstruit.**

- **H1** L'accueil entier est le film : cinq scènes épinglées, puis une fin calme. Ce n'est pas un héros animé au-dessus d'une page classique.
- **H2** « Le code est à vous » est écrit sur le site (scène 5 et FAQ). J l'inscrit dans ses conditions de vente ; sinon la ligne disparaît.
- **H3** La scène 3 affirme que Stalika livre une réservation avec agenda, un espace client et un contrat en PDF. J l'a confirmé pour Popec ; le dépôt public de Popec que j'ai lu ne montre que sa landing et une réservation.

**Si je me trompe ici, on corrige.**

- **H4** Pas de page Réalisations. Les trois noms vivent dans le bandeau de confiance, chacun avec un lien quand il existe : VTBON → `vtbon.fr` ; Popec → `popec-run.vercel.app` (donné par J le 2026-10-01) ; pizzeria à confirmer.
- **H5** Le champ 3D montre neuf cartes de métiers dessinées en code, jamais les sites des clients. *Abandonnée le 2026-10-01 : la roue montre les sites, voir la mise à jour en tête.*
- **H6** Statistiques : Google Analytics 4 après consentement (H de mise en œuvre : bandeau, cookie de choix, chargement conditionnel) et Search Console à côté. Un outil sans cookie éviterait le bandeau ; J a demandé les cookies.
- **H7** La section « Julien » dit ce qu'il fait aujourd'hui (sites et applications pour des commerces, depuis Béziers, pour toute la France, du dessin à la mise en ligne) et ne parle pas de son passé en restauration : demandé par J.
- **H8** La scène 4 cite la Pizzeria des Allées comme exemple de relecture, avec l'accord du client dit obtenu.
- **H9** Contact : WhatsApp seul. L'e-mail viendra plus tard ; la page des mentions légales le marque à confirmer en attendant.
- **H10** Le questionnaire compte dix questions, celles de `CONTENU.md`, dans cet ordre ; les réponses vont en base et se lisent dans `/admin` ; aucune alerte par e-mail, aucun service d'envoi n'est branché.
- **H11** Compte administrateur : `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env` ; en développement, `admin@stalika.local` / `stalika-dev`.
- **H12** Le bandeau dit « VTBON · l'application des chauffeurs VTC » et « Popec · coach sportif » : à relire par J.
- **H13** « 72 h » est le seul chiffre animé (rouleaux). « 300 € » reste immobile : un prix ne se compte pas.
- **H14** Sur téléphone : mêmes scènes, épinglages de 1,7 écran, six cartes dans le champ, bento en pile.
- **H15** Le logo fourni par J remplace le monogramme : la version crème sur la nuit, la version marine sur le jour, l'orange conservé tel quel. Le favicon est le « A » du logo. L'image de partage est le logo crème sur marine.
- **H16** Le nom de dossier est `stalika`, dans le dépôt MindFlow, sans dépôt git imbriqué : c'est le dépôt qui suit.
- **H18** L'illustration d'ouverture montre le monde des clients de Julien en plein jour (une terrasse, une rue de village du sud), peinte, sans personnage identifiable, sans robot, sans texte dans l'image. Elle est en trois calques au moins pour la parallaxe. Tant qu'elle n'est pas produite, un paysage dessiné en SVG (calques plats aux couleurs du thème) tient sa place, et le site fonctionne avec.
- **H19** La nuit est une classe (`.nuit`) qui remappe les variables du thème : les composants du socle ne connaissent qu'un vocabulaire, `bg-background`, `text-foreground`, et suivent.
- **H17** Le mode Édition au clic (overlay) n'est pas exploitable depuis cette session cloud ; il reste dans le projet pour une reprise en local. Les retours se font dans le chat, ou sur le blueprint.

## Trous à confirmer par J

Marqués `[[À CONFIRMER PAR L'UTILISATEUR : …]]` dans le code, listés par le garde-fou :

- Mentions légales : raison sociale, forme juridique, adresse, SIRET, TVA, RCS, directeur de publication, hébergeur (nom, adresse, téléphone). J réfléchit à la structure (VTBON avec un associé, ou une autre) : on garde les trous.
- L'adresse e-mail de contact.
- Le lien de la pizzeria dans le bandeau (celui de Popec est posé).
- L'identifiant Google Analytics.
- L'URL publique et l'hébergement, au moment de la mise en ligne.

## Questions ouvertes

Validées par J le 2026-09-30 avec le reste du blueprint, dans le sens proposé : oui, oui, le lien « Cookies ».

1. La légende de la scène 4 nomme la pizzeria : d'accord pour la citer là, en plus du bandeau ?
2. La FAQ dit « je peux m'occuper de l'hébergement et du domaine, ou vous laisser la main » sans prix : c'est bien ce que tu proposes ?
3. Le bandeau de consentement rouvert par un lien « Cookies » en pied de page : ça te va, ou tu préfères un bandeau unique ?

## Plus tard : l'assistant de discussion (noté le 2026-09-30, à la demande de J)

La fenêtre qui s'ouvre au bout de la plongée est une discussion. Le design est en place avec un déroulé scripté ; le branchement viendra quand J l'aura décidé.

- **Moteur** : l'API Claude (compte console.anthropic.com, clé côté serveur uniquement, jamais dans le dépôt public ; plafond de dépense). Ce n'est pas l'abonnement Claude de J ni cette session. Modèle à choisir par J : Opus 5.5 (4 $ / 20 $ par million de tokens), Sonnet 5.5 (2 $ / 10 $), Haiku 4.5 (1 $ / 5 $), grille Anthropic du 2026-09-25. Estimation : 0,05 à 0,22 $ par conversation de dix échanges, à mesurer.
- **Déroulé voulu par J** : premier message du visiteur écrit tout seul (« Hey, salut ! J'ai un projet de site et j'aimerais qu'on en discute »), première réponse toujours la même (prénom, tutoiement ou vouvoiement, description du projet), puis Claude prend la suite, relance, personnalise (utilise le prénom). En fin d'échange : choisir un créneau (calendrier + créneaux) ou passer sur WhatsApp.
- **Transparence** : l'assistant dit qu'il est l'assistant IA de Julien (règlement (UE) 2024/1689, art. 50, applicable depuis le 2026-08-02, cité de mémoire, à vérifier). Il ne se fait jamais passer pour J. Passage de relais vers J (résumé par e-mail ou WhatsApp).
- **Agenda** : accès propre au site (Google Agenda autorisé par J), lecture des créneaux libres uniquement, aucun détail des rendez-vous. Réservation directe ou demande validée par J : à décider.
- **Garde-fous** : sujet limité à l'offre, seuls les prix publiés, résistance aux détournements, messages et échanges plafonnés par visiteur, plafond de dépense.
- **RGPD** : information avant l'échange, durée de conservation, politique de confidentialité, Anthropic comme sous-traitant ; à vérifier sur cnil.fr avant la mise en ligne.
- **À décider par J** : le modèle, le nom de l'assistant, le canal de notification, réservation directe ou validée.
- **En attendant** : le déroulé est scripté ; après le premier message du visiteur, la fenêtre propose honnêtement un créneau ou WhatsApp, qui envoient un vrai message à J (rien n'est réservé en silence).
