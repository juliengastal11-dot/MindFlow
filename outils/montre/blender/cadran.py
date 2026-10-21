# Le cadran de face, tiré de la photo de trois quarts : l'ellipse du cadran redressée en disque, les aiguilles effacées par
# la symétrie d'ordre 12 du cadran (on prend, au même rayon, le pixel tourné de 30°, là où il n'y a pas d'aiguille).
#   python cadran.py   -> textures/cadran.png (la face du cadran, 1024 px, alpha rond), textures/cadran-index.png (le masque
#                         lissé des index dorés, pour l'or poli du rendu), textures/cadran-controle.png (avant / après)
import os
import numpy as np
from PIL import Image, ImageDraw
ICI = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ICI, "textures"), exist_ok=True)
PHOTO = os.path.join(ICI, "..", "Montre dorée Stalika.png")
im = np.asarray(Image.open(PHOTO).convert("RGB")).astype(np.float32)
cx, cy, a, b = 475.1, 645.4, 297.8, 194.5
N = 1024
R = N / 2
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
u = (xx + 0.5 - R) / R
v = (yy + 0.5 - R) / R
def lire(img, X, Y):
    H, W = img.shape[:2]
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001)
    x0 = X.astype(int); y0 = Y.astype(int); fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]
    return img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy) + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy
def disque(u, v):
    return lire(im, cx + a * u, cy + b * v)
D = disque(u, v)
rayon = np.sqrt(u * u + v * v)
dedans = rayon <= 1.0
# le masque des aiguilles : sombre sur le cadran champagne ; on ne garde que ce qui tient au centre (les aiguilles et le
# pivot), pas les index ni les traits de la minuterie
lum = D.mean(-1)
sombre = (lum < 118) & dedans & (rayon < 0.86)
from collections import deque
lab = np.zeros((N, N), np.int32); n = 0
for y0, x0 in zip(*np.nonzero(sombre)):
    if lab[y0, x0]: continue
    n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy_, xx_ = y + dy, x + dx
            if 0 <= yy_ < N and 0 <= xx_ < N and sombre[yy_, xx_] and not lab[yy_, xx_]:
                lab[yy_, xx_] = n; q.append((yy_, xx_))
centre_ids = set(np.unique(lab[(rayon < 0.12) & sombre])) - {0}
aiguilles = np.isin(lab, list(centre_ids))
def dilater(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dy * dy + dx * dx <= r * r:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out
sousc = np.hypot(u - 0.0, v - 0.52) < 0.27
texte = (np.abs(u) < 0.44) & (v > -0.66) & (v < -0.28)
masque = dilater(aiguilles, 8) & dedans
print("pixels d'aiguilles :", int(aiguilles.sum()), "masque élargi :", int(masque.sum()))
# le remplissage : au même rayon, la moyenne des pixels tournés de +30° et de -30° (le soleillage varie doucement avec
# l'angle : la moyenne des deux voisins vaut à peu près la clarté locale), là où la source n'est ni aiguille, ni texte, ni
# petit cadran ; puis ±60°, ±90° pour ce qui reste
ang = np.arctan2(v, u)
rempli = D.copy()
reste = masque.copy()
exclu = (masque | texte | sousc).astype(np.float32)[..., None]
for d in (np.pi / 6, np.pi / 3, np.pi / 2):
    acc = np.zeros_like(D); n_ok = np.zeros((N, N), np.float32)
    for signe in (1, -1):
        uu = rayon * np.cos(ang + signe * d); vv = rayon * np.sin(ang + signe * d)
        src = disque(uu, vv)
        srcm = lire(exclu, R + uu * R - 0.5, R + vv * R - 0.5)[..., 0] > 0.01
        ok = reste & ~srcm
        acc[ok] += src[ok]; n_ok[ok] += 1
    fait = reste & (n_ok > 0)
    rempli[fait] = acc[fait] / n_ok[fait][:, None]
    reste &= ~fait
print("restent non remplis :", int(reste.sum()))
# la clarté d'ensemble du soleillage varie avec l'angle : les pixels copiés gardent leur grain (haute fréquence) mais
# prennent la clarté lisse (basse fréquence) interpolée depuis les alentours non masqués
def carte_lisse(img, valide, nr=24, na=96):
    L = img.mean(-1)
    ir = np.clip((rayon * nr).astype(int), 0, nr - 1); ia = ((ang + np.pi) / (2 * np.pi) * na).astype(int) % na
    som = np.zeros((nr, na)); cnt = np.zeros((nr, na))
    np.add.at(som, (ir[valide], ia[valide]), L[valide]); np.add.at(cnt, (ir[valide], ia[valide]), 1)
    c = np.where(cnt > 0, som / np.maximum(cnt, 1), np.nan)
    for i in range(nr):
        row = c[i]; ok = ~np.isnan(row)
        if ok.sum() == 0: row[:] = np.nanmean(c); continue
        xs = np.nonzero(ok)[0]
        c[i] = np.interp(np.arange(na), np.concatenate([xs - na, xs, xs + na]), np.concatenate([row[ok]] * 3))
        k = np.array([1, 2, 3, 4, 3, 2, 1], float); k /= k.sum()
        c[i] = np.convolve(np.concatenate([c[i][-3:], c[i], c[i][:3]]), k, mode="valid")
    fr = np.clip(rayon * nr - 0.5, 0, nr - 1.001); fa = ((ang + np.pi) / (2 * np.pi) * na - 0.5) % na
    r0 = fr.astype(int); r1 = np.minimum(r0 + 1, nr - 1); a0 = fa.astype(int) % na; a1 = (a0 + 1) % na
    tr = fr - r0; ta = fa - a0
    return c[r0, a0] * (1 - tr) * (1 - ta) + c[r0, a1] * (1 - tr) * ta + c[r1, a0] * tr * (1 - ta) + c[r1, a1] * tr * ta
copie = masque & ~reste
fond_cadran = (rempli.max(-1) - rempli.min(-1)) < 90  # pas les index dorés ni les traits sombres
lisse_cible = carte_lisse(D, dedans & ~masque & ~texte & ~sousc & fond_cadran & (D.mean(-1) > 100))
lisse_copie = carte_lisse(rempli, copie & fond_cadran)
gain = np.clip(lisse_cible / np.maximum(lisse_copie, 1), 0.85, 1.18)
g = np.where(copie & fond_cadran, gain, 1.0)
rempli = rempli * g[..., None]
# la tache sombre au-dessus de l'index de midi (un reflet du verre dans la photo) : remplie comme les aiguilles
tache = (rempli.mean(-1) < 100) & (rayon > 0.84) & (rayon < 0.985) & (np.abs(u) < 0.09) & (v < -0.8)
# (sans les traits de la minuterie : fins, on garde ce qui est dans un trait radial de moins de 2,5 px de large)
reste2 = dilater(tache, 3) & dedans & (rayon > 0.84) & (rayon < 0.985)
exclu2 = (reste2 | texte | sousc | masque).astype(np.float32)[..., None]
for d in (np.pi / 6, -np.pi / 6):
    uu = rayon * np.cos(ang + d); vv = rayon * np.sin(ang + d)
    src = disque(uu, vv)
    srcm = lire(exclu2, R + uu * R - 0.5, R + vv * R - 0.5)[..., 0] > 0.01
    ok = reste2 & ~srcm
    rempli[ok] = src[ok]; reste2 &= ~ok
# le centre (le pivot) : un petit disque de la teinte moyenne du cadran autour
centre = rayon < 0.075
anneau = (rayon > 0.08) & (rayon < 0.12) & ~masque
rempli[centre] = rempli[anneau].mean(0)
# le masque des index dorés (saturés et clairs), lissé : il fait le métal poli des index, sans grain
from PIL import ImageFilter as IF
mx_ = rempli.max(-1); mn_ = rempli.min(-1)
sat_ = (mx_ - mn_) / np.maximum(mx_, 1)
index = (sat_ > 0.45) & (mx_ > 140) & dedans
index = dilater(index, 1)
mi = Image.fromarray((index * 255).astype(np.uint8)).filter(IF.GaussianBlur(1.5))
mi.save(os.path.join(ICI, "textures/cadran-index.png"))
# le résultat, alpha = dedans (bord adouci)
alpha = np.clip((1.0 - rayon) * R, 0, 1)
out = np.dstack([np.clip(rempli, 0, 255), alpha * 255]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(os.path.join(ICI, "textures/cadran.png"))
# un contrôle : avant / après
ctrl = np.concatenate([np.clip(D, 0, 255), np.clip(rempli, 0, 255)], 1).astype(np.uint8)
Image.fromarray(ctrl).resize((1024, 512), Image.LANCZOS).save(os.path.join(ICI, "textures/cadran-controle.png"))
m = (masque * 255).astype(np.uint8); Image.fromarray(m).resize((512, 512)).save(os.path.join(ICI, "textures/cadran-masque.png"))
