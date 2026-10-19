# Modèle de fond : un polynôme lisse ajusté sur les pixels du fond, par itérations robustes.
import numpy as np
from PIL import Image

def modele_fond(rgb, iterations=4, degre=4):
    h, w, _ = rgb.shape
    yy, xx = np.mgrid[0:h, 0:w]
    xn = (xx / (w - 1)) * 2 - 1
    yn = (yy / (h - 1)) * 2 - 1
    termes = [xn**i * yn**j for i in range(degre + 1) for j in range(degre + 1 - i)]
    A = np.stack([t.ravel() for t in termes], 1)
    # départ : les bandes de gauche et de droite (hors de la pile)
    masque = np.zeros((h, w), bool)
    masque[:, : int(0.2 * w)] = True
    masque[:, int(0.88 * w):] = True
    pas = 7
    sous = np.zeros((h, w), bool); sous[::pas, ::pas] = True
    for _ in range(iterations):
        sel = (masque & sous).ravel()
        coef = [np.linalg.lstsq(A[sel], rgb[..., c].ravel()[sel], rcond=None)[0] for c in range(3)]
        bg = np.stack([(A @ cf).reshape(h, w) for cf in coef], -1)
        d = np.sqrt(((rgb - bg) ** 2).sum(-1))
        masque = d < 9
    return bg, d

if __name__ == "__main__":
    import sys
    im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.float32)
    bg, d = modele_fond(im)
    print("écart médian au fond (zone fond):", float(np.median(d[d < 9])), "| part de fond:", float((d < 9).mean()))
    Image.fromarray(np.clip(d * 6, 0, 255).astype(np.uint8)).save(sys.argv[2])

def modele_fond_libre(rgb, degre=7, iterations=4):
    """Le fond d'une photo éclairée en halo : on l'ajuste sur tout ce qui ressemble à du fond (gris neutre, clair, sans
    détail) et qui touche le bord de l'image, pas seulement sur les bandes des côtés."""
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from matte import decaler
    h, w, _ = rgb.shape
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    gy = np.abs(decaler(lum, 1, 0, 0) - lum) + np.abs(decaler(lum, 0, 1, 0) - lum)
    cand = (lum > 140) & (sat < 22) & (gy < 6)
    # ne garder que ce qui touche les bords gauche et droit (le gris d'acier du mouvement est enfermé dans l'or)
    vu = np.zeros_like(cand)
    for c in (1, w - 2): vu[:, c] = cand[:, c]
    for r in (1, h - 2): vu[r, :] = cand[r, :]
    for _ in range(4000):
        n = vu | (decaler(vu, 1, 0) | decaler(vu, -1, 0) | decaler(vu, 0, 1) | decaler(vu, 0, -1)) & cand
        if (n == vu).all(): break
        vu = n
    yy, xx = np.mgrid[0:h, 0:w]
    xn = (xx / (w - 1)) * 2 - 1
    yn = (yy / (h - 1)) * 2 - 1
    termes = [xn**i * yn**j for i in range(degre + 1) for j in range(degre + 1 - i)]
    A = np.stack([t.ravel() for t in termes], 1)
    sous = np.zeros((h, w), bool); sous[::5, ::5] = True
    masque = vu
    for _ in range(iterations):
        sel = (masque & sous).ravel()
        coef = [np.linalg.lstsq(A[sel], rgb[..., c].ravel()[sel], rcond=None)[0] for c in range(3)]
        bg = np.stack([(A @ cf).reshape(h, w) for cf in coef], -1)
        d = np.sqrt(((rgb - bg) ** 2).sum(-1))
        masque = vu & (d < 6)
    return bg, d
