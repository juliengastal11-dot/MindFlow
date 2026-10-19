// La montre qui se relève : photographie la pile de pièces telle qu'elle est dans la page au début de la relève, sur fond
// transparent, dans le repère de la vue éclatée (le site doit tourner en local, port 3000). Ensuite : python releve.py.
//   node photographier-pile.mjs
// La zone (250, 850, 490 × 630 pixels d'éclaté, à 2 pixels par pixel) et l'instant (le début de la relève, TEMPS.releve.de
// dans stalika/lib/montre-photo.ts) doivent suivre releve.py et la page.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ICI = path.dirname(fileURLToPath(import.meta.url));
const fichier = path.join(ICI, "sortie", "releve-pile.png");
const [p, x0, y0, l, h, e] = [0.8049, 250, 850, 490, 630, 2];
const L = Math.round(+l * +e), H = Math.round(+h * +e);
const port = 9354;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP || "/tmp"}/chrome-pile-montre`, "--hide-scrollbars", "--no-first-run", "--enable-gpu", "--ignore-gpu-blocklist", "about:blank"], { stdio: "ignore" });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let cible;
for (let k = 0; k < 50 && !cible; k++) { try { cible = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} await attendre(200); }
const ws = new WebSocket(cible.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const at = new Map(); const ev = [];
ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && at.has(d.id)) { at.get(d.id)(d); at.delete(d.id); } else if (d.method) ev.forEach((f) => f(d)); });
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; at.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const val = async (expression) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await cdp("Page.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: L, height: H, deviceScaleFactor: 1, mobile: false });
const charge = new Promise((r) => ev.push((m) => m.method === "Page.loadEventFired" && r()));
await cdp("Page.navigate", { url: "http://localhost:3000" + (process.env.CHEMIN || "/") });
await Promise.race([charge, attendre(25000)]); await attendre(2500);
await val(`(() => { [...document.querySelectorAll('button')].find((b) => /Non merci/.test(b.textContent || ''))?.click(); return 1; })()`);
const haut = await val(`document.querySelector('#livre [data-piste]').getBoundingClientRect().top + scrollY`);
const course = await val(`document.querySelector('#livre [data-piste]').offsetHeight - innerHeight`);
await val(`scrollTo(0, ${haut})`);
const t0 = Date.now();
while (!(await val(`!!document.querySelector(".chrono-photo[data-prete]")`)) && Date.now() - t0 < 40000) await attendre(300);
await attendre(800);
await val(`scrollTo(0, ${haut} + ${p} * ${course})`);
await attendre(2500);
console.log("progression", await val(`document.querySelector('#livre').__film?.progress()`));
const ok = await val(`(() => {
  const plat = document.querySelector('[data-platine]');
  plat.style.transform = 'translate3d(${-x0 * e}px, ${-y0 * e}px, 0) scale(${e})';
  for (const n of document.querySelectorAll('body *')) {
    if (plat.contains(n)) continue;
    if (n.contains(plat)) { n.style.background = 'transparent'; n.style.boxShadow = 'none'; continue; }
    n.style.visibility = 'hidden';
  }
  document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
  document.querySelector('nextjs-portal')?.remove();
  return getComputedStyle(document.querySelector('[data-eclate]')).visibility;
})()`);
console.log("pile", ok);
await cdp("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await attendre(600);
const img = await cdp("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(fichier, Buffer.from(img.result.data, "base64"));
console.log("ok", fichier, L, H);
ws.close(); chrome.kill(); process.exit(0);
