// Pour AR Transfert (zones à adapter à un autre site). Mesure, image par image, ce qui bouge dans la vidéo brute d'AR Transfert, sur les
// images décodées (niveaux de gris, demi-taille 390 × 650) : la voiture et le bouton
// « Réserver » de l'en-tête. Écrit mesure.json : [{ t, voiture, bouton, vAvg }].
// node mesure.cjs <brut.mp4> <sortie.json>
const { spawn } = require("child_process");
const fs = require("fs");
const [video, sortie] = process.argv.slice(2);
const L = 390, H = 650, TAILLE = L * H;
// Zones en pixels de la demi-taille (= pixels CSS de la capture).
const ZONES = {
  voiture: { x: 0, y: 66, l: 390, h: 334 },  // sous l'en-tête, jusqu'aux mentions
  bouton: { x: 248, y: 13, l: 122, h: 37 },  // « Réserver », en haut à droite
};
const ff = spawn("ffmpeg", ["-v", "error", "-i", video, "-vf", `scale=${L}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
let tampon = Buffer.alloc(0);
let prec = null;
const res = [];
let n = 0;
const ecart = (a, b, z) => {
  let s = 0;
  for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.l; x++) { const i = y * L + x; s += Math.abs(a[i] - b[i]); }
  return s / (z.l * z.h);
};
const moyenne = (a, z) => {
  let s = 0;
  for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.l; x++) s += a[y * L + x];
  return s / (z.l * z.h);
};
ff.stdout.on("data", (d) => {
  tampon = Buffer.concat([tampon, d]);
  while (tampon.length >= TAILLE) {
    const img = tampon.subarray(0, TAILLE);
    tampon = tampon.subarray(TAILLE);
    const copie = Buffer.from(img);
    res.push({
      t: +(n / 30).toFixed(3),
      voiture: prec ? +ecart(copie, prec, ZONES.voiture).toFixed(4) : 0,
      bouton: prec ? +ecart(copie, prec, ZONES.bouton).toFixed(4) : 0,
      vAvg: +moyenne(copie, ZONES.voiture).toFixed(3),
      bAvg: +moyenne(copie, ZONES.bouton).toFixed(3),
    });
    prec = copie;
    n++;
  }
});
ff.on("close", () => {
  fs.writeFileSync(sortie, JSON.stringify(res));
  console.log(`${res.length} images mesurées`);
});
