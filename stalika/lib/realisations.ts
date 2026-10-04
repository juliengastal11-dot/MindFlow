/* ---------------------------------------------------------------------------
   Les sites de la roue (scène « Sur mesure ») : quatre réalisations de Julien
   (demande de J, 2026-10-01 ; AR Transfert ajouté en tête le 2026-10-04).

   Chaque carte montre le haut du site sur téléphone (fenêtre de 390 × 650 px,
   capturée en densité 2), puis la page entière jusqu'au pied de page quand on
   la fait défiler. Les médias sont dans `public/realisations/<id>/` :

   · `affiche.webp` : le haut de page, à l'arrêt (780 × 1300) ;
   · `page-N.webp` : la page entière, en tranches de 600 px de large,
     chargées au fil du défilement dans la carte ;
   · mode « plat » : `hero.mp4|webm` (600 × 1000) et `hero-mobile.*` : le haut
     de page en action. `boucle` : une boucle sans couture (la vie de la
     devanture). `entree` : l'arrivée sur le site, jouée une fois quand la
     carte se présente, puis tenue sur sa dernière image. `entree-boucle` :
     l'arrivée, puis une boucle qui reprend à `reprise` secondes ;
   · mode « calques » (VTBON) : le site a un fond fixe derrière toute la page,
     un film que le défilement fait avancer. La carte le rejoue : `fond-NN.webp`
     (les images du film, rognées comme le fait le site), le voile qui
     s'assombrit, et la page en tranches TRANSPARENTES qui défile par-dessus.
     L'entrée du héros est rejouée bloc par bloc (`calques.hero`).

   Captures du 2026-10-01, sur les sites en ligne : pizzeria-des-allees.vercel.app,
   vtbon.fr, popec-run.vercel.app ; et du 2026-10-04 : ar-transfert-apercu.vercel.app.
   Les outils d'essai (le bandeau des couleurs de la pizzeria) et les barres fixes
   sont masqués. Pour refaire une capture : `outils/realisations/` à la racine du
   dépôt.
--------------------------------------------------------------------------- */

/** Une courbe en points : (abscisse, ordonnée), abscisses croissantes. */
export type Points = readonly (readonly [number, number])[];

export type Calques = {
  /** Nombre d'images du film (`fond-00.webp` à `fond-NN.webp`). */
  images: number;
  /** Fin du défilement du site, en pixels de la capture (390 px de large) :
      haut du pied de page moins la hauteur de la vue. */
  finPage: number;
  /** Progression du défilement → fraction du film (`MOUVEMENT.video.courbe` du site). */
  courbe: Points;
  /** Progression du défilement → opacité du voile noir (`VOILE` du site). */
  voile: Points;
  /** Les enfants directs de l'entrée du héros, en pixels de la capture. */
  hero: readonly { rang: number; x0: number; y0: number; x1: number; y1: number }[];
  /** L'entrée du héros : chacun monte de `distance` px en apparaissant, après
      `delai` secondes, puis tous les `decalage` secondes, en `duree`. */
  entree: { delai: number; decalage: number; duree: number; distance: number; courbe: readonly [number, number, number, number] };
};

export type Realisation = {
  id: string;
  nom: string;
  /** Le métier, et la ville quand elle compte. */
  sous: string;
  /** « plat » : l'affiche, la vidéo, la page. « calques » : un fond qui ne défile pas, la page par-dessus. */
  mode: "plat" | "calques";
  /** Ce que fait le haut de page : rien, une boucle, une entrée jouée une fois, ou les deux. */
  video: "boucle" | "entree" | "entree-boucle" | null;
  /** `entree-boucle` : l'instant où la boucle reprend, en secondes. */
  reprise?: number;
  /** Description de l'affiche, pour les lecteurs d'écran. */
  alt: string;
  /** La couleur de fond du site, posée le temps que l'affiche arrive. */
  fond: string;
  /** Hauteur des tranches de la page entière, en pixels, pour 600 px de large. */
  tranches: number[];
  calques?: Calques;
};

export const REALISATIONS: Realisation[] = [
  {
    // En tête de la roue, à la demande de J : la première carte qu'on voit.
    id: "ar-transfert",
    nom: "AR Transfert",
    sous: "chauffeur VTC · Béziers",
    mode: "plat",
    video: "entree-boucle",
    reprise: 4.4,
    alt: "Le haut du site d'AR Transfert sur téléphone : son logo, une berline noire qui sort de la nuit, phares allumés, le titre « Chauffeur privé à Béziers » et la mention Disponible 24h/24, 7j/7.",
    fond: "#000000",
    tranches: [3000, 3000, 3000, 2496],
  },
  {
    id: "pizzeria",
    nom: "La Pizzeria des Allées",
    sous: "pizzeria · Béziers",
    mode: "plat",
    video: "boucle",
    alt: "Le haut du site de la Pizzeria des Allées sur téléphone : la devanture bleu nuit et or, des convives en terrasse, les boutons Commander et Réserver.",
    fond: "#0b1a44",
    tranches: [3000, 3000, 3000, 3000, 1650],
  },
  {
    id: "vtbon",
    nom: "VTBON",
    sous: "application des chauffeurs VTC",
    mode: "calques",
    video: null,
    alt: "Le haut du site VTBON sur téléphone : fond de cuir surpiqué d'or, le titre « Vos bons de transport VTC, à la voix. En quelques secondes. »",
    fond: "#000000",
    tranches: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 2802],
    calques: {
      images: 40,
      finPage: 18036.1,
      // `MOUVEMENT.video.courbe` et `VOILE` de vtbon-site (components/video/fond-video.tsx).
      courbe: [
        [0, 0],
        [0.3, 0.55],
        [0.55, 0.85],
        [1, 1],
      ],
      voile: [
        [0, 0.14],
        [0.1, 0.16],
        [0.3, 0.56],
        [0.55, 0.82],
        [0.9, 0.88],
        [1, 0.76],
      ],
      hero: [
        { rang: 0, x0: 24, y0: 84, x1: 321.8, y1: 118.4 },
        { rang: 1, x0: 24, y0: 138.4, x1: 366, y1: 298.4 },
        { rang: 2, x0: 24, y0: 314.4, x1: 366, y1: 410.4 },
        { rang: 3, x0: 24, y0: 438.4, x1: 366, y1: 486.4 },
        { rang: 4, x0: 24, y0: 506.4, x1: 366, y1: 569.8 },
      ],
      // `MOUVEMENT.hero` et `mv-hero-entree` de vtbon-site.
      entree: { delai: 0.2, decalage: 0.16, duree: 0.7, distance: 28, courbe: [0.22, 1, 0.36, 1] },
    },
  },
  {
    id: "popec",
    nom: "Popec",
    sous: "coach sportif · Béziers",
    mode: "plat",
    video: "entree-boucle",
    reprise: 1.92,
    alt: "Le haut du site de Popec sur téléphone : un lac de montagne, le titre « S'entraîner sérieusement, sans se prendre au sérieux. », le bouton Réserver mon bilan offert.",
    fond: "#438192",
    tranches: [3000, 3000, 3000, 1586],
  },
];

/** Le dossier des médias d'une réalisation. */
export const dossierRealisation = (id: string) => `/realisations/${id}`;
