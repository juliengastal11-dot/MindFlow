// Pour la transparence, les niveaux d'alpha sont ramenés à 16 (0 et 255 restent exacts) :
// le texte sur fond transparent se code presque entièrement dans l'alpha, qui pesait plus du
// double en 256 niveaux, sans différence visible à cette taille.
// Fabrique les médias d'une carte « en calques » (VTBON) :
//   · fond-NN.webp : les images du film de fond, rognées au format de la carte (0,6) comme
//     le fait le site (`object-fit: cover`, `object-position: 50% 40%`), régulièrement
//     réparties dans le film ;
//   · page-N.webp : la page entière en tranches de 600 px de large, AVEC transparence ;
//   · affiche.webp : le haut de page tel qu'on le voit à l'arrêt (première image du film,
//     voile du haut de page, héros par-dessus) : image de repli avant le premier dessin.
//
// node produire-calques.mjs <dossier des médias> <nom> <film.mp4> [nombre d'images]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [SORTIE, nom, FILM, nombreTexte = "40"] = process.argv.slice(2);
const N = Number(nombreTexte);
const VOILE_HAUT = 0.14; // le voile du site en haut de page (`VOILE[0]`)
const src = path.resolve("sorties", nom);
const dst = path.join(SORTIE, nom);
fs.mkdirSync(dst, { recursive: true });

const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const ko = (f) => `${Math.round(fs.statSync(f).size / 1024)} ko`;
const sonde = (...args) => execFileSync("ffprobe", ["-v", "error", ...args]).toString().trim();

// ---- Le film : N images, du premier plan au dernier -----------------------------------
const duree = Number(sonde("-show_entries", "format=duration", "-of", "csv=p=0", FILM));
const haut = Number(sonde("-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", FILM));
const large = Number(sonde("-select_streams", "v:0", "-show_entries", "stream=width", "-of", "csv=p=0", FILM));
// Le format de la carte est 0,6 : on rogne la hauteur utile, la fenêtre est à 40 % du reste.
const hUtile = Math.round(large / 0.6);
const decalage = Math.round((haut - hUtile) * 0.4);
// Le film n'a pas de matrice de couleur déclarée : les navigateurs lisent le HD en BT.709.
const rogner = `crop=${large}:${hUtile}:0:${decalage},scale=450:750:flags=lanczos:in_color_matrix=bt709:in_range=tv`;
for (const f of fs.readdirSync(dst)) if (/^(fond|page)-\d+\.webp$/.test(f)) fs.rmSync(path.join(dst, f));
let total = 0;
for (let i = 0; i < N; i++) {
  const t = Math.min(duree - 0.05, (i / (N - 1)) * (duree - 0.05));
  const f = path.join(dst, `fond-${String(i).padStart(2, "0")}.webp`);
  ff("-ss", t.toFixed(3), "-i", FILM, "-frames:v", "1", "-vf", rogner, "-c:v", "libwebp", "-quality", "62", f);
  total += fs.statSync(f).size;
}
console.log(`${nom} fond : ${N} images, ${Math.round(total / 1024)} ko en tout (film de ${duree.toFixed(1)} s)`);

// ---- L'affiche : première image + voile + héros ---------------------------------------
const affiche = path.join(dst, "affiche.webp");
const m = (1 - VOILE_HAUT).toFixed(3);
ff(
  "-ss", "0", "-i", FILM, "-i", path.join(src, "tuile-000.png"),
  "-filter_complex",
  `[0:v]crop=${large}:${hUtile}:0:${decalage},scale=780:1300:flags=lanczos:in_color_matrix=bt709:in_range=tv,format=rgba,colorchannelmixer=rr=${m}:gg=${m}:bb=${m}[bg];[bg][1:v]overlay=format=auto,format=rgb24[o]`,
  "-map", "[o]", "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", affiche,
);
console.log(`${nom} affiche : ${ko(affiche)}`);

// ---- La page : les tuiles bout à bout (RGBA), puis des tranches avec transparence -----
const { hauteur, tuiles } = JSON.parse(fs.readFileSync(path.join(src, "tuiles.json"), "utf8"));
const entrees = [];
const morceaux = [];
let fait = 0;
tuiles.forEach((t, i) => {
  const fin = i + 1 < tuiles.length ? tuiles[i + 1].y : hauteur;
  const debut = Math.max(fait, t.y);
  const h = fin - debut;
  if (h <= 0) return;
  entrees.push("-i", path.join(src, t.fichier));
  const k = entrees.length / 2 - 1;
  morceaux.push(`[${k}:v]format=rgba,crop=780:${h * 2}:0:${(debut - t.y) * 2}[m${k}]`);
  fait = fin;
});
const n = morceaux.length;
const longue = path.join(src, "page-longue.png");
ff(...entrees, "-filter_complex", `${morceaux.join(";")};${Array.from({ length: n }, (_, k) => `[m${k}]`).join("")}vstack=inputs=${n},scale=600:-2:flags=lanczos[o]`, "-map", "[o]", "-frames:v", "1", "-update", "1", longue);
const hLongue = Number(sonde("-show_entries", "stream=height", "-of", "csv=p=0", longue));
const TRANCHE = 3000;
const tranches = [];
for (let y = 0, i = 1; y < hLongue; y += TRANCHE, i++) {
  const h = Math.min(TRANCHE, hLongue - y);
  const f = path.join(dst, `page-${i}.webp`);
  ff("-i", longue, "-vf", `crop=600:${h}:0:${y},format=rgba,lutrgb=a='round(val/17)*17'`, "-c:v", "libwebp", "-quality", "78", f);
  tranches.push({ fichier: path.basename(f), hauteur: h });
}
fs.writeFileSync(path.join(src, "page.json"), JSON.stringify({ largeur: 600, hauteur: hLongue, tranches }));
console.log(`${nom} page : ${hLongue} px en ${tranches.length} tranches (${tranches.map((t) => ko(path.join(dst, t.fichier))).join(", ")})`);
console.log(`tranches: [${tranches.map((t) => t.hauteur).join(", ")}], images du fond : ${N}`);
