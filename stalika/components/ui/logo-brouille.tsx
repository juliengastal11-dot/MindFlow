"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   LogoBrouille : le logo STALIKA qui se compose lettre par lettre.

   Le logo validé par J (lettres lin, triangles camel dans les A, baseline
   « Digital & Conseil ») est découpé en sept images, une par lettre, coupées
   au milieu des espaces : mises bout à bout, elles redonnent exactement le
   logo. Chaque lettre apparaît à son tour sous forme de symboles qui
   défilent, puis se fige sur son morceau de logo ; la baseline arrive quand
   le nom est complet. Ensuite, sans fin, une lettre au hasard se rebrouille
   un instant et retombe sur le logo, une seule à la fois.

   Depuis le 2026-10-07 (J : « tous les logos Stalika, avec les petites lettres
   qui bouclent aléatoirement »), ce composant sert tous les logos du site :
   `LogoStalika` (components/ui/logo-stalika.tsx) lui donne les morceaux de la
   bonne couleur. Trois choses en plus, pour les logos qui ne sont pas en haut
   d'écran :
   - l'entrée ne démarre que quand le logo est à l'écran (un logo de pied de
     page se compose quand on y arrive) ;
   - la boucle des lettres s'arrête quand le logo est hors de l'écran ;
   - `entree` : « toujours » (le héros, le pied de page), « une-fois-par-visite »
     (le menu des autres pages : une fois composé, le logo est là d'emblée
     jusqu'à la fin de la visite), ou « jamais » (l'espace privé : le logo est
     là d'emblée, seule la boucle joue).

   Tailles : tout est proportionnel à la largeur du composant (unités `cqw`
   du conteneur), le logo garde donc ses proportions à toutes les tailles.

   Sans JavaScript et en mouvement réduit : le logo complet, immobile. Les
   lecteurs d'écran lisent le `nom` une fois ; tout le reste est décoratif.
   Durées et symboles dans `MOUVEMENT.film.brouille`.
--------------------------------------------------------------------------- */

/** Clé de sessionStorage : le logo a déjà joué son entrée dans cette visite. */
const CLE_SESSION = "stalika-logo-joue";

export type MorceauLogo = { src: string; largeur: number };

export type LogoBrouilleProps = {
  /** Ce que lit un lecteur d'écran. */
  nom: string;
  /** Les lettres, dans l'ordre, avec leur largeur en pixels dans le fichier source. */
  lettres: readonly MorceauLogo[];
  /** Hauteur commune des images de lettres, en pixels du fichier source. */
  hauteur: number;
  /** La baseline, placée sous le nom, en pixels du même repère que les lettres. */
  baseline?: { src: string; largeur: number; hauteur: number; gauche: number; ecart: number };
  /** Respiration avant la première lettre, en secondes. */
  delai?: number;
  /** L'entrée, lettre par lettre : à chaque fois (par défaut), une fois par visite, ou jamais. */
  entree?: "toujours" | "une-fois-par-visite" | "jamais";
  /** Précharge les images : pour un logo en haut de page. */
  priority?: boolean;
  className?: string;
};

export function LogoBrouille({ nom, lettres, hauteur, baseline, delai = 0, entree = "toujours", priority = false, className }: LogoBrouilleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const total = lettres.reduce((s, l) => s + l.largeur, 0);
  // Taille des symboles : un peu plus que la hauteur des lettres, en % de la largeur totale.
  const taille = (hauteur / total) * 100 * 1.08;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const boites = Array.from(el.querySelectorAll<HTMLElement>("[data-lettre]"));
    const base = el.querySelector<HTMLElement>("[data-baseline]");
    const morceau = (b: HTMLElement) => b.querySelector<HTMLElement>("[data-morceau]");
    const symbole = (b: HTMLElement) => b.querySelector<HTMLElement>("[data-symbole]");

    // La feuille de style cache les boîtes tant que ce composant n'a pas pris la main.
    if (mouvementReduit()) {
      gsap.set(boites, { autoAlpha: 1 });
      if (base) gsap.set(base, { autoAlpha: 1 });
      return;
    }

    // Une visite qui a déjà vu le logo se composer le retrouve entier d'emblée.
    let jouer = entree !== "jamais";
    if (entree === "une-fois-par-visite") {
      try {
        if (window.sessionStorage.getItem(CLE_SESSION) === "1") jouer = false;
      } catch {
        /* stockage indisponible : l'entrée rejouera, ce n'est pas grave */
      }
    }

    const { glyphes, parLettre, changements, decalage, scintille } = MOUVEMENT.film.brouille;
    const auHasard = (sauf?: string | null) => {
      let g = glyphes[Math.floor(Math.random() * glyphes.length)];
      if (g === sauf) g = glyphes[(glyphes.indexOf(g) + 1) % glyphes.length];
      return g;
    };

    /* Brouille une boîte : le morceau de logo s'efface, `n` symboles défilent
       sur `duree` secondes, puis le morceau revient. */
    const brouiller = (b: HTMLElement, duree: number, n: number) => {
      const img = morceau(b);
      const sym = symbole(b);
      if (!img || !sym) return gsap.to({}, { duration: duree });
      const etat = { p: 0 };
      let dernier = -1;
      gsap.set(img, { autoAlpha: 0 });
      return gsap.to(etat, {
        p: 1,
        duration: duree,
        ease: "none",
        onUpdate: () => {
          const pas = Math.min(n - 1, Math.floor(etat.p * n));
          if (pas === dernier) return;
          dernier = pas;
          sym.textContent = auHasard(sym.textContent);
        },
        onComplete: () => {
          sym.textContent = "";
          gsap.set(img, { autoAlpha: 1 });
        },
      });
    };

    let enVue = false;
    let parti = false;
    let veille: IntersectionObserver | undefined;
    let boucler = () => {};

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, delay: delai });
      if (jouer) {
        boites.forEach((b, i) => {
          gsap.set(b, { autoAlpha: 0 });
          tl.set(b, { autoAlpha: 1 }, i * decalage);
          tl.add(brouiller(b, parLettre, changements), i * decalage);
        });
        if (base) {
          gsap.set(base, { autoAlpha: 0, y: 8 });
          tl.to(base, { autoAlpha: 1, y: 0, duration: 0.8, ease: MOUVEMENT.ease }, "+=0.1");
        }
      } else {
        gsap.set(boites, { autoAlpha: 1 });
        if (base) gsap.set(base, { autoAlpha: 1 });
      }

      // La boucle : une lettre au hasard se rebrouille, puis une pause avant la
      // suivante ; elle attend quand le logo est hors de l'écran. `ctx.add`
      // rattache au contexte ce qui naît plus tard, dans un rappel : sans lui, le
      // scintillement survivrait au démontage du composant.
      let precedente = -1;
      const suivante = () =>
        ctx.add(() => {
          if (!enVue) {
            gsap.delayedCall(0.6, suivante);
            return;
          }
          let i = Math.floor(Math.random() * boites.length);
          if (i === precedente) i = (i + 1) % boites.length;
          precedente = i;
          brouiller(boites[i], scintille.duree, scintille.changements);
          const pause = scintille.pauseMin + Math.random() * (scintille.pauseMax - scintille.pauseMin);
          gsap.delayedCall(scintille.duree + pause, suivante);
        });
      boucler = () => ctx.add(() => gsap.delayedCall(scintille.pauseMin, suivante));
      if (jouer) tl.eventCallback("onComplete", boucler);

      // Le départ : dès que le logo est à l'écran.
      veille = new IntersectionObserver(([e]) => {
        enVue = e.isIntersecting;
        if (!enVue || parti) return;
        parti = true;
        if (!jouer) return;
        if (entree === "une-fois-par-visite") {
          try {
            window.sessionStorage.setItem(CLE_SESSION, "1");
          } catch {
            /* stockage indisponible */
          }
        }
        tl.play();
      });
      veille.observe(el);
    }, el);
    // Sans entrée, la boucle part tout de suite (le contexte existe maintenant).
    if (!jouer) boucler();

    return () => {
      veille?.disconnect();
      ctx.revert();
    };
  }, [delai, entree]);

  return (
    <div ref={ref} data-brouille className={cn("@container", className)}>
      <span className="sr-only">{nom}</span>
      <div aria-hidden="true" className="flex items-start">
        {lettres.map((l) => (
          <div
            key={l.src}
            data-lettre
            className="relative shrink-0"
            style={{ width: `${(l.largeur / total) * 100}%` }}
          >
            <Image
              data-morceau
              src={l.src}
              alt=""
              width={l.largeur}
              height={hauteur}
              priority={priority}
              sizes="(min-width: 1024px) 8vw, 13vw"
              className="block h-auto w-full"
            />
            <span
              data-symbole
              className="absolute inset-0 flex items-center justify-center font-mono font-semibold leading-none text-foreground"
              style={{ fontSize: `${taille}cqw` }}
            />
          </div>
        ))}
      </div>
      {baseline && (
        <div
          aria-hidden="true"
          data-baseline
          style={{
            marginTop: `${(baseline.ecart / total) * 100}cqw`,
            marginLeft: `${(baseline.gauche / total) * 100}%`,
            width: `${(baseline.largeur / total) * 100}%`,
          }}
        >
          <Image
            src={baseline.src}
            alt=""
            width={baseline.largeur}
            height={baseline.hauteur}
            priority={priority}
            sizes="(min-width: 1024px) 40vw, 70vw"
            className="block h-auto w-full"
          />
        </div>
      )}
    </div>
  );
}
