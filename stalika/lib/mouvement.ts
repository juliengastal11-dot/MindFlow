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

    /** Le logo qui se compose à l'ouverture : brouillage, fixation lettre à lettre, fondu vers l'image. */
    logo: { brouillage: 0.5, fixation: 0.8, fondu: 0.35, glyphes: "_/\\|<>*#-+" },

    /** Le mot qui se décode : les glyphes de brouillage, et le nombre de passes par lettre. */
    decode: { glyphes: "abcdefghijklmnopqrstuvwxyzéèàç·", passes: 5 },

    /** La roue des sites (scène « Sur mesure ») : un cylindre de cartes qui
        tourne seul, qu'on attrape, qu'on lance, et qui se pose sur une carte. */
    roue: {
      /** Écart entre deux cartes sur le cylindre, en degrés. À 36°, la carte
          d'avant et celle d'après se voient de biais ; les autres filent derrière. */
      ecart: 36,
      /** Jour entre deux cartes, en fraction de la hauteur d'une carte. */
      jour: 0.06,
      /** Distance de l'œil, en hauteurs de carte : la roue garde le même relief
          sur téléphone et sur ordinateur. */
      perspective: 2.4,
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
      /** Inertie du lancer, en secondes : plus c'est long, plus la roue file. */
      inertie: 0.34,
      /** Au plus, de combien de cartes un lancer fait tourner la roue. */
      lancerMax: 4,
      /** L'entrée : la roue arrive lancée de `cartes` cartes et se pose sur la
          première, en `duree` (fraction de la chronologie de la scène). */
      entree: { cartes: 6, duree: 0.92 },
      /** Obscurité d'une carte qui s'éloigne de la lumière (0 = aucune). */
      ombre: 0.85,
      /** D'où vient la lumière, en degrés au-dessus de la face. */
      lumiere: 25,
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
} as const;
