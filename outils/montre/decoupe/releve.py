# La montre qui se relève : le morphing de la pile (A, photographiée dans la page au début de la relève) à la photo de
# trois quarts (B). Les correspondances donnent une spline de plaque mince (TPS), évaluée sur une grille, dépliée là où
# elle se replierait, puis écrite pour la page :
#   stalika/public/montre/releve.bin       les déplacements de la grille (Int16, 1/16 de pixel d'éclaté)
#   stalika/public/montre/releve-pile.webp la pile photographiée (la texture A)
#   stalika/lib/montre-photo-releve.ts     la zone, la grille, la place des deux textures
# Avant : node photographier-pile.mjs (le site tourne en local), qui écrit sortie/releve-pile.png.
#   python releve.py points     relève les correspondances (releve_points.py) sur la pile du moment et les gèle dans
#                               releve-points.json : la suite ne dépend plus de la pile (les bracelets en sont refaits)
#   python releve.py            l'export, d'après les correspondances gelées
#   python releve.py --essais   et des images d'essai dans sortie/ : l'anaglyphe (A déformé contre B) et la mi-course
# L'ordre complet est dans le LISEZMOI (« La montre qui se relève »).
import io, json, math, os, struct, sys
import numpy as np
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
STALIKA = os.path.join(ICI, "..", "..", "..", "stalika")
SORTIE = os.path.join(ICI, "sortie")
sys.path.insert(0, ICI)
import releve_points as RP

ZX, ZY, ZL, ZH = RP.ZX, RP.ZY, 490, 900   # la toile du morphing, en pixels d'éclaté
E = RP.E                                  # A et B : 2 px par pixel d'éclaté
PILE = (250, 850, 490, 630)               # la pile photographiée : sa zone dans l'éclaté
NX, NY = 71, 129                          # la grille : 70 × 128 cellules
LAMBDA = 0.002                            # le lissage de la spline (unités normalisées)
UNITE = 100.0
POINTS = os.path.join(ICI, "releve-points.json")
# la photo de trois quarts publiée, et sa place dans l'éclaté : le centre de sa lunette (461, 652) sur celui de la carrure
# (462, 1070), son rayon (342) sur celui de la carrure (182)
PHOTO = os.path.join(STALIKA, "public", "montre", "trois-quarts.webp")
PHOTO_ECHELLE = 182 / 342
PHOTO_X = 462 + (116 - 461) * PHOTO_ECHELLE
PHOTO_Y = 1070 + (0 - 652) * PHOTO_ECHELLE

# --- A et B, dans le repère de la toile -------------------------------------------------------------------------------
def preparer():
    pile = Image.open(os.path.join(SORTIE, "releve-pile.png")).convert("RGBA")
    A = Image.new("RGBA", (ZL * E, ZH * E), (0, 0, 0, 0))
    A.paste(pile, ((PILE[0] - ZX) * E, (PILE[1] - ZY) * E))
    # B : la photo de trois quarts, telle que la page la publie, posée comme dans la page (lib/montre-photo.ts,
    # PHOTO_TROIS_QUARTS)
    tq = Image.open(PHOTO).convert("RGBA")
    s, x0, y0 = PHOTO_ECHELLE, PHOTO_X, PHOTO_Y
    B = tq.transform((ZL * E, ZH * E), Image.AFFINE, (1 / (E * s), 0, (ZX - x0) / s, 0, 1 / (E * s), (ZY - y0) / s), resample=Image.BICUBIC)
    A.save(os.path.join(SORTIE, "releve-A.png"))
    B.save(os.path.join(SORTIE, "releve-B.png"))
    return os.path.join(SORTIE, "releve-A.png"), os.path.join(SORTIE, "releve-B.png")

# --- la spline ---------------------------------------------------------------------------------------------------------
def U(r):
    with np.errstate(divide="ignore", invalid="ignore"):
        v = r * r * np.log(r)
    return np.where(r > 0, v, 0.0)

def tps(src, dst, lam):
    s = np.asarray(src, float) / UNITE
    t = np.asarray(dst, float) / UNITE
    n = len(s)
    L = np.zeros((n + 3, n + 3))
    L[:n, :n] = U(np.linalg.norm(s[:, None] - s[None], axis=-1)) + lam * np.eye(n)
    P = np.hstack([np.ones((n, 1)), s])
    L[:n, n:] = P
    L[n:, :n] = P.T
    Y = np.zeros((n + 3, 2))
    Y[:n] = t
    W = np.linalg.solve(L, Y)
    def appliquer(pts):
        p = np.asarray(pts, float) / UNITE
        out = np.empty_like(p)
        for i in range(0, len(p), 20000):
            q = p[i:i + 20000]
            out[i:i + 20000] = U(np.linalg.norm(q[:, None] - s[None], axis=-1)) @ W[:n] + np.hstack([np.ones((len(q), 1)), q]) @ W[n:]
        return out * UNITE
    return appliquer

# --- la grille, dépliée ------------------------------------------------------------------------------------------------
def aires(Q):
    a, b, c, d = Q[:-1, :-1], Q[:-1, 1:], Q[1:, :-1], Q[1:, 1:]
    def x(p, q, r): return (q[..., 0] - p[..., 0]) * (r[..., 1] - p[..., 1]) - (r[..., 0] - p[..., 0]) * (q[..., 1] - p[..., 1])
    return x(a, b, c), x(b, d, c)

def deplier(Q, aire_ref, seuil=0.04, tours=4000):
    """Relâche (moyenne des voisins) les sommets des triangles retournés ou presque plats, jusqu'à ce qu'il n'y en ait plus."""
    Q = Q.copy()
    for k in range(tours):
        t1, t2 = aires(Q)
        mauvais = (t1 < seuil * aire_ref) | (t2 < seuil * aire_ref)
        if not mauvais.any():
            return Q, k
        m = np.zeros(Q.shape[:2], bool)
        i, j = np.nonzero(mauvais)
        for di in (0, 1):
            for dj in (0, 1):
                m[i + di, j + dj] = True
        # un anneau de plus, pour que le dépliage se répartisse
        m2 = m.copy()
        m2[1:] |= m[:-1]; m2[:-1] |= m[1:]; m2[:, 1:] |= m[:, :-1]; m2[:, :-1] |= m[:, 1:]
        m2[0, :] = m2[-1, :] = m2[:, 0] = m2[:, -1] = False
        moy = (np.roll(Q, 1, 0) + np.roll(Q, -1, 0) + np.roll(Q, 1, 1) + np.roll(Q, -1, 1)) / 4
        Q[m2] = 0.5 * Q[m2] + 0.5 * moy[m2]
    raise SystemExit("la grille ne se déplie pas")

def grille_D():
    """Les déplacements de la grille, tels que la page les lit (releve.bin)."""
    q = np.fromfile(os.path.join(STALIKA, "public", "montre", "releve.bin"), dtype="<i2").astype(np.float32) / 16
    return q.reshape(NY, NX, 2)

def main():
    nomA, nomB = preparer()
    if "points" in sys.argv[1:]:
        P = RP.toutes(nomA, nomB)
        json.dump([[round(v, 2) for v in q] for q in P], open(POINTS, "w"), separators=(",", ":"))
        print(len(P), "correspondances gelées dans releve-points.json")
        return
    P = [tuple(q) for q in json.load(open(POINTS))]
    T = tps([(a, b) for a, b, c, d in P], [(c, d) for a, b, c, d in P], LAMBDA)
    xs = np.linspace(ZX, ZX + ZL, NX)
    ys = np.linspace(ZY, ZY + ZH, NY)
    gx, gy = np.meshgrid(xs, ys)
    G = np.stack([gx, gy], -1)
    Q = T(G.reshape(-1, 2)).reshape(NY, NX, 2)
    aire_ref = (xs[1] - xs[0]) * (ys[1] - ys[0]) / 2
    t1, t2 = aires(Q)
    print(len(P), "points ;", int(((t1 <= 0) | (t2 <= 0)).sum()), "cellules retournées avant dépliage")
    Q2, tours = deplier(Q, aire_ref)
    ecart = np.linalg.norm(Q2 - Q, axis=-1)
    print("dépliée en", tours, "tours ; déplacement max", round(float(ecart.max()), 2), "px")
    D = Q2 - G
    print("déplacements de", round(float(D.min()), 1), "à", round(float(D.max()), 1), "px")
    q = np.round(D * 16).astype("<i2")
    assert np.abs(D * 16).max() < 32767
    with open(os.path.join(STALIKA, "public", "montre", "releve.bin"), "wb") as f:
        f.write(q.tobytes())
    Image.open(os.path.join(SORTIE, "releve-pile.png")).save(os.path.join(STALIKA, "public", "montre", "releve-pile.webp"), quality=90, method=6)
    ts = f'''/* La montre qui se relève (components/ui/montre-photo.tsx) : le morphing de la pile, photographiée dans la page au début
   de la relève (public/montre/releve-pile.webp), à la photo de trois quarts. Une grille de {NX} × {NY} sommets sur la toile ;
   pour chaque sommet, son déplacement de la pile à la photo (public/montre/releve.bin : Int16, x puis y, en 1/16 de pixel
   d'éclaté, rangée par rangée). Écrit par l'outil de découpe (outils/montre/decoupe/releve.py) : ne pas modifier à la main. */
import type {{ Zone }} from "@/lib/morphing";

export const RELEVE: {{ zone: Zone; pile: Zone; grille: {{ nx: number; ny: number; fichier: string }} }} = {{
  zone: {{ x: {ZX}, y: {ZY}, l: {ZL}, h: {ZH} }},
  pile: {{ x: {PILE[0]}, y: {PILE[1]}, l: {PILE[2]}, h: {PILE[3]} }},
  grille: {{ nx: {NX}, ny: {NY}, fichier: "/montre/releve.bin" }},
}};
'''
    io.open(os.path.join(STALIKA, "lib", "montre-photo-releve.ts"), "w", encoding="utf-8", newline="\n").write(ts)
    print("écrit : releve.bin, releve-pile.webp, montre-photo-releve.ts")
    if "--essais" in sys.argv:
        essais(nomA, nomB, G, D)

# --- les images d'essai : le rendu de la page, ici (même grille, interpolée) -------------------------------------------
def essais(nomA, nomB, G, D):
    def charger(nom):
        I = np.asarray(Image.open(nom).convert("RGBA")).astype(np.float32) / 255
        I = I.copy(); I[..., :3] *= I[..., 3:4]
        return I
    A, B = charger(nomA), charger(nomB)
    H, W = A.shape[:2]
    px = (G[0, 1, 0] - G[0, 0, 0]); py = (G[1, 0, 1] - G[0, 0, 1])
    def champ(X, Y):
        u = np.clip((X - ZX) / px, 0, NX - 1.001); v = np.clip((Y - ZY) / py, 0, NY - 1.001)
        u0, v0 = u.astype(int), v.astype(int); fu, fv = (u - u0)[..., None], (v - v0)[..., None]
        return D[v0, u0] * (1 - fu) * (1 - fv) + D[v0, u0 + 1] * fu * (1 - fv) + D[v0 + 1, u0] * (1 - fu) * fv + D[v0 + 1, u0 + 1] * fu * fv
    def lire(I, X, Y):
        u = (X - ZX) * E - 0.5; v = (Y - ZY) * E - 0.5
        dehors = (u < -0.5) | (v < -0.5) | (u > W - 0.5) | (v > H - 0.5)
        u = np.clip(u, 0, W - 1.001); v = np.clip(v, 0, H - 1.001)
        u0, v0 = u.astype(int), v.astype(int); fu, fv = (u - u0)[..., None], (v - v0)[..., None]
        c = I[v0, u0] * (1 - fu) * (1 - fv) + I[v0, u0 + 1] * fu * (1 - fv) + I[v0 + 1, u0] * (1 - fu) * fv + I[v0 + 1, u0 + 1] * fu * fv
        c[dehors] = 0
        return c
    yy, xx = np.mgrid[0:H, 0:W]
    QX, QY = ZX + (xx + 0.5) / E, ZY + (yy + 0.5) / E
    def inverser(g, n=50):
        PX, PY = QX.copy(), QY.copy()
        for _ in range(n):
            d = champ(PX, PY)
            PX += 0.6 * (QX - (PX + g * d[..., 0])); PY += 0.6 * (QY - (PY + g * d[..., 1]))
        return PX, PY
    fond = np.array([0.16, 0.24, 0.36])
    sinus = lambda t: -(math.cos(math.pi * t) - 1) / 2
    for q in (0.25, 0.5, 0.75):
        g, w = sinus(q), sinus(min(1, max(0, (q - 0.12) / 0.76)))
        PX, PY = inverser(g)
        d = champ(PX, PY)
        c = lire(A, PX, PY) * (1 - w) + lire(B, PX + d[..., 0], PY + d[..., 1]) * w
        rgb = c[..., :3] + fond * (1 - c[..., 3:4])
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(SORTIE, f"releve-{int(q * 100):03d}.png"))
    PX, PY = inverser(1.0, 70)
    ca = lire(A, PX, PY)
    la = ca[..., :3].mean(-1) + (1 - ca[..., 3]) * 0.25
    lb = B[..., :3].mean(-1) + (1 - B[..., 3]) * 0.25
    Image.fromarray((np.clip(np.stack([la, lb, lb], -1), 0, 1) * 255).astype(np.uint8)).save(os.path.join(SORTIE, "releve-anaglyphe.png"))
    print("images d'essai : sortie/releve-025.png, -050, -075, releve-anaglyphe.png")

if __name__ == "__main__":
    main()
