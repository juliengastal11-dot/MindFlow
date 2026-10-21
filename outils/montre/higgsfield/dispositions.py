# Les images clés : les mêmes calques, posés autrement à chaque étape.
import sys
import numpy as np
from PIL import Image
import calques as C
from calques import pose, toile_vide, sur_fond, SOURCE, PIECES, vers_ecran
from outil import ecrit, flou, dilate, L, H

DY = C.DY_TETE
X0 = 531.0

# --- l'intérieur de la carrure (coordonnées de k0b) : sous le bord avant, la pièce posée est cachée ---------
yy, xx = C.yy, C.xx
vert = ((xx - 531) / 211.0) ** 2 + ((yy - 1218) / 108.0) ** 2 <= 1
voit = (np.abs(C.K0b - C.P).max(-1) < 10) & vert & (yy > 1215)
bas = np.full(L, np.nan)
for x in range(380, 684):
    r = np.where(voit[:, x])[0]
    if len(r):
        bas[x] = r.max()
ok = ~np.isnan(bas)
cx = np.arange(L)
coef = np.polyfit(cx[ok], bas[ok], 2)
b = np.polyval(coef, cx)
interieur_k0b = (yy <= b[None, :] + 0.5) & (((xx - 531) / 168.0) ** 2 + ((yy - 1240) / 100.0) ** 2 <= 1)


def masque_ecran(m_k0b):
    """Un masque en coordonnées de k0b, porté à l'écran avec la tête."""
    im = Image.fromarray((m_k0b * 255).astype(np.uint8))
    # écran -> k0b : xd = (xe - L/2)/G + L/2 ; yd = (ye - OY)/G ; yk = yd - DY
    g = C.G
    inv = (1 / g, 0, L / 2 - (L / 2) / g, 0, 1 / g, -C.OY / g - DY)
    return np.asarray(im.transform((L, H), Image.AFFINE, inv, resample=Image.BILINEAR)).astype(np.float32) / 255


INTERIEUR = flou(masque_ecran(interieur_k0b.astype(np.float32)), 0.6)


def ombre_interieure(toile_avant, toile_apres, cy_k0b, ry):
    """Assombrit le haut de la pièce posée (l'ombre de la paroi du fond de la carrure)."""
    return toile_apres


# --- les places ------------------------------------------------------------------------------------------
LIBRE = {   # flottant : (point de dessin) ; espace de dessin, avant l'échelle de l'écran
    "sangle_h": (X0, 192),
    "lunette": (X0, 330),
    "verre": (X0, 575),
    "aiguilles": (X0, 717),
    "cadran": (X0, 870),
    "mouvement": (X0, 1056),
    "fond": (X0, 1619),
    "sangle_b": (X0, 1746),
}
sxs, sys_ = C.ECHELLE["aiguilles"]
LIBRE["seconde"] = (X0 + (535 - 532.5) * sxs, 717 + (565 - 512.5) * sys_)
POSE = {    # posé dans la carrure : coordonnées de k0b, plus DY
    "mouvement": (530.5, 1250 + DY),
    "cadran": (530.5, 1240 + DY),
    "aiguilles": (530.5, 1238 + DY),
    "seconde": (530.5, 1240 + DY + (770 - 705) * sys_),
    "verre": (531, 1210 + DY),
    "lunette": (531, 1210 + DY),
    "fond": (531, 1272 + DY),
    "sangle_h": (531, 1126 + DY),
    "sangle_b": (531, 1352 + DY),
}
TIGE_K1 = ((762 + 845) / 2, (1215 + 1262) / 2)
COURONNE_K1 = ((842 + 905) / 2, (1188 + 1300) / 2)

ETAPES = [   # ce qui est posé à la fin de chaque étape
    set(),
    {"mouvement"},
    {"mouvement", "fond", "couronne"},
    {"mouvement", "fond", "couronne", "cadran"},
    {"mouvement", "fond", "couronne", "cadran", "aiguilles"},
    {"mouvement", "fond", "couronne", "cadran", "aiguilles", "verre", "lunette"},
    {"mouvement", "fond", "couronne", "cadran", "aiguilles", "verre", "lunette", "sangles"},
]


def image(k, sauf=()):
    """L'image clé k ; `sauf` : les pièces à laisser de côté (pour le fond fixe d'un plan)."""
    posees = ETAPES[k]
    t = toile_vide()

    def p(nom, *args, **kw):
        if nom not in sauf:
            pose(nom, *args, **kw)

    ici = lambda nom, groupe=None: POSE[nom] if (groupe or nom) in posees else LIBRE[nom]
    # derrière la tête : les bracelets et le fond, quand ils y sont accrochés
    for nom in ("sangle_h", "sangle_b"):
        if "sangles" in posees:
            p(nom, SOURCE[nom]["c"], ici(nom, "sangles"), t)
    if "fond" in posees:
        p("fond", SOURCE["fond"]["c"], POSE["fond"], t)
    # la tête, et sa couronne
    p("carrure", (0, 0), (0, DY), t)
    if "couronne" in posees:
        p("couronne", COURONNE_K1, (COURONNE_K1[0] - 80, COURONNE_K1[1] + DY), t)
    else:
        p("tige", TIGE_K1, (TIGE_K1[0], TIGE_K1[1] + DY), t)
        p("couronne", COURONNE_K1, (COURONNE_K1[0], COURONNE_K1[1] + DY), t)
    # dans la carrure, de bas en haut ; ce qui est posé est coupé par le bord avant
    for nom in ("mouvement", "cadran", "aiguilles", "seconde"):
        groupe = "aiguilles" if nom == "seconde" else nom
        if groupe in posees:
            p(nom, SOURCE[nom]["c"], POSE[nom], t, clip=INTERIEUR)
    if "verre" in posees:
        p("verre", SOURCE["verre"]["c"], POSE["verre"], t, opacite=0.45)
        p("lunette", SOURCE["lunette"]["c"], POSE["lunette"], t)
    # ce qui flotte encore, du bas de la pile vers le haut (le plus haut passe devant)
    if "fond" not in posees:
        p("fond", SOURCE["fond"]["c"], LIBRE["fond"], t)
    if "sangles" not in posees:
        p("sangle_b", SOURCE["sangle_b"]["c"], LIBRE["sangle_b"], t)
    for nom in ("mouvement", "cadran", "aiguilles", "seconde", "verre", "lunette"):
        groupe = "aiguilles" if nom == "seconde" else nom
        if groupe not in posees:
            p(nom, SOURCE[nom]["c"], LIBRE[nom], t)
    if "sangles" not in posees:
        p("sangle_h", SOURCE["sangle_h"]["c"], LIBRE["sangle_h"], t)
    return t


def piece(nom, ou):
    """Une pièce seule, à sa place de départ (\"libre\") ou d'arrivée (\"pose\"), à l'écran, sans coupe."""
    t = toile_vide()
    if nom in ("couronne", "tige"):
        c = COURONNE_K1 if nom == "couronne" else TIGE_K1
        dx = -80 if ou == "pose" else 0
        pose(nom, c, (c[0] + dx, c[1] + DY), t)
    else:
        pose(nom, SOURCE[nom]["c"], (LIBRE if ou == "libre" else POSE)[nom], t)
    return t


if __name__ == "__main__":
    ks = [int(a) for a in sys.argv[1:]] or list(range(7))
    for k in ks:
        t = image(k)
        ecrit(sur_fond(t), f"c{k}.png")
        a = np.clip(t["a"], 0, 1)
        c = np.where(a[..., None] > 0.003, t["rgb"] / np.maximum(a[..., None], 0.003), 0)
        np.save(f"c{k}_a.npy", a.astype(np.float16))
        np.save(f"c{k}_c.npy", np.clip(c, 0, 255).astype(np.uint8))
        print("c", k)
