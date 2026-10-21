# Outils de composition des images clés de la montre (Higgsfield) : alignement, fond, masques, fusion.
import numpy as np
from PIL import Image, ImageFilter

L, H = 1080, 1920


def charge(p):
    im = Image.open(p).convert("RGB")
    if im.size != (L, H):
        im = im.resize((L, H), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def ecrit(a, p):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(p)


def gris(a):
    return a @ np.array([0.299, 0.587, 0.114], np.float32)


def flou(m, r):
    im = Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def dilate(m, r):
    im = Image.fromarray((m > 0.5).astype(np.uint8) * 255)
    return np.asarray(im.filter(ImageFilter.MaxFilter(2 * r + 1))) > 127


def erode(m, r):
    im = Image.fromarray((m > 0.5).astype(np.uint8) * 255)
    return np.asarray(im.filter(ImageFilter.MinFilter(2 * r + 1))) > 127


def modele_fond(a, zones):
    """Le fond lisse (polynôme de degré 2 en x, y, par canal), ajusté sur les pixels des zones (liste de boîtes x0,y0,x1,y1)."""
    ys, xs, vs = [], [], []
    for x0, y0, x1, y1 in zones:
        yy, xx = np.mgrid[y0:y1:4, x0:x1:4]
        ys.append(yy.ravel()); xs.append(xx.ravel()); vs.append(a[y0:y1:4, x0:x1:4].reshape(-1, 3))
    y = np.concatenate(ys) / H; x = np.concatenate(xs) / L; v = np.concatenate(vs)
    A = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], 1)
    c, *_ = np.linalg.lstsq(A, v, rcond=None)
    yy, xx = np.mgrid[0:H, 0:L]
    yy = yy / H; xx = xx / L
    B = np.stack([np.ones_like(xx), xx, yy, xx * xx, xx * yy, yy * yy], -1)
    return (B @ c).astype(np.float32)


def bruit_fond(a, fond, zone):
    """Le grain du fond (photo) : l'écart au modèle, pris dans une zone vide, pour ne pas laisser une plage trop lisse."""
    x0, y0, x1, y1 = zone
    return (a[y0:y1, x0:x1] - fond[y0:y1, x0:x1])


def deplace(a, s, dx, dy):
    """Mise à l'échelle s autour du centre de l'image puis translation (dx, dy)."""
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    cx, cy = L / 2, H / 2
    # x_src = (x_dst - dx - cx) / s + cx
    inv = (1 / s, 0, cx - (cx + dx) / s, 0, 1 / s, cy - (cy + dy) / s)
    return np.asarray(im.transform((L, H), Image.AFFINE, inv, resample=Image.BICUBIC)).astype(np.float32)


def _ncc(a, b):
    a = a - a.mean(); b = b - b.mean()
    return float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-6))


def aligne(src, ref, boite, echelles=np.linspace(0.94, 1.06, 25), portee=48):
    """Cherche s, dx, dy tels que deplace(src) colle à ref dans la boîte (sur les contours, au demi)."""
    x0, y0, x1, y1 = boite
    def bords(g):
        gy, gx = np.gradient(g)
        return np.hypot(gx, gy)
    r = bords(gris(ref)[y0:y1:2, x0:x1:2])
    meilleur = (-1, 1, 0, 0)
    for s in echelles:
        t = deplace(src, s, 0, 0)
        g = bords(gris(t)[::2, ::2])
        # corrélation par FFT sur une fenêtre élargie
        p = portee // 2
        Y0, Y1, X0, X1 = y0 // 2 - p, y1 // 2 + p, x0 // 2 - p, x1 // 2 + p
        w = g[max(Y0, 0):Y1, max(X0, 0):X1]
        best = (-1, 0, 0)
        for ddy in range(-p, p + 1, 2):
            for ddx in range(-p, p + 1, 2):
                yy, xx = y0 // 2 - ddy - max(Y0, 0), x0 // 2 - ddx - max(X0, 0)
                c = w[yy:yy + r.shape[0], xx:xx + r.shape[1]]
                if c.shape != r.shape:
                    continue
                v = _ncc(c, r)
                if v > best[0]:
                    best = (v, ddx, ddy)
        if best[0] > meilleur[0]:
            meilleur = (best[0], s, best[1] * 2, best[2] * 2)
    # affinage au pixel
    v0, s, dx, dy = meilleur
    for ddy in range(-2, 3):
        for ddx in range(-2, 3):
            t = deplace(src, s, dx + ddx, dy + ddy)
            v = _ncc(bords(gris(t)[y0:y1:2, x0:x1:2]), r)
            if v > meilleur[0]:
                meilleur = (v, s, dx + ddx, dy + ddy)
    return meilleur


def accorde(src, ref, masque):
    """Ajuste les couleurs de src sur ref (affine par canal) d'après les pixels du masque."""
    out = src.copy()
    for k in range(3):
        a = src[..., k][masque]; b = ref[..., k][masque]
        A = np.stack([a, np.ones_like(a)], 1)
        c, *_ = np.linalg.lstsq(A, b, rcond=None)
        out[..., k] = src[..., k] * c[0] + c[1]
    return out


def fusionne(base, src, masque, plume=2.0):
    m = flou(masque.astype(np.float32), plume)[..., None]
    return base * (1 - m) + src * m


def planche(images, p, largeur=360, legende=None):
    ims = [Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((largeur, int(largeur * H / L))) for a in images]
    o = Image.new("RGB", (len(ims) * (largeur + 6), ims[0].height), (255, 0, 0))
    for k, i in enumerate(ims):
        o.paste(i, (k * (largeur + 6), 0))
    o.save(p, quality=90)


def plaque(a, fg, r=10, iters=3000, f=4):
    """Le fond seul, sans aucune pièce : interpolation harmonique depuis les pixels de fond (au quart, puis agrandie)."""
    inconnu = dilate(fg, r)
    h, w = H // f, L // f
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((w, h), Image.BOX)
    p = np.asarray(im).astype(np.float32)
    m = np.asarray(Image.fromarray(inconnu.astype(np.uint8) * 255).resize((w, h), Image.BOX)) > 0
    # départ : la moyenne des pixels connus
    p[m] = p[~m].mean(0)
    for _ in range(iters):
        q = p.copy()
        q[1:-1, 1:-1] = 0.25 * (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:])
        p[m] = q[m]
    grand = np.asarray(Image.fromarray(np.clip(p, 0, 255).astype(np.uint8)).resize((L, H), Image.BICUBIC)).astype(np.float32)
    # garder les vrais pixels de fond là où ils sont connus
    k = flou((~inconnu).astype(np.float32), 3)[..., None]
    return grand * (1 - k) + a * k, inconnu


def grain(forme, ecart=1.2, graine=1):
    rng = np.random.default_rng(graine)
    n = rng.normal(0, ecart, forme[:2] + (1,)).astype(np.float32)
    return np.repeat(n, 3, -1)
