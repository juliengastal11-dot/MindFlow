# Le détourage d'une image du film : le fond est la plaque grise connue (plaque_K0.npy), la montre est ce qui s'en écarte.
# Les petites plages d'acier qui ont la couleur du fond sont des trous enclos dans la pièce : on les rebouche ; les grands
# intérieurs (la lunette, le verre, l'ouverture de la carrure, où l'on voit à travers) restent transparents.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

P = np.load("plaque_K0.npy").astype(np.float32)
H, L = P.shape[:2]


def _f(m, f, r):
    im = Image.fromarray((m > 0.5).astype(np.uint8) * 255)
    return np.asarray(im.filter(f(2 * r + 1))) > 127


def fond_local(img, flou, case=16, iters=400):
    """Le fond de cette image : la plaque, plus l'écart lisse que le modèle vidéo y a mis (lumière, teinte)."""
    d0 = np.abs(flou - P).max(-1)
    g = np.asarray(Image.fromarray(np.clip(flou.mean(-1), 0, 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)).astype(np.float32)
    sur = (d0 < 30) & (g < 6) & ~_f(d0 > 40, ImageFilter.MaxFilter, 6)
    r = (flou - P) * sur[..., None]
    h, l = H // case, L // case
    somme = r[: h * case, : l * case].reshape(h, case, l, case, 3).sum((1, 3))
    n = sur[: h * case, : l * case].reshape(h, case, l, case).sum((1, 3))
    connu = n > case * case * 0.3
    m = np.where(connu[..., None], somme / np.maximum(n, 1)[..., None], 0)
    m[~connu] = m[connu].mean(0) if connu.any() else 0
    for _ in range(iters):
        q = m.copy()
        q[1:-1, 1:-1] = 0.25 * (m[:-2, 1:-1] + m[2:, 1:-1] + m[1:-1, :-2] + m[1:-1, 2:])
        q[0, 1:-1] = (m[0, :-2] + m[0, 2:] + m[1, 1:-1]) / 3
        q[-1, 1:-1] = (m[-1, :-2] + m[-1, 2:] + m[-2, 1:-1]) / 3
        q[1:-1, 0] = (m[:-2, 0] + m[2:, 0] + m[1:-1, 1]) / 3
        q[1:-1, -1] = (m[:-2, -1] + m[2:, -1] + m[1:-1, -2]) / 3
        m = np.where(connu[..., None], m, q)
    canaux = [np.asarray(Image.fromarray(m[..., k].astype(np.float32), mode="F").resize((L, H), Image.BILINEAR)) for k in range(3)]
    return P + np.dstack(canaux)


def alpha(img, fond=12.0, seuil=7.0, rampe=16.0, grand=9, plaque=None, reboucher=True):
    flou = np.asarray(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
    Pl = fond_local(img, flou) if plaque is None else plaque
    d = np.abs(flou - Pl).max(-1)
    a = np.clip((d - seuil) / rampe, 0, 1)
    vide = d < fond
    # une ombre ou un reflet que le modèle a mis dans l'air : gris, lisse, proche du fond ; c'est du fond s'il touche le dehors
    lum = flou.mean(-1); lumP = Pl.mean(-1)
    chroma = flou.max(-1) - flou.min(-1)
    gy, gx = np.gradient(np.asarray(Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32))
    ombre = (chroma < 18) & (np.hypot(gx, gy) < 4.0) & (np.abs(lum - lumP) < 40)
    permis = vide | ombre
    # le fond relié au bord de l'image (au demi)
    p2 = permis[: H // 2 * 2, : L // 2 * 2].reshape(H // 2, 2, L // 2, 2).any((1, 3))
    v2 = Image.fromarray(p2.astype(np.uint8) * 255)
    h2, l2 = v2.size[1], v2.size[0]
    for x, y in ((0, 0), (l2 - 1, 0), (0, h2 - 1), (l2 - 1, h2 - 1), (0, h2 // 2), (l2 - 1, h2 // 2), (0, h2 // 4), (l2 - 1, h2 // 4), (0, 3 * h2 // 4), (l2 - 1, 3 * h2 // 4)):
        if v2.getpixel((x, y)) == 255:
            ImageDraw.floodfill(v2, (x, y), 128)
    dehors2 = np.asarray(v2) == 128
    trous2 = (np.asarray(v2) == 255) & vide[: H // 2 * 2 : 2, : L // 2 * 2 : 2]
    # les grands trous : ceux qui contiennent un disque de rayon `grand` (au demi), reconstruits en entier
    grands2 = _f(trous2, ImageFilter.MinFilter, grand)
    for _ in range(300):
        suite = _f(grands2, ImageFilter.MaxFilter, 1) & trous2
        if (suite == grands2).all():
            break
        grands2 = suite
    transp2 = dehors2 | (grands2 if reboucher else trous2)
    transp = np.repeat(np.repeat(transp2, 2, 0), 2, 1)[:H, :L] & permis
    petits = np.repeat(np.repeat(trous2 & ~grands2, 2, 0), 2, 1)[:H, :L]
    a = np.where(transp, 0.0, a)
    # loin du fond visible (plus de 2 px), tout est pièce : plein
    a = np.where(~_f(transp, ImageFilter.MaxFilter, 2), 1.0, a)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    return a, Pl


def detoure(img, a, Pl=None):
    """La couleur de la pièce, sans le gris du fond mêlé à ses bords (désémultipliée)."""
    aa = np.maximum(a[..., None], 0.02)
    c = (img - (1 - a[..., None]) * (P if Pl is None else Pl)) / aa
    return np.clip(np.where(a[..., None] > 0.02, c, img), 0, 255)


def sur_ciel(c, a):
    yy = np.linspace(0, 1, H)[:, None, None]
    ciel = np.array([40, 60, 110]) * (1 - yy) + np.array([200, 120, 90]) * yy
    return c * a[..., None] + np.broadcast_to(ciel, (H, L, 3)) * (1 - a[..., None])
