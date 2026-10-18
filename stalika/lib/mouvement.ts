/* ---------------------------------------------------------------------------
   Réglages du mouvement : un fichier-contrat, comme le thème.

   Les primitives de `components/ui/` portent la STRUCTURE d'un mouvement : ce
   qui bouge, dans quel ordre, déclenché par quoi. Elles ne portent aucune
   valeur. Les valeurs sont ici, et c'est ici (une seule fois, au bootstrap)
   qu'on les cale sur la direction de mouvement décidée pour ce site.

   Stalika est une vitrine, direction « ample » (Pro Max, --motion 7) : des
   durées longues, des distances franches. Et son accueil est un film joué au
   défilement : le bloc `film`, plus bas, règle ce qui suit la molette.

   Toutes les durées sont en secondes, les distances en pixels.

   ⚠️ Ce fichier ne couvre que le mouvement d'ARRIVÉE et le film. Ce qui RÉPOND
   au curseur, au doigt et au clavier vit dans `app/globals.css`, sous « LES
   ÉTATS » : c'est du CSS, pas du JavaScript.
--------------------------------------------------------------------------- */

export const MOUVEMENT = {
  /** Durée d'une apparition. 0,6 = vif, 1,2 = ample. */
  duree: 1.0,
  /** Déplacement vertical d'une apparition, en pixels. */
  distance: 32,
  /** Écart entre deux frères d'une cascade. Au-delà de 0,15, on attend. */
  decalage: 0.1,
  /** Courbe. `power3.out` freine en fin de course : naturel, jamais élastique. */
  ease: "power3.out",
  /** Position de l'élément dans le viewport qui déclenche son apparition. */
  declencheur: "top 85%",

  hero: {
    /** Respiration avant que le héros n'entre, le temps que la page se pose. */
    delai: 0.15,
    /** Écart entre l'eyebrow, le titre, le texte, les boutons. */
    decalage: 0.12,
    /* L'ordre voulu par J (2026-10-18) : STALIKA se compose (0,3 à 3,6 s), puis le texte, puis le bouton.
       Le texte part quand les dernières lettres se posent, pendant que la baseline « Digital & Conseil » arrive. */
    /** Le texte : ses mots sortent de la brume, flous puis nets, en vague, paragraphe par paragraphe (J, 2026-10-18 :
        « ralentir un peu pour profiter de l'effet de brume, ou paragraphe par paragraphe, encore mieux »). Le suivant part
        `chevauchement` secondes avant que le précédent ait fini de s'éclaircir ; le bouton est appelé `boutonAvantFin`
        secondes avant la fin du dernier. */
    brume: { debut: 3.2, entreMots: 0.035, duree: 1.15, flou: 10, monte: 6, chevauchement: 0.5, boutonAvantFin: 0.4 },
    /** Le bouton : il descend au bout d'un fil, se balance, se pose, et le fil remonte. Il attend la fin du texte ;
        `secours` : il vient de toute façon à cet instant (le texte n'a pas pu l'appeler). */
    fil: { secours: 9, longueur: 90, chute: 56, descente: 0.9, balance: 1.3, angle: 5, retrait: 0.6 },
  },

  /** Débord de la parallaxe, en fraction de la hauteur du cadre. */
  parallaxe: 0.15,

  /** Vitesse du bandeau défilant, en pixels par seconde. */
  defilant: 50,
  /** Espace entre deux éléments du bandeau, en pixels. */
  defilantEcart: 48,

  /** Durée du comptage d'un chiffre. */
  compteur: 1.6,

  /* --- Ce qui répond au curseur ou au défilement, plutôt qu'à l'arrivée --- */

  relief: {
    /** Inclinaison maximale d'une carte sous le curseur, en degrés. */
    inclinaison: 6,
    /** Agrandissement au survol. 1,02 se sent sans se voir. */
    echelle: 1.02,
    /** Temps de rattrapage du curseur. Court, sinon la carte traîne. */
    duree: 0.4,
  },

  /** Épaisseur de la barre de progression de lecture, en pixels. */
  progression: { epaisseur: 3 },

  rotatif: {
    /** Temps d'affichage d'un mot. Moins de 2 s, on n'a pas fini de lire. */
    pause: 2.2,
    /** Durée de la bascule d'un mot au suivant. */
    duree: 0.45,
  },

  /* --- Le film : les scènes de l'accueil. Chacune joue son animation une
     fois, à l'arrivée, sur `duree` secondes. Plus aucune n'est épinglée :
     J a jugé à l'essai que l'épinglage donnait l'impression d'un bug. En
     mouvement réduit, chaque scène affiche son état final. */
  film: {
    /** Durée de l'animation d'une scène, en secondes. */
    duree: 2.6,
    /** Position de la scène dans l'écran qui lance son animation. */
    declencheur: "top 65%",

    /** Le logo STALIKA qui se compose lettre par lettre en ouverture, puis scintille. */
    brouille: {
      /* Symboles pas plus larges qu'une lettre moyenne : chaque lettre a une
         boîte de largeur fixe, un « % » ou un « & » débordaient sur la voisine. */
      glyphes: "_!X$0-+*/<>?=",
      /** Entrée : temps de brouillage d'une lettre, et nombre de symboles qu'elle fait défiler. */
      parLettre: 1.4,
      changements: 22,
      /** Écart entre le départ de deux lettres. */
      decalage: 0.32,
      /** Après l'entrée : une lettre au hasard se rebrouille, puis une pause avant la suivante. */
      scintille: { duree: 0.4, changements: 7, pauseMin: 0.7, pauseMax: 1.5 },
    },

    /** Le texte qui se tape : période du clignotement du curseur, en secondes. */
    frappe: { curseur: 0.53 },

    /** Le mot qui se décode : les glyphes de brouillage, et le nombre de passes par lettre. */
    decode: { glyphes: "abcdefghijklmnopqrstuvwxyzéèàç·", passes: 5 },

    /** La roue des sites (scène « Sur mesure ») : un cylindre de cartes qui
        tourne seul, qu'on attrape, qu'on lance, et qui se pose sur une carte. */
    roue: {
      /* La roue est un vrai cylindre : chaque carte est un pan courbe, enroulé
         autour de l'axe (demande de J, 2026-10-01 : « une forme arrondie, pas
         des plaques qui se suivent »). L'écart entre deux cartes n'est pas un
         réglage : c'est un demi-tour divisé par le nombre de cartes (60° pour
         trois). Une carte couvre cet écart moins `jour` ; le rayon du cylindre
         s'en déduit, pour que la carte déroulée garde sa hauteur. Avec trois
         cartes, celle de face est légèrement bombée, haut et bas fuyant vers
         l'arrière, et les deux autres, plus inclinées, s'enroulent derrière. */
      /** Jour entre deux cartes, en fraction de l'écart (0,05 de 60° : 3°). */
      jour: 0.05,
      /** Chaque carte est découpée en `bandes` bandes horizontales, posées sur
          le cylindre une à une. Plus il y en a, plus la courbe est lisse. */
      bandes: 12,
      /** Chevauchement de deux bandes voisines, en pixels : sans lui, la
          rotation laisse un filet clair entre elles. */
      recouvrement: 1.5,
      /** Distance de l'œil, en hauteurs de carte : la roue garde le même relief
          sur téléphone et sur ordinateur. */
      perspective: 2.6,
      /** La rotation seule : une carte toutes les `periode` secondes. La roue
          s'attarde d'abord sur la carte de face (`attente`, en fraction de la
          période), en dérivant à peine (`derive`), puis bascule vers la
          suivante avec la courbe `bascule`. */
      periode: 5,
      attente: 0.5,
      derive: 0.04,
      bascule: "power2.inOut",
      /** Reprise de la rotation seule après une prise en main, en secondes. */
      reprise: 2.6,
      /** Après le survol, la rotation reprend plus vite. */
      repriseSurvol: 0.8,
      /** Après qu'on a fait défiler un site dans sa carte, elle attend plus
          longtemps : on était en train de lire. */
      repriseLecture: 6,
      /** Inertie du lancer, en secondes : plus c'est long, plus la roue file. */
      inertie: 0.34,
      /** Au plus, de combien de cartes un lancer fait tourner la roue. */
      lancerMax: 4,
      /** Au doigt, la roue tourne ce nombre de fois plus vite que le doigt (la roue d'un
          téléphone est petite : à 1, il fallait glisser sur toute la hauteur d'une carte, soit
          254 px, pour en changer ; à 1,5, 170 px). */
      gainTactile: 1.5,
      /** Un glissé qui franchit cette part d'une carte change de carte, même lent
          (0,2 : un cinquième de carte, soit une cinquantaine de pixels sur téléphone). */
      seuilGlisse: 0.2,
      /** L'entrée : la roue arrive lancée de `cartes` cartes et se pose sur la
          première, en `duree` (fraction de la chronologie de la scène). */
      entree: { cartes: 6, duree: 0.92 },
      /** Obscurité d'une bande qui s'éloigne de la lumière (0 = aucune). */
      ombre: 0.6,
      /** D'où vient la lumière, en degrés au-dessus de la face. */
      lumiere: 25,
      /** Le reflet sur le cylindre : intensité maximale, angle où il passe
          (négatif : au-dessus de la face) et largeur, en degrés. */
      reflet: { max: 0.11, centre: -14, largeur: 17 },
      /** Agrandissement de la carte qu'on visite. */
      visite: 1.04,
    },

    /** La pile de cartes qui se poussent. */
    pile: { max: 6, maxMobile: 4, decalage: 12 },


    /** Les grands arcs du décor : rotation totale sur la page, en degrés, et opacité. */
    orbites: { rotation: 14, opacite: 0.16 },

    /** Le trait qui barre un mot, en fraction de la hauteur de ligne. */
    barre: { epaisseur: 0.08 },
  },

  /* --- Le bouton du héros : il se décroche, se balance, puis tombe de scène
     en scène jusqu'à l'ordinateur (demande de J, 2026-10-02). Un seul clic
     (depuis le 2026-10-17) : il saute s'accrocher au menu par un coin, se
     balance un instant, puis tombe de lui-même, rebondit sur les textes et les
     animations du site, et se pose près de l'ordinateur, sur la dernière image
     du ciel. En mouvement réduit, rien de tout cela : le bouton est un simple
     lien. */
  bouton: {
    /** Le clic : le bouton s'accroupit, sursaute sur le texte du hero (une arche à `hauteur` d'écran au-dessus du plus haut des
        deux points), s'y pose `pose` secondes en s'écrasant un peu, puis tombe (J, 2026-10-18 : « pas si haut, juste sursauter
        sur le texte puis tomber » ; avant, il sautait jusqu'au menu et s'y balançait). */
    saut: { accroupi: 0.14, vol: 0.42, hauteur: 0.05, pose: 0.24 },
    chute: {
      /** Durée voulue du film, en secondes : `base`, plus `parEcran` par hauteur
          d'écran à parcourir, bornée par `min` et `max`. */
      duree: { base: 1.8, parEcran: 0.95, min: 5.5, max: 9 },
      /** Gravité du calcul (px/s²) : le film est ensuite mis à la durée voulue. */
      gravite: 3200,
      /** Part de la vitesse conservée à chaque rebond. */
      restitution: 0.66,
      /** Hauteur d'un rebond, en fraction de la hauteur de l'écran : assez haut
          pour qu'il se voie, et pour que le bouton ait la place de tourner. */
      rebond: { min: 0.07, max: 0.24 },
      /** Écart minimal entre deux impacts, en fraction de la hauteur de l'écran, et leur nombre. */
      ecartMin: 0.24,
      maxRebonds: 10,
      /** Où l'impact se place à l'écran, en fraction de la hauteur depuis le haut. */
      ancrage: 0.56,
      /** Les trois petits rebonds d'atterrissage, en fraction de la hauteur de l'écran. */
      petitsRebonds: [0.035, 0.012, 0.004],
      /** Un tour sur lui-même demande que le bouton reste assez haut, loin des
          surfaces, au moins ce temps (secondes du calcul). */
      tour: 0.4,
      /** Écrasement à l'impact : durée (s du calcul), force, étirement avant le choc. */
      ecrasement: { duree: 0.09, force: 0.22, etirement: 0.1 },
      facteurTemps: { min: 0.55, max: 1.7 },
      /** Échelle du bouton qui tombe, puis une fois posé près de l'ordinateur
          (la falaise est loin : un bouton à taille réelle y serait un panneau). */
      echelleVol: 0.82,
      echelleFin: 0.5,
      /** Vitesse du film quand le visiteur le passe (molette, doigt, Échap). */
      accelerer: 6,
    },
    /** Le bouton posé s'efface sur cette première part du défilement de la plongée. */
    pose: { fondu: 0.07 },
    /** Du bouton posé à la fenêtre de discussion, quand on clique dessus :
        durée du défilement, et part de la plongée où la fenêtre est en place. */
    discussion: { duree: 3.4, avancee: 0.985 },
  },

  /* --- Les démos de logiciels de la section 02 (components/demos, demande de
     J du 2026-10-02) : de vraies interfaces qui se servent toutes seules, en
     boucle. Chaque démo pose ses étapes en secondes sur sa propre chronologie ;
     ici, le tempo commun. */
  demos: {
    /** Une boucle complète, en secondes. J : « environ 10 à 12 secondes ». */
    boucle: 12,
    /** Le curseur : un trajet, l'appui d'un clic. */
    curseur: { trajet: 0.62, appui: 0.13 },
    /** Ouvrir ou fermer un panneau. */
    panneau: 0.48,
    /** Une donnée qui apparaît, et l'écart entre deux lignes qui se suivent. */
    apparition: 0.32,
    decalage: 0.07,
    /** `sortie` freine ce qui arrive ; `trajet` porte ce qui se déplace. */
    sortie: "power3.out",
    trajet: "power2.inOut",
    /** Part visible d'une carte pour que sa démo tourne : les cartes voisines,
        à peine visibles au bord du carrousel, restent à l'arrêt. */
    seuilVisible: 0.35,
  },

  /* --- La relecture (scène 4, refaite le 2026-10-07 à la demande de J) : la
     maquette suit le défilement, sur une piste plus haute que l'écran dans
     laquelle le contenu reste collé (`Scene`, option `defilement`). La page
     défile toujours normalement ; seul le contenu reste en place le temps du
     film. J : « avec le défilement, on change si ce n'est pas bien ». */
  relecture: {
    /** Longueur de la piste, en hauteurs d'écran, en plus de l'écran qui la porte. */
    ecrans: 2.6,
    /** Lissage de la lecture derrière la molette, en secondes (0 : collée au doigt). Au doigt, aucun
        (2026-10-17, « trop de latence ») ; à la molette 0,2 au lieu de 0,45 : Lenis lisse déjà. */
    lissage: 0.2,
  },
} as const;
