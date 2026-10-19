/* La montre qui se relève (components/ui/montre-photo.tsx) : le morphing de la pile, photographiée dans la page au début
   de la relève (public/montre/releve-pile.webp), à la photo de trois quarts. Une grille de 71 × 129 sommets sur la toile ;
   pour chaque sommet, son déplacement de la pile à la photo (public/montre/releve.bin : Int16, x puis y, en 1/16 de pixel
   d'éclaté, rangée par rangée). Écrit par l'outil de découpe (outils/montre/decoupe/releve.py) : ne pas modifier à la main. */
import type { Zone } from "@/lib/morphing";

export const RELEVE: { zone: Zone; pile: Zone; grille: { nx: number; ny: number; fichier: string } } = {
  zone: { x: 250, y: 700, l: 490, h: 900 },
  pile: { x: 250, y: 850, l: 490, h: 630 },
  grille: { nx: 71, ny: 129, fichier: "/montre/releve.bin" },
};
