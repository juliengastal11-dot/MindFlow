/* ---------------------------------------------------------------------------
   Les sites de la roue (scène « Sur mesure ») : trois réalisations de Julien
   (demande de J, 2026-10-01).

   Chaque carte montre le haut du site sur téléphone (fenêtre de 390 × 650 px,
   capturée en densité 2), puis la page entière jusqu'au pied de page quand on
   la fait défiler. Les médias sont dans `public/realisations/<id>/` :

   · `affiche.webp` : le haut de page, à l'arrêt (780 × 1300) ;
   · `hero.mp4|webm` (600 × 1000) et `hero-mobile.*` (324 × 540) : le haut de
     page en action. `boucle` : une boucle sans couture (la vie de la
     devanture). `entree` : l'arrivée sur le site, jouée une fois quand la carte
     se présente, puis tenue sur sa dernière image. `entree-boucle` : l'arrivée,
     puis une boucle qui reprend à `reprise` secondes (la bande qui défile) ;
   · `page-N.webp` : la page entière, en tranches de 600 px de large,
     chargées au fil du défilement dans la carte.

   Captures du 2026-10-01, sur les sites en ligne : pizzeria-des-allees.vercel.app,
   vtbon.fr, popec-run.vercel.app. Les outils d'essai (le bandeau des couleurs de
   la pizzeria) et les barres fixes sont masqués. Pour refaire une capture :
   `outils/realisations/` à la racine du dépôt.
--------------------------------------------------------------------------- */

export type Realisation = {
  id: string;
  nom: string;
  /** Le métier, et la ville quand elle compte. */
  sous: string;
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
};

export const REALISATIONS: Realisation[] = [
  {
    id: "pizzeria",
    nom: "La Pizzeria des Allées",
    sous: "pizzeria · Béziers",
    video: "boucle",
    alt: "Le haut du site de la Pizzeria des Allées sur téléphone : la devanture bleu nuit et or, des convives en terrasse, les boutons Commander et Réserver.",
    fond: "#0b1a44",
    tranches: [3000, 3000, 3000, 3000, 1650],
  },
  {
    id: "vtbon",
    nom: "VTBON",
    sous: "application des chauffeurs VTC",
    video: "entree",
    alt: "Le haut du site VTBON sur téléphone : fond de cuir surpiqué d'or, le titre « Vos bons de transport VTC, à la voix. En quelques secondes. »",
    fond: "#0b0a08",
    tranches: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 2732],
  },
  {
    id: "popec",
    nom: "Popec",
    sous: "coach sportif · Béziers",
    video: "entree-boucle",
    reprise: 1.92,
    alt: "Le haut du site de Popec sur téléphone : un lac de montagne, le titre « S'entraîner sérieusement, sans se prendre au sérieux. », le bouton Réserver mon bilan offert.",
    fond: "#438192",
    tranches: [3000, 3000, 3000, 1586],
  },
];

/** Le dossier des médias d'une réalisation. */
export const dossierRealisation = (id: string) => `/realisations/${id}`;
