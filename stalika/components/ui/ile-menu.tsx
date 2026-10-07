"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Le menu du héros en « île dynamique » (demande de J, overlay 2026-10-02).

   Idée prise à la Dynamic Island d'iPhone, vue sur 21st (cult-ui, educalvolpz)
   et dans la table des matières « Dynamic Island TOC » : une capsule noire
   détachée du bord, qui naît toute petite puis s'étire en ressort jusqu'à sa
   largeur, ses liens apparaissant à mesure. Rien de leur code : on ne reprend
   que le mouvement, écrit en GSAP avec les jetons du site.

   Le 2026-10-07 (J : « un petit effet motion design à l'apparition de cette
   barre pour la rendre stylée »), l'arrivée prend du relief, en cinq temps
   courts qui se chevauchent, 1,8 s en tout :
   1. la capsule descend de quelques pixels en sortant du flou ;
   2. elle s'étire en ressort (inchangé) ;
   3. les liens se mettent au point l'un après l'autre, en montant d'un cran ;
   4. un filet de lumière dorée court sur son contour, d'un bout à l'autre,
      puis s'éteint, et un reflet traverse sa surface, une seule fois ;
   5. « Contact » se pose en dernier, avec un petit rebond.

   Largeur animée, jamais une échelle : la capsule garde sa vraie boîte, donc
   le bouton qui s'y accroche (`BoutonChute`) mesure toujours le bon bord bas.
   Le décalage vertical est rendu avant que ce bouton ne soit atteignable.
   La capsule porte `transition: none` le temps du film : sa transition de
   `transform` (le léger enfoncement à l'appui) ferait traîner le décalage.
   Une fois le film fini, les deux calques de lumière sont retirés (`display: none`) :
   le reflet reste décalé à droite de la capsule, invisible, et un élément invisible
   élargit quand même la page (sur téléphone, elle se mettait à défiler à droite ; vu
   le 2026-10-07).
   Mouvement réduit : la capsule est là, entière, d'emblée, sans les deux
   calques de lumière (ils restent invisibles).
--------------------------------------------------------------------------- */

/** Ce que le film pose sur la capsule, et retire à la fin. */
const PROPRIETES = "width,overflow,transition,filter,transform,opacity,visibility";

export function IleMenu({ children, className, ...props }: React.ComponentProps<"nav">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mouvementReduit()) return;
    const liens = Array.from(el.children).filter((c) => !c.classList.contains("sr-only") && !c.hasAttribute("data-ile"));
    if (liens.length === 0) return;
    const contact = liens[liens.length - 1];
    const trace = el.querySelector<HTMLElement>('[data-ile="trace"]');
    const filet = trace?.firstElementChild ?? null;
    const reflet = el.querySelector<HTMLElement>('[data-ile="reflet"]');
    const pleine = el.offsetWidth;

    const ctx = gsap.context(() => {
      gsap.set(el, { width: Math.round(pleine * 0.34), overflow: "hidden", transition: "none", y: -14, filter: "blur(6px)", autoAlpha: 0 });
      gsap.set(liens, { autoAlpha: 0, y: 6, filter: "blur(3px)" });
      gsap.set(contact, { scale: 0.84 });
      if (reflet) gsap.set(reflet, { skewX: -18, xPercent: -160, autoAlpha: 0 });

      const tl = gsap.timeline({
        delay: 0.25,
        onComplete: () => {
          gsap.set(el, { clearProps: PROPRIETES });
          gsap.set(liens, { clearProps: "filter,transform" });
          // Les deux calques de lumière n'ont plus d'usage : transparents, mais le reflet est resté décalé à droite de la
          // capsule, et un élément invisible élargit quand même la page (sur téléphone, elle se mettait à défiler à droite).
          gsap.set([trace, reflet].filter(Boolean), { display: "none" });
        },
      });
      const apres = 0.18 + 0.07 * (liens.length - 1);

      // 1 et 2 : la capsule arrive, sort du flou, et s'étire en ressort.
      tl.to(el, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, 0);
      tl.to(el, { width: pleine, duration: 1.1, ease: "elastic.out(1, 0.62)" }, 0);
      // 3 : les liens se mettent au point, un à un.
      tl.to(liens, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power2.out", stagger: 0.07 }, 0.18);
      // 5 : « Contact » se pose en dernier.
      tl.to(contact, { scale: 1, duration: 0.75, ease: "back.out(2.4)" }, apres);
      // 4 : le filet de lumière sur le contour, puis le reflet sur la surface.
      if (trace && filet) {
        tl.fromTo(trace, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "none" }, 0.4);
        tl.fromTo(filet, { xPercent: -100 }, { xPercent: 250, duration: 1.15, ease: "power2.inOut" }, 0.4);
        tl.to(trace, { autoAlpha: 0, duration: 0.35, ease: "power1.in" }, 1.25);
      }
      if (reflet) {
        tl.to(reflet, { autoAlpha: 1, duration: 0.05 }, 0.85);
        tl.to(reflet, { xPercent: 560, duration: 0.95, ease: "power1.inOut" }, 0.85);
        tl.to(reflet, { autoAlpha: 0, duration: 0.05 }, 1.8);
      }
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={ref}
      className={cn(
        "relative ring-1 ring-foreground/10 shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--color-background)_90%,transparent)] transition-transform duration-200 active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      {children}
      {/* Le filet de lumière : un trait doré qui court sur le contour (un anneau d'un pixel, découpé
          par un masque), éteint tant que le film ne l'allume pas. */}
      <span
        aria-hidden="true"
        data-ile="trace"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] p-px opacity-0"
        style={{
          WebkitMaskImage: "linear-gradient(var(--color-foreground) 0 0), linear-gradient(var(--color-foreground) 0 0)",
          maskImage: "linear-gradient(var(--color-foreground) 0 0), linear-gradient(var(--color-foreground) 0 0)",
          WebkitMaskClip: "content-box, border-box",
          maskClip: "content-box, border-box",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <span className="absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(90deg,transparent,var(--color-accent)_55%,transparent)]" />
      </span>
      {/* Le reflet : une bande de lumière en biais qui traverse la surface une fois. */}
      <span
        aria-hidden="true"
        data-ile="reflet"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 opacity-0 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-foreground)_13%,transparent),transparent)]"
      />
    </nav>
  );
}
