"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { HERO_TEXTE } from "@/components/ui/mots-brume";

/* ---------------------------------------------------------------------------
   Le bouton du hero se dessine à la main (J, 2026-10-18 : « au lieu du fil qui
   dépose le bouton, que le bouton se dessine comme s'il se dessinait à la
   main ») : une pointe de plume lumineuse tire quatre traits, un par côté,
   légèrement tremblés et qui
   dépassent un peu aux coins comme un trait tiré d'un geste, chacun accélère
   puis ralentit avant le coin ; pendant ce temps le texte s'écrit de gauche à
   droite, puis la flèche se trace, les deux coins appuyés se posent, et le
   trait se fond dans le cadre définitif du bouton.

   Il attend que le texte du hero ait fini de sortir de la brume (`HERO_TEXTE`),
   ou vient de toute façon à `secours`. Idées : « Border Draw »
   d'animatedbuttons (Colorion) et le tracé de trait (`stroke-dashoffset`) de
   Kinetics, redits avec GSAP et `MOUVEMENT.hero.dessin`.

   Il s'appuie sur les repères du Filet d'or (`BoutonFilet`) : le cadre, les
   coins, le texte, et le calque `svg` où il trace. À la fin, tout ce qu'il a
   posé est retiré : le bouton qui tombe au clic mesure sa place, et sa copie
   n'a pas d'entrée. Avant le JavaScript, il est caché par
   `data-mouvement="hero"` ; mouvement réduit : il est là d'emblée.
--------------------------------------------------------------------------- */

const R = MOUVEMENT.hero.dessin;
const SVG = "http://www.w3.org/2000/svg";

/** Un hasard qui ne change pas d'une visite à l'autre : le même trait à chaque fois. */
function hasard(graine: number) {
  let s = graine;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Les quatre côtés, dans le sens des aiguilles d'une montre, comme on tire un cadre : départ près du coin haut gauche. */
function cotes(l: number, h: number) {
  const r = hasard(7);
  const entre = (a: number, b: number) => a + (b - a) * r();
  const d = () => entre(1.5, R.depasse); // de combien le trait dépasse le coin
  const j = () => entre(-0.6, 0.6); // l'écart de la main
  const t = () => entre(-R.tremble, R.tremble); // le creux ou la bosse du trait
  return [
    `M ${-d()} ${j()} Q ${l / 2} ${t()} ${l + d()} ${j()}`,
    `M ${l + j()} ${-d()} Q ${l + t()} ${h / 2} ${l + j()} ${h + d()}`,
    `M ${l + d()} ${h + j()} Q ${l / 2} ${h + t()} ${-d()} ${h + j()}`,
    `M ${j()} ${h + d()} Q ${t()} ${h / 2} ${j()} ${-d() - 1.5}`,
  ];
}

export function EntreeDessin({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const contenu = el?.firstElementChild as HTMLElement | null;
    const bouton = el?.querySelector<HTMLElement>(".group");
    const cadre = el?.querySelector<HTMLElement>("[data-filet-cadre]");
    const coins = Array.from(el?.querySelectorAll<HTMLElement>("[data-filet-coin]") ?? []);
    const texte = el?.querySelector<HTMLElement>("[data-filet-texte]");
    const calque = el?.querySelector<SVGSVGElement>("svg[data-filet-trait]");
    if (!el || !contenu || !bouton || !cadre || !texte || !calque) return;
    const fleche = Array.from(texte.querySelectorAll<SVGGeometryElement>("svg path, svg line, svg polyline"));

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        gsap.set(contenu, { autoAlpha: 1 });
        return;
      }
      // Le trait, tracé dans le calque du bouton, à sa taille.
      const l = bouton.offsetWidth;
      const h = bouton.offsetHeight;
      calque.setAttribute("viewBox", `0 0 ${l} ${h}`);
      const traits = cotes(l, h).map((d) => {
        const p = document.createElementNS(SVG, "path");
        p.setAttribute("d", d);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", "currentColor");
        p.setAttribute("stroke-width", String(R.epaisseur));
        p.setAttribute("stroke-linecap", "round");
        calque.appendChild(p);
        const long = p.getTotalLength();
        gsap.set(p, { strokeDasharray: long, strokeDashoffset: long });
        return { p, long };
      });
      fleche.forEach((f) => f.setAttribute("pathLength", "1"));
      // la pointe de la plume : un point lumineux au bout du trait
      const pointe = document.createElementNS(SVG, "circle");
      pointe.setAttribute("r", String(R.pointe));
      pointe.setAttribute("fill", "currentColor");
      pointe.style.filter = "drop-shadow(0 0 4px var(--color-accent)) drop-shadow(0 0 1px var(--color-lin))";
      gsap.set(pointe, { opacity: 0 });
      calque.appendChild(pointe);

      // Rien de dessiné encore : le bouton peut se montrer.
      gsap.set(cadre, { opacity: 0 });
      gsap.set(coins[0], { scale: 0, transformOrigin: "0% 0%" });
      if (coins[1]) gsap.set(coins[1], { scale: 0, transformOrigin: "100% 100%" });
      gsap.set(texte, { clipPath: "inset(-30% 100% -30% 0%)" });
      gsap.set(fleche, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(contenu, { autoAlpha: 1 });

      const nettoyer = () => {
        traits.forEach(({ p }) => p.remove());
        pointe.remove();
        calque.removeAttribute("viewBox");
        gsap.set([cadre, texte, ...coins], { clearProps: "opacity,clipPath,transform,transformOrigin,scale" });
        gsap.set(fleche, { clearProps: "strokeDasharray,strokeDashoffset" });
        fleche.forEach((f) => f.removeAttribute("pathLength"));
      };

      const tl = gsap.timeline({ paused: true, onComplete: nettoyer });
      // les quatre côtés, l'un après l'autre, le temps de lever la plume au coin ; la pointe suit le bout du trait
      tl.to(pointe, { opacity: 1, duration: 0.12, ease: "none" }, 0);
      traits.forEach(({ p, long }, i) => {
        const avance = { t: 0 };
        tl.to(
          avance,
          {
            t: 1,
            duration: Math.max(0.12, long / R.vitesse),
            ease: "power1.inOut",
            onUpdate: () => {
              p.style.strokeDashoffset = String(long * (1 - avance.t));
              const q = p.getPointAtLength(long * avance.t);
              pointe.setAttribute("cx", String(q.x));
              pointe.setAttribute("cy", String(q.y));
            },
          },
          i === 0 ? 0 : `>+${R.coin}`,
        );
      });
      const finTrait = tl.duration();
      tl.to(pointe, { opacity: 0, duration: 0.2, ease: "none" }, finTrait - 0.05);
      // le texte s'écrit pendant que la plume fait le tour, la flèche se trace au bout
      tl.to(texte, { clipPath: "inset(-30% 0% -30% 0%)", duration: R.ecriture, ease: "power2.inOut" }, finTrait * 0.28);
      tl.to(fleche, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out", stagger: 0.08 }, ">-0.12");
      // les deux coins appuyés se posent, et le trait de plume devient le cadre
      tl.to(coins, { scale: 1, duration: 0.28, ease: "back.out(3)", stagger: 0.1 }, Math.max(finTrait, tl.duration()) - 0.05);
      tl.to(cadre, { opacity: 1, duration: R.fondu, ease: "none" }, "<");
      tl.to(
        traits.map((t) => t.p),
        { opacity: 0, duration: R.fondu, ease: "none" },
        "<",
      );

      // il vient quand le texte l'appelle, ou au plus tard à `secours`
      const venir = () => {
        if (tl.progress() === 0 && !tl.isActive()) tl.play();
      };
      document.addEventListener(HERO_TEXTE, venir);
      const secours = gsap.delayedCall(R.secours, venir);
      return () => {
        document.removeEventListener(HERO_TEXTE, venir);
        secours.kill();
        traits.forEach(({ p }) => p.remove());
        pointe.remove();
      };
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} data-mouvement="hero" className={cn("relative flex justify-center", className)}>
      {children}
    </div>
  );
}
