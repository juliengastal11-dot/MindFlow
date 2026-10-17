"""Mesure, dans chaque image de la plongée, les coins de l'écran blanc de l'ordinateur : c'est là que la page pose le logo.
Écrit un fichier TypeScript du même format que stalika/lib/plongee-ecran.ts :
  [haut-gauche x, y, haut-droit x, y, bas-gauche x, y], en fractions de la largeur et de la hauteur de l'image ;
  `null` quand l'écran est trop petit pour qu'on y lise quoi que ce soit.

Comment : l'écran est la plus grande zone blanche et neutre (les nuages dorés sont chauds, pas blancs). On garde les pixels
très clairs et peu colorés, on prend la plus grande zone d'un seul tenant, et ses quatre coins sont ses points extrêmes le
long des diagonales. Les coins sont ensuite lissés sur trois images, comme pour la série d'origine.

Usage : python -I -X utf8 mesurer-ecran.py <dossier des images .webp ou .png> <fichier .ts à écrire> [nom de la constante] [--debug dossier]
"""
import glob
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

REDUCTION = 4          # on mesure sur une image réduite de ce facteur
LUMIERE_MIN = 215      # le plus sombre des canaux d'un pixel d'écran
COULEUR_MAX = 28       # écart maximal entre canaux : un écran blanc est neutre
SURFACE_MIN = 0.0012   # part minimale de l'image, sous laquelle l'écran ne sert à rien (null)


def plus_grande_zone(masque):
    """Les pixels de la plus grande zone d'un seul tenant d'un masque (parcours en largeur, sans bibliothèque)."""
    h, w = masque.shape
    vu = np.zeros_like(masque, dtype=bool)
    meilleure = []
    for y0 in range(h):
        for x0 in range(w):
            if not masque[y0, x0] or vu[y0, x0]:
                continue
            zone = []
            file = deque([(y0, x0)])
            vu[y0, x0] = True
            while file:
                y, x = file.popleft()
                zone.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and masque[yy, xx] and not vu[yy, xx]:
                        vu[yy, xx] = True
                        file.append((yy, xx))
            if len(zone) > len(meilleure):
                meilleure = zone
    return meilleure


def coins_de(zone, largeur, hauteur):
    pts = np.array(zone, dtype=float)  # (y, x)
    ys, xs = pts[:, 0], pts[:, 1]
    somme, diff = xs + ys, xs - ys
    hg = pts[np.argmin(somme)]
    hd = pts[np.argmax(diff)]
    bg = pts[np.argmin(diff)]
    # (x, y) en fractions ; +0,5 : le centre du pixel
    f = lambda p: ((p[1] + 0.5) / largeur, (p[0] + 0.5) / hauteur)
    return [*f(hg), *f(hd), *f(bg)]


def mesurer(chemin):
    im = Image.open(chemin).convert("RGB")
    pt = im.resize((im.width // REDUCTION, im.height // REDUCTION), Image.BILINEAR)
    a = np.asarray(pt).astype(int)
    masque = (a.min(axis=2) >= LUMIERE_MIN) & ((a.max(axis=2) - a.min(axis=2)) <= COULEUR_MAX)
    h, w = masque.shape
    if masque.sum() < SURFACE_MIN * w * h:
        return None, masque
    zone = plus_grande_zone(masque)
    if len(zone) < SURFACE_MIN * w * h:
        return None, masque
    return coins_de(zone, w, h), masque


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    debug = None
    if "--debug" in sys.argv:
        debug = sys.argv[sys.argv.index("--debug") + 1]
        args = [a for a in args if a != debug]
    dossier, sortie = args[0], args[1]
    nom = args[2] if len(args) > 2 else "ECRANS_PLONGEE_MOBILE"
    fichiers = sorted(glob.glob(os.path.join(dossier, "*.webp")) + glob.glob(os.path.join(dossier, "*.png")))
    brut = []
    for f in fichiers:
        coins, _ = mesurer(f)
        brut.append(coins)
    # lissage sur trois images (moyenne mobile des images voisines qui ont un écran)
    lisse = []
    for i, c in enumerate(brut):
        if c is None:
            lisse.append(None)
            continue
        voisins = [brut[j] for j in (i - 1, i, i + 1) if 0 <= j < len(brut) and brut[j] is not None]
        lisse.append([sum(v[k] for v in voisins) / len(voisins) for k in range(6)])
    lignes = []
    for c in lisse:
        lignes.append("  null," if c is None else "  [" + ", ".join(f"{x:.4f}" for x in c) + "],")
    contenu = f"""/* Coins de l'écran de l'ordinateur dans chaque image de la plongée verticale
   ({len(fichiers)} images), en fractions de la largeur et de la hauteur de l'image :
   [haut-gauche x, y, haut-droit x, y, bas-gauche x, y]. `null` : écran trop petit pour y lire quoi que ce soit.
   Mesurés par outils/hero/mesurer-ecran.py (la plus grande zone blanche et neutre, ses coins aux points extrêmes, lissés sur trois images). */
import type {{ CoinsEcran }} from "@/lib/plongee-ecran";

export const {nom}: readonly (CoinsEcran | null)[] = [
{chr(10).join(lignes)}
];
"""
    with open(sortie, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(contenu)
    avec = sum(1 for c in lisse if c is not None)
    print(f"{len(fichiers)} images, écran mesuré dans {avec} ; premier écran lisible : image {next((i + 1 for i, c in enumerate(lisse) if c), '-')}")
    if debug:
        os.makedirs(debug, exist_ok=True)
        for f, c in zip(fichiers, lisse):
            im = Image.open(f).convert("RGB")
            d = ImageDraw.Draw(im)
            if c:
                W, H = im.size
                hg, hd, bg = (c[0] * W, c[1] * H), (c[2] * W, c[3] * H), (c[4] * W, c[5] * H)
                br = (hd[0] + bg[0] - hg[0], hd[1] + bg[1] - hg[1])
                d.polygon([hg, hd, br, bg], outline=(255, 0, 255), width=max(2, W // 200))
                for p in (hg, hd, bg):
                    d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=(0, 255, 255))
            im.thumbnail((360, 640))
            im.save(os.path.join(debug, os.path.basename(f).rsplit(".", 1)[0] + ".jpg"), quality=80)


if __name__ == "__main__":
    main()
