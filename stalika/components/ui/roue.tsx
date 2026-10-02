"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Roue : des cartes posées sur un cylindre couché, qui tourne seul.

   Demande de J (2026-10-01), d'après la pile verticale « vertical-image-stack »
   de 21st : une roue qui tourne seule et que le visiteur peut attraper.
   Rejouée ici sans le code d'origine, avec deux autres idées de 21st : la vraie
   géométrie d'un cylindre (« Cylinder Carousel ») et l'inertie qui se pose
   sur un élément (« Wheel Carousel »).

   Le mouvement :
   · seule, la roue avance d'une carte toutes les `periode` secondes, avec un
     cran : elle s'attarde sur la carte de face en dérivant à peine, puis
     bascule vers la suivante (`power2.inOut`), sans jamais s'arrêter net ;
   · on l'attrape (souris ou doigt) : elle suit le geste au pixel près, une
     carte par hauteur de carte ;
   · on la lâche : elle file selon la vitesse du geste (`inertie`), puis se
     pose sur la carte la plus proche de son point d'arrivée, en `power3.out`,
     dont la vitesse de départ est celle du geste : aucun à-coup au lâcher ;
   · elle reprend seule après `reprise` secondes.

   Elle s'arrête au survol (pour regarder), au focus clavier, sur le bouton
   pause (critère WCAG 2.2.2), et quand elle sort de l'écran. Mouvement réduit :
   elle ne tourne plus seule, ses vidéos ne jouent pas ; elle se manipule
   toujours au geste, au clavier et par les points.

   Un vrai cylindre, pas des plaques : chaque carte est un pan courbe, découpé
   en `bandes` bandes horizontales (de petits canevas, peints par la carte) que
   la CSS pose une à une sur le cylindre. La carte de face est légèrement
   bombée, haut et bas fuyant vers l'arrière ; les autres, plus inclinées,
   s'enroulent derrière. Le rayon vient de la hauteur de la carte et de l'arc
   qu'elle couvre : déroulée, une carte garde sa hauteur.

   La lumière vient d'en haut, et se joue bande par bande : une bande qui
   descend sous la face s'assombrit, un reflet passe sur le cylindre à un angle
   fixe. La carte (`rendu`) n'a qu'à poser ses bandes : tout élément portant
   `data-bande` (et `data-alpha`, son angle sur la carte) est ombré d'ici, avec
   un enfant `data-ombre` et un enfant `data-reflet`.

   Tout est piloté par l'horloge de GSAP (comme Lenis) : le panneau de
   développement peut l'avancer à la main quand il est masqué.

   Les cartes ne sont pas des liens, mais on fait défiler le site dans la carte
   de face, jusqu'à son pied de page :
   · au doigt (téléphone, tablette), directement : glisser sur la carte de face
     fait défiler le site ; glisser au-dessus ou en dessous fait tourner la roue ;
   · à la souris, après un clic sur la carte de face (`visitable`) : sans ce
     clic, la molette ferait défiler la carte au lieu de la page à chaque
     passage du curseur.
   Pendant qu'on lit, la roue attend `repriseLecture` secondes avant de repartir.

   Toutes les cartes tiennent sur la face visible du cylindre : l'écart entre
   deux cartes est un demi-tour divisé par leur nombre.
--------------------------------------------------------------------------- */

export type EtatCarte = {
  /** De face : c'est la carte qu'on regarde. */
  devant: boolean;
  /** De face ou voisine directe : ses médias peuvent jouer. */
  proche: boolean;
  /** Passée derrière la roue, presque de tranche : on peut la remettre à zéro. */
  loin: boolean;
  /** La roue est à l'écran. */
  enVue: boolean;
  /** Ouverte en visite, à la souris. */
  visite: boolean;
  /** Son contenu défile : en visite, ou de face sur un écran tactile. */
  defilable: boolean;
};

/** La géométrie du cylindre, que la carte reprend pour poser ses bandes. */
export type CourbeCarte = {
  /** Nombre de bandes par carte. */
  bandes: number;
  /** Arc couvert par une carte, en degrés. */
  arc: number;
  /** Chevauchement de deux bandes voisines, en pixels. */
  recouvrement: number;
};

export type ActionsCarte = {
  /** Referme la visite. */
  sortir: () => void;
  /** On lit la carte : la roue attend avant de repartir. */
  retenir: () => void;
  /** La géométrie du cylindre. */
  courbe: CourbeCarte;
};

export type RoueProps = {
  /** Une carte par élément : le titre et le sous-titre de sa légende. */
  legendes: { titre: string; sous: string }[];
  /** Le contenu d'une carte, selon son état. */
  rendu: (index: number, etat: EtatCarte, actions: ActionsCarte) => ReactNode;
  /** Nom du carrousel, lu par les lecteurs d'écran. */
  label: string;
  /** Un clic sur la carte de face l'ouvre en visite (ordinateur seulement). */
  visitable?: boolean;
  className?: string;
};

type Mode = "entree" | "auto" | "glisse" | "lance" | "repos";

const { roue: R0 } = MOUVEMENT.film;
const RAD = Math.PI / 180;

/** L'écart à la carte i, ramené dans [−n/2, n/2[. */
function ecartA(i: number, pos: number, n: number) {
  const d = (((i - pos) % n) + n) % n;
  return d >= n / 2 ? d - n : d;
}

/** La position seule dans une période : l'attente sur la carte de face, qui
    dérive à peine, puis la bascule vers la suivante. Vitesse continue d'un
    bout à l'autre : la bascule part et arrive à la vitesse de la dérive. */
const courbeBascule = gsap.parseEase(R0.bascule);
function cran(tau: number) {
  const u = tau < R0.attente ? 0 : (tau - R0.attente) / (1 - R0.attente);
  return R0.derive * tau + (1 - R0.derive) * courbeBascule(u);
}
/** Sa vitesse, en cartes par seconde. */
function vitesseCran(tau: number) {
  const e = 0.002;
  return (cran(Math.min(1, tau + e)) - cran(Math.max(0, tau - e))) / (2 * e) / R0.periode;
}

/** Les seuils d'état d'une carte, à `d` cartes de la face et `phi` degrés. */
const DEVANT = 0.12;
const PROCHE = 1.3;
const LOIN = 80;

type Bande = { alpha: number; ombre: HTMLElement | null; reflet: HTMLElement | null; o: number; r: number };

export function Roue({ legendes, rendu, label, visitable = false, className }: RoueProps) {
  const n = legendes.length;
  const ecart = 180 / n;
  // Une carte couvre l'écart moins le jour : 57° pour trois cartes. Déroulée, elle
  // garde sa hauteur `h` : le rayon du cylindre vaut donc `h` / (l'arc en radians).
  const arc = ecart * (1 - R0.jour);
  const rayonK = 1 / (arc * RAD);
  const courbe: CourbeCarte = { bandes: R0.bandes, arc, recouvrement: R0.recouvrement };
  const scene = useScene();
  const racine = useRef<HTMLDivElement>(null);
  const scenePlan = useRef<HTMLDivElement>(null);
  const cartes = useRef<(HTMLDivElement | null)[]>([]);
  /** Les bandes de chaque carte, lues une fois dans le DOM. */
  const bandes = useRef<(Bande[] | null)[]>([]);
  const etiquettes = useRef<(HTMLDivElement | null)[]>([]);
  const sousTitres = useRef<(HTMLSpanElement | null)[]>([]);

  const [courant, setCourant] = useState(0);
  const [etats, setEtats] = useState<EtatCarte[]>(() =>
    legendes.map((_, i) => ({
      devant: i === 0,
      proche: Math.abs(ecartA(i, 0, n)) < PROCHE,
      loin: false,
      enVue: false,
      visite: false,
      defilable: false,
    })),
  );
  const [pause, setPause] = useState(false);
  // Mouvement réduit : la roue ne tourne jamais seule, le bouton pause n'a rien à arrêter.
  const [reduit, setReduit] = useState(false);
  const [visite, setVisite] = useState<number | null>(null);
  const [annonce, setAnnonce] = useState("");

  // L'état vivant de la roue : lu et écrit à chaque image, hors de React.
  const m = useRef({
    pos: 0,
    mode: "auto" as Mode,
    base: 0,
    phase: 0,
    tween: null as gsap.core.Tween | null,
    // le geste
    pointeur: -1,
    departY: 0,
    departPos: 0,
    carteTouchee: -1,
    glisse: false,
    histo: [] as { t: number; p: number }[],
    // ce qui suspend la rotation seule
    survol: false,
    focus: false,
    pause: false,
    visite: -1,
    contact: false,
    reduit: false,
    enVue: false,
    repriseA: 0,
    // la géométrie, mesurée
    h: 0,
    rayon: 0,
    perspective: 0,
    parCarte: 1,
    bureau: false,
    tactile: false,
    // pour ne prévenir React que d'un vrai changement
    cle: "",
    courant: 0,
  });

  const suspendue = () => {
    const s = m.current;
    return s.survol || s.focus || s.pause || s.visite >= 0 || s.contact || s.reduit || !s.enVue;
  };

  /** Les bandes d'une carte (éléments `data-bande`), lues dans le DOM la première fois. */
  const lireBandes = (i: number): Bande[] => {
    const cache = bandes.current[i];
    if (cache && cache.length) return cache;
    const carte = cartes.current[i];
    if (!carte) return [];
    const lues = [...carte.querySelectorAll<HTMLElement>("[data-bande]")].map((el) => ({
      alpha: Number(el.dataset.alpha),
      ombre: el.querySelector<HTMLElement>("[data-ombre]"),
      reflet: el.querySelector<HTMLElement>("[data-reflet]"),
      o: -1,
      r: -1,
    }));
    bandes.current[i] = lues;
    return lues;
  };

  /* --- Poser les cartes à la position courante ---------------------------- */
  const poser = () => {
    const s = m.current;
    const { rayon: r, perspective: p } = s;
    if (!r) return;
    const l = R0.lumiere * RAD;
    const { max: refletMax, centre: refletCentre, largeur: refletLargeur } = R0.reflet;
    for (let i = 0; i < n; i++) {
      const carte = cartes.current[i];
      if (!carte) continue;
      const d = ecartA(i, s.pos, n);
      const phi = d * ecart;
      const a = phi * RAD;
      // Une carte est cachée quand toutes ses bandes ont passé l'horizon du cylindre.
      const visible = Math.abs(phi) < 90 + arc / 2 + 2;
      carte.style.visibility = visible ? "visible" : "hidden";
      if (!visible) continue;
      const echelle = s.visite === i ? R0.visite : 1;
      carte.style.transform = `translateZ(${-r}px) rotateX(${-phi}deg) translateZ(${r}px) scale(${echelle})`;

      // La lumière vient d'en haut, à `lumiere` degrés. Chaque bande a son angle
      // sur le cylindre : une bande qui descend s'en détourne et s'assombrit, et un
      // reflet passe à un angle fixe. Seule une vraie différence est écrite.
      const enRetrait = s.visite >= 0 && s.visite !== i ? 0.35 : 0;
      for (const b of lireBandes(i)) {
        const A = (phi + b.alpha) * RAD;
        const ombre = Math.max(0, Math.cos(l) - Math.cos(A + l)) * R0.ombre + Math.max(0, 1 - Math.cos(A)) * 0.25 + enRetrait;
        const o = Math.min(0.92, ombre);
        if (b.ombre && Math.abs(o - b.o) > 0.004) {
          b.o = o;
          b.ombre.style.opacity = o.toFixed(3);
        }
        const k = (phi + b.alpha - refletCentre) / refletLargeur;
        const rf = refletMax * Math.exp(-k * k);
        if (b.reflet && Math.abs(rf - b.r) > 0.004) {
          b.r = rf;
          b.reflet.style.opacity = rf.toFixed(3);
        }
      }

      // La légende suit sa carte sur un arc, à la hauteur de son centre vu.
      const et = etiquettes.current[i];
      if (et && s.bureau) {
        const recul = r * (1 - Math.cos(a));
        const vu = p / (p + recul);
        const y = r * Math.sin(a) * vu;
        const x = -recul * 0.55 * vu;
        const face = Math.max(0, Math.cos(a));
        et.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(phi * 0.4).toFixed(2)}deg)`;
        et.style.opacity = String(Math.pow(face, 8).toFixed(3));
        const st = sousTitres.current[i];
        if (st) st.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 3).toFixed(3));
      }
    }

    // Prévenir React seulement quand une carte change d'état.
    // Pendant l'entrée, aucune carte n'est de face : la roue ne s'est pas
    // encore posée (et, avant l'entrée, elle attend sur une position qui
    // équivaut à la première carte).
    const posee = s.mode !== "entree";
    const etatsNeufs = legendes.map((_, i): EtatCarte => {
      const d = Math.abs(ecartA(i, s.pos, n));
      const devant = posee && d < DEVANT;
      return {
        devant,
        proche: d < PROCHE,
        loin: d * ecart > LOIN,
        enVue: s.enVue,
        visite: s.visite === i,
        defilable: s.visite === i || (s.tactile && devant),
      };
    });
    const cle = etatsNeufs.map((e) => `${+e.devant}${+e.proche}${+e.loin}${+e.enVue}${+e.visite}${+e.defilable}`).join("");
    if (cle !== s.cle) {
      s.cle = cle;
      setEtats(etatsNeufs);
    }
    const c = ((Math.round(s.pos) % n) + n) % n;
    if (c !== s.courant) {
      s.courant = c;
      setCourant(c);
    }
  };

  /* --- Aller vers une carte, en tenant compte de la vitesse de départ ----- */
  const allerVers = (cible: number, vitesse = 0, onFini?: () => void) => {
    const s = m.current;
    s.tween?.kill();
    const delta = cible - s.pos;
    if (Math.abs(delta) < 0.001) {
      s.pos = cible;
      s.mode = "repos";
      poser();
      onFini?.();
      return;
    }
    // power3.out part à 3 × distance / durée : on cale la durée sur la vitesse
    // du geste quand elle va dans le bon sens, sinon sur la distance.
    const memeSens = vitesse * delta > 0 && Math.abs(vitesse) > 0.25;
    const duree = memeSens
      ? gsap.utils.clamp(0.4, 1.6, (3 * Math.abs(delta)) / Math.abs(vitesse))
      : gsap.utils.clamp(0.45, 1.1, 0.5 + 0.22 * Math.abs(delta));
    s.mode = "lance";
    s.tween = gsap.to(s, {
      pos: cible,
      duration: s.reduit ? Math.min(duree, 0.35) : duree,
      ease: "power3.out",
      onUpdate: poser,
      onComplete: () => {
        s.tween = null;
        s.mode = "repos";
        onFini?.();
      },
    });
  };

  /** La rotation seule est suspendue en pleine bascule : on finit le geste. */
  const finirBascule = () => {
    const s = m.current;
    // Pendant l'attente, on reste sur la carte ; en pleine bascule, on va au bout.
    const cible = s.phase < R0.attente + 0.02 ? s.base : s.base + 1;
    allerVers(cible, vitesseCran(s.phase));
  };

  /* --- L'horloge ----------------------------------------------------------- */
  useEffect(() => {
    const s = m.current;
    s.reduit = mouvementReduit();
    setReduit(s.reduit);

    const tic = (_t: number, delta: number) => {
      const dt = Math.min(delta, 64) / 1000;
      if (s.mode === "auto") {
        if (suspendue()) {
          finirBascule();
        } else {
          s.phase += dt / R0.periode;
          while (s.phase >= 1) {
            s.phase -= 1;
            s.base += 1;
          }
          s.pos = s.base + cran(s.phase);
          poser();
        }
      } else if (s.mode === "repos") {
        if (!suspendue() && gsap.ticker.time >= s.repriseA) {
          s.base = Math.round(s.pos);
          s.phase = 0;
          s.mode = "auto";
        }
      }
    };
    gsap.ticker.add(tic);
    return () => {
      gsap.ticker.remove(tic);
      s.tween?.kill();
    };
    // L'horloge ne dépend que de refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- La géométrie : mesurée, puis tenue à jour -------------------------- */
  useLayoutEffect(() => {
    const s = m.current;
    const premiere = cartes.current[0];
    const plan = scenePlan.current;
    if (!premiere || !plan) return;
    const requete = window.matchMedia("(min-width: 768px)");
    // Un écran tactile : la carte de face défile au doigt, sans clic préalable.
    const doigt = window.matchMedia("(pointer: coarse)");
    const mesurer = () => {
      const h = premiere.offsetHeight;
      s.h = h;
      s.rayon = h * rayonK;
      s.perspective = h * R0.perspective;
      s.parCarte = s.rayon * ecart * RAD;
      s.bureau = requete.matches;
      s.tactile = doigt.matches;
      plan.style.perspective = `${s.perspective}px`;
      poser();
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(premiere);
    requete.addEventListener("change", mesurer);
    doigt.addEventListener("change", mesurer);
    return () => {
      ro.disconnect();
      requete.removeEventListener("change", mesurer);
      doigt.removeEventListener("change", mesurer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- À l'écran ou non ---------------------------------------------------- */
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        m.current.enVue = e.isIntersecting;
        poser();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- L'entrée : la roue arrive lancée et se pose sur la première carte -- */
  useLayoutEffect(() => {
    const s = m.current;
    const plan = scenePlan.current;
    if (!plan || mouvementReduit()) return;
    const { cartes: elan, duree } = R0.entree;
    s.mode = "entree";
    s.pos = -elan;
    plan.style.opacity = "0";
    poser();
    const proxy = { v: 0 };
    const avancer = () => {
      if (s.mode !== "entree") return;
      s.pos = -elan * (1 - proxy.v);
      plan.style.opacity = String(Math.min(1, proxy.v * 3.5));
      poser();
    };
    const finir = () => {
      plan.style.opacity = "1";
      if (s.mode !== "entree") return;
      s.pos = 0;
      s.base = 0;
      s.phase = 0;
      s.mode = "auto";
      poser();
    };
    if (scene) {
      return scene.inscrire((tl) => {
        tl.to(proxy, { v: 1, duration: duree, ease: "power4.out", onUpdate: avancer, onComplete: finir }, 0);
      });
    }
    // Hors d'une scène : l'entrée part quand la roue arrive à l'écran.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(proxy, { v: 1, duration: 2.4, ease: "power4.out", onUpdate: avancer, onComplete: finir });
    });
    if (racine.current) io.observe(racine.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Le geste ------------------------------------------------------------ */
  const sortirDeVisite = () => {
    const s = m.current;
    if (s.visite < 0) return;
    s.visite = -1;
    s.repriseA = gsap.ticker.time + R0.repriseSurvol;
    setVisite(null);
    poser();
  };

  /** On lit une carte : la roue s'arrête, et attend avant de repartir. */
  const retenir = () => {
    const s = m.current;
    s.repriseA = Math.max(s.repriseA, gsap.ticker.time + R0.repriseLecture);
    if (s.mode === "auto") finirBascule();
  };

  const auDebut = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const carte = (e.target as HTMLElement).closest<HTMLElement>("[data-roue-carte]");
    const indexCarte = carte ? Number(carte.dataset.index) : -1;
    // Dans la carte qu'on visite, le geste appartient au site.
    if (s.visite >= 0 && indexCarte === s.visite) return;
    // Au doigt, sur la carte de face : le geste fait défiler le site dans la
    // carte (défilement natif), la roue ne bouge pas.
    if (e.pointerType !== "mouse" && s.tactile && indexCarte >= 0 && Math.abs(ecartA(indexCarte, s.pos, n)) < DEVANT) {
      s.contact = true;
      retenir();
      return;
    }
    sortirDeVisite();
    s.tween?.kill();
    s.tween = null;
    if (s.mode === "entree") scenePlan.current?.style.setProperty("opacity", "1");
    s.pointeur = e.pointerId;
    s.departY = e.clientY;
    s.departPos = s.pos;
    // La carte touchée se lit ici : une fois le pointeur capturé, le lâcher
    // vise le plan entier et non plus la carte.
    s.carteTouchee = indexCarte;
    s.glisse = false;
    s.histo = [{ t: performance.now(), p: s.pos }];
    s.mode = "glisse";
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const auMouvement = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (s.pointeur !== e.pointerId || s.mode !== "glisse") return;
    const dy = e.clientY - s.departY;
    if (!s.glisse && Math.abs(dy) > 5) s.glisse = true;
    s.pos = s.departPos - dy / s.parCarte;
    const t = performance.now();
    s.histo.push({ t, p: s.pos });
    while (s.histo.length > 2 && t - s.histo[0].t > 100) s.histo.shift();
    poser();
  };

  const aLaFin = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    // Le doigt quitte la carte de face qu'il faisait défiler.
    if (s.contact) {
      s.contact = false;
      retenir();
    }
    if (s.pointeur !== e.pointerId) return;
    s.pointeur = -1;
    const premier = s.histo[0];
    const dernier = s.histo[s.histo.length - 1];
    const dt = (dernier.t - premier.t) / 1000;
    const vitesse = dt > 0.012 && performance.now() - dernier.t < 90 ? (dernier.p - premier.p) / dt : 0;
    s.repriseA = gsap.ticker.time + R0.reprise;

    // Un clic sans glisser : sur la carte de face, la visite (ordinateur) ;
    // sur une voisine, elle vient de face.
    if (!s.glisse) {
      const i = s.carteTouchee;
      if (i >= 0) {
        const d = ecartA(i, s.pos, n);
        if (Math.abs(d) >= 0.3) {
          allerVers(Math.round(s.pos + d));
          setAnnonce(`${i + 1} sur ${n} : ${legendes[i].titre}`);
          return;
        }
        if (visitable && e.pointerType === "mouse" && s.bureau) {
          allerVers(Math.round(s.pos), 0, () => {
            s.visite = i;
            setVisite(i);
            poser();
          });
          return;
        }
      }
    }
    const elan = s.pos + vitesse * R0.inertie;
    const cible = Math.round(gsap.utils.clamp(s.pos - R0.lancerMax, s.pos + R0.lancerMax, elan));
    allerVers(cible, vitesse);
  };

  const aller = (pas: number) => {
    const s = m.current;
    sortirDeVisite();
    s.repriseA = gsap.ticker.time + R0.reprise;
    allerVers(Math.round(s.pos) + pas);
  };

  const allerA = (i: number) => {
    const s = m.current;
    sortirDeVisite();
    s.repriseA = gsap.ticker.time + R0.reprise;
    const depuis = Math.round(s.pos);
    allerVers(depuis + Math.round(ecartA(i, depuis, n)));
    setAnnonce(`${i + 1} sur ${n} : ${legendes[i].titre}`);
  };

  const auClavier = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const s = m.current;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      aller(1);
      setAnnonce(`${((s.courant + 1) % n) + 1} sur ${n} : ${legendes[(s.courant + 1) % n].titre}`);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      aller(-1);
      setAnnonce(`${((s.courant - 1 + n) % n) + 1} sur ${n} : ${legendes[(s.courant - 1 + n) % n].titre}`);
    } else if ((e.key === "Enter" || e.key === " ") && visitable && s.bureau) {
      e.preventDefault();
      if (s.visite >= 0) sortirDeVisite();
      else {
        s.visite = s.courant;
        setVisite(s.courant);
        poser();
      }
    } else if (e.key === "Escape") {
      sortirDeVisite();
    }
  };

  // Échap, ou un clic ailleurs dans la page, referme la visite.
  useEffect(() => {
    if (visite === null) return;
    const touche = (e: KeyboardEvent) => e.key === "Escape" && sortirDeVisite();
    const clic = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(`[data-roue-carte][data-index="${visite}"]`)) sortirDeVisite();
    };
    window.addEventListener("keydown", touche);
    window.addEventListener("pointerdown", clic);
    return () => {
      window.removeEventListener("keydown", touche);
      window.removeEventListener("pointerdown", clic);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visite]);

  const basculerPause = () => {
    const s = m.current;
    s.pause = !s.pause;
    s.repriseA = gsap.ticker.time;
    setPause(s.pause);
  };

  // Rendu serveur (et sans JavaScript) : la roue posée sur la première carte.
  // Les longueurs viennent du CSS ; l'horloge prend le relais au montage.
  // `--roue-r` : le rayon du cylindre, que reprennent aussi les bandes de chaque carte.
  const rayonCss = "var(--roue-r)";
  const transformInitiale = (i: number) => {
    const phi = ecartA(i, 0, n) * ecart;
    return `translateZ(calc(${rayonCss} * -1)) rotateX(${-phi}deg) translateZ(${rayonCss})`;
  };

  return (
    <div
      ref={racine}
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      data-src="components/ui/roue.tsx"
      className={cn("roue relative flex flex-col", className)}
      style={{ "--roue-r": `calc(var(--roue-h) * ${rayonK.toFixed(4)})` } as CSSProperties}
    >
      <div
        className="relative min-h-0 flex-1"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") m.current.survol = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          m.current.survol = false;
          m.current.repriseA = Math.max(m.current.repriseA, gsap.ticker.time + R0.repriseSurvol);
        }}
      >
        {/* La roue se perd dans le ciel en haut et en bas. Le masque ne porte que
            sur elle : posé sur les légendes, il couperait ce qui déborde. */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]">
          <div
            ref={scenePlan}
            tabIndex={0}
            onKeyDown={auClavier}
            onFocus={() => (m.current.focus = true)}
            onBlur={() => {
              m.current.focus = false;
              m.current.repriseA = gsap.ticker.time + R0.repriseSurvol;
            }}
            onPointerDown={auDebut}
            onPointerMove={auMouvement}
            onPointerUp={aLaFin}
            onPointerCancel={aLaFin}
            role="group"
            aria-label="La roue : flèches haut et bas pour la faire tourner"
            className="absolute inset-y-0 left-[var(--roue-x,50%)] w-[var(--roue-l)] -translate-x-1/2 cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:[&>div]:outline-2 focus-visible:[&>div]:outline-offset-8 focus-visible:[&>div]:outline-ring"
            style={{ perspective: `calc(var(--roue-h) * ${R0.perspective})` } as CSSProperties}
          >
            <div className="absolute inset-0 [transform-style:preserve-3d]">
              {legendes.map((legende, i) => (
                <div
                  key={legende.titre}
                  ref={(el) => {
                    cartes.current[i] = el;
                  }}
                  data-roue-carte=""
                  data-index={i}
                  role="group"
                  aria-roledescription="diapositive"
                  aria-label={`${i + 1} sur ${n} : ${legende.titre}, ${legende.sous}`}
                  aria-hidden={i !== courant}
                  // Rien ici ne doit aplatir la 3D (overflow, opacité, filtre, masque) : la carte
                  // est faite de bandes posées sur le cylindre. Elles se cachent d'elles-mêmes
                  // (`backface-visibility`) une fois passées derrière.
                  className="absolute left-0 top-1/2 h-[var(--roue-h)] w-full -translate-y-1/2 [transform-style:preserve-3d] will-change-transform"
                  style={{ transform: transformInitiale(i) }}
                >
                  {rendu(i, etats[i], { sortir: sortirDeVisite, retenir, courbe })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ordinateur : les noms suivent leur carte sur un arc, à droite de la roue. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[calc(var(--roue-x,50%)+var(--roue-l)/2+1.75rem)] hidden w-56 [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] md:block">
          {legendes.map((legende, i) => (
            <div
              key={legende.titre}
              ref={(el) => {
                etiquettes.current[i] = el;
              }}
              className="absolute left-0 top-1/2 w-max max-w-56 origin-left -translate-y-1/2 opacity-0"
            >
              <span className="flex items-center gap-2.5">
                <span className={cn("size-1.5 rounded-full transition-colors duration-300", i === courant ? "bg-accent" : "bg-foreground/25")} />
                <span className={cn("text-lg font-semibold tracking-tight transition-colors duration-300 lg:text-xl", i === courant ? "text-foreground" : "text-foreground/45")}>
                  {legende.titre}
                </span>
              </span>
              <span
                ref={(el) => {
                  sousTitres.current[i] = el;
                }}
                className="mt-1 block pl-4 text-xs font-medium uppercase leading-snug tracking-[0.14em] text-balance text-muted-foreground"
              >
                {legende.sous}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Téléphone : le nom de la carte de face, sous la roue. */}
      <p aria-hidden="true" className="mt-2 min-h-[2.6em] px-1 text-center md:hidden">
        <span key={courant} className="block animate-[roue-legende_0.45s_var(--ease-out)_both]">
          <span className="block text-[0.8125rem] font-semibold leading-tight text-foreground">{legendes[courant].titre}</span>
          <span className="mt-0.5 block text-[0.625rem] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground">
            {legendes[courant].sous}
          </span>
        </span>
      </p>

      {/* Les commandes : pause, et un point par carte. */}
      <div className="relative left-[calc(var(--roue-x,50%)-50%)] mt-2 flex items-center justify-center gap-3 md:mt-4">
        {!reduit && (
          <button
            type="button"
            onClick={basculerPause}
            aria-label={pause ? "Relancer la roue" : "Mettre la roue en pause"}
            className="grid size-8 place-items-center rounded-full text-muted-foreground ring-1 ring-foreground/15 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {pause ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
          </button>
        )}
        <div className="flex items-center gap-1.5">
          {legendes.map((legende, i) => (
            <button
              key={legende.titre}
              type="button"
              onClick={() => allerA(i)}
              aria-label={`Voir ${legende.titre}`}
              aria-current={i === courant ? "true" : undefined}
              className="group grid h-8 place-items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-500 ease-[var(--ease-out)]",
                  i === courant ? "w-5 bg-accent" : "w-1.5 bg-foreground/30 group-hover:bg-foreground/60",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {annonce}
      </p>
    </div>
  );
}
