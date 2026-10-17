// Monte la vidéo VERTICALE du héros de Stalika (téléphone) à partir de deux plans Kling 9:16 de 10 s :
//   · l'aller : la caméra s'approche (plan large → plan rapproché B), un nuage traverse le plateau ;
//   · le retour : elle recule (B → plan large).
// Comme `monter.mjs` (le montage paysage), mais sans recadrage : les plans sont déjà en 9:16, 1080 × 1912 (2026-10-17).
//
// Ce qui sort, dans stalika/public/hero :
//   · video-mobile.mp4 (H.264), video-mobile.webm (VP9), video-mobile-hevc.mp4 (HEVC, `hvc1`, pour Safari) :
//     une boucle de 20 s, l'aller puis le retour, chacun ralenti en douceur à ses deux bouts (courbe en cosinus,
//     celle que suit `avanceeVideo` dans components/ui/ciel.tsx), raccordés par des fondus courts, la fin retombant
//     sur le début ;
//   · recul/mobile/001…030.webp : les images du recul au premier défilement, prises dans le plan retour
//     (001 = plan large, 030 = plan rapproché), 720 × 1274.
//
// node monter-vertical.mjs <aller.mp4> <retour.mp4> [dossier de sortie] [--h264 2800] [--vp9 2000] [--hevc 2200]   (Node, ffmpeg)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const option = (nom, defaut) => {
  const i = argv.indexOf("--" + nom);
  if (i === -1) return defaut;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const DEBIT = { h264: Number(option("h264", "2800")), vp9: Number(option("vp9", "2000")), hevc: Number(option("hevc", "2200")) };
const [aller, retour, sortie = path.resolve(import.meta.dirname, "../../stalika/public/hero")] = argv;
if (!aller || !retour) {
  console.error("node monter-vertical.mjs <aller.mp4> <retour.mp4> [dossier de sortie]");
  process.exit(1);
}

const FPS = 24;
// Chaque plan ralenti dure D secondes ; les fondus durent O. La boucle fait (D - O) + D - O = 20 s : l'aller sans ses
// O premières secondes, fondu dans le retour, dont la fin se fond dans ces O premières secondes de l'aller.
const D = 10.4;
const O = 0.4;
const RECUL = 30;
const LARGEUR_IMAGES = 720;
const HAUTEUR_IMAGES = 1274; // 1912 × 720 / 1080 : le même rapport que le plan, sans déformer

const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const sonde = (f, entrees) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", `stream=${entrees}`, "-of", "csv=p=0", f])
    .toString()
    .trim();
const ko = (f) => `${Math.round(fs.statSync(f).size / 1024)} ko`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-vertical-"));

const images = (f) => Number(sonde(f, "nb_read_frames"));
const nA = images(aller);
const nR = images(retour);
const S = (n) => (n - 1) / FPS;

// Les deux plans n'ont pas toujours la même hauteur (1912 ou 1916 px) : on les ramène à 1080 × 1912 (rognage centré de quelques
// pixels), sans quoi le fondu entre eux refuse de se faire.
// Le ralenti : l'image source de l'instant s passe à l'instant t tel que s = S · (1 − cos(π t / D)) / 2,
// soit t = D / π · acos(1 − 2 s / S). Les images manquantes se fondent entre leurs voisines.
const ralentir = (entree, n, nom) =>
  `[${entree}:v]crop=1080:1912,setpts='(${D}/PI)*acos(1-2*min(T/${S(n).toFixed(6)}\\,1))/TB',framerate=fps=${FPS}:interp_start=0:interp_end=255:scene=100,trim=duration=${D},setpts=PTS-STARTPTS[${nom}]`;

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
  "-map", "[o]", "-r", String(FPS), "-c:v", "libx264", "-crf", "8", "-preset", "fast", maitre,
);
console.log(`boucle : ${sonde(maitre, "nb_read_frames")} images à ${FPS} i/s`);

const journal = path.join(tmp, "passe");
fs.mkdirSync(sortie, { recursive: true });

// H.264, deux passes : le repli, lu partout.
const mp4 = path.join(sortie, "video-mobile.mp4");
ff("-i", maitre, "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", `${DEBIT.h264}k`, "-pass", "1", "-passlogfile", journal, "-f", "null", "-");
ff("-i", maitre, "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", `${DEBIT.h264}k`, "-pass", "2", "-passlogfile", journal, "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4);
console.log(`video-mobile.mp4 ${ko(mp4)}`);

// VP9, deux passes : Chrome, Firefox, et Safari récent.
const webm = path.join(sortie, "video-mobile.webm");
ff("-i", maitre, "-an", "-c:v", "libvpx-vp9", "-b:v", `${DEBIT.vp9}k`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-pass", "1", "-passlogfile", journal, "-f", "null", "-");
ff("-i", maitre, "-an", "-c:v", "libvpx-vp9", "-b:v", `${DEBIT.vp9}k`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pass", "2", "-passlogfile", journal, "-pix_fmt", "yuv420p", "-color_range", "tv", webm);
console.log(`video-mobile.webm ${ko(webm)}`);

// HEVC (étiquette hvc1 : sans elle, Safari refuse le fichier) : décodée par la puce de l'iPhone, plus légère à qualité égale.
const hevc = path.resolve(sortie, "video-mobile-hevc.mp4");
// Les paramètres de x265 se séparent aux « : » : un chemin Windows (« C:\… ») y serait coupé, et le fichier de la première passe
// atterrirait dans le dossier courant sous le nom « C ». On lance donc x265 dans le dossier temporaire, avec un nom relatif.
const dansTmp = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit", cwd: tmp });
dansTmp("-i", maitre, "-an", "-c:v", "libx265", "-preset", "slow", "-b:v", `${DEBIT.hevc}k`, "-x265-params", "pass=1:stats=x265.log:log-level=error", "-f", "null", "-");
dansTmp("-i", maitre, "-an", "-c:v", "libx265", "-preset", "slow", "-b:v", `${DEBIT.hevc}k`, "-x265-params", "pass=2:stats=x265.log:log-level=error", "-tag:v", "hvc1", "-pix_fmt", "yuv420p", "-movflags", "+faststart", hevc);
console.log(`video-mobile-hevc.mp4 ${ko(hevc)}`);

// Le recul : 30 images du plan retour, réparties régulièrement. L'image k (k = 0 au plan large) est celle où la
// caméra en est à k / 29 du plan rapproché.
const choisies = Array.from({ length: RECUL }, (_, k) => Math.round((1 - k / (RECUL - 1)) * (nR - 1)));
const extraites = path.join(tmp, "recul");
fs.mkdirSync(extraites);
ff("-i", retour, "-vf", `select='${[...choisies].sort((x, y) => x - y).map((n) => `eq(n\\,${n})`).join("+")}',scale=${LARGEUR_IMAGES}:${HAUTEUR_IMAGES}:flags=lanczos`, "-fps_mode", "vfr", path.join(extraites, "%03d.png"));
const dossierRecul = path.join(sortie, "recul", "mobile");
fs.mkdirSync(dossierRecul, { recursive: true });
// Extraites dans l'ordre du plan (plan rapproché d'abord) : la j-ième est l'image k = 29 − j.
for (let j = 0; j < RECUL; j++) {
  const png = path.join(extraites, `${String(j + 1).padStart(3, "0")}.png`);
  ff("-i", png, "-c:v", "libwebp", "-quality", "78", path.join(dossierRecul, `${String(RECUL - j).padStart(3, "0")}.webp`));
}
const total = fs.readdirSync(dossierRecul).reduce((s, f) => s + fs.statSync(path.join(dossierRecul, f)).size, 0);
console.log(`recul : mobile ${Math.round(total / 1024)} ko`);
fs.rmSync(tmp, { recursive: true, force: true });
