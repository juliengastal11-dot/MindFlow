"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone } from "lucide-react";
import { gsap, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   FondPoints : un fond en points, dont le motif s'efface vers les bords
   (masque elliptique), posé derrière le contenu d'une section. Extrait collé
   par J le 2026-10-07 pour la section 04.

   La copie exacte est dans l'historique git (« copie exacte de son extrait »).
   Depuis, deux retouches :
   - les couleurs sont celles du thème, que le garde-fou exige (le fond est
     `background`, les points sont de l'`encre`, un peu plus visibles et un
     peu plus gros que dans l'extrait, à la demande de J) ;
   - les points bougent un peu (J, 2026-10-07 : « qu'il suive les mouvements
     du téléphone »). Le masque reste en place ; c'est le motif qui glisse en
     dessous, et comme il se répète tous les `PAS` px et dépasse de ce pas de
     chaque côté, il peut glisser sans jamais montrer un bord.

   Qui le fait bouger :
   - un téléphone : son inclinaison (`deviceorientation`). Les points glissent du
     côté où l'on penche le téléphone ; la position de repos suit le téléphone
     en quatre secondes environ, donc ce sont surtout les mouvements qui
     comptent, pas la façon dont on le tient ;
   - un ordinateur : la souris (moins loin, et sans capteur à demander) ;
   - rien du tout avec « réduire les animations » : le motif reste immobile.

   iPhone : Apple ne donne les capteurs de mouvement qu'après une autorisation
   demandée par un appui. Plutôt que d'ouvrir la fenêtre d'Apple de force à
   chaque visite, un petit bouton « Faire bouger le fond » la demande, et
   seulement là où les mesures n'arrivent pas d'elles-mêmes : iPhone et iPad
   (et pas après une autorisation déjà donnée dans la session de Safari). Sur
   Android, les capteurs répondent sans rien demander : pas de bouton. Les
   capteurs ne marchent que sur une page en https (ou localhost).

   Pour l'essayer sans téléphone : les outils de développement de Chrome, en
   mode appareil mobile (le pointeur devient « tactile »), puis le panneau
   Capteurs, réglage Orientation.
--------------------------------------------------------------------------- */

/** Le pas des points, en px. Le motif dépasse de ce pas de chaque côté. */
const PAS = 16;
/** Un point : sa couleur (l'encre du thème, en transparence) et son rayon. */
const POINTS = "radial-gradient(color-mix(in oklab, var(--color-encre) 30%, transparent) 1.25px, transparent 1.25px)";
/** Le décalage le plus grand, en px (jamais plus que `PAS`), selon ce qui fait bouger les points. */
const DECALAGE_INCLINAISON = 14;
const DECALAGE_SOURIS = 10;
/** L'inclinaison, en degrés par rapport à la position de repos, qui donne le décalage le plus grand. */
const DEGRES = 22;
/** La vitesse à laquelle la position de repos rejoint le téléphone, par mesure (à 60 mesures par seconde : ~4 s). */
const REPOS = 0.004;

type Mode = "aucun" | "souris" | "inclinaison" | "sonde" | "a-autoriser";
type CapteurIOS = { requestPermission?: () => Promise<"granted" | "denied"> };

const demandeIOS = () => (typeof DeviceOrientationEvent === "undefined" ? undefined : (DeviceOrientationEvent as unknown as CapteurIOS).requestPermission);

/** L'écart d'inclinaison (gamma : à gauche ou à droite, bêta : devant ou derrière), rapporté aux axes de l'écran. */
function surLEcran(dg: number, db: number): [number, number] {
  const angle = (((screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0) % 360) + 360) % 360;
  if (angle === 90) return [db, -dg];
  if (angle === 180) return [-dg, -db];
  if (angle === 270) return [-db, dg];
  return [dg, db];
}

const entre = (v: number, max: number) => Math.max(-1, Math.min(1, v / max));

export function FondPoints() {
  const zone = useRef<HTMLDivElement>(null);
  const motif = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("aucun");

  // Ce que l'appareil sait faire : on le lit après le montage, le serveur ne le connaît pas.
  useEffect(() => {
    if (mouvementReduit()) return;
    const tactile = window.matchMedia("(pointer: coarse)").matches;
    const souris = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (tactile && typeof DeviceOrientationEvent !== "undefined") setMode(demandeIOS() ? "sonde" : "inclinaison");
    else if (souris) setMode("souris");
  }, []);

  // Un appareil qui connaît `requestPermission` : on écoute un instant. Si des mesures arrivent d'elles-mêmes
  // (Chrome sur Android connaît la fonction mais répond d'office ; Safari, après une autorisation donnée plus
  // tôt dans la session), le bouton est inutile. Sinon, il apparaît.
  useEffect(() => {
    if (mode !== "sonde") return;
    const sonde = (e: DeviceOrientationEvent) => {
      if (e.beta != null && e.gamma != null) setMode("inclinaison");
    };
    window.addEventListener("deviceorientation", sonde);
    const delai = window.setTimeout(() => setMode("a-autoriser"), 800);
    return () => {
      window.removeEventListener("deviceorientation", sonde);
      window.clearTimeout(delai);
    };
  }, [mode]);

  // Le mouvement : seulement tant que la section est à l'écran.
  useEffect(() => {
    const el = motif.current;
    const racine = zone.current;
    if (!el || !racine || (mode !== "souris" && mode !== "inclinaison")) return;

    const qx = gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" });

    let repos: { g: number; b: number } | null = null;
    const surInclinaison = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      repos ??= { g: e.gamma, b: e.beta };
      repos.g += (e.gamma - repos.g) * REPOS;
      repos.b += (e.beta - repos.b) * REPOS;
      const [dx, dy] = surLEcran(e.gamma - repos.g, e.beta - repos.b);
      qx(entre(dx, DEGRES) * DECALAGE_INCLINAISON);
      qy(entre(dy, DEGRES) * DECALAGE_INCLINAISON);
    };
    const surSouris = (e: PointerEvent) => {
      qx((e.clientX / window.innerWidth - 0.5) * 2 * DECALAGE_SOURIS);
      qy((e.clientY / window.innerHeight - 0.5) * 2 * DECALAGE_SOURIS);
    };

    const ecouter = (oui: boolean) => {
      if (mode === "inclinaison") {
        if (oui) window.addEventListener("deviceorientation", surInclinaison);
        else window.removeEventListener("deviceorientation", surInclinaison);
      } else if (oui) window.addEventListener("pointermove", surSouris, { passive: true });
      else window.removeEventListener("pointermove", surSouris);
    };
    const veille = new IntersectionObserver(([e]) => ecouter(e.isIntersecting));
    veille.observe(racine);

    return () => {
      veille.disconnect();
      ecouter(false);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [mode]);

  const demander = async () => {
    try {
      const reponse = await demandeIOS()?.();
      setMode(reponse === "granted" ? "inclinaison" : "aucun");
    } catch {
      setMode("aucun");
    }
  };

  return (
    <>
      <div ref={zone} aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full bg-background">
          <div className="absolute h-full w-full overflow-hidden [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
            <div ref={motif} className="absolute will-change-transform" style={{ inset: -PAS, backgroundImage: POINTS, backgroundSize: `${PAS}px ${PAS}px` }} />
          </div>
        </div>
      </div>
      {mode === "a-autoriser" && (
        <button
          type="button"
          onClick={demander}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Smartphone aria-hidden="true" className="size-3.5" />
          Faire bouger le fond
        </button>
      )}
    </>
  );
}
