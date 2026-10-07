"use client";

import { useEffect, useRef } from "react";
import { Jost } from "next/font/google";
import { Check, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScene } from "@/components/ui/scene";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   La fenêtre de « La relecture » (scène 4, refaite le 2026-10-07 à la demande
   de J) : le vrai site d'AR Transfert, le chauffeur VTC de Béziers, dans une
   fenêtre de navigateur, et la barre d'édition du client, simplifiée aux
   couleurs de Stalika.

   Le film (il suit le défilement, voir `Scene` et `MOUVEMENT.relecture`) :
   A. le client passe la barre en « Édition », coche « Changement immédiat »,
      clique le paragraphe, sélectionne sa dernière ligne et la réécrit sur
      la page ; Julien, qui regarde, a son propre curseur ;
   B. puis il retire l'animation des phares (« Garder » ou « Retirer »), et
      épingle un commentaire sur la photo : Julien répond, la photo
      s'éclaircit. Les trois retouches se cochent dans la liste à côté
      (`scene-relecture.tsx`) ; le tampon « Appliqué · publié » clôt.

   La page n'est pas un site refait : c'est une capture du site en ligne
   (`outils/relecture/`, voir son LISEZMOI ; le paragraphe d'introduction en
   est retiré), posée sur un dessin à la taille de
   la capture, que le CSS met à l'échelle de la fenêtre (unités `cqw`, aucune
   mesure en JavaScript). Seul le paragraphe est du vrai texte, en Jost
   comme sur le site, pour qu'on puisse le réécrire lettre à lettre. Deux
   mises en page, comme le site : celle d'un ordinateur (1024 px de large) quand
   la place est large, ou assez large et pas plus haute que large ; celle d'un
   téléphone (390 px, recadrée) sinon. La fenêtre prend la place qui lui reste
   dans l'écran, hauteur comprise (`.rel-place` et `.rel-fenetre`, app/globals.css) :
   jamais plus haute que la zone collée, qu'elle recouvrait sur un écran large mais
   court, comme le panneau de navigateur de J (le 2026-10-07).

   Tout ce qui est de l'outil (barre, curseurs, étiquettes, bulles) garde sa
   taille réelle : seul le dessin de la page est mis à l'échelle. Les points
   où le curseur va sont mesurés dans la page au moment de construire le film,
   et remesurés à chaque rafraîchissement (`invalidateOnRefresh`, dans `Scene`).

   Mouvement réduit : l'état final (la ligne réécrite, la photo plus claire,
   le tampon). Rien de la fenêtre n'est lu par un lecteur d'écran, hormis sa
   description : la scène l'explique en texte, à côté.
--------------------------------------------------------------------------- */

/* Jost, la police du site d'AR Transfert, servie par le site (next/font) : le paragraphe réécrit
   doit avoir la même allure que le reste de la capture. */
const jost = Jost({ subsets: ["latin"], weight: "400", display: "swap" });

type Rect = { x: number; y: number; l: number; h: number };
type Mise = {
  id: "bureau" | "mobile";
  image: string;
  /** La taille du dessin de la page, en pixels de la capture. */
  l: number;
  h: number;
  /** Le paragraphe d'introduction : sa boîte, la taille du texte et l'interligne. */
  texte: Rect & { taille: number; interligne: number };
  /** La voiture : le centre de chaque phare, et le cadre qui les entoure. */
  phares: { g: [number, number]; d: [number, number]; cadre: Rect; popover: "dessus" | "dessous"; eclat: number };
  /** Où le client épingle son commentaire, et de quel côté la bulle s'ouvre. */
  photo: { x: number; y: number; cote: "droite" | "gauche"; bulle: number };
  /** La part de l'image qui s'éclaircit (la voiture). */
  masque: string;
};

/* Mesures du 2026-10-07, prises sur le site en ligne : ordinateur à 1024 px de large (le plus étroit
   qui garde la mise en page à deux colonnes), téléphone à 390 px, recadré sur la voiture, le titre
   et le paragraphe (de 140 à 700 px depuis le haut de la page, pour laisser de la place à la barre sous le texte). */
const MISES: Record<Mise["id"], Mise> = {
  bureau: {
    id: "bureau",
    image: "/relecture/ar-bureau.webp",
    l: 1024,
    h: 700,
    texte: { x: 41, y: 378.2, l: 367.2, h: 112.3, taille: 18, interligne: 28.08 },
    phares: { g: [493.9, 387.7], d: [919.2, 387.7], cadre: { x: 428, y: 336, l: 556, h: 108 }, popover: "dessus", eclat: 190 },
    photo: { x: 600, y: 468, cote: "droite", bulle: 188 },
    masque: "linear-gradient(90deg, transparent 36%, var(--color-foreground) 54%)",
  },
  mobile: {
    id: "mobile",
    image: "/relecture/ar-mobile.webp",
    l: 390,
    h: 560,
    texte: { x: 20, y: 383.1, l: 350, h: 112.3, taille: 18, interligne: 28.08 },
    phares: { g: [60.4, 64.1], d: [329.5, 64.1], cadre: { x: 18, y: 26, l: 354, h: 76 }, popover: "dessous", eclat: 120 },
    photo: { x: 118, y: 128, cote: "droite", bulle: 156 },
    masque: "linear-gradient(180deg, var(--color-foreground) 30%, transparent 40%)",
  },
};

/** Le texte du paragraphe, ligne par ligne comme sur le site (`text-wrap: pretty`) : les retours sont posés ici, pas laissés au navigateur. */
const LIGNES = [
  "VTC et transport privé pour particuliers et",
  "professionnels. Transferts aéroport et gares,",
  "longues distances, mariages, séminaires",
];
const ANCIEN = "et soirées.";
const NOUVEAU = "et événements d'entreprise.";
const COMMENTAIRE = "Une photo plus claire ?";
const REPONSE = "Bien sûr, c'est fait.";

const pc = (v: number, total: number) => `${(v / total) * 100}%`;
const boite = (r: Rect, m: Mise, marge = 0) => ({
  left: pc(r.x - marge, m.l),
  top: pc(r.y - marge, m.h),
  width: pc(r.l + 2 * marge, m.l),
  height: pc(r.h + 2 * marge, m.h),
});

/* Le contour d'un élément retouché : pointillé quand le curseur le survole, plein quand on le saisit. */
function Contour({ nom }: { nom: string }) {
  return (
    <>
      <span aria-hidden="true" data-film-cache data-transitoire data-pointille={nom} className="absolute inset-0 rounded-md border-[1.5px] border-dashed border-accent opacity-0" />
      <span aria-hidden="true" data-film-cache data-transitoire data-plein={nom} className="absolute inset-0 rounded-md border-[1.5px] border-accent bg-accent/[0.06] opacity-0" />
    </>
  );
}

/* L'étiquette collée au haut d'un contour, comme celles d'un outil de retouche. */
function Etiquette({ nom, children, ok = false }: { nom: string; children: React.ReactNode; ok?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-film-cache
      data-transitoire
      data-etiquette={nom}
      className={cn(
        "absolute bottom-full left-0 flex items-center gap-1 whitespace-nowrap rounded-t-md px-1.5 py-[3px] text-[11px] font-medium leading-none opacity-0",
        ok ? "bg-foreground text-background" : "bg-accent text-on-accent",
      )}
    >
      {ok && <Check className="size-2.5" strokeWidth={3} />}
      {children}
    </span>
  );
}

/* La page d'AR Transfert, à l'échelle de la fenêtre : la capture, le paragraphe en vrai texte, et tout ce que
   le client touche dessus (contours, phares qui clignotent, épingle). */
function Page({ mise }: { mise: Mise }) {
  const { l, h, texte, phares, photo } = mise;
  const cadre = phares.cadre;
  return (
    <div className={cn("relative", mise.id === "bureau" ? "rel-page-bureau" : "rel-page-mobile")} style={{ aspectRatio: `${l} / ${h}` }}>
      <div className="@container absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ ["--u" as string]: `calc(100cqw / ${l})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mise.image} alt="" decoding="async" className="absolute inset-0 size-full" />
          {/* La même image, plus claire, que la retouche de la photo fait apparaître sur la voiture. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mise.image}
            alt=""
            decoding="async"
            data-film-cache
            data-eclairee
            className="absolute inset-0 size-full opacity-0"
            style={{ filter: "brightness(1.55) contrast(1.06)", WebkitMaskImage: mise.masque, maskImage: mise.masque }}
          />

          {/* Les phares : l'appel de phares du site, qui clignote tant que le client n'a pas dit de le retirer. */}
          {[phares.g, phares.d].map(([x, y], i) => (
            <span key={i} aria-hidden="true" className="rel-phare" style={{ left: pc(x, l), top: pc(y, h), width: `calc(${phares.eclat} * var(--u))`, height: `calc(${phares.eclat * 0.45} * var(--u))` }} />
          ))}

          {/* Le paragraphe d'introduction, réécrit en vrai texte. */}
          <p
            data-ancre="paragraphe"
            className={cn(jost.className, "absolute m-0")}
            style={{
              ...boite(texte, mise),
              width: `min(34ch, ${pc(texte.l, l)})`,
              height: "auto",
              fontSize: `calc(${texte.taille} * var(--u))`,
              lineHeight: `calc(${texte.interligne} * var(--u))`,
              letterSpacing: "-0.005em",
              color: "rgba(255, 255, 255, 0.72)",
            }}
          >
            {LIGNES.map((ligne) => (
              <span key={ligne} className="block whitespace-nowrap">
                {ligne}
              </span>
            ))}
            {/* La dernière ligne : l'ancien texte et le nouveau se superposent dans la même case. */}
            <span className="block whitespace-nowrap">
              <span className="relative inline-grid align-top">
                <span data-ancre="ancien" data-ancien className="col-start-1 row-start-1">
                  {ANCIEN}
                </span>
                <span
                  aria-hidden="true"
                  data-film-cache
                  data-selection
                  className="pointer-events-none col-start-1 row-start-1 -mx-[2px] origin-left rounded-[3px] bg-accent/40 opacity-0"
                />
                <span data-nouveau className="col-start-1 row-start-1" style={{ color: "rgba(255, 255, 255, 0.96)" }}>
                  <span data-frappe />
                  <span aria-hidden="true" data-film-cache data-caret className="frappe-curseur text-accent" style={{ ["--film-curseur" as string]: "0.53s" }} />
                </span>
              </span>
            </span>
          </p>

          {/* Le contour du paragraphe. */}
          <div className="pointer-events-none absolute" style={boite(texte, mise, 9)}>
            <Contour nom="texte" />
            <Etiquette nom="texte">Texte</Etiquette>
            <Etiquette nom="texte-ok" ok>
              Appliqué
            </Etiquette>
          </div>

          {/* L'animation des phares : le contour, l'étiquette, et le choix « Garder » ou « Retirer ». */}
          <div data-ancre="phares" className="pointer-events-none absolute" style={boite(cadre, mise)}>
            <Contour nom="phares" />
            <Etiquette nom="phares">Animation</Etiquette>
            <Etiquette nom="phares-ok" ok>
              Retirée
            </Etiquette>
            <div
              aria-hidden="true"
              data-film-cache
              data-transitoire
              data-popover
              className={cn(
                "absolute left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-background px-2.5 py-2 text-[12px] opacity-0 shadow-lg ring-1 ring-foreground/15",
                phares.popover === "dessus" ? "bottom-[calc(100%+14px)]" : "top-[calc(100%+10px)]",
              )}
            >
              <span className="text-muted-foreground">Appels de phares</span>
              <span className="rounded-full px-2.5 py-1 font-medium text-foreground ring-1 ring-foreground/25">Garder</span>
              <span data-ancre="retirer" data-btn-retirer className="rounded-full bg-accent px-2.5 py-1 font-medium text-on-accent">
                Retirer
              </span>
            </div>
          </div>

          {/* La photo : l'épingle du commentaire, la question du client, la réponse de Julien. */}
          <i data-ancre="photo" aria-hidden="true" className="absolute size-0" style={{ left: pc(photo.x, l), top: pc(photo.y, h) }} />
          <div aria-hidden="true" data-film-cache data-transitoire data-epingle className="pointer-events-none absolute size-0" style={{ left: pc(photo.x, l), top: pc(photo.y, h) }}>
            <span className="absolute bottom-0 left-0 grid size-[22px] -translate-x-1/2 -translate-y-1 place-items-center rounded-full rounded-bl-none bg-accent text-[11px] font-semibold leading-none text-on-accent shadow-lg [rotate:-45deg]">
              <span className="[rotate:45deg]">1</span>
            </span>
            <div
              style={{ width: photo.bulle }}
              className={cn("absolute bottom-[10px] flex flex-col gap-1.5", photo.cote === "droite" ? "left-[18px]" : "right-[18px] items-end")}
            >
              <span data-film-cache data-bulle-client className="block w-full rounded-xl bg-background px-2.5 py-1.5 text-[12px] leading-snug shadow-lg ring-1 ring-foreground/15">
                <span className="block text-[10px] font-medium text-muted-foreground">Vous</span>
                <span data-frappe />
                <span aria-hidden="true" data-caret className="frappe-curseur text-accent" style={{ ["--film-curseur" as string]: "0.53s" }} />
              </span>
              <span data-film-cache data-bulle-julien className="block w-full rounded-xl bg-accent px-2.5 py-1.5 text-[12px] leading-snug text-on-accent shadow-lg">
                <span className="block text-[10px] font-medium opacity-70">Julien</span>
                <span data-frappe />
              </span>
            </div>
          </div>
          <div aria-hidden="true" data-film-cache data-transitoire data-ok-photo className="pointer-events-none absolute size-0" style={{ left: pc(photo.x, l), top: pc(photo.y, h) }}>
            <span className="absolute left-3 top-2 flex items-center gap-1 whitespace-nowrap rounded-md bg-foreground px-1.5 py-[3px] text-[11px] font-medium leading-none text-background">
              <Check className="size-2.5" strokeWidth={3} />
              Appliquée
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Un curseur : celui du client (clair), ou celui de Julien (doré, avec son nom). */
function Curseur({ julien = false }: { julien?: boolean }) {
  return (
    <div aria-hidden="true" data-film-cache data-transitoire {...(julien ? { "data-julien": "" } : { "data-curseur": "" })} className="pointer-events-none absolute left-0 top-0 z-30 opacity-0">
      <svg viewBox="0 0 16 22" className={cn("-ml-px -mt-px h-[22px] w-4 drop-shadow-md", julien ? "fill-accent stroke-background" : "fill-foreground stroke-background")} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M1 1v16l4-3.6 3 6.6 2.6-1.2-3-6.4H13z" />
      </svg>
      {julien && <span className="absolute left-3.5 top-4 whitespace-nowrap rounded-full bg-accent px-2 py-[3px] text-[11px] font-medium leading-none text-on-accent shadow-md">Julien</span>}
    </div>
  );
}

/* La barre d'édition du client : Navigation ou Édition, et « Changement immédiat ». Simplifiée aux couleurs de Stalika. */
function Barre() {
  return (
    <div
      aria-hidden="true"
      data-barre
      className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex w-max max-w-[calc(100%-12px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-background/90 py-1.5 pl-2 pr-3 text-[12px] shadow-lg ring-1 ring-foreground/15 backdrop-blur-sm @xl:gap-2.5 @xl:pl-2.5"
    >
      <span className="hidden grid-cols-2 gap-[2.5px] @xl:grid">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="size-[3px] rounded-full bg-foreground/35" />
        ))}
      </span>
      <span className="relative grid grid-cols-2 rounded-full bg-foreground/10 p-[3px]">
        <span data-pilule className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-accent" />
        <span data-seg="navigation" className="rel-seg relative z-10 px-2.5 py-[5px] text-center font-medium leading-none @xl:px-3">
          Navigation
        </span>
        <span data-seg="edition" data-ancre="edition" className="rel-seg relative z-10 px-2.5 py-[5px] text-center font-medium leading-none @xl:px-3">
          Édition
        </span>
      </span>
      <span className="h-4 w-px bg-foreground/15" />
      <span className="flex items-center gap-1.5 text-foreground/90">
        <span data-ancre="immediat" className="relative grid size-3.5 place-items-center rounded-[4px] ring-1 ring-foreground/40">
          <span data-coche className="absolute inset-0 grid place-items-center rounded-[4px] bg-accent text-on-accent opacity-0">
            <Check className="size-2.5" strokeWidth={3.5} />
          </span>
        </span>
        <span className="@min-[336px]:hidden">Immédiat</span>
        <span className="hidden @min-[336px]:inline">Changement immédiat</span>
      </span>
    </div>
  );
}

/** `pied` : ce qui se pose sous la fenêtre et sa légende (la liste des retouches, sur un écran étroit). */
export function FenetreRelecture({ pied }: { pied?: React.ReactNode }) {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const racine = ref.current;
    if (!racine || !scene) return;
    const section = racine.closest<HTMLElement>("[data-scene]") ?? racine;
    const surface = racine.querySelector<HTMLElement>("[data-surface]");
    const un = <T extends HTMLElement>(s: string) => racine.querySelector<T>(s);
    const tous = (s: string) => Array.from(racine.querySelectorAll<HTMLElement>(s));
    const curseur = un("[data-curseur]");
    const julien = un("[data-julien]");
    const pilule = un("[data-pilule]");
    const coche = un("[data-coche]");
    const tampon = un("[data-tampon]");
    const legende = un("[data-legende]");
    if (!surface || !curseur || !julien || !pilule || !coche || !tampon || !legende) return;

    /* Où est un élément de la page, en pixels dans la surface (le calque des curseurs). Les deux mises en page
       existent dans le document ; seule la visible compte. `fx` et `fy` : la part de la boîte (0,5 : le centre). */
    const pt = (nom: string, dx = 0, dy = 0, fx = 0.5, fy = 0.5) => {
      const e = tous(`[data-ancre="${nom}"]`).find((n) => n.offsetParent !== null);
      if (!e) return { x: 0, y: 0 };
      const r = e.getBoundingClientRect();
      const s = surface.getBoundingClientRect();
      return { x: r.left - s.left + r.width * fx + dx, y: r.top - s.top + r.height * fy + dy };
    };

    const rangs = Array.from(section.querySelectorAll<HTMLElement>("[data-rang]"));
    const T = (u: number) => u / 100;

    const desinscrire = scene.inscrire((tl) => {
      const eC = (sel: string) => tous(sel);
      const ancien = eC("[data-ancien]");
      const selection = eC("[data-selection]");
      const nouveauBloc = eC("[data-nouveau]");
      const nouveau = eC("[data-nouveau] > [data-frappe]");
      const carets = eC("[data-nouveau] > [data-caret]");
      const pointille = (n: string) => eC(`[data-pointille="${n}"]`);
      const plein = (n: string) => eC(`[data-plein="${n}"]`);
      const etiquette = (n: string) => eC(`[data-etiquette="${n}"]`);
      const popover = eC("[data-popover]");
      const retirer = eC("[data-btn-retirer]");
      const epingle = eC("[data-epingle]");
      const bulleClient = eC("[data-bulle-client]");
      const bulleJulien = eC("[data-bulle-julien]");
      const saisieClient = eC("[data-bulle-client] > [data-frappe]");
      const caretClient = eC("[data-bulle-client] > [data-caret]");
      const saisieJulien = eC("[data-bulle-julien] > [data-frappe]");
      const okPhoto = eC("[data-ok-photo]");
      const eclairee = eC("[data-eclairee]");

      /* ---- L'état de départ ---- */
      tl.set(curseur, { x: () => surface.clientWidth + 28, y: () => surface.clientHeight * 0.46, autoAlpha: 0 }, 0);
      tl.set(julien, { x: () => surface.clientWidth * 0.78, y: -26, autoAlpha: 0 }, 0);
      gsap.set([...pointille("texte"), ...plein("texte"), ...pointille("phares"), ...plein("phares")], { autoAlpha: 0 });
      gsap.set([...etiquette("texte"), ...etiquette("texte-ok"), ...etiquette("phares"), ...etiquette("phares-ok")], { autoAlpha: 0 });
      gsap.set([...popover, ...bulleClient, ...bulleJulien, ...okPhoto, ...selection, ...eclairee, ...carets, ...caretClient], { autoAlpha: 0 });
      gsap.set(selection, { scaleX: 0 });
      gsap.set(epingle, { autoAlpha: 0, scale: 0, y: -16 });
      gsap.set(coche, { autoAlpha: 0, scale: 0.4 });
      gsap.set(tampon, { autoAlpha: 0, scale: 1.5 });
      gsap.set(legende, { autoAlpha: 0 });
      gsap.set(pilule, { xPercent: 0 });
      gsap.set(rangs.flatMap((r) => Array.from(r.querySelectorAll<HTMLElement>("[data-rang-plein]"))), { autoAlpha: 0, scale: 0.4 });
      gsap.set(rangs.flatMap((r) => Array.from(r.querySelectorAll<HTMLElement>("[data-rang-label]"))), { opacity: 0.55 });

      /* ---- Les gestes ---- */
      const vers = (c: HTMLElement, nom: string, de: number, a: number, dx = 0, dy = 0, fx = 0.5, fy = 0.5) =>
        tl.to(c, { x: () => pt(nom, dx, dy, fx, fy).x, y: () => pt(nom, dx, dy, fx, fy).y, duration: T(a - de), ease: "power2.inOut" }, T(de));
      const apparait = (c: HTMLElement | HTMLElement[], de: number, d = 1.2) => tl.to(c, { autoAlpha: 1, duration: T(d), ease: "power1.out" }, T(de));
      const disparait = (c: HTMLElement | HTMLElement[], de: number, d = 1.2) => tl.to(c, { autoAlpha: 0, duration: T(d), ease: "power1.in" }, T(de));
      const clic = (c: HTMLElement, u: number) => {
        tl.to(c, { scale: 0.78, duration: T(0.7), ease: "power1.out", transformOrigin: "1px 1px" }, T(u));
        tl.to(c, { scale: 1, duration: T(0.9), ease: "power2.out" }, T(u + 0.7));
      };
      const taper = (cibles: HTMLElement[], texte: string, de: number, a: number) => {
        const etat = { n: 0 };
        const rendre = () => {
          const t = texte.slice(0, Math.round(etat.n));
          for (const c of cibles) c.textContent = t;
        };
        tl.to(etat, { n: texte.length, duration: T(a - de), ease: "none", onUpdate: rendre }, T(de));
      };
      const cocher = (i: number, u: number) => {
        const r = rangs.filter((n) => n.dataset.rang === String(i));
        tl.to(r.flatMap((n) => Array.from(n.querySelectorAll<HTMLElement>("[data-rang-plein]"))), { autoAlpha: 1, scale: 1, duration: T(1.6), ease: "back.out(2.4)" }, T(u));
        tl.to(r.flatMap((n) => Array.from(n.querySelectorAll<HTMLElement>("[data-rang-label]"))), { opacity: 1, duration: T(1.6) }, T(u));
      };

      // A · 3 à 14 : le client entre, passe la barre en Édition.
      apparait(curseur, 3, 1.5);
      vers(curseur, "edition", 3, 10);
      clic(curseur, 10.4);
      tl.to(pilule, { xPercent: 100, duration: T(2.4), ease: "power2.inOut" }, T(10.8));

      // A · 14 à 19 : il coche « Changement immédiat ».
      vers(curseur, "immediat", 13.5, 17.5);
      clic(curseur, 17.8);
      tl.to(coche, { autoAlpha: 1, scale: 1, duration: T(1.4), ease: "back.out(3)" }, T(18.2));

      // A · 19 à 28 : il survole le paragraphe (contour en pointillé), le saisit (contour plein).
      vers(curseur, "paragraphe", 19.5, 24.5, 0, 0, 0.62, 0.5);
      apparait([...pointille("texte"), ...etiquette("texte")], 23.5, 1.2);
      clic(curseur, 25);
      tl.to(pointille("texte"), { autoAlpha: 0, duration: T(0.8) }, T(25.2));
      apparait(plein("texte"), 25.2, 0.8);

      // A · 26 à 31 : il sélectionne « et soirées. » (le curseur le parcourt, la sélection le suit).
      vers(curseur, "ancien", 26, 28, 0, 3, 0, 0.5);
      vers(curseur, "ancien", 28, 31, 0, 3, 1, 0.5);
      tl.to(selection, { autoAlpha: 1, duration: T(0.4) }, T(28));
      tl.to(selection, { scaleX: 1, duration: T(3), ease: "power1.inOut" }, T(28));

      // A · 31 à 42 : il écrit à la place ; Julien, qui regarde, arrive près du paragraphe.
      tl.to([...ancien, ...selection], { autoAlpha: 0, duration: T(0.8) }, T(31.6));
      tl.to(carets, { autoAlpha: 1, duration: T(0.2) }, T(31.6));
      taper(nouveau, NOUVEAU, 32, 41.5);
      tl.to(carets, { autoAlpha: 0, duration: T(0.4) }, T(43));
      // Une fois appliquée, la ligne prend la couleur du reste du paragraphe : le site ne la met pas en avant.
      tl.to(nouveauBloc, { color: "rgba(255, 255, 255, 0.72)", duration: T(2.4), ease: "power1.inOut" }, T(44));
      vers(curseur, "paragraphe", 32.5, 37, 60, 58, 1, 1);
      apparait(julien, 33, 1.5);
      vers(julien, "paragraphe", 33, 39, 0, 0, 0.84, 0.28);

      // A · 43 à 49 : c'est appliqué ; la première retouche se coche.
      tl.to([...plein("texte"), ...etiquette("texte")], { autoAlpha: 0, duration: T(1.2) }, T(43.2));
      apparait(etiquette("texte-ok"), 43.4, 1);
      cocher(0, 44.4);
      disparait(etiquette("texte-ok"), 49, 1.2);

      // B · 49 à 59 : l'animation des phares (elle clignote, le client l'ôte).
      vers(curseur, "phares", 46.5, 51.5, -40, 6);
      vers(julien, "phares", 47, 53, 0, -16, 0.8, 0);
      apparait([...pointille("phares"), ...etiquette("phares")], 51, 1.2);
      apparait(popover, 53, 1.4);
      vers(curseur, "retirer", 53.2, 56.4);
      clic(curseur, 56.7);
      tl.to(retirer, { scale: 0.92, duration: T(0.7), ease: "power1.out" }, T(56.7));
      tl.to(retirer, { scale: 1, duration: T(0.8) }, T(57.4));
      tl.to(pointille("phares"), { autoAlpha: 0, duration: T(0.8) }, T(57.6));
      disparait(popover, 57.8, 1.2);
      disparait(etiquette("phares"), 57.8, 1);
      apparait(etiquette("phares-ok"), 58.4, 1);
      cocher(1, 59.2);
      disparait(etiquette("phares-ok"), 63.5, 1.2);

      // B · 62 à 80 : la photo (l'épingle, le commentaire, la réponse de Julien).
      vers(curseur, "photo", 61, 66);
      clic(curseur, 66.4);
      tl.to(epingle, { autoAlpha: 1, scale: 1, y: 0, duration: T(2), ease: "back.out(2.6)" }, T(67));
      apparait(bulleClient, 68.4, 1.4);
      tl.to(caretClient, { autoAlpha: 1, duration: T(0.2) }, T(69));
      taper(saisieClient, COMMENTAIRE, 69, 75.5);
      tl.to(caretClient, { autoAlpha: 0, duration: T(0.4) }, T(76.4));
      vers(curseur, "photo", 69.5, 73, 120, 70);
      vers(julien, "photo", 72, 77, 24, 16);
      apparait(bulleJulien, 76.8, 1.4);
      taper(saisieJulien, REPONSE, 77.4, 80.6);

      // B · 81 à 90 : la photo s'éclaircit ; la troisième retouche se coche.
      tl.to(eclairee, { autoAlpha: 1, duration: T(5.5), ease: "power1.inOut" }, T(81.4));
      disparait([...bulleClient, ...bulleJulien], 88.5, 1.6);
      apparait(okPhoto, 88.6, 1);
      cocher(2, 88.8);
      disparait(okPhoto, 92.4, 1.2);

      // Fin : le tampon, la légende ; les curseurs s'effacent.
      tl.to(curseur, { x: () => surface.clientWidth * 0.5, y: () => surface.clientHeight * 0.5, autoAlpha: 0, duration: T(2.6), ease: "power2.in" }, T(90.6));
      disparait(julien, 91.6, 1.6);
      tl.to(tampon, { autoAlpha: 1, scale: 1, duration: T(1.6), ease: "back.out(2.2)" }, T(93));
      apparait(legende, 94.4, 2);
    });

    /* Ce qui bascule à un seuil plutôt que de se tweener : le mode de la barre et les phares qui clignotent. */
    const delSeuils = scene.surProgres((p) => {
      racine.dataset.mode = p >= T(11.8) ? "edition" : "navigation";
      racine.dataset.phares = p < T(47) ? "attente" : p < T(57.8) ? "clignote" : "fixe";
    });

    return () => {
      desinscrire();
      delSeuils();
    };
  }, [scene]);

  return (
    <div
      ref={ref}
      data-mode="navigation"
      data-phares="attente"
      role="img"
      aria-label="Exemple de relecture sur le site d'AR Transfert, chauffeur VTC à Béziers : le client passe en mode Édition, réécrit un texte, retire une animation et commente une photo ; Julien répond, applique et publie."
      className="rel-place relative flex min-h-0 flex-1 items-center justify-center"
    >
      <div className="rel-fenetre">
      <Card className="relative overflow-hidden">
        <div className="flex items-center gap-1.5 border-b px-3.5 py-2.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="mx-auto flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-0.5 text-[11px] text-muted-foreground">
            <Lock className="size-2.5" />
            ar-transfert-apercu.vercel.app
          </span>
          <span className="w-[42px]" />
        </div>
        <div data-surface className="relative bg-background">
          <Page mise={MISES.bureau} />
          <Page mise={MISES.mobile} />
          <Barre />
          <Curseur />
          <Curseur julien />
          <span
            aria-hidden="true"
            data-film-cache
            data-transitoire
            data-tampon
            className="eyebrow pointer-events-none absolute right-4 top-[16%] z-20 -rotate-6 rounded-md border-2 border-accent bg-background/70 px-2 py-1 text-accent backdrop-blur-sm"
          >
            Appliqué · publié
          </span>
        </div>
      </Card>
      <p data-legende data-film-cache className="mt-3 text-sm text-muted-foreground">
        C&apos;est comme ça qu&apos;AR Transfert a relu son site.
      </p>
      {pied}
      </div>
    </div>
  );
}
