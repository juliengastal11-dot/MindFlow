"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Scene, useScene } from "@/components/ui/scene";
import { Montre } from "@/components/ui/montre";
import { Trace } from "@/components/ui/trace";
import { Rouleaux } from "@/components/ui/rouleaux";
import { BoutonFilet } from "@/components/ui/bouton-filet";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Scène 5 · Livré, refaite le 2026-10-18 (J : « trop générique ; quelque chose
   de personnel et d'extraordinaire, comme les autres sections », puis, parmi
   cinq pistes, le chronographe : « une très belle montre, qui au défilement
   tourne et montre tout le processus de création, du début à la fin »).

   Une montre habillée en or (`Montre`, dessinée d'après la référence de J)
   reste au milieu de l'écran pendant que la piste défile ; à chaque étape du
   processus, l'aiguille fine du chronographe avance de deux heures et allume
   les index qu'elle passe, les aiguilles des heures et des minutes tournent,
   la montre s'incline un peu, comme dans la main. Huit temps :
   0. l'arrivée : réglé comme une montre ;
   1. le premier message ;
   2. on en parle : l'appel, le devis, le prix ;
   3. la première ébauche : on appuie sur la couronne (c'est un chronographe
      monopoussoir), le compteur fait le tour des 72 heures pendant que le
      chiffre roule jusqu'à 72 ;
   4. vous relisez ;
   5. tout est vérifié : mentions légales, sécurité, référencement ;
   6. la mise en ligne : chez vous ou chez moi, le domaine à votre nom ;
   7. et après : la montre se retourne sur son fond saphir, le rotor tourne,
      le balancier bat ; le code est à vous, et le bouton « Parlons de votre
      projet ».
   Les faits sont ceux que J a donnés pour l'ancienne section, la FAQ et le
   questionnaire (aucun chiffre ajouté).

   Mécanique : `Scene` en mode `defilement`, comme « La relecture » : une piste
   plus haute que l'écran, son contenu collé par `position: sticky`, une
   chronologie de 0 à 1 qui suit la piste. Les étapes sont une vraie liste ;
   collées, elles se superposent et la chronologie les fait apparaître tour à
   tour (app/globals.css, « La section de la montre »). Sans JavaScript, et en
   mouvement réduit : la montre immobile, puis les huit temps en liste.
--------------------------------------------------------------------------- */

const R = MOUVEMENT.livre;
const N = 8;
const S = 1 / N;
const d = (k: number) => k * S;

const COCHES = [
  "Mentions légales et confidentialité en règle",
  "Sécurité vérifiée avant la mise en ligne",
  "Référencement soigné : titres, descriptions, plan du site, fiche Google",
] as const;

/* L'inclinaison de la montre à chaque étape (degrés) : un geste de la main, jamais deux fois le même. */
const INCLINAISONS = [
  { x: 9, y: -7 },
  { x: 11, y: 8 },
  { x: 6, y: -10 },
  { x: 3, y: 0 },
  { x: 10, y: 9 },
  { x: 7, y: -8 },
  { x: 5, y: 5 },
  { x: 8, y: 0 },
] as const;

function Numero({ n }: { n: number }) {
  return <p className="font-mono text-[11px] tracking-[0.3em] text-accent">{String(n).padStart(2, "0")} / 07</p>;
}

function Etapes() {
  return (
    <ol className="chrono-etapes">
      <li data-etape="0">
        <p className="eyebrow text-accent">04 · Livré</p>
        <h2 id="livre-titre" className="mt-3 text-3xl sm:text-4xl md:text-5xl">
          Réglé comme une montre
          <span className="mt-1 block text-accent">du premier message à la mise en ligne</span>
        </h2>
        <p className="mt-5 max-w-md text-sm text-foreground/80 md:text-base">Sept étapes, et un seul interlocuteur du début à la fin.</p>
      </li>
      <li data-etape="1">
        <Numero n={1} />
        <h3 className="chrono-titre">Le premier message</h3>
        <p className="chrono-texte-p">Vous m&apos;écrivez : dans la discussion, ici même, ou par le questionnaire, dix questions et cinq minutes.</p>
      </li>
      <li data-etape="2">
        <Numero n={2} />
        <h3 className="chrono-titre">On en parle</h3>
        <p className="chrono-texte-p">Un appel pour comprendre ce qu&apos;il vous faut, puis un devis. Chaque projet se règle avec vous, un par un.</p>
        <p className="mt-5 font-display text-3xl md:text-4xl">À partir de 300 €</p>
        <p className="mt-1 text-sm text-foreground/70">payable en plusieurs fois, sans frais</p>
      </li>
      <li data-etape="3">
        <Numero n={3} />
        <h3 className="chrono-titre">Votre première ébauche</h3>
        <p className="mt-3 font-display text-5xl tabular-nums text-accent md:text-6xl">
          <Rouleaux valeur={72} chiffres={2} de={d(3) + S * 0.15} a={d(3) + S * 0.75} />
          &nbsp;h
        </p>
        <p className="chrono-texte-p">Sous 72 heures, vous voyez votre site. Pas un modèle : il est dessiné pour vous.</p>
      </li>
      <li data-etape="4">
        <Numero n={4} />
        <h3 className="chrono-titre">Vous relisez</h3>
        <p className="chrono-texte-p">
          Vous recevez un lien pour voir votre site et le modifier. Vous commentez sur la page, je mets à jour à votre guise.
        </p>
      </li>
      <li data-etape="5">
        <Numero n={5} />
        <h3 className="chrono-titre">Tout est vérifié</h3>
        <ul className="mt-5 space-y-3">
          {COCHES.map((texte, i) => (
            <li key={texte} className="flex items-start gap-3 text-sm md:text-base">
              <Trace
                d="M5 12.5l4.5 4.5L19 7"
                viewBox="0 0 24 24"
                de={d(5) + S * (0.12 + i * 0.2)}
                a={d(5) + S * (0.3 + i * 0.2)}
                epaisseur={2.5}
                trait="stroke-accent"
                className="mt-0.5 size-5 shrink-0"
              />
              <span className="text-foreground/85">{texte}</span>
            </li>
          ))}
        </ul>
      </li>
      <li data-etape="6">
        <Numero n={6} />
        <h3 className="chrono-titre">La mise en ligne</h3>
        <div className="mt-5 space-y-4">
          <div className="border-t border-foreground/15 pt-3">
            <p className="eyebrow text-accent">Chez vous</p>
            <p className="mt-1.5 text-sm text-foreground/85 md:text-base">Je vous livre le site prêt à publier et je vous accompagne pour le mettre en ligne.</p>
          </div>
          <div className="border-t border-foreground/15 pt-3">
            <p className="eyebrow text-accent">Chez moi</p>
            <p className="mt-1.5 text-sm text-foreground/85 md:text-base">
              Je m&apos;occupe de l&apos;hébergement et de la maintenance, pour un petit abonnement mensuel.
            </p>
          </div>
          <p className="text-sm text-foreground/65">Dans les deux cas, le nom de domaine est à votre nom. C&apos;est écrit dans le devis.</p>
        </div>
      </li>
      <li data-etape="7">
        <Numero n={7} />
        <h3 className="chrono-titre">Et après</h3>
        <p className="chrono-texte-p">Le code est à vous : vous partez quand vous voulez, avec votre site. Et je reste joignable.</p>
        <p className="mt-5 text-sm text-foreground/70">À partir de 300 € · première ébauche sous 72 h · partout en France, à distance</p>
        <p className="mt-1 text-sm text-foreground/70">Un logiciel ou une application sur mesure ? Dites-moi ce qu&apos;il vous faut.</p>
        <BoutonFilet className="mt-6">
          <Link href="/contact">
            Parlons de votre projet
            <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4 transition-transform duration-500 group-hover:translate-x-1.5" />
          </Link>
        </BoutonFilet>
      </li>
    </ol>
  );
}

/** Le film de la montre, inscrit sur la chronologie de la scène. */
function Mecanique({ scene: racine }: { scene: React.RefObject<HTMLDivElement | null> }) {
  const scene = useScene();

  useEffect(() => {
    const el = racine.current;
    if (!el || !scene || mouvementReduit()) return;
    const q = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s);
    const montre = q(".montre");
    const incline = q("[data-montre-incline]");
    const pivot = q("[data-montre-pivot]");
    const heures = q<SVGGElement>('[data-montre-aiguille="heures"]');
    const minutes = q<SVGGElement>('[data-montre-aiguille="minutes"]');
    const ombreH = q<SVGGElement>('[data-montre-ombre="heures"]');
    const ombreM = q<SVGGElement>('[data-montre-ombre="minutes"]');
    const chrono = q<SVGGElement>('[data-montre-aiguille="chrono"]');
    const compteur = q<SVGGElement>("[data-montre-compteur]");
    const couronne = q<SVGGElement>("[data-montre-couronne]");
    const rotor = q<SVGGElement>("[data-montre-rotor]");
    const balancier = q<SVGGElement>("[data-montre-balancier]");
    const roues = Array.from(el.querySelectorAll<SVGGElement>("[data-montre-roue]"));
    const index = Array.from(el.querySelectorAll<SVGRectElement>("[data-montre-index]"));
    const etapes = Array.from(el.querySelectorAll<HTMLElement>("[data-etape]"));
    if (!montre || !incline || !pivot || !heures || !minutes || !chrono || !compteur || !couronne || !rotor || !balancier) return;

    const arc = q<SVGCircleElement>("[data-montre-arc]");

    return scene.inscrire((tl) => {
      /* Les rotations du dessin sont écrites à la main, sur un objet que la chronologie fait avancer : `rotate(angle cx cy)`.
         (GSAP calculait mal le centre de rotation de ces aiguilles, dans un SVG agrandi et basculé en 3D : décalées, elles
         ne passaient plus par le centre.) Les ombres des aiguilles tournent avec elles, décalées vers le bas à droite. */
      const tourne = (el: SVGElement | null, cx: number, cy: number, depart: number, ombre?: SVGElement | null) => {
        const etat = { a: depart };
        const poser = () => {
          el?.setAttribute("transform", `rotate(${etat.a} ${cx} ${cy})`);
          ombre?.setAttribute("transform", `translate(1.4 2.2) rotate(${etat.a} ${cx} ${cy})`);
        };
        poser();
        return { etat, poser };
      };
      const h = tourne(heures, 220, 220, -62, ombreH);
      const m = tourne(minutes, 220, 220, 62, ombreM);
      const ch = { a: 0 };
      const poserChrono = () => {
        chrono.setAttribute("transform", `rotate(${ch.a} 220 220)`);
        arc?.setAttribute("stroke-dashoffset", String(360 - ch.a));
      };
      poserChrono();
      const cpt = tourne(compteur, 0, 0, 0);
      const rot = tourne(rotor, 134, 134, -24);
      const bal = tourne(balancier, 0, 0, 0);
      const rs = roues.map((r) => tourne(r, 0, 0, 0));
      gsap.set(index, { opacity: 0 });

      // L'arrivée : la montre se pose, de biais, puis se redresse.
      gsap.set(incline, { rotationX: 22, rotationY: -18, rotationZ: -7, scale: 0.9 });
      gsap.set(montre, { "--reflet-x": "10%", "--reflet-y": "8%" });
      tl.to(incline, { rotationX: INCLINAISONS[0].x, rotationY: INCLINAISONS[0].y, rotationZ: 0, scale: 1, duration: S * 0.8, ease: "power2.out" }, 0);

      etapes.forEach((li, k) => {
        if (k > 0) {
          gsap.set(li, { autoAlpha: 0, y: 20 });
          tl.to(li, { autoAlpha: 1, y: 0, duration: S * 0.22, ease: "power2.out" }, d(k) + S * 0.04);
        }
        if (k < N - 1) tl.to(li, { autoAlpha: 0, y: -16, duration: S * 0.18, ease: "power1.in" }, d(k + 1) - S * 0.2);
        // la montre bouge dans la main, et la lumière glisse sur le verre
        if (k > 0) {
          const { x, y } = INCLINAISONS[k];
          tl.to(incline, { rotationX: x, rotationY: y, scale: k === 3 ? 1.05 : 1, duration: S * 0.7, ease: "sine.inOut" }, d(k));
          tl.to(montre, { "--reflet-x": `${-y * 0.9}%`, "--reflet-y": `${(x - 8) * 0.9}%`, duration: S * 0.7, ease: "sine.inOut" }, d(k));
        }
      });

      // Étapes 1 à 6 : l'aiguille du chrono avance de deux heures, l'arc d'or la suit, les index qu'elle passe s'allument ;
      // et le temps passe, une heure par étape.
      for (let k = 1; k <= 6; k++) {
        const t = d(k) + S * 0.1;
        tl.to(ch, { a: 60 * k, duration: S * 0.6, ease: "power2.inOut", onUpdate: poserChrono }, t);
        tl.to(index[2 * k - 1], { opacity: 1, duration: S * 0.08 }, t + S * 0.26);
        tl.to(index[(2 * k) % 12], { opacity: 1, duration: S * 0.08 }, t + S * 0.52);
        tl.to(m.etat, { a: 62 + 360 * k, duration: S * 0.7, ease: "sine.inOut", onUpdate: m.poser }, d(k));
        tl.to(h.etat, { a: -62 + 30 * k, duration: S * 0.7, ease: "sine.inOut", onUpdate: h.poser }, d(k));
      }

      // Étape 3 : on appuie sur la couronne, le compteur fait le tour des 72 heures.
      tl.to(couronne, { x: -5, duration: S * 0.04, ease: "power2.in" }, d(3) + S * 0.08);
      tl.to(couronne, { x: 0, duration: S * 0.06, ease: "power2.out" }, d(3) + S * 0.12);
      tl.to(cpt.etat, { a: 360, duration: S * 0.6, ease: "power1.inOut", onUpdate: cpt.poser }, d(3) + S * 0.15);

      // Étape 7 : la montre se retourne ; on voit le mouvement, le rotor tourne, le balancier bat.
      tl.to(pivot, { rotationY: 180, duration: S * 0.45, ease: "power2.inOut" }, d(7) + S * 0.04);
      tl.to(rot.etat, { a: 300, duration: S * 0.9, ease: "power1.inOut", onUpdate: rot.poser }, d(7) + S * 0.08);
      rs.forEach((r, k) =>
        tl.to(r.etat, { a: roues[k].dataset.montreRoue === "inverse" ? -220 : 140 + k * 30, duration: S * 0.9, onUpdate: r.poser }, d(7) + S * 0.08),
      );
      tl.to(bal.etat, { keyframes: { a: [0, 210, -40, 190, -20, 170, 0] }, duration: S * 0.9, onUpdate: bal.poser }, d(7) + S * 0.08);
    });
  }, [scene, racine]);

  return null;
}

export function SceneLivre() {
  const racine = useRef<HTMLDivElement>(null);
  return (
    <Scene id="livre" nuit defilement src="components/sections/scene-livre.tsx" aria-labelledby="livre-titre">
      <div ref={racine} data-piste className="chrono-piste motion-reduce:min-h-0!" style={{ minHeight: `${(1 + R.ecrans) * 100}svh` }}>
        <div className="chrono-colle">
          <div className="chrono-lumiere" aria-hidden="true" />
          <div className="chrono-montre">
            <Montre />
          </div>
          <div className="chrono-texte">
            <Etapes />
          </div>
        </div>
        <Mecanique scene={racine} />
      </div>
    </Scene>
  );
}
