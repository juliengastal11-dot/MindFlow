/* ---------------------------------------------------------------------------
   La montre qui se fabrique, en images (2026-10-21). La section 04 joue un
   film fait avec Higgsfield (J, 2026-10-21 : « un résultat ultra réaliste ») :
   les pièces de la vue éclatée de J, remises à la taille du boîtier, posées en
   sept images clés (une par étape), et six plans vidéo (Kling 3.0) qui font
   descendre chaque pièce d'une image clé à la suivante. Hors de la pièce qui
   bouge, chaque image reprend l'image clé exacte : rien d'autre ne bouge, rien
   ne se fond, rien ne change de forme. La fabrication est dans
   outils/montre/higgsfield (LISEZMOI).

   La séquence suit la chronologie de la section (components/ui/montre-film.tsx)
   par `imageDuFilm` : la pièce d'une étape descend au début de son temps,
   puis la montre attend l'étape suivante ; à la fin, la caméra s'approche et
   cadre la montre finie en grand.
--------------------------------------------------------------------------- */

export type SerieFilm = {
  /** Le dossier sous `public`, les images `000.webp`… */
  dossier: string;
  nombre: number;
  /** Largeur et hauteur d'une image. */
  l: number;
  h: number;
};

/** Images par plan (une pièce qui descend), et images de l'approche finale. */
const PLAN = 36;
const APPROCHE = 20;
const NOMBRE = 6 * PLAN + APPROCHE + 1;

export const FILM_MONTRE: { bureau: SerieFilm; mobile: SerieFilm } = {
  bureau: { dossier: "/montre/film/bureau", nombre: NOMBRE, l: 810, h: 1440 },
  mobile: { dossier: "/montre/film/mobile", nombre: NOMBRE, l: 540, h: 960 },
};

/** La dernière image : la montre finie, vue de près (aussi l'image fixe, sans mouvement). */
export const DERNIERE_IMAGE = NOMBRE - 1;

/* Les huit temps de la section durent chacun 1/8 de la chronologie (scene-livre.tsx). Au temps 0, la vue éclatée
   attend. Aux temps 1 à 6, la pièce de l'étape descend entre 6 % et 55 % du temps, vite au début puis en se posant
   (comme dans la version Blender : J, 2026-10-21, « l'animation est trop lente, je dois trop scroller ») ; au temps 6,
   la caméra commence à s'approcher. Au temps 7, elle cadre la montre finie en grand. */
const S = 1 / 8;
const PIECE = { de: 0.06, a: 0.55 };
const APPROCHE_T = { de: 0.04, a: 0.8 };
const borne = (x: number) => Math.min(1, Math.max(0, x));

/** L'image (fractionnaire : on fond vers la suivante) pour une progression de 0 à 1. */
export function imageDuFilm(p: number) {
  const x = borne(p) / S;
  const k = Math.min(7, Math.floor(x));
  const q = x - k;
  if (k === 0) return 0;
  if (k <= 6) {
    const u = borne((q - PIECE.de) / (PIECE.a - PIECE.de));
    return (k - 1) * PLAN + PLAN * (1 - (1 - u) * (1 - u));
  }
  const u = borne((q - APPROCHE_T.de) / (APPROCHE_T.a - APPROCHE_T.de));
  return 6 * PLAN + APPROCHE * (u * u * (3 - 2 * u));
}

/** Les fenêtres de la chorégraphie (fractions de la chronologie). */
export const TEMPS_FILM = {
  // le fil d'or, l'axe sur lequel les pièces sont enfilées : il s'efface pendant que les bracelets s'accrochent
  fil: { de: 6 * S + 0.25 * S, a: 6 * S + 0.55 * S },
} as const;
