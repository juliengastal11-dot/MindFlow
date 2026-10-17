/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee-mobile/001 à 120.webp) :
   119 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 112 × 200.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE_MOBILE: readonly number[] = [
  5.4, 4.8, 5.4, 4.9, 6.0, 5.2, 6.5, 5.8, 5.7, 5.7,
  5.8, 6.1, 6.1, 6.4, 6.5, 6.9, 6.7, 4.0, 6.7, 7.2,
  7.5, 4.5, 7.5, 7.0, 4.5, 7.8, 4.9, 9.0, 5.6, 5.7,
  5.9, 9.1, 5.3, 8.8, 4.8, 8.2, 5.3, 5.2, 9.3, 6.1,
  5.7, 9.2, 5.7, 5.5, 5.7, 9.7, 6.2, 6.3, 6.5, 6.5,
  10.6, 6.4, 6.3, 5.8, 5.6, 9.3, 5.8, 6.2, 6.7, 6.9,
  10.7, 6.9, 7.2, 7.0, 7.1, 7.4, 7.3, 7.0, 7.1, 7.5,
  7.5, 7.3, 7.5, 7.7, 7.7, 7.2, 7.1, 7.2, 7.2, 10.1,
  6.6, 6.4, 6.1, 5.9, 8.8, 5.4, 5.3, 8.3, 5.2, 8.7,
  5.4, 8.7, 5.4, 5.5, 8.8, 5.7, 5.9, 9.7, 6.4, 6.5,
  6.3, 6.3, 10.3, 6.4, 6.9, 7.0, 7.0, 6.7, 6.5, 6.7,
  11.3, 7.1, 7.1, 7.2, 7.0, 7.1, 7.2, 7.4, 7.5,
];
