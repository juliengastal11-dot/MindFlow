// Fabrique les médias des cartes de la roue à partir des captures :
//   hero.mp4 / hero.webm (600 × 1000) et hero-mobile.* (324 × 540), affiche.webp
//   (780 × 1300, Next en tire les tailles), et la page entière en tranches
//   page-N.webp (600 px de large) pour le défilement dans la carte.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SORTIE = process.argv[2];
const SITES = {
  // boucle : segment [de, a], fondu de `fondu` s avec ce qui précède `de`.
  pizzeria: { video: { type: "boucle", de: 3.0, a: 11.0, fondu: 1.0 }, affiche: 3.0 },
  ocre: { video: { type: "boucle", de: 3.0, a: 7.0, fondu: 0 }, affiche: 3.0 },
  // entrée : jouée une fois quand la carte arrive devant, puis tenue.
  vtbon: { video: { type: "entree", de: 0.05, a: 2.0 }, affiche: 1.98 },
  popec: { video: { type: "entree", de: 0.35, a: 1.9 }, affiche: 1.88 },
  signet: { video: null, affiche: "tuile" },
};
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const ko = (f) => `${Math.round(fs.statSync(f).size / 1024)} ko`;

for (const [nom, cfg] of Object.entries(SITES)) {
  const src = path.resolve("sorties", nom);
  const dst = path.join(SORTIE, nom);
  fs.mkdirSync(dst, { recursive: true });
  const brut = path.join(src, "brut.mp4");

  // La vidéo du hero, en deux tailles.
  if (cfg.video) {
    const v = cfg.video;
    let filtre;
    if (v.type === "boucle" && v.fondu > 0) {
      // A = [de, a] ; B = [de - fondu, de] ; A se fond dans B : la dernière image
      // est la première de A, la boucle n'a pas de couture.
      filtre = `[0:v]trim=${v.de}:${v.a},setpts=PTS-STARTPTS[a];[0:v]trim=${v.de - v.fondu}:${v.de},setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=${v.fondu}:offset=${v.a - v.de - v.fondu}[o]`;
    } else {
      filtre = `[0:v]trim=${v.de}:${v.a},setpts=PTS-STARTPTS[o]`;
    }
    const maitre = path.join(src, "maitre.mp4");
    ff("-i", brut, "-filter_complex", filtre, "-map", "[o]", "-r", "30", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", maitre);
    for (const [suffixe, l, h, crf264, crf9] of [["", 600, 1000, 25, 36], ["-mobile", 324, 540, 26, 38]]) {
      const echelle = `scale=${l}:${h}:flags=lanczos`;
      const mp4 = path.join(dst, `hero${suffixe}.mp4`);
      const webm = path.join(dst, `hero${suffixe}.webm`);
      ff("-i", maitre, "-vf", echelle, "-an", "-c:v", "libx264", "-profile:v", "high", "-crf", String(crf264), "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4);
      ff("-i", maitre, "-vf", echelle, "-an", "-c:v", "libvpx-vp9", "-crf", String(crf9), "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", webm);
      console.log(`${nom} hero${suffixe} : mp4 ${ko(mp4)}, webm ${ko(webm)}`);
    }
  }

  // L'affiche : l'état du hero quand la carte ne joue pas.
  const affiche = path.join(dst, "affiche.webp");
  if (cfg.affiche === "tuile") ff("-i", path.join(src, "tuile-000.png"), "-c:v", "libwebp", "-quality", "88", affiche);
  else ff("-ss", String(cfg.affiche), "-i", brut, "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", affiche);
  console.log(`${nom} affiche : ${ko(affiche)}`);

  // La page entière : les tuiles d'un écran, bout à bout, sans chevauchement.
  const { hauteur, ecran, tuiles } = JSON.parse(fs.readFileSync(path.join(src, "tuiles.json"), "utf8"));
  const entrees = [];
  const morceaux = [];
  let fait = 0;
  tuiles.forEach((t, i) => {
    const fin = i + 1 < tuiles.length ? tuiles[i + 1].y : hauteur;
    const debut = Math.max(fait, t.y);
    const haut = fin - debut;
    if (haut <= 0) return;
    entrees.push("-i", path.join(src, t.fichier));
    const k = entrees.length / 2 - 1;
    morceaux.push(`[${k}:v]crop=780:${haut * 2}:0:${(debut - t.y) * 2}[m${k}]`);
    fait = fin;
  });
  const n = morceaux.length;
  const longue = path.join(src, "page-longue.png");
  ff(...entrees, "-filter_complex", `${morceaux.join(";")};${Array.from({ length: n }, (_, k) => `[m${k}]`).join("")}vstack=inputs=${n},scale=600:-2:flags=lanczos[o]`, "-map", "[o]", longue);
  // En tranches de 3000 px : un fichier par tranche, chargé au besoin.
  const hLongue = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=height", "-of", "csv=p=0", longue]).toString().trim());
  const TRANCHE = 3000;
  const tranches = [];
  for (let y = 0, i = 1; y < hLongue; y += TRANCHE, i++) {
    const h = Math.min(TRANCHE, hLongue - y);
    const f = path.join(dst, `page-${i}.webp`);
    ff("-i", longue, "-vf", `crop=600:${h}:0:${y}`, "-c:v", "libwebp", "-quality", "74", f);
    tranches.push({ fichier: path.basename(f), hauteur: h });
  }
  // Les hauteurs des tranches, à reporter dans stalika/lib/realisations.ts.
  fs.writeFileSync(path.join(src, "page.json"), JSON.stringify({ largeur: 600, hauteur: hLongue, tranches }));
  console.log(`${nom} page : ${hLongue} px en ${tranches.length} tranches (${tranches.map((t) => ko(path.join(dst, t.fichier))).join(", ")})`);
}
