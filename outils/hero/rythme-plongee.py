"""Mesure, pour chaque paire d'images voisines de la plongée (stalika/public/hero/plongee), de combien l'image change :
la différence moyenne des niveaux de gris, sur une version réduite (200 × 112). Écrit stalika/lib/plongee-rythme.ts.

Pourquoi : la plongée avance d'une image tous les mêmes pixels de défilement, alors que la caméra va dix fois plus vite
au milieu qu'au début (de 1,3 à 13,7 de différence moyenne d'une image à la suivante). Le défilement est donc réparti
d'après ces valeurs (`Plongee`, option `rythme`) : ce qu'on voit avance au même pas, et les images ne « défilent » plus
l'une après l'autre au moment où l'on entre dans l'ordinateur.

À refaire si les images de la plongée changent :   python outils/hero/rythme-plongee.py   (Python, Pillow)
"""
import glob
import os

from PIL import Image, ImageChops, ImageStat

ici = os.path.dirname(os.path.abspath(__file__))
dossier = os.path.normpath(os.path.join(ici, "..", "..", "stalika", "public", "hero", "plongee"))
sortie = os.path.normpath(os.path.join(ici, "..", "..", "stalika", "lib", "plongee-rythme.ts"))

fichiers = sorted(glob.glob(os.path.join(dossier, "*.webp")))
precedente = None
ecarts = []
for f in fichiers:
    im = Image.open(f).convert("L").resize((200, 112))
    if precedente is not None:
        ecarts.append(round(ImageStat.Stat(ImageChops.difference(im, precedente)).mean[0], 1))
    precedente = im

lignes = ",\n  ".join(", ".join(str(x) for x in ecarts[i : i + 10]) for i in range(0, len(ecarts), 10))
contenu = f"""/* De combien l'image change entre deux images voisines de la plongée (public/hero/plongee/001 à {len(fichiers):03d}.webp) :
   {len(ecarts)} valeurs, la différence moyenne des niveaux de gris sur une version réduite de 200 × 112.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const RYTHME_PLONGEE: readonly number[] = [
  {lignes},
];
"""
with open(sortie, "w", encoding="utf-8", newline="\n") as f:
    f.write(contenu)
print(f"{len(fichiers)} images, {len(ecarts)} écarts (de {min(ecarts)} à {max(ecarts)}) écrits dans {sortie}")
