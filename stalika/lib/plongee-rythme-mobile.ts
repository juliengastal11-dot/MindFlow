/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee-mobile/001 à 120.webp) :
   119 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 112 × 200.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE_MOBILE: readonly number[] = [
  5.7, 5.8, 6.5, 6.4, 6.5, 6.1, 7.3, 6.3, 7.7, 7.0,
  6.1, 7.8, 6.8, 7.4, 7.6, 7.8, 8.5, 6.8, 8.9, 7.5,
  7.3, 9.9, 8.1, 8.3, 8.2, 5.5, 8.5, 8.4, 8.4, 8.9,
  9.1, 9.4, 6.3, 9.9, 10.2, 6.5, 10.8, 7.3, 11.5, 7.5,
  12.1, 7.8, 8.0, 8.4, 13.1, 8.2, 8.2, 13.1, 8.6, 8.6,
  9.2, 9.2, 9.5, 9.9, 10.9, 10.8, 11.2, 11.5, 11.7, 12.6,
  12.2, 12.7, 12.6, 12.6, 12.3, 12.2, 12.5, 12.6, 11.8, 11.7,
  11.7, 11.3, 11.0, 10.9, 11.4, 11.3, 11.8, 11.7, 11.3, 11.5,
  11.2, 10.9, 10.0, 9.8, 10.0, 9.4, 9.1, 8.9, 8.8, 8.5,
  8.2, 8.1, 7.9, 8.4, 8.2, 8.0, 7.6, 11.8, 7.0, 11.7,
  7.4, 12.1, 7.6, 12.8, 8.0, 8.1, 13.2, 7.8, 7.7, 12.7,
  7.7, 7.8, 12.6, 7.4, 11.7, 10.3, 8.9, 7.6, 7.3,
];
