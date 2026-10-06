// Fabrique les médias des cartes de la roue à partir des captures :
//   hero.mp4 / hero.webm (600 × 1000) et hero-mobile.* (324 × 540), affiche.webp
//   (780 × 1300, Next en tire les tailles), et la page entière en tranches
//   page-N.webp (600 px de large) pour le défilement dans la carte.
//
// node produire.mjs <dossier des médias> [sites…]   (tous les sites par défaut)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [SORTIE, ...seuls] = process.argv.slice(2);
const SITES = {
  // boucle : segment [de, a], fondu de `fondu` s avec ce qui précède `de`.
  // Capture du 2026-10-06 (le site refait en Astro, style ElevenLabs) : la page arrive à 0,47 s, le
  // titre monte jusqu'à 2,6 s, la devanture (photo) entre à 1,5 s et sa vidéo démarre vers 2,7 s,
  // en boucle. Deux bouts distants d'un tour de la vidéo (9,7 s dans la capture), au fondu d'une
  // seconde : les halos de couleur du fond dérivent lentement (34 à 47 s) et ne se recalent pas.
  pizzeria: { video: { type: "entree-boucle", de: 0.47, boucle: [3.733, 13.433], fondu: 1.0 }, affiche: 5.0, hautAffiche: true },
  // (une entrée seule, jouée une fois puis tenue : `{ type: "entree", de, a }`)
  // entrée puis boucle : l'arrivée [de, boucle[0] + fondu], puis la boucle sans
  // couture [boucle[0], boucle[1]] ; la carte reprend la lecture au début de la
  // boucle (instant affiché, à reporter dans `reprise`).
  popec: { video: { type: "entree-boucle", de: 0.68, boucle: [1.8, 5.3], fondu: 0.8 }, affiche: 2.6 },
  // L'arrivée : l'ouverture du site en trois temps (les phares seuls, avec le logo qui
  // s'écrit, puis la voiture qui sort de l'ombre, le titre qui s'écrit et le reste, 3,7 s
  // en tout). Puis la boucle, sur deux rythmes qui ne se recalent jamais : un appel de
  // phares toutes les 4 s, un sur deux suivi du reflet sur le pare-brise, et le reflet du
  // bouton « Réserver » de l'en-tête toutes les 4,3 s environ. Ses deux bouts tombent quand
  // les deux sont au repos, dans le même état : un fondu court suffit. Instants relevés image
  // par image sur la vidéo brute (écart d'une image à la suivante, par zone : la voiture, le
  // bouton, avec `mesurer.cjs` ; puis `couture.cjs` pour les bouts) ; ils changent à chaque capture, la page ne
  // s'affichant pas toujours au même instant (capture du 2026-10-05 : première lueur à 0,47 s,
  // ouverture finie à 3,9 s, appels de phares à 6,4 · 10,4 · 14,4 · 18,4 s).
  // `hautAffiche` : le haut de la page prend l'affiche (la voiture au repos) : la capture de la
  // page entière tombe à un moment quelconque de la boucle de phares, et ce haut de page est ce
  // qu'on voit quand la vidéo ne joue pas.
  "ar-transfert": { video: { type: "entree-boucle", de: 0.4, boucle: [4.1, 17.1], fondu: 0.3 }, affiche: 7.6, hautAffiche: true },
};
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const ko = (f) => `${Math.round(fs.statSync(f).size / 1024)} ko`;

for (const [nom, cfg] of Object.entries(SITES)) {
  if (seuls.length && !seuls.includes(nom)) continue;
  const src = path.resolve("sorties", nom);
  const dst = path.join(SORTIE, nom);
  fs.mkdirSync(dst, { recursive: true });
  const brut = path.join(src, "brut.mp4");

  // La vidéo du hero, en deux tailles.
  if (cfg.video) {
    const v = cfg.video;
    let filtre;
    let cles = [];
    if (v.type === "boucle" && v.fondu > 0) {
      // A = [de, a] ; B = [de - fondu, de] ; A se fond dans B : la dernière image
      // est la première de A, la boucle n'a pas de couture.
      filtre = `[0:v]trim=${v.de}:${v.a},setpts=PTS-STARTPTS[a];[0:v]trim=${v.de - v.fondu}:${v.de},setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=${v.fondu}:offset=${v.a - v.de - v.fondu}[o]`;
    } else if (v.type === "entree-boucle") {
      // L'arrivée E = [de, d], d = début de la boucle + fondu ; puis la boucle
      // A = [d, fin] fondue dans B = [début, d] : elle finit sur l'image où elle
      // commence, qui est aussi la dernière de l'arrivée.
      const [b0, b1] = v.boucle;
      const d = b0 + v.fondu;
      filtre = `[0:v]trim=${v.de}:${d},setpts=PTS-STARTPTS[e];[0:v]trim=${d}:${b1},setpts=PTS-STARTPTS[a];[0:v]trim=${b0}:${d},setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=${v.fondu}:offset=${b1 - d - v.fondu}[l];[e][l]concat=n=2:v=1:a=0[o]`;
      // Une image clé à la reprise : le saut en arrière ne doit pas attendre.
      const reprise = +(d - v.de).toFixed(3);
      cles = ["-force_key_frames", String(reprise)];
      console.log(`${nom} : reprise de la boucle à ${reprise} s`);
    } else {
      filtre = `[0:v]trim=${v.de}:${v.a},setpts=PTS-STARTPTS[o]`;
    }
    const maitre = path.join(src, "maitre.mp4");
    ff("-i", brut, "-filter_complex", filtre, "-map", "[o]", "-r", "30", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", maitre);
    for (const [suffixe, l, h, crf264, crf9] of [["", 600, 1000, 25, 36], ["-mobile", 324, 540, 26, 38]]) {
      // Les images capturées sont des JPEG, en plage de couleurs pleine : on les
      // ramène à la plage vidéo. En plage pleine, Chrome refuse de décoder le
      // WebM (PIPELINE_ERROR_DECODE, constaté le 2026-10-01) ; le MP4 passait.
      const echelle = `scale=${l}:${h}:flags=lanczos:out_range=tv,format=yuv420p`;
      const mp4 = path.join(dst, `hero${suffixe}.mp4`);
      const webm = path.join(dst, `hero${suffixe}.webm`);
      ff("-i", maitre, "-vf", echelle, "-an", ...cles, "-c:v", "libx264", "-profile:v", "high", "-crf", String(crf264), "-preset", "slow", "-pix_fmt", "yuv420p", "-color_range", "tv", "-movflags", "+faststart", mp4);
      ff("-i", maitre, "-vf", echelle, "-an", ...cles, "-c:v", "libvpx-vp9", "-crf", String(crf9), "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-color_range", "tv", webm);
      console.log(`${nom} hero${suffixe} : mp4 ${ko(mp4)}, webm ${ko(webm)}`);
    }
  }

  // L'affiche : l'état du hero quand la carte ne joue pas.
  const affiche = path.join(dst, "affiche.webp");
  if (cfg.affiche === "tuile") ff("-i", path.join(src, "tuile-000.png"), "-c:v", "libwebp", "-quality", "88", affiche);
  else ff("-ss", String(cfg.affiche), "-i", brut, "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", affiche);
  console.log(`${nom} affiche : ${ko(affiche)}`);

  // La page entière : d'un seul tenant si elle a été prise ainsi (`--pleine-page`),
  // sinon les tuiles d'un écran, bout à bout, sans chevauchement.
  const longue = path.join(src, "page-longue.png");
  const pleine = path.join(src, "page-pleine.png");
  if (fs.existsSync(pleine)) {
    ff("-i", pleine, "-vf", "scale=600:-2:flags=lanczos", longue);
  } else {
    const { hauteur, tuiles } = JSON.parse(fs.readFileSync(path.join(src, "tuiles.json"), "utf8"));
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
    ff(...entrees, "-filter_complex", `${morceaux.join(";")};${Array.from({ length: n }, (_, k) => `[m${k}]`).join("")}vstack=inputs=${n},scale=600:-2:flags=lanczos[o]`, "-map", "[o]", longue);
  }
  // Le haut de la page, remplacé par l'affiche : 600 × 1000 px, la hauteur d'une carte.
  if (cfg.hautAffiche) {
    const recouverte = path.join(src, "page-longue-affiche.png");
    ff("-i", longue, "-ss", String(cfg.affiche), "-i", brut, "-filter_complex", "[1:v]scale=600:1000:flags=lanczos[h];[0:v][h]overlay=0:0", "-frames:v", "1", recouverte);
    fs.copyFileSync(recouverte, longue);
  }
  // En tranches de 3000 px : un fichier par tranche, chargé au besoin.
  const hLongue = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=height", "-of", "csv=p=0", longue]).toString().trim());
  const TRANCHE = 3000;
  const tranches = [];
  // Les tranches d'une capture précédente partent : la page a pu raccourcir.
  for (const f of fs.readdirSync(dst)) if (/^page-\d+\.webp$/.test(f)) fs.rmSync(path.join(dst, f));
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
