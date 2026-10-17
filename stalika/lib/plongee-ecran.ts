/* Les mesures de l'écran de l'ordinateur dans les images de la plongée, où `Plongee` colle le bureau du Mac. Les données
   sont à côté, une série par fichier, écrites par outils/hero/mesurer-ecran.py : plongee-ecran-bureau.ts (la série de
   l'ordinateur, Kling, dont l'écran crème montre un navigateur : on en prend tout l'écran) et plongee-ecran-mobile.ts (la
   série verticale du téléphone, MiniMax). */

/** [haut-gauche x, y, haut-droit x, y, bas-gauche x, y], et parfois le bas-droit (x, y) : sans lui, l'écran est pris pour un
    parallélogramme ; avec lui, il est vu en perspective (la série verticale du téléphone, mesurée le 2026-10-17). */
export type CoinsEcran =
  | readonly [number, number, number, number, number, number]
  | readonly [number, number, number, number, number, number, number, number];

/** Ce qui cache l'écran (l'épaule du personnage) : pour des rangées régulières de l'écran, de haut en bas, jusqu'où il est
    caché depuis son bord gauche, en part de sa largeur (0 : rien). Mesuré par outils/hero/mesurer-ecran.py. */
export type CacheEcran = readonly number[];
