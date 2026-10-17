// Extrait les images des plans verticaux (9:16) en séries .webp pour le téléphone.
//
//   node extraire-vertical.mjs ciel <sortie> <passe1.mp4>:21 <passe2.mp4>:20 ...
//        Les passages du ciel, bout à bout : N images régulièrement réparties dans chaque plan, première et dernière
//        comprises. La première image de chaque plan, sauf le premier, est la dernière du précédent : elle est sautée.
//        Écrit 001.webp, 002.webp, ... dans <sortie>.
//   node extraire-vertical.mjs plongee <plan.mp4> <sortie> <n> [--fin <image>] [--derniere-pleine] [--regulier]
//        La plongée : n images, première et dernière comprises, choisies pour que l'image change du même pas de l'une à
//        la suivante (la caméra va dix fois plus vite au milieu qu'au début : une image tous les mêmes instants en
//        gaspillerait au début et en manquerait au milieu). `--regulier` : tous les mêmes instants, comme le ciel.
//        `--fin <image>` : ne garde que les images 0 à <image> du plan. Les plans Kling finissent par une descente de
//        la caméra, où le sol monte dans l'image et où l'IA déforme le terrain (J, 2026-10-17) : on coupe avant, et la
//        page finit par un zoom sur la dernière image, où rien ne peut bouger. `--derniere-pleine` : cette dernière
//        image est écrite à la pleine taille (1080 × 1912), parce que c'est elle qu'on agrandit.
//
// Options : --largeur 720 (les images sont réduites à cette largeur, hauteur déduite de 1080 × 1912)  --qualite 78
// Il faut Node et ffmpeg.
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
const LARGEUR = Number(option("largeur", "720"));
const QUALITE = option("qualite", "78");
const FIN = option("fin", null);
const drapeau = (nom) => {
  const i = argv.indexOf("--" + nom);
  if (i === -1) return false;
  argv.splice(i, 1);
  return true;
};
const PLEINE = drapeau("derniere-pleine");
const REGULIER = drapeau("regulier");
// Les plans Kling font 1080 × 1912 (ou 1916) : on les rogne à 1080 × 1912, puis on les réduit sans les déformer (720 × 1274).
const HAUTEUR = Math.round((LARGEUR * 1912) / 1080 / 2) * 2;
const [commande, ...reste] = argv;

const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: "inherit" });
const nbImages = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", f]).toString().trim());

/** Écrit, depuis un plan, les images d'indices donnés (0 à n − 1), sous les numéros donnés, réduites en .webp. */
function extraire(plan, indices, numeros, sortie) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extraire-"));
  const tries = [...indices].sort((a, b) => a - b);
  // Sans doublon : le filtre `select` ne sort chaque image qu'une fois ; on recopie ensuite pour les indices répétés.
  const uniques = [...new Set(tries)];
  // Au-delà de 80 images, la somme de `eq()` du filtre `select` dépasse ce que ffmpeg sait analyser : on sort alors toutes les
  // images du début du plan jusqu'à la dernière voulue, et on ne garde que les bonnes.
  const toutes = uniques.length > 80;
  if (toutes) {
    ff("-i", plan, "-vf", `crop=1080:1912,scale=${LARGEUR}:${HAUTEUR}:flags=lanczos`, "-frames:v", String(uniques[uniques.length - 1] + 1), path.join(tmp, "%04d.png"));
  } else {
    ff("-i", plan, "-vf", `select='${uniques.map((n) => `eq(n\\,${n})`).join("+")}',crop=1080:1912,scale=${LARGEUR}:${HAUTEUR}:flags=lanczos`, "-fps_mode", "vfr", path.join(tmp, "%04d.png"));
  }
  const pos = new Map(uniques.map((n, k) => [n, toutes ? n + 1 : k + 1]));
  indices.forEach((n, k) => {
    const png = path.join(tmp, `${String(pos.get(n)).padStart(4, "0")}.png`);
    ff("-i", png, "-c:v", "libwebp", "-quality", QUALITE, path.join(sortie, `${String(numeros[k]).padStart(3, "0")}.webp`));
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

/** Écrit l'image d'indice donné à la pleine taille (1080 × 1912, rognée au centre), sous le numéro donné. */
function extrairePleine(plan, indice, numero, sortie) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extraire-"));
  const png = path.join(tmp, "pleine.png");
  ff("-i", plan, "-vf", `select='eq(n\\,${indice})',crop=1080:1912`, "-fps_mode", "vfr", "-frames:v", "1", png);
  ff("-i", png, "-c:v", "libwebp", "-quality", "85", path.join(sortie, `${String(numero).padStart(3, "0")}.webp`));
  fs.rmSync(tmp, { recursive: true, force: true });
}

const reparties = (n, total) => Array.from({ length: n }, (_, i) => Math.round((i * (total - 1)) / (n - 1)));

/** n indices d'images, première et dernière comprises, à pas égal de changement : la différence moyenne des niveaux de gris
    entre deux images voisines (version réduite de 112 × 200) est cumulée, puis découpée en n − 1 parts égales. */
function repartiesParMouvement(plan, n, utile) {
  const [L, H] = [112, 200];
  const brut = execFileSync("ffmpeg", ["-v", "error", "-i", plan, "-vf", `crop=1080:1912,scale=${L}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 });
  const taille = L * H;
  const total = Math.min(utile, Math.floor(brut.length / taille));
  const cumul = [0];
  for (let k = 1; k < total; k++) {
    let somme = 0;
    for (let p = 0; p < taille; p++) somme += Math.abs(brut[k * taille + p] - brut[(k - 1) * taille + p]);
    cumul.push(cumul[k - 1] + somme / taille);
  }
  const indices = [];
  for (let i = 0; i < n; i++) {
    const cible = (i * cumul[total - 1]) / (n - 1);
    let meilleur = 0;
    for (let k = 1; k < total; k++) if (Math.abs(cumul[k] - cible) < Math.abs(cumul[meilleur] - cible)) meilleur = k;
    indices.push(meilleur);
  }
  // Le pas ne doit jamais faire reculer ni répéter une image.
  for (let i = 1; i < n; i++) if (indices[i] <= indices[i - 1]) indices[i] = Math.min(total - 1, indices[i - 1] + 1);
  return indices;
}

if (commande === "ciel") {
  const [sortie, ...passes] = reste;
  if (!sortie || passes.length === 0) throw new Error("node extraire-vertical.mjs ciel <sortie> <passe.mp4>:<n> ...");
  fs.mkdirSync(sortie, { recursive: true });
  let numero = 1;
  passes.forEach((p, k) => {
    const [plan, n] = [p.slice(0, p.lastIndexOf(":")), Number(p.slice(p.lastIndexOf(":") + 1))];
    const total = nbImages(plan);
    // Le premier plan garde sa première image ; les suivants la sautent (c'est la dernière du plan d'avant).
    const demande = k === 0 ? n : n + 1;
    let indices = reparties(demande, total);
    if (k > 0) indices = indices.slice(1);
    extraire(plan, indices, indices.map((_, j) => numero + j), sortie);
    console.log(`${path.basename(plan)} : ${total} images, ${indices.length} gardées → ${String(numero).padStart(3, "0")} à ${String(numero + indices.length - 1).padStart(3, "0")}`);
    numero += indices.length;
  });
  console.log(`série du ciel : ${numero - 1} images, ${LARGEUR} × ${HAUTEUR}`);
} else if (commande === "plongee") {
  const [plan, sortie, n] = reste;
  if (!plan || !sortie || !n) throw new Error("node extraire-vertical.mjs plongee <plan.mp4> <sortie> <n>");
  fs.mkdirSync(sortie, { recursive: true });
  const total = nbImages(plan);
  const utile = FIN === null ? total : Math.min(total, Number(FIN) + 1);
  const indices = REGULIER ? reparties(Number(n), utile) : repartiesParMouvement(plan, Number(n), utile);
  const reduites = PLEINE ? indices.slice(0, -1) : indices;
  extraire(plan, reduites, reduites.map((_, j) => j + 1), sortie);
  if (PLEINE) extrairePleine(plan, indices[indices.length - 1], indices.length, sortie);
  console.log(`plongée : ${total} images dans le plan, les ${utile} premières utilisées, ${n} gardées (${REGULIER ? "à intervalles égaux" : "à pas égal de changement"}), ${LARGEUR} × ${HAUTEUR}${PLEINE ? ", la dernière en 1080 × 1912" : ""}`);
  console.log(`indices : ${indices.join(" ")}`);
} else {
  console.log("commandes : ciel | plongee (voir l'en-tête du fichier)");
}
