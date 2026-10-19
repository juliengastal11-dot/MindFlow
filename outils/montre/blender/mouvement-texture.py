# Le mouvement de Tripo : sa texture cuite (textures/mouvement-tripo-couleur.jpg, sortie du GLB) teintée par saturation :
# le crème devient de l'acier gris, l'or et les rubis restent et se renforcent ; et une carte de rugosité par matière.
#   python mouvement-texture.py   -> textures/mvt-base.png, textures/mvt-rugosite.png
import os
import numpy as np
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__))
b = np.asarray(Image.open(os.path.join(ICI, "textures", "mouvement-tripo-couleur.jpg")).convert("RGB")).astype(np.float32) / 255
mx = b.max(-1); mn = b.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-3); lum = b.mean(-1)
w = np.clip((sat - 0.13) / 0.2, 0, 1); w = w * w * (3 - 2 * w)
gris = (lum * 0.8)[..., None] * np.array([0.97, 0.99, 1.03])
chaud = np.clip(b * 1.08 + (b - lum[..., None]) * 0.35, 0, 1)
out = gris * (1 - w[..., None]) + chaud * w[..., None]
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(os.path.join(ICI, "textures", "mvt-base.png"))
Image.fromarray(((0.34 - 0.14 * w) * 255).astype(np.uint8)).save(os.path.join(ICI, "textures", "mvt-rugosite.png"))
print("mouvement : textures écrites")
