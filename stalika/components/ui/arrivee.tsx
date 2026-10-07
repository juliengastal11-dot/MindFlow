"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/components/ui/scene";
import { gsap } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Arrivee : un bloc qui arrive en montant, à la position `de` de la
   chronologie de la scène (0 = le début, 1 = la fin). Il est masqué par la
   feuille de style (`data-film-cache`) jusqu'à ce que la scène ait construit
   sa chronologie. Sorti de `scene-modele.tsx` le 2026-10-07 pour servir aussi
   « Livré » (`scene-livre.tsx`).
--------------------------------------------------------------------------- */

export function Arrivee({ de, className, children }: { de: number; className?: string; children: React.ReactNode }) {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!scene || !el) return;
    const desinscrire = scene.inscrire((tl) => {
      gsap.set(el, { autoAlpha: 0, y: 16 });
      tl.to(el, { autoAlpha: 1, y: 0, duration: 0.13, ease: "power2.out" }, de);
    });
    // Remonté ou déplacé (surtout au rechargement à chaud), le bloc laisse la scène refaire sa
    // chronologie : sans cela, l'ancienne animation resterait accrochée à l'ancien élément.
    return () => {
      desinscrire();
      scene.rebatir();
    };
  }, [scene, de]);

  return (
    <div ref={ref} data-film-cache className={className}>
      {children}
    </div>
  );
}
