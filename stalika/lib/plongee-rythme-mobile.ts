/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee-mobile/001 à 120.webp) :
   119 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 112 × 200.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE_MOBILE: readonly number[] = [
  6.1, 6.3, 6.0, 6.2, 6.0, 6.9, 6.6, 5.7, 7.5, 6.3,
  6.7, 6.9, 7.1, 7.5, 7.7, 6.2, 8.1, 6.8, 6.9, 7.5,
  7.5, 7.5, 9.5, 7.8, 8.3, 5.4, 8.7, 9.2, 9.1, 5.8,
  9.4, 9.7, 6.5, 9.5, 6.2, 9.5, 9.4, 6.1, 9.1, 9.2,
  5.9, 9.7, 6.7, 10.1, 10.3, 6.8, 6.9, 10.8, 7.5, 7.8,
  11.9, 8.6, 9.0, 9.3, 9.4, 9.0, 8.9, 13.2, 8.9, 9.0,
  9.1, 8.9, 8.3, 12.2, 8.3, 7.9, 7.8, 11.5, 7.3, 10.8,
  7.0, 10.9, 7.1, 7.2, 11.7, 7.3, 11.8, 7.4, 7.3, 11.4,
  7.1, 11.6, 7.2, 11.4, 7.2, 7.2, 11.8, 7.4, 11.9, 7.2,
  11.2, 6.7, 11.1, 7.0, 7.1, 11.9, 7.5, 12.0, 7.2, 7.0,
  11.0, 6.8, 10.8, 10.3, 6.1, 9.9, 9.9, 9.5, 5.6, 9.0,
  8.2, 9.9, 6.6, 8.0, 7.8, 7.0, 7.7, 8.0, 6.9,
];
