/* ---------------------------------------------------------------------------
   Le pont, côté téléphone.

   Ce script n'est PAS dans le site : `pont.mjs` l'ajoute à chaque page HTML qu'il
   relaie, en développement seulement. Il fait trois choses :
   1. il se présente (modèle, taille de la fenêtre, zone sûre, mouvement réduit,
      flou pris en charge...) ;
   2. il remonte ce qui se passe dans la page : console, erreurs, images ou
      vidéos qui ne se chargent pas ;
   3. il exécute les ordres envoyés depuis le PC : lire, mesurer, défiler, toucher,
      chronométrer les images d'un défilement.

   Ce qu'il ne peut pas faire : prendre une capture d'écran (Safari ne le permet pas
   à une page), ni de vrais touchers : un « toucher » ici est une suite d'évènements
   envoyée à l'élément, comme le ferait un doigt, mais ce n'est pas un doigt.
--------------------------------------------------------------------------- */
(function () {
  "use strict";
  if (window.__pont) return;
  window.__pont = { version: 1 };

  var MAX_TEXTE = 4000;
  var MAX_REPONSE = 900000;
  var ws = null;
  var pret = false;
  var file = [];
  var essais = 0;
  var minuterie = null;
  var compteLog = 0;
  var debutFenetreLog = 0;
  var dernierY = null;

  var id = null;
  try { id = sessionStorage.getItem("__pont_id"); } catch (e) {}
  if (!id) {
    id = Math.random().toString(36).slice(2, 8);
    try { sessionStorage.setItem("__pont_id", id); } catch (e) {}
  }

  /* ------------------------------- sérialisation ------------------------------ */

  function arrondi(x) { return Math.round(x * 10) / 10; }

  function decrire(n) {
    try {
      if (n === window) return "[window]";
      if (n === document) return "[document]";
      if (n.nodeType === 1) {
        var s = "<" + n.tagName.toLowerCase();
        if (n.id) s += "#" + n.id;
        var c = typeof n.className === "string" ? n.className.trim() : "";
        if (c) s += "." + c.split(/\s+/).slice(0, 4).join(".");
        return s + ">";
      }
      if (n.nodeType === 3) return "#texte(" + String(n.data).slice(0, 40) + ")";
    } catch (e) {}
    return "[noeud]";
  }

  function serialiser(v, prof, vus) {
    if (prof == null) prof = 4;
    var t = typeof v;
    if (v === null) return null;
    if (t === "undefined") return { "$": "undefined" };
    if (t === "string") return v.length > MAX_TEXTE ? v.slice(0, MAX_TEXTE) + "... (" + v.length + " car.)" : v;
    if (t === "number") return isFinite(v) ? v : { "$": String(v) };
    if (t === "boolean") return v;
    if (t === "bigint") return { "$": "bigint", v: String(v) };
    if (t === "symbol") return { "$": String(v) };
    if (t === "function") return { "$": "fonction", nom: v.name || "" };
    vus = vus || [];
    if (vus.indexOf(v) > -1) return { "$": "circulaire" };
    if (v instanceof Error) return { "$": "Error", nom: v.name, message: v.message, pile: String(v.stack || "").slice(0, 1500) };
    if (typeof Node !== "undefined" && v instanceof Node) return { "$": decrire(v) };
    if (typeof DOMRectReadOnly !== "undefined" && v instanceof DOMRectReadOnly) {
      return { x: arrondi(v.x), y: arrondi(v.y), w: arrondi(v.width), h: arrondi(v.height) };
    }
    if (v instanceof Date) return { "$": "Date", v: isNaN(v) ? "invalide" : v.toISOString() };
    if (v instanceof RegExp) return { "$": String(v) };
    if (prof <= 0) return { "$": Array.isArray(v) ? "Array(" + v.length + ")" : "Object" };
    vus = vus.concat([v]);
    if (typeof Map !== "undefined" && v instanceof Map) return { "$": "Map", v: serialiser(Array.from(v.entries()), prof - 1, vus) };
    if (typeof Set !== "undefined" && v instanceof Set) return { "$": "Set", v: serialiser(Array.from(v.values()), prof - 1, vus) };
    var listeLike =
      Array.isArray(v) ||
      (typeof NodeList !== "undefined" && v instanceof NodeList) ||
      (typeof HTMLCollection !== "undefined" && v instanceof HTMLCollection) ||
      (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v) && !(v instanceof DataView));
    if (listeLike) {
      var tab = [];
      var n = Math.min(v.length, 200);
      for (var i = 0; i < n; i++) tab.push(serialiser(v[i], prof - 1, vus));
      if (v.length > n) tab.push({ "$": "+" + (v.length - n) + " éléments" });
      return tab;
    }
    var o = {};
    var k = 0;
    for (var cle in v) {
      if (k++ > 60) { o["..."] = "tronqué"; break; }
      try { o[cle] = serialiser(v[cle], prof - 1, vus); } catch (e) { o[cle] = { "$": "illisible" }; }
    }
    return o;
  }

  /* --------------------------------- envoi ----------------------------------- */

  function envoyer(o) {
    var s;
    try { s = JSON.stringify(o); } catch (e) { s = JSON.stringify({ t: "err", message: "sérialisation impossible" }); }
    if (pret && ws && ws.readyState === 1) ws.send(s);
    else {
      file.push(s);
      if (file.length > 200) file.shift();
    }
  }

  /* --------------------------- ce que le téléphone est ------------------------- */

  function zoneSure() {
    try {
      var sonde = document.createElement("div");
      sonde.style.cssText =
        "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
        "padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);" +
        "padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)";
      document.documentElement.appendChild(sonde);
      var cs = getComputedStyle(sonde);
      var r = { haut: cs.paddingTop, droite: cs.paddingRight, bas: cs.paddingBottom, gauche: cs.paddingLeft };
      sonde.remove();
      return r;
    } catch (e) { return null; }
  }

  function prend(prop, valeur) {
    try { return CSS.supports(prop, valeur); } catch (e) { return null; }
  }

  function infos() {
    var vv = window.visualViewport;
    var rep = document.documentElement;
    return {
      ua: navigator.userAgent,
      plateforme: navigator.platform,
      url: location.href,
      titre: document.title,
      ecran: { l: screen.width, h: screen.height },
      fenetre: { l: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      visuel: vv ? { l: arrondi(vv.width), h: arrondi(vv.height), echelle: vv.scale, haut: arrondi(vv.offsetTop) } : null,
      zoneSure: zoneSure(),
      tactile: navigator.maxTouchPoints,
      mouvementReduit: matchMedia("(prefers-reduced-motion: reduce)").matches,
      transparenceReduite: matchMedia("(prefers-reduced-transparency: reduce)").matches,
      sombre: matchMedia("(prefers-color-scheme: dark)").matches,
      survol: matchMedia("(hover: hover)").matches,
      autonome: navigator.standalone === true,
      flou: prend("backdrop-filter", "blur(1px)") || prend("-webkit-backdrop-filter", "blur(1px)"),
      unitesSvh: prend("height", "100svh"),
      unitesDvh: prend("height", "100dvh"),
      contexteSecurise: window.isSecureContext,
      defilement: { y: Math.round(scrollY), max: Math.max(0, rep.scrollHeight - innerHeight) },
      visibilite: document.visibilityState
    };
  }

  /* ------------------------------ ce qui se passe ------------------------------ */

  ["log", "info", "warn", "error", "debug"].forEach(function (niveau) {
    var orig = console[niveau];
    console[niveau] = function () {
      try {
        var maintenant = Date.now();
        if (maintenant - debutFenetreLog > 1000) { debutFenetreLog = maintenant; compteLog = 0; }
        if (++compteLog <= 60) {
          envoyer({ t: "log", niveau: niveau, args: [].slice.call(arguments).map(function (a) { return serialiser(a, 3); }) });
        }
      } catch (e) {}
      return orig.apply(console, arguments);
    };
  });

  window.addEventListener("error", function (e) {
    if (e.target && e.target !== window && e.target.tagName) {
      var src = e.target.currentSrc || e.target.src || e.target.href || "";
      envoyer({ t: "ressource", balise: e.target.tagName.toLowerCase(), src: String(src).slice(0, 300) });
      return;
    }
    envoyer({
      t: "err",
      message: String(e.message),
      source: e.filename,
      ligne: e.lineno,
      colonne: e.colno,
      pile: e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : ""
    });
  }, true);

  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    envoyer({ t: "err", message: "promesse rejetée : " + (r && r.message ? r.message : String(r)), pile: r && r.stack ? String(r.stack).slice(0, 1500) : "" });
  });

  document.addEventListener("visibilitychange", function () {
    envoyer({ t: "vis", etat: document.visibilityState });
    if (document.visibilityState === "visible") envoyer({ t: "hello", id: id, info: infos() });
  });

  setInterval(function () {
    if (!pret) return;
    var y = Math.round(scrollY);
    if (y === dernierY) return;
    dernierY = y;
    envoyer({ t: "etat", y: y, max: Math.max(0, document.documentElement.scrollHeight - innerHeight), h: innerHeight, l: innerWidth });
  }, 1200);

  /* -------------------------------- les ordres -------------------------------- */

  function attendre(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  function trouver(sel, index) {
    var liste = document.querySelectorAll(sel);
    return liste[index || 0] || null;
  }

  function statistiques(dts, duree) {
    var tri = dts.slice().sort(function (a, b) { return a - b; });
    var n = tri.length;
    if (!n) return { images: 0 };
    var q = function (p) { return arrondi(tri[Math.min(n - 1, Math.floor(p * n))]); };
    var somme = 0;
    for (var i = 0; i < n; i++) somme += dts[i];
    var mediane = tri[Math.floor(n / 2)];
    var lentes = 0;
    var tresLentes = 0;
    for (var j = 0; j < n; j++) {
      if (dts[j] > mediane * 2) lentes++;
      if (dts[j] > 50) tresLentes++;
    }
    return {
      images: n,
      duree_ms: Math.round(duree),
      fps_moyen: arrondi(1000 / (somme / n)),
      image_mediane_ms: arrondi(mediane),
      image_p95_ms: q(0.95),
      image_p99_ms: q(0.99),
      image_max_ms: arrondi(tri[n - 1]),
      saccades_plus_de_2x_mediane: lentes,
      images_de_plus_de_50ms: tresLentes
    };
  }

  function evenement(cible, type, x, y, constructeur, extra) {
    var base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window };
    for (var k in extra || {}) base[k] = extra[k];
    try { cible.dispatchEvent(new constructeur(type, base)); } catch (e) {}
  }

  var OPS = {
    ping: function () { return "pong"; },

    info: function () { return infos(); },

    /* Du JavaScript exécuté dans la page. Une expression (« document.title ») donne sa valeur ;
       pour plusieurs instructions, finir par `return`. `await` est permis. */
    eval: function (m) {
      var f;
      try { f = new Function("return (async () => (" + m.code + "\n))()"); }
      catch (e1) {
        try { f = new Function("return (async () => {" + m.code + "\n})()"); }
        catch (e2) { throw e1; }
      }
      return f();
    },

    scroll: function (m) {
      var y = m.y;
      if (m.sel) {
        var el = trouver(m.sel, m.index);
        if (!el) throw new Error("introuvable : " + m.sel);
        y = el.getBoundingClientRect().top + scrollY + (m.decalage || 0);
      }
      if (m.fin) y = document.documentElement.scrollHeight;
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      return attendre(m.attente || 300).then(function () {
        return { y: Math.round(scrollY), max: Math.max(0, document.documentElement.scrollHeight - innerHeight) };
      });
    },

    /* Une suite d'évènements envoyée à ce qu'un doigt toucherait au centre de l'élément. Si quelque
       chose le recouvre (un bandeau, un menu), le rapport le dit et rien n'est envoyé, sauf `force`. */
    tap: function (m) {
      var el = null;
      if (m.sel) {
        el = trouver(m.sel, m.index);
        if (!el) throw new Error("introuvable : " + m.sel);
        if (!m.sansDefiler) el.scrollIntoView({ block: "center", behavior: "instant" });
      }
      return attendre(m.sansDefiler ? 0 : 250).then(function () {
        var x = m.x;
        var y = m.y;
        if (x == null || y == null) {
          var r = el.getBoundingClientRect();
          x = r.left + r.width / 2;
          y = r.top + r.height / 2;
        }
        var touche = document.elementFromPoint(x, y);
        if (!touche) throw new Error("rien au point " + Math.round(x) + "," + Math.round(y) + " (hors de l'écran ?)");
        var recouvert = !!(el && touche !== el && !el.contains(touche) && !touche.contains(el));
        var rapport = { point: [Math.round(x), Math.round(y)], cible: decrire(touche), recouvert: recouvert, fait: false };
        if (recouvert && !m.force) return rapport;
        evenement(touche, "pointerdown", x, y, window.PointerEvent || MouseEvent, { pointerType: "touch", isPrimary: true, pointerId: 1 });
        evenement(touche, "mousedown", x, y, MouseEvent);
        evenement(touche, "pointerup", x, y, window.PointerEvent || MouseEvent, { pointerType: "touch", isPrimary: true, pointerId: 1 });
        evenement(touche, "mouseup", x, y, MouseEvent);
        evenement(touche, "click", x, y, MouseEvent);
        rapport.fait = true;
        return rapport;
      });
    },

    /* Position et styles de tout ce qui correspond à un sélecteur (ou à une liste). */
    rects: function (m) {
      var sels = [].concat(m.sel);
      var styles = m.styles || ["display", "position", "opacity", "visibility", "color", "backgroundColor", "fontSize", "transform"];
      return sels.map(function (s) {
        var liste = document.querySelectorAll(s);
        var sortie = [];
        for (var i = 0; i < Math.min(liste.length, m.max || 10); i++) {
          var r = liste[i].getBoundingClientRect();
          var cs = getComputedStyle(liste[i]);
          var st = {};
          styles.forEach(function (p) { st[p] = cs[p]; });
          sortie.push({
            i: i,
            x: arrondi(r.left), y: arrondi(r.top), l: arrondi(r.width), h: arrondi(r.height),
            bas: arrondi(r.bottom), droite: arrondi(r.right),
            dansEcran: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
            styles: st
          });
        }
        return { sel: s, n: liste.length, elements: sortie };
      });
    },

    html: function (m) {
      var el = trouver(m.sel, m.index);
      if (!el) throw new Error("introuvable : " + m.sel);
      return String(el.outerHTML).slice(0, m.max || 6000);
    },

    texte: function (m) {
      var el = m.sel ? trouver(m.sel, m.index) : document.body;
      if (!el) throw new Error("introuvable : " + m.sel);
      return String(el.innerText).slice(0, m.max || 6000);
    },

    /* Chronomètre les images d'un défilement continu, de `de` à `a` en `ms` millisecondes :
       c'est la mesure de fluidité, sur le vrai téléphone. L'écran doit rester allumé. */
    perf: function (m) {
      return new Promise(function (resolve) {
        var max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        var y0 = m.de != null ? m.de : Math.round(scrollY);
        var y1 = m.a != null ? Math.min(m.a, max) : max;
        var ms = m.ms || 6000;
        var dts = [];
        var dernier = null;
        var debut = null;
        window.scrollTo({ top: y0, left: 0, behavior: "instant" });
        function pas(t) {
          if (debut === null) { debut = t; dernier = t; requestAnimationFrame(pas); return; }
          dts.push(t - dernier);
          dernier = t;
          var p = Math.min(1, (t - debut) / ms);
          window.scrollTo({ top: y0 + (y1 - y0) * p, left: 0, behavior: "instant" });
          if (p < 1) requestAnimationFrame(pas);
          else resolve({ de: y0, a: Math.round(y1), stats: statistiques(dts, t - debut) });
        }
        requestAnimationFrame(pas);
      });
    },

    reload: function () { setTimeout(function () { location.reload(); }, 80); return "rechargement"; },

    goto: function (m) { setTimeout(function () { location.href = m.url; }, 80); return "navigation"; }
  };

  function repondre(idCmd, ok, v) {
    var o = { t: "res", id: idCmd, ok: ok };
    if (ok) o.valeur = serialiser(v, 6);
    else o.erreur = String(v);
    var taille = 0;
    try { taille = JSON.stringify(o).length; } catch (e) {}
    if (taille > MAX_REPONSE) o = { t: "res", id: idCmd, ok: false, erreur: "réponse trop grosse (" + taille + " octets) : réduis la demande" };
    envoyer(o);
  }

  function executer(m) {
    if (!m || m.id == null || !m.op) return;
    var f = OPS[m.op];
    if (!f) return repondre(m.id, false, "opération inconnue : " + m.op);
    Promise.resolve()
      .then(function () { return f(m); })
      .then(
        function (v) { repondre(m.id, true, v); },
        function (e) { repondre(m.id, false, e && e.message ? e.message : String(e)); }
      );
  }

  /* ------------------------------- la connexion ------------------------------- */

  function replanifier() {
    clearTimeout(minuterie);
    essais++;
    minuterie = setTimeout(relier, Math.min(5000, 400 * Math.pow(2, Math.min(essais, 4))));
  }

  function relier() {
    try {
      ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/__pont/tel");
    } catch (e) { replanifier(); return; }
    ws.onopen = function () {
      pret = true;
      essais = 0;
      envoyer({ t: "hello", id: id, info: infos() });
      var f = file;
      file = [];
      f.forEach(function (s) { ws.send(s); });
    };
    ws.onmessage = function (m) {
      var o;
      try { o = JSON.parse(m.data); } catch (e) { return; }
      executer(o);
    };
    ws.onclose = function () { pret = false; replanifier(); };
    ws.onerror = function () {};
  }

  relier();
})();
