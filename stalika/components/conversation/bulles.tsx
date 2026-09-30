"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Un simple fondu d'opacité à l'arrivée : pas de primitive, pas de GSAP. */
export function Apparait({ children, className }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={cn(
        "transition-opacity duration-300 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** La bulle de Julien : un rond « J » à gauche, la bulle à côté. */
export function BulleJulien({
  children,
  erreur,
  id,
  role,
}: {
  children: React.ReactNode;
  erreur?: boolean;
  id?: string;
  role?: "alert";
}) {
  return (
    <div className="flex items-end gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-on-primary"
      >
        J
      </span>
      <div
        id={id}
        role={role}
        className={cn(
          "max-w-[85%] rounded-card rounded-bl-sm border bg-card px-5 py-4 text-card-foreground",
          erreur ? "border-destructive" : "border-border",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** La réponse de la personne, à droite, telle qu'elle l'a choisie ou tapée. */
export function BulleReponse({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-card rounded-br-sm bg-primary px-5 py-3 text-on-primary">
      {children}
    </div>
  );
}

/**
 * Enveloppe de la question en cours : au montage, défile doucement jusqu'à elle
 * (sauf en mouvement réduit) et donne le focus au premier contrôle.
 */
export function Courante({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "end" });
    el.querySelector<HTMLElement>("input:not([type=hidden]):not(.hidden), button")?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className={cn("flex flex-col gap-4", className)}>
      {children}
    </div>
  );
}
