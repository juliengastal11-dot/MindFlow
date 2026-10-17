#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Les ordres au téléphone, depuis ce PC. Il faut que `pont.mjs` tourne et que le
   téléphone ait ouvert l'adresse du pont dans Safari.

     node outils/telephone/ctl.mjs clients                      qui est connecté, où, à quelle hauteur de page
     node outils/telephone/ctl.mjs info                         ce que le téléphone dit de lui (fenêtre, zone sûre, flou, mouvement réduit...)
     node outils/telephone/ctl.mjs eval "document.title"        du JavaScript dans la page (plusieurs instructions : finir par return)
     node outils/telephone/ctl.mjs scroll 1200                  défiler à une hauteur (ou : scroll "#livre", scroll fin)
     node outils/telephone/ctl.mjs tap "a[href='#livre']"       toucher un élément (le rapport dit si quelque chose le recouvre)
     node outils/telephone/ctl.mjs rects ".carte" [--styles opacity,color]   position et styles
     node outils/telephone/ctl.mjs texte "#faq"                 le texte visible d'un bloc
     node outils/telephone/ctl.mjs html "#livre"                le HTML d'un bloc
     node outils/telephone/ctl.mjs perf [--de 0] [--a 5000] [--ms 8000]     fluidité : images d'un défilement continu
     node outils/telephone/ctl.mjs journal [--depuis N] [--niveaux erreur,warn,ressource]   console et erreurs de la page
     node outils/telephone/ctl.mjs reload | goto /contact | vider

   Option commune : --client <id> (par défaut, le dernier iPhone qui s'est présenté).
--------------------------------------------------------------------------- */
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const commande = args.shift();

function lire(nom) {
  try {
    return fs.readFileSync(path.join(os.tmpdir(), nom), "utf8").trim();
  } catch {
    return null;
  }
}
const JETON = lire("pont-jeton.txt");
const PORT = lire("pont-controle.txt");
if (!JETON || !PORT) {
  console.error("Le pont ne tourne pas (lance : node outils/telephone/pont.mjs).");
  process.exit(2);
}

function option(nom) {
  const i = args.indexOf("--" + nom);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

function appeler(methode, chemin, corps) {
  return new Promise((ok, ko) => {
    const donnee = corps ? JSON.stringify(corps) : null;
    const req = http.request(
      {
        host: "127.0.0.1",
        port: PORT,
        path: chemin,
        method: methode,
        headers: { "x-pont": JETON, ...(donnee ? { "content-type": "application/json", "content-length": Buffer.byteLength(donnee) } : {}) },
      },
      (res) => {
        const m = [];
        res.on("data", (d) => m.push(d));
        res.on("end", () => {
          try {
            ok(JSON.parse(Buffer.concat(m).toString("utf8")));
          } catch (e) {
            ko(e);
          }
        });
      },
    );
    req.on("error", ko);
    if (donnee) req.write(donnee);
    req.end();
  });
}

const client = option("client");
const sortie = (o) => console.log(JSON.stringify(o, null, 2));

async function cmd(op, corps = {}, extra = {}) {
  const r = await appeler("POST", "/cmd", { client, op, ...corps, ...extra });
  if (!r.ok) {
    console.error("Échec : " + r.erreur);
    process.exit(1);
  }
  sortie(r.valeur);
}

try {
  switch (commande) {
    case "clients": {
      const r = await appeler("GET", "/clients");
      if (!r.clients.length) console.log("Aucun téléphone connecté.");
      else sortie(r.clients);
      break;
    }
    case "info":
      await cmd("info");
      break;
    case "eval":
      await cmd("eval", { code: args.join(" ") });
      break;
    case "scroll": {
      const v = args[0];
      if (v === "fin") await cmd("scroll", { fin: true });
      else if (/^-?\d+(\.\d+)?$/.test(v)) await cmd("scroll", { y: Number(v) });
      else await cmd("scroll", { sel: v, decalage: Number(option("decalage") || 0) });
      break;
    }
    case "tap": {
      const force = args.includes("--force");
      await cmd("tap", { sel: args.filter((a) => a !== "--force")[0], force, index: Number(option("index") || 0) });
      break;
    }
    case "rects": {
      const styles = option("styles");
      await cmd("rects", { sel: args[0], styles: styles ? styles.split(",") : undefined, max: Number(option("max") || 10) });
      break;
    }
    case "texte":
      await cmd("texte", { sel: args[0] });
      break;
    case "html":
      await cmd("html", { sel: args[0] });
      break;
    case "perf": {
      const de = option("de");
      const a = option("a");
      const ms = option("ms");
      await cmd("perf", { de: de != null ? Number(de) : undefined, a: a != null ? Number(a) : undefined, ms: ms ? Number(ms) : 6000 });
      break;
    }
    case "reload":
      await cmd("reload");
      break;
    case "goto":
      await cmd("goto", { url: args[0] });
      break;
    case "journal": {
      const depuis = option("depuis") || 0;
      const niveaux = option("niveaux") || "";
      const r = await appeler("GET", `/journal?depuis=${depuis}&niveaux=${encodeURIComponent(niveaux)}`);
      for (const e of r.lignes) {
        const h = new Date(e.quand).toLocaleTimeString("fr-FR");
        console.log(`[${e.n}] ${h} ${e.client} ${e.niveau} · ${e.texte}${e.pile ? "\n      " + e.pile.split("\n").slice(0, 3).join("\n      ") : ""}`);
      }
      console.log(`(dernier numéro : ${r.dernier})`);
      break;
    }
    case "vider":
      await appeler("POST", "/vider");
      console.log("Journal vidé.");
      break;
    default:
      console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("--------------------------------------------------------------------------- */")[0].replace(/^[\s\S]*?\/\* -+\n/, ""));
  }
} catch (e) {
  console.error("Échec : " + e.message);
  process.exit(1);
}
