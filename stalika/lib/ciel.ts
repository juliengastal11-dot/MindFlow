/* ---------------------------------------------------------------------------
   Les mesures du plan commun du hero à la discussion (`Ciel`, `Plongee`),
   partagées par la page et par ce qui se pose sur lui : le bouton qui tombe
   (`components/ui/bouton-chute.tsx`) doit retrouver, sur l'écran, le point de
   l'image où il atterrit.
--------------------------------------------------------------------------- */

/** Largeur / hauteur des images entières du ciel (1924 × 1076 px). */
export const RAPPORT_CIEL = 1924 / 1076;

/** La série mobile : 600 px de large pris à 277 px dans l'image de 1924. */
export const CADRAGE_MOBILE = { x: 277 / 1924, y: 0, l: 600 / 1924, h: 1 } as const;

/** Le point de l'image entière où le bouton se pose : sur l'herbe, à droite de
    l'ordinateur (dernière image du ciel), en fractions de la largeur et de la
    hauteur de l'image. */
export const POSE_BOUTON = { x: 0.345, y: 0.412 } as const;
