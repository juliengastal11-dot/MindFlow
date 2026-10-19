/* ---------------------------------------------------------------------------
   La montre qui se fabrique, en images (2026-10-20). La section 04 joue une
   séquence rendue dans Blender (outils/montre/blender) : une vraie montre en
   trois dimensions, ses pièces enfilées sur l'axe du cadran, qui redescendent
   une à une pendant les étapes du texte, puis la montre finie que la caméra
   vient voir de plus près. Chaque image est un rendu complet de la même
   montre : rien ne se fond, rien ne change de forme. La séquence suit la
   chronologie de la section (components/ui/montre-film.tsx), image par image,
   avec un fondu entre deux images voisines pour que le défilement reste lisse.
--------------------------------------------------------------------------- */

export type SerieFilm = {
  /** Le dossier sous `public`, les images `000.webp`… */
  dossier: string;
  nombre: number;
  /** Largeur et hauteur d'une image. */
  l: number;
  h: number;
};

export const FILM_MONTRE: { bureau: SerieFilm; mobile: SerieFilm } = {
  bureau: { dossier: "/montre/film/bureau", nombre: 180, l: 810, h: 1440 },
  mobile: { dossier: "/montre/film/mobile", nombre: 180, l: 540, h: 960 },
};

/** Les fenêtres de la chorégraphie (fractions de la chronologie), les mêmes que dans le rendu (montre.py). */
export const TEMPS_FILM = {
  // le fil d'or, l'axe sur lequel les pièces sont enfilées : il s'efface quand les bracelets sont posés
  fil: { de: 6 / 8 + 0.5 / 8, a: 6 / 8 + 0.8 / 8 },
} as const;
