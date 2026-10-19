# Les bracelets de la vue éclatée, refaits d'après la photo de trois quarts (J, 2026-10-19 : « le bracelet change entre
# les deux vues au même moment, il faut le même tout le temps »). Le cuir et la boucle de la photo sont reportés dans la
# forme qu'ont les bracelets dans la pile, par la déformation même de la relève (releve.bin) : quand la montre se relève,
# ses bracelets ne changent que de forme, jamais d'aspect.
# Après python releve.py (la grille), avant python exporter.py. Les pièces sortent à 2 pixels par pixel d'éclaté.
import json, os, sys
import numpy as np
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import releve as RV

E = 2
# la place des bracelets une fois arrivés sur la carrure (lib/montre-photo.ts, PIECES_PHOTO : arrivee - origine)
ARRIVEE = {"bracelet-haut": (-4, 868), "bracelet-bas": (-3, -206)}
# où chercher chacun dans la pile (pixels d'éclaté)
ZONES = {"bracelet-haut": (330, 700, 600, 1000), "bracelet-bas": (330, 1190, 600, 1480)}

def lisse(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def masque_bracelets(X, Y, rgb, alpha):
    """Dans la photo (points d'éclaté X, Y) : ce qui est bracelet, sans la carrure, les cornes ni la lunette."""
    lum = rgb.mean(-1)
    dore = ((rgb[..., 0] - rgb[..., 2]) > 45) & (lum > 70)
    # le haut : au-dessus de la lunette (son bord extérieur), entre les cornes
    lunette = 1067 - 121 * np.sqrt(np.clip(1 - ((X - 462) / 182) ** 2, 0, 1))
    haut = (Y < lunette - 3) & ((Y < 932) | ((X > 381) & (X < 549))) & ~dore
    # le bas : sous le bord de la carrure (l'ombre entre elle et le cuir, assombrie par exporter.py), entre les cornes du
    # bas, puis tout ce qui est en dessous (passant, boucle) ; rien des cornes, même dans leur ombre
    # au ras de la carrure, seuls l'ombre et le cuir (sombres, sans or) en sont
    or_ou_clair = (Y < 1226) & ((((rgb[..., 0] - rgb[..., 2]) > 28) & (lum > 25)) | (lum > 115))
    bas = (Y > 1190) & ((Y >= 1262) | ((X > 362) & (X < 562) & ~or_ou_clair))
    return haut & (alpha > 0.02), bas & (alpha > 0.02)

def bas_de_la_carrure():
    """Le bas du boîtier de la vue éclatée (cornes resserrées), colonne par colonne : au-dessus, le bracelet du bas est caché
    par lui dans la pile ; on l'y coupe, pour que rien de la carrure de la photo ne reste à son bout."""
    b = json.load(open(os.path.join(ICI, "sortie", "eclate", "boites.json")))["boitier"]
    a = np.asarray(Image.open(os.path.join(ICI, "sortie", "eclate", "boitier.png")))[..., 3] > 128
    bas = {}
    for i in range(a.shape[1]):
        ys = np.nonzero(a[:, i])[0]
        if len(ys): bas[b["x"] + i] = b["y"] + ys.max() + 1
    return bas

def lire(P, X, Y):
    """P (H, W, 4), prémultiplié, lu en bilinéaire aux pixels (X, Y) ; hors image : transparent."""
    H, W = P.shape[:2]
    dehors = (X < -0.5) | (Y < -0.5) | (X > W - 0.5) | (Y > H - 0.5)
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001)
    x0 = X.astype(int); y0 = Y.astype(int)
    fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]
    c = P[y0, x0] * (1 - fx) * (1 - fy) + P[y0, x0 + 1] * fx * (1 - fy) + P[y0 + 1, x0] * (1 - fx) * fy + P[y0 + 1, x0 + 1] * fx * fy
    c[dehors] = 0
    return c

def main():
    # la photo, prémultipliée, avec ses deux masques de bracelets (adoucis d'un pixel)
    ph = np.asarray(Image.open(RV.PHOTO).convert("RGBA")).astype(np.float32) / 255
    hp, wp = ph.shape[:2]
    vv, uu = np.mgrid[0:hp, 0:wp].astype(np.float32)
    X = RV.PHOTO_X + (uu + 0.5) * RV.PHOTO_ECHELLE
    Y = RV.PHOTO_Y + (vv + 0.5) * RV.PHOTO_ECHELLE
    mh, mb = masque_bracelets(X, Y, ph[..., :3] * 255, ph[..., 3])
    def adoucir(m):
        m = m.astype(np.float32)
        return (m + np.roll(m, 1, 0) + np.roll(m, -1, 0) + np.roll(m, 1, 1) + np.roll(m, -1, 1)) / 5
    prem = ph.copy()
    prem[..., :3] *= prem[..., 3:4]
    masques = {"bracelet-haut": adoucir(mh), "bracelet-bas": adoucir(mb)}

    D = RV.grille_D()
    px = RV.ZL / (RV.NX - 1); py = RV.ZH / (RV.NY - 1)
    def champ(Xe, Ye):
        u = np.clip((Xe - RV.ZX) / px, 0, RV.NX - 1.001); v = np.clip((Ye - RV.ZY) / py, 0, RV.NY - 1.001)
        u0, v0 = u.astype(int), v.astype(int); fu, fv = (u - u0)[..., None], (v - v0)[..., None]
        return D[v0, u0] * (1 - fu) * (1 - fv) + D[v0, u0 + 1] * fu * (1 - fv) + D[v0 + 1, u0] * (1 - fu) * fv + D[v0 + 1, u0 + 1] * fu * fv

    boites = json.load(open(os.path.join(ICI, "sortie", "eclate", "boites.json")))
    for nom, (x0, y0, x1, y1) in ZONES.items():
        # chaque pixel de la pièce, dans la pile : son point dans la photo, par la déformation de la relève
        jj, ii = np.mgrid[0:(y1 - y0) * E, 0:(x1 - x0) * E].astype(np.float32)
        Xp = x0 + (ii + 0.5) / E
        Yp = y0 + (jj + 0.5) / E
        d = champ(Xp, Yp)
        Xb, Yb = Xp + d[..., 0], Yp + d[..., 1]
        U = (Xb - RV.PHOTO_X) / RV.PHOTO_ECHELLE - 0.5
        V = (Yb - RV.PHOTO_Y) / RV.PHOTO_ECHELLE - 0.5
        c = lire(prem, U, V)
        m = lire(masques[nom][..., None], U, V)[..., 0]
        c = c * m[..., None]
        if nom == "bracelet-bas":
            # coupé juste au-dessus du bas de la carrure : caché par elle dans la pile, net quand il arrive ; entre elle et
            # le cuir, là où la photo montre de l'or (ses cornes y sont plus larges), l'ombre sous la carrure
            bas = bas_de_la_carrure()
            xs = np.array(sorted(bas), np.float32)
            ys = np.convolve(np.array([bas[int(x)] for x in xs], np.float32), np.ones(5) / 5, mode="same")
            limite = np.interp(Xp[0], xs[2:-2], ys[2:-2]).astype(np.float32)[None, :] - 1.5
            sous = np.clip(Yp - limite, 0, 1)
            ombre = (Yp < limite + 30) & (Xp > 361) & (Xp < 566) & (Yb < 1230)
            fond = np.array([0.035, 0.028, 0.02, 1.0], np.float32)
            manque = np.clip(1 - c[..., 3], 0, 1) * ombre
            c = c + fond * manque[..., None]
            c = c * sous[..., None]
        a = c[..., 3]
        rgb = np.where((a > 1e-4)[..., None], c[..., :3] / np.maximum(a, 1e-4)[..., None], 0)
        # rognée, sur des pixels d'éclaté entiers
        ys, xs = np.nonzero(a > 0.004)
        r0, r1 = (ys.min() // E) * E, -(-(ys.max() + 1) // E) * E
        c0, c1 = (xs.min() // E) * E, -(-(xs.max() + 1) // E) * E
        img = np.dstack([rgb, a])[r0:r1, c0:c1]
        Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGBA").save(os.path.join(ICI, "sortie", "eclate", f"{nom}.png"))
        # sa boîte, à sa place d'origine dans la vue éclatée (la pile, moins le chemin de l'arrivée)
        dx, dy = ARRIVEE[nom]
        boites[nom] = {"x": int(x0 + c0 // E - dx), "y": int(y0 + r0 // E - dy), "l": int((c1 - c0) // E), "h": int((r1 - r0) // E)}
        print(nom, boites[nom])
    json.dump(boites, open(os.path.join(ICI, "sortie", "eclate", "boites.json"), "w"), indent=1)

if __name__ == "__main__":
    main()
