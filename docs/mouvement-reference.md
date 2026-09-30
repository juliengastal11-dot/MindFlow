# Stalika — le mouvement de référence : un film qu'on fait défiler

## La source

Reel Instagram de Nicolas Canesi (compte `nicolas.scalyx`), publié le 29/09/2026, légende
« MOTION DESIGN OPUS 5.5 » : il filme son écran où tourne une vidéo animée de 40 secondes
pour son agence Scalyx. Julien veut **cet effet, mais piloté par le défilement** de la page,
pas sous forme de vidéo.

**Ce qu'on reprend : la forme, jamais le fond.** La vidéo ne nous appartient pas. On
s'inspire de la mécanique (comment les choses entrent, s'enchaînent, réagissent). Aucun de
ses textes, de ses maquettes, de ses chiffres ni de ses couleurs n'est repris. Les images
extraites restent hors du dépôt.

## Ce que fait la vidéo, scène par scène

Fond sombre (bleu nuit presque noir), grille de points à peine visible, **deux grands arcs
de cercle fins** qui traversent le bas de l'écran et relient toutes les scènes. Titres en
sans-serif géométrique, blanc, avec **un mot en couleur d'accent** (menthe). Aucun rebond,
aucun élastique : tout freine en fin de course.

| # | Message porté | Mécanique visible |
|---|---|---|
| 1 | « Vos futurs clients vous cherchent en ligne. » | Fond : champ de cartes de résultats inclinées en perspective, floutées. Eyebrow en petites capitales, titre **mot par mot**. Barre de recherche au premier plan : **texte qui se tape** avec curseur, puis **liste de suggestions** qui se déplie, et le pointeur qui en choisit une. |
| 2 | Logo de l'agence | Apparition centrée, respiration. |
| 3 | « On crée la vitrine digitale de votre entreprise. » | Maquette d'un site client sous le titre ; **la maquette défile à l'intérieur de son cadre** (héros → services → logos). |
| 4 | « Un site sur mesure / moderne. » (eyebrow « Nos réalisations ») | La scène **bascule en 3D** : la maquette rejoint un champ de cartes inclinées, et la caméra survole le champ. Chaque projet **arrive par un balayage horizontal** rapide (flou de mouvement, éclair blanc) et se pose incliné, avec sa légende (nom, métier, ville). Le deuxième mot du titre **se décode** lettre par lettre vers le qualificatif suivant : « sur mesure » → « moderne ». |
| 5 | « Visible sur Google / ChatGPT. » | Schéma de nœuds : icône du site au centre, **anneaux orbitaux** concentriques, satellites (mail, téléphone, épingle, étoile), **courbes qui se tracent** vers une fiche de résultat Google à droite. Le mot « Google » **se décode** en « ChatGPT ». |
| 6 | « Vos ~~visiteurs~~ deviennent des clients. » | À droite, **pile de notifications** : chaque nouvelle carte entre par le haut et pousse les autres vers le bas (devis, appel, avis 5 étoiles, itinéraire, message, rendez-vous), avec icône colorée et horodatage. À gauche, le titre arrive ligne par ligne, et **« visiteurs » est barré** quand « des clients » apparaît en accent. |
| 7 | Preuve : témoignage + « ≈ 20 prospects dès le premier mois » | Carte témoignage : avatar, nom, métier, **étoiles une à une**, citation **mot par mot** avec un mot en accent. À droite, **compteur à rouleaux** (« 00 » → « 20 »), puis **courbe qui se trace** de « Lancement » à « 1er mois », aire remplie en accent, badge au bout. |
| 8 | « On s'occupe de tout. » | **Bento de quatre cartes** en cascade : liste à coches qui se cochent une à une ; classement où « votre entreprise » **monte en première position** ; graphique à barres qui poussent mois par mois ; fiche Google. |
| 9 | « Envie d'en faire autant ? » → « Réservez votre rendez-vous gratuit. » | Question, puis appel à l'action : bouton pilule avec **halo** en accent. |
| 10 | Logo + signature | Fermeture calme. |

Entre les scènes : fondu, ou continuité par la caméra (la scène 3 devient la scène 4 sans
coupure). Le mouvement raconte à chaque fois une seule chose.

## La transposition : le défilement joue le film

**Principe.** Chaque scène devient une **section épinglée** : pendant que le visiteur fait
défiler, la section reste à l'écran et sa chronologie avance au rythme du défilement
(GSAP ScrollTrigger, `pin` + `scrub`). Descendre, c'est jouer ; remonter, c'est rembobiner.
Entre deux scènes épinglées, la page défile normalement. Le film, c'est la page d'accueil.

**Ce que le socle de buildyoursite a déjà** (vérifié dans `socle/`) : GSAP 3.13 avec
ScrollTrigger enregistré une fois (`lib/gsap.ts`), Lenis pour le défilement fluide
(`DefilementFluide`), la garde `mouvementReduit()`, le fichier-contrat `lib/mouvement.ts`,
et une primitive déjà pilotée par le défilement en continu (`Parallaxe`, `scrub: true`).

**Ce qu'il faut ajouter**, comme primitives dans `components/ui/`, valeurs dans
`lib/mouvement.ts`, jamais en dur :

| Primitive | Ce qu'elle fait | Sert aux scènes |
|---|---|---|
| `Scene` | Épingle une section et expose une chronologie GSAP liée au défilement. Hauteur de défilement réglable (combien de « pixels de scroll » dure la scène). | toutes |
| `Decode` | Un mot qui se décode lettre par lettre vers le suivant, à une position donnée de la chronologie. Rendu serveur : le premier mot. | 4, 5 |
| `Frappe` | Texte qui se tape avec curseur, puis liste de suggestions. | 1 |
| `Barre` | Trait qui barre un mot. | 6 |
| `Trace` | Tracé d'un chemin SVG (courbes, arcs, courbe de graphique) selon la progression. | 5, 7 |
| `Pile` | Pile de cartes : chacune entre par le haut et pousse les autres. | 6 |
| `Champ3D` | Champ de cartes en perspective CSS, caméra qui survole, balayage d'un projet à l'autre. | 3, 4 |
| `Rouleaux` | Compteur à rouleaux piloté par la progression (le `Compteur` du socle compte au temps, pas au défilement). | 7 |
| `Orbites` | Le décor commun : les grands arcs, en SVG fixe, qui tournent lentement avec la page. | fond |

Les six primitives d'arrivée du socle (`EntreeHero`, `Cascade`, `Reveal`, `Compteur`,
`Defilant`, `Parallaxe`) restent pour les pages classiques (réalisations, contact,
questionnaire). Le bento de la scène 8 peut être une `Cascade` dans une `Scene`.

## Les règles qu'on garde, et deux qu'on adapte

- **Mouvement réduit : servi le premier.** Sous `prefers-reduced-motion`, aucune section
  n'est épinglée et chaque scène affiche **son état final** : tout le texte, la dernière
  carte, le compteur à sa valeur, la courbe tracée. On ne contourne jamais ça.
- **Sans JavaScript**, la page se lit de haut en bas : tout le texte est dans le HTML, ce
  qui vaut aussi pour les moteurs de recherche.
- **Clavier** : une section épinglée ne piège jamais le focus ; les boutons restent
  atteignables à la tabulation.
- **Le mouvement raconte.** Une scène = un message. Cinq à six scènes, pas dix : au-delà,
  le lecteur ne voit plus rien (règle de `mouvement.md`). La vidéo en a dix parce qu'elle
  dure 40 secondes ; une page se lit à son rythme.
- **« Une fois »**, adaptée : la règle interdit de rejouer une apparition. Une scène
  `scrub` n'apparaît pas, elle **suit** le défilement, comme `Parallaxe` : rembobiner en
  remontant est voulu, pas un rejeu.
- **Aucun rebond, aucun élastique.** Lié au défilement, l'easing est `none` (la main du
  visiteur fait la courbe) avec un léger lissage (`scrub: 0.6`) pour absorber les à-coups.
- **Aucun chiffre inventé.** La vidéo affiche « ≈ 20 prospects ». Stalika n'a pas encore
  de résultats mesurés : **pas de compteur sur un chiffre qu'on ne peut pas prouver**
  (`mouvement.md` : « un compteur sur un chiffre creux, non »). La scène « preuve » attend
  un chiffre vrai ou un témoignage réel, sinon elle n'existe pas.
- **Performance.** Uniquement `transform` et `opacity` en animation ; **aucun `filter: blur`**
  animé sur un champ de cartes (le flou de la vidéo se remplace par de l'opacité ou par des
  images pré-floutées) ; vingt cartes 3D au plus ; `will-change` posé au début de la scène,
  retiré à la fin.
- **Mobile.** Même histoire, mêmes scènes, mais : hauteurs d'épinglage plus courtes, champ
  3D réduit (six cartes), pile de notifications limitée à quatre. Point connu à vérifier
  sur un vrai iPhone : la barre d'adresse de Safari qui se replie fait sauter les sections
  épinglées ; `ScrollTrigger.normalizeScroll(true)` est la parade, à activer et à tester.

## Le film de Stalika : proposition d'enchaînement

À décider au blueprint, avec les textes de `docs/arguments.md`. Ordre proposé :

1. **Le client cherche** : barre de recherche qui tape un métier + une ville (les métiers
   des clients visés : restaurant, artisan, coach…), suggestions, choix. Message : vos
   clients vous cherchent en ligne.
2. **Argument 1, sur mesure** : champ 3D des réalisations, un projet après l'autre, avec le
   qualificatif qui se décode (« sur mesure » → « à la carte » → « à votre image »). Message :
   pas un modèle rempli.
3. **La logique métier** : bento des fonctions réelles livrées (réservation avec agenda,
   espace client, contrat PDF…), coches et classements animés. Message : ce qu'un outil à
   modèles ne sait pas faire.
4. **Argument 2, le lien de relecture** : une page client apparaît ; au fil du défilement,
   un bloc se surligne, une bulle s'ouvre, le texte est réécrit sur place, puis
   « J'applique, je publie ». Message : vous corrigez sur la page, sans rien casser. C'est la
   scène qui n'existe chez personne d'autre.
5. **Livré conforme, et à vous** : mentions légales, sécurité, référencement, **le code vous
   appartient** (à inscrire au contrat avant de l'écrire, voir `docs/arguments.md`).
6. **L'appel** : « Envie d'un site qui vous ressemble ? » → le questionnaire, cinq minutes.

La scène « preuve chiffrée » et la scène « visible sur Google / ChatGPT » sont **en attente**
d'un fait vérifiable (voir ci-dessus).

## À décider avant le blueprint

- Ambiance sombre comme la vidéo, ou claire ? (Les arcs et les halos portent mieux sur
  fond sombre ; rien n'oblige.)
- Quelles réalisations peuvent être montrées, avec l'accord de chaque client.
- Quelle preuve on a vraiment : un témoignage réel, un chiffre mesuré, ou rien pour l'instant.
- Toute la page d'accueil en film, ou le haut seulement puis des sections classiques.
