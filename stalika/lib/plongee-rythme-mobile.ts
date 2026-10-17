/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee-mobile/001 à 120.webp) :
   119 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 112 × 200.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE_MOBILE: readonly number[] = [
  4.8, 4.5, 4.9, 5.2, 4.4, 5.6, 5.1, 5.0, 4.0, 5.5,
  5.6, 4.7, 4.8, 6.3, 5.0, 5.2, 5.3, 5.3, 5.6, 5.8,
  5.9, 6.1, 3.8, 6.4, 6.4, 4.2, 6.8, 7.2, 4.8, 4.6,
  7.4, 4.8, 7.5, 4.9, 5.0, 8.0, 5.3, 5.4, 8.7, 5.8,
  5.9, 5.7, 5.8, 5.8, 9.4, 6.2, 6.5, 6.5, 6.1, 6.0,
  6.2, 6.3, 6.0, 9.4, 6.1, 5.8, 5.9, 6.0, 6.1, 5.9,
  9.7, 6.7, 6.4, 6.5, 6.8, 7.0, 6.8, 6.9, 7.3, 7.6,
  7.5, 7.8, 8.3, 8.7, 8.6, 9.0, 9.3, 9.4, 9.0, 8.9,
  9.3, 9.2, 8.9, 9.0, 9.1, 8.9, 8.3, 8.1, 8.3, 8.3,
  7.9, 7.8, 7.7, 7.7, 7.3, 7.1, 7.0, 7.0, 6.7, 6.9,
  7.1, 7.2, 7.1, 7.3, 7.3, 7.4, 7.2, 7.4, 7.3, 7.2,
  7.0, 7.1, 7.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.6,
];
