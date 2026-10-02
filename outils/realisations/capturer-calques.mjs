// Capture d'une page « en calques » : le contenu SEUL, sur fond transparent, et les
// mesures dont la carte a besoin pour le poser sur un fond qui ne défile pas.
//
// Pourquoi : certains sites (VTBON) ont un fond fixe derrière toute la page (un film
// que le défilement fait avancer). `capturer.mjs` masque les éléments fixes, et le fond
// disparaît avec eux : la carte montrait du noir. Ici, on retire le fond fixe et la
// couleur de la page, on capture chaque écran avec la transparence (PNG), et on relève :
//   · `finPage` : où finit le défilement (haut du pied de page moins la hauteur de la
//     vue), en pixels CSS de la capture : c'est avec elle que le film avance ;
//   · `hero` : les boîtes des enfants directs de l'entrée du héros, avec leur rang, pour
//     rejouer l'entrée (chacun monte de 28 px et apparaît, l'un après l'autre) ;
//   · `hauteur` : la hauteur de la page.
//
// node capturer-calques.mjs <nom> <url> [sélecteur du fond fixe] [sélecteur des enfants du héros]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const [nom, url, fondFixe = ".fond-video", heros = '[data-mouvement="hero"] > *'] = process.argv.slice(2);
const L = 390;
const H = 650;

const dossier = path.resolve("sorties", nom);
fs.rmSync(dossier, { recursive: true, force: true });
fs.mkdirSync(dossier, { recursive: true });

const navigateur = await chromium.launch({ channel: "chrome", headless: true, args: ["--hide-scrollbars", "--force-device-scale-factor=2"] });
const contexte = await navigateur.newContext({ viewport: { width: L, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR", reducedMotion: "no-preference" });
await contexte.addInitScript((regles) => {
  const poser = () => {
    const style = document.createElement("style");
    style.textContent = regles;
    document.documentElement.appendChild(style);
  };
  if (document.documentElement) poser();
  else document.addEventListener("DOMContentLoaded", poser);
}, `${fondFixe}{display:none!important} html,body{background:transparent!important}`);

const page = await contexte.newPage();
await page.goto(url, { waitUntil: "load", timeout: 90000 });
// Le temps de l'entrée du héros et des effets de départ (soulignements, surpiqûre).
await page.waitForTimeout(7000);

const mesures = await page.evaluate(
  ({ heros }) => {
    const boites = [...document.querySelectorAll(heros)].map((e, rang) => {
      const r = e.getBoundingClientRect();
      return { rang, x0: +r.left.toFixed(1), y0: +(r.top + scrollY).toFixed(1), x1: +r.right.toFixed(1), y1: +(r.bottom + scrollY).toFixed(1) };
    });
    const pied = document.querySelector("footer");
    const hauteur = document.documentElement.scrollHeight;
    const haut = pied ? pied.getBoundingClientRect().top + scrollY : hauteur;
    return { hero: boites, finPage: +Math.max(1, haut - innerHeight).toFixed(1), hauteur };
  },
  { heros },
);

// Un premier passage, lent, pour déclencher tout ce qui apparaît au défilement.
for (let y = 0; y <= mesures.hauteur; y += 300) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(140);
}
await page.waitForTimeout(1500);

// Les barres collantes ou fixes se répéteraient à chaque écran : on les garde au premier
// écran seulement (l'en-tête fait partie du héros), on les masque ensuite.
const masquerFixes = () =>
  page.evaluate(() => {
    for (const e of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(e);
      if (cs.position === "fixed" || (cs.position === "sticky" && e.getBoundingClientRect().height < 160)) {
        e.style.setProperty("visibility", "hidden", "important");
      }
    }
  });

const tuiles = [];
for (let y = 0, i = 0; y < mesures.hauteur; y += H, i++) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(900);
  if (i > 0) await masquerFixes();
  await page.waitForTimeout(60);
  const reel = await page.evaluate(() => window.scrollY);
  const fichier = path.join(dossier, `tuile-${String(i).padStart(3, "0")}.png`);
  await page.screenshot({ path: fichier, omitBackground: true });
  tuiles.push({ fichier: path.basename(fichier), y: reel });
}
fs.writeFileSync(path.join(dossier, "tuiles.json"), JSON.stringify({ hauteur: mesures.hauteur, ecran: H, tuiles }, null, 1));
fs.writeFileSync(path.join(dossier, "calques.json"), JSON.stringify(mesures, null, 1));
console.log(`[${nom}] ${tuiles.length} tuiles transparentes, page de ${mesures.hauteur} px, fin de défilement à ${mesures.finPage} px, ${mesures.hero.length} blocs de héros`);
await navigateur.close();
