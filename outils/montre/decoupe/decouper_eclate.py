# Découpe la vue éclatée de J en pièces détourées (RGBA), à leur place dans l'image d'origine.
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from matte import *
from fond import modele_fond

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(ICI, "..")
SORTIE_RACINE = os.path.join(ICI, "sortie")
SRC = os.path.join(SOURCES, "Montre Stalika en éclaté luxueux.png")
SORTIE = os.path.join(SORTIE_RACINE, "eclate")
os.makedirs(SORTIE, exist_ok=True)
C = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
# le fond : un polynôme lisse ajusté sur les bandes de côté (fond.py), gardé en cache
cache = os.path.join(SORTIE_RACINE, "fond-eclate.npz")
if os.path.exists(cache):
    z = np.load(cache); B, d = z["B"].astype(np.float32), z["d"]
else:
    B, d = modele_fond(C); np.savez(cache, B=B, d=d)
    B = B.astype(np.float32)
H, W = d.shape
F = (H, W)

def rect(x0, y0, x1, y1):
    m = np.zeros(F, bool); m[y0:y1, x0:x1] = True; return m

chaud = (C[..., 0] - C[..., 2]) > 18

# les coupes entre pièces qui se frôlent
c_bracelet = courbe(d, 330, 610, 112, 136)
c_cadran = courbe(d, 280, 652, 700, 766)
c_mvt = courbe(d, 262, 664, 958, 995)
c_fond = courbe(d, 262, 664, 1203, 1243)
c_barrette = courbe(d, 360, 570, 1380, 1397)
c_bas = courbe(d, 360, 570, 1398, 1411)
dessus = lambda x0, c: sous_courbe(F, x0, c, dessous=False)
dessous = lambda x0, c: sous_courbe(F, x0, c, dessous=True)

pieces = {}

def opaque(nom, m, surface_min=400, garder=None, bouchage="tout", d_vrai_trou=None, surface_max=None, choke=1):
    m = plus_grandes(m, surface_min, garder)
    if bouchage == "tout": m = boucher(m)
    elif bouchage == "petits": m = boucher(m, d, surface_max=surface_max)
    elif bouchage == "vrais": m = boucher(m, d, d_vrai_trou=d_vrai_trou)
    a, col = mater(C, B, m, choke=choke)
    pieces[nom] = (a, col, m)
    return m

# 1. le haut du bracelet et sa barrette
opaque("bracelet-haut", rect(330, 0, 610, 140) & dessus(330, c_bracelet) & (d > 16), garder=1)
opaque("barrette-haut", rect(330, 100, 610, 146) & dessous(330, c_bracelet) & (d > 12), surface_min=40, choke=0)

# 2. la lunette (or) : l'anneau, son grand trou reste ouvert
z = rect(290, 136, 640, 300)
graine = plus_grandes(z & chaud & (d > 20), 400, garder=1)
lunette = opaque("lunette", z & (d > 18) & dilater(graine, 2), garder=1, bouchage="petits", surface_max=2500)

# 3. le verre : transparent, ses reflets
region_verre = ellipse(F, 463, 342, 164, 64.5) & ~dilater(lunette, 1)
a, col = mater_verre(C, B, region_verre, K=70)
pieces["verre"] = (a, col, region_verre)

# 4. les aiguilles des heures et des minutes (sans la trotteuse fine, absente de la montre assemblée)
yy, xx = np.mgrid[0:H, 0:W]
x1, y1, x2, y2 = 390, 479, 610, 422
t = np.clip(((xx - x1) * (x2 - x1) + (yy - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2), 0, 1)
dist = np.hypot(xx - (x1 + t * (x2 - x1)), yy - (y1 + t * (y2 - y1)))
trotteuse = (dist < 5) | ellipse(F, 463, 461, 10, 8)
opaque("aiguilles", rect(355, 396, 622, 470) & (d > 16) & ~trotteuse, surface_min=20, choke=0)
opaque("petite-seconde", rect(446, 474, 534, 508) & (d > 16), surface_min=20, choke=0)

# 5. le cadran (ses deux petits trous restent ouverts) et le mouvement (plein)
# le cadran est champagne, chaud ; le mouvement, sous lui, d'acier : la couleur les sépare là où ils se touchent
z = rect(280, 498, 652, 745)
cadran = plus_grandes(z & chaud & (d > 14), 400, garder=1)
cadran = opaque("cadran", z & (d > 14) & dilater(cadran, 1), garder=1, bouchage="vrais", d_vrai_trou=7)
opaque("mouvement", rect(280, 700, 652, 996) & ~dilater(cadran, 1) & dessus(262, c_mvt) & (d > 14), garder=1)

# 6. le boîtier (son grand trou reste ouvert), la couronne et sa tige
boitier = opaque("boitier", rect(262, 955, 664, 1245) & dessous(262, c_mvt) & dessus(262, c_fond) & (d > 16), garder=1,
                 bouchage="petits", surface_max=3000)
opaque("couronne", rect(664, 1040, 790, 1135) & (d > 14), surface_min=30)

# 7. le fond : l'anneau d'or opaque, sa glace saphir transparente
z = rect(285, 1205, 642, 1398) & dessous(262, c_fond) & dessus(360, c_barrette)
anneau = boucher(plus_grandes(z & (d > 16), 400, garder=1), d, surface_max=3000)
a1, col1 = mater(C, B, anneau)
# la glace : l'ouverture de l'anneau (son pourtour d'acier compris), où l'écart à sa couleur médiane devient le reflet
glace = ellipse(F, 465, 1297, 126, 56) & anneau
a1 = np.where(eroder(ellipse(F, 465, 1297, 124, 54), 0), 0.0, a1)
zone_glace = glace
B_glace = np.broadcast_to(np.median(C[glace], 0), C.shape).astype(np.float32)
a2, col2 = mater_verre(C, np.where(zone_glace[..., None], B_glace, B), zone_glace, K=90, gamma=1.1)
a1 = ronger(a1, 1)
a = np.maximum(a1, a2)
col = np.where((a1 >= a2)[..., None], col1, col2)
pieces["fond"] = (a, col, anneau | glace)

# 8. le bas : la barrette, le bracelet et sa boucle
opaque("barrette-bas", rect(360, 1376, 570, 1412) & dessous(360, c_barrette) & dessus(360, c_bas) & (d > 12), surface_min=30, choke=0)
# les jours de la boucle sont de vrais trous : on y voit le fond
opaque("bracelet-bas", rect(355, 1396, 575, H) & dessous(360, c_bas) & (d > 16), garder=1, bouchage="vrais", d_vrai_trou=18)

# les fichiers : chaque pièce rognée, et sa boîte dans l'image d'origine
infos = {}
pile_sombre = np.zeros((H, W, 3), np.float32) + np.array([20, 17, 13], np.float32)
for nom, (a, col, m) in pieces.items():
    ys, xs = np.nonzero(a > 0.004)
    y0, y1_, x0, x1_ = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([col, a * 255]).astype(np.uint8)[y0:y1_, x0:x1_]
    Image.fromarray(rgba, "RGBA").save(f"{SORTIE}/{nom}.png")
    infos[nom] = {"x": int(x0), "y": int(y0), "l": int(x1_ - x0), "h": int(y1_ - y0)}
    pile_sombre = pile_sombre * (1 - a[..., None]) + col * a[..., None]
    print(f"{nom:15s} x {x0:4d} y {y0:4d} {x1_ - x0:4d}x{y1_ - y0:<4d} alpha moyen {a[y0:y1_, x0:x1_].mean():.2f}")
json.dump(infos, open(f"{SORTIE}/boites.json", "w"), indent=1)
# pour vérifier d'un coup d'œil : toutes les pièces à leur place, sur un fond de nuit
Image.fromarray(np.clip(pile_sombre, 0, 255).astype(np.uint8)).save(os.path.join(SORTIE_RACINE, "verif-eclate.png"))
