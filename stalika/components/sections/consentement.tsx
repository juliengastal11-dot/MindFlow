"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Cookie } from "lucide-react";
import { gsap, mouvementReduit } from "@/lib/gsap";

const COOKIE = "stalika-consentement";
const DUREE = 15552000; // 6 mois
const EVENEMENT = "stalika:cookies";

type Choix = "oui" | "non";

function lireChoix(): Choix | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(oui|non)`));
    return m ? (m[1] as Choix) : null;
  } catch {
    return null;
  }
}

function ecrireChoix(choix: Choix) {
  try {
    document.cookie = `${COOKIE}=${choix}; max-age=${DUREE}; path=/; SameSite=Lax`;
  } catch {
    /* le choix ne sera pas gardé, le site reste utilisable */
  }
}

/** Bouton du pied de page : rouvre le bandeau. */
export function BoutonCookies() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENEMENT))}
      className="cursor-pointer text-xs opacity-70 outline-none transition-opacity hover:underline hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
    >
      Cookies
    </button>
  );
}

/* ---------------------------------------------------------------------------
   Le bandeau des statistiques de visite, en verre sombre (demande de J,
   2026-10-09 : « un peu plus sexy »). Le texte, les deux réponses et le
   comportement sont ceux d'avant ; ce qui change, c'est l'allure.

   - Le verre : la palette de nuit (`nuit`) posée sur le seul bandeau, comme
     l'île du menu, donc sombre sur une page claire comme sur une scène de
     nuit ; flou et fond translucide là où le navigateur sait flouter, un
     fond presque plein sinon (et avec « réduire la transparence »). Un seul
     élément flouté, jamais plus. Idée : la recette du verre de la fiche
     « glassmorphism » (ui-skills : flou, bord plus clair que le fond, ombre
     en couches) et la forme des bandeaux flottants de 21st (pastille,
     texte court, boutons en pilules).
   - Les deux réponses ont le MÊME poids, même taille, même forme, même
     contraste : refuser doit être aussi simple qu'accepter (BLUEPRINT, H6).
     Seul l'accent camel (l'icône, le filet de lumière du haut) est coloré.
   - L'entrée : la première fois, le bandeau attend que le héros ait joué
     (1,4 s), puis monte en place d'un seul geste, et ses éléments se posent
     l'un après l'autre ; un reflet traverse le verre une fois. Rouvert par le
     lien « Cookies » du pied de page, il arrive tout de suite. À la réponse,
     il redescend avant de disparaître. Mouvement réduit : il est là, immobile.
--------------------------------------------------------------------------- */

export function Consentement() {
  const [pret, setPret] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const carte = useRef<HTMLDivElement>(null);
  const premiere = useRef(true);
  const reponse = useRef(false);

  useEffect(() => {
    const existant = lireChoix();
    setChoix(existant);
    setOuvert(existant === null);
    setPret(true);
    // Rouvert par le pied de page, le bandeau arrive tout de suite : il n'a pas à attendre le héros.
    const rouvrir = () => {
      premiere.current = false;
      setOuvert(true);
    };
    window.addEventListener(EVENEMENT, rouvrir);
    return () => window.removeEventListener(EVENEMENT, rouvrir);
  }, []);

  // L'entrée, à chaque ouverture.
  useEffect(() => {
    const el = carte.current;
    if (!ouvert || !el) return;
    reponse.current = false;
    if (mouvementReduit()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }
    const delai = premiere.current ? 1.4 : 0;
    premiere.current = false;
    const ctx = gsap.context(() => {
      const morceaux = el.querySelectorAll<HTMLElement>("[data-morceau]");
      const icone = el.querySelector<HTMLElement>("[data-icone]");
      const reflet = el.querySelector<HTMLElement>("[data-reflet]");
      const tl = gsap.timeline({ delay: delai });
      tl.fromTo(el, { autoAlpha: 0, y: 44, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "expo.out" });
      tl.from(morceaux, { autoAlpha: 0, y: 10, duration: 0.55, stagger: 0.07, ease: "power3.out" }, "-=0.65");
      if (icone) tl.from(icone, { scale: 0.4, rotate: -40, duration: 0.75, ease: "back.out(2.4)" }, "<");
      if (reflet) tl.fromTo(reflet, { xPercent: -150, autoAlpha: 1 }, { xPercent: 420, autoAlpha: 1, duration: 1.4, ease: "power2.inOut" }, "-=0.8");
    }, el);
    return () => ctx.revert();
  }, [ouvert]);

  const repondre = useCallback((c: Choix) => {
    if (reponse.current) return;
    reponse.current = true;
    ecrireChoix(c);
    setChoix(c);
    const el = carte.current;
    if (!el || mouvementReduit()) {
      setOuvert(false);
      return;
    }
    gsap.to(el, { autoAlpha: 0, y: 28, scale: 0.96, duration: 0.42, ease: "power2.in", onComplete: () => setOuvert(false) });
  }, []);

  if (!pret) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  /* Les deux réponses : une seule recette, donc le même poids. */
  const reponseBouton =
    "inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-foreground/10 px-5 text-[13px] font-medium text-foreground ring-1 ring-inset ring-foreground/20 transition-[transform,background-color] duration-200 hover:bg-foreground/[0.16] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-9";

  return (
    <>
      {choix === "oui" && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="stalika-ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {ouvert ? (
        <div
          ref={carte}
          role="dialog"
          aria-live="polite"
          aria-label="Statistiques de visite"
          data-src="components/sections/consentement.tsx"
          style={{ visibility: "hidden" }}
          className="nuit fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 overflow-hidden rounded-3xl border border-foreground/15 bg-background/95 p-4 text-foreground shadow-[0_28px_70px_-18px_color-mix(in_oklab,var(--color-background)_95%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_18%,transparent)] supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-background! [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none! sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[25.5rem] sm:p-5"
        >
          {/* La lumière qui tombe du haut sur le verre. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-foreground/[0.07] via-transparent to-transparent" />
          {/* Le filet de lumière du haut, comme le bord éclairé de l'île du menu. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-accent/70 to-transparent" />
          {/* Le reflet qui traverse le verre, une fois, à l'arrivée. */}
          <span
            aria-hidden="true"
            data-reflet
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-linear-to-r from-transparent via-foreground/15 to-transparent opacity-0"
          />

          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2.5 sm:gap-y-1.5">
            <span
              aria-hidden="true"
              data-icone
              className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-inset ring-accent/30 sm:row-span-2 sm:size-10"
            >
              <Cookie className="size-[1.125rem] sm:size-5" strokeWidth={1.75} />
            </span>
            <p data-morceau className="eyebrow self-center text-accent sm:self-end">
              Cookies
            </p>
            <p data-morceau className="col-span-2 text-[13px] leading-relaxed text-foreground/85 sm:col-span-1 sm:col-start-2">
              Des statistiques de visite, avec votre accord. Elles m&apos;aident à savoir ce qui vous a
              été utile. Rien n&apos;est déposé tant que vous n&apos;avez pas répondu.
            </p>
          </div>

          <div data-morceau className="mt-4 flex flex-wrap items-center gap-2.5 sm:pl-[3.375rem]">
            <button type="button" onClick={() => repondre("oui")} className={reponseBouton}>
              D&apos;accord
            </button>
            <button type="button" onClick={() => repondre("non")} className={reponseBouton}>
              Non merci
            </button>
            <Link
              href="/confidentialite#cookies"
              className="cursor-pointer rounded-sm px-1 text-xs text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
