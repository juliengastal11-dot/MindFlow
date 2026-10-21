# La montre en calques : chaque pièce découpée de la vue éclatée (k0.png) ou de la tête (k0b.png),
# remise à l'échelle du boîtier, toutes vues sous la même inclinaison (rapport des ellipses RAPPORT).
# Une image clé = une disposition de ces calques (dispositions.py).
import numpy as np
from PIL import Image
from outil import charge, ecrit, dilate, erode, flou, grain, L, H

K0 = charge("k0.png"); K0b = charge("tete_vide.png"); K1 = charge("k1.png")
P = np.load("plaque_K0.npy")
D0 = np.abs(K0 - P).max(-1)
D0b = np.abs(K0b - P).max(-1)
D1 = np.abs(K1 - P).max(-1)
yy, xx = np.mgrid[0:H, 0:L]

RAPPORT = 0.51          # l'inclinaison de la carrure (hauteur / largeur de son ellipse)
G = 0.88                # l'échelle de l'ensemble à l'écran
OY = 15                 # décalage vertical à l'écran
DY_TETE = 73            # la tête, de k0b à l'espace de dessin


def ellipse(cx, cy, rx, ry, epaisseur=0):
    m = np.zeros((H, L), bool)
    for e in range(0, epaisseur + 1, 2):
        m |= ((xx - cx) / rx) ** 2 + ((yy - cy - e) / ry) ** 2 <= 1
    return m


def calque(src, D, boite, T=22.0, plein=None, efface=None):
    x0, y0, x1, y1 = boite
    a = np.clip((D[y0:y1, x0:x1] - 5) / T, 0, 1)
    if plein is not None:
        a = np.maximum(a, flou(erode(plein, 1).astype(np.float32), 0.8)[y0:y1, x0:x1])
    if efface is not None:
        a = a * (1 - efface[y0:y1, x0:x1])
    rgb = src[y0:y1, x0:x1]; bg = P[y0:y1, x0:x1]
    aa = np.maximum(a[..., None], 0.03)
    C = np.where(a[..., None] > 0.03, (rgb - (1 - a[..., None]) * bg) / aa, rgb)
    return {"rgb": np.clip(C, 0, 255).astype(np.float32), "a": a.astype(np.float32), "boite": boite}


# --- les pièces de la vue éclatée ---------------------------------------------------------------
def _segment(p, q, r):
    px, py = p; qx, qy = q
    vx, vy = qx - px, qy - py
    t = np.clip(((xx - px) * vx + (yy - py) * vy) / (vx * vx + vy * vy), 0, 1)
    return np.hypot(xx - (px + t * vx), yy - (py + t * vy)) <= r


PIECES = {}
# le bracelet du haut : la version longue (générée d'après le bout de la vue éclatée), pour qu'il descende jusqu'aux cornes
_SL = np.asarray(Image.open("sangle_long.png").convert("RGB")).astype(np.float32)
_FL = np.load("fond_sangle.npy")
def _calque_long(x0, y0, x1, y1, T=22.0):
    a = np.clip((np.abs(_SL - _FL).max(-1)[y0:y1, x0:x1] - 5) / T, 0, 1)
    rgb = _SL[y0:y1, x0:x1]; bg = _FL[y0:y1, x0:x1]
    aa = np.maximum(a[..., None], 0.03)
    Cc = np.where(a[..., None] > 0.03, (rgb - (1 - a[..., None]) * bg) / aa, rgb)
    return {"rgb": np.clip(Cc, 0, 255).astype(np.float32), "a": a.astype(np.float32), "boite": (x0, y0, x1, y1)}
PIECES["sangle_h"] = _calque_long(470, 0, 1050, 2660)
_lun = ellipse(533, 235, 184, 68, 20)
PIECES["lunette"] = calque(K0, D0, (335, 160, 730, 330), efface=flou((~_lun).astype(np.float32), 0.8))
PIECES["verre"] = calque(K0, D0, (335, 322, 730, 466), T=40.0)
# les aiguilles : on retire la longue aiguille fine (une trotteuse centrale qui n'a rien à faire avec une petite seconde)
fine = _segment((448, 551), (702, 484), 3.2) & ~(np.hypot(xx - 532.5, yy - 512.5) <= 12)
fine |= np.hypot(xx - 532.5, yy - 529) <= 7.5
fine &= ~(np.hypot(xx - 532.5, yy - 512.5) <= 11)
PIECES["aiguilles"] = calque(K0, D0, (405, 455, 715, 545), efface=flou(dilate(fine, 1).astype(np.float32), 0.7))
PIECES["seconde"] = calque(K0, D0, (515, 545, 605, 580))
PIECES["cadran"] = calque(K0, D0, (325, 580, 745, 842), plein=ellipse(535, 705, 202, 119, 8))
PIECES["mouvement"] = calque(K0, D0, (335, 836, 737, 1114), plein=ellipse(535.5, 964, 192, 120, 22))
PIECES["fond"] = calque(K0, D0, (325, 1403, 740, 1590), T=30.0)
PIECES["sangle_b"] = calque(K0, D0, (405, 1591, 665, 1912))

# --- la tête (k0b : carrure vide), la couronne et sa tige (k1) -------------------------------------
mG = np.load("fg_G.npy")
from outil import deplace
mGt = deplace(mG.astype(np.float32) * 255, 1, 0, 20) > 127
cornes = ((xx >= 330) & (xx <= 385)) | ((xx >= 665) & (xx <= 720))
tete = dilate(mGt & (yy >= 1080) & (xx >= 270) & (xx <= 762) & ((yy <= 1396) | ((yy <= 1401) & cornes)), 3)
PIECES["carrure"] = calque(K0b, D0b, (270, 1070, 765, 1425), efface=(~tete).astype(np.float32))
# dans l'ouverture de la carrure vide, on voit le fond à travers : pas de voile gris
_ouv = ((xx - 531) / 150.0) ** 2 + ((yy - 1250) / 66.0) ** 2 <= 1
_x0, _y0, _x1, _y1 = PIECES["carrure"]["boite"]
_att = np.where(_ouv, np.clip((D0b - 16) / 14, 0, 1), 1)[_y0:_y1, _x0:_x1]
PIECES["carrure"]["a"] = PIECES["carrure"]["a"] * _att
PIECES["tige"] = calque(K1, D1, (762, 1215, 845, 1262))
PIECES["couronne"] = calque(K1, D1, (842, 1188, 905, 1300))

# Où chaque pièce est, dans sa source : centre de l'ellipse (ou point d'accroche), demi-axes.
SOURCE = {
    "sangle_h": dict(c=(760, 2620)),                       # c : le milieu de la barrette, en bas (sangle_long.png)
    "lunette": dict(c=(533, 235), rx=181, ry=65),
    "verre": dict(c=(532, 395), rx=184, ry=65),
    "aiguilles": dict(c=(532.5, 512.5)),                  # le canon
    "seconde": dict(c=(535, 565)),
    "cadran": dict(c=(535, 705), rx=203, ry=120),
    "mouvement": dict(c=(535.5, 964), rx=193.5, ry=121),
    "fond": dict(c=(531.5, 1497), rx=196.5, ry=92),
    "sangle_b": dict(c=(532, 1597), w=223),               # c : le milieu de la barrette, en haut
}
# Les échelles (sx, sy) de chaque pièce : sa vraie taille par rapport à la carrure, et l'inclinaison commune.
ECHELLE = {
    "cadran": (157 / 203, RAPPORT * 157 / 120),
    "mouvement": (155 / 193.5, RAPPORT * 155 / 121),
    "lunette": (200 / 181, RAPPORT * 200 / 65),
    "verre": (160 / 184, 74 / 65),
    "fond": (205 / 196.5, RAPPORT * 205 / 92),
    "sangle_h": (0.6, 0.6),
    "sangle_b": (285 / 223, 285 / 223),
}
ECHELLE["aiguilles"] = ECHELLE["cadran"]
ECHELLE["seconde"] = ECHELLE["cadran"]
for k in ("carrure", "tige", "couronne"):
    ECHELLE[k] = (1.0, 1.0)


def vers_ecran(xd, yd):
    return (xd - L / 2) * G + L / 2, yd * G + OY


def pose(nom, c_src, c_dessin, toile, clip=None, sx=None, sy=None, opacite=1.0):
    """Pose la pièce : son point c_src va en c_dessin (espace de dessin), à son échelle, puis l'échelle de l'écran."""
    p = PIECES[nom]
    if sx is None:
        sx, sy = ECHELLE[nom]
    x0, y0, x1, y1 = p["boite"]
    X, Y = vers_ecran(*c_dessin)
    ax, ay = sx * G, sy * G
    # écran -> source : xs = (xe - X)/ax + cx ; xs local = xs - x0
    inv = (1 / ax, 0, c_src[0] - X / ax - x0, 0, 1 / ay, c_src[1] - Y / ay - y0)
    pre = np.dstack([p["rgb"] * p["a"][..., None], p["a"] * 255]).astype(np.float32)
    canaux = []
    for k in range(4):
        im = Image.fromarray(pre[..., k], mode="F")
        canaux.append(np.asarray(im.transform((L, H), Image.AFFINE, inv, resample=Image.BICUBIC)))
    rgbp = np.dstack(canaux[:3]) * opacite; a = np.clip(canaux[3] / 255, 0, 1) * opacite
    if clip is not None:
        rgbp = rgbp * clip[..., None]; a = a * clip
    toile["rgb"] = rgbp + toile["rgb"] * (1 - a[..., None])
    toile["a"] = a + toile["a"] * (1 - a)


def toile_vide():
    return {"rgb": np.zeros((H, L, 3), np.float32), "a": np.zeros((H, L), np.float32)}


def sur_fond(toile, graine=7):
    fond = P + grain(P.shape, 1.2, graine)
    return toile["rgb"] + fond * (1 - toile["a"][..., None])
