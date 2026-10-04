// Monte la vidéo du héros de Stalika à partir de deux plans Kling de 10 s :
//   · l'aller : la caméra s'approche (plan large → image B) ;
//   · le retour : elle recule (image B → plan large).
// Tous deux sont joués vers l'avant : ce qui bouge dans l'image (le nuage qui
// traverse le plateau, la mer de nuages) ne repart jamais à l'envers.
//
// Ce qui sort, dans stalika/public/hero :
//   · video.mp4|webm (1928 × 1076) et video-mobile.mp4|webm (840 × 1506 : le
//     bandeau de 600 px pris à x = 278, celui de la série mobile du ciel) : une
//     boucle de 20 s, l'aller puis le retour, chacun ralenti en douceur à ses
//     deux bouts (courbe en cosinus, celle que suit `avanceeVideo` dans
//     components/ui/ciel.tsx), raccordés par des fondus courts, la fin
//     retombant sur le début ;
//   · recul/bureau|mobile/001…030.webp : les images du recul au premier
//     défilement, prises dans le plan retour (001 = plan large, 030 = image B) :
//     la caméra recule en allant de l'avant.
//
// node monter.mjs <aller.mp4> <retour.mp4> [dossier de sortie]   (Node, ffmpeg)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [aller, retour, sortie = path.resolve(import.meta.dirname, "../../stalika/public/hero")] = process.argv.slice(2);
if (!aller || !retour) {
  console.error("node monter.mjs <aller.mp4> <retour.mp4> [dossier de sortie]");
  process.exit(1);
}

const FPS = 24;
// Chaque plan ralenti dure D secondes ; les fondus durent O. La boucle fait
// (D - O) + D - O = 20 s : l'aller sans ses O premières secondes, fondu dans le
// retour, dont la fin se fond dans ces O premières secondes de l'aller.
const D = 10.4;
const O = 0.4;
const MOBILE = "crop=600:1076:278:0";
const RECUL = 30;

const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const sonde = (f, entrees) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", `stream=${entrees}`, "-of", "csv=p=0", f])
    .toString()
    .trim();
const ko = (f) => `${Math.round(fs.statSync(f).size / 1024)} ko`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-"));

// La durée utile d'un plan : de sa première image à sa dernière.
const images = (f) => Number(sonde(f, "nb_read_frames"));
const nA = images(aller);
const nR = images(retour);
const S = (n) => (n - 1) / FPS;

// Le ralenti : l'image source de l'instant s passe à l'instant t tel que
// s = S · (1 − cos(π t / D)) / 2, soit t = D / π · acos(1 − 2 s / S). Les images
// manquantes se fondent entre leurs voisines.
const ralentir = (entree, n, nom) =>
  `[${entree}:v]setpts='(${D}/PI)*acos(1-2*min(T/${S(n).toFixed(6)}\\,1))/TB',framerate=fps=${FPS}:interp_start=0:interp_end=255:scene=100,trim=duration=${D},setpts=PTS-STARTPTS[${nom}]`;

const maitre = path.join(tmp, "maitre.mp4");
ff(
  "-i", aller,
  "-i", retour,
  "-filter_complex",
  [
    ralentir(0, nA, "a"),
    ralentir(1, nR, "r"),
    "[a]split[a_1][a_0]",
    `[a_1]trim=start=${O},setpts=PTS-STARTPTS[a1]`,
    `[a_0]trim=end=${O},setpts=PTS-STARTPTS[a0]`,
    `[a1][r]xfade=transition=fade:duration=${O}:offset=${(D - 2 * O).toFixed(3)}[x]`,
    `[x][a0]xfade=transition=fade:duration=${O}:offset=${(2 * D - 3 * O).toFixed(3)},format=yuv420p[o]`,
  ].join(";"),
  "-map", "[o]", "-r", String(FPS), "-c:v", "libx264", "-crf", "10", "-preset", "fast", maitre,
);
console.log(`boucle : ${sonde(maitre, "nb_read_frames")} images à ${FPS} i/s`);

// Deux passes, pour tenir le débit visé (moins de 3 Mo pour 20 s : le garde-fou).
const deuxPasses = (filtre, debit, mp4, webm) => {
  const journal = path.join(tmp, "passe");
  const vf = filtre ? ["-vf", filtre] : [];
  ff("-i", maitre, ...vf, "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", `${debit.mp4}k`, "-pass", "1", "-passlogfile", journal, "-f", "null", "-");
  ff("-i", maitre, ...vf, "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", `${debit.mp4}k`, "-pass", "2", "-passlogfile", journal, "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4);
  ff("-i", maitre, ...vf, "-an", "-c:v", "libvpx-vp9", "-b:v", `${debit.webm}k`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-pass", "1", "-passlogfile", journal, "-f", "null", "-");
  ff("-i", maitre, ...vf, "-an", "-c:v", "libvpx-vp9", "-b:v", `${debit.webm}k`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pass", "2", "-passlogfile", journal, "-pix_fmt", "yuv420p", "-color_range", "tv", webm);
  console.log(`${path.basename(mp4)} ${ko(mp4)}, ${path.basename(webm)} ${ko(webm)}`);
};
deuxPasses(null, { mp4: 1100, webm: 900 }, path.join(sortie, "video.mp4"), path.join(sortie, "video.webm"));
deuxPasses(`${MOBILE},scale=840:1506:flags=lanczos`, { mp4: 980, webm: 720 }, path.join(sortie, "video-mobile.mp4"), path.join(sortie, "video-mobile.webm"));

// Le recul : 30 images du plan retour, réparties régulièrement. L'image k
// (k = 0 au plan large) est celle où la caméra en est à k / 29 de l'image B.
const choisies = Array.from({ length: RECUL }, (_, k) => Math.round((1 - k / (RECUL - 1)) * (nR - 1)));
const extraites = path.join(tmp, "recul");
fs.mkdirSync(extraites);
ff("-i", retour, "-vf", `select='${[...choisies].sort((x, y) => x - y).map((n) => `eq(n\\,${n})`).join("+")}'`, "-fps_mode", "vfr", path.join(extraites, "%03d.png"));
// Extraites dans l'ordre du plan (image B d'abord) : la j-ième est l'image k = 29 − j.
for (const dossier of ["bureau", "mobile"]) fs.mkdirSync(path.join(sortie, "recul", dossier), { recursive: true });
for (let j = 0; j < RECUL; j++) {
  const png = path.join(extraites, `${String(j + 1).padStart(3, "0")}.png`);
  const nom = `${String(RECUL - j).padStart(3, "0")}.webp`;
  ff("-i", png, "-vf", "scale=1600:895:flags=lanczos", "-c:v", "libwebp", "-quality", "76", path.join(sortie, "recul", "bureau", nom));
  ff("-i", png, "-vf", MOBILE, "-c:v", "libwebp", "-quality", "76", path.join(sortie, "recul", "mobile", nom));
}
const total = (d) => fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0);
console.log(`recul : bureau ${Math.round(total(path.join(sortie, "recul", "bureau")) / 1024)} ko, mobile ${Math.round(total(path.join(sortie, "recul", "mobile")) / 1024)} ko`);
fs.rmSync(tmp, { recursive: true, force: true });
