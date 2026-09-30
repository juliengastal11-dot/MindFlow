"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Le logo qui se compose à l'ouverture du site.

   Mécanique reprise d'un composant 21st (« special-text », J l'a apporté),
   réécrite ici avec GSAP, sans dépendance : d'abord les lettres apparaissent
   une à une sous forme de glyphes brouillés, puis chacune se fixe de gauche à
   droite, un tiret bas marquant la lettre en cours ; enfin le lettrage se
   fond dans le vrai logo. Durées dans `MOUVEMENT.film.logo`.

   Joué une fois par visite (sessionStorage), jamais en mouvement réduit,
   jamais sans JavaScript : dans ces trois cas, le logo est là d'emblée. Le
   lettrage est `aria-hidden` : pour un lecteur d'écran, il n'y a que l'image
   et son `alt`.

   Tant que l'effet n'a pas décidé, l'image est masquée par la feuille de
   style (`html.js .logo-anime[data-etat="attente"]`) : sans ça, le logo
   apparaîtrait un instant avant de se retaper.
--------------------------------------------------------------------------- */

const CLE_SESSION = "stalika-logo-joue";

export type LogoAnimeProps = {
  /** `nuit` : lettres crème (fond sombre) ; sinon lettres marine. */
  fond?: "jour" | "nuit";
  className?: string;
};

export function LogoAnime({ fond = "jour", className }: LogoAnimeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [etat, setEtat] = useState<"attente" | "joue" | "fini">("attente");
  const mot = "STALIKA";

  useEffect(() => {
    let dejaJoue = false;
    try {
      dejaJoue = window.sessionStorage.getItem(CLE_SESSION) === "1";
    } catch {
      dejaJoue = false;
    }
    setEtat(dejaJoue || mouvementReduit() ? "fini" : "joue");
  }, []);

  /* Deuxième temps : le lettrage n'existe dans le DOM qu'une fois l'état
     « joue » rendu, d'où un effet séparé qui le cherche à ce moment-là. */
  useEffect(() => {
    if (etat !== "joue") return;
    const el = ref.current;
    const lettrage = el?.querySelector<HTMLElement>("[data-lettrage]");
    const image = el?.querySelector<HTMLElement>("[data-image]");
    if (!el || !lettrage || !image) return;

    const { brouillage, fixation, fondu, glyphes } = MOUVEMENT.film.logo;
    const hasard = (i: number, t: number) => glyphes[Math.floor((t * 31 + i * 7) % glyphes.length)];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setEtat("fini");
          try {
            window.sessionStorage.setItem(CLE_SESSION, "1");
          } catch {
            /* stockage indisponible : l'effet rejouera, ce n'est pas grave */
          }
        },
      });

      // Phase 1 : les lettres arrivent une à une, brouillées.
      const p1 = { n: 0 };
      tl.to(p1, {
        n: mot.length,
        duration: brouillage,
        ease: "none",
        onUpdate: () => {
          const t = Math.floor(p1.n * 12);
          let s = "";
          for (let i = 0; i < mot.length; i++) s += i < p1.n ? hasard(i, t + i) : " ";
          lettrage.textContent = s;
        },
      });

      // Phase 2 : chaque lettre se fixe, de gauche à droite, avec un tiret bas devant.
      const p2 = { n: 0 };
      tl.to(p2, {
        n: mot.length,
        duration: fixation,
        ease: "none",
        onUpdate: () => {
          const fixees = Math.floor(p2.n);
          const t = Math.floor(p2.n * 12);
          let s = mot.slice(0, fixees);
          if (fixees < mot.length) s += t % 2 === 0 ? "_" : hasard(fixees, t);
          for (let i = s.length; i < mot.length; i++) s += hasard(i, t + i);
          lettrage.textContent = s;
        },
        onComplete: () => {
          lettrage.textContent = mot;
        },
      });

      // Le lettrage se fond dans le logo.
      tl.to(lettrage, { autoAlpha: 0, duration: fondu, ease: "power2.out" }, "+=0.1");
      tl.fromTo(image, { autoAlpha: 0 }, { autoAlpha: 1, duration: fondu, ease: "power2.out" }, "<");
    }, el);

    return () => ctx.revert();
  }, [etat]);

  return (
    <span ref={ref} data-etat={etat} className={cn("logo-anime relative inline-block", className)}>
      <Image
        data-image
        src={fond === "nuit" ? "/logo-clair.png" : "/logo-nuit.png"}
        alt="Stalika"
        width={880}
        height={289}
        className="h-full w-auto"
        priority
      />
      {etat === "joue" && (
        <span
          aria-hidden="true"
          data-lettrage
          className="absolute inset-0 flex items-center whitespace-pre pl-[0.1em] font-sans text-[0.62em] font-semibold uppercase tracking-[0.34em] text-foreground"
        />
      )}
    </span>
  );
}
