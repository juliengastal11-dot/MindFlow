/* ---------------------------------------------------------------------------
   Les mesures du plan commun du hero à la discussion (`Ciel`, `Plongee`),
   partagées par la page et par ce qui se pose sur lui : le bouton qui tombe
   (`components/ui/bouton-chute.tsx`) doit retrouver, sur l'écran, le point de
   l'image où il atterrit.
--------------------------------------------------------------------------- */

/** Largeur / hauteur des images entières du ciel (1924 × 1076 px). */
export const RAPPORT_CIEL = 1924 / 1076;

/** La série du téléphone, générée en vertical d'origine (Kling 9:16, 2026-10-17) : des images entières de 720 × 1274 px. */
export const RAPPORT_CIEL_MOBILE = 720 / 1274;

/** Le point de l'image entière où le bouton se pose : sur l'herbe, à droite de
    l'ordinateur (dernière image du ciel), en fractions de la largeur et de la
    hauteur de l'image. */
export const POSE_BOUTON = { x: 0.345, y: 0.412 } as const;

/** Le même point dans la série verticale du téléphone : sur l'herbe, à droite de l'ordinateur (qui est à x = 0,48, y = 0,39). */
export const POSE_BOUTON_MOBILE = { x: 0.53, y: 0.41 } as const;
