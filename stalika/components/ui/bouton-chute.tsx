"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { defilement } from "@/lib/defilement";
import { CADRAGE_MOBILE, POSE_BOUTON, RAPPORT_CIEL } from "@/lib/ciel";
import { angleRepos, bezier, choisirAncrage, ecartPendule, matrice, planifierChute, type PlanChute, type Plateforme, type Point, type Rebond } from "@/lib/chute";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Le bouton « Parlons projet » du hero : un Cyber Button (21st) qui
   se décroche, se balance, puis tombe de scène en scène jusqu'à l'ordinateur
   (demande de J, 2026-10-02, par l'overlay).

   Le déroulé voulu par J :
   1. Premier clic : le bouton se détache et ne tient plus que par un coin. Il
      saute s'accrocher au menu (le hero n'a pas la place de le laisser pendre
      là où il est), se balance quelques secondes, puis s'arrête. Un indice
      discret dit qu'un second clic le fait tomber.
   2. Second clic : il tombe, rebondit sur les textes et les animations du
      site pendant que la page défile avec lui, et se pose à côté de
      l'ordinateur, sur la dernière image du ciel. Un repère de défilement
      apparaît : on entre dans l'ordinateur en défilant, ou en cliquant sur
      le bouton, qui emmène à la fenêtre de discussion.
   Le visiteur peut passer la chute (molette, doigt, Échap, bouton « Passer »).

   Comment c'est fait :
   - le vrai lien reste dans le hero, au même endroit, pour toujours : c'est
     lui que le clavier et les lecteurs d'écran atteignent. Il ne fait que
     devenir transparent quand le bouton s'en va ; un contour pointillé garde
     sa place ;
   - le bouton qui vole est une copie, posée dans la page à part
     (`position: absolute` sur le body, en coordonnées de la page) : il défile
     avec la page comme tout le reste. Le film de la chute est calculé d'un
     bloc (`lib/chute.ts`) puis joué image par image ; la page défile avec lui
     par l'instance de Lenis du site (`lib/defilement.ts`) ;
   - une fois posé, la copie vit dans le cadre collant de la plongée : elle
     reste en place pendant que la plongée commence, et s'efface sur ses
     premiers pixels de défilement.
   Les rebonds se font sur les éléments marqués `data-rebond` (vide : ils
   tressaillent ; `sec` : ils servent d'appui sans bouger, parce que GSAP les
   anime déjà).

   Mouvement réduit, écran trop petit, ou défilement fluide absent : le bouton
   n'est qu'un lien vers la page de contact. Sans JavaScript, aussi.
--------------------------------------------------------------------------- */

const T = MOUVEMENT.bouton;

type Etat = "repos" | "pendu" | "chute" | "pose";
type Phase = "accroupi" | "vol" | "balance" | "fin";

type Geo = {
  /** Taille du bouton. */
  l: number;
  h: number;
  /** Le coin haut gauche du vrai bouton, dans la page : d'où il part. */
  depart: Point;
  /** Le clou, dans la page. */
  clou: Point;
  /** Écart de départ du balancement, et angle de repos, en radians. */
  amplitude: number;
  repos: number;
};

type Cible = HTMLElement | null;

/** Tout ce qui change à chaque image, hors de React. */
type Course = {
  etat: Etat;
  phase: Phase;
  geo: Geo | null;
  t: number;
  angle: number;
  plan: PlanChute<Cible> | null;
  atterrir: number;
  prochain: number;
  vitesse: number;
  vitesseCible: number;
  indice: boolean;
};

const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const douce = (x: number) => x * x * (3 - 2 * x);
const cubique = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** La position d'un élément dans la page, sans ses transformations : une
    arrivée en cours le décale, et c'est sa place finale qui compte. */
function positionPage(el: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, l: el.offsetWidth };
}

/** Les bords supérieurs où le bouton peut rebondir. */
function lirePlateformes(): Plateforme<Cible>[] {
  const liste: Plateforme<Cible>[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("[data-rebond]")) {
    if (!el.offsetParent) continue;
    const p = positionPage(el);
    if (p.l < 60) continue;
    liste.push({ x0: p.x, x1: p.x + p.l, y: p.y, cible: el.dataset.rebond === "sec" ? null : el });
  }
  return liste;
}

/** Où le bouton se pose, à l'écran, quand la dernière image du ciel est là :
    le point de contact (en bas, au milieu du bouton), calculé comme `Ciel`
    cadre ses images. */
function poseEcran(): Point | null {
  const cadre = document.querySelector<HTMLElement>("[data-ciel-cadre]");
  if (!cadre) return null;
  const r = cadre.getBoundingClientRect();
  const source = window.matchMedia("(max-width: 767px)").matches ? CADRAGE_MOBILE : { x: 0, y: 0, l: 1, h: 1 };
  const e = Math.max(r.width / (source.l * RAPPORT_CIEL), r.height / source.h);
  const dw = source.l * RAPPORT_CIEL * e;
  const dh = source.h * e;
  return {
    x: r.left + (r.width - dw) / 2 + ((POSE_BOUTON.x - source.x) / source.l) * dw,
    y: r.top + (r.height - dh) / 2 + ((POSE_BOUTON.y - source.y) / source.h) * dh,
  };
}

/** La copie du bouton qui voyage : même gabarit que le vrai, sans lien. */
function Copie({ children, focus }: { children: React.ReactNode; focus: boolean }) {
  return (
    <CyberButton asChild size="default">
      <span aria-hidden="true" className={cn("cursor-pointer", focus && "ring-2 ring-ring ring-offset-2 ring-offset-background")}>
        {children}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </CyberButton>
  );
}

export type BoutonChuteProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function BoutonChute({ href, children, className }: BoutonChuteProps) {
  const idAide = useId();
  const ancre = useRef<HTMLAnchorElement>(null);
  const calque = useRef<HTMLDivElement>(null);
  const calquePose = useRef<HTMLDivElement>(null);
  const flotteur = useRef<HTMLDivElement>(null);
  const clou = useRef<HTMLSpanElement>(null);
  const course = useRef<Course>({
    etat: "repos",
    phase: "accroupi",
    geo: null,
    t: 0,
    angle: 0,
    plan: null,
    atterrir: 0,
    prochain: 0,
    vitesse: 1,
    vitesseCible: 1,
    indice: false,
  });

  const [etat, setEtat] = useState<Etat>("repos");
  const [monte, setMonte] = useState(false);
  const [indice, setIndice] = useState(false);
  const [focus, setFocus] = useState(false);
  const [annonce, setAnnonce] = useState("");
  const [hote, setHote] = useState<HTMLElement | null>(null);

  useEffect(() => setMonte(true), []);

  /* ---- Les mesures du bouton accroché ------------------------------------- */

  /** Où il part, où est le clou, de combien il se balance. `null` si l'écran
      n'a pas la place : le lien fait alors son travail ordinaire. */
  const mesurer = (): Geo | null => {
    const a = ancre.current;
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    if (vw < 320 || vh < 520) return null;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const nav = document.querySelector<HTMLElement>("#accueil nav")?.getBoundingClientRect();
    // Le clou est planté au bord bas de l'onglet du menu ; si le menu a quitté l'écran, en haut de la vue.
    const yClou = nav && nav.bottom > 24 ? nav.bottom + sy : sy + 0.14 * vh;
    const { x, amplitude } = choisirAncrage({ l: r.width, h: r.height, ecran: vw, vise: nav ? nav.right - 36 : vw - 80, marge: 14, amplitude: T.pendule.amplitude });
    if (yClou + Math.hypot(r.width, r.height) + 24 > sy + vh) return null;
    return { l: r.width, h: r.height, depart: { x: r.left + sx, y: r.top + sy }, clou: { x: x + sx, y: yClou }, amplitude, repos: angleRepos(r.width, r.height) };
  };

  /* ---- Les gestes --------------------------------------------------------- */

  const decrocher = (geo: Geo) => {
    const c = course.current;
    c.geo = geo;
    c.etat = "pendu";
    c.phase = "accroupi";
    c.t = 0;
    c.angle = 0;
    c.indice = false;
    setIndice(false);
    setEtat("pendu");
    setAnnonce("Le bouton s'est décroché et se balance. Activez-le encore : il tombe et vous emmène jusqu'à l'ordinateur.");
  };

  /** Lance la chute. `false` si la page n'a pas ce qu'il faut (le lien ordinaire prend alors le relais). */
  const faireTomber = (): boolean => {
    const c = course.current;
    const lenis = defilement();
    const geo = c.geo;
    const zone = document.querySelector<HTMLElement>('[data-src="components/ui/plongee.tsx"]');
    const sol = poseEcran();
    if (!lenis || !geo || !zone || !sol) return false;
    const vue = { l: document.documentElement.clientWidth, h: window.innerHeight };
    const debut = window.scrollY;
    const fin = zone.getBoundingClientRect().top + debut;
    // Le centre du bouton au lâcher : il pend au clou, à l'angle où le balancement l'a laissé.
    const th = c.angle;
    const centre = {
      x: geo.clou.x + (Math.cos(th) * geo.l) / 2 - (Math.sin(th) * geo.h) / 2,
      y: geo.clou.y + (Math.sin(th) * geo.l) / 2 + (Math.cos(th) * geo.h) / 2,
    };
    const duree = borne(T.chute.duree.base + (T.chute.duree.parEcran * (fin - debut)) / vue.h, T.chute.duree.min, T.chute.duree.max);
    c.plan = planifierChute<Cible>({
      l: geo.l,
      h: geo.h,
      depart: { ...centre, angle: th },
      arrivee: { x: sol.x + window.scrollX, y: fin + sol.y - (geo.h * T.chute.echelleFin) / 2, angle: 0 },
      echelleVol: T.chute.echelleVol,
      echelleFin: T.chute.echelleFin,
      plateformes: lirePlateformes(),
      vue,
      defilement: { debut, fin },
      duree,
      reglage: T.chute,
    });
    c.atterrir = fin;
    c.etat = "chute";
    c.t = 0;
    c.prochain = 0;
    c.vitesse = c.vitesseCible = 1;
    setIndice(false);
    setEtat("chute");
    setAnnonce("Le bouton tombe jusqu'à l'ordinateur.");
    return true;
  };

  const accelerer = () => {
    course.current.vitesseCible = T.chute.accelerer;
  };

  const allerALaDiscussion = () => {
    const lenis = defilement();
    const zone = document.querySelector<HTMLElement>('[data-src="components/ui/plongee.tsx"]');
    if (!lenis || !zone) return;
    const haut = zone.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(haut + T.discussion.avancee * (zone.offsetHeight - window.innerHeight), {
      duration: T.discussion.duree,
      easing: cubique,
      lock: true,
    });
    setAnnonce("Vous arrivez à la discussion.");
  };

  /** Un clic, sur le vrai lien ou sur la copie : l'étape suivante du déroulé. */
  const agir = (e: { preventDefault: () => void }) => {
    const c = course.current;
    switch (c.etat) {
      case "repos": {
        const geo = mesurer();
        if (!geo) return; // pas la place : le lien fait son travail
        e.preventDefault();
        decrocher(geo);
        return;
      }
      case "pendu":
        e.preventDefault();
        if ((c.phase === "balance" || c.phase === "fin") && !faireTomber()) window.location.assign(href);
        return;
      case "chute":
        e.preventDefault();
        accelerer();
        return;
      case "pose":
        e.preventDefault();
        allerALaDiscussion();
        return;
    }
  };

  const cliquer = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (mouvementReduit() || !defilement()) return; // le lien ordinaire
    agir(e);
  };

  /* ---- Premier clic : le saut vers le clou, puis le balancement ------------ */

  useLayoutEffect(() => {
    if (etat !== "pendu") return;
    const c = course.current;
    const geo = c.geo;
    const el = flotteur.current;
    if (!geo || !el) return;
    const { accroupi, vol } = T.envol;
    const reglage = { periode: T.pendule.periode, duree: T.pendule.duree, taux: T.pendule.taux };
    const depart = geo.depart;
    const theta0 = geo.repos - geo.amplitude;
    // L'arche du saut : il passe un peu au-dessus du clou, puis s'y accroche.
    const arche: Point = { x: depart.x + (geo.clou.x - depart.x) * 0.35, y: Math.max(geo.clou.y - 0.12 * window.innerHeight, window.scrollY + 10) };

    const accrocher = () => {
      const n = clou.current;
      if (!n) return;
      n.style.visibility = "visible";
      n.animate([{ transform: "scale(0)" }, { transform: "scale(1.35)", offset: 0.6 }, { transform: "scale(1)" }], { duration: 280, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    };

    const poser = (t: number) => {
      if (t < accroupi) {
        // Il s'accroupit, avant de sauter.
        const u = douce(t / accroupi);
        el.style.transform = matrice(depart.x + geo.l / 2, depart.y + geo.h, 0, 1 + 0.05 * u, 1 - 0.14 * u, geo.l / 2, geo.h);
        return;
      }
      if (t < accroupi + vol) {
        const s = (t - accroupi) / vol;
        const e = cubique(s);
        const p = bezier(e, depart, arche, geo.clou);
        const levee = 1 + 0.06 * Math.sin(Math.PI * s);
        c.angle = theta0 * e;
        el.style.transform = matrice(p.x, p.y, c.angle, levee, levee, 0, 0);
        return;
      }
      if (c.phase !== "balance" && c.phase !== "fin") {
        c.phase = "balance";
        accrocher();
      }
      const tb = t - accroupi - vol;
      c.angle = geo.repos + ecartPendule(tb, geo.amplitude, reglage);
      el.style.transform = matrice(geo.clou.x, geo.clou.y, c.angle, 1, 1, 0, 0);
      if (!c.indice && tb > T.pendule.duree * T.indice.apres) {
        c.indice = true;
        setIndice(true);
      }
      if (tb >= T.pendule.duree) {
        c.phase = "fin";
        gsap.ticker.remove(pas);
      }
    };
    const pas = (_temps: number, dt: number) => {
      c.t += Math.min(dt, 50) / 1000;
      poser(c.t);
    };

    poser(0);
    el.style.visibility = "visible";
    gsap.ticker.add(pas);
    return () => gsap.ticker.remove(pas);
  }, [etat]);

  /* ---- Second clic : la chute ---------------------------------------------- */

  useLayoutEffect(() => {
    if (etat !== "chute") return;
    const c = course.current;
    const plan = c.plan;
    const geo = c.geo;
    const el = flotteur.current;
    const lenis = defilement();
    if (!plan || !geo || !el || !lenis) return;

    // Le clou lâche prise.
    clou.current?.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.4) translateY(10px)", opacity: 0 }], { duration: 180, fill: "forwards" });

    const choc = (r: Rebond<Cible>) => {
      const couche = calque.current;
      if (couche) {
        // Un trait lumineux au point de contact, comme le cadre du bouton.
        const trait = document.createElement("div");
        trait.className = "absolute left-0 top-0 h-px w-52 bg-linear-to-r from-transparent via-accent to-transparent shadow-[0_0_14px_0_var(--color-accent)]";
        trait.style.transform = `translate(${r.x - 104}px, ${r.y}px)`;
        couche.appendChild(trait);
        const jeu = trait.animate([{ opacity: 0.9, scale: "0.5 1" }, { opacity: 0, scale: "1.5 1" }], { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        jeu.onfinish = () => trait.remove();
      }
      // Ce qu'il touche tressaille, d'autant plus que le choc est fort.
      const cible = r.plateforme?.cible;
      if (cible) {
        const f = 2 + 4 * r.force;
        cible.animate(
          [
            { translate: "0 0", rotate: "0deg" },
            { translate: `0 ${f}px`, rotate: `${r.x > (r.plateforme!.x0 + r.plateforme!.x1) / 2 ? 0.3 : -0.3}deg`, offset: 0.22 },
            { translate: `0 ${-f * 0.25}px`, rotate: "0deg", offset: 0.55 },
            { translate: "0 0", rotate: "0deg" },
          ],
          { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
      }
    };

    const pas = (_temps: number, dt: number) => {
      const s = Math.min(dt, 50) / 1000;
      c.vitesse += (c.vitesseCible - c.vitesse) * Math.min(1, s * 14);
      c.t += s * c.vitesse;
      const t = Math.min(c.t, plan.duree);
      const e = plan.etat(t);
      el.style.transform = matrice(e.x, e.y, e.angle, e.sx, e.sy, geo.l / 2, geo.h / 2);
      lenis.scrollTo(plan.camera(t), { immediate: true, force: true });
      while (c.prochain < plan.rebonds.length && plan.rebonds[c.prochain].t <= t) choc(plan.rebonds[c.prochain++]);
      if (c.t >= plan.duree) {
        gsap.ticker.remove(pas);
        // L'arrivée exacte, quoi que la mise en page ait pu bouger en route.
        lenis.scrollTo(c.atterrir, { immediate: true, force: true });
        c.etat = "pose";
        setHote(document.querySelector<HTMLElement>("[data-plongee-colle]"));
        setEtat("pose");
        setAnnonce("Le bouton est tombé près de l'ordinateur. Faites défiler pour entrer dans l'écran, ou activez-le pour aller à la discussion.");
      }
    };

    // Pendant la chute, la page n'appartient qu'au film : le visiteur peut le passer, pas le contrarier.
    const bloquer = (ev: Event) => {
      if (ev.cancelable) ev.preventDefault();
      ev.stopImmediatePropagation();
      accelerer();
    };
    const touche = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") accelerer();
      else if ([" ", "PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp"].includes(ev.key)) {
        ev.preventDefault();
        accelerer();
      }
    };
    const html = document.documentElement;
    const gestes = html.style.touchAction;
    html.style.touchAction = "none";
    window.addEventListener("wheel", bloquer, { passive: false, capture: true });
    window.addEventListener("touchmove", bloquer, { passive: false, capture: true });
    window.addEventListener("keydown", touche, { capture: true });

    gsap.ticker.add(pas);
    return () => {
      gsap.ticker.remove(pas);
      html.style.touchAction = gestes;
      window.removeEventListener("wheel", bloquer, { capture: true });
      window.removeEventListener("touchmove", bloquer, { capture: true });
      window.removeEventListener("keydown", touche, { capture: true });
    };
  }, [etat]);

  /* ---- Posé près de l'ordinateur ------------------------------------------ */

  useLayoutEffect(() => {
    if (etat !== "pose" || !hote) return;
    const geo = course.current.geo;
    const el = flotteur.current;
    const couche = calquePose.current;
    if (!geo || !el || !couche) return;
    const { echelleFin } = T.chute;
    const placer = () => {
      const p = poseEcran();
      if (p) el.style.transform = matrice(p.x, p.y - (geo.h * echelleFin) / 2, 0, echelleFin, echelleFin, geo.l / 2, geo.h / 2);
    };
    placer();
    // La plongée commence : le bouton posé s'efface sur ses premiers pixels de défilement.
    const zone = hote.parentElement;
    const st = zone
      ? ScrollTrigger.create({
          trigger: zone,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const a = 1 - douce(borne(self.progress / T.pose.fondu));
            couche.style.opacity = String(a);
            couche.style.visibility = a < 0.01 ? "hidden" : "visible";
          },
        })
      : null;
    window.addEventListener("resize", placer);
    return () => {
      st?.kill();
      window.removeEventListener("resize", placer);
    };
  }, [etat, hote]);

  /* ---- Accroché : si l'écran change de forme, le clou suit le menu ---------- */

  useEffect(() => {
    if (etat !== "pendu") return;
    const c = course.current;
    const replacer = () => {
      const geo = mesurer();
      const el = flotteur.current;
      if (!geo || !el || (c.phase !== "balance" && c.phase !== "fin")) return;
      c.geo = geo;
      c.angle = geo.repos;
      c.phase = "fin";
      el.style.transform = matrice(geo.clou.x, geo.clou.y, geo.repos, 1, 1, 0, 0);
    };
    window.addEventListener("resize", replacer);
    return () => window.removeEventListener("resize", replacer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);

  const geo = course.current.geo;
  const detache = etat !== "repos";

  return (
    <div className={cn("relative flex w-fit", className)}>
      {/* Le vrai lien : il ne quitte jamais sa place (clavier, lecteurs d'écran, sans JavaScript). */}
      <span className={cn("inline-flex transition-opacity duration-200", detache && "pointer-events-none opacity-0")}>
        <CyberButton asChild size="default">
          <Link
            ref={ancre}
            href={href}
            onClick={cliquer}
            onFocus={(e) => setFocus(e.currentTarget.matches(":focus-visible"))}
            onBlur={() => setFocus(false)}
            aria-describedby={idAide}
            className="cursor-pointer"
          >
            {children}
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </CyberButton>
      </span>
      {/* Là où il était : un contour pointillé. */}
      {detache && <span aria-hidden="true" className="pointer-events-none absolute inset-0 border border-dashed border-foreground/20" />}
      <span id={idAide} className="sr-only">
        Un premier clic décroche le bouton, un second le fait tomber et vous emmène jusqu&apos;à l&apos;ordinateur, où la discussion s&apos;ouvre.
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {annonce}
      </span>

      {/* Accroché, puis en chute : une couche dans la page, qui défile avec elle. */}
      {monte &&
        geo &&
        (etat === "pendu" || etat === "chute") &&
        createPortal(
          <div ref={calque} className="nuit pointer-events-none absolute left-0 top-0 z-[55] h-0 w-full overflow-x-clip">
            <div className="absolute left-0 top-0" style={{ transform: `translate(${geo.clou.x - 6}px, ${geo.clou.y - 6}px)` }}>
              <span ref={clou} className="invisible grid size-3 place-items-center rounded-full bg-accent shadow-[0_1px_5px_color-mix(in_oklab,var(--color-background)_70%,transparent)] ring-2 ring-background">
                <span className="size-1 rounded-full bg-background" />
              </span>
            </div>
            <div ref={flotteur} onClick={agir} className="pointer-events-auto invisible absolute left-0 top-0 flex w-max cursor-pointer will-change-transform" style={{ transformOrigin: "0 0" }}>
              <Copie focus={focus}>{children}</Copie>
            </div>
            {etat === "pendu" && indice && (
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 w-28"
                style={{ transform: `translate(${geo.clou.x - geo.h * Math.sin(geo.repos) - 12 - 112}px, ${geo.clou.y + 8}px)` }}
              >
                {/* L'arrivée en fondu vit sur le texte : une animation sur le bloc posé effacerait sa position. */}
                <p className="animate-[bouton-indice_0.5s_var(--ease-out)_both] text-right font-mono text-[10px] uppercase leading-snug tracking-[0.18em] text-foreground/75">
                  Encore un clic : il tombe.
                </p>
              </div>
            )}
            {etat === "chute" && (
              <button
                type="button"
                onClick={accelerer}
                className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 cursor-pointer border border-foreground/25 bg-background/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/80 backdrop-blur transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                Passer
              </button>
            )}
          </div>,
          document.body,
        )}

      {/* Posé : dans le cadre collant de la plongée, à côté de l'ordinateur. */}
      {monte &&
        hote &&
        etat === "pose" &&
        createPortal(
          <div ref={calquePose} className="nuit pointer-events-none absolute inset-0 z-20 overflow-clip">
            <div
              ref={flotteur}
              onClick={agir}
              className="pointer-events-auto absolute left-0 top-0 flex w-max animate-[bouton-souffle_2.6s_ease-in-out_infinite] cursor-pointer will-change-transform"
              style={{ transformOrigin: "0 0" }}
            >
              <Copie focus={focus}>{children}</Copie>
            </div>
            <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex animate-[bouton-indice_0.7s_0.6s_var(--ease-out)_both] flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70">Faites défiler</span>
              <span aria-hidden="true" className="relative block h-9 w-px overflow-hidden bg-foreground/20">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[bouton-defile_1.6s_ease-in-out_infinite] bg-accent" />
              </span>
            </div>
          </div>,
          hote,
        )}
    </div>
  );
}
