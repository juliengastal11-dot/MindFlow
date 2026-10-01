// Petit serveur statique pour capturer un site construit localement.
// node servir.mjs <dossier> <port>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const [racine, port = "4600"] = process.argv.slice(2);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ttf": "font/ttf", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain",
};

http
  .createServer((req, res) => {
    const chemin = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let fichier = path.join(racine, chemin);
    if (!fichier.startsWith(path.resolve(racine))) fichier = path.join(racine, "index.html");
    if (!fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      const index = path.join(fichier, "index.html");
      fichier = fs.existsSync(index) ? index : path.join(racine, "index.html");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fichier).toLowerCase()] ?? "application/octet-stream" });
    fs.createReadStream(fichier).pipe(res);
  })
  .listen(Number(port), () => console.log(`servi sur http://localhost:${port}`));
