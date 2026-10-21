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
   puis ralentit avant le coin ; pendant ce temps le libellé s'écrit à la
   plume, lettre après lettre, du même trait d'or que le cadre, et chaque
   lettre tracée se remplit (J, 2026-10-21 : « fait écrire le parlons projet de
   la même manière que le cadre s'écrit », sans la flèche) ; puis les deux
   coins appuyés se posent et le trait se fond dans le cadre définitif.

   Il attend que le texte du hero ait fini de sortir de la brume (`HERO_TEXTE`),
   ou vient de toute façon à `secours`. Idées : « Border Draw »
   d'animatedbuttons (Colorion) et le tracé de trait (`stroke-dashoffset`) de
   Kinetics pour le cadre ; « Stroke Text » de React Bits pour les lettres (une
   `<text>` SVG par lettre, dont le contour se trace puis se remplit). Redits
   avec GSAP et `MOUVEMENT.hero.dessin`.

   Les lettres sont posées dans le calque `svg` du bouton, exactement sur
   celles du vrai texte (mesurées au moment de jouer, la police chargée), qui
   reste caché pendant l'écriture. Il s'appuie sur les repères du Filet d'or
   (`BoutonFilet`) : le cadre, les coins, le texte, et le calque. À la fin, tout
   ce qu'il a posé est retiré : le bouton qui tombe au clic mesure sa place, et
   sa copie n'a pas d'entrée. Avant le JavaScript, il est caché par
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

/** La ligne de base du texte, dans la page : un repère sans hauteur, posé sur elle, à côté du texte (hors du flux, il ne pousse rien). */
function ligneDeBase(texte: HTMLElement) {
  const sonde = document.createElement("span");
  sonde.setAttribute("aria-hidden", "true");
  sonde.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
  sonde.textContent = "H";
  const repere = document.createElement("span");
  repere.style.cssText = "display:inline-block;width:0;height:0";
  sonde.appendChild(repere);
  texte.appendChild(sonde);
  const y = repere.getBoundingClientRect().bottom;
  sonde.remove();
  return y;
}

/** Les lettres du libellé, chacune à sa place dans le bouton (repère du calque), en capitales si le texte l'est. */
function lettres(texte: HTMLElement, bouton: HTMLElement, l: number) {
  const b = bouton.getBoundingClientRect();
  const k = b.width ? l / b.width : 1;
  const style = getComputedStyle(texte);
  const capitales = style.textTransform === "uppercase";
  const base = (ligneDeBase(texte) - b.top) * k;
  const liste: { c: string; x: number }[] = [];
  const marcheur = document.createTreeWalker(texte, NodeFilter.SHOW_TEXT);
  const plage = document.createRange();
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
    const s = n.textContent ?? "";
    for (let i = 0; i < s.length; i++) {
      if (!s[i].trim()) continue;
      plage.setStart(n, i);
      plage.setEnd(n, i + 1);
      const r = plage.getClientRects()[0];
      if (r) liste.push({ c: capitales ? s[i].toUpperCase() : s[i], x: (r.left - b.left) * k });
    }
  }
  return { liste, base, style };
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

    // ce que l'entrée pose dans le calque, retiré à la fin ou au démontage
    const poses: Element[] = [];
    const retirer = () => {
      poses.forEach((p) => p.remove());
      poses.length = 0;
    };

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        gsap.set(contenu, { autoAlpha: 1 });
        return;
      }
      // Rien de dessiné encore : le bouton peut se montrer.
      gsap.set(cadre, { opacity: 0 });
      gsap.set(coins[0], { scale: 0, transformOrigin: "0% 0%" });
      if (coins[1]) gsap.set(coins[1], { scale: 0, transformOrigin: "100% 100%" });
      gsap.set(texte, { opacity: 0 });
      gsap.set(contenu, { autoAlpha: 1 });
    }, ref);
    if (mouvementReduit()) return () => ctx.revert();

    const nettoyer = () => {
      retirer();
      calque.removeAttribute("viewBox");
      gsap.set([cadre, texte, ...coins], { clearProps: "opacity,transform,transformOrigin,scale" });
    };

    /** Le dessin, construit au moment de jouer : le bouton et ses lettres sont mesurés police chargée. */
    const jouer = () =>
      ctx.add(() => {
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
          poses.push(p);
          const long = p.getTotalLength();
          gsap.set(p, { strokeDasharray: long, strokeDashoffset: long });
          return { p, long };
        });
        // la pointe de la plume : un point lumineux au bout du trait
        const pointe = document.createElementNS(SVG, "circle");
        pointe.setAttribute("r", String(R.pointe));
        pointe.setAttribute("fill", "currentColor");
        pointe.style.filter = "drop-shadow(0 0 4px var(--color-accent)) drop-shadow(0 0 1px var(--color-lin))";
        gsap.set(pointe, { opacity: 0 });
        calque.appendChild(pointe);
        poses.push(pointe);

        // Les lettres, posées sur celles du vrai texte : un contour d'or qui se trace, un remplissage de la couleur du texte.
        const { liste, base, style } = lettres(texte, bouton, l);
        const taille = parseFloat(style.fontSize) || 12;
        const longueur = taille * 8; // plus long que le contour de n'importe quelle lettre à cette taille
        const glyphes = liste.map(({ c, x }) => {
          const t = document.createElementNS(SVG, "text");
          t.textContent = c;
          t.setAttribute("x", String(x));
          t.setAttribute("y", String(base));
          t.setAttribute("fill", style.color);
          t.setAttribute("fill-opacity", "0");
          t.setAttribute("stroke", "currentColor");
          t.setAttribute("stroke-width", String(R.plume));
          t.setAttribute("stroke-linejoin", "round");
          Object.assign(t.style, {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontFeatureSettings: style.fontFeatureSettings,
            fontVariationSettings: style.fontVariationSettings,
            letterSpacing: "0",
          });
          calque.appendChild(t);
          poses.push(t);
          gsap.set(t, { strokeDasharray: longueur, strokeDashoffset: longueur });
          return t;
        });

        const tl = gsap.timeline({ onComplete: nettoyer });
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
        // le libellé s'écrit pendant que la plume fait le tour : chaque lettre se trace, puis l'encre la remplit
        const debut = finTrait * 0.24;
        const pas = glyphes.length > 1 ? Math.max(0, R.ecriture - R.lettre) / (glyphes.length - 1) : 0;
        glyphes.forEach((t, i) => {
          tl.to(t, { strokeDashoffset: 0, duration: R.lettre, ease: "power2.inOut" }, debut + i * pas);
          tl.to(t, { attr: { "fill-opacity": 1 }, duration: 0.3, ease: "power1.in" }, debut + i * pas + R.lettre * 0.6);
        });
        // les deux coins appuyés se posent, et le trait de plume devient le cadre ; le contour des lettres sèche
        tl.to(coins, { scale: 1, duration: 0.28, ease: "back.out(3)", stagger: 0.1 }, Math.max(finTrait, tl.duration()) - 0.05);
        tl.to(cadre, { opacity: 1, duration: R.fondu, ease: "none" }, "<");
        tl.to(
          traits.map((t) => t.p),
          { opacity: 0, duration: R.fondu, ease: "none" },
          "<",
        );
        tl.to(glyphes, { attr: { "stroke-opacity": 0 }, duration: R.fondu, ease: "none" }, "<");
        // le vrai texte reprend la place des lettres dessinées, à l'identique (dans `nettoyer`)
      });

    // il vient quand le texte l'appelle, ou au plus tard à `secours`
    let parti = false;
    const venir = () => {
      if (parti) return;
      parti = true;
      document.removeEventListener(HERO_TEXTE, venir);
      secours.kill();
      document.fonts.ready.then(() => {
        if (ref.current) jouer();
      });
    };
    document.addEventListener(HERO_TEXTE, venir);
    const secours = gsap.delayedCall(R.secours, venir);

    return () => {
      document.removeEventListener(HERO_TEXTE, venir);
      secours.kill();
      ctx.revert();
      retirer();
      calque.removeAttribute("viewBox");
    };
  }, []);

  return (
    <div ref={ref} data-mouvement="hero" className={cn("relative flex justify-center", className)}>
      {children}
    </div>
  );
}
