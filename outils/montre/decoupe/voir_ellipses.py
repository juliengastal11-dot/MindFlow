import json, os, sys
from PIL import Image, ImageDraw
ICI = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(ICI, "..", "Montre Stalika en éclaté luxueux.png")).convert("RGB")
# les ellipses relevées à la main (ellipses.json) tracées sur la vue éclatée, pour les vérifier
E = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "ellipses.json")))
os.makedirs(os.path.join(ICI, "sortie"), exist_ok=True)
k = 1
dr = ImageDraw.Draw(src)
cols = [(255, 0, 0), (0, 150, 255), (0, 200, 0), (255, 0, 255), (255, 140, 0), (0, 0, 0), (120, 0, 200)]
for i, (nom, (cx, cy, a, b)) in enumerate(E.items()):
    c = cols[i % len(cols)]
    dr.ellipse([cx - a, cy - b, cx + a, cy + b], outline=c, width=2)
    dr.text((cx + a + 6, cy - 6), nom, fill=c)
for nom, box in {"haut": (250, 130, 700, 420), "milieu": (250, 490, 700, 1000), "bas": (230, 950, 720, 1400)}.items():
    src.crop(box).save(os.path.join(ICI, "sortie", f"ellipses-{nom}.png"))
