# Outils de détourage sur fond uni : morphologie, trous, coupe entre deux pièces, matage (fond connu).
import numpy as np
from collections import deque

def decaler(m, dy, dx, bord=False):
    """r[y, x] = m[y - dy, x - dx] ; hors de l'image : `bord`."""
    h, w = m.shape[:2]
    r = np.full_like(m, bord)
    ys, yd = slice(max(-dy, 0), h - max(dy, 0)), slice(max(dy, 0), h - max(-dy, 0))
    xs, xd = slice(max(-dx, 0), w - max(dx, 0)), slice(max(dx, 0), w - max(-dx, 0))
    r[yd, xd] = m[ys, xs]
    return r

def disque(r):
    return [(dy, dx) for dy in range(-r, r + 1) for dx in range(-r, r + 1) if dy * dy + dx * dx <= r * r + r * 0.5]

def dilater(m, r):
    if r <= 0: return m.copy()
    o = np.zeros_like(m)
    for dy, dx in disque(r): o |= decaler(m, dy, dx)
    return o

def eroder(m, r, bord=True):
    if r <= 0: return m.copy()
    o = np.ones_like(m)
    for dy, dx in disque(r): o &= decaler(m, dy, dx, bord)
    return o

def composantes(masque, huit=True):
    h, w = masque.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    voisins = [(dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (huit or not (dy and dx))]
    for y0, x0 in zip(*np.nonzero(masque)):
        if lab[y0, x0]: continue
        n += 1
        q = deque([(y0, x0)]); lab[y0, x0] = n
        while q:
            y, x = q.popleft()
            for dy, dx in voisins:
                yy, xx = y + dy, x + dx
                if 0 <= yy < h and 0 <= xx < w and masque[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
    return lab, n

def plus_grandes(m, surface_min=400, garder=None):
    """Les composantes de plus de `surface_min` pixels (ou les `garder` plus grandes)."""
    lab, n = composantes(m)
    if n == 0: return m
    tailles = np.bincount(lab.ravel())[1:]
    ordre = np.argsort(-tailles)
    choisies = [k + 1 for k in ordre if tailles[k] >= surface_min]
    if garder: choisies = choisies[:garder]
    return np.isin(lab, choisies)

def trous(m):
    """Les régions du fond que le bord de l'image n'atteint pas (4-connexes)."""
    dehors = ~m
    vu = np.zeros_like(m)
    vu[0, :] = dehors[0, :]; vu[-1, :] = dehors[-1, :]; vu[:, 0] = dehors[:, 0]; vu[:, -1] = dehors[:, -1]
    while True:
        n = vu | (decaler(vu, 1, 0) | decaler(vu, -1, 0) | decaler(vu, 0, 1) | decaler(vu, 0, -1)) & dehors
        if (n == vu).all(): break
        vu = n
    return dehors & ~vu

def boucher(m, d=None, surface_max=None, d_vrai_trou=None):
    """Bouche les trous : tous, ou ceux de moins de `surface_max` pixels ; garde ouverts ceux dont l'écart moyen au
    fond est sous `d_vrai_trou` (un vrai trou, où l'on voit le fond)."""
    t = trous(m)
    if surface_max is None and d_vrai_trou is None: return m | t
    lab, n = composantes(t, huit=False)
    o = m.copy()
    for k in range(1, n + 1):
        z = lab == k
        if surface_max is not None and z.sum() > surface_max: continue
        if d_vrai_trou is not None and d is not None and d[z].mean() < d_vrai_trou: continue
        o |= z
    return o

def courbe(d, x0, x1, ya, yb, lisse=7):
    """Pour chaque colonne de x0 à x1, la ligne de [ya, yb] la plus proche du fond : la coupe entre deux pièces."""
    zone = d[ya:yb, x0:x1]
    zl = (decaler(zone, 1, 0, 0) + zone + decaler(zone, -1, 0, 0)) / 3
    y = np.argmin(zl, 0) + ya
    k = lisse // 2
    yp = np.pad(y, k, mode="edge")
    return np.array([int(np.median(yp[i:i + lisse])) for i in range(len(y))])

def sous_courbe(forme, x0, ys, dessous=True):
    h, w = forme
    m = np.ones((h, w), bool)  # hors de la courbe : pas de contrainte
    yy = np.arange(h)[:, None]
    for i, yc in enumerate(ys):
        x = x0 + i
        if 0 <= x < w: m[:, x] = (yy[:, 0] > yc) if dessous else (yy[:, 0] < yc)
    return m

def ellipse(forme, cx, cy, rx, ry):
    h, w = forme
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1

def ronger(a, r=1):
    """Érosion en niveaux de gris : le bord recule d'un pixel, sa douceur reste (le liseré clair du bord s'en va)."""
    o = a.copy()
    for _ in range(r):
        o = np.minimum.reduce([o, decaler(o, 1, 0, 1.0), decaler(o, -1, 0, 1.0), decaler(o, 0, 1, 1.0), decaler(o, 0, -1, 1.0)])
    return o

def mater(C, B, solide, bande=2, choke=0):
    """Matage à fond connu. Dans `solide` érodé : opaque. Dans la bande du bord : alpha par projection de (C - B) sur
    (F - B), F étant la couleur de la pièce prolongée depuis l'intérieur. Rend alpha et la couleur décontaminée."""
    inter = eroder(solide, 1, bord=True)
    ext = dilater(solide, bande)
    F = np.where(inter[..., None], C, 0).astype(np.float32)
    connu = inter.copy()
    for _ in range(bande + 3):
        acc = np.zeros_like(F); cnt = np.zeros(connu.shape, np.float32)
        for dy, dx in disque(1):
            if not (dy or dx): continue
            acc += decaler(F * connu[..., None], dy, dx, 0)
            cnt += decaler(connu.astype(np.float32), dy, dx, 0)
        neuf = (~connu) & (cnt > 0) & ext
        F[neuf] = acc[neuf] / cnt[neuf][:, None]
        connu |= neuf
    df = F - B
    n2 = (df ** 2).sum(-1)
    a = np.clip(((C - B) * df).sum(-1) / np.maximum(n2, 1e-3), 0, 1)
    faible = n2 < 14 ** 2
    a = np.where(faible, solide.astype(np.float32), a)
    a = np.where(inter, 1.0, a)
    a = np.where(ext, a, 0.0)
    a = np.clip((a - 0.06) / 0.94, 0, 1)  # pas de voile ténu autour de la pièce
    # la couleur : décontaminée là où l'alpha est franc ; ailleurs, la couleur prolongée depuis l'intérieur (diviser par
    # un petit alpha grossirait le bruit en points clairs)
    Fo = np.where((a > 0.6)[..., None], B + (C - B) / np.maximum(a, 1e-3)[..., None], F)
    Fo = np.where(inter[..., None], C, Fo)
    if choke: a = ronger(a, choke)
    return a.astype(np.float32), np.clip(Fo, 0, 255)

def mater_verre(C, B, region, K=70.0, gamma=1.0):
    """Le verre : transparent où l'on voit le fond, l'écart au fond devient le reflet."""
    e = C - B
    n = np.sqrt((e ** 2).sum(-1))
    a = np.clip(n / K, 0, 1) ** gamma
    a = np.where(region, a, 0.0)
    F = B + e / np.maximum(a, 1e-3)[..., None]
    return a.astype(np.float32), np.clip(F, 0, 255)
