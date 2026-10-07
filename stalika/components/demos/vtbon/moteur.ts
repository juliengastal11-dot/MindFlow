/* ---------------------------------------------------------------------------
   Le moteur des deux maquettes de VTBON, pour le téléphone de la section 02
   (demande de J, 2026-10-07 : « compile les deux maquettes que j'ai faites pour
   le site, mets-les l'un après l'autre, ça servira de démo »).

   Les deux scénarios (le bon dicté à la voix, puis la facture qui passe en
   retard et reçoit sa relance) sont ceux de `components/maquettes/moteur.ts`
   du dépôt vtbon-site, copiés tels quels : mêmes scènes, mêmes durées. Ce
   qui change, et pourquoi :
   - ils s'enchaînent : le bon, un fondu, la facture, un fondu, et le bon de
     nouveau ; chacun a son markup (`markup-bons.ts`, `markup-factures.ts`),
     remplacé dans l'écran au fondu ;
   - le moteur se commande de l'extérieur, comme les autres démos du carrousel
     (`jouer`, `pause`, `remettre`) : le téléphone de face joue, le
     carrousel hors de l'écran ou la pause du visiteur le gèlent là où il en
     est (l'horloge des attentes s'arrête, les animations CSS aussi), un
     téléphone de côté revient à son départ ;
   - l'horloge des attentes suit `requestAnimationFrame` : onglet caché, plus
     rien n'avance, et jamais de saut au retour ;
   - l'écran est mis à l'échelle du téléphone (`transform: scale`), donc les
     mesures du doigt et du défilement se ramènent à la taille de l'écran
     (`ctx.echelle`).
   - l'horloge des attentes va un quart plus vite que sur le site (`VITESSE`) :
     les deux maquettes bout à bout durent près d'une minute, trop pour un
     carrousel ; à 1,25 elles tiennent en 45 s, les phrases se lisent encore
     en entier. Pour retrouver le rythme du site : `VITESSE = 1`.
   Mouvement réduit : l'écran reste sur le bon prêt à être partagé (`bonsFinal`).
--------------------------------------------------------------------------- */

import { MARKUP_BONS } from "./markup-bons";
import { MARKUP_FACTURES } from "./markup-factures";

/** Le rythme des attentes (saisie, pauses, gestes) par rapport à celui du site de VTBON. */
const VITESSE = 1.25;

export type Scenario = "bons" | "factures";

/* ---------- Icônes (sous-ensemble Lucide utilisé par ces deux maquettes) --- */
const ICONS: Record<string, string> = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  locate: '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  "help-circle": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  euro: '<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  /* Ajouts (pancarte, 2026), absents du site source, vérifiés sur l'app réelle. */
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  /* Écrans WhatsApp et Bons (2026-09-05). */
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-check": '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
};

const WHATSAPP =
  '<svg class="ic" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';

function iconSvg(name: string): string {
  if (name === "whatsapp") return WHATSAPP;
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function setIcons(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    if (name) el.innerHTML = iconSvg(name);
  });
}

/* ---------- Contexte d'exécution : une session, avec sa propre horloge --------- */
interface Ctx {
  root: HTMLElement;
  q<T extends Element = HTMLElement>(sel: string): T | null;
  qa<T extends Element = HTMLElement>(sel: string): T[];
  sleep(ms: number): Promise<void>;
  alive(): boolean;
  scene(i: number): void;
  /** Le rapport entre la taille affichée de l'écran et sa taille de dessin. */
  echelle(): number;
}

interface Session {
  ctx: Ctx;
  /** Gèle ou relance l'horloge des attentes. */
  pause(enPause: boolean): void;
  /** Arrête la session pour de bon : les attentes en cours ne se terminent jamais. */
  stop(): void;
}

function buildSession(root: HTMLElement, opts: { onScene?: (i: number) => void }): Session {
  let stopped = false;
  let enPause = false;
  const attentes = new Set<{ reste: number; fin: () => void }>();
  let raf = 0;
  let derniere = 0;
  /* L'horloge : une attente décompte le temps que l'écran passe à l'écran. Un
     saut de plus de 100 ms (onglet caché, machine saisie) ne compte que pour 100. */
  const tick = (t: number) => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dt = derniere ? Math.min(100, t - derniere) : 0;
    derniere = t;
    if (enPause || dt === 0) return;
    for (const a of [...attentes]) {
      a.reste -= dt * VITESSE;
      if (a.reste <= 0) {
        attentes.delete(a);
        a.fin();
      }
    }
  };
  raf = requestAnimationFrame(tick);

  const ctx: Ctx = {
    root,
    q: <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel),
    qa: <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel)),
    alive: () => !stopped,
    scene: (i: number) => opts.onScene?.(i),
    sleep: (ms: number) =>
      new Promise<void>((resolve) => {
        if (stopped) return;
        attentes.add({ reste: ms, fin: resolve });
      }),
    echelle: () => {
      const v = root.querySelector<HTMLElement>(".vt-viewport");
      return v && v.offsetWidth ? v.getBoundingClientRect().width / v.offsetWidth : 1;
    },
  };
  return {
    ctx,
    pause: (p) => {
      enPause = p;
      if (!p) derniere = 0;
    },
    stop: () => {
      stopped = true;
      cancelAnimationFrame(raf);
      attentes.clear();
    },
  };
}

/* ---------- Aides génériques (communes aux deux scénarios) ---------------- */
function showScreen(ctx: Ctx, name: string) {
  ctx.qa(".vt-screen").forEach((s) => s.classList.toggle("is-active", s.getAttribute("data-screen") === name));
}
function openOverlay(ctx: Ctx, name: string) {
  ctx.q(`[data-overlay="${name}"]`)?.classList.add("is-active");
}
function closeOverlays(ctx: Ctx) {
  ctx.qa(".vt-overlay").forEach((o) => o.classList.remove("is-active"));
  ctx.q(".pancarte-overlay")?.classList.remove("is-active");
}
function press(el: Element | null) {
  if (!el) return;
  el.classList.add("is-press");
  setTimeout(() => el.classList.remove("is-press"), 260);
}
function toast(ctx: Ctx, txt: string) {
  const el = ctx.q("[data-ref='toast']");
  if (!el) return;
  el.textContent = txt;
  el.classList.add("is-on");
  setTimeout(() => el.classList.remove("is-on"), 2200);
}
function hideCursor(ctx: Ctx) {
  ctx.q("[data-ref='cursor']")?.classList.remove("is-on");
}
async function clickAt(ctx: Ctx, target: Element | null) {
  if (!target || !ctx.alive()) return;
  const cursor = ctx.q("[data-ref='cursor']");
  const viewport = ctx.q(".vt-viewport") ?? ctx.root;
  if (!cursor) return;
  const tr = target.getBoundingClientRect();
  const vr = viewport.getBoundingClientRect();
  const k = ctx.echelle();
  const x = (tr.left + tr.width / 2 - vr.left) / k - 8;
  const y = (tr.top + tr.height / 2 - vr.top) / k - 2;
  cursor.classList.add("is-on");
  cursor.style.transform = `translate(${x}px, ${y}px)`;
  await ctx.sleep(420);
  if (!ctx.alive()) return;
  cursor.style.transform = `translate(${x}px, ${y}px) scale(.82)`;
  press(target);
  await ctx.sleep(170);
  if (!ctx.alive()) return;
  cursor.style.transform = `translate(${x}px, ${y}px)`;
  await ctx.sleep(120);
}
function setFab(ctx: Ctx, state: "zap" | "progress" | "working" | "ready") {
  const fab = ctx.q("[data-ref='fab']");
  if (!fab) return;
  const wasReady = fab.classList.contains("fab-ready");
  fab.classList.toggle("fab-pale", state === "progress" || state === "working");
  fab.classList.toggle("fab-working", state === "working");
  fab.classList.toggle("fab-ready", state === "ready");
  if (state === "ready" && !wasReady) {
    fab.classList.remove("fab-draw");
    void fab.offsetWidth;
    fab.classList.add("fab-draw");
  } else if (state !== "ready") {
    fab.classList.remove("fab-draw");
  }
  const glyph = state === "zap" ? "zap" : state === "ready" ? "check" : "edit";
  fab.querySelectorAll("[data-fico]").forEach((f) => f.classList.toggle("hide", f.getAttribute("data-fico") !== glyph));
}
function openVitre(ctx: Ctx) {
  ctx.q("[data-ref='voile']")?.classList.add("on");
  ctx.q("[data-ref='vitre']")?.classList.add("on");
}
function closeVitre(ctx: Ctx) {
  ctx.q("[data-ref='voile']")?.classList.remove("on");
  ctx.q("[data-ref='vitre']")?.classList.remove("on");
}
async function typeField(ctx: Ctx, field: string, text: string, onChar?: (v: string) => void) {
  const iw = ctx.q(`.iw[data-field='${field}']`);
  const inp = iw?.querySelector<HTMLInputElement>("input");
  if (!iw || !inp) return;
  /* On fait défiler le SEUL conteneur de l'écran, jamais `scrollIntoView`,
     qui ferait aussi défiler la PAGE quand le téléphone déborde du viewport.
     La maquette joue toute seule : elle n'a JAMAIS le droit de déplacer la
     page sous le visiteur. C'est la même règle qui a fait retirer l'arrêt de
     lecture le 2026-09-20 (voir `telephone.tsx`). */
  const sc = ctx.q("[data-ref='home-scroll']");
  if (sc) {
    const pos = (iw.getBoundingClientRect().top - sc.getBoundingClientRect().top) / ctx.echelle() + sc.scrollTop;
        sc.scrollTo({ top: Math.max(0, pos - sc.clientHeight * 0.38), behavior: "smooth" });
  }
  iw.classList.add("is-filling");
  inp.value = "";
  for (const ch of text) {
    if (!ctx.alive()) break;
    inp.value += ch;
    onChar?.(inp.value);
    await ctx.sleep(30 + Math.random() * 30);
  }
  await ctx.sleep(220);
  iw.classList.remove("is-filling");
}
function clearField(ctx: Ctx, field: string) {
  const iw = ctx.q(`.iw[data-field='${field}']`);
  iw?.classList.remove("is-filling");
  const inp = iw?.querySelector<HTMLInputElement>("input");
  if (inp) inp.value = "";
}

/* ══════════════════════ DÉMO BONS (11 scènes) ══════════════════════════════
   Le panneau de dictée nomme le champ demandé (écart assumé, cf. l'en-tête
   de `markup-bons.ts` et le rapport final) : c'est ce qui rend la conversation
   lisible à un visiteur qui découvre le geste, sans les mains sur le volant
   pour deviner le contexte.

   Scénario revu le 2026-09-05 (Julien) : Gare de Lyon → « Roissy ». L'app
   lève le doute (Brie ou France ?) en écrivant sa lecture la plus probable,
   le chauffeur corrige (« Non, aéroport de Roissy »), puis dicte le prix, un
   SOUS-TRAITANT et une NOTE, jusqu'aux options, tout se dicte. Le bon part
   ensuite en image dans WhatsApp, montré jusqu'aux coches, et le téléphone
   revient sur l'écran Bons : la roue de favoris, puis la liste des courses. */
function openDictee(ctx: Ctx) {
  ctx.q("[data-ref='vt-dictee']")?.classList.add("on");
}
function closeDictee(ctx: Ctx) {
  ctx.q("[data-ref='vt-dictee']")?.classList.remove("on");
}
function setRailListening(ctx: Ctx, on: boolean) {
  ctx.q("[data-ref='vt-rail']")?.classList.toggle("balayage", on);
  ctx.q("[data-nav-item='dictee']")?.classList.toggle("is-listening", on);
}
function setQuestion(ctx: Ctx, txt: string) {
  const el = ctx.q("[data-ref='vt-dictee-q']");
  if (el) el.textContent = txt;
}
function setAnswer(ctx: Ctx, txt: string) {
  const el = ctx.q("[data-ref='vt-dictee-a']");
  if (el) el.textContent = txt;
}
function closePancarte(ctx: Ctx) {
  ctx.q("[data-overlay='pancarte']")?.classList.remove("is-active");
}
/* Les deux faces de la barre du bas (CLAUDE.md §3) : face action sur l'écran
   Bon, face navigation partout ailleurs, Bons allumé sur l'écran Bons. */
function setFace(ctx: Ctx, face: "act" | "nav") {
  ctx.q("[data-ref='face-act']")?.classList.toggle("out", face !== "act");
  ctx.q("[data-ref='face-nav']")?.classList.toggle("out", face !== "nav");
  const pill = ctx.q("[data-ref='nav-pill']");
  if (!pill) return;
  pill.classList.toggle("off", face !== "nav");
  /* Troisième créneau : deux largeurs de créneau, plus le trou du bouton central. */
  pill.style.transform = face === "nav" ? "translateX(calc(200% + var(--bnav-hole)))" : "";
}
/* La case Sous-traitant révèle le champ du nom, comme dans l'app (f-st-cb). */
function setSousTraitant(ctx: Ctx, on: boolean) {
  ctx.q("[data-ref='st-box']")?.classList.toggle("on", on);
  ctx.q("[data-ref='st-cbx']")?.classList.toggle("on", on);
  const wrap = ctx.q("[data-ref='st-wrap']");
  if (wrap) wrap.style.display = on ? "" : "none";
}
/* La bulle WhatsApp : rien → en cours d'envoi (voile + spinner sur l'image)
   → une coche → deux coches → deux coches bleues. */
function setWa(ctx: Ctx, etat: "" | "envoi" | "envoye" | "remis" | "lu") {
  ctx.q("[data-ref='wa-bulle']")?.classList.toggle("is-on", etat !== "");
  ctx.q("[data-ref='wa-upload']")?.classList.toggle("off", etat !== "" && etat !== "envoi");
  ctx.q("[data-ref='wa-ticks']")?.setAttribute("data-etat", etat === "envoi" ? "" : etat);
}
/* La liste des bons défile lentement : un `transform` mesuré, sur 6 s. */
function defileBons(ctx: Ctx, on: boolean) {
  const liste = ctx.q("[data-ref='bons-liste']");
  const inner = ctx.q("[data-ref='bons-defile']");
  if (!liste || !inner) return;
  if (!on) {
    inner.style.transition = "none";
    inner.style.transform = "";
    return;
  }
  const d = Math.max(0, inner.scrollHeight - liste.clientHeight);
  inner.style.transition = `transform ${(6 / VITESSE).toFixed(2)}s linear`;
  inner.style.transform = `translateY(-${d}px)`;
}
function resetBons(ctx: Ctx) {
  ctx.root.classList.remove("hide-nav");
  setFace(ctx, "act");
  setSousTraitant(ctx, false);
  ["dep", "arr", "cli", "prix", "st", "note"].forEach((f) => clearField(ctx, f));
  const sc = ctx.q("[data-ref='home-scroll']");
  if (sc) sc.scrollTop = 0;
  setQuestion(ctx, "");
  setAnswer(ctx, "");
  setWa(ctx, "");
  defileBons(ctx, false);
}

function bonsFinal(ctx: Ctx) {
  showScreen(ctx, "home");
  closeOverlays(ctx);
  closeVitre(ctx);
  closeDictee(ctx);
  resetBons(ctx);
  setFab(ctx, "ready");
  openOverlay(ctx, "sheet-bon");
  ctx.scene(8);
}

async function runBons(ctx: Ctx) {
  const { sleep, alive, scene, q } = ctx;

  showScreen(ctx, "home");
  closeOverlays(ctx);
  closeVitre(ctx);
  closePancarte(ctx);
  closeDictee(ctx);
  hideCursor(ctx);
  resetBons(ctx);
  setFab(ctx, "progress");
  await sleep(500);
  if (!alive()) return;

  scene(0);
  await clickAt(ctx, q("[data-nav-item='dictee']"));
  if (!alive()) return;
  /* LE DOIGT S'EN VA ICI, et ne revient qu'au partage (scène 9). Tout ce qui
     se passe entre les deux est SANS LES MAINS : un doigt posé sur l'écran
     pendant que l'app dicte contredit à l'image ce que la section promet en
     toutes lettres (Julien, 2026-09-06). C'est aussi pourquoi la génération
     du bon se demande à la voix plus bas, au lieu d'un appui sur le bouton
     central, lequel existe bel et bien dans l'app, comme geste instantané. */
  hideCursor(ctx);
  openDictee(ctx);
  setRailListening(ctx, true);
  setFab(ctx, "working");
  await sleep(550);
  if (!alive()) return;

  scene(1);
  setQuestion(ctx, "Adresse de départ ?");
  await typeField(ctx, "dep", "Gare de Lyon, Paris", (v) => setAnswer(ctx, v));
  if (!alive()) return;
  await sleep(550);
  if (!alive()) return;

  scene(2);
  setQuestion(ctx, "Jean Dupont, c\u2019est bien ça ?");
  await typeField(ctx, "cli", "Jean Dupont", (v) => setAnswer(ctx, v));
  if (!alive()) return;
  await sleep(280);
  if (!alive()) return;
  setAnswer(ctx, "« oui »");
  await sleep(650);
  if (!alive()) return;

  /* Le doute : l'app PROPOSE, elle écrit sa lecture la plus probable dans
     le champ en posant la question -, le chauffeur TRANCHE. */
  scene(3);
  setQuestion(ctx, "Roissy-en-Brie ou Roissy-en-France ?");
  await typeField(ctx, "arr", "Roissy-en-France", (v) => setAnswer(ctx, v));
  if (!alive()) return;
  await sleep(750);
  if (!alive()) return;

  /* La correction se dit, la dictée reste ouverte, le champ se récrit. */
  scene(4);
  setAnswer(ctx, "« Non, aéroport de Roissy »");
  await sleep(600);
  if (!alive()) return;
  await typeField(ctx, "arr", "Aéroport Roissy-CDG");
  if (!alive()) return;
  await sleep(350);
  if (!alive()) return;
  setQuestion(ctx, "Prix de la course ?");
  await typeField(ctx, "prix", "75", () => setAnswer(ctx, "« 75 euros »"));
  if (!alive()) return;
  await sleep(450);
  if (!alive()) return;

  scene(5);
  setQuestion(ctx, "Un sous-traitant ?");
  setAnswer(ctx, "« Oui, Diana Moreau »");
  await sleep(650);
  if (!alive()) return;
  setSousTraitant(ctx, true);
  await typeField(ctx, "st", "Diana Moreau");
  if (!alive()) return;
  await sleep(450);
  if (!alive()) return;

  scene(6);
  setQuestion(ctx, "Une note pour ce bon ?");
  setAnswer(ctx, "« Attendre au dépose-minute »");
  await sleep(650);
  if (!alive()) return;
  await typeField(ctx, "note", "Attendre au dépose-minute");
  if (!alive()) return;
  await sleep(450);
  if (!alive()) return;

  scene(7);
  setQuestion(ctx, "Je génère le bon ?");
  setAnswer(ctx, "« oui »");
  await sleep(950);
  if (!alive()) return;
  setRailListening(ctx, false);
  await sleep(200);
  if (!alive()) return;
  closeDictee(ctx);
  setFab(ctx, "ready");
  await sleep(800);
  if (!alive()) return;

  scene(8);
  openOverlay(ctx, "sheet-bon");
  await sleep(1700);
  if (!alive()) return;

  /* Le PARTAGE, jusqu'au bout : le toast dit ce que l'app fait vraiment
     (elle prépare l'image et ouvre WhatsApp), puis le téléphone MONTRE
     WhatsApp, la bulle, l'envoi, les coches. VTBON n'affiche jamais
     « envoyé » : taper WhatsApp ne prouve pas qu'un message soit parti ;
     ce sont les coches de WhatsApp qui le disent, chez lui. */
  scene(9);
  await clickAt(ctx, q("[data-ref='seg-wa']"));
  if (!alive()) return;
  toast(ctx, "Bon en image · WhatsApp s'ouvre");
  await sleep(1300);
  if (!alive()) return;
  hideCursor(ctx);
  closeOverlays(ctx);
  ctx.root.classList.add("hide-nav");
  setWa(ctx, "");
  showScreen(ctx, "wa");
  await sleep(600);
  if (!alive()) return;
  setWa(ctx, "envoi");
  await sleep(1300);
  if (!alive()) return;
  setWa(ctx, "envoye");
  await sleep(700);
  if (!alive()) return;
  setWa(ctx, "remis");
  await sleep(700);
  if (!alive()) return;
  setWa(ctx, "lu");
  await sleep(1600);
  if (!alive()) return;

  /* Retour dans VTBON, sur l'écran Bons : la roue de favoris, puis la liste
     des courses qui défile lentement, la barre du bas montre sa face
     navigation, Bons allumé, l'éclair au centre. */
  scene(10);
  ctx.root.classList.remove("hide-nav");
  setFab(ctx, "zap");
  setFace(ctx, "nav");
  showScreen(ctx, "bons");
  await sleep(1100);
  if (!alive()) return;
  defileBons(ctx, true);
  await sleep(6600);
}

/* ══════════════════════ DÉMO FACTURES (6 scènes) ═══════════════════════════ */
function setBandeau(ctx: Ctx, vals: { attente?: string; retard?: string }) {
  if (vals.attente) {
    const el = ctx.q("[data-ref='fig-attente']");
    if (el) el.textContent = vals.attente;
  }
  if (vals.retard) {
    const el = ctx.q("[data-ref='fig-retard']");
    if (el) el.textContent = vals.retard;
  }
}
function setCardRetard(ctx: Ctx, on: boolean) {
  const card = ctx.q("[data-ref='carte-suivie']");
  const badge = ctx.q("[data-ref='badge-suivie']");
  const delai = ctx.q("[data-ref='delai-suivie']");
  if (card) {
    if (on) card.setAttribute("data-retard", "");
    else card.removeAttribute("data-retard");
  }
  if (badge) {
    badge.classList.toggle("retard", on);
    badge.classList.toggle("attente", !on);
    badge.textContent = on ? "En retard" : "En cours";
  }
  if (delai && on) delai.style.display = "none";
}
function setCardRelancee(ctx: Ctx, on: boolean) {
  const delai = ctx.q("[data-ref='delai-suivie']");
  if (!delai) return;
  if (on) {
    delai.textContent = "Relancée · 5 j";
    delai.classList.add("relancee");
    delai.style.display = "";
  } else {
    delai.classList.remove("relancee");
  }
}
function setRelanceMode(ctx: Ctx, on: boolean) {
  const flag = ctx.q("[data-ref='relance-flag']");
  const soustitre = ctx.q("[data-ref='suivie-soustitre']");
  const totalLbl = ctx.q("[data-ref='suivie-total-lbl']");
  const legal = ctx.q("[data-ref='suivie-legal']");
  const btnLbl = ctx.q("[data-ref='btn-relance-lbl']");
  const hist = ctx.q("[data-ref='relance-hist']");
  if (flag) flag.style.display = on ? "flex" : "none";
  if (soustitre) soustitre.textContent = on ? "LETTRE DE RELANCE" : "FACTURE";
  if (totalLbl) totalLbl.textContent = on ? "MONTANT DÛ" : "TOTAL TTC";
  if (legal) {
    legal.textContent = on
      ? "Un règlement a pu croiser cet envoi ; merci de ne pas en tenir compte le cas échéant."
      : "Document conforme à l\u2019art. L441-1 du Code de commerce.";
  }
  if (btnLbl) btnLbl.textContent = on ? "Revenir à la facture" : "Relancer le paiement";
  if (hist) {
    if (on) {
      hist.textContent = "";
      hist.style.display = "none";
    } else {
      hist.textContent = "Relancée · 5 j";
      hist.style.display = "";
    }
  }
}

function facturesFinal(ctx: Ctx) {
  showScreen(ctx, "factlist");
  closeOverlays(ctx);
  closeVitre(ctx);
  setBandeau(ctx, { attente: "48,00 €", retard: "54,00 €" });
  setCardRetard(ctx, true);
  setCardRelancee(ctx, true);
  ctx.scene(5);
}

async function runFactures(ctx: Ctx) {
  const { sleep, alive, scene, q } = ctx;

  showScreen(ctx, "factlist");
  closeOverlays(ctx);
  closeVitre(ctx);
  hideCursor(ctx);
  setBandeau(ctx, { attente: "102,00 €", retard: "0,00 €" });
  setCardRetard(ctx, false);
  setCardRelancee(ctx, false);
  setRelanceMode(ctx, false);
  const delai = q("[data-ref='delai-suivie']");
  if (delai) {
    delai.textContent = "23 j";
    delai.style.display = "";
  }
  await sleep(500);
  if (!alive()) return;

  scene(0);
  openOverlay(ctx, "sheet-fact");
  await sleep(1200);
  if (!alive()) return;
  await clickAt(ctx, q("[data-ref='btn-gen-facture']"));
  if (!alive()) return;
  closeOverlays(ctx);
  openOverlay(ctx, "paymodal");
  await sleep(1500);
  if (!alive()) return;
  await clickAt(ctx, q("[data-ref='btn-confirm-ouvre']"));
  if (!alive()) return;
  closeOverlays(ctx);
  openVitre(ctx);
  await sleep(1500);
  if (!alive()) return;
  await clickAt(ctx, q("[data-ref='vitre-primaire']"));
  if (!alive()) return;
  closeVitre(ctx);
  showScreen(ctx, "facpdf");
  toast(ctx, "Facture générée");
  await sleep(2200);
  if (!alive()) return;

  scene(1);
  showScreen(ctx, "factlist");
  await sleep(1700);
  if (!alive()) return;

  scene(2);
  await sleep(1600);
  if (!alive()) return;

  scene(3);
  setCardRetard(ctx, true);
  setBandeau(ctx, { attente: "48,00 €", retard: "54,00 €" });
  await sleep(1800);
  if (!alive()) return;

  scene(4);
  await clickAt(ctx, q("[data-ref='carte-suivie']"));
  if (!alive()) return;
  openOverlay(ctx, "sheet-suivie");
  await sleep(900);
  if (!alive()) return;
  const relanceBtn = q("[data-ref='btn-relance']");
  if (relanceBtn) relanceBtn.style.display = "flex";
  await sleep(700);
  if (!alive()) return;
  await clickAt(ctx, relanceBtn);
  if (!alive()) return;
  setRelanceMode(ctx, true);
  await sleep(1900);
  if (!alive()) return;

  scene(5);
  setRelanceMode(ctx, false);
  closeOverlays(ctx);
  setCardRelancee(ctx, true);
  await sleep(2300);
}

/* ---------- Le lecteur : les deux maquettes, l'une après l'autre ------------- */
const ORDRE: readonly Scenario[] = ["bons", "factures"];
const MARKUP: Record<Scenario, string> = { bons: MARKUP_BONS, factures: MARKUP_FACTURES };
/** Ce que dure le fondu entre les deux maquettes, en ms (`.vt-viewport`, vtbon.css). */
const FONDU_MS = 420;
/** La même durée, dans l'unité des attentes (qui s'écoulent à `VITESSE`). */
const ATTENTE_FONDU = FONDU_MS * VITESSE;

export interface Lecteur {
  /** Joue depuis le début, ou reprend là où la pause l'a laissé. */
  jouer(): void;
  /** Gèle l'écran là où il en est. */
  pause(): void;
  /** Arrête tout et revient au premier écran. */
  remettre(): void;
  detruire(): void;
}

export interface LecteurOptions {
  /** Mouvement réduit : l'écran reste sur le bon prêt à être partagé. */
  reduit: boolean;
  onScene?: (i: number) => void;
}

/** `racine` : le `.vtui-root` ; son `.vt-viewport` reçoit le markup de chaque maquette. */
export function creerLecteur(racine: HTMLElement, opts: LecteurOptions): Lecteur {
  const viewport = racine.querySelector<HTMLElement>(".vt-viewport");
  if (!viewport) throw new Error("creerLecteur : .vt-viewport introuvable");
  let session: Session | null = null;

  const monter = (scenario: Scenario) => {
    viewport.innerHTML = MARKUP[scenario];
    setIcons(racine);
  };
  const arreter = () => {
    session?.stop();
    session = null;
  };
  /** Le premier écran : le formulaire vide, ou, sans mouvement, le bon prêt à partager. */
  const depart = () => {
    arreter();
    viewport.classList.remove("vt-fondu");
    racine.classList.remove("est-en-pause");
    monter("bons");
    if (opts.reduit) {
      const s = buildSession(racine, opts);
      bonsFinal(s.ctx);
      s.stop();
    }
  };

  const jouer = () => {
    if (opts.reduit) return;
    racine.classList.remove("est-en-pause");
    if (session) {
      session.pause(false);
      return;
    }
    const s = buildSession(racine, opts);
    session = s;
    const { ctx } = s;
    (async () => {
      let premier = true;
      while (ctx.alive()) {
        for (const scenario of ORDRE) {
          if (premier) {
            monter(scenario);
          } else {
            // Fondu sorti, markup changé, fondu rentré.
            viewport.classList.add("vt-fondu");
            await ctx.sleep(ATTENTE_FONDU);
            if (!ctx.alive()) return;
            monter(scenario);
            viewport.classList.remove("vt-fondu");
            await ctx.sleep(ATTENTE_FONDU);
            if (!ctx.alive()) return;
          }
          premier = false;
          await (scenario === "bons" ? runBons : runFactures)(ctx);
          if (!ctx.alive()) return;
        }
      }
    })();
  };

  depart();
  return {
    jouer,
    pause: () => {
      if (!session) return;
      session.pause(true);
      racine.classList.add("est-en-pause");
    },
    remettre: depart,
    detruire: arreter,
  };
}
