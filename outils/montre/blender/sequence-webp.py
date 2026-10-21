# Les images rendues (PNG avec alpha) deviennent une séquence WebP pour la page : python sequence-webp.py <dossier png> <dossier sortie> <largeur> [qualité] [qualité de l'alpha]
import os, sys, json
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
largeur = int(sys.argv[3]); q = int(sys.argv[4]) if len(sys.argv) > 4 else 80
aq = int(sys.argv[5]) if len(sys.argv) > 5 else 90
os.makedirs(dst, exist_ok=True)
noms = sorted(n for n in os.listdir(src) if n.lower().endswith(".png"))
total = 0
for i, n in enumerate(noms):
    im = Image.open(os.path.join(src, n)).convert("RGBA")
    h = round(im.height * largeur / im.width)
    im = im.resize((largeur, h), Image.LANCZOS)
    out = os.path.join(dst, f"{i:03d}.webp")
    im.save(out, quality=q, method=6, alpha_quality=aq)
    total += os.path.getsize(out)
json.dump({"n": len(noms), "l": largeur, "h": h}, open(os.path.join(dst, "sequence.json"), "w"))
print(len(noms), "images,", largeur, "x", h, ",", round(total / 1024), "Ko")
