"""Mesure, pour chaque paire d'images voisines de la plongée, de combien l'image change : la différence moyenne des niveaux
de gris, sur une version réduite. Écrit un fichier TypeScript dans stalika/lib.

Pourquoi : la plongée avance d'une image tous les mêmes pixels de défilement, alors que la caméra va dix fois plus vite
au milieu qu'au début (de 1,3 à 13,7 de différence moyenne d'une image à la suivante). Le défilement est donc réparti
d'après ces valeurs (`Plongee`, option `rythme`) : ce qu'on voit avance au même pas, et les images ne « défilent » plus
l'une après l'autre au moment où l'on entre dans l'ordinateur.

À refaire si les images de la plongée changent :
  python -I -X utf8 outils/hero/rythme-plongee.py            la plongée paysage (public/hero/plongee, 200 × 112)  → lib/plongee-rythme.ts
  python -I -X utf8 outils/hero/rythme-plongee.py --mobile   la plongée verticale (public/hero/plongee-mobile, 112 × 200) → lib/plongee-rythme-mobile.ts
(Python, Pillow)
"""
import glob
import os
import sys

from PIL import Image, ImageChops, ImageStat

mobile = "--mobile" in sys.argv[1:]
ici = os.path.dirname(os.path.abspath(__file__))
racine = os.path.normpath(os.path.join(ici, "..", "..", "stalika"))
dossier = os.path.join(racine, "public", "hero", "plongee-mobile" if mobile else "plongee")
sortie = os.path.join(racine, "lib", "plongee-rythme-mobile.ts" if mobile else "plongee-rythme.ts")
nom = "RYTHME_PLONGEE_MOBILE" if mobile else "RYTHME_PLONGEE"
taille = (112, 200) if mobile else (200, 112)
dossier_public = "public/hero/plongee-mobile" if mobile else "public/hero/plongee"

fichiers = sorted(glob.glob(os.path.join(dossier, "*.webp")))
precedente = None
ecarts = []
for f in fichiers:
    im = Image.open(f).convert("L").resize(taille)
    if precedente is not None:
        ecarts.append(round(ImageStat.Stat(ImageChops.difference(im, precedente)).mean[0], 1))
    precedente = im

lignes = ",\n  ".join(", ".join(str(x) for x in ecarts[i : i + 10]) for i in range(0, len(ecarts), 10))
contenu = f"""/* De combien l'image change entre deux images voisines de la plongée ({dossier_public}/001 à {len(fichiers):03d}.webp) :
   {len(ecarts)} valeurs, la différence moyenne des niveaux de gris sur une version réduite de {taille[0]} × {taille[1]}.
   Mesuré par outils/hero/rythme-plongee.py. `Plongee` s'en sert pour répartir le défilement : voir son option `rythme`. */
export const {nom}: readonly number[] = [
  {lignes},
];
"""
with open(sortie, "w", encoding="utf-8", newline="\n") as f:
    f.write(contenu)
print(f"{len(fichiers)} images, {len(ecarts)} écarts (de {min(ecarts)} à {max(ecarts)}) écrits dans {sortie}")
