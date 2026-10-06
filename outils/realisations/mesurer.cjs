// Mesure, image par image, ce qui bouge dans la vidéo brute d'une capture, sur les images
// décodées (niveaux de gris, demi-taille 390 × 650), dans deux zones à surveiller.
// Écrit un JSON : [{ t, a, b, aAvg, bAvg }] : l'écart avec l'image d'avant et la luminosité
// moyenne de chaque zone.
//
// node mesurer.cjs <brut.mp4> <sortie.json> [zoneA] [zoneB]
//   zones : "x,y,l,h" en pixels CSS de la capture. Par défaut, celles d'AR Transfert :
//   A = la voiture (sous l'en-tête), B = le bouton « Réserver » de l'en-tête.
//   Pour la pizzeria : A = la devanture (0,470,390,180), B = le titre (0,40,390,60).
const { spawn } = require("child_process");
const fs = require("fs");
const [video, sortie, zA = "0,66,390,334", zB = "248,13,122,37"] = process.argv.slice(2);
const L = 390, H = 650, TAILLE = L * H;
const zone = (t) => { const [x, y, l, h] = t.split(",").map(Number); return { x, y, l, h }; };
const ZA = zone(zA), ZB = zone(zB);
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
    const copie = Buffer.from(tampon.subarray(0, TAILLE));
    tampon = tampon.subarray(TAILLE);
    res.push({
      t: +(n / 30).toFixed(3),
      a: prec ? +ecart(copie, prec, ZA).toFixed(4) : 0,
      b: prec ? +ecart(copie, prec, ZB).toFixed(4) : 0,
      aAvg: +moyenne(copie, ZA).toFixed(3),
      bAvg: +moyenne(copie, ZB).toFixed(3),
      // Pour l'ancien format (AR Transfert) : voiture, bouton, vAvg.
      voiture: prec ? +ecart(copie, prec, ZA).toFixed(4) : 0,
      bouton: prec ? +ecart(copie, prec, ZB).toFixed(4) : 0,
      vAvg: +moyenne(copie, ZA).toFixed(3),
      bAvg2: +moyenne(copie, ZB).toFixed(3),
    });
    prec = copie;
    n++;
  }
});
ff.on("close", () => {
  fs.writeFileSync(sortie, JSON.stringify(res));
  console.log(`${res.length} images mesurées`);
});
