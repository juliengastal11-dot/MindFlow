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
   par une table : la pièce d'une étape descend pendant que son texte se lit,
   puis la montre attend l'étape suivante ; à la fin, la caméra s'approche.
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
   attend ; aux temps 1 à 6, la pièce de l'étape descend de 6 % à 82 % du temps ; au temps 7, la caméra s'approche. */
const S = 1 / 8;
const CLES: [number, number][] = [[0, 0], [S, 0]];
for (let k = 1; k <= 6; k++) CLES.push([k * S + 0.06 * S, (k - 1) * PLAN], [k * S + 0.82 * S, k * PLAN]);
CLES.push([7 * S + 0.04 * S, 6 * PLAN], [1, NOMBRE - 1]);

/** L'image (fractionnaire : on fond vers la suivante) pour une progression de 0 à 1. */
export function imageDuFilm(p: number) {
  const x = Math.min(1, Math.max(0, p));
  for (let n = 1; n < CLES.length; n++) {
    const [p1, f1] = CLES[n];
    if (x <= p1) {
      const [p0, f0] = CLES[n - 1];
      return p1 === p0 ? f1 : f0 + ((x - p0) / (p1 - p0)) * (f1 - f0);
    }
  }
  return NOMBRE - 1;
}

/** Les fenêtres de la chorégraphie (fractions de la chronologie). */
export const TEMPS_FILM = {
  // le fil d'or, l'axe sur lequel les pièces sont enfilées : il s'efface pendant que les bracelets s'accrochent
  fil: { de: 6 * S + 0.5 * S, a: 6 * S + 0.85 * S },
} as const;
