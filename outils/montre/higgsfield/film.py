# Le film de la montre : les six plans vidéo (Higgsfield, Kling 3.0) recousus sur les calques exacts, détourés.
# Pour chaque plan, ce qui ne bouge pas vient des calques (net, déjà détouré) ; de la vidéo, on ne prend que la pièce
# qui bouge : on suit sa position image par image (sa forme est connue, c'est son calque), on la détoure là, et son
# calque rebouche les plages d'acier que le détourage confondrait avec le fond. Ce qui doit passer devant la pièce
# (le bord avant de la carrure, la tête devant les bracelets) repasse par-dessus.
# Sortie : film/NNN.png (RGBA, 1080 x 1920, l'axe des pièces au milieu de l'image).
import os, sys
import numpy as np
from PIL import Image, ImageFilter
import calques as C
import dispositions as D
from calques import pose, toile_vide, L, H
from detoure import alpha as cle_alpha, detoure

N_PLAN = 36       # images gardées par plan
N_ZOOM = 20       # l'approche finale
DX_AXE = 9        # l'axe des pièces (x = 531) ramené au milieu de l'image
os.makedirs("film", exist_ok=True)

K = [np.asarray(Image.open(f"c{k}.png").convert("RGB")).astype(np.float32) for k in range(7)]
KA = [np.load(f"c{k}_a.npy").astype(np.float32) for k in range(7)]
KC = [np.load(f"c{k}_c.npy").astype(np.float32) for k in range(7)]
yy, xx = C.yy, C.xx

BOUGE = {1: ["mouvement"], 2: ["fond", "couronne", "tige"], 3: ["cadran"], 4: ["aiguilles", "seconde"],
         5: ["verre", "lunette"], 6: ["sangle_h", "sangle_b"]}
# les pièces qui bougent ensemble (suivies d'un seul bloc)
BLOCS = {1: [["mouvement"]], 2: [["fond"], ["couronne", "tige"]], 3: [["cadran"]], 4: [["aiguilles"], ["seconde"]],
         5: [["verre"], ["lunette"]], 6: [["sangle_h"], ["sangle_b"]]}
# Les pièces que la vidéo rend mal (les aiguilles, trop fines ; le verre, transparent) : on pose leur calque exact, au
# rythme mesuré dans la vidéo ("sombre" : d'après leurs pixels sombres ; "comme q" : au rythme du bloc q, un peu devant ;
# "bout" : un bracelet, d'après son extrémité noire, son cuir se répète trop pour le suivre).
CALQUE = {4: {0: "sombre", 1: "sombre"}, 5: {0: "comme 1"}, 6: {0: "bout", 1: "bout"}}


def flou(m, r):
    return np.asarray(Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def morpho(m, r, f):
    return np.asarray(Image.fromarray((m > 0.5).astype(np.uint8) * 255).filter(f(2 * r + 1))) > 127


# --- ce qui passe devant la pièce qui bouge ------------------------------------------------------------------
def alpha_tete(couronne_poussee):
    t = toile_vide()
    pose("carrure", (0, 0), (0, D.DY), t)
    if couronne_poussee:
        pose("couronne", D.COURONNE_K1, (D.COURONNE_K1[0] - 80, D.COURONNE_K1[1] + D.DY), t)
    else:
        pose("tige", D.TIGE_K1, (D.TIGE_K1[0], D.TIGE_K1[1] + D.DY), t)
        pose("couronne", D.COURONNE_K1, (D.COURONNE_K1[0], D.COURONNE_K1[1] + D.DY), t)
    return t["a"]


bord_k0b = ((yy > D.b[None, :] + 1) | (xx < 372) | (xx > 690)) & (yy > 1150)
BORD = D.masque_ecran(bord_k0b.astype(np.float32))
carrure_seule = toile_vide(); pose("carrure", (0, 0), (0, D.DY), carrure_seule)
tete5 = KA[5] * ((yy > 1010) & (yy < 1345) & (xx > 270) & (xx < 830))
DEVANT = {1: alpha_tete(False) * BORD, 2: carrure_seule["a"] * (xx < 728), 3: alpha_tete(True) * BORD,
          4: None, 5: None, 6: tete5}


def accord(src, ref):
    p = []
    for c in range(3):
        a = src[::4, ::4, c].ravel(); b = ref[::4, ::4, c].ravel()
        A = np.stack([a, np.ones_like(a)], 1)
        p.append(np.linalg.lstsq(A, b, rcond=None)[0])
    return np.array(p)


def applique(img, p):
    return img * p[:, 0] + p[:, 1]


def ecart_fond(Fcc, Kimg, Ka, case=8, iters=600):
    """L'écart lisse entre le fond de la vidéo et la plaque, là où l'image clé est vide ; ailleurs, interpolé."""
    vide = ~morpho(Ka > 0.01, 5, ImageFilter.MaxFilter)
    r = (Fcc - Kimg) * vide[..., None]
    h, l = H // case, L // case
    somme = r[: h * case, : l * case].reshape(h, case, l, case, 3).sum((1, 3))
    n = vide[: h * case, : l * case].reshape(h, case, l, case).sum((1, 3))
    connu = n > case * case * 0.5
    m = np.where(connu[..., None], somme / np.maximum(n, 1)[..., None], 0)
    m[~connu] = m[connu].mean(0)
    for _ in range(iters):
        q = m.copy()
        q[1:-1, 1:-1] = 0.25 * (m[:-2, 1:-1] + m[2:, 1:-1] + m[1:-1, :-2] + m[1:-1, 2:])
        m = np.where(connu[..., None], m, q)
    return np.dstack([np.asarray(Image.fromarray(m[..., c].astype(np.float32), mode="F").resize((L, H), Image.BILINEAR)) for c in range(3)])


# --- suivre une pièce : sa forme est son calque, on cherche où elle est sur son trajet -----------------------------
def gradient4(lum):
    g = np.asarray(Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8)).resize((L // 4, H // 4), Image.BOX).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)
    gy, gx = np.gradient(g)
    return np.hypot(gx, gy)


def decale(a, dx, dy):
    """Décalage entier, rempli de zéros."""
    o = np.zeros_like(a)
    h, w = a.shape[:2]
    xs, xd = (0, dx) if dx >= 0 else (-dx, 0)
    ys, yd = (0, dy) if dy >= 0 else (-dy, 0)
    ww, hh = w - abs(dx), h - abs(dy)
    if ww > 0 and hh > 0:
        o[yd: yd + hh, xd: xd + ww] = a[ys: ys + hh, xs: xs + ww]
    return o


class Bloc:
    def __init__(self, noms):
        self.noms = noms
        t0 = toile_vide(); t1 = toile_vide()
        for n in noms:
            a = D.piece(n, "libre"); b = D.piece(n, "pose")
            for t, s in ((t0, a), (t1, b)):
                t["rgb"] = s["rgb"] + t["rgb"] * (1 - s["a"][..., None]); t["a"] = s["a"] + t["a"] * (1 - s["a"])
        self.rgb, self.a = t0["rgb"], t0["a"]
        # le trajet : de la place de départ à la place d'arrivée (une translation, à l'écran)
        ys0, xs0 = np.where(t0["a"] > 0.5); ys1, xs1 = np.where(t1["a"] > 0.5)
        self.dx, self.dy = xs1.mean() - xs0.mean(), ys1.mean() - ys0.mean()
        lum = (self.rgb / np.maximum(self.a[..., None], 1e-3)).mean(-1) * (self.a > 0.5)
        self.g = gradient4(lum)
        self.m = np.asarray(Image.fromarray((self.a * 255).astype(np.uint8)).resize((L // 4, H // 4), Image.BOX)) > 160

    def ou(self, F, cache):
        """La fraction du trajet où est la pièce dans l'image F (0 au départ, 1 à l'arrivée)."""
        if "g" not in cache:
            cache["g"] = gradient4(F.mean(-1))
        gv = cache["g"]
        meilleur, tm = -2, 0.0
        for t in np.linspace(0, 1, 101):
            ddx, ddy = int(round(t * self.dx / 4)), int(round(t * self.dy / 4))
            m = decale(self.m, ddx, ddy)
            if m.sum() < 30:
                continue
            a = decale(self.g, ddx, ddy)[m]; b = gv[m]
            a = a - a.mean(); b = b - b.mean()
            v = (a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-6)
            if v > meilleur:
                meilleur, tm = v, t
        return tm

    def rgba(self, t):
        """Le calque de la pièce (prémultiplié) à la fraction t de son trajet : reposé à cette place (un bracelet long
        entre dans l'image en descendant, un simple décalage de l'image de départ le couperait)."""
        t = float(min(1.0, max(0.0, t)))
        if getattr(self, "_t", None) != t:
            toile = toile_vide()
            for n in self.noms:
                if n in ("couronne", "tige"):
                    c = D.COURONNE_K1 if n == "couronne" else D.TIGE_K1
                    pose(n, c, (c[0] - 80 * t, c[1] + D.DY), toile)
                else:
                    a, b = D.LIBRE[n], D.POSE[n]
                    pose(n, D.SOURCE[n]["c"], (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), toile)
            self._t, self._r = t, (toile["rgb"], toile["a"])
        return self._r

    def a_a(self, t):
        """L'alpha de la pièce à la fraction t de son trajet."""
        return self.rgba(t)[1]


def sortie(n, c, a):
    rgba = np.dstack([np.clip(c, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    o = Image.new("RGBA", (L, H), (0, 0, 0, 0))
    o.paste(Image.fromarray(rgba, "RGBA"), (DX_AXE, 0))
    o.save(f"film/{n:03d}.png")


def plan(k, debut):
    dossier = f"plans/s{k}"
    noms = sorted(os.listdir(dossier))
    F0 = np.asarray(Image.open(os.path.join(dossier, noms[0])).convert("RGB")).astype(np.float32)
    F1 = np.asarray(Image.open(os.path.join(dossier, noms[-1])).convert("RGB")).astype(np.float32)
    p0 = accord(F0, K[k - 1]); p1 = accord(F1, K[k])
    e0 = ecart_fond(applique(F0, p0), K[k - 1], KA[k - 1]); e1 = ecart_fond(applique(F1, p1), K[k], KA[k])
    # le décor fixe du plan : l'image clé sans les pièces qui bougent
    fixe = D.image(k - 1, sauf=set(BOUGE[k]))
    fa = fixe["a"]; frgbp = fixe["rgb"]
    blocs = [Bloc(b) for b in BLOCS[k]]
    O = DEVANT[k]
    idx = np.round(np.linspace(0, len(noms) - 1, N_PLAN + 1)).astype(int)[1:]
    # la position de chaque bloc, image par image ; elle ne recule pas
    images, positions = [], []
    for i in idx[:-1]:
        t = i / (len(noms) - 1)
        F = applique(np.asarray(Image.open(os.path.join(dossier, noms[i])).convert("RGB")).astype(np.float32), (1 - t) * p0 + t * p1)
        cache = {}
        images.append((t, F)); positions.append([b.ou(F, cache) for b in blocs])
    pos = np.maximum.accumulate(np.array(positions), axis=0)
    regles = CALQUE.get(k, {})
    if "sombre" in regles.values():
        # les aiguilles : le centre de leurs pixels sombres, là où la vidéo s'écarte du décor fixe
        S = frgbp + C.P * (1 - fa[..., None])
        qs = [q for q, r in regles.items() if r == "sombre"]
        a0 = np.maximum.reduce([blocs[q].a for q in qs])
        ys0 = np.where(a0 > 0.5)[0]; y0 = ys0.mean(); dy = blocs[qs[0]].dy
        xs0 = np.where(a0 > 0.5)[1]
        zone_y0, zone_y1 = int(ys0.min() - 20), int(ys0.max() + dy + 20)
        zone_x0, zone_x1 = int(xs0.min() - 30), int(xs0.max() + 30)
        brut = []
        for (t, F) in images:
            z = (slice(zone_y0, zone_y1), slice(zone_x0, zone_x1))
            sombre = (np.abs(F[z] - S[z]).max(-1) > 40) & (F[z].mean(-1) < 110) & (S[z].mean(-1) > 130)
            ys = np.where(sombre)[0]
            brut.append(((ys.mean() + zone_y0) - y0) / dy if len(ys) > 20 else np.nan)
        brut = np.array(brut)
        ok = ~np.isnan(brut)
        brut = np.interp(np.arange(len(brut)), np.where(ok)[0], brut[ok]) if ok.any() else np.linspace(0, 1, len(brut))
        lisse = np.maximum.accumulate(np.clip(np.convolve(np.pad(brut, 2, mode="edge"), np.ones(5) / 5, "valid"), 0, 1))
        for q in qs:
            pos[:, q] = lisse
    tete_haut, tete_bas = 1035, 1335          # la tête, à l'écran : les bracelets s'arrêtent à ses bords
    for q, r in regles.items():
        if r != "bout":
            continue
        b = blocs[q]
        ys, xs = np.where(b.a > 0.5)
        x0, x1 = xs.min() + 15, xs.max() - 15
        brut = []
        for (t, F) in images:
            sombre = F[:, x0:x1].mean(-1) < 60
            lignes = np.where(sombre.mean(1) > 0.5)[0]
            if b.dy > 0:      # il descend : son bout est sa ligne noire la plus basse au-dessus de la tête
                lignes = lignes[lignes < tete_haut]
                brut.append((lignes.max() - ys.max()) / b.dy if len(lignes) else np.nan)
            else:             # il monte : son bout est sa ligne noire la plus haute sous la tête
                lignes = lignes[lignes > tete_bas]
                brut.append((lignes.min() - ys.min()) / b.dy if len(lignes) else np.nan)
        brut = np.array(brut); ok = ~np.isnan(brut)
        brut = np.interp(np.arange(len(brut)), np.where(ok)[0], brut[ok])
        lisse = np.convolve(np.pad(brut, 2, mode="edge"), np.ones(5) / 5, "valid")
        pos[:, q] = np.maximum.accumulate(np.clip(lisse, 0, 1))
        # près de la tête, le bout passe derrière elle et ne se mesure plus : on finit le trajet en douceur
        t_sat = ((tete_haut - ys.max()) / b.dy if b.dy > 0 else (tete_bas - ys.min()) / b.dy) - 0.04
        fin = int(np.argmax(pos[:, q] >= t_sat)) if (pos[:, q] >= t_sat).any() else len(pos) - 1
        pos[fin:, q] = np.minimum(1.0, pos[fin, q] + (1 - pos[fin, q]) * np.linspace(0, 1, len(pos) - fin) ** 0.7)
    for q, r in regles.items():
        if r.startswith("comme"):
            pos[:, q] = np.minimum(1.0, pos[:, int(r.split()[1])] * 1.08)
    print("plan", k, "positions", [np.round(pos[:, q], 2).tolist() for q in range(len(blocs))], flush=True)
    video = [q for q in range(len(blocs)) if q not in regles]
    for j, (t, F) in enumerate(images):
        # le décor fixe, puis les pièces posées d'après leur calque
        rgbp, a = frgbp.copy(), fa.copy()
        for q in regles:
            nom = BLOCS[k][q][0]
            c_, a_ = blocs[q].rgba(pos[j, q])
            if nom == "verre":
                # le verre flottant est entier ; posé, il ne garde que ses reflets (comme dans l'image clé)
                s = min(1.0, max(0.0, (pos[j, q] - 0.8) / 0.2)); op = 1 - 0.4 * s * s * (3 - 2 * s)
                c_, a_ = c_ * op, a_ * op
            rgbp = c_ + rgbp * (1 - a_[..., None]); a = a_ + a * (1 - a_)
        if video:
            a_v, Pl = cle_alpha(F, plaque=C.P + (1 - t) * e0 + t * e1, reboucher=False)
            c_v = detoure(F, a_v, Pl)
            prior = np.zeros((H, L), np.float32)
            for q in video:
                prior = np.maximum(prior, blocs[q].a_a(pos[j, q]))
            zone = flou(morpho(prior > 0.05, 8, ImageFilter.MaxFilter).astype(np.float32), 2)
            plein = morpho(prior > 0.95, 10, ImageFilter.MinFilter).astype(np.float32)
            a_m = np.maximum(a_v, plein) * zone
            # là où le calque rebouche, la couleur est celle de la vidéo telle quelle
            c_v = np.where((plein > a_v)[..., None], F, c_v)
            # la pièce de la vidéo sur le reste, puis ce qui passe devant
            rgbp = c_v * a_m[..., None] + rgbp * (1 - a_m[..., None])
            a = a_m + a * (1 - a_m)
        if O is not None:
            rgbp = KC[k - 1] * O[..., None] + rgbp * (1 - O[..., None])
            a = O + a * (1 - O)
        sortie(debut + j + 1, rgbp / np.maximum(a[..., None], 1e-3), a)
    sortie(debut + N_PLAN, KC[k], KA[k])
    print("plan", k, "->", debut + N_PLAN, flush=True)


def zoom(debut):
    """La caméra s'approche : la tête vient vers le milieu de l'image, un peu plus grande."""
    cx, cy = 531.0, 1184.0
    tx, ty = 531.0, 1000.0
    rgbp = np.dstack([KC[6] * KA[6][..., None], KA[6] * 255]).astype(np.float32)
    for j in range(1, N_ZOOM + 1):
        t = j / N_ZOOM
        e = t * t * (3 - 2 * t)
        s = 1 + 0.14 * e
        ox, oy = cx + (tx - cx) * e, cy + (ty - cy) * e
        inv = (1 / s, 0, cx - ox / s, 0, 1 / s, cy - oy / s)
        canaux = [np.asarray(Image.fromarray(rgbp[..., q], mode="F").transform((L, H), Image.AFFINE, inv, resample=Image.BICUBIC)) for q in range(4)]
        a = np.clip(canaux[3] / 255, 0, 1)
        sortie(debut + j, np.dstack(canaux[:3]) / np.maximum(a[..., None], 1e-3), a)
    print("approche ->", debut + N_ZOOM)


if __name__ == "__main__":
    quoi = sys.argv[1:] or ["0", "1", "2", "3", "4", "5", "6", "z"]
    if "0" in quoi:
        sortie(0, KC[0], KA[0])
    for k in range(1, 7):
        if str(k) in quoi:
            plan(k, (k - 1) * N_PLAN)
    if "z" in quoi:
        zoom(6 * N_PLAN)
