"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { lienWhatsApp } from "@/lib/site";

/* ---------------------------------------------------------------------------
   Discussion : la fenêtre qui s'ouvre dans l'ordinateur, au bout de la plongée.

   Idée de J : on n'arrive pas sur une page, on arrive dans une conversation
   avec lui. Une fenêtre de Mac (pastilles, titre) qui monte comme une
   « feuille » d'iPhone (`Plongee` s'occupe du mouvement).

   Le déroulé voulu par J :
   1. le premier message du visiteur s'écrit tout seul, puis part ;
   2. la première réponse est toujours la même (prénom, tutoiement, projet) ;
   3. le visiteur répond ; ensuite, l'API Claude prendra la suite (plus tard,
      voir BLUEPRINT.md, « l'assistant de discussion »).

   En attendant le branchement, rien n'est simulé en cachette : après le
   message du visiteur, la fenêtre dit honnêtement que Julien répond lui-même
   et propose un créneau ou WhatsApp. Le créneau choisi part sur WhatsApp,
   pré-rempli : c'est un vrai message à Julien, rien n'est réservé en silence.

   Formes vues sur 21st (fenêtre Safari, tiroir qui monte, conversation
   animée, sélecteur de rendez-vous d'Origin UI envoyé par J) : l'idée
   seulement, rien de leur code. Mouvement réduit : les messages s'affichent
   sans frappe ni attente.
--------------------------------------------------------------------------- */

const PREMIER = "Hey, salut ! J'ai un projet et j'aimerais qu'on en discute.";
const REPONSE = [
  "Salut ! Bien sûr, je t'écoute.",
  "Déjà, comment tu t'appelles ? Et tu préfères qu'on se tutoie ou qu'on se vouvoie ?",
  "Parle-moi de ton projet : décris-moi un peu tout ça.",
] as const;
const RELAIS =
  "Merci, c'est noté ! Pour l'instant je te réponds moi-même : choisis un créneau pour qu'on s'appelle, ou écris-moi directement sur WhatsApp.";

type Message =
  | { id: number; de: "visiteur" | "julien"; texte: string }
  | { id: number; de: "julien"; choix: true }
  | { id: number; de: "julien"; calendrier: true }
  | { id: number; de: "julien"; whatsapp: string; texte: string };

// `Omit` sur une union perd les variantes : on l'applique à chacune.
type Sans<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const JOURS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const CRENEAUX = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"] as const;

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const memeJour = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* ---- Les petits morceaux ------------------------------------------------ */

function Avatar() {
  return (
    <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
      J
    </span>
  );
}

function Points() {
  return (
    <span className="points-frappe flex items-center gap-1 px-1 py-1.5" aria-label="Julien écrit">
      <span />
      <span />
      <span />
    </span>
  );
}

function Bulle({ de, children, className }: { de: "visiteur" | "julien"; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end gap-2", de === "visiteur" ? "justify-end" : "justify-start")}>
      {de === "julien" && <Avatar />}
      <div
        className={cn(
          "bulle-entree max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:text-[0.95rem]",
          de === "visiteur" ? "rounded-br-md bg-primary text-on-primary" : "rounded-bl-md border bg-card text-card-foreground",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Fleche({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn("stroke-current", className)}>
      <path d="M8 13V3M4 7l4-4 4 4" />
    </svg>
  );
}

/* Le calendrier : un mois, lundi en premier ; les jours passés et les
   week-ends ne se choisissent pas. Puis les créneaux du jour choisi. */
function Calendrier({ onChoisir }: { onChoisir: (jour: Date, heure: string) => void }) {
  const [aujourdhui] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [mois, setMois] = useState(() => new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1));
  const [jour, setJour] = useState<Date | null>(null);

  const premier = new Date(mois.getFullYear(), mois.getMonth(), 1);
  const decalage = (premier.getDay() + 6) % 7; // lundi = 0
  const nombre = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
  const cases: (Date | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nombre }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), i + 1)),
  ];
  const libelleMois = mois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const auMoisCourant = mois.getFullYear() === aujourdhui.getFullYear() && mois.getMonth() === aujourdhui.getMonth();
  const maintenant = new Date();

  return (
    <div className="w-full overflow-hidden rounded-card border bg-card text-card-foreground">
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          aria-label="Mois précédent"
          disabled={auMoisCourant}
          onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))}
          className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:cursor-default disabled:opacity-30"
        >
          ‹
        </button>
        <p className="text-sm font-medium first-letter:uppercase">{libelleMois}</p>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))}
          className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 px-3 pb-3 pt-2 text-center text-sm">
        {JOURS.map((j, i) => (
          <span key={i} aria-hidden="true" className="pb-1 text-xs text-muted-foreground">
            {j}
          </span>
        ))}
        {cases.map((d, i) => {
          if (!d) return <span key={`v${i}`} />;
          const passe = d < aujourdhui;
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          const choisi = jour && memeJour(d, jour);
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={passe || weekend}
              aria-pressed={!!choisi}
              aria-label={d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              onClick={() => setJour(d)}
              className={cn(
                "relative mx-auto grid size-9 cursor-pointer place-items-center rounded-lg transition-colors",
                choisi ? "bg-foreground text-background" : "hover:bg-muted",
                passe && "cursor-default text-muted-foreground/60 line-through hover:bg-transparent",
                weekend && !passe && "cursor-default text-muted-foreground/60 hover:bg-transparent",
              )}
            >
              {d.getDate()}
              {memeJour(d, aujourdhui) && (
                <span aria-hidden="true" className={cn("absolute bottom-1 size-1 rounded-full", choisi ? "bg-background" : "bg-foreground")} />
              )}
            </button>
          );
        })}
      </div>
      {jour && (
        <div className="border-t px-3 pb-3 pt-3">
          <p className="mb-2 text-sm font-medium first-letter:uppercase">
            {jour.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-4">
            {CRENEAUX.map((h) => {
              const [hh, mm] = h.split(":").map(Number);
              const debut = new Date(jour);
              debut.setHours(hh, mm, 0, 0);
              const passe = debut <= maintenant;
              return (
                <button
                  key={h}
                  type="button"
                  disabled={passe}
                  onClick={() => onChoisir(jour, h)}
                  className="cursor-pointer rounded-lg border py-2 text-sm tabular-nums transition-colors hover:border-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:border-border"
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- La fenêtre ------------------------------------------------------- */

export function Discussion({ className }: { className?: string }) {
  const fenetre = useRef<HTMLDivElement>(null);
  const fil = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [ecrit, setEcrit] = useState(false); // Julien est en train d'écrire
  const [pret, setPret] = useState(false); // le visiteur peut écrire
  const [envoyes, setEnvoyes] = useState<string[]>([]);
  const compteur = useRef(0);
  const vivant = useRef(true);

  const ajouter = useCallback((m: Sans<Message, "id">) => {
    compteur.current += 1;
    setMessages((l) => [...l, { ...m, id: compteur.current } as Message]);
  }, []);

  // Julien écrit un moment, puis le message arrive.
  const julien = useCallback(
    async (m: Sans<Message, "id" | "de">, reduit: boolean, duree = 1100) => {
      if (!reduit) {
        setEcrit(true);
        await attendre(duree);
        if (!vivant.current) return;
        setEcrit(false);
      }
      ajouter({ de: "julien", ...m } as Sans<Message, "id">);
    },
    [ajouter],
  );

  // Le déroulé d'ouverture, joué une fois quand la fenêtre est à l'écran.
  useEffect(() => {
    vivant.current = true;
    const el = fenetre.current;
    if (!el) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let parti = false;

    const jouer = async () => {
      if (!reduit) {
        await attendre(500);
        for (let i = 1; i <= PREMIER.length && vivant.current; i++) {
          setSaisie(PREMIER.slice(0, i));
          await attendre(PREMIER[i - 1] === " " ? 55 : 38);
        }
        await attendre(450);
        if (!vivant.current) return;
      }
      setSaisie("");
      ajouter({ de: "visiteur", texte: PREMIER });
      if (!reduit) await attendre(500);
      for (const [i, texte] of REPONSE.entries()) {
        if (!vivant.current) return;
        await julien({ texte }, reduit, i === 0 ? 1200 : 1500);
        if (!reduit) await attendre(250);
      }
      if (vivant.current) setPret(true);
    };

    const obs = new IntersectionObserver(
      (entrees) => {
        // Seulement quand la fenêtre est entièrement en place (elle monte encore avant).
        if (parti || !entrees.some((e) => e.intersectionRatio >= 0.97)) return;
        parti = true;
        obs.disconnect();
        void jouer();
      },
      { threshold: [0, 0.97] },
    );
    obs.observe(el);
    return () => {
      vivant.current = false;
      obs.disconnect();
    };
  }, [ajouter, julien]);

  // Le fil descend tout seul vers le dernier message (sans faire défiler la page).
  useEffect(() => {
    const f = fil.current;
    if (f) f.scrollTo({ top: f.scrollHeight, behavior: "smooth" });
  }, [messages, ecrit]);

  const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    const texte = saisie.trim();
    if (!texte || !pret) return;
    setSaisie("");
    ajouter({ de: "visiteur", texte });
    const tous = [...envoyes, texte];
    setEnvoyes(tous);
    // Une seule fois : le relais honnête, puis les deux façons de joindre Julien.
    if (envoyes.length === 0) {
      await julien({ texte: RELAIS }, reduit(), 1400);
      await julien({ choix: true }, reduit(), 500);
    }
  };

  const messageWhatsApp = (extra = "") =>
    ["Bonjour Julien, je viens de votre site Stalika.", extra, envoyes.length ? `Mon projet : ${envoyes.join(" ")}` : ""]
      .filter(Boolean)
      .join("\n");

  const choisirCreneau = async (jour: Date, heure: string) => {
    const quand = `${jour.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${heure.replace(":", "h")}`;
    ajouter({ de: "visiteur", texte: `Le ${quand}, ça me va.` });
    await julien(
      {
        texte: "Parfait ! Envoie-moi ce créneau sur WhatsApp, je te le confirme vite.",
        whatsapp: lienWhatsApp(messageWhatsApp(`Je vous propose un appel le ${quand}.`)),
      },
      reduit(),
      1200,
    );
  };

  return (
    <div
      ref={fenetre}
      id="discussion"
      data-src="components/ui/discussion.tsx"
      aria-labelledby="discussion-titre"
      role="region"
      className={cn(
        "jour flex h-full flex-col overflow-hidden rounded-t-[1.25rem] bg-background text-foreground shadow-carte",
        className,
      )}
    >
      {/* La barre de la fenêtre : poignée de feuille, pastilles, titre. */}
      <div className="relative shrink-0 border-b bg-secondary px-4 pb-2.5 pt-3 sm:px-5">
        <span aria-hidden="true" className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-3 pt-1">
          <span aria-hidden="true" className="flex w-12 gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-primary" />
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          </span>
          <div className="mx-auto flex items-center gap-2">
            <Avatar />
            <div className="leading-tight">
              <h2 id="discussion-titre" className="text-sm font-semibold">
                Julien · Stalika
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {ecrit ? "écrit…" : "répond en général dans la journée"}
              </p>
            </div>
          </div>
          <span className="w-12" />
        </div>
      </div>

      {/* Le fil. */}
      <div ref={fil} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <p className="pb-2 text-center text-xs text-muted-foreground">Aujourd&apos;hui</p>
        {messages.map((m) => {
          if ("choix" in m)
            return (
              <div key={m.id} className="bulle-entree flex flex-wrap gap-2 pl-9">
                <button
                  type="button"
                  onClick={() => julien({ calendrier: true }, reduit(), 400)}
                  className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Choisir un créneau
                </button>
                <a
                  href={lienWhatsApp(messageWhatsApp())}
                  target="_blank"
                  rel="noopener"
                  className="cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground"
                >
                  Écrire sur WhatsApp
                </a>
              </div>
            );
          if ("calendrier" in m)
            return (
              <div key={m.id} className="bulle-entree pl-9 sm:max-w-sm">
                <Calendrier onChoisir={choisirCreneau} />
              </div>
            );
          if ("whatsapp" in m)
            return (
              <div key={m.id} className="space-y-2">
                <Bulle de="julien">{m.texte}</Bulle>
                <div className="bulle-entree pl-9">
                  <a
                    href={m.whatsapp}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Envoyer sur WhatsApp
                  </a>
                </div>
              </div>
            );
          return (
            <Bulle key={m.id} de={m.de}>
              {m.texte}
            </Bulle>
          );
        })}
        {ecrit && (
          <Bulle de="julien" className="py-2">
            <Points />
          </Bulle>
        )}
      </div>

      {/* La zone de saisie. */}
      <form onSubmit={envoyer} className="flex shrink-0 items-center gap-2 border-t bg-background px-3 py-3 sm:px-5">
        <label htmlFor="discussion-saisie" className="sr-only">
          Ton message
        </label>
        <input
          id="discussion-saisie"
          value={saisie}
          onChange={(e) => pret && setSaisie(e.target.value)}
          readOnly={!pret}
          maxLength={600}
          autoComplete="off"
          placeholder={pret ? "Écris ton message…" : ""}
          className="h-11 min-w-0 flex-1 rounded-full border bg-card px-4 text-[16px] outline-none focus-visible:border-foreground"
        />
        <button
          type="submit"
          aria-label="Envoyer"
          disabled={!pret || !saisie.trim()}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-on-primary transition-opacity disabled:cursor-default disabled:opacity-40"
        >
          <Fleche />
        </button>
      </form>
    </div>
  );
}
