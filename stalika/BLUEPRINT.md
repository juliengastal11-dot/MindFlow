# Blueprint · Stalika

Construit avec Fable 5.1 (effort non connu depuis la session), sous-agents Sonnet 5 · 2026-09-30.
Méthode : buildyoursite. Dépôt : `juliengastal11-dot/MindFlow`, dossier `stalika/`.

**En une phrase.** Le site de Stalika, l'activité de Julien Gastal : des sites, des logiciels et
des applications sur mesure (logiciels et applications ajoutés à la demande de J, 2026-10-02) pour
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
les sites de Julien (trois, puis quatre le 2026-10-04) sur un cylindre couché (`components/ui/roue.tsx`), à gauche, et le texte
du sur mesure à droite, **sur téléphone comme sur ordinateur**. Idée tirée de 21st
(« vertical-image-stack », fourni par J), avec la géométrie de « Cylinder Carousel » et l'inertie
de « Wheel Carousel » ; aucun code repris.

- **Le mouvement** : la roue tourne seule, s'attarde 2,5 s sur chaque site puis bascule vers le
  suivant (`film.roue` dans `lib/mouvement.ts`). Elle s'attrape à la souris et au doigt, se lance
  avec inertie et se pose sur la carte la plus proche ; flèches du clavier, points, bouton pause
  (WCAG 2.2.2). Depuis le 2026-10-02 (J, par l'overlay), le bouton pause et les points ne se voient
  plus, pas plus que le nom de la carte de face sous la roue sur téléphone : ils restent là,
  transparents, pour le clavier et les lecteurs d'écran, et apparaissent quand on y arrive au
  clavier. Elle s'arrête au survol et hors de l'écran. Entrée : elle fait un tour complet et
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
- **La zone du geste** (retour de J sur téléphone, 2026-10-02 : « difficile de faire tourner la
  roue sans que ça fasse défiler la page ») : sur téléphone la roue ne fait que la moitié de la
  largeur, et un doigt posé à côté de la carte faisait défiler la page. La zone qui capte le doigt
  (`touch-action: none`) déborde maintenant de la roue : `--roue-ext-g` / `--roue-ext-d`, posés par
  la scène (14 px et 30 px sur téléphone, 28 px de chaque côté dès 768 px). À la souris, seule la
  roue elle-même se saisit. Un glissé qui franchit un cinquième de carte (`seuilGlisse`) change de
  carte, même lent. Reste une bande d'environ 7 px juste à droite de la carte de face, où le
  navigateur prend la couche de défilement pour la carte et fait défiler la page (la page, très
  haute, est projetée en 3D) : essais de bandes de garde et de `clip-path` sans effet.
- **Les cartes** montrent le haut de chaque site sur téléphone, **en action** : la devanture de
  la pizzeria en boucle ; l'arrivée sur Popec puis sa bande qui défile ; l'arrivée sur AR
  Transfert (la berline sort du noir, phares allumés) puis ses appels de phares. Aucun lien.
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
  Le 2026-10-04, AR Transfert (chauffeur VTC à Béziers, `ar-transfert-apercu.vercel.app`) est
  ajouté **en tête**, à la demande de J : quatre cartes, 45° entre deux. Sa page a des parties
  blanches, qui ont montré un filet sombre entre les bandes (la dernière ligne de chaque canevas
  n'était peinte qu'en partie) : chaque bande se peint maintenant sur toute la hauteur de son
  canevas.
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
- **Pas encore fait (deuxième étape), reportée par J le 2026-10-02 : elle attend qu'il ait retravaillé
  toutes les sections, qui vont beaucoup bouger (les repères `data-rebond` devront les suivre).**
  Si le visiteur ne clique pas, le bouton descend quand même
  de section en section : 1,5 s après qu'il s'est arrêté sur une section, le bouton y trouve un
  endroit où s'accrocher (par un coin, il se balance puis s'arrête), reste cliquable (un clic le
  fait tomber et emmène à l'ordinateur), ne remonte jamais, et finit près de l'ordinateur sur la
  dernière image. Décisions de J : coin haut gauche, balancement de quelques secondes puis arrêt,
  indice discret, le bouton reste en bas quand on remonte.

## Mise à jour du 2026-10-07 : « La relecture » au défilement, sur le vrai site d'AR Transfert

À la demande de J : « le plus de STALIKA, c'est vous qui décidez et avez la main. Vous recevez un lien,
vous éditez votre site à votre guise, je regarde, j'écoute, j'échange avec vous et je mets en place
rapidement. » La scène (`components/sections/scene-relecture.tsx`, `relecture-fenetre.tsx`) le montre
sur le site d'AR Transfert, en deux temps voulus par J :
- **A.** le client passe la barre d'édition en « Édition », coche « Changement immédiat », clique le
  paragraphe, sélectionne sa dernière ligne (« et soirées. ») et la réécrit (« et événements
  d'entreprise. ») ; Julien a son propre curseur, comme un collègue qui regarde.
- **B.** il retire l'animation des phares (l'appel de phares du site : « Garder » ou « Retirer »), puis
  épingle un commentaire sur la photo (« Une photo plus claire ? ») ; Julien répond (« Bien sûr, c'est
  fait. ») et la photo s'éclaircit. Les trois retouches se cochent dans la liste à côté ; le tampon
  « Appliqué · publié » clôt.
- **Au défilement, sans épinglage JavaScript.** J avait refusé l'épinglage le 2026-10-01 (la page « s'arrêtait
  et repartait » sur son téléphone) ; ici : « avec le défilement, on change si ce n'est pas bien », et le film doit
  partir « quand l'animation arrive à mi-hauteur d'écran ». La scène contient une piste (`data-piste`) de
  3,6 écrans ; son contenu y reste collé (`position: sticky`, donc par le navigateur), centré dans l'écran ;
  le film avance avec la piste, de l'instant où il se colle (la fenêtre est alors au milieu de l'écran)
  jusqu'à celui où il se décolle. Réglages : `MOUVEMENT.relecture` (`ecrans`, `lissage`). `Scene` a pour
  cela une option `defilement` ; l'abandonner (la retirer, et la piste) rend à la scène son film joué
  une fois à l'arrivée (`declencheur`). Sur téléphone, le texte défile avant la piste et seule la
  fenêtre reste collée. Mouvement réduit et sans JavaScript : pas de piste, l'état final.
- **La page n'est pas refaite** : c'est une capture du site en ligne (`outils/relecture/`), posée sur un
  dessin à l'échelle de la fenêtre (unités `cqw`, aucune mesure en JavaScript). Seul le paragraphe est du
  vrai texte (Jost, comme sur le site). Deux mises en page, comme le site : ordinateur (1024 px) quand la
  place est large (36 rem), ou assez large (24 rem) et pas plus haute que large ; téléphone (390 px,
  recadré) sinon. **La fenêtre prend la place qui lui reste dans l'écran, hauteur comprise** (`.rel-place`,
  conteneur de requête nommé, et `.rel-fenetre`, dans `app/globals.css`) : jamais plus haute que la zone
  collée, ni plus large que 35 rem (26 pour la page de téléphone). Retouche du 2026-10-07 (J : « le texte
  du titre est en dessous de la vidéo, recadre le site pour qu'il prenne un peu moins de place ») : dans le
  panneau de navigateur de J (614 × 600), la page de téléphone, étirée à 566 px, faisait 850 px de haut et
  recouvrait le titre. Vérifié de 360 × 640 à 1920 × 1080, téléphone couché compris (la colonne de texte y
  perd sa suite : titre réduit, paragraphe et liste effacés). L'outil (barre, curseurs,
  étiquettes, bulles) garde sa taille réelle ; les points où va le curseur sont mesurés dans la page au
  moment de construire le film, et remesurés au redimensionnement (`invalidateOnRefresh`).
- **Le bouton qui tombe** : les éléments de cette scène ne portent plus `data-rebond` (un contenu collé
  n'a plus la même place une fois la piste engagée, et le bouton mesure la page au départ de sa chute).
  À reprendre avec la deuxième étape du bouton (les perchoirs).
- **Le ciel** : il avance toujours linéairement avec le défilement ; la piste plus longue ralentit son
  changement d'heure, et la scène se termine à l'aube. (Le voile sombre qui couvrait la scène a été retiré
  le jour même : voir la mise à jour suivante.)

## Mise à jour du 2026-10-18 (suite) : la section 04 devient une montre

J : « la section 04 est trop générique ; garder l'esprit premium, mais surtout faire quelque chose de personnel et
d'extraordinaire, comme les autres sections ». Cinq pistes proposées en maquettes (le bon de livraison qu'on déchire, la carte
d'embarquement, la lettre cachetée, le coffret, le chronographe) ; J : « j'adore le chronographe ; une très belle montre qui au
défilement tourne et montre tout le processus de création, du début à la fin », puis il envoie la photo d'une montre habillée
en or comme référence d'allure.
- **La montre** (`components/ui/montre.tsx`, styles « La montre » dans `app/globals.css`) : dessinée en code (CSS pour les
  métaux et le cadran, SVG pour le reste), jamais copiée : boîtier très fin en or jaune, lunette large polie, cadran champagne
  brossé soleil (deux lobes de lumière et un grain léger : des rayures fines faisaient une moire), douze bâtons appliqués, deux
  aiguilles bâtons noires, couronne cannelée, cornes courtes, alligator noir surpiqué. Pour le déroulé : la couronne fait
  poussoir (chronographe monopoussoir), un compteur de 72 heures au-dessus de 6 h, une aiguille fine de chronographe et un arc
  d'or qui la suit au bord du cadran. Au dos, un fond saphir sur le mouvement (platine perlée, côtes de Genève, rotor en or
  gravé « le code est à vous », balancier et spiral, rubis). L'or vient du doré du thème ; cuir, acier et rubis sont réglés
  comme des matières. Toutes les tailles suivent `--montre-l`.
- **La section** (`components/sections/scene-livre.tsx`) : `Scene` en mode défilement, comme « La relecture » (piste de
  7,2 écrans, contenu collé, `MOUVEMENT.livre`). Huit temps : l'arrivée ; le premier message ; on en parle (devis, 300 €) ;
  la première ébauche (on appuie sur la couronne, le compteur fait le tour des 72 h pendant que le chiffre roule) ; vous relisez ;
  tout est vérifié (trois coches tracées) ; la mise en ligne (chez vous, chez moi) ; et après (la montre se retourne, le rotor
  tourne, le balancier bat, le bouton Filet d'or). À chaque temps l'aiguille du chrono avance de deux heures et allume les index
  passés, les heures et les minutes tournent, la montre s'incline et le reflet du verre glisse. La section passe dans la nuit
  dorée (`.nuit`). Textes : `CONTENU.md`, « Scène 5 ».
- **À retenir** : les rotations du dessin SVG sont écrites à la main (`rotate(angle cx cy)` à chaque image) ; `svgOrigin` de GSAP
  plaçait mal le centre dans ce SVG agrandi et basculé en 3D (l'aiguille des heures décalée de quelques pixels, celle du chrono
  de plus de mille).
- Sans JavaScript et en mouvement réduit : la montre immobile, puis les huit temps en liste. Vérifié en 1440 × 900 et 390 × 844
  (captures à huit positions), aucune erreur de console ; pas encore sur l'iPhone de J.
- **Le soir même, la montre passe en volume** (J : « il faut que la montre soit en 3D et surtout qu'elle ait l'épaisseur d'une
  vraie montre, pareil pour le bracelet » ; Three.js, bracelet « courbé, comme sur un poignet », « elle se montre sous tous les
  angles » ; puis la photo d'un vrai mouvement à remontage manuel). `components/ui/montre-3d.tsx` (react-three-fiber), ses
  pièces dans `lib/montre-3d.ts`, sa pose dans `lib/pose-montre.ts`. Tout est calculé, rien ne se télécharge : 38 mm, près de
  7 mm d'épaisseur (boîtier tourné, fond satiné à part, lunette polie, rehaut), cornes effilées, couronne à 30 cannelures,
  cadran champagne à brossage soleil (anisotropie), bâtons et aiguilles en relief qui portent ombre, compteur azuré en creux,
  verre bombé ; bracelet de 3,4 mm qui sort à plat des cornes puis s'enroule (arc de 13 mm), alligator dessus, doublure lisse
  dessous ; au dos, sous le saphir, le mouvement d'après la photo de J : ponts en acier à côtes de Genève, roues en laiton sous
  les ponts, rochet et roue de couronne soleillés par-dessus, balancier et spiral, rubis en chatons, vis ; fond gravé « VOTRE
  CODE · VOTRE DOMAINE · À VOTRE NOM ». Lumière : un studio de boîtes à lumière (drei `Lightformer`) et une lampe qui porte
  les ombres.
- **Branchement** : la même chronologie fait avancer la pose (orientation, aiguilles, compteur, couronne, index allumés, rouage)
  et la scène ne se redessine que quand elle avance (`frameloop="demand"`). Une orientation par temps (`POSES_3D` : trois quarts,
  profil côté couronne, face, plongée, l'autre côté, puis le fond). Three.js se charge à un écran et demi de la section, si le
  navigateur sait faire du WebGL 2 et sans mouvement réduit ; la montre à plat reste en place jusqu'à la première image, et pour
  toujours si le WebGL manque ou échoue (garde d'erreur). Téléphone : la montre en haut, fondue vers le texte ; ordinateur : à
  droite, fondue vers la colonne de texte.
- **À retenir** : un profil tourné (`LatheGeometry`) se parcourt de la fenêtre du fond vers le cadran, sinon l'extérieur devient
  l'intérieur ; garder ses normales (un `computeVertexNormals` laisse une couture) ; même chose pour le bracelet, dont les
  triangles dépendent du sens du brin. `rx` négatif = vue d'au-dessus.
- Vérifié : 1440 × 900 et 390 × 844 aux huit temps, mouvement réduit (montre à plat, Three.js jamais chargé), Three.js absent en
  haut de page ; aucune erreur de console ; sur ordinateur, image médiane 6 ms, la pire 18 ms. Pas encore sur l'iPhone de J.

## Mise à jour du 2026-10-19 : le texte suit l'aiguille, et la montre passe avant la plongée

- **Le texte** (J : « qu'il s'affiche de manière stylée, fluide, et suive le mouvement des aiguilles » ; quatre pistes montrées en
  maquettes animées, J choisit « la lecture à l'aiguille » pour le texte et « le quantième » pour les numéros et les titres) :
  le numéro et le titre de chaque temps tournent dans leur fenêtre comme le disque de date d'une montre (lettres coupées par
  SplitText, chacune dans son masque ; celles du temps d'avant partent par le haut, au même endroit). Le reste paraît pâle et
  s'allume mot à mot au rythme exact de l'aiguille du chrono (même départ, durée, courbe), avec un éclat d'or au passage
  (`--v`, `--b` sur chaque mot). Au-dessus, une réglette de soixante minutes, le pourtour du cadran déroulé, que suit un curseur
  (`--chrono`). Sur ordinateur, numéros et titres à hauteur fixe (38svh), pour que le quantième tourne sur place. Lettres et mots
  sont posés à la main d'après un état par temps (entrée, sortie, lecture) : une lettre peut entrer puis sortir sans conflit.
- **La place** (J : « qu'elle se joue au-dessus de l'écran du Mac, avant la cinématique qui mène au questionnaire ») : la section
  est remontée dans `Ciel`, entre « La relecture » et la plongée. Pendant qu'elle se joue, l'heure du ciel est suspendue (`Ciel`,
  prop `pauses`) : l'heure de toutes les autres scènes reste celle que J a validée. Elle passe sur le ciel sans voile (J : « pas
  de voile sombre »), sauf derrière le texte (« un voile derrière le texte uniquement ») : une nappe de nuit aux bords fondus,
  sans rectangle ; le texte garde l'ombre `sur-ciel`. Mouvement réduit : fond opaque, tout le texte affiché.
- **Le bouton du hero** tombe désormais à travers la montre jusqu'à l'ordinateur. Pendant tout son film (chute puis plongée),
  `html[data-film]` est posé et la montre 3D attend pour se mettre en route (au plus vingt secondes).
- **La mise en route de la 3D par tranches** : d'un bloc, elle figeait la page près d'une seconde (mesuré au défilement depuis
  « La relecture » : 0,15 s, 0,28 s, 0,38 s). Textures puis formes préparées dans les temps morts (`requestIdleCallback`), le
  grain du cadran en carreau répété ; la scène montée sans dessiner (`frameloop="never"`), puis la lumière du studio (PMREM d'une
  petite scène de boîtes à lumière, à la place de drei, retiré des dépendances), l'envoi des textures, `compileAsync`, et la
  première image. Pire image après : 0,11 s en développement (l'évaluation du code), les autres sous 0,08 s.
- **À savoir** : le `Canvas` de react-three-fiber ne se mesure qu'à l'arrêt du défilement (anti-rebond) : la montre 3D paraît au
  premier temps d'arrêt, la montre à plat tient la place jusque-là.

## Mise à jour du 2026-10-18 : l'entrée du hero, dans l'ordre

J : « que le titre, le texte du héros et le bouton Parlons projet apparaissent de manière stylée ; on garde les lettres une par une
du titre ; STALIKA, puis le texte, puis le bouton ». Avant, le texte entrait à 1,2 s et le bouton à 1,6 s, en simple fondu montant,
pendant que le logo se composait encore (jusqu'à 3,6 s) : tout se chevauchait. Pistes proposées, choix de J :
- **Le texte sort de la brume** (`components/ui/mots-brume.tsx`) : chaque mot arrive flou et transparent puis devient net, en vague,
  une ligne après l'autre, à partir de 3,4 s (les dernières lettres se posent, la baseline arrive). SplitText de GSAP, le temps de
  l'entrée seulement : le texte redevient un texte ordinaire ensuite. Écartées : lignes qui montent d'un cache, fil d'or qui allume
  le texte, brouillage comme le logo.
- **Le bouton descend au bout de son fil** (`components/ui/entree-fil.tsx`), à 5 s : il arrive d'un peu plus haut, pendu à un fil
  doré, se balance en s'amortissant (pivot au haut du fil), puis le fil remonte. Il annonce la chute qui suit au clic. La descente
  est courte : sur téléphone, le texte est juste au-dessus et le bouton ne doit pas le traverser. Écartées : contour tracé puis
  rempli, ressort et reflet.
- **Le bouton emmène dans l'ordinateur** (J : « quand il tombe, il doit emmener directement dans l'ordinateur, jouer le zoom et
  l'animation dans l'écran du Mac ») : posé près de l'ordinateur, il attend 0,7 s, puis la page défile toute seule à travers la
  plongée jusqu'à la fenêtre posée, en 8 s (Lenis, défilement verrouillé). Le pas suit des repères (`MOUVEMENT.bouton.plonger`) :
  46 % du temps pour le vol, 26 % pour le rebond de l'icône et l'effet Génie, 22 % pour le zoom dans la fenêtre ; la courbe part et
  arrive au repos. La discussion commence à l'arrivée. L'indice « Faites défiler » est retiré. Vérifié en 375 × 812 et
  1280 × 800 : clic à 0 s, bouton posé vers 9 s, fenêtre posée vers 18 s, premiers messages vers 21 s.
- **Le bouton devient un Filet d'or, qui se dessine à la main** (J : trois pistes proposées, « on part sur le Filet d'or, et au
  lieu du fil qui dépose le bouton, le bouton se dessine comme à la main »). `components/ui/bouton-filet.tsx` remplace le Cyber
  Button de 21st (gardé dans `components/ui/cyber-button.tsx`, plus utilisé) : un cadre d'un fil doré, deux coins appuyés, le
  texte espacé comme la baseline ; au survol, l'or monte et remplit, le texte passe en noir, les coins en encre, la flèche avance.
  `components/ui/entree-dessin.tsx` remplace l'entrée au bout du fil : une pointe de plume lumineuse tire les quatre côtés l'un
  après l'autre, un peu tremblés et dépassant aux coins comme un geste, pendant que le texte s'écrit ; puis la flèche se trace,
  les coins se posent et le trait se fond dans le cadre (environ 2,5 s, `MOUVEMENT.hero.dessin`). Idées : « Fill Up », « Arrow
  Push » et « Border Draw » d'animatedbuttons, le tracé de trait de Kinetics. La copie qui tombe au clic est le même Filet d'or.
- **Paragraphe par paragraphe** (J : « ralentir un peu pour profiter de l'effet de brume, ou paragraphe par paragraphe, encore
  mieux ») : chaque paragraphe sort de la brume en entier (flou 10 px, 1,15 s par mot, vague de 35 ms), le suivant part une
  demi-seconde avant que le précédent soit net. Le bouton n'a plus d'heure fixe : le texte l'appelle quand le dernier
  paragraphe a presque fini (évènement `stalika:hero-texte`), vers 6,5 s ; il est posé vers 8 s.
- **Le clic, moins haut** (J : « il ne doit pas sauter si haut, juste sursauter sur le texte puis tomber ») : le bouton ne saute
  plus jusqu'au menu pour s'y accrocher et s'y balancer. Il s'accroupit, fait un petit bond (arche à 5 % de l'écran au-dessus)
  sur le bord haut du texte du hero (`data-perchoir`, la colonne de droite sur ordinateur), le texte tressaille, il rebondit
  un quart de seconde, puis la chute part de là (`MOUVEMENT.bouton.saut`). Le clou et le pendule ne servent plus.
- Réglages : `MOUVEMENT.hero.brume` et `MOUVEMENT.hero.fil`. Mouvement réduit : tout est là d'emblée. Vérifié en 375 × 812 et
  1280 × 800 (captures à instants fixes après le chargement), pas encore sur l'iPhone de J.

## Mise à jour du 2026-10-17 (nuit) : bandes blanches, câble, fond d'écran

Trois retours de J sur son iPhone, après la version du soir.
- **Des bandes blanches en haut à gauche de l'écran, « de temps en temps au scroll »** : c'était moi. Depuis que les copies de la
  fenêtre pour le Génie sont préparées un peu avant l'effet (pour éviter une image saccadée), elles restaient **visibles**, empilées
  en haut à gauche du bureau, par-dessus la barre des menus, entre 63 et 70 % du défilement. Cause : chaque copie forçait
  `visibility: visible`, ce qui l'emporte sur le `hidden` de sa scène. Corrigé dans `lib/genie.ts` (`inherit`, et la scène est cachée
  dès sa création). À retenir : `visibility` s'hérite, mais un enfant `visible` s'affiche dans un parent `hidden`.
- **Un câble électrique qui part en bas dans le vide** : un hauban du poteau, qui descend à travers les nuages de l'image 10 à
  l'image 98 de la plongée du téléphone et ne mène à rien. Retiré des images par `outils/hero/retirer-cable.py` (voir son
  LISEZMOI). Le poteau reste, ainsi que ses câbles qui s'affaissent. La série de l'ordinateur (Kling) a d'autres haubans du
  même genre, non traités.
- **Le fond d'écran, « trop bateau »** : les dunes vectorielles faisaient « fond d'écran de banque d'images ». Remplacées par
  l'heure dorée du site en abstrait : un noir chaud, une lueur ambrée basse (le jeton `attente`), deux bancs de brume, une
  lumière d'angle, du grain (un carreau de bruit fractal en SVG en ligne), une vignette, et jamais un trait dur (un filet de 1 px
  scintille quand la perspective bouge). Quatre rendus regardés côte à côte (brume, brume et arcs fins, photo du site floutée, filet
  d'horizon) ; retenu : la brume. Idée de départ : les fonds statiques de bg.ibelick (halo radial), sans leur violet ni leurs grilles.
  Le Dock passe dans la palette du thème (crème, noir chaud, doré ; le vert et le rouge faisaient « icônes par défaut ») : seule la
  conversation, l'appli ouverte, est dorée.

## Mise à jour du 2026-10-17 (soir) : le bureau du Mac, sur l'écran de l'ordinateur de la scène

J, après la version précédente (le Dock et le Génie par-dessus toute la vue) : « il faut que tout ça soit dans l'ordinateur
directement, pas ici [...] jusqu'à avoir un écran de Mac dessiné sur le Mac dans le site et un effet Génie incroyable et
naturel », puis « c'était mieux si la caméra rentrait dans le PC » (pas d'arrêt sur image avant le zoom).
- **Le bureau** (`components/ui/ecran-mac.tsx`) : un écran virtuel en pixels CSS (environ 1 300 × 830 sur téléphone), avec la
  barre des menus, un fond d'écran de dunes au crépuscule dans les couleurs du site (vagues dessinées à la main, à la façon de
  Haikei), le logo, le Dock, et **la vraie fenêtre de discussion** à sa place. Sombre exprès : la fenêtre claire en sort nettement
  pendant le Génie. Le logo est un peu plus étroit que la fenêtre, qui le cache tout entier une fois posée.
- **Collé sur l'écran du portable, en perspective** (`Plongee`) : une homographie (`matrix3d`) envoie les quatre coins du bureau
  sur ceux de l'écran, image par image. Les coins sont mesurés hors ligne (`outils/hero/mesurer-ecran.py`, chaque bord ajusté par
  une droite sur une partie que rien ne cache) : `lib/plongee-ecran-mobile.ts` et `lib/plongee-ecran-bureau.ts` (la série Kling
  de l'ordinateur, dont l'écran crème montrait un navigateur : on en prend tout l'écran, barre comprise). Le bureau déborde de
  2,5 % de la zone mesurée (sans cela, un liseré blanc).
- **L'épaule passe devant l'écran** : sur une cinquantaine d'images, l'épaule du personnage cache le bas-gauche de l'écran. Le
  même outil mesure, rangée par rangée, jusqu'où (`CACHES_…`), et le bureau est découpé à cette limite (`clip-path`), en
  mordant un peu sur l'épaule (son liseré doré reste à l'image, pas le fond blanc).
- **Le déroulé** : le bureau s'allume sur l'écran dès qu'il fait 30 px ; l'icône de la conversation rebondit deux fois (0,665 à
  0,715), la fenêtre sort du Dock avec le Génie pendant que la caméra finit d'arriver (0,70 à 0,80), puis **la caméra entre dans
  la fenêtre sans s'arrêter** : le zoom part à la vitesse où l'écran grandissait à la fin des images (mesurée), accélère sans
  à-coup (courbe du cinquième degré : vitesse continue, accélération nulle au départ), puis se pose (0,80 à 0,96). Le canvas
  suit exactement le même mouvement : la part affine dans son dessin, la perspective qui reste par une transformation CSS. À la
  fin, la fenêtre est à 1 pour 1, nette et utilisable, et sa conversation commence.
- **La fin** (0,965 à 0,995) : le bureau et la scène s'effacent vers le fond de la page ; la fenêtre reste. Sur l'iPhone de J,
  une bande noire et un triangle blanc passaient sous la fenêtre quand la page reprenait : la part de l'écran cachée sous la
  barre de Safari (40 px), où l'on voyait le canvas zoomé.
- **La fenêtre** : une fenêtre de Mac (coins arrondis partout, pastilles), sans la poignée de feuille d'avant.
- **Vérifié** : dans un Chrome sans fenêtre piloté par le protocole DevTools (le panneau navigateur de l'appli était caché ; ses
  pages y sont figées), en 375 × 812 et 1280 × 800, mouvement réduit compris ; et sur l'iPhone de J par le pont : aucune erreur,
  59,5 images par seconde pendant le Génie et la plongée (60 pendant le vol), après avoir préparé les copies de la fenêtre un
  peu avant l'effet (les faire au moment où il commence coûtait une image saccadée).
- **Reste sur ordinateur** : la série Kling n'a que 61 images pour un grand mouvement ; deux images fondues font un fantôme
  (deux têtes, deux écrans). C'était déjà le cas ; la vidéo source n'est pas sur le disque.

## Mise à jour du 2026-10-17 (fin) : la fenêtre sort du Dock, comme sur un Mac

Remplacée le soir même par la précédente (le bureau sur l'écran de l'ordinateur) ; gardée pour l'historique.

J : « au lieu de s'ouvrir de bas en haut basiquement, tu fais le style d'ouverture des Mac : tu simules une barre des tâches de
Mac en bas, puis l'onglet de la conversation s'ouvre comme sur Mac ». Ses choix : au défilement, plusieurs icônes, téléphone et
ordinateur.
- **Le déroulé** (`Plongee`, après l'entrée dans l'écran) : le Dock monte du bas, l'icône de la conversation rebondit une fois,
  puis la fenêtre de discussion en sort avec l'**effet Génie** : étroite près de l'icône, large en haut, elle monte et se pose à
  sa place. Tout suit le défilement : en remontant, elle rentre dans l'icône. Le fond ne recule plus derrière la fenêtre (c'était
  l'effet « feuille » d'iPhone). La zone de la plongée passe de 320 à 380 svh et la vidéo finit à 72 % (au lieu de 80 %) :
  de la place pour le Dock et le Génie.
- **Le Génie** (`lib/genie.ts`) : la vraie fenêtre est recopiée en 32 bandes (40 sur ordinateur), copies inertes, sans
  identifiants ; chaque bande est un trapèze qui suit l'entonnoir (sans cela, les bords font des marches) et recouvre la
  suivante d'un pixel d'écran (sans cela, des rayures). La vraie fenêtre est cachée pendant l'effet et prend le relais à la fin, à
  la même place. Pas de WebGL, pas de bibliothèque.
- **Le Dock** (`components/ui/dock-mac.tsx`) : le verre sombre de l'île du menu, cinq tuiles inventées aux couleurs du site (logo
  S, notes, conversation, agenda, projets), le point sous l'appli ouverte. Aucune icône d'Apple. Idées : le Dock de Watermelon et le
  « Floating Dock » d'Aceternity (21st). Décoratif : ni cliquable ni lu par les lecteurs d'écran.
- **En développement**, la barre « Navigation · Édition » de l'overlay cache le Dock sur téléphone ; elle n'existe pas en ligne.
- Vérifié dans le navigateur intégré, en taille téléphone et ordinateur ; pas encore sur l'iPhone de J.

## Mise à jour du 2026-10-17 (suite) : tout le chemin du téléphone en vertical, un chalet en rondins

J, après avoir vu la vidéo sur son iPhone : « la vidéo pas assez de bonne qualité », « la maison est trop petite, il faut qu'elle fasse
plus petit chalet ». Sa décision : « Tout le chemin en 9:16, bonne qualité et le chalet. Garde le côté où il s'allume la nuit. »
- **Le téléphone a sa propre chaîne, verticale d'origine** (Kling 3.0 Pro, 10 s, 1 080 × 1 912, générée le 2026-10-17) : l'aller et le
  retour du hero, les cinq passages du ciel (lumière du hero, crépuscule, nuit, nuit où le personnage s'étire, aube, lumière
  dorée) et la plongée. Plus de bande de 600 px prise dans un plan paysage et agrandie : le plan entier, sans recadrage. Le chalet est
  en rondins (variante B choisie par J), plus gros et entièrement dans le cadre ; ses fenêtres et l'écran de l'ordinateur
  s'allument la nuit. Le plan ne bouge pas d'un passage à l'autre (trépied), seule la lumière change : chaque passage part de la
  dernière image du précédent. Les images, les tâches Higgsfield et les commandes pour tout refaire : `outils/hero/LISEZMOI.md`.
  L'ordinateur garde sa chaîne paysage (la cabane) ; la refaire en 16:9 coûterait environ 170 crédits, J a dit « plus tard ».
- **Dans le code** : `Ciel` n'a plus de `cadrageMobile` (supprimé) ; une série dit son `rapport` (`RAPPORT_CIEL_MOBILE`, 720 × 1 274)
  et où le bouton se pose (`POSE_BOUTON_MOBILE`, dans `lib/ciel.ts`), et pose les deux sur son cadre pour que le bouton qui
  tombe les relise. `Plongee` prend `mobile` : ses 120 images (`public/hero/plongee-mobile`), l'écran dans la dernière, son rythme
  (`lib/plongee-rythme-mobile.ts`) et les coins de l'écran image par image (`lib/plongee-ecran-mobile.ts`, mesurés par
  `outils/hero/mesurer-ecran.py`) ; ni raccord ni recadrage, et l'agrandissement final ramène le centre de l'écran au centre de la
  vue (l'image verticale n'a que 6 % de marge pour glisser). `VideoAdaptative` sert le HEVC aux iPhone (puce vidéo), le VP9
  ailleurs, le H.264 en repli. Les 120 images de la plongée sont choisies à pas égal de changement (pas à intervalles égaux) :
  la caméra va dix fois plus vite au milieu qu'au début.
- **La plongée, d'une seule traite jusque dans l'écran, par un autre modèle** (J, le même soir : « le sol se lève à côté, s'affaisse
  derrière » ; « je préfère le vol, c'est la caméra qui arrive sur l'ordinateur, et le décor, lui, ne bouge pas » ; « le personnage est
  à moitié dans l'herbe » ; « j'aurais aimé ne pas avoir besoin d'arrêt sur image puis zoom, c'était mieux si la caméra rentrait dans le
  PC »). Kling a donné quatre vols : le premier descendait au ras de l'herbe, le deuxième faisait lever la colline, le troisième (décor
  rigide demandé) tenait mieux mais finissait l'herbe à la taille ; couper avant et finir par un agrandissement d'image fixe ne plaisait
  pas. Remède : une nouvelle image d'arrivée où l'écran remplit l'image (rognée dans l'image par-dessus l'épaule), et deux autres
  modèles en parallèle sur le même départ et la même arrivée : Seedance 2.5 (720p, 70 crédits) et MiniMax H3 (2K, 20 crédits). J a
  choisi MiniMax H3 (tâche `da98b756-b817-499c-9fee-5c2adf21de35`) : le plateau reste un plateau, il reste assis sur l'herbe, jambes
  croisées visibles, jusqu'au passage par-dessus l'épaule, et la caméra finit dans l'écran (85 % de la largeur). 120 images à pas égal de
  changement, la dernière en pleine taille (1 440 × 2 550) ; l'entrée dans l'écran n'est plus qu'un léger prolongement
  (`mobile.agrandissement: 1.1`). Aucun modèle ne garantit un décor rigide : il faut regarder chaque plan image par image.
- **Poids** (le prix de la qualité) : vidéo du hero 4,5 Mo en HEVC, 4,0 en VP9, 5,5 en H.264 (avant : 2,4 et 1,7 Mo) ; ciel
  5,5 Mo ; recul 1,8 Mo ; plongée 5,6 Mo. Environ 18 Mo sur téléphone, contre 8,5 avant. À 4,5 Mo la vidéo dépasse les 3 Mo du
  garde-fou des vidéos de fond, qui ne regarde que `public/` à la racine du projet (ici `stalika/public`, donc pas vue). Si c'est
  trop : `--hevc 1400` (3,4 Mo), ou des images en qualité 70 (16 % de moins, `--qualite 70`).
- **Mesuré sur l'iPhone, build de production** : premier défilement (0 à 700 px), page ouverte en haut : 59 images par seconde,
  médiane 17 ms, aucune image de plus de 50 ms (quatre chargements à froid) ; plongée : 58 images par seconde ; ciel et scènes :
  58. Le bouton tombé se pose à 1 px du point visé. Piège de mesure : une page rouverte plus bas (défilement restauré), puis
  ramenée en haut, redémarre la vidéo pendant le défilement : 14 à 40 images par seconde la première seconde ; sans
  conséquence au chargement normal, mais ça a fait croire à tort à une régression.
- **Deux retours de J sur les nouveaux plans, corrigés le jour même** : (1) le nuage : « la physique du nuage est étrange, un nuage ne
  tombe pas comme ça », « trop boule, je préférais l'ancien » : l'aller est regénéré (deux variantes, J a choisi la A : une masse blanche qui
  traverse le plateau et poursuit dans le vide) ; (2) l'herbe : « quand la caméra se rapproche du PC à la fin, l'herbe pousse et le
  personnage s'enfonce dans le sol » : la plongée est regénérée avec une caméra qui reste haute (la première descendait au ras de l'herbe, et
  l'herbe du premier plan grandissait en cachant le bas de son corps) ; ce second plan, lui, faisait « se lever » le sol à la fin ; remplacé
  depuis par un vol MiniMax H3 (voir ci-dessus). Les tâches Higgsfield : `outils/hero/LISEZMOI.md`.
- **Un défaut trouvé en vérifiant, corrigé** : si la page s'ouvrait plus bas que le haut (un lien avec ancre, ou Safari qui
  rend le défilement après un retour), la vidéo n'avait jamais joué et restait figée sur sa première image jusqu'au
  rechargement ; elle reprend maintenant dès qu'on est en haut (`Ciel`, `suivreVideo`).

## Mise à jour du 2026-10-17 : un seul clic, plein écran, des images sans à-coups, la roue au doigt

Retours de J, vus en direct sur son iPhone 16 Pro (iOS 18.7, Safari) par le pont du skill `/phone`. Mesures faites sur ce
téléphone.
- **Le bouton « Parlons projet » : un seul clic** (« on enlève le deuxième clic, il saute et tombe au 1er clic »). Il
  s'accroupit, saute au clou, se balance 0,7 s (`pendule.avantChute`), puis tombe de lui-même ; un clic pendant ce
  balancement le fait tomber tout de suite. L'indice « Encore un clic : il tombe. » est retiré. Vérifié sur le téléphone :
  la copie accrochée à 0,2 s, la chute lancée vers 1,5 s, posée près de l'ordinateur à 12,5 s, aucune erreur.
- **La vidéo et le ciel occupent tout l'écran** : plus de marge de 8 px ni de coins arrondis (`Ciel`, `Plongee`, le dégradé du
  hero). Le plan a la hauteur de la plus grande fenêtre (`lvh`) : quand la barre de Safari se replie, la fenêtre grandit
  (754 px au lieu de 714 sur ce téléphone) et un plan à la hauteur de la plus petite laissait une bande sombre. Le cadre de la
  plongée est le même, au pixel (mesuré : `0, 0, 402, 754` des deux côtés). La feuille de la discussion garde la hauteur de ce
  qu'on voit (`dvh`) : son champ de saisie ne passe pas sous la barre.
- **Moins de latence, au doigt** : le défilement tactile a déjà sa propre inertie, le lisser encore ne faisait que traîner.
  Le ciel suit le doigt tout de suite (avant : 12 % de l'écart à chaque image, une traîne d'une demi-seconde ; après : le
  même dessin dès l'image suivante, mesuré 25 ms après un saut de 1 800 px). Les scènes au défilement (`Scene`) sont collées
  au doigt (`scrub: true`) ; à la molette, le lissage passe de 0,45 s à 0,2 s (Lenis lisse déjà).
- **La plongée, sans images qui défilent l'une après l'autre** : (1) deux images voisines se fondent selon la position exacte
  (comme dans le ciel) ; (2) le défilement est réparti d'après de combien l'image change d'une image à la suivante
  (`lib/plongee-rythme.ts`, mesuré par `outils/hero/rythme-plongee.py`) : la caméra va dix fois plus vite au milieu qu'au
  début, et une image tous les mêmes pixels (18 px) faisait lurcher la fin. Mesuré sur le téléphone à 600 px/s : le pas visible
  par affichage a un rapport max/médiane de 1,9 (avant : 6,8, de 2 à 13,7), 68 % des affichages sont des fondus, 60 images par
  seconde. Reste vrai : ces 61 images viennent d'un plan 16:9 dont un téléphone ne montre que le tiers (voir plus bas).
- **La roue au doigt** (« il est difficile de la faire tourner ») : sur téléphone, le glissé le plus naturel, sur la carte du
  milieu, faisait défiler le site dans la carte au lieu de tourner la roue ; il fallait saisir les cartes voisines ou les
  marges. Maintenant, glisser n'importe où sur la roue la fait tourner ; on **touche** la carte de face pour la visiter (le
  site défile alors dans la carte, la croix ou un toucher à côté referme), comme à la souris. Au doigt, la roue tourne 1,5 fois
  plus vite que le doigt (`gainTactile` : 170 px pour changer de carte, au lieu de 254). Vérifié sur le téléphone avec des
  évènements tactiles simulés : un glissé de 100 ou de 40 px sur la carte du milieu change d'une carte, un coup de doigt en
  fait trois, un toucher ouvre la visite, un toucher sur le texte la referme. L'indice tactile devient « Touchez pour visiter le
  site ».
- **Qualité de la vidéo et maison** : la vidéo du téléphone était une bande de 600 × 1 076 px prise dans un plan 16:9 de 1 080 p,
  agrandie à 840 × 1 506, puis compressée à 0,7 à 1 Mbit/s : floue, avec des blocs ; la maison (une cabane à l'extrême gauche du
  plan) était coupée par ce recadrage. Traité le jour même, par une chaîne verticale d'origine : voir la mise à jour ci-dessus.

## Mise à jour du 2026-10-09 (suite) : l'île en verre, le bandeau centré, le bouton au milieu

Trois retouches de J, le même jour que le bandeau de cookies :
- **L'île du menu prend le verre du bandeau** (« ajoute le même effet à la dynamique island »), dans
  `components/ui/ile-menu.tsx`. Fond à 75 % et flou 24 px là où le navigateur sait flouter (95 % sinon, plein avec
  « réduire la transparence »), bord un peu plus clair (15 %), lumière qui tombe du haut, arête haute éclairée (un trait
  camel permanent, en plus du filet qui court sur le contour à l'arrivée). Le film d'arrivée est inchangé. Mesuré :
  derrière la capsule, la vidéo ne dépasse pas rgb(88, 76, 64) (95e centile, sur toute sa boucle) ; les liens muets
  gardent **5,5:1** (6,3:1 sur l'ancien fond plein), au-dessus du seuil de 4,5:1. Aucun parent de la capsule ne forme de
  « racine de fond » (filtre, opacité, masque) : elle ne verrait plus le ciel. Le fond n'est plus dans `hero.tsx`.
- **Le bandeau de cookies est centré** : la pastille au-dessus, puis l'étiquette, le texte (lignes équilibrées,
  `text-balance`), les deux pilules (même largeur, 7 rem) et le lien, tous sur l'axe du bandeau (mesuré à 0,01 px près,
  de 320 à 1440 px de large). Il est donc plus haut : 257 px sur téléphone, 265 px sur ordinateur.
- **Le bouton « Parlons projet » est au milieu de la page** (`components/sections/hero.tsx`) : il quitte le bloc de texte
  et passe sur sa propre rangée, tout en bas du héros, sous le nom et le texte. Sur ordinateur, le milieu de la page est
  sous le nom : il ne pouvait pas rester sur la même rangée. Il entre au même moment qu'avant (après les trois lignes).
  Centré à 0 px près de 320 à 1440 px, sans rien recouvrir. Son film (il se décroche, saute au menu, tombe) est inchangé :
  il part de la place du vrai bouton, et le clou est au menu, jamais au bouton ; la chute traverse toujours la page
  jusqu'à l'ordinateur (vérifié sur ordinateur et sur téléphone).

## Mise à jour du 2026-10-09 : le bandeau de cookies en verre sombre

À la demande de J (« un peu plus sexy »), `components/sections/consentement.tsx` change d'allure ; **le texte, les deux
réponses, le cookie de choix et le chargement conditionnel de Google Analytics sont ceux d'avant**.
- **Le verre** : la palette de nuit (`nuit`) posée sur le seul bandeau, comme l'île du menu : sombre sur une page claire
  comme sur une scène de nuit. Fond à 85 % et flou 24 px (`backdrop-blur-xl`) là où le navigateur sait flouter, fond à
  95 % sinon, et fond plein avec « réduire la transparence ». Bord un peu plus clair que le fond, ombre en couches, un
  filet de lumière camel en haut. Deux éléments floutés au plus à l'écran, petits tous les deux : ce bandeau et l'île du
  menu, qui porte le même verre (voir plus haut). Pastille camel avec l'icône cookie, étiquette « Cookies », texte, deux
  pilules, le lien, le tout centré. Téléphone : carte flottante à 12 px des bords (au lieu d'un bandeau collé en bas), qui
  respecte la zone sûre de l'iPhone.
- **Même poids pour les deux réponses** : « D'accord » et « Non merci » ont la même recette (taille, forme, contraste, largeur).
  Refuser doit être aussi simple qu'accepter (H6). Seuls l'icône et le filet du haut sont colorés.
- **Le mouvement** (GSAP) : la première fois, il attend que le héros ait joué (1,4 s), monte en place (0,95 s), ses
  éléments se posent l'un après l'autre, l'icône tourne en arrivant et un reflet traverse le verre une fois. Rouvert par le
  lien « Cookies » du pied de page, il arrive tout de suite. À la réponse, il redescend (0,4 s) avant de disparaître ; un
  second clic pendant ce temps est ignoré. Mouvement réduit : posé tout de suite, immobile, retiré sans sortie.
- Idée : la forme des bandeaux flottants de 21st (pastille, texte court, pilules) et la recette du verre de la fiche
  « glassmorphism » de ui-skills (flou, bord éclairé, ombre en couches, replis).

## Mise à jour du 2026-10-07 : le même logo partout

À la demande de J (« tous les logos Stalika, avec les petites lettres qui bouclent aléatoirement ») : le logo du
héros (sept lettres qui se composent, puis une lettre au hasard qui se rebrouille, sans fin) sert maintenant tous
les logos du site. Un seul composant, `LogoBrouille` ; `LogoStalika` (`components/ui/logo-stalika.tsx`) lui donne les
morceaux de la bonne couleur (`lib/logo.ts`) :
- le **héros** : lettres lin (`public/hero/logo/`), comme avant ;
- le **menu des autres pages** (`/contact`, mentions légales, confidentialité, page introuvable), le **pied de page** et
  l'**espace privé** : lettres graphite (`public/logo/`, 7 lettres et la baseline, découpées dans la planche de
  l'écran de la plongée avec les mêmes coupes que le héros, donc la même géométrie).
Le logo de l'écran de l'ordinateur (la plongée) avait déjà le même scintillement. L'image de partage et l'icône de
l'onglet restent fixes : elles ne peuvent pas bouger.

Réglages de `LogoBrouille` : `entree` (« toujours » : le héros, le pied de page, qui se compose quand on y arrive ;
« une-fois-par-visite » : le menu, composé à la première page de la visite puis entier d'emblée ; « jamais » : l'espace
privé, entier d'emblée, seule la boucle joue) ; l'entrée ne démarre que quand le logo est à l'écran ; **la boucle
s'arrête quand le logo est hors de l'écran**. Disparu : `LogoAnime` (l'ancien logo du menu, composé une fois par
visite en lettres de police mono, puis remplacé par l'image) et `MOUVEMENT.film.logo`. Mouvement réduit et sans
JavaScript : le logo entier, immobile.

## Mise à jour du 2026-10-07 : plus de voiles sombres sur les scènes 01 à 03

À la demande de J (« retire les fonds assombris qui prennent toute la section, regarde s'il y en a d'autres
ailleurs et supprime aussi »), les voiles qui couvraient chaque scène de nuit sont retirés : `scene-modele.tsx`
(01), `scene-utile.tsx` (02) et `scene-relecture.tsx` (03). C'étaient des `bg-background` à 55 ou 60 % sur
téléphone, et un dégradé de 90 % à 10 ou 25 % sur ordinateur, posés sur le ciel commun : ils cachaient le paysage.
**Le ciel se voit maintenant en entier derrière le texte.**

Ce que ça coûte, mesuré (luminosité du fond sous chaque bloc de texte, texte masqué, 5 positions par scène, téléphone
et ordinateur) : sans voile, le texte clair tombe à 1 ou 2 contre 1 à plusieurs endroits (la lueur de l'horizon au
crépuscule, les nuages à l'aube) ; avec voile, ce n'était déjà que de 3 à 5 contre 1. Pour que le texte reste lisible
sans fond sombre :
- **une ombre douce sur les lettres** (`sur-ciel`, dans `app/globals.css`) : de la couleur du fond de la scène, elle
  suit les lettres et ne dessine aucun rectangle ; posée sur les blocs de texte des scènes 01 à 03, la légende du
  carrousel et la légende sous la fenêtre de « La relecture » ;
- **les paragraphes qui étaient « sourds »** (`text-muted-foreground`, un gris doré qui se perd sur un ciel clair)
  passent en `text-foreground` à 80 ou 85 % : les points de la scène 01, le paragraphe des scènes 02 et 03, la
  légende de la fenêtre, les noms de logiciels non choisis du carrousel.
**À regarder sur téléphone** : à l'aube (fin de la scène 03) et au crépuscule (début de la 01), le texte repose
sur un ciel clair ; l'ombre le tient, mais ce n'est pas un contraste de 4,5. Si cela gêne, le remède n'est pas un
voile sur toute la section : décaler la courbe du ciel (`reperes`), ou un dégradé local sous le seul bloc de texte.

**Gardés, et pourquoi** : le dégradé du héros (`hero.tsx`) : sur ordinateur, le texte blanc est posé sur les nuages
clairs de la vidéo, il ne se lirait plus ; le voile **clair** de « On en parle ? » (`appel.tsx`, un `bg-background`
sur la photo du matin : il éclaircit, il n'assombrit pas, et le texte est sombre) ; l'ombre derrière la fenêtre de
discussion (`plongee.tsx`, elle fait ressortir la fenêtre à son ouverture, comme le fond d'une boîte de dialogue).

Dans la même demande : le menu en île dit `Tarif` au lieu de `Livré` (il mène toujours à la section 04, dont
l'étiquette dit encore `04 · Livré`), et la ligne du héros se termine par « première maquette en 72h, à partir de
300 € ».

## Mise à jour du 2026-10-07 : « Livré » parle d'hébergement

À la demande de J (« il faut qu'on parle de l'hébergement, dire qu'ils peuvent héberger ou que je le gère,
que c'est un travail qui se fait de manière personnelle pour chaque projet ») : la scène 5
(`components/sections/scene-livre.tsx`) change de titre et de texte, **la carte « à partir de 300 € » ne
bouge pas**. Titre : « Livré propre, *hébergé comme vous voulez* ». Les quatre coches restent (« il vous
appartient » vit dans la quatrième). Dessous, deux voies qui arrivent l'une après l'autre, puis une ligne
qui vaut pour les deux :
- **Chez vous** : le client a déjà un hébergeur, ou veut garder la main ; J livre le site prêt à publier et
  l'accompagne pour la mise en ligne.
- **Chez moi** : J s'occupe de l'hébergement et de la maintenance (mises à jour, surveillance) et fait les
  modifications demandées, dans la limite du raisonnable, **contre un petit abonnement mensuel**. Aucun montant
  n'est écrit sur la page, comme la FAQ (« c'est écrit dans le devis ») : à décider avec J si l'on veut un
  « à partir de » plus tard.
- **Dans les deux cas** : le nom de domaine est au nom du client ; chaque projet se règle avec lui, un par
  un, et c'est écrit dans le devis.
Faits donnés par J le 2026-10-07. **La FAQ** (« Et l'hébergement, le nom de domaine ? ») dit la même chose,
le même jour, à la demande de J : l'abonnement mensuel pour l'hébergement et la maintenance, ou la main laissée
au client avec un accompagnement pour la mise en ligne, et le nom de domaine toujours à son nom. La question
« Combien ça coûte, vraiment ? » ne parle pas de l'abonnement : à voir avec J. `Arrivee` est sorti de
`scene-modele.tsx` pour servir aussi ici (`components/ui/arrivee.tsx`). La scène dure 3,4 s (`duree`), au lieu de
2,6 s, pour que les arrivées ne se pressent pas.

**Le fond en points : essayé, puis retiré le même jour.** J avait collé un fond en points qui s'efface vers les
bords (masque elliptique) pour la section 04. Posé d'abord à l'identique, puis aux jetons du thème (le garde-fou
refuse `bg-white`), puis plus visible et mobile : le motif glissait un peu avec l'inclinaison du téléphone
(`deviceorientation`, avec un bouton « Faire bouger le fond » sur iPhone et iPad pour l'autorisation d'Apple), ou
avec la souris. Après un essai sur son téléphone, J l'a retiré : « ça gêne la lecture ». Le composant
(`components/ui/fond-points.tsx`) est supprimé ; il reste dans l'historique git, commits `4b89553` (copie exacte de
son extrait), `c7b197d` (aux couleurs du thème) et `906e689` (plus visible, et mobile avec le téléphone). Si l'on
veut un jour un motif derrière du texte, le garder beaucoup plus léger, ou le réserver aux marges.

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
| Motif de page (4) | Scroll-Triggered Storytelling : accroche > chapitres (problème, chemin, réponse) > appel final ; indicateur de progression ; mobile simplifié ; état final en mouvement réduit | **Oui**, c'est le film. Portfolio Grid et Bento écartés comme structure, le bento gardé comme agencement de la scène 3 (remplacé le 2026-10-02 par le carrousel des démos de logiciels) |
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
| Scène 3 · démos de logiciels (2026-10-02) | Le carrousel « Phone Mockups 1 » de Solace UI, choisi par J sur 21st et copié depuis le registre public de son auteur (`components/ui/phone-mockups-1-utils`) ; les DESIGN.md de Linear, Stripe et Vercel pour les proportions des interfaces | le téléphone de face et ses voisins estompés, les trois boutons posés dessus, la rotation automatique ; interfaces claires à texte de 12 px, pastilles d'état, feuilles qui glissent | les captures d'applications de la démo (Behance, Notion…) ; leurs couleurs en dur, passées en jetons |
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
Scène 3 · Utile | plein | primary **nuit** | Eyebrow 02, H2, texte · trois logiciels en démonstration (VTBON, Carnet, Contrôle, dans cet ordre : VTBON s'affiche en premier), chacun une application vivante sur l'écran d'un iPhone du carrousel de Solace UI, chacune avec son design depuis le 2026-10-04 (demande de J) : Carnet gris d'après le DESIGN.md de Cal.com, Contrôle sombre d'après celui de Linear (thèmes `.appli-*` dans app/globals.css). Le 2026-10-07, VTBON, l'application de J, a pris la place de RelancePro : son écran est celui des deux maquettes animées de vtbon.fr (le bon dicté à la voix, puis la facture et sa relance), jouées l'une après l'autre en 45 s (`components/demos/vtbon/`, `vtbon-ecran.tsx`), sa palette est celle de l'application (noir et or) ; à côté (dessous sur téléphone), la légende du logiciel de face : ses trois noms, sa description et son lien (l'icône, le nom en titre, le statut et la ligne « pour qui » ont été retirés le 2026-10-07, à la demande de J) | Scene, Reveal, SaaSCarousel, SaaSPreviewCard, VtbonEcran (components/demos), PhoneCarousel (components/ui/phone-mockups-1-utils)
Scène 4 · La relecture | plein (une piste de 3,6 écrans, contenu collé) | background **nuit** | Eyebrow 03, H2, texte, les trois retouches qui se cochent · fenêtre du vrai site d'AR Transfert : barre d'édition simplifiée, curseur du client et curseur de Julien, texte réécrit, animation retirée, photo commentée, tampon | Scene (au défilement), FenetreRelecture
Scène 5 · Livré | plein | background (jour) | Eyebrow 04, H2, 4 coches, deux voies d'hébergement (« Chez vous », « Chez moi ») et la ligne commune · carte d'offre : 300 €, plusieurs fois, 72 h en rouleaux, France, bouton | Scene, Arrivee, Trace, Rouleaux
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
| 3 · Utile | Le carrousel apparaît (`Reveal`). Le téléphone de face joue sa démo (12 s, scénarios de J) : un doigt touche, ouvre une fiche, coche, envoie ; l'écran revient à son départ sans saut. Toutes les 12 s, le carrousel passe au téléphone suivant, dont la démo repart du début ; la rotation s'arrête au survol et quand le clavier y entre. Les voisins restent sur leur premier écran. Hors de l'écran, tout s'arrête. Valeurs dans `MOUVEMENT.demos` | précédent, pause (rotation et démo, WCAG 2.2.2), suivant ; glisser au doigt ou à la souris ; les noms de la légende ; « Parlons de votre outil » mène à `/contact` |
| 4 · La relecture | Au défilement (voir la mise à jour du 2026-10-07) : le client passe la barre en Édition et coche « Changement immédiat » ; il survole le paragraphe (contour pointillé), le saisit (contour plein), sélectionne sa dernière ligne et la réécrit lettre à lettre ; Julien, qui regarde, a son curseur ; la première retouche se coche. Les phares clignotent, le client les retire (« Garder » ou « Retirer »). Il épingle un commentaire sur la photo, Julien répond, la photo s'éclaircit. Le tampon se pose, la légende apparaît | rien |
| 5 · Livré | Les quatre coches se cochent une à une ; la carte d'offre glisse, « 300 € » apparaît immobile, « 72 h » roule de 00 à 72 (`Rouleaux`) ; les deux voies d'hébergement arrivent l'une après l'autre, puis la ligne commune ; la zone et le bouton arrivent (3,4 s en tout) | le bouton (accent) |
| Fin calme | `Defilant` pour le bandeau, `Reveal` sur Julien, la FAQ et l'appel ; les orbites terminent leur rotation | les trois noms du bandeau (liens, `lien-fleche`) ; l'accordéon (`<details>`, focus visible) ; les deux boutons |

**L'arc jour, nuit, jour.** La scène 1 est le jour : l'illustration, le papier. Entre la scène 1
et la scène 2, le fond passe à la nuit sur la fin de l'épinglage de la scène 1 (une transition de
couleur de fond, `background-color` sur la section suivante, jamais un fondu d'image). Les scènes
2, 3 et 4 portent `.nuit` et les orbites. La scène 5 revient au jour et la fin calme reste claire.
Le logo suit : version crème sur la nuit, version marine sur le jour (`public/logo-clair.png`,
`public/logo-nuit.png`, nommés par le fond qu'ils attendent).

**Mobile.** Mêmes scènes, épinglage plus court, six cartes dans le champ, la maquette de la scène
4 en pleine largeur sous le texte, une carte de démo à la fois (mise en page de téléphone, sans barre latérale). `ScrollTrigger.normalizeScroll(true)` activé
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
- **H8** La scène 4 cite AR Transfert (le chauffeur VTC de Béziers, un des sites de la roue) comme exemple de relecture, avec l'accord du client dit obtenu. *Remplace la Pizzeria des Allées (2026-10-07) ; à confirmer par J : le client a-t-il bien relu son site ainsi, et accepte-t-il d'être cité ?*
- **H9** Contact : WhatsApp seul. L'e-mail viendra plus tard ; la page des mentions légales le marque à confirmer en attendant.
- **H10** Le questionnaire compte dix questions, celles de `CONTENU.md`, dans cet ordre ; les réponses vont en base et se lisent dans `/admin` ; aucune alerte par e-mail, aucun service d'envoi n'est branché.
- **H11** Compte administrateur : `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env` ; en développement, `admin@stalika.local` / `stalika-dev`.
- **H12** Le bandeau dit « VTBON · l'application des chauffeurs VTC » et « Popec · coach sportif » : à relire par J.
- **H13** « 72 h » est le seul chiffre animé (rouleaux). « 300 € » reste immobile : un prix ne se compte pas.
- **H14** Sur téléphone : mêmes scènes, épinglages de 1,7 écran, six cartes dans le champ, une démo de logiciel à la fois.
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
- **Déroulé voulu par J** : premier message du visiteur écrit tout seul (« Hey, salut ! J'ai un projet et j'aimerais qu'on en discute », sans « de site » depuis le 2026-10-07), première réponse toujours la même (prénom, tutoiement ou vouvoiement, description du projet), puis Claude prend la suite, relance, personnalise (utilise le prénom). En fin d'échange : choisir un créneau (calendrier + créneaux) ou passer sur WhatsApp.
- **Transparence** : l'assistant dit qu'il est l'assistant IA de Julien (règlement (UE) 2024/1689, art. 50, applicable depuis le 2026-08-02, cité de mémoire, à vérifier). Il ne se fait jamais passer pour J. Passage de relais vers J (résumé par e-mail ou WhatsApp).
- **Agenda** : accès propre au site (Google Agenda autorisé par J), lecture des créneaux libres uniquement, aucun détail des rendez-vous. Réservation directe ou demande validée par J : à décider.
- **Garde-fous** : sujet limité à l'offre, seuls les prix publiés, résistance aux détournements, messages et échanges plafonnés par visiteur, plafond de dépense.
- **RGPD** : information avant l'échange, durée de conservation, politique de confidentialité, Anthropic comme sous-traitant ; à vérifier sur cnil.fr avant la mise en ligne.
- **À décider par J** : le modèle, le nom de l'assistant, le canal de notification, réservation directe ou validée.
- **En attendant** : le déroulé est scripté ; après le premier message du visiteur, la fenêtre propose honnêtement un créneau ou WhatsApp, qui envoient un vrai message à J (rien n'est réservé en silence).
