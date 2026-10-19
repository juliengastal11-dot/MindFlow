# Les cornes du boîtier, rapprochées du bracelet (J, 2026-10-19 : « les 4 branches qui se réduisent pour attraper le
# bracelet, il les faudrait moins larges depuis le début »). Dans la vue éclatée de ChatGPT, elles sont bien plus écartées
# que le bracelet ; dans la photo de la montre finie, elles le serrent. On les ramène, dès la découpe, à leur place dans la
# photo (relevée à la loupe : leurs bords intérieurs à 378 et 551 en haut, 358 et 570 en bas), pour qu'elles n'aient plus
# à se resserrer quand la montre se relève. Un glissement horizontal, plein sur les cornes, nul sur le corps du boîtier ;
# les rangées des côtés du trou (1040 à 1150) ne bougent pas.
import numpy as np

def lisse(a, b, x):
    t = np.clip((np.asarray(x, np.float32) - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def deplacement(x, y):
    """Le glissement horizontal d'un point (x, y) du boîtier, en pixels d'éclaté."""
    haut = 1 - lisse(980, 1040, y)
    bas = lisse(1150, 1200, y)
    gauche = 47 * haut * (1 - lisse(338, 430, x)) + 19 * bas * (1 - lisse(362, 440, x))
    droite = -40 * haut * lisse(495, 586, x) - 13 * bas * lisse(486, 578, x)
    return gauche + droite

def _relire(a, col, X, Y):
    """a, col lus aux points (X, Y), en bilinéaire et en couleurs prémultipliées."""
    H, W = a.shape
    P = np.dstack([col * a[..., None], a])
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001)
    x0 = X.astype(int); y0 = Y.astype(int)
    fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]
    Q = P[y0, x0] * (1 - fx) * (1 - fy) + P[y0, x0 + 1] * fx * (1 - fy) + P[y0 + 1, x0] * (1 - fx) * fy + P[y0 + 1, x0 + 1] * fx * fy
    a2 = Q[..., 3]
    col2 = np.where((a2 > 1e-4)[..., None], Q[..., :3] / np.maximum(a2, 1e-4)[..., None], 0)
    return a2.astype(np.float32), col2.astype(np.float32)

def resserrer(a, col):
    """Le boîtier, ses cornes glissées : chaque pixel d'arrivée x' prend le point de départ x tel que x + D(x) = x'."""
    H, W = a.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    X = xx.copy()
    for _ in range(40):
        X = xx - deplacement(X, yy)
    return _relire(a, col, X, yy)

def elargir_bracelet_bas(a, col):
    """Le haut du bracelet du bas, un peu plus large (× 1,1 contre les cornes, plus rien dès le passant), comme dans la
    photo : il remplit l'écart entre les cornes du bas sans s'élargir pendant que la montre se relève."""
    H, W = a.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    s = 1 + 0.1 * (1 - lisse(1412, 1490, yy))
    return _relire(a, col, 465 + (xx - 465) / s, yy)
