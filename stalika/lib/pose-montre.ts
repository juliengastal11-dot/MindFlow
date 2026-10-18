/* ---------------------------------------------------------------------------
   La pose de la montre 3D (components/ui/montre-3d.tsx) : ce que la chronologie
   de la section 04 fait avancer, sans rien charger de Three.js. La section
   l'anime avec GSAP, la scène 3D la lit à chaque image qu'elle dessine.
--------------------------------------------------------------------------- */

export type PoseMontre = {
  /** Orientation de la montre, en degrés : `rx` négatif la penche vers l'arrière (on la voit d'au-dessus), `ry` la
      tourne (négatif : le côté de la couronne vient vers nous ; 180 : le fond). */
  rx: number;
  ry: number;
  rz: number;
  echelle: number;
  /** Les aiguilles et le compteur, en degrés dans le sens des aiguilles d'une montre, 0 = midi. */
  heures: number;
  minutes: number;
  chrono: number;
  compteur: number;
  /** La couronne enfoncée, de 0 à 1. */
  couronne: number;
  /** Les douze index (0 = midi), allumés de 0 à 1. */
  allumes: number[];
  /** Le mouvement, au dos : la rotation des roues et du balancier. */
  rouage: number;
  balancier: number;
  /** Posé par la scène 3D : la redessiner (elle ne dessine que sur demande). */
  redessiner?: () => void;
};

export function poseInitiale(): PoseMontre {
  return { rx: -24, ry: -24, rz: -8, echelle: 1, heures: -62, minutes: 62, chrono: 0, compteur: 0, couronne: 0, allumes: Array(12).fill(0), rouage: 0, balancier: 0 };
}

/** Le navigateur sait-il dessiner en WebGL 2 ? */
export function webglDisponible(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}
