"""Retire d'une série d'images un fil fin et sombre (ici le hauban du poteau, qui pend dans le vide au-dessus de la mer de nuages) :
on le suit d'une image à la suivante, puis on le recouvre par ce qu'il y a de part et d'autre.

Comment : un fil est un profil étroit et sombre, plus sombre que ses deux côtés (à 3 px), qu'on cherche à chaque image. On part
d'une image où il est net (`--ancre`), on trouve la droite qui le suit le mieux (une recherche de Hough, serrée sur ce que
l'image voisine annonce), puis on suit son tracé rangée par rangée et on l'ajuste par une parabole. De proche en proche, vers
l'avant et vers l'arrière, jusqu'à ce qu'il ne soit plus là. Pour l'effacer, dans chaque rangée on remplace les 7 px du fil
par un dégradé entre les deux côtés (des nuages : doux), la bordure adoucie sur un pixel.

Usage : python -I -X utf8 retirer-cable.py <dossier des images> [--ancre 70] [--de 1] [--a 99] [--sortie <dossier>]
                                           [--qualite 78] [--debug <dossier>] [--sans-ecrire]
  Sans --sortie, les images sont réécrites sur place (WebP, qualité 78 : même poids que les originaux, écart moyen de 1,4 niveau
  sur 255, invisible ; les images sont déjà des WebP de qualité 72, une autre passe ne coûte presque rien).
  --debug : une planche avant/après par image traitée. --sans-ecrire : ne fait que suivre et imprimer le tracé.

Réglé sur la série verticale du téléphone (public/hero/plongee-mobile, 720 × 1274) : le fil descend vers la droite (pente 0,13 à
0,17), de la droite du poteau vers le bord gauche de l'image, entre les images 20 et 99.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

LARGEUR_FIL = 3.5      # demi-largeur effacée de part et d'autre de l'axe du fil, en px
YMAX = 640             # le fil est cherché au-dessus (la colline et le personnage sont dessous)
JONCTION = 30.0        # réponse horizontale au-delà de laquelle un câble en biais coupe le chemin du fil, à ±2 px de son axe : son raccord


def option(nom, defaut=None):
    return sys.argv[sys.argv.index(nom) + 1] if nom in sys.argv else defaut


def luminance(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def crete(L, d=3):
    """Réponse d'un fil sombre et fin : la moyenne des deux côtés, à d px, moins le centre (le plus sombre de trois colonnes)."""
    g = np.pad(L, ((0, 0), (d + 1, d + 1)), mode="edge")
    gauche = g[:, 0:-2 * (d + 1)]
    droite = g[:, 2 * (d + 1):]
    centre = g[:, d + 1:-(d + 1)]
    c2 = np.minimum(np.minimum(centre, np.pad(centre, ((0, 0), (1, 0)), mode="edge")[:, :-1]),
                    np.pad(centre, ((0, 0), (0, 1)), mode="edge")[:, 1:])
    return np.clip(0.5 * (gauche + droite) - c2, 0, None)


def crete_h(L, d=3):
    """La même chose pour un fil horizontal ou en biais (profil vertical) : le câble qui s'affaisse y répond fort, le fil vertical non."""
    g = np.pad(L, ((d + 1, d + 1), (0, 0)), mode="edge")
    haut = g[0:-2 * (d + 1), :]
    bas = g[2 * (d + 1):, :]
    centre = g[d + 1:-(d + 1), :]
    c2 = np.minimum(np.minimum(centre, np.pad(centre, ((1, 0), (0, 0)), mode="edge")[:-1, :]),
                    np.pad(centre, ((0, 1), (0, 0)), mode="edge")[1:, :])
    R = np.clip(0.5 * (haut + bas) - c2, 0, None)
    p = np.pad(R, ((0, 0), (2, 2)), mode="edge")
    return sum(p[:, i:i + R.shape[1]] for i in range(5)) / 5


def lisse_v(R, k):
    p = np.pad(R, ((k // 2, k // 2), (0, 0)), mode="edge")
    return sum(p[i:i + R.shape[0]] for i in range(k)) / k


def hough(Rv, x0_min, x0_max, s_min, s_max):
    """La droite x = x0 + s·y qui porte le plus de crête, dans la fenêtre donnée."""
    H, W = Rv.shape
    ys = np.arange(0, YMAX, 3)
    Rc = np.minimum(Rv, 45.0)
    meilleur = (-1.0, 0.0, 0.0)
    for s in np.arange(s_min, s_max + 1e-9, 0.0025):
        x0s = np.arange(x0_min, x0_max + 1e-9, 0.5)
        xs = x0s[:, None] + s * ys[None, :]
        ok = (xs >= 0) & (xs < W - 1)
        xi = np.clip(np.round(xs).astype(int), 0, W - 1)
        v = Rc[ys[None, :], xi] * ok
        touche = (v > 8).sum(axis=1)
        score = v.sum(axis=1) * np.minimum(1.0, touche / 60.0)
        k = int(np.argmax(score))
        if score[k] > meilleur[0]:
            meilleur = (float(score[k]), float(x0s[k]), float(s))
    return meilleur


def suivre(Rv, x0, s):
    """Le fil rangée par rangée : le maximum de la crête à ±4 px de la droite (position au dixième de pixel)."""
    H, W = Rv.shape
    ys = np.arange(0, min(H - 1, YMAX))
    xs, fo = [], []
    for y in ys:
        xc = x0 + s * y
        a, b = int(round(xc)) - 4, int(round(xc)) + 5
        if a < 0 or b >= W:
            xs.append(np.nan); fo.append(0.0); continue
        fen = Rv[y, a:b]
        j = int(np.argmax(fen))
        d = fen[j - 1] - 2 * fen[j] + fen[j + 1] if 0 < j < len(fen) - 1 else 0.0
        dec = 0.5 * (fen[j - 1] - fen[j + 1]) / d if d != 0 else 0.0
        xs.append(a + j + dec); fo.append(float(fen[j]))
    return ys, np.array(xs), np.array(fo)


def plus_long_tronçon(ys, bon, trou=30):
    """Le plus long groupe de rangées « bonnes », en comblant des trous de `trou` rangées au plus : (première, dernière)."""
    idx = ys[bon]
    if len(idx) == 0:
        return None
    groupes, debut, prev = [], idx[0], idx[0]
    for y in idx[1:]:
        if y - prev > trou:
            groupes.append((debut, prev)); debut = y
        prev = y
    groupes.append((debut, prev))
    return max(groupes, key=lambda g: g[1] - g[0])


def tracer(Rv, fenetre):
    """(score, x0, s, parabole, première rangée, dernière rangée) ou None."""
    score, x0, s = hough(Rv, *fenetre)
    ys, xs, fo = suivre(Rv, x0, s)
    ok = np.isfinite(xs) & (fo > 10.0)
    if ok.sum() < 40:
        return None
    y, x = ys[ok].astype(float), xs[ok]
    for _ in range(4):
        c = np.polyfit(y, x, 2)
        r = np.abs(np.polyval(c, y) - x)
        garde = r < max(1.2, 2.5 * np.median(r))
        if garde.sum() < 30:
            break
        y, x = y[garde], x[garde]
    c = np.polyfit(y, x, 2)
    # les rangées dont la crête colle à la parabole : le fil est là ; le plus long tronçon, sans les rangées isolées
    colle = np.isfinite(xs) & (fo > 8.0) & (np.abs(np.polyval(c, ys.astype(float)) - xs) < 1.8)
    t = plus_long_tronçon(ys, colle)
    if t is None or t[1] - t[0] < 60:
        return None
    return score, x0, s, c, int(t[0]), int(t[1])


def monter(Rv, Rh, L, x, y, pente):
    """Remonte le fil depuis (x, y), rangée par rangée, en suivant sa position locale (±2 px autour de ce que sa pente annonce) :
    près du raccord le fil n'est plus sur la parabole. S'arrête au raccord (là où passe le câble qui s'affaisse : réponse
    horizontale forte et noir franc sur l'axe), quand le fil n'est plus là (8 rangées de suite) ou au bord de l'image.
    Rend [(rangée, x)] de la rangée y - 1 vers le haut."""
    H, W = Rv.shape
    trace = []
    manque = 0
    for r in range(y - 1, -1, -1):
        xp = x - pente
        xi = int(round(xp))
        if xi < 12 or xi >= W - 12:
            break
        if Rh[r, xi - 2:xi + 3].max() > JONCTION:
            # le raccord : on laisse deux rangées de marge sous le câble
            trace = trace[:-2] if len(trace) > 2 else trace
            break
        fen = Rv[r, xi - 2:xi + 3]
        j = int(np.argmax(fen))
        if fen[j] >= 3.0:
            d = fen[j - 1] - 2 * fen[j] + fen[j + 1] if 0 < j < len(fen) - 1 else 0.0
            dec = 0.5 * (fen[j - 1] - fen[j + 1]) / d if d != 0 else 0.0
            nx = xi - 2 + j + float(np.clip(dec, -0.5, 0.5))
            pente = 0.85 * pente + 0.15 * (x - nx)
            x = nx
            manque = 0
        else:
            x = xp
            manque += 1
            if manque > 8:
                trace = trace[:len(trace) - manque]
                break
        trace.append((r, x))
    return trace


def axe(Rv, L, c, ya, yb):
    """L'axe du fil, rangée par rangée : (rangées, centres, première et dernière rangées effacées).

    Le centre de chaque rangée est la crête à ±2,5 px de la parabole, quand elle y est (assez nette), puis une droite ajustée sur
    les rangées voisines (±20) : le fil n'est pas tout à fait une parabole. En haut, on remonte le fil depuis son tronçon net
    jusqu'à son raccord avec le câble qui s'affaisse (voir `monter`). En bas, le fil se devine encore après le tronçon net (il
    s'efface dans les nuages) : on prolonge tant que la crête colle à l'axe, sans plus de 40 rangées manquantes de suite, et on
    garde dix rangées de marge."""
    H, W = Rv.shape
    Rh = crete_h(L)
    rangees = np.arange(0, min(H - 1, yb + 150) + 1)
    pred = np.polyval(c, rangees.astype(float))
    pos = np.full(len(rangees), np.nan)
    force = np.zeros(len(rangees))
    for i, (y, p) in enumerate(zip(rangees, pred)):
        a, b = int(round(p)) - 3, int(round(p)) + 4
        if a < 0 or b >= W:
            continue
        fen = Rv[y, a:b]
        j = int(np.argmax(fen))
        d = fen[j - 1] - 2 * fen[j] + fen[j + 1] if 0 < j < len(fen) - 1 else 0.0
        dec = 0.5 * (fen[j - 1] - fen[j + 1]) / d if d != 0 else 0.0
        x = a + j + dec
        if abs(x - p) <= 2.5:
            pos[i], force[i] = x, fen[j]
    net = np.isfinite(pos) & (force >= 3.0)
    centres = pred.copy()
    for i in range(len(rangees)):
        lo, hi = max(0, i - 20), min(len(rangees), i + 21)
        m = net[lo:hi]
        if m.sum() >= 8:
            t = rangees[lo:hi][m].astype(float)
            k = np.polyfit(t - rangees[i], pos[lo:hi][m], 1)
            centres[i] = k[1]
    i0 = int(np.searchsorted(rangees, ya))
    i1 = int(np.searchsorted(rangees, yb))
    # en haut : si le tronçon net commence dans le câble qui s'affaisse (le fil y est accroché), on descend jusqu'à sa sortie ;
    # sinon on remonte le fil jusqu'au câble
    def croise(i):
        x = int(round(centres[i]))
        fen = Rh[rangees[i], max(0, x - 2):max(0, x + 3)]
        return bool(fen.size and fen.max() > JONCTION)

    trace = []
    haut = i0
    if croise(i0):
        k = i0
        while k < i1 and (croise(k) or croise(k + 1)):
            k += 1
        haut = min(i1, k + 1)
    else:
        pente = 2 * c[0] * ya + c[1]
        trace = monter(Rv, Rh, L, float(centres[i0]), int(ya), pente)
    if trace:
        haut = trace[-1][0]
        xs = np.array([x for _, x in trace])
        # un peu de lissage le long du fil (5 rangées), sans raccourcir les bouts
        lisse = np.convolve(np.pad(xs, 2, mode="edge"), np.ones(5) / 5, mode="valid")
        for (r, _), x in zip(trace, lisse):
            centres[r] = x
    # en bas : la prolongation
    solide = np.isfinite(pos) & (force >= 3.0) & (np.abs(pos - pred) <= 1.5)
    bas, manque = i1, 0
    for i in range(i1 + 1, len(rangees)):
        if solide[i]:
            bas, manque = i, 0
        else:
            manque += 1
            if manque > 40:
                break
    bas = min(len(rangees) - 1, bas + 10)
    # les rangées où le câble qui s'affaisse (ou autre chose de noir) croise le fil en route : on n'y touche pas, sans quoi le câble
    # aurait un trou de la largeur du masque
    croisent = np.array([croise(i) for i in range(haut, bas + 1)])
    return rangees[haut:bas + 1], centres[haut:bas + 1], int(rangees[haut]), int(rangees[bas]), croisent


def effacer(a, rangees, xc, w=LARGEUR_FIL, garde=None, croisent=None):
    """Recouvre le fil par un dégradé entre ses deux côtés, rangée par rangée ; la bordure adoucie sur un pixel.

    Dans les rangées prolongées sous le tronçon net (au-dessous de `garde`), on ne touche à rien quand un côté est sombre ou que
    les deux côtés diffèrent beaucoup : c'est le personnage (ses cheveux), pas un nuage."""
    H, W = a.shape[:2]
    sortie = a.copy()
    # les deux côtés : 3 px à 4 px du bord de la zone effacée, lissés le long du fil (5 rangées)
    ref_g = np.zeros((len(rangees), 3))
    ref_d = np.zeros((len(rangees), 3))
    for i, (y, x) in enumerate(zip(rangees, xc)):
        g0 = int(np.floor(x - w)) - 3
        d0 = int(np.ceil(x + w)) + 1
        if g0 < 0 or d0 + 3 > W:
            ref_g[i] = ref_d[i] = np.nan
            continue
        ref_g[i] = a[y, g0:g0 + 3].mean(axis=0)
        ref_d[i] = a[y, d0:d0 + 3].mean(axis=0)
    for ref in (ref_g, ref_d):
        for ch in range(3):
            col = ref[:, ch]
            bon = np.isfinite(col)
            if bon.sum() == 0:
                continue
            col[~bon] = np.interp(np.flatnonzero(~bon), np.flatnonzero(bon), col[bon])
            k = np.ones(5) / 5
            ref[:, ch] = np.convolve(np.pad(col, 2, mode="edge"), k, mode="valid")
    for i, (y, x) in enumerate(zip(rangees, xc)):
        if croisent is not None and croisent[i]:
            continue
        lg, ld = luminance(ref_g[i]), luminance(ref_d[i])
        if garde is not None and y > garde:
            if min(lg, ld) < 75 or abs(lg - ld) > 45:
                continue
        if min(lg, ld) < 70 and abs(lg - ld) > 50:
            # un côté est un objet noir (le câble, le poteau) : on ne mélange pas, on prolonge le côté clair
            if lg > ld:
                ref_d[i] = ref_g[i]
            else:
                ref_g[i] = ref_d[i]
        g, d = x - w, x + w
        xa, xb = int(np.floor(g)) - 1, int(np.ceil(d)) + 1
        for px in range(max(0, xa), min(W - 1, xb) + 1):
            dist = abs(px - x)
            alpha = float(np.clip(1.0 - (dist - (w - 1.0)), 0.0, 1.0))
            if alpha <= 0:
                continue
            t = float(np.clip((px - g) / (d - g), 0.0, 1.0))
            fill = ref_g[i] * (1 - t) + ref_d[i] * t
            sortie[y, px] = fill * alpha + a[y, px] * (1 - alpha)
    return sortie


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    dossier = args[0]
    ancre = int(option("--ancre", 70))
    de, a_ = int(option("--de", 1)), int(option("--a", 99))
    sortie = option("--sortie")
    qualite = int(option("--qualite", 78))
    debug = option("--debug")
    ecrire = "--sans-ecrire" not in sys.argv
    if debug:
        os.makedirs(debug, exist_ok=True)

    def charge(n):
        return np.asarray(Image.open(f"{dossier}/{n:03d}.webp").convert("RGB")).astype(float)

    def crete_de(n):
        return lisse_v(crete(luminance(charge(n))), 7)

    # l'ancre : la recherche large, sur toute la largeur de l'image
    t0 = tracer(crete_de(ancre), (0.0, 700.0, 0.10, 0.20))
    if t0 is None:
        sys.exit("le fil n'est pas trouvé dans l'image d'ancre")
    traces = {ancre: t0}
    print(f"ancre {ancre} : x0 {t0[1]:.1f} pente {t0[2]:.3f}")
    # vers l'avant puis vers l'arrière : la fenêtre se resserre sur l'image voisine
    for sens, bornes in ((1, range(ancre + 1, a_ + 1)), (-1, range(ancre - 1, de - 1, -1))):
        prec = t0
        for n in bornes:
            _, x0p, sp = prec[:3]
            if sens == 1:
                fen = (x0p - 12.0, x0p + 3.0, sp - 0.025, sp + 0.025)
            else:
                fen = (x0p - 3.0, x0p + 12.0, sp - 0.025, sp + 0.025)
            t = tracer(crete_de(n), fen)
            if t is None or t[0] < 700:
                print(f"{n} : le fil n'est plus trouvé, on s'arrête")
                break
            traces[n] = t
            prec = t
    for n in sorted(traces):
        sc, x0, s, c, ya, yb = traces[n]
        print(f"{n:3d} · score {sc:6.0f} · x0 {x0:6.1f} pente {s:.3f} · rangées {ya:3d} à {yb:3d} · x({ya}) {np.polyval(c, ya):6.1f} → x({yb}) {np.polyval(c, yb):6.1f}")
    if not ecrire:
        return
    cible = sortie or dossier
    os.makedirs(cible, exist_ok=True)
    for n in sorted(traces):
        _, _, _, c, ya, yb = traces[n]
        av = charge(n)
        rangees, xc, y0, y1, croisent = axe(crete_de(n), luminance(av), c, ya, yb)
        ap = effacer(av, rangees, xc, garde=yb, croisent=croisent)
        im = Image.fromarray(np.clip(np.round(ap), 0, 255).astype(np.uint8))
        im.save(f"{cible}/{n:03d}.webp", "WEBP", quality=qualite, method=6)
        if debug:
            x1 = int(max(0, xc.min() - 70))
            x2 = int(min(av.shape[1], xc.max() + 70))
            y2 = min(av.shape[0], y1 + 30)
            avant = Image.fromarray(av[:y2, x1:x2].astype(np.uint8))
            apres = Image.fromarray(np.clip(np.round(ap[:y2, x1:x2]), 0, 255).astype(np.uint8))
            planche = Image.new("RGB", (avant.width * 2 + 6, avant.height), (255, 0, 255))
            planche.paste(avant, (0, 0))
            planche.paste(apres, (avant.width + 6, 0))
            planche.save(f"{debug}/{n:03d}.png")
    print(f"{len(traces)} images traitées")


if __name__ == "__main__":
    main()
