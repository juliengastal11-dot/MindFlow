/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee-mobile/001 à 080.webp) :
   79 valeurs, la différence moyenne des niveaux de gris sur une version réduite de 112 × 200.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE_MOBILE: readonly number[] = [
  8.1, 8.2, 8.6, 9.3, 9.0, 9.4, 9.7, 10.4, 8.8, 10.8,
  9.9, 9.5, 11.5, 8.5, 12.0, 11.9, 9.0, 10.7, 10.9, 12.0,
  9.4, 11.5, 9.5, 13.0, 10.6, 10.6, 12.8, 9.3, 12.0, 10.7,
  10.8, 13.8, 11.1, 10.9, 10.9, 10.9, 10.9, 10.6, 10.3, 10.3,
  9.8, 11.3, 10.5, 8.2, 10.5, 11.1, 11.1, 11.3, 9.5, 10.1,
  13.2, 10.3, 10.8, 14.2, 10.8, 11.3, 11.6, 11.8, 11.7, 15.8,
  11.9, 12.0, 11.9, 11.5, 11.4, 11.3, 14.2, 10.4, 13.2, 9.4,
  11.7, 11.5, 10.8, 12.1, 10.2, 10.3, 10.4, 11.1, 10.8,
];
