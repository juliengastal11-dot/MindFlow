/* Les boîtes des images de la montre en photo (public/montre), en pixels de leur image d'origine (941 × 1672).
   Écrit par l'outil de découpe (outils/montre/decoupe/exporter.py) : ne pas modifier à la main. */

export type Boite = { x: number; y: number; l: number; h: number };

export const BOITES_PIECES = {
  "bracelet-haut": { x: 369, y: 6, l: 194, h: 130 },
  "barrette-haut": { x: 383, y: 123, l: 168, h: 24 },
  "lunette": { x: 307, y: 146, l: 314, h: 137 },
  "verre": { x: 299, y: 280, l: 329, h: 127 },
  "aiguilles": { x: 365, y: 394, l: 213, h: 63 },
  "petite-seconde": { x: 454, y: 478, l: 68, h: 27 },
  "cadran": { x: 290, y: 509, l: 352, h: 226 },
  "mouvement": { x: 299, y: 730, l: 335, h: 250 },
  "boitier": { x: 274, y: 970, l: 391, h: 252 },
  "couronne": { x: 663, y: 1055, l: 119, h: 66 },
  "fond": { x: 294, y: 1221, l: 339, h: 167 },
  "barrette-bas": { x: 377, y: 1379, l: 176, h: 28 },
  "bracelet-bas": { x: 369, y: 1402, l: 192, h: 257 },
} as const satisfies Record<string, Boite>;

export const BOITES_PHOTOS = {
  "trois-quarts": { x: 116, y: 0, l: 758, h: 1618 },
} as const satisfies Record<string, Boite>;
