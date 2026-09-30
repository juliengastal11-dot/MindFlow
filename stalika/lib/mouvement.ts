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

    /** Le texte qui se tape : période du clignotement du curseur, en secondes. */
    frappe: { curseur: 0.53 },

    /** Le logo qui se compose à l'ouverture : brouillage, fixation lettre à lettre, fondu vers l'image. */
    logo: { brouillage: 0.5, fixation: 0.8, fondu: 0.35, glyphes: "_/\\|<>*#-+" },

    /** Le mot qui se décode : les glyphes de brouillage, et le nombre de passes par lettre. */
    decode: { glyphes: "abcdefghijklmnopqrstuvwxyzéèàç·", passes: 5 },

    /** Le champ de cartes en perspective. */
    champ3d: {
      cartes: 9,
      cartesMobile: 6,
      /** Distance de l'œil au plan, en pixels : plus c'est court, plus ça se déforme. */
      perspective: 1400,
      /** Inclinaison du plan, en degrés. */
      inclinaison: 16,
      /** Léger vrillage, en degrés, pour que le champ ne soit pas un tableau. */
      vrille: -6,
    },

    /** La pile de cartes qui se poussent. */
    pile: { max: 6, maxMobile: 4, decalage: 12 },

    /** L'illustration de l'ouverture, en calques : déplacement de chaque calque sur la scène,
        en fraction de sa hauteur. Le ciel bouge à peine, le premier plan franchement. */
    paysage: { ciel: 0.04, lointain: 0.1, premierPlan: 0.22 },

    /** Les grands arcs du décor : rotation totale sur la page, en degrés, et opacité. */
    orbites: { rotation: 14, opacite: 0.16 },

    /** Le trait qui barre un mot, en fraction de la hauteur de ligne. */
    barre: { epaisseur: 0.08 },
  },
} as const;
