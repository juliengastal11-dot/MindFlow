// Capture d'un site au format de la carte de la roue (390 × 650 px CSS, densité 2) :
//   1. le haut de page « en action » : les images du compositeur (CDP screencast),
//      horodatées, depuis l'ouverture de la page, pendant `duree` secondes ;
//   2. la page entière jusqu'au pied de page, après un premier passage qui
//      déclenche les apparitions au défilement : une image pleine page, et la même
//      page en tuiles d'un écran (pour comparer les deux rendus).
//
// node capturer.mjs <nom> <url> <duree en s> [--sans-page]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const [nom, url, dureeTexte = "8", ...options] = process.argv.slice(2);
const duree = Number(dureeTexte) * 1000;
const sansPage = options.includes("--sans-page");
const L = 390;
const H = 650;

const dossier = path.resolve("sorties", nom);
fs.rmSync(path.join(dossier, "images"), { recursive: true, force: true });
fs.mkdirSync(path.join(dossier, "images"), { recursive: true });

// Ce qui n'appartient pas au site : outils d'essai, bandeaux de consentement.
const MASQUES = {
  pizzeria: "[data-bandeau-essai]{display:none!important}",
};
const css = MASQUES[nom] ?? "";

const navigateur = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-device-scale-factor=2"],
});
const contexte = await navigateur.newContext({
  viewport: { width: L, height: H },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "fr-FR",
  reducedMotion: "no-preference",
});
if (css) {
  await contexte.addInitScript((regles) => {
    const poser = () => {
      const style = document.createElement("style");
      style.dataset.capture = "";
      style.textContent = regles;
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) poser();
    else document.addEventListener("DOMContentLoaded", poser);
  }, css);
}

const page = await contexte.newPage();
const cdp = await contexte.newCDPSession(page);
const images = [];
let debut = null;
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  images.push({ data, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: L * 2, maxHeight: H * 2, everyNthFrame: 1 });
const tAvant = Date.now() / 1000;
await page.goto(url, { waitUntil: "commit", timeout: 60000 });
debut = Date.now() / 1000;
await page.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(duree);
await cdp.send("Page.stopScreencast");

// Les images, et leur durée réelle d'affichage (écart avec la suivante).
const lignes = ["ffconcat version 1.0"];
images.forEach((im, i) => {
  const fichier = `images/${String(i).padStart(5, "0")}.jpg`;
  fs.writeFileSync(path.join(dossier, fichier), Buffer.from(im.data, "base64"));
  const suivante = images[i + 1]?.t ?? im.t + 1 / 30;
  lignes.push(`file '${fichier}'`, `duration ${Math.max(0.001, suivante - im.t).toFixed(4)}`);
});
// ffconcat ignore la durée de la dernière entrée : on la répète.
if (images.length) lignes.push(`file 'images/${String(images.length - 1).padStart(5, "0")}.jpg'`);
fs.writeFileSync(path.join(dossier, "images.ffconcat"), lignes.join("\n"));
const t0 = images[0]?.t ?? 0;
fs.writeFileSync(
  path.join(dossier, "temps.json"),
  JSON.stringify({ premiere: t0, ouverture: debut, avantNavigation: tAvant, horodatages: images.map((im) => +(im.t - t0).toFixed(3)) }),
);
console.log(`[${nom}] ${images.length} images en ${(images.at(-1)?.t - t0 || 0).toFixed(1)} s`);

if (!sansPage) {
  // Premier passage, lent, pour déclencher tout ce qui apparaît au défilement.
  const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= hauteur; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(1200);

  // En tuiles d'un écran : ce que l'œil voit vraiment en descendant. Les barres
  // fixes ou collantes (en-tête, barre d'actions, bouton WhatsApp) et les fonds
  // fixes sont masqués : bout à bout, ils se répéteraient à chaque écran.
  const masquerFixes = () =>
    page.evaluate(() => {
      for (const e of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(e);
        if (cs.position === "fixed" || (cs.position === "sticky" && e.getBoundingClientRect().height < 160)) {
          e.style.setProperty("visibility", "hidden", "important");
        }
      }
    });
  const hauteurFinale = await page.evaluate(() => document.documentElement.scrollHeight);
  const tuiles = [];
  for (let y = 0, i = 0; y < hauteurFinale; y += H, i++) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(900);
    await masquerFixes();
    await page.waitForTimeout(60);
    const reel = await page.evaluate(() => window.scrollY);
    const fichier = path.join(dossier, `tuile-${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: fichier });
    tuiles.push({ fichier: path.basename(fichier), y: reel });
  }
  fs.writeFileSync(path.join(dossier, "tuiles.json"), JSON.stringify({ hauteur: hauteurFinale, ecran: H, tuiles }, null, 1));

  console.log(`[${nom}] page de ${hauteurFinale} px, ${tuiles.length} tuiles`);
}

await navigateur.close();
