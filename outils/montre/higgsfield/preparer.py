# Prépare tout ce dont les calques ont besoin, à partir des sources (dossier sources/) :
#   la vue éclatée de J à 1080 x 1920 (k0.png), son fond seul (plaque_K0.npy), les masques des pièces,
#   la tête vide et la tête avec son mouvement (tete_vide.png, k1.png, par tete.py), le bracelet long rallongé et son fond.
# python preparer.py   (depuis ce dossier ; Python 3 avec numpy et Pillow)
import os, shutil, subprocess, sys
import numpy as np
from PIL import Image
from outil import charge, modele_fond, plaque

SRC = "sources"
VUE = os.path.join("..", "Montre Stalika en éclaté luxueux.png")

# 1. la vue éclatée de J, aux dimensions du film
Image.open(VUE).convert("RGB").resize((1080, 1920), Image.LANCZOS).save("k0.png")
for nom in ("g1b.png", "e0.png", "sangle_long.png"):
    shutil.copy(os.path.join(SRC, nom), nom)

# 2. le fond (polynôme sur les marges) et le masque des pièces, pour la vue éclatée et les deux rendus de la tête
for nom, src in (("K0", "k0.png"), ("G", "g1b.png"), ("E", "e0.png")):
    a = charge(src)
    f = modele_fond(a, [(0, 0, 230, 1920), (1000, 0, 1080, 1920)])
    np.save(f"fond_{nom}.npy", f)
    np.save(f"fg_{nom}.npy", np.abs(a - f).max(-1) > 14)

# 3. le fond seul de la vue éclatée (le verre et la glace du fond comptent comme pièces)
K0 = charge("k0.png"); m = np.load("fg_K0.npy").copy()
yy, xx = np.mgrid[0:1920, 0:1080]
for (cx, cy, rx, ry) in ((530, 390, 215, 75), (530, 1500, 200, 95)):
    m |= ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
P, _ = plaque(K0, m, r=12, iters=4000)
np.save("plaque_K0.npy", P)

# 4. la tête : vide, et avec son mouvement
subprocess.run([sys.executable, "tete.py"], check=True)

# 5. le bracelet long, rallongé : couché dans le plan du cadran (vu en raccourci), il doit encore monter jusqu'en haut de
#    l'image une fois accroché. On répète deux fois un tronçon de ses écailles, raccordé là où deux rangées se ressemblent
#    le plus ; puis son fond (polynôme sur ses marges).
a = np.asarray(Image.open("sangle_long.png").convert("RGB")).astype(np.float32)
z = a[:, 540:980].mean(-1)
meilleur = None
for Lg in range(1040, 1110):
    for y1 in range(150, 420, 2):
        d = np.abs(z[y1 + Lg - 6: y1 + Lg + 6] - z[y1 - 6: y1 + 6]).mean()
        if meilleur is None or d < meilleur[0]:
            meilleur = (d, y1, Lg)
_, y1, Lg = meilleur
a = np.concatenate([a[y1: y1 + Lg], a[y1: y1 + Lg], a[y1:]], 0)
Image.fromarray(a.astype(np.uint8)).save("sangle_long_ext.png")
open("sangle_long_ext.txt", "w").write(str(2620 + 2 * Lg - y1))   # la barrette, dans l'image rallongée
h, w, _ = a.shape
ys, xs = np.mgrid[0:h:8, 0:w:8]
sel = (xs < 300) | (xs > 1220)
A = np.stack([np.ones(sel.sum()), xs[sel] / w, ys[sel] / h, (xs[sel] / w) ** 2, (xs[sel] / w) * (ys[sel] / h), (ys[sel] / h) ** 2], 1)
c, *_ = np.linalg.lstsq(A, a[::8, ::8][sel], rcond=None)
Y, X = np.mgrid[0:h, 0:w]
B = np.stack([np.ones_like(X, float), X / w, Y / h, (X / w) ** 2, (X / w) * (Y / h), (Y / h) ** 2], -1)
np.save("fond_sangle.npy", (B @ c).astype(np.float32))
print("prêt")
