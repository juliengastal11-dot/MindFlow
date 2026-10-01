/* ---------------------------------------------------------------------------
   Les sites de la roue (scène « Sur mesure ») : trois réalisations de Julien
   et deux sites d'exemple, imaginés pour montrer d'autres styles (demande de
   J, 2026-10-01). Les deux exemples le disent : sous-titre « site
   d'exemple », et leur propre pied de page le répète.

   Chaque carte montre le haut du site sur téléphone (fenêtre de 390 × 650 px,
   capturée en densité 2), puis la page entière jusqu'au pied de page quand on
   la visite. Les médias sont dans `public/realisations/<id>/` :

   · `affiche.webp` : le haut de page, à l'arrêt (780 × 1300) ;
   · `hero.mp4|webm` (600 × 1000) et `hero-mobile.*` (324 × 540) : le haut de
     page en action. `boucle` : une boucle sans couture (la vie de la
     devanture, le bol qui tourne). `entree` : l'arrivée sur le site, jouée une
     fois quand la carte se présente, puis tenue sur sa dernière image ;
   · `page-N.webp` : la page entière, en tranches de 600 px de large,
     chargées seulement à la visite.

   Captures du 2026-10-01 : pizzeria-des-allees.vercel.app et vtbon.fr en
   ligne ; Popec depuis son dépôt (`juliengastal11-dot/Popec`), construit en
   local, faute d'adresse publique. Les outils d'essai (le bandeau des
   couleurs de la pizzeria) et les barres fixes sont masqués. Pour refaire une
   capture : les scripts sont décrits dans `BLUEPRINT.md`.
--------------------------------------------------------------------------- */

export type Realisation = {
  id: string;
  nom: string;
  /** Le métier, et la ville ou la mention « site d'exemple ». */
  sous: string;
  /** Site imaginé pour la démonstration, pas un client. */
  exemple: boolean;
  /** Ce que fait le haut de page : rien, une boucle, ou une entrée jouée une fois. */
  video: "boucle" | "entree" | null;
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
    exemple: false,
    video: "boucle",
    alt: "Le haut du site de la Pizzeria des Allées sur téléphone : la devanture bleu nuit et or, des convives en terrasse, les boutons Commander et Réserver.",
    fond: "#0b1a44",
    tranches: [3000, 3000, 3000, 3000, 1650],
  },
  {
    id: "ocre",
    nom: "Ocre & Cendre",
    sous: "céramiste · site d'exemple",
    exemple: true,
    video: "boucle",
    alt: "Le haut d'un site d'exemple pour un céramiste : un bol émaillé qui tourne sur le tour, le titre « Des pièces tournées à la main, une à une. »",
    fond: "#f3ece2",
    tranches: [3000, 2132],
  },
  {
    id: "vtbon",
    nom: "VTBON",
    sous: "application des chauffeurs VTC",
    exemple: false,
    video: "entree",
    alt: "Le haut du site VTBON sur téléphone : fond de cuir surpiqué d'or, le titre « Vos bons de transport VTC, à la voix. En quelques secondes. »",
    fond: "#0b0a08",
    tranches: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 2732],
  },
  {
    id: "popec",
    nom: "Popec",
    sous: "coach sportif · Béziers",
    exemple: false,
    video: "entree",
    alt: "Le haut du site de Popec sur téléphone : un lac de montagne, le titre « S'entraîner sérieusement, sans se prendre au sérieux. »",
    fond: "#3c6f86",
    tranches: [3000, 3000, 3000, 3000, 1826],
  },
  {
    id: "signet",
    nom: "Le Signet",
    sous: "librairie · site d'exemple",
    exemple: true,
    video: null,
    alt: "Le haut d'un site d'exemple pour une librairie : une étagère de livres colorés sur fond vert bouteille, le titre « Des livres choisis, un par un. »",
    fond: "#13312a",
    tranches: [3000, 2000],
  },
];

/** Le dossier des médias d'une réalisation. */
export const dossierRealisation = (id: string) => `/realisations/${id}`;
