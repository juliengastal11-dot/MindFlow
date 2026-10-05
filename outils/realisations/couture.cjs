// Cherche les deux bouts de la boucle d'AR Transfert qui se ressemblent le plus :
// pour un début b0 (de la fin de l'ouverture) et une fin b1 plus loin, l'écart moyen entre
// les `n` images du fondu (b1-n..b1) et celles du début (b0..b0+n), sur tout le cadre.
// node couture.cjs <brut.mp4> <b0 min> <b0 max> <b1 min> <b1 max> [fondu en s]
const { spawn } = require("child_process");
const [video, a0, a1, c0, c1, fonduTexte = "0.3"] = process.argv.slice(2);
const L = 390, H = 650, TAILLE = L * H, FPS = 30;
const n = Math.round(Number(fonduTexte) * FPS);
const ff = spawn("ffmpeg", ["-v", "error", "-i", video, "-vf", `scale=${L}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: Infinity });
const bouts = [];
ff.stdout.on("data", (d) => bouts.push(d));
ff.on("close", () => {
  const tout = Buffer.concat(bouts);
  const total = Math.floor(tout.length / TAILLE);
  const F = (i) => tout.subarray(i * TAILLE, (i + 1) * TAILLE);
  // L'écart moyen entre deux images, sur un pixel sur quatre (assez fin, quatre fois plus vite).
  const mad = (x, y) => {
    let s = 0, c = 0;
    for (let i = 0; i < TAILLE; i += 4) { s += Math.abs(x[i] - y[i]); c++; }
    return s / c;
  };
  const meilleurs = [];
  for (let i0 = Math.round(a0 * FPS); i0 <= Math.round(a1 * FPS); i0++) {
    for (let i1 = Math.round(c0 * FPS); i1 <= Math.min(total - 1, Math.round(c1 * FPS)); i1++) {
      let s = 0;
      for (let k = 0; k <= n; k += 3) s += mad(F(i1 - n + k), F(i0 + k));
      meilleurs.push({ b0: +(i0 / FPS).toFixed(3), b1: +(i1 / FPS).toFixed(3), cout: +(s / (Math.floor(n / 3) + 1)).toFixed(4) });
    }
  }
  meilleurs.sort((p, q) => p.cout - q.cout);
  console.log(`${total} images ; les 15 meilleurs couples (écart moyen par pixel, sur 255) :`);
  for (const m of meilleurs.slice(0, 15)) console.log(`b0 ${m.b0}  b1 ${m.b1}  boucle ${(m.b1 - m.b0).toFixed(2)} s  écart ${m.cout}`);
  // Et, à titre de repère, le plus petit écart de chaque fenêtre de fin.
  const par = {};
  for (const m of meilleurs) { const k = Math.floor(m.b1 / 2) * 2; if (!par[k] || m.cout < par[k].cout) par[k] = m; }
  console.log("meilleur par tranche de 2 s de fin :");
  for (const k of Object.keys(par).map(Number).sort((x, y) => x - y)) console.log(`  fin ${k}-${k + 2} : b0 ${par[k].b0} b1 ${par[k].b1} écart ${par[k].cout}`);
});
