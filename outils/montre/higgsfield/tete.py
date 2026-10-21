# La tête de la montre (la carrure, sa couronne), d'après les deux rendus GPT Image de sources/ :
#   g1b.png : la vue éclatée, le mouvement posé dans la carrure ; e0.png : la même, la carrure vide.
# Elle est posée sur la vue éclatée (le mouvement flottant et l'ancienne carrure effacés) :
#   k1.png (la tête avec son mouvement), tete_vide.png (la tête vide), dont calques.py découpe la carrure.
import numpy as np
from outil import charge, ecrit, deplace, dilate, erode, fusionne, grain

K0 = charge("k0.png"); G = charge("g1b.png"); E = charge("e0.png")
fG = np.load("fond_G.npy"); fE = np.load("fond_E.npy")
mK0 = np.load("fg_K0.npy"); mG = np.load("fg_G.npy")
P = np.load("plaque_K0.npy")
yy, xx = np.mgrid[0:1920, 0:1080]

# e0 recalé sur g1b (mesuré : un pixel plus haut), et la tête descendue de DY sur la vue éclatée
Ea = deplace(E, 1.0, 0, -1); fEa = deplace(fE, 1.0, 0, -1)
DY = 20
tete = lambda a, fa: deplace(a - fa + 128, 1, 0, DY) - 128 + P
Gt = tete(G, fG); Et = tete(Ea, fEa)
mGt = deplace(mG.astype(np.float32) * 255, 1, 0, DY) > 127
boite = (yy >= 1060 + DY) & (yy <= 1398 + DY) & (xx >= 270) & (xx <= 920)

# le mouvement flottant et l'ancienne carrure de la vue éclatée : effacés (le fond seul, avec son grain)
Pg = P + grain(P.shape, 1.2, 7)
efface = ((yy >= 836) & (yy <= 1402) & (xx >= 150) & (xx <= 1000)) & (yy >= 846)
efface |= dilate(mK0 & (yy >= 834) & (yy <= 1402) & (xx >= 150) & (xx <= 1000) & ~((yy < 838) & (np.abs(xx - 530) < 240)), 5)
base = fusionne(K0, Pg, efface, plume=2.5)

# la tête avec son mouvement, puis vide : seul l'intérieur de la carrure change
masque = dilate(mGt & boite, 3)
K1 = fusionne(base, Gt, masque, plume=1.5)
ecrit(K1, "k1.png")
interieur = dilate(erode(dilate((np.abs(Et - Gt).max(-1) > 18) & boite & masque, 4), 6), 3)
ecrit(fusionne(K1, Et, interieur, plume=2), "tete_vide.png")
print("tête : k1.png, tete_vide.png")
