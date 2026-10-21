# Le cuir alligator des bracelets : une tuile sans couture (par miroirs) tirée du bracelet de la photo de trois quarts, et
# son relief (les écailles bombées sont claires, les sillons sombres).
#   python cuir.py   -> textures/cuir-couleur.png, textures/cuir-relief.png
import os
import numpy as np
from PIL import Image, ImageFilter
ICI = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ICI, "textures"), exist_ok=True)
im = Image.open(os.path.join(ICI, "..", "Montre dorée Stalika.png")).convert("RGB")
# une zone régulière du bracelet du bas, loin des bords (pixels de la photo)
c = np.asarray(im.crop((330 + 38, 1060 + 60, 330 + 238, 1060 + 300))).astype(np.float32)
# égaliser la clarté (la photo a un dégradé) : on retire la basse fréquence
lo = np.asarray(Image.fromarray(c.astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))).astype(np.float32)
t = Image.fromarray(np.clip(c - lo + lo.mean((0, 1)), 0, 255).astype(np.uint8))
w, h = t.size
tuile = Image.new("RGB", (2 * w, 2 * h))
tuile.paste(t, (0, 0)); tuile.paste(t.transpose(Image.FLIP_LEFT_RIGHT), (w, 0))
tuile.paste(t.transpose(Image.FLIP_TOP_BOTTOM), (0, h)); tuile.paste(t.transpose(Image.ROTATE_180), (w, h))
tuile = tuile.resize((1024, 1024), Image.LANCZOS)
tuile.save(os.path.join(ICI, "textures", "cuir-couleur.png"))
g = np.asarray(tuile.convert("L")).astype(np.float32)
g = (g - g.min()) / (g.max() - g.min())
Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(ICI, "textures", "cuir-relief.png"))
print("cuir : tuile", tuile.size)
