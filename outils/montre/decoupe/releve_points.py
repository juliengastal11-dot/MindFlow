# Les correspondances de la relève (releve.py), de la pile (A) à la photo de trois quarts (B), en pixels d'éclaté. Chaque point est un
# même détail dans les deux images, relevé à la loupe ou sur les profils de luminance (le flanc, la boucle).
import math, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cornes import deplacement

def corne(x, y):
    """Un point des cornes du boîtier, relevé dans la vue éclatée d'origine : où il est une fois les cornes resserrées."""
    return x + float(deplacement(x, y)), y

ZX, ZY, E = 250, 700, 2

def profils(nom):
    a = np.asarray(Image.open(nom).convert("RGBA"))[..., 3] > 127
    g, d = {}, {}
    for r in range(a.shape[0]):
        xs = np.nonzero(a[r])[0]
        if len(xs):
            y = ZY + (r + 0.5) / E
            g[r] = (ZX + (xs[0] + 0.5) / E, y)
            d[r] = (ZX + (xs[-1] + 0.5) / E, y)
    return g, d

def bord(profil, y):
    r = int(round((y - ZY) * E - 0.5))
    while r not in profil and r > 0: r -= 1
    return profil[r][0]

def silhouette(nomA, nomB, troncons, pas=6):
    """Les bords gauche et droit : chaque tronçon (yA0, yA1, yB0, yB1) se correspond par proportion de hauteur."""
    gA, dA = profils(nomA)
    gB, dB = profils(nomB)
    out = []
    for (a0, a1, b0, b1, cotes) in troncons:
        n = max(2, int(abs(a1 - a0) / pas) + 1)
        for k in range(n):
            t = k / (n - 1)
            ya, yb = a0 + (a1 - a0) * t, b0 + (b1 - b0) * t
            if "g" in cotes: out.append((bord(gA, ya), ya, bord(gB, yb), yb))
            if "d" in cotes: out.append((bord(dA, ya), ya, bord(dB, yb), yb))
    return out

def ellipse(ea, eb, n, de=0.0, arcs=None):
    out = []
    for k in range(n):
        t = de + 2 * math.pi * k / n
        if arcs and not any(a <= (t % (2 * math.pi)) <= b for a, b in arcs): continue
        out.append((ea[0] + ea[2] * math.cos(t), ea[1] + ea[3] * math.sin(t), eb[0] + eb[2] * math.cos(t), eb[1] + eb[3] * math.sin(t)))
    return out

def le_long(a0, a1, b0, b1, fractions):
    return [(a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f, b0[0] + (b1[0] - b0[0]) * f, b0[1] + (b1[1] - b0[1]) * f) for f in fractions]

# les tronçons de la silhouette (relevés sur les profils des deux images)
TRONCONS = [
    (902, 968, 770, 928, "gd"),      # le bracelet du haut, jusqu'aux cornes
    (982, 1050, 942, 1050, "gd"),    # les cornes du haut, jusqu'au flanc de la carrure
    (1056, 1116, 1056, 1114, "g"),   # le flanc gauche, au plus large
    (1056, 1116, 1056, 1114, "d"),   # la couronne
    (1122, 1222, 1120, 1250, "gd"),  # le flanc, jusqu'au bout des cornes du bas
    (1234, 1284, 1262, 1432, "gd"),  # le bracelet du bas
    (1292, 1352, 1440, 1484, "gd"),  # le passant
    (1362, 1446, 1492, 1576, "gd"),  # la boucle
]

# la lunette (bord extérieur) et le bord du cadran (bord intérieur de la lunette), concentriques
LUNETTE_A, LUNETTE_B = (462, 1066, 182, 83), (462, 1067, 182, 121)
CADRAN_A, CADRAN_B = (465, 1064, 160, 63), (469.5, 1066.5, 158.5, 103.5)

def interieur():
    p = []
    # la lunette, sauf au pied des cornes du haut (les cornes n'y sont pas au même angle dans les deux images)
    p += ellipse(LUNETTE_A, LUNETTE_B, 24, arcs=[(0, 3.6), (4.45, 4.98), (5.75, 6.3)])
    p += ellipse(CADRAN_A, CADRAN_B, 24, de=math.pi / 24)
    # les index des heures visibles dans les deux images (4, 5, 6, 7, 8 sont sous la lunette dans la pile ; 10 est sous la
    # pointe de l'aiguille des minutes dans la pile, à côté dans la photo : on suit l'aiguille)
    p += [(459.5, 1016, 467, 986), (528, 1029, 530, 997), (562, 1050, 575, 1025), (588, 1080, 592, 1071),
          (342, 1080, 340, 1071), (400, 1029, 402, 997)]
    # le pivot, la petite seconde, le nom
    p += [(460, 1075, 465, 1061), (459, 1113, 465, 1116), (461, 1047, 466, 1020), (430, 1047.5, 432, 1020), (493, 1047.5, 499, 1020),
          (462, 1055.5, 466, 1030.5)]
    # le cercle de la petite seconde (son bas est sous la lunette, dans la pile)
    p += ellipse((459, 1113, 44, 20), (465.5, 1116.5, 41.5, 31.5), 12, arcs=[(0, 0.7), (2.44, 6.3)])
    # les aiguilles, sur leur longueur (les plus visibles : sombres sur le cadran clair)
    p += [(420, 1065, 437.6, 1049.8), (381, 1054, 410.2, 1038.6), (340, 1046, 382, 1027),
          (493, 1065, 503.6, 1044.5), (527, 1054, 542.2, 1030), (561, 1043.5, 582, 1016.5)]
    # les cornes : leurs coins, côté bracelet et côté dehors (relevés dans la vue éclatée d'origine, puis resserrés comme
    # le boîtier, cornes.py)
    coins = [((306, 973), (361, 940)), ((326, 971), (378, 938)), ((301, 990), (354, 952)), ((331, 998), (377, 958)),   # haut, à gauche
             ((592, 973), (551, 939)), ((612, 976), (565, 941)), ((591, 998), (551, 960)), ((621, 998), (575, 955)),   # haut, à droite
             ((320, 1222), (340, 1256)), ((340, 1222), (358, 1256)),                                                   # bas, à gauche
             ((583, 1221), (570, 1256)), ((600, 1221), (586, 1256)),                                                   # bas, à droite
             # la face intérieure des cornes du bas
             ((345, 1150), (356, 1192)), ((345, 1190), (347, 1232)), ((580, 1150), (568, 1192)), ((580, 1190), (574, 1232))]
    p += [(*corne(*a), *b) for a, b in coins]
    # le flanc, entre les cornes du bas (profils de luminance) : le reflet sombre de la lunette, le bas de la lunette, le
    # flanc de la carrure (qu'on ne voit presque plus de trois quarts), le haut du bracelet
    for x in (400, 430, 462, 495, 525):
        p += [(x, 1139, x, 1183), (x, 1155, x, 1191), (x, 1173, x, 1196), (x, 1198, x, 1198.5), (x, 1204, x, 1201)]
    # le bracelet du haut, au milieu
    p += [(462, 930, 462, 850), (462, 975, 462, 940)]
    # le passant et la boucle (profils de luminance)
    p += [(462, 1306, 462, 1448), (462, 1336, 462, 1484),
          (400, 1362, 400, 1495), (520, 1362, 520, 1495), (459, 1362, 462, 1494), (459, 1405, 462, 1530),
          (420, 1438, 420, 1570), (500, 1438, 500, 1570), (430, 1449, 430, 1582), (490, 1449, 490, 1582)]
    return p

def toutes(nomA, nomB):
    return silhouette(nomA, nomB, TRONCONS) + interieur()
