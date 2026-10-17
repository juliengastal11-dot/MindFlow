#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Le pont du téléphone : voir et mesurer le site sur un vrai iPhone, depuis ce PC.

   Un iPhone ne se pilote pas depuis Windows (il n'y a pas d'équivalent au débogage
   ADB d'Android). Ce qu'on peut faire, pour un site, c'est piloter la PAGE ouverte
   dans Safari sur le téléphone :

     iPhone (Safari)  ──►  pont.mjs (ce PC, port 3100)  ──►  serveur du site (port 3000)
                              │
                              └─ ajoute à chaque page `client.js`, qui remonte la console et les
                                 erreurs et répond aux ordres de `ctl.mjs` (lire, mesurer, défiler,
                                 toucher, chronométrer les images).

   Le site n'est pas touché : rien de ceci n'est dans son code ni dans sa version en ligne.

   Sécurité, dans l'ordre :
   - le relais écoute sur le réseau local (le téléphone doit l'atteindre) ; il ne donne que ce que
     le serveur du site donne déjà sur ce réseau (Next, en développement, écoute déjà partout) ;
   - les ORDRES passent par une seconde porte, ouverte sur ce PC seulement (127.0.0.1), fermée à
     tout navigateur (pas d'Origin) et protégée par un jeton tiré au sort à chaque démarrage ;
   - un appareil du réseau qui se ferait passer pour le téléphone ne reçoit rien d'autre que ce
     qu'on lui envoie : les prises des téléphones ne se parlent pas entre elles.
   À arrêter quand on a fini (Ctrl+C).

   Usage : node outils/telephone/pont.mjs [--amont http://localhost:3000] [--port 3100]
--------------------------------------------------------------------------- */
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));

function option(nom, defaut) {
  const i = process.argv.indexOf("--" + nom);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut;
}

const AMONT = new URL(option("amont", "http://localhost:3000"));
const PORT = Number(option("port", "3100"));
const PORT_CONTROLE = Number(option("controle", String(PORT + 1)));
const JETON = crypto.randomBytes(16).toString("hex");
const BALISE = '<script src="/__pont/client.js"></script>';
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const FICHIER_JETON = path.join(os.tmpdir(), "pont-jeton.txt");
const FICHIER_PORT = path.join(os.tmpdir(), "pont-controle.txt");

/* --------------------------------- le relais --------------------------------- */

const SAUTS = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);

/** Ce que le serveur du site doit croire : une requête venue de chez lui (sinon Next, en développement,
    se plaint d'une origine inconnue, ou refuse). */
function entetesAmont(req, upgrade) {
  const e = { ...req.headers, host: AMONT.host, "accept-encoding": "identity" };
  if (e.origin) e.origin = AMONT.origin;
  if (e.referer) e.referer = e.referer.replace(/^https?:\/\/[^/]+/i, AMONT.origin);
  if (!upgrade) {
    delete e.connection;
    delete e["keep-alive"];
    delete e.upgrade;
  }
  return e;
}

function relayer(req, res) {
  if (req.url === "/__pont/client.js") {
    res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" });
    return res.end(fs.readFileSync(path.join(ICI, "client.js")));
  }
  const requete = http.request(
    { hostname: AMONT.hostname, port: AMONT.port || 80, path: req.url, method: req.method, headers: entetesAmont(req, false) },
    (reponse) => {
      const entetes = {};
      for (const [k, v] of Object.entries(reponse.headers)) if (!SAUTS.has(k)) entetes[k] = v;
      if (entetes.location) entetes.location = String(entetes.location).split(AMONT.origin).join("http://" + req.headers.host);
      const statut = reponse.statusCode || 200;
      const html = /text\/html/i.test(entetes["content-type"] || "") && !entetes["content-encoding"] && req.method !== "HEAD";
      if (!html) {
        res.writeHead(statut, entetes);
        reponse.pipe(res);
        return;
      }
      // Du HTML : on glisse le script juste AVANT la fermeture de <head>, en gardant le flux (Next envoie la page
      // par morceaux). Pas au début : React hydrate les enfants de <head> dans l'ordre, et un <script> de plus en
      // tête décale tout (alerte « a tree hydrated but some attributes... », vue le 2026-10-17). À la fin, React
      // laisse en paix ce qu'il n'attendait pas.
      delete entetes["content-length"];
      delete entetes.etag;
      res.writeHead(statut, entetes);
      reponse.setEncoding("utf8");
      let tampon = "";
      let fait = false;
      reponse.on("data", (d) => {
        if (fait) return void res.write(d);
        tampon += d;
        const m = /<\/head\s*>/i.exec(tampon);
        if (m) {
          res.write(tampon.slice(0, m.index) + BALISE + tampon.slice(m.index));
          tampon = "";
          fait = true;
        } else if (tampon.length > 65536) {
          res.write(tampon);
          tampon = "";
          fait = true;
        }
      });
      reponse.on("end", () => {
        if (tampon) res.write(tampon);
        res.end();
      });
      reponse.on("error", () => res.end());
    },
  );
  requete.on("error", (e) => {
    if (res.headersSent) return res.end();
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>Site injoignable</title><h1>Le serveur du site ne répond pas</h1><p>${AMONT.origin} · ${e.message}</p><p>Est-il lancé, sur ce port ?</p>`);
  });
  req.pipe(requete);
}

/** Les autres WebSockets (le rechargement à chaud de Next) : on relie les deux prises. */
function relayerUpgrade(req, prise, entete) {
  const requete = http.request({ hostname: AMONT.hostname, port: AMONT.port || 80, path: req.url, method: req.method, headers: entetesAmont(req, true) });
  requete.on("upgrade", (reponse, priseAmont, enteteAmont) => {
    const lignes = ["HTTP/1.1 101 Switching Protocols"];
    for (const [k, v] of Object.entries(reponse.headers)) lignes.push(k + ": " + v);
    prise.write(lignes.join("\r\n") + "\r\n\r\n");
    if (enteteAmont?.length) prise.write(enteteAmont);
    if (entete?.length) priseAmont.write(entete);
    priseAmont.pipe(prise);
    prise.pipe(priseAmont);
    const fermer = () => {
      prise.destroy();
      priseAmont.destroy();
    };
    prise.on("error", fermer);
    priseAmont.on("error", fermer);
    prise.on("close", fermer);
    priseAmont.on("close", fermer);
  });
  requete.on("response", () => prise.destroy()); // l'amont a refusé la mise à niveau
  requete.on("error", () => prise.destroy());
  requete.end();
}

/* ------------------------- les téléphones (WebSocket) ------------------------ */

const clients = new Map(); // id → client
const attentes = new Map(); // id d'ordre → { ok, ko, t, client }
const journal = [];
let numeroJournal = 0;
let compteurOrdres = 0;

function trame(donnee, op = 1) {
  const charge = Buffer.isBuffer(donnee) ? donnee : Buffer.from(donnee, "utf8");
  const n = charge.length;
  let tete;
  if (n < 126) tete = Buffer.from([0x80 | op, n]);
  else if (n < 65536) {
    tete = Buffer.alloc(4);
    tete[0] = 0x80 | op;
    tete[1] = 126;
    tete.writeUInt16BE(n, 2);
  } else {
    tete = Buffer.alloc(10);
    tete[0] = 0x80 | op;
    tete[1] = 127;
    tete.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([tete, charge]);
}

function creerLecteur(rappel, fermer) {
  let tampon = Buffer.alloc(0);
  let fragments = [];
  let opFragment = 0;
  return (morceau) => {
    tampon = Buffer.concat([tampon, morceau]);
    for (;;) {
      if (tampon.length < 2) return;
      const b0 = tampon[0];
      const b1 = tampon[1];
      const fin = (b0 & 0x80) !== 0;
      const op = b0 & 0x0f;
      const masque = (b1 & 0x80) !== 0;
      let n = b1 & 0x7f;
      let i = 2;
      if (n === 126) {
        if (tampon.length < 4) return;
        n = tampon.readUInt16BE(2);
        i = 4;
      } else if (n === 127) {
        if (tampon.length < 10) return;
        const g = tampon.readBigUInt64BE(2);
        if (g > 16n * 1024n * 1024n) return fermer();
        n = Number(g);
        i = 10;
      }
      if (n > 16 * 1024 * 1024) return fermer();
      const debut = i + (masque ? 4 : 0);
      if (tampon.length < debut + n) return;
      let charge = tampon.subarray(debut, debut + n);
      if (masque) {
        const m = tampon.subarray(i, i + 4);
        const c = Buffer.allocUnsafe(n);
        for (let k = 0; k < n; k++) c[k] = charge[k] ^ m[k & 3];
        charge = c;
      }
      tampon = tampon.subarray(debut + n);
      if (op >= 8) {
        rappel(op, charge);
        continue;
      }
      if (op === 0) {
        fragments.push(charge);
        if (fin) {
          rappel(opFragment, Buffer.concat(fragments));
          fragments = [];
        }
        continue;
      }
      if (!fin) {
        opFragment = op;
        fragments = [charge];
        continue;
      }
      rappel(op, charge);
    }
  };
}

function journaliser(c, m) {
  const entree = { n: ++numeroJournal, quand: Date.now(), client: c.id };
  if (m.t === "log") {
    entree.niveau = m.niveau;
    entree.texte = (m.args || []).map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ").slice(0, 1200);
  } else if (m.t === "err") {
    entree.niveau = "erreur";
    entree.texte = `${m.message || ""}${m.source ? " · " + String(m.source).replace(/^https?:\/\/[^/]+/, "") + ":" + m.ligne : ""}`.slice(0, 1200);
    if (m.pile) entree.pile = String(m.pile).slice(0, 800);
  } else if (m.t === "ressource") {
    entree.niveau = "ressource";
    entree.texte = `ne se charge pas : <${m.balise}> ${String(m.src).replace(/^https?:\/\/[^/]+/, "")}`;
  } else if (m.t === "vis") {
    entree.niveau = "visibilité";
    entree.texte = m.etat;
  } else return;
  journal.push(entree);
  if (journal.length > 2000) journal.shift();
  if (["erreur", "ressource", "error", "warn"].includes(entree.niveau)) console.log(`[tel ${c.id}] ${entree.niveau} · ${entree.texte}`);
}

function message(c, texte) {
  let m;
  try {
    m = JSON.parse(texte);
  } catch {
    return;
  }
  switch (m.t) {
    case "hello": {
      c.id = String(m.id || c.id || crypto.randomBytes(3).toString("hex")).replace(/[^\w-]/g, "").slice(0, 16) || "inconnu";
      c.info = m.info || null;
      c.dernierHello = Date.now();
      // La page a été rechargée : l'ancienne prise du même identifiant est remplacée.
      const ancien = clients.get(c.id);
      if (ancien && ancien !== c) ancien.prise.destroy();
      const nouveau = !ancien;
      clients.set(c.id, c);
      if (nouveau) console.log(`[tel ${c.id}] connecté · ${c.ip} · ${(c.ua.match(/(iPhone|iPad|Android)[^)]*/) || [c.ua.slice(0, 50)])[0]} · ${c.info?.url || ""}`);
      break;
    }
    case "etat":
      c.etat = { y: m.y, max: m.max, h: m.h, l: m.l, vu: Date.now() };
      break;
    case "res": {
      const a = attentes.get(m.id);
      if (a) {
        clearTimeout(a.t);
        attentes.delete(m.id);
        if (m.ok) a.ok(m.valeur);
        else a.ko(new Error(m.erreur || "échec"));
      }
      break;
    }
    default:
      if (c.id) journaliser(c, m);
  }
}

function accepterTelephone(req, prise) {
  const cle = req.headers["sec-websocket-key"];
  if (!cle || String(req.headers.upgrade).toLowerCase() !== "websocket") return prise.destroy();
  prise.write(
    "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " +
      crypto.createHash("sha1").update(cle + GUID).digest("base64") +
      "\r\n\r\n",
  );
  prise.setNoDelay(true);
  const c = {
    id: null,
    prise,
    ip: (req.socket.remoteAddress || "").replace(/^::ffff:/, ""),
    ua: String(req.headers["user-agent"] || ""),
    ouvert: true,
    depuis: Date.now(),
    dernierSigne: Date.now(),
    dernierHello: 0,
    info: null,
    etat: null,
    envoyer(texte) {
      if (this.ouvert) prise.write(trame(texte));
    },
  };
  const lire = creerLecteur(
    (op, charge) => {
      c.dernierSigne = Date.now();
      if (op === 1) message(c, charge.toString("utf8"));
      else if (op === 9) prise.write(trame(charge, 10));
      else if (op === 8) {
        c.ouvert = false;
        prise.end(trame(Buffer.alloc(0), 8));
      }
    },
    () => prise.destroy(),
  );
  prise.on("data", lire);
  prise.on("close", () => {
    c.ouvert = false;
    if (c.id && clients.get(c.id) === c) {
      clients.delete(c.id);
      console.log(`[tel ${c.id}] déconnecté`);
    }
    for (const [id, a] of attentes) {
      if (a.client === c) {
        clearTimeout(a.t);
        attentes.delete(id);
        a.ko(new Error("le téléphone s'est déconnecté pendant l'ordre"));
      }
    }
  });
  prise.on("error", () => prise.destroy());
}

setInterval(() => {
  const maintenant = Date.now();
  for (const c of clients.values()) {
    if (maintenant - c.dernierSigne > 45000) c.prise.destroy();
    else if (c.ouvert) c.prise.write(trame("", 9));
  }
}, 15000).unref();

/* ----------------------------- la porte de contrôle ---------------------------- */

function choisir(idDemande) {
  const liste = [...clients.values()].filter((c) => c.ouvert);
  if (idDemande) return liste.find((c) => c.id === idDemande);
  const mobiles = liste.filter((c) => /iPhone|iPad|Android/i.test(c.ua));
  return (mobiles.length ? mobiles : liste).sort((a, b) => b.dernierHello - a.dernierHello)[0];
}

function ordre(client, op, args, delai) {
  return new Promise((ok, ko) => {
    const id = ++compteurOrdres;
    const t = setTimeout(() => {
      attentes.delete(id);
      ko(new Error(`pas de réponse du téléphone en ${Math.round(delai / 1000)} s (écran verrouillé ? Safari en arrière-plan ? page rechargée ?)`));
    }, delai);
    attentes.set(id, { ok, ko, t, client });
    client.envoyer(JSON.stringify({ id, op, ...args }));
  });
}

function resume(c) {
  const i = c.info || {};
  return {
    id: c.id,
    ip: c.ip,
    appareil: (c.ua.match(/(iPhone|iPad|Android)[^)]*/) || [c.ua.slice(0, 60)])[0],
    connecteDepuisS: Math.round((Date.now() - c.depuis) / 1000),
    dernierSigneIlYaS: Math.round((Date.now() - c.dernierSigne) / 1000),
    page: i.url,
    visibilite: i.visibilite,
    fenetre: i.fenetre,
    zoneSure: i.zoneSure,
    defilement: c.etat ? { y: c.etat.y, max: c.etat.max } : i.defilement,
  };
}

function lireCorps(req) {
  return new Promise((ok, ko) => {
    const m = [];
    let taille = 0;
    req.on("data", (d) => {
      taille += d.length;
      if (taille > 1024 * 1024) {
        ko(new Error("corps trop gros"));
        req.destroy();
      } else m.push(d);
    });
    req.on("end", () => ok(Buffer.concat(m).toString("utf8")));
    req.on("error", ko);
  });
}

const controle = http.createServer(async (req, res) => {
  const repondre = (code, objet) => {
    const corps = JSON.stringify(objet);
    res.writeHead(code, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(corps), "cache-control": "no-store" });
    res.end(corps);
  };
  // Pas de navigateur (aucun Origin), pas de rebond DNS (le Host doit être local), et le jeton.
  if (req.headers.origin || req.headers["sec-fetch-site"]) return repondre(403, { ok: false, erreur: "refusé : requête de navigateur" });
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || "")) return repondre(403, { ok: false, erreur: "refusé : Host" });
  if (req.headers["x-pont"] !== JETON) return repondre(401, { ok: false, erreur: "jeton invalide" });
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (req.method === "GET" && url.pathname === "/clients") return repondre(200, { ok: true, clients: [...clients.values()].filter((c) => c.ouvert).map(resume) });
    if (req.method === "GET" && url.pathname === "/info") {
      const c = choisir(url.searchParams.get("client"));
      return repondre(200, c ? { ok: true, info: c.info } : { ok: false, erreur: "aucun téléphone connecté" });
    }
    if (req.method === "GET" && url.pathname === "/journal") {
      const depuis = Number(url.searchParams.get("depuis") || 0);
      const niveaux = (url.searchParams.get("niveaux") || "").split(",").filter(Boolean);
      const max = Number(url.searchParams.get("max") || 200);
      const lignes = journal.filter((e) => e.n > depuis && (!niveaux.length || niveaux.includes(e.niveau))).slice(-max);
      return repondre(200, { ok: true, dernier: numeroJournal, lignes });
    }
    if (req.method === "POST" && url.pathname === "/vider") {
      journal.length = 0;
      return repondre(200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/cmd") {
      const corps = JSON.parse((await lireCorps(req)) || "{}");
      const { client: idClient, op, delai, ...args } = corps;
      if (!op) return repondre(400, { ok: false, erreur: "op manquante" });
      const c = choisir(idClient);
      if (!c) return repondre(409, { ok: false, erreur: "aucun téléphone connecté : ouvre l'adresse du pont dans Safari" });
      const limite = Number(delai) || (op === "perf" ? (args.ms || 6000) + 15000 : 20000);
      try {
        const valeur = await ordre(c, op, args, limite);
        return repondre(200, { ok: true, client: c.id, valeur });
      } catch (e) {
        return repondre(200, { ok: false, client: c.id, erreur: e.message });
      }
    }
    return repondre(404, { ok: false, erreur: "route inconnue" });
  } catch (e) {
    return repondre(500, { ok: false, erreur: e.message });
  }
});

/* --------------------------------- démarrage --------------------------------- */

const serveur = http.createServer(relayer);
serveur.on("upgrade", (req, prise, entete) => {
  if (req.url.split("?")[0] === "/__pont/tel") accepterTelephone(req, prise);
  else relayerUpgrade(req, prise, entete);
});
serveur.on("clientError", (e, prise) => prise.destroy());

function nettoyer() {
  for (const f of [FICHIER_JETON, FICHIER_PORT]) fs.rmSync(f, { force: true });
}
process.on("SIGINT", () => {
  nettoyer();
  process.exit(0);
});
process.on("SIGTERM", () => {
  nettoyer();
  process.exit(0);
});
process.on("exit", nettoyer);

serveur.on("error", (e) => {
  console.error(e.code === "EADDRINUSE" ? `Le port ${PORT} est déjà pris : un pont tourne peut-être déjà (--port pour en choisir un autre).` : e.message);
  process.exit(1);
});

serveur.listen(PORT, "0.0.0.0", () => {
  controle.listen(PORT_CONTROLE, "127.0.0.1", () => {
    fs.writeFileSync(FICHIER_JETON, JETON);
    fs.writeFileSync(FICHIER_PORT, String(PORT_CONTROLE));
    const adresses = Object.values(os.networkInterfaces())
      .flat()
      .filter((a) => a && a.family === "IPv4" && !a.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(a.address))
      .map((a) => `http://${a.address}:${PORT}`);
    console.log("Pont du téléphone prêt.");
    console.log(`  Sur l'iPhone, dans Safari, même Wi-Fi que le PC :  ${adresses.join("   ") || "(aucune adresse de réseau local trouvée)"}`);
    console.log(`  Site relayé : ${AMONT.origin}`);
    console.log(`  Ordres (ce PC seulement) : node outils/telephone/ctl.mjs clients`);
  });
});
