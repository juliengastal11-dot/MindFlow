# Exporte les pièces et les deux photos en WebP transparent dans le projet, et écrit leurs boîtes en TypeScript.
import json, os
import numpy as np
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "sortie")
PUBLIC = os.path.join(ICI, "..", "..", "..", "stalika", "public", "montre")
LIB = os.path.join(ICI, "..", "..", "..", "stalika", "lib", "montre-photo-boites.ts")
os.makedirs(f"{PUBLIC}/pieces", exist_ok=True)

def fondu(im, haut=None, bas=None):
    """Efface en douceur un bout coupé par le cadre de la photo d'origine (`haut` / `bas` : de, à, en pixels de l'image)."""
    a = np.asarray(im).astype(np.float32)
    h = a.shape[0]
    y = np.arange(h)[:, None]
    f = np.ones((h, 1), np.float32)
    if haut: f *= np.clip((y - haut[0]) / (haut[1] - haut[0]), 0, 1)
    if bas: f *= np.clip((bas[1] - y) / (bas[1] - bas[0]), 0, 1)
    f = f * f * (3 - 2 * f)
    a[..., 3] *= f
    return Image.fromarray(a.astype(np.uint8), "RGBA")

def ombre_sous_carrure(im, b):
    """La photo de trois quarts : le reflet clair et gris des cornes du bas contre le cuir du bracelet, assombri en une
    ombre. Le haut du bracelet du bas, refait d'après cette photo (bracelets.py), commence là : il n'y porte pas de tache
    claire, et la photo garde le même aspect quand la montre se relève."""
    a = np.asarray(im).astype(np.float32)
    s = 182 / 342  # la photo dans l'éclaté (lib/montre-photo.ts, PHOTO_TROIS_QUARTS)
    x0, y0 = 462 + (b["x"] - 461) * s, 1070 + (b["y"] - 652) * s
    h, w = a.shape[:2]
    vv, uu = np.mgrid[0:h, 0:w].astype(np.float32)
    X, Y = x0 + (uu + 0.5) * s, y0 + (vv + 0.5) * s
    # seul le reflet clair et gris des cornes contre le cuir s'éteint ; l'or de la carrure et des cornes reste
    lum = a[..., :3].mean(-1)
    t = np.clip((Y - 1219) / 6, 0, 1)
    f = 0.22 + 0.78 * t * t * (3 - 2 * t)
    zone = (Y > 1196) & (Y < 1226) & (X > 360) & (X < 565) & (lum > 95) & ((a[..., 0] - a[..., 2]) < 22)
    a[..., :3] = np.where(zone[..., None], a[..., :3] * f[..., None], a[..., :3])
    return Image.fromarray(a.astype(np.uint8), "RGBA")

taille = 0
boites = json.load(open(os.path.join(SORTIE, "eclate", "boites.json")))
for nom, b in boites.items():
    im = Image.open(os.path.join(SORTIE, "eclate", f"{nom}.png"))
    im.save(f"{PUBLIC}/pieces/{nom}.webp", quality=90, method=6)
    taille += os.path.getsize(f"{PUBLIC}/pieces/{nom}.webp")

# la page ne montre plus que la montre finie, de trois quarts (la face et le dos servaient au retournement, retiré le
# 2026-10-19 : J, « le retournement ne sert à rien finalement »)
photos = {k: v for k, v in json.load(open(os.path.join(SORTIE, "photos", "boites.json"))).items() if k == "trois-quarts"}
for nom, b in photos.items():
    im = Image.open(os.path.join(SORTIE, "photos", f"{nom}.png"))
    if nom == "dos":  # le bracelet sort du cadre en haut et en bas : il s'efface à la longueur du bracelet de face
        im = fondu(im, haut=(150 - b["y"], 330 - b["y"]), bas=(1380 - b["y"], 1560 - b["y"]))
    if nom == "trois-quarts":  # le bracelet du haut sort du cadre
        im = fondu(im, haut=(0, 150))
        im = ombre_sous_carrure(im, b)
    im.save(f"{PUBLIC}/{nom}.webp", quality=90, method=6)
    taille += os.path.getsize(f"{PUBLIC}/{nom}.webp")

print("total", round(taille / 1024), "Ko")
lignes = ["/* Les boîtes des images de la montre en photo (public/montre), en pixels de leur image d'origine (941 × 1672).",
          "   Écrit par l'outil de découpe (outils/montre/decoupe/exporter.py) : ne pas modifier à la main. */", "",
          "export type Boite = { x: number; y: number; l: number; h: number };", "",
          "export const BOITES_PIECES = {"]
for nom, b in boites.items():
    lignes.append(f'  "{nom}": {{ x: {b["x"]}, y: {b["y"]}, l: {b["l"]}, h: {b["h"]} }},')
lignes += ["} as const satisfies Record<string, Boite>;", "", "export const BOITES_PHOTOS = {"]
for nom, b in photos.items():
    lignes.append(f'  "{nom}": {{ x: {b["x"]}, y: {b["y"]}, l: {b["l"]}, h: {b["h"]} }},')
lignes += ["} as const satisfies Record<string, Boite>;", ""]
open(LIB, "w", encoding="utf-8", newline="\n").write("\n".join(lignes))
