/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee/001 à 061.webp) :
   60 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 200 × 112.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE: readonly number[] = [
  1.3, 1.4, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.0,
  2.0, 2.2, 2.4, 2.5, 2.5, 2.6, 2.8, 3.0, 3.2, 3.5,
  3.7, 4.0, 4.3, 4.7, 5.0, 5.5, 5.9, 6.5, 7.1, 7.8,
  8.3, 9.1, 9.4, 10.2, 10.9, 12.4, 13.3, 13.7, 11.2, 11.3,
  9.8, 9.8, 10.1, 9.9, 9.1, 8.6, 8.6, 9.1, 9.5, 9.6,
  9.1, 8.3, 8.3, 7.8, 7.5, 7.2, 6.7, 6.3, 5.6, 4.6,
];
