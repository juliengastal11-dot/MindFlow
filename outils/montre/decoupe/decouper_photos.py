# Détoure les deux photos de la montre assemblée : de face, et de dos (le mouvement sous la glace saphir).
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from matte import *
from fond import modele_fond_libre

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(ICI, "..")
SORTIE_RACINE = os.path.join(ICI, "sortie")
PHOTOS = {"face": "Montre dorée STALIKA sur cuir noir.png", "dos": "Montre dorée à mouvement apparent.png"}
SORTIE = os.path.join(SORTIE_RACINE, "photos")
os.makedirs(SORTIE, exist_ok=True)
infos = {}
for nom, fichier in PHOTOS.items():
    C = np.asarray(Image.open(os.path.join(SOURCES, fichier)).convert("RGB")).astype(np.float32)
    H, W, _ = C.shape
    B, d = modele_fond_libre(C)
    # l'ombre portée du bracelet sur le fond : le fond assombri à l'identique sur les trois couleurs, ce n'est pas la
    # montre (le cuir noir est bien plus sombre, l'or et la doublure sont chauds)
    r = C / np.maximum(B, 1)
    ombre = (C.mean(-1) > 100) & (r.max(-1) < 1.12) & (r.min(-1) > 0.55) & (r.max(-1) - r.min(-1) < 0.05) & (C.max(-1) - C.min(-1) < 19)
    m = plus_grandes((d > 16) & ~ombre, 2000, garder=1)
    m = boucher(m)
    a, col = mater(C, B, m, choke=1)
    ys, xs = np.nonzero(a > 0.004)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8)[y0:y1, x0:x1], "RGBA").save(os.path.join(SORTIE, f"{nom}.png"))
    infos[nom] = {"x": int(x0), "y": int(y0), "l": int(x1 - x0), "h": int(y1 - y0)}
    sombre = np.zeros_like(C) + np.array([20, 17, 13], np.float32)
    sombre = sombre * (1 - a[..., None]) + col * a[..., None]
    Image.fromarray(np.clip(sombre, 0, 255).astype(np.uint8)).save(os.path.join(SORTIE_RACINE, f"verif-{nom}.png"))
    # la largeur du boîtier, rangée par rangée (pour caler la photo sur la pile de pièces)
    print(nom, infos[nom], "| fond médian", float(np.median(d[d < 9])))
json.dump(infos, open(os.path.join(SORTIE, "boites.json"), "w"), indent=1)
