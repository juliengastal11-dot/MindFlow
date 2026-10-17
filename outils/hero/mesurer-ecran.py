"""Mesure, dans chaque image de la plongée, les coins de l'écran blanc de l'ordinateur : c'est là que la page colle le bureau
du Mac (`EcranMac`). Écrit un fichier TypeScript du même format que stalika/lib/plongee-ecran.ts :
  [haut-gauche x, y, haut-droit x, y, bas-gauche x, y, bas-droit x, y], en fractions de la largeur et de la hauteur de l'image
  (le quatrième coin sert à poser le bureau en perspective : l'écran, vu de biais, n'est pas un parallélogramme) ;
  `null` quand l'écran est trop petit pour qu'on y lise quoi que ce soit.
Et, dans le même fichier, ce que cache l'épaule du personnage (CACHES_…) : dans le repère de l'écran (u de gauche à droite,
v de haut en bas, de 0 à 1), pour 33 rangées v = 0,01 à 0,99, jusqu'où l'écran est caché depuis son bord gauche. La page
découpe le bureau à cette limite : l'épaule passe devant l'écran, pas derrière le bureau.

Comment : l'écran est la plus grande zone blanche et neutre (les nuages dorés sont chauds, pas blancs). On garde les pixels
très clairs et peu colorés, on prend la plus grande zone d'un seul tenant, et chacun de ses bords est ajusté par une droite,
sur une partie que rien ne cache ; les coins sont aux croisements. Ils sont ensuite lissés sur trois images. La part cachée se
lit ensuite rangée par rangée, sur l'image en pleine taille : du bord gauche jusqu'au premier pixel d'écran.

Usage : python -I -X utf8 mesurer-ecran.py <dossier des images .webp ou .png> <fichier .ts à écrire> [nom de la constante]
         [--debug dossier] [--lumiere 215] [--couleur 28] [--graines <fichier .ts de coins>]
  --lumiere, --couleur : l'écran de la série verticale est blanc ; celui de la série de l'ordinateur (Kling) est crème
    (225, 204, 177) : --lumiere 160 --couleur 62.
  --graines : des coins déjà mesurés (même format, six ou huit valeurs) ; on garde alors la zone qui contient le centre de
    leur quadrilatère plutôt que la plus grande (les nuages crème, plus grands, s'y confondraient). Une image sans graine
    reste `null`.
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


def zone_de(masque, graine):
    """La zone d'un seul tenant qui contient la graine (y, x), ou le pixel du masque le plus proche d'elle."""
    h, w = masque.shape
    gy, gx = graine
    if not masque[gy, gx]:
        ys, xs = np.nonzero(masque)
        if len(ys) == 0:
            return []
        k = int(np.argmin((ys - gy) ** 2 + (xs - gx) ** 2))
        gy, gx = int(ys[k]), int(xs[k])
    vu = np.zeros_like(masque, dtype=bool)
    zone = []
    file = deque([(gy, gx)])
    vu[gy, gx] = True
    while file:
        y, x = file.popleft()
        zone.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and masque[yy, xx] and not vu[yy, xx]:
                vu[yy, xx] = True
                file.append((yy, xx))
    return zone


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


def droite(t, u):
    """u = a·t + b, ajustée aux moindres carrés puis une seconde fois sans les points à plus de 1,5 px (un doigt, un reflet)."""
    a, b = np.polyfit(t, u, 1)
    garde = np.abs(u - (a * t + b)) <= 1.5
    if garde.sum() >= 4:
        a, b = np.polyfit(t[garde], u[garde], 1)
    return a, b


def coins_de(zone, largeur, hauteur):
    """Les quatre coins aux croisements des quatre bords, chaque bord ajusté par une droite sur sa partie centrale : un coin
    caché (une épaule) ou rogné ne fausse rien, contrairement aux points extrêmes de la zone."""
    pts = np.array(zone, dtype=int)  # (y, x)
    ys, xs = pts[:, 0], pts[:, 1]
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    haut, bas, gauche, droite_ = {}, {}, {}, {}
    for y, x in zip(ys, xs):
        haut[x] = min(haut.get(x, y), y)
        bas[x] = max(bas.get(x, y), y)
        gauche[y] = min(gauche.get(y, x), x)
        droite_[y] = max(droite_.get(y, x), x)
    def bord(d, de, a):
        cles = np.array([k for k in d if de <= k <= a], dtype=float)
        return cles, np.array([d[int(k)] for k in cles], dtype=float)
    # Chaque bord sur une partie loin des coins. La tête du personnage, par-dessus son épaule, cache le bas-gauche de l'écran
    # sur une vingtaine d'images : le bord gauche se lit donc dans le haut de l'écran, et le bord bas dans sa moitié droite.
    lx, ly = x1 - x0, y1 - y0
    try:
        ah, bh = droite(*bord(haut, x0 + 0.2 * lx, x1 - 0.2 * lx))      # y = ah·x + bh
        ab, bb = droite(*bord(bas, x0 + 0.5 * lx, x1 - 0.12 * lx))
        ag, bgc = droite(*bord(gauche, y0 + 0.12 * ly, y0 + 0.4 * ly))   # x = ag·y + bgc
        ad, bdc = droite(*bord(droite_, y0 + 0.2 * ly, y1 - 0.2 * ly))
    except (TypeError, ValueError, np.linalg.LinAlgError):
        return None
    def croise(a_h, b_h, a_v, b_v):
        # y = a_h·x + b_h et x = a_v·y + b_v
        y = (a_h * b_v + b_h) / (1 - a_h * a_v)
        return a_v * y + b_v, y
    # (x, y) en fractions ; +0,5 : le centre du pixel
    f = lambda p: ((p[0] + 0.5) / largeur, (p[1] + 0.5) / hauteur)
    hg = croise(ah, bh, ag, bgc)
    hd = croise(ah, bh, ad, bdc)
    bgauche = croise(ab, bb, ag, bgc)
    bdroit = croise(ab, bb, ad, bdc)
    return [*f(hg), *f(hd), *f(bgauche), *f(bdroit)]


def mesurer(chemin, graine=None):
    """Les coins de l'écran dans une image ; `graine` (x, y en fractions) : un point de l'écran, si on le connaît."""
    im = Image.open(chemin).convert("RGB")
    pt = im.resize((im.width // REDUCTION, im.height // REDUCTION), Image.BILINEAR)
    a = np.asarray(pt).astype(int)
    masque = (a.min(axis=2) >= LUMIERE_MIN) & ((a.max(axis=2) - a.min(axis=2)) <= COULEUR_MAX)
    h, w = masque.shape
    if masque.sum() < SURFACE_MIN * w * h:
        return None, masque
    if graine:
        zone = zone_de(masque, (min(h - 1, int(graine[1] * h)), min(w - 1, int(graine[0] * w))))
    else:
        zone = plus_grande_zone(masque)
    if len(zone) < SURFACE_MIN * w * h:
        return None, masque
    return coins_de(zone, w, h), masque


RANGEES = 33  # rangées où se lit la part cachée de l'écran, de v = 0,01 à 0,99


def homographie(q):
    """Du carré unité (u, v) à l'image, en fractions : les quatre coins [hg, hd, bg, bd]."""
    x0, y0, x1, y1, x3, y3, x2, y2 = q
    dx1, dx2, dx3 = x1 - x2, x3 - x2, x0 - x1 + x2 - x3
    dy1, dy2, dy3 = y1 - y2, y3 - y2, y0 - y1 + y2 - y3
    den = dx1 * dy2 - dx2 * dy1
    g = (dx3 * dy2 - dx2 * dy3) / den
    h = (dx1 * dy3 - dx3 * dy1) / den
    a, b, c = x1 - x0 + g * x1, x3 - x0 + h * x3, x0
    d, e, f = y1 - y0 + g * y1, y3 - y0 + h * y3, y0
    return lambda u, v: ((a * u + b * v + c) / (g * u + h * v + 1), (d * u + e * v + f) / (g * u + h * v + 1))


def cache(chemin, q):
    """Pour chaque rangée de l'écran, jusqu'où il est caché depuis son bord gauche (0 : rien ne le cache)."""
    im = np.asarray(Image.open(chemin).convert("RGB")).astype(int)
    hauteur, largeur = im.shape[:2]
    vers = homographie(q)
    u = np.arange(0.002, 0.7, 0.002)
    limites = []
    for k in range(RANGEES):
        v = 0.01 + 0.98 * k / (RANGEES - 1)
        x, y = vers(u, np.full_like(u, v))
        px = im[np.clip((y * hauteur).astype(int), 0, hauteur - 1), np.clip((x * largeur).astype(int), 0, largeur - 1)]
        blanc = (px.min(axis=1) >= LUMIERE_MIN - 25) & ((px.max(axis=1) - px.min(axis=1)) <= COULEUR_MAX + 12)
        # le premier pixel d'écran : blanc, et les deux suivants aussi (un reflet isolé ne compte pas)
        sur = blanc[:-2] & blanc[1:-1] & blanc[2:]
        i = int(np.argmax(sur)) if sur.any() else len(u) - 3
        limites.append(float(u[i]))
    # une rangée isolée ne fait pas une épaule (médiane sur trois rangées : en haut, les trois premières, ce qui écarte les
    # pastilles d'une fenêtre ; en bas, la dernière compte double), et le liseré du bord de l'écran non plus
    def voisines(k):
        if k == 0:
            return limites[0:3]
        if k == RANGEES - 1:
            return [limites[-2], limites[-1], limites[-1]]
        return limites[k - 1:k + 2]
    lisse = [float(np.median(voisines(k))) for k in range(RANGEES)]
    return [x if x >= 0.012 else 0.0 for x in lisse]


def lire_coins(chemin):
    """Les coins d'un fichier .ts du même format (six ou huit valeurs, ou null), image par image."""
    import re
    lignes = [l.strip().rstrip(",") for l in open(chemin, encoding="utf-8") if re.match(r"\s+(null,?$|\[[0-9])", l)]
    return [None if l.startswith("null") else [float(x) for x in l.strip("[]").split(",")] for l in lignes]


def main():
    global LUMIERE_MIN, COULEUR_MAX
    options = {}
    for nom in ("--debug", "--lumiere", "--couleur", "--graines"):
        if nom in sys.argv:
            options[nom] = sys.argv[sys.argv.index(nom) + 1]
    args = [a for a in sys.argv[1:] if not a.startswith("--") and a not in options.values()]
    debug = options.get("--debug")
    LUMIERE_MIN = int(options.get("--lumiere", LUMIERE_MIN))
    COULEUR_MAX = int(options.get("--couleur", COULEUR_MAX))
    graines = None
    if "--graines" in options:
        graines = []
        for c in lire_coins(options["--graines"]):
            if c is None:
                graines.append(None)
                continue
            # le centre du quadrilatère (le quatrième coin, s'il manque, en parallélogramme)
            bd = (c[6], c[7]) if len(c) == 8 else (c[2] + c[4] - c[0], c[3] + c[5] - c[1])
            graines.append(((c[0] + c[2] + c[4] + bd[0]) / 4, (c[1] + c[3] + c[5] + bd[1]) / 4))
    dossier, sortie = args[0], args[1]
    nom = args[2] if len(args) > 2 else "ECRANS_PLONGEE_MOBILE"
    fichiers = sorted(glob.glob(os.path.join(dossier, "*.webp")) + glob.glob(os.path.join(dossier, "*.png")))
    brut = []
    for i, f in enumerate(fichiers):
        if graines is not None and (i >= len(graines) or graines[i] is None):
            brut.append(None)
            continue
        coins, _ = mesurer(f, graines[i] if graines is not None else None)
        brut.append(coins)
    # lissage sur trois images (moyenne mobile des images voisines qui ont un écran)
    lisse = []
    for i, c in enumerate(brut):
        if c is None:
            lisse.append(None)
            continue
        voisins = [brut[j] for j in (i - 1, i, i + 1) if 0 <= j < len(brut) and brut[j] is not None]
        lisse.append([sum(v[k] for v in voisins) / len(voisins) for k in range(8)])
    lignes = []
    for c in lisse:
        lignes.append("  null," if c is None else "  [" + ", ".join(f"{x:.4f}" for x in c) + "],")
    # La part cachée par l'épaule, mesurée avec les coins lissés (ceux que la page utilise), puis lissée sur trois images.
    brut_caches = [cache(f, c) if c else None for f, c in zip(fichiers, lisse)]
    caches = []
    for i, c in enumerate(brut_caches):
        if c is None:
            caches.append(None)
            continue
        voisins = [brut_caches[j] for j in (i - 1, i, i + 1) if 0 <= j < len(brut_caches) and brut_caches[j] is not None]
        moyenne = [sum(v[k] for v in voisins) / len(voisins) for k in range(RANGEES)]
        caches.append(moyenne if max(moyenne) >= 0.012 else None)
    lignes_caches = [
        "  null," if c is None else "  [" + ", ".join(f"{x:.3f}".rstrip("0").rstrip(".") if x else "0" for x in c) + "],"
        for c in caches
    ]
    nom_caches = nom.replace("ECRANS", "CACHES") if "ECRANS" in nom else nom + "_CACHES"
    contenu = f"""/* Coins de l'écran de l'ordinateur dans chaque image de la plongée
   ({os.path.basename(os.path.normpath(dossier))}, {len(fichiers)} images), en fractions de la largeur et de la hauteur de l'image :
   [haut-gauche x, y, haut-droit x, y, bas-gauche x, y, bas-droit x, y]. `null` : écran trop petit pour y lire quoi que ce soit.
   Mesurés par outils/hero/mesurer-ecran.py (la plus grande zone blanche et neutre, chaque bord ajusté par une droite sur une
   partie que rien ne cache, les coins à leurs croisements, lissés sur trois images). */
import type {{ CacheEcran, CoinsEcran }} from "@/lib/plongee-ecran";

export const {nom}: readonly (CoinsEcran | null)[] = [
{chr(10).join(lignes)}
];

/* Ce que cache l'épaule du personnage, image par image : pour {RANGEES} rangées de l'écran (v = 0,01 à 0,99, de haut en bas),
   jusqu'où il est caché depuis son bord gauche, en part de sa largeur (0 : rien). `null` : rien ne le cache. */
export const {nom_caches}: readonly (CacheEcran | null)[] = [
{chr(10).join(lignes_caches)}
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
                br = (c[6] * W, c[7] * H)
                d.polygon([hg, hd, br, bg], outline=(255, 0, 255), width=max(2, W // 200))
                for p in (hg, hd, bg):
                    d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=(0, 255, 255))
            im.thumbnail((360, 640))
            im.save(os.path.join(debug, os.path.basename(f).rsplit(".", 1)[0] + ".jpg"), quality=80)


if __name__ == "__main__":
    main()
