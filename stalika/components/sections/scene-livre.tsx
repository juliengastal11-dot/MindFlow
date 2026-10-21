"use client";

import { useEffect, useRef, useState } from "react";
import { Scene, useScene } from "@/components/ui/scene";
import { Trace } from "@/components/ui/trace";
import { Rouleaux } from "@/components/ui/rouleaux";
import { MontreFilm } from "@/components/ui/montre-film";
import { SplitText } from "gsap/SplitText";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Scène 5 · Livré, refaite le 2026-10-18 (J : « trop générique ; quelque chose
   de personnel et d'extraordinaire, comme les autres sections », puis, parmi
   cinq pistes, le chronographe : « une très belle montre, qui au défilement
   tourne et montre tout le processus de création, du début à la fin »).

   La montre se fabrique au défilement (2026-10-19, J : « qu'on enlève le
   modèle 3D et qu'on mette le modèle qui se fabrique, le modèle explosé »,
   puis, le 20 : « sans fondu, sans montre qui change de forme, des pièces qui
   s'emboîtent de manière esthétique et réaliste ») : une séquence d'images
   rendue dans Blender (outils/montre/blender), une vraie montre en volume dont
   les pièces, enfilées sur un fil d'or, redescendent une à une sur le boîtier,
   une étape du processus après l'autre ; la montre finie, la caméra vient la
   voir de plus près (components/ui/montre-film.tsx, lib/montre-film.ts). Les
   versions d'avant (la montre 3D en Three.js, la montre dessinée, les pièces en
   photo qui se relevaient par un morphing) sont dans l'historique. Huit temps :
   0. l'arrivée : réglé comme une montre, la vue éclatée ;
   1. le premier message : le mouvement descend dans la carrure ;
   2. on en parle (l'appel, le devis, le prix) : le fond, la couronne ;
   3. la première ébauche : le cadran, pendant que le chiffre roule jusqu'à 72 ;
   4. vous relisez : les aiguilles ;
   5. tout est vérifié (mentions légales, sécurité, référencement) : le verre
      et la lunette ;
   6. la mise en ligne (chez vous ou chez moi, le domaine à votre nom) : les
      bracelets ; la montre finie se relève ;
   7. et après : la caméra se relève et s'approche de la montre finie (J :
      « le retournement ne sert à rien finalement ») ; le code est à vous (le
      bouton « Parlons de votre projet » qui finissait ce temps est retiré le
      2026-10-21, à la demande de J : celui du hero suffit).
   Les faits sont ceux que J a donnés pour l'ancienne section, la FAQ et le
   questionnaire (aucun chiffre ajouté).

   Le texte suit l'aiguille (2026-10-18, J : « que le texte s'affiche de
   manière stylée, fluide, et suive le mouvement des aiguilles » ; parmi quatre
   pistes en maquettes, « la lecture à l'aiguille » pour le texte et « le
   quantième » pour les numéros et les titres). Le numéro et le titre de chaque
   temps tournent dans leur fenêtre comme le disque de date d'une montre : les
   lettres montent une à une, celles du temps d'avant partent par le haut, au
   même endroit. Le reste du texte est là dès le changement, très pâle, et
   s'allume mot à mot, avec un éclat d'or au passage, pendant que la pièce de
   l'étape se pose. Au-dessus du texte, une réglette de soixante minutes, le
   pourtour du cadran déroulé : un curseur la parcourt, de deux heures en deux
   heures, et dore les minutes passées.

   Place (2026-10-19, J) : dans le ciel, juste avant la plongée dans
   l'ordinateur. Le ciel défile derrière elle (il s'arrête plus haut, pendant
   « La relecture » : `Ciel`, `pauses`) ; la section est transparente sur le plan, sans voile
   (J : « pas de voile sombre »), sauf derrière le texte ; le texte garde l'ombre `sur-ciel` des autres scènes.

   Mécanique : `Scene` en mode `defilement`, comme « La relecture » : une piste
   plus haute que l'écran, son contenu collé par `position: sticky`, une
   chronologie de 0 à 1 qui suit la piste. Les étapes sont une vraie liste ;
   collées, elles se superposent et la chronologie les fait apparaître tour à
   tour (app/globals.css, « La section de la montre »). Sans JavaScript, et en
   mouvement réduit : la montre finie, de trois quarts, immobile, puis les huit temps en liste.
--------------------------------------------------------------------------- */

const R = MOUVEMENT.livre;
const N = 8;
const S = 1 / 8;
const d = (k: number) => k * S;

const COCHES = [
  "Mentions légales et confidentialité en règle",
  "Sécurité vérifiée avant la mise en ligne",
  "Référencement soigné : titres, descriptions, plan du site, fiche Google",
] as const;

/* Pour le film du texte : `data-numero` et `data-titre` tournent comme un quantième ; `data-corps` apparaît en bloc, et
   ses `data-lecture` s'allument mot à mot derrière l'aiguille. */
function Numero({ n }: { n: number }) {
  return (
    <p data-numero className="overflow-hidden font-mono text-[11px] tracking-[0.3em] text-accent">
      <span className="inline-block">{String(n).padStart(2, "0")} / 07</span>
    </p>
  );
}

function Etapes() {
  return (
    <ol className="chrono-etapes">
      <li data-etape="0">
        <p data-numero className="eyebrow overflow-hidden text-accent">
          <span className="inline-block">04 · Livré</span>
        </p>
        <h2 id="livre-titre" data-titre className="mt-3 text-3xl sm:text-4xl md:text-5xl">
          Réglé comme une montre
          <span className="mt-1 block text-accent">du premier message à la mise en ligne</span>
        </h2>
        <div data-corps>
          <p data-lecture className="mt-5 max-w-md text-sm text-foreground/80 md:text-base">
            Sept étapes, et un seul interlocuteur du début à la fin.
          </p>
        </div>
      </li>
      <li data-etape="1">
        <Numero n={1} />
        <h3 data-titre className="chrono-titre">Le premier message</h3>
        <div data-corps>
          <p data-lecture className="chrono-texte-p">Vous m&apos;écrivez : dans la discussion, ici même, ou par le questionnaire, dix questions et cinq minutes.</p>
        </div>
      </li>
      <li data-etape="2">
        <Numero n={2} />
        <h3 data-titre className="chrono-titre">On en parle</h3>
        <div data-corps>
          <p data-lecture className="chrono-texte-p">Un appel pour comprendre ce qu&apos;il vous faut, puis un devis. Chaque projet se règle avec vous, un par un.</p>
          <p data-lecture className="mt-5 font-display text-3xl md:text-4xl">À partir de 300 €</p>
          <p data-lecture className="mt-1 text-sm text-foreground/70">payable en plusieurs fois, sans frais</p>
        </div>
      </li>
      <li data-etape="3">
        <Numero n={3} />
        <h3 data-titre className="chrono-titre">Votre première ébauche</h3>
        <div data-corps>
          <p className="mt-3 font-display text-5xl tabular-nums text-accent md:text-6xl">
            <Rouleaux valeur={72} chiffres={2} de={d(3) + S * 0.15} a={d(3) + S * 0.75} />
            &nbsp;h
          </p>
          <p data-lecture className="chrono-texte-p">Sous 72 heures, vous voyez votre site. Pas un modèle : il est dessiné pour vous.</p>
        </div>
      </li>
      <li data-etape="4">
        <Numero n={4} />
        <h3 data-titre className="chrono-titre">Vous relisez</h3>
        <div data-corps>
          <p data-lecture className="chrono-texte-p">
            Vous recevez un lien pour voir votre site et le modifier. Vous commentez sur la page, je mets à jour à votre guise.
          </p>
        </div>
      </li>
      <li data-etape="5">
        <Numero n={5} />
        <h3 data-titre className="chrono-titre">Tout est vérifié</h3>
        <div data-corps>
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
                <span data-lecture className="text-foreground/85">
                  {texte}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </li>
      <li data-etape="6">
        <Numero n={6} />
        <h3 data-titre className="chrono-titre">La mise en ligne</h3>
        <div data-corps className="mt-5 space-y-4">
          <div className="border-t border-foreground/15 pt-3">
            <p data-lecture className="eyebrow text-accent">
              Chez vous
            </p>
            <p data-lecture className="mt-1.5 text-sm text-foreground/85 md:text-base">
              Je vous livre le site prêt à publier et je vous accompagne pour le mettre en ligne.
            </p>
          </div>
          <div className="border-t border-foreground/15 pt-3">
            <p data-lecture className="eyebrow text-accent">
              Chez moi
            </p>
            <p data-lecture className="mt-1.5 text-sm text-foreground/85 md:text-base">
              Je m&apos;occupe de l&apos;hébergement et de la maintenance, pour un petit abonnement mensuel.
            </p>
          </div>
          <p data-lecture className="text-sm text-foreground/65">
            Dans les deux cas, le nom de domaine est à votre nom. C&apos;est écrit dans le devis.
          </p>
        </div>
      </li>
      <li data-etape="7">
        <Numero n={7} />
        <h3 data-titre className="chrono-titre">Et après</h3>
        <div data-corps>
          <p data-lecture className="chrono-texte-p">Le code est à vous : vous partez quand vous voulez, avec votre site. Et je reste joignable.</p>
          <p data-lecture className="mt-5 text-sm text-foreground/70">
            À partir de 300 € · première ébauche sous 72 h · partout en France, à distance
          </p>
          <p data-lecture className="mt-1 text-sm text-foreground/70">
            Un logiciel ou une application sur mesure ? Dites-moi ce qu&apos;il vous faut.
          </p>
        </div>
      </li>
    </ol>
  );
}

/** Le film du texte, inscrit sur la chronologie de la scène ; la montre se joue toute seule (components/ui/montre-photo.tsx). */
function Mecanique({ scene: racine }: { scene: React.RefObject<HTMLDivElement | null> }) {
  const scene = useScene();

  useEffect(() => {
    const el = racine.current;
    if (!el || !scene || mouvementReduit()) return;
    const etapes = Array.from(el.querySelectorAll<HTMLElement>("[data-etape]"));
    gsap.registerPlugin(SplitText);
    const coupes: SplitText[] = [];

    const desinscrire = scene.inscrire((tl) => {
      // la réglette au-dessus du texte : son curseur avance de deux heures à chaque étape (1 à 6)
      const ch = { a: 0 };
      const poserReglette = () => el.style.setProperty("--chrono", String(ch.a / 360));
      poserReglette();
      for (let k = 1; k <= 6; k++) tl.to(ch, { a: 60 * k, duration: S * 0.6, ease: "power2.inOut", onUpdate: poserReglette }, d(k) + S * 0.1);

      /* Le texte suit l'aiguille. Chaque temps a son état : l'entrée et la sortie du numéro et du titre (le quantième),
         l'apparition du corps, et la lecture (de 0 à 1, comme l'aiguille sur ses deux heures). Les lettres et les mots
         sont posés à la main à chaque image, d'après cet état : une lettre peut ainsi entrer puis sortir sans que deux
         tweens se disputent son `transform`. */
      const borne = (x: number) => Math.min(1, Math.max(0, x));
      const douce = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
      etapes.forEach((li, k) => {
        const numero = li.querySelector<HTMLElement>("[data-numero] > span");
        const titre = li.querySelector<HTMLElement>("[data-titre]");
        const corps = li.querySelector<HTMLElement>("[data-corps]");
        const lectures = Array.from(li.querySelectorAll<HTMLElement>("[data-lecture]"));
        if (!numero || !titre || !corps) return;
        const coupeTitre = SplitText.create(titre, { type: "words,chars", mask: "chars", charsClass: "chrono-lettre" });
        const coupeMots = SplitText.create(lectures, { type: "words", wordsClass: "chrono-mot" });
        coupes.push(coupeTitre, coupeMots);
        // la fenêtre de chaque lettre, un peu plus haute que la lettre : les accents ne sont pas rognés
        for (const m of coupeTitre.masks) Object.assign((m as HTMLElement).style, { paddingBlock: "0.14em", marginBlock: "-0.14em" });
        const lettres = coupeTitre.chars as HTMLElement[];
        const mots = coupeMots.words as HTMLElement[];
        const n = lettres.length;
        const m = mots.length;

        const e = { numIn: k === 0 ? 1 : 0, numOut: 0, titIn: k === 0 ? 1 : 0, titOut: 0, lecture: 0 };
        const poserQuantieme = () => {
          numero.style.transform = `translateY(${((1 - e.numIn) * 110 - e.numOut * 110).toFixed(2)}%)`;
          lettres.forEach((c, j) => {
            const entre = douce(borne((e.titIn * (n + 5) - j) / 5));
            const sort = douce(borne((e.titOut * (n + 3) - j) / 3));
            c.style.transform = `translateY(${((1 - entre) * 110 - sort * 110).toFixed(2)}%)`;
          });
        };
        const poserLecture = () => {
          mots.forEach((w, j) => {
            const v = borne(e.lecture * (m + 1.5) - j);
            w.style.setProperty("--v", v.toFixed(3));
            w.style.setProperty("--b", Math.sin(Math.PI * v).toFixed(3));
          });
        };
        poserQuantieme();
        poserLecture();

        // l'entrée : le numéro tourne, puis le titre lettre à lettre ; le corps paraît, pâle
        if (k > 0) {
          gsap.set(li, { autoAlpha: 0 });
          gsap.set(corps, { opacity: 0 });
          tl.set(li, { autoAlpha: 1 }, d(k));
          tl.to(e, { numIn: 1, duration: S * 0.12, ease: "power2.out", onUpdate: poserQuantieme }, d(k));
          tl.to(e, { titIn: 1, duration: S * 0.4, onUpdate: poserQuantieme }, d(k) + S * 0.03);
          tl.to(corps, { opacity: 1, duration: S * 0.08 }, d(k) + S * 0.05);
        }
        // la lecture : pendant l'arrivée de la montre, puis pendant que la pièce de l'étape se pose (1 à 6), puis pendant
        // que la caméra s'approche
        const lecture =
          k === 0
            ? { t: 0, duree: S * 0.7, ease: "power2.out" }
            : k < N - 1
              ? { t: d(k) + S * 0.1, duree: S * 0.6, ease: "power2.inOut" }
              : { t: d(k) + S * 0.04, duree: S * 0.5, ease: "power2.inOut" };
        tl.to(e, { lecture: 1, duration: lecture.duree, ease: lecture.ease, onUpdate: poserLecture }, lecture.t);
        // la sortie : numéro et titre partent par le haut, le corps s'efface
        if (k < N - 1) {
          tl.to(e, { numOut: 1, duration: S * 0.1, ease: "power2.in", onUpdate: poserQuantieme }, d(k + 1));
          tl.to(e, { titOut: 1, duration: S * 0.12, onUpdate: poserQuantieme }, d(k + 1));
          tl.to(corps, { opacity: 0, duration: S * 0.06 }, d(k + 1));
          tl.set(li, { autoAlpha: 0 }, d(k + 1) + S * 0.14);
        }
      });
    });
    return () => {
      desinscrire();
      coupes.forEach((c) => c.revert());
    };
  }, [scene, racine]);

  return null;
}

export function SceneLivre() {
  const racine = useRef<HTMLDivElement>(null);
  // la montre en photo : ses images se chargent à l'approche de la section (un écran et demi avant), elle paraît une fois
  // toutes décodées
  const [charger, setCharger] = useState(false);
  const [prete, setPrete] = useState(false);
  useEffect(() => {
    const el = racine.current;
    if (!el || mouvementReduit()) return;
    let attente = 0;
    let essais = 0;
    // Pendant le film du bouton du hero (sa chute jusqu'à l'ordinateur, puis la plongée dans l'écran), on attend qu'il
    // soit fini : décoder les images lui ferait sauter des images. Au plus vingt secondes.
    const lancer = () => {
      if (document.documentElement.dataset.film && essais++ < 50) attente = window.setTimeout(lancer, 400);
      else setCharger(true);
    };
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        lancer();
      },
      { rootMargin: "150% 0px" },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      window.clearTimeout(attente);
    };
  }, []);

  return (
    <Scene id="livre" nuit defilement src="components/sections/scene-livre.tsx" aria-labelledby="livre-titre" className="chrono-sur-ciel">
      <div ref={racine} data-piste className="chrono-piste motion-reduce:min-h-0!" style={{ minHeight: `${(1 + R.ecrans) * 100}svh` }}>
        <div className="chrono-colle">
          <div className="chrono-lumiere" aria-hidden="true" />
          {/* sans film (mouvement réduit, ou sans JavaScript) : la montre finie, la dernière image de la séquence */}
          <div className="chrono-montre">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/montre/film/mobile/179.webp" alt="" className="chrono-montre-photo" />
          </div>
          {charger && (
            <div className="chrono-photo" data-prete={prete || undefined}>
              <MontreFilm onPret={() => setPrete(true)} />
            </div>
          )}
          <div className="chrono-texte sur-ciel">
            {/* le pourtour du cadran déroulé : soixante minutes, que le curseur parcourt */}
            <div className="chrono-reglette" aria-hidden="true">
              <div className="chrono-reglette-or" />
              <span className="chrono-reglette-curseur" />
            </div>
            <Etapes />
          </div>
        </div>
        <Mecanique scene={racine} />
      </div>
    </Scene>
  );
}
