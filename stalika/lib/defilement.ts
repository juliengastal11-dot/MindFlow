import type Lenis from "lenis";

/* ---------------------------------------------------------------------------
   Le défilement fluide, partagé.

   `DefilementFluide` crée l'unique instance de Lenis du site et la dépose ici.
   Ce qui doit conduire le défilement lui-même (le bouton qui tombe emmène la
   page avec lui) la reprend d'ici plutôt que d'en créer une seconde. Vaut
   `null` tant que le défilement fluide n'est pas en place, et en mouvement
   réduit, où il n'existe pas : le défilement reste celui du navigateur.
--------------------------------------------------------------------------- */

let instance: Lenis | null = null;

export function poserDefilement(lenis: Lenis | null): void {
  instance = lenis;
}

export function defilement(): Lenis | null {
  return instance;
}
