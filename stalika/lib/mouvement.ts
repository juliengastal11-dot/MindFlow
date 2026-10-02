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
     en scène jusqu'à l'ordinateur (demande de J, 2026-10-02). Premier clic :
     il saute s'accrocher au menu par un coin et se balance. Second clic : il
     tombe, rebondit sur les textes et les animations du site, et se pose près
     de l'ordinateur, sur la dernière image du ciel. En mouvement réduit, rien
     de tout cela : le bouton est un simple lien. */
  bouton: {
    /** Le saut vers le clou : le bouton s'accroupit, puis vole (secondes). */
    envol: { accroupi: 0.16, vol: 0.62 },
    /** Le balancement par le coin haut gauche. `amplitude` : de combien il part
        de sa position de repos, en radians (0,63 ≈ 36°) ; `periode` des petites
        oscillations ; `duree` avant qu'il ne s'arrête ; `taux` : amortissement
        par seconde. */
    pendule: { amplitude: 0.63, periode: 1.45, duree: 4.4, taux: 0.6 },
    /** L'indice du second clic apparaît quand le balancement n'a plus que cette
        part de sa durée à courir. */
    indice: { apres: 0.55 },
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
} as const;
