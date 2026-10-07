// Capture le site d'AR Transfert pour la scène « La relecture » (voir LISEZMOI.md) : le héros, sans le paragraphe
// d'introduction (la scène le refait en vrai texte pour le réécrire), au repos (entre deux appels de phares), et
// les mesures utiles (paragraphe, phares, voiture).
// node capturer.mjs [bureau] [mobile]   (les deux par défaut)
import { chromium } from "../realisations/node_modules/playwright-core/index.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("sortie", { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true });

const LAYOUTS = {
  bureau: { viewport: { width: 1024, height: 700 }, dpr: 1.5, clip: { x: 0, y: 0, width: 1024, height: 700 } },
  mobile: { viewport: { width: 390, height: 700 }, dpr: 2, clip: { x: 0, y: 140, width: 390, height: 560 } },
};

const seuls = process.argv.slice(2);
for (const [nom, cfg] of Object.entries(LAYOUTS)) {
  if (seuls.length && !seuls.includes(nom)) continue;
  const page = await (await b.newContext({ locale: "fr-FR", viewport: cfg.viewport, deviceScaleFactor: cfg.dpr })).newPage();
  await page.goto("https://ar-transfert-apercu.vercel.app", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(9000);
  // Le paragraphe est refait par la scène ; les éléments flottants (WhatsApp) n'ont rien à faire dans l'image.
  await page.addStyleTag({ content: ".lead{visibility:hidden !important} [href*='wa.me'], [class*='whatsapp' i], .wa{display:none !important}" });
  const fixes = await page.evaluate(() => [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).position === "fixed").map((e) => `${e.tagName}.${e.className}`.slice(0, 80)));
  console.log(nom, "éléments fixes :", fixes.join(" | "));
  const mesures = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, l: b.width, h: b.height }; };
    const lead = document.querySelector(".lead");
    const cs = getComputedStyle(lead);
    return {
      lead: r(".lead"),
      leadStyle: { font: cs.fontFamily, taille: cs.fontSize, interligne: cs.lineHeight, couleur: cs.color, poids: cs.fontWeight, espacement: cs.letterSpacing },
      glowL: r(".glow-l"), glowR: r(".glow-r"), ledL: r(".led-l"), ledR: r(".led-r"),
      photo: r(".photo"), zoom: r(".zoom"), face: r(".face"), plaque: r(".plate"), avail: r(".avail"), h1: r(".h1"), cta: r(".cta"), route: r(".route"),
    };
  });
  writeFileSync(`sortie/mesures-${nom}.json`, JSON.stringify(mesures, null, 1));
  // Dix images à 0,6 s d'écart : on garde la plus calme (la moins lumineuse autour des phares).
  const L = mesures.glowL, R = mesures.glowR;
  const zx = Math.max(0, Math.min(L.x, R.x) - 20);
  const zone = { x: zx, y: Math.max(0, L.y - 40 - cfg.clip.y), w: Math.min(cfg.clip.width - zx, Math.abs(R.x + R.l - L.x) + 40), h: 120 };
  let meilleure = null;
  for (let i = 0; i < 10; i++) {
    const f = `sortie/${nom}-brut-${i}.png`;
    await page.screenshot({ path: f, clip: cfg.clip });
    // luminosité moyenne de la zone des phares (en pixels de l'image)
    const k = cfg.dpr;
    const crop = `crop=${Math.round(zone.w * k)}:${Math.round(zone.h * k)}:${Math.round(zone.x * k)}:${Math.round(zone.y * k)},scale=1:1:flags=area,format=gray`;
    const raw = execFileSync("ffmpeg", ["-v", "error", "-i", f, "-vf", crop, "-frames:v", "1", "-f", "rawvideo", "-"]);
    const luma = raw[0];
    if (!meilleure || luma < meilleure.luma) meilleure = { f, luma, i };
    await page.waitForTimeout(600);
  }
  console.log(nom, "image gardée", meilleure.i, "luma", meilleure.luma);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", meilleure.f, "-c:v", "libwebp", "-quality", "84", `sortie/ar-${nom}.webp`]);
  await page.context().close();
}
await b.close();
