import {
  BellRing,
  Check,
  CircleAlert,
  Clock,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Paperclip,
  Receipt,
  ReceiptText,
  Send,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RELANCE } from "@/lib/demos";
import { Avatar, Bouton, Fenetre, Notification, Pastille } from "./interface";

/* ---------------------------------------------------------------------------
   RelancePro, le suivi des devis et des factures : l'interface de la démo.
   Le film est dans `relance-animation.ts`, les textes dans `lib/demos.ts`.

   Trois plans : le tableau de bord, la fiche d'une facture qui glisse
   par-dessus, et la fenêtre du message de relance, au centre.
--------------------------------------------------------------------------- */

const ICONES_NAV = [LayoutDashboard, Receipt, FileText, Users, BellRing];

export function RelancePreview() {
  return (
    <Fenetre
      nom="RelancePro"
      marque={ReceiptText}
      entreprise={RELANCE.entreprise}
      utilisateur={RELANCE.utilisateur}
      nav={RELANCE.nav}
      icones={ICONES_NAV}
      vue={RELANCE.vue}
      suite={RELANCE.facture.numero}
    >
      <Tableau />
      <Fiche />
      <Message />
      <Notification>{RELANCE.notification}</Notification>
    </Fenetre>
  );
}

function Tableau() {
  const d = RELANCE;
  return (
    <div data-d="tableau" className="absolute inset-0 flex flex-col p-3 @lg:p-4">
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3">
        {d.indicateurs.map((k, i) => (
          <div key={k.label} className={cn("rounded-lg px-2.5 py-2 ring-1 ring-inset ring-border/80", i === 2 && "hidden @lg:block")}>
            <p className="truncate text-[10.5px] text-muted-foreground">{k.label}</p>
            <p
              className={cn(
                "mt-0.5 text-[15px] font-semibold tabular-nums tracking-tight",
                k.ton === "retard" && "text-destructive",
                k.ton === "succes" && "text-succes",
              )}
            >
              {k.valeur}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[13px] font-semibold tracking-tight">{d.titreListe}</span>
        <Pastille>{d.aRelancer.length}</Pastille>
      </div>
      <ul className="mt-1.5 flex flex-col">
        {d.aRelancer.map((f) => (
          <li key={f.piece} data-d="facture" className="relative flex items-center gap-2.5 border-b border-border/60 px-1.5 py-2">
            <span
              data-d="facture-survol"
              className="absolute inset-0 rounded-md bg-produit/[0.06] opacity-0 ring-1 ring-inset ring-produit/25"
            />
            <Avatar initiales={f.initiales} className="relative size-6 text-[9.5px]" />
            <span className="relative min-w-0 flex-1">
              <span className="block truncate font-semibold">{f.client}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{f.piece}</span>
            </span>
            <span className="relative flex flex-col items-end gap-1 @lg:flex-row @lg:items-center @lg:gap-3">
              <span className="text-[12.5px] font-medium tabular-nums">{f.montant}</span>
              <Pastille ton={f.ton} className="@lg:w-[7.75rem] @lg:justify-center">
                {f.statut}
              </Pastille>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fiche() {
  const f = RELANCE.facture;
  const h = RELANCE.historique;
  return (
    <div
      data-d="panneau"
      className="absolute inset-y-0 right-0 z-10 w-full overflow-hidden border-l border-border/80 bg-card opacity-0 shadow-panneau @lg:w-[62%]"
    >
      <div data-d="fiche-contenu" className="flex flex-col gap-3 px-3 pb-3 pt-3 @lg:px-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold tracking-tight">{f.numero}</span>
              <span className="grid">
                <Pastille data-d="fiche-retard" ton="retard" icone={CircleAlert} className="col-start-1 row-start-1">
                  {f.retard}
                </Pastille>
                <Pastille data-d="fiche-relancee" ton="succes" icone={Check} className="col-start-1 row-start-1 opacity-0">
                  {f.relancee}
                </Pastille>
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{f.client}</p>
          </div>
          <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-[20px] font-semibold leading-none tabular-nums tracking-tight">{f.montant}</p>
        <p
          data-d="fiche-alerte"
          className="flex items-center gap-2 rounded-md bg-destructive/[0.07] px-2.5 py-1.5 text-[11px] font-medium text-destructive ring-1 ring-inset ring-destructive/15"
        >
          <Clock className="size-3.5 shrink-0" strokeWidth={2} />
          {f.alerte}
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          {f.details.map((x) => (
            <div key={x.label} className="min-w-0">
              <dt className="text-muted-foreground">{x.label}</dt>
              <dd className="truncate font-medium">{x.valeur}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-2">
          <Bouton data-d="fiche-relancer" icone={Send}>
            {f.relancer}
          </Bouton>
          <Bouton variante="contour">{f.payee}</Bouton>
        </div>
        <div className="border-t border-border/70 pt-2.5">
          <p className="text-[11.5px] font-semibold">{h.titre}</p>
          <ol className="mt-1">
            {h.lignes.map((l, i) => (
              <li
                key={l.texte}
                data-d={i === 0 ? "histo-nouvelle" : "histo-ancienne"}
                className="flex items-center gap-2.5 py-[3px] text-[11px]"
              >
                <span
                  data-d={i === 0 ? "histo-point" : undefined}
                  className={cn("size-1.5 shrink-0 rounded-full", i === 0 ? "bg-produit" : "bg-muted-foreground/35")}
                />
                <span className="w-9 shrink-0 tabular-nums text-muted-foreground">{l.date}</span>
                <span className={cn("truncate", i === 0 && "font-medium")}>{l.texte}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Message() {
  const m = RELANCE.message;
  return (
    <>
      <div data-d="voile" className="absolute inset-0 z-20 bg-foreground/25 opacity-0" />
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-3">
        <div data-d="message" className="w-full max-w-[25rem] rounded-xl bg-card opacity-0 shadow-flottant">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
            <span className="text-[12.5px] font-semibold">{m.titre}</span>
            <X className="size-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2 px-3 py-2.5 text-[11.5px]">
            <p className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-muted-foreground">À</span>
              <Avatar initiales="M" className="size-4 text-[7.5px]" />
              <span className="font-medium">{m.a}</span>
            </p>
            <p className="flex gap-2">
              <span className="w-10 shrink-0 text-muted-foreground">Objet</span>
              <span className="truncate">{m.objet}</span>
            </p>
            <div className="space-y-1.5 rounded-md bg-background px-2.5 py-2 leading-relaxed ring-1 ring-inset ring-border/70">
              {m.corps.map((l) => (
                <p key={l}>{l}</p>
              ))}
              <p className="text-muted-foreground">
                {m.signature[0]}
                <br />
                {m.signature[1]}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[10.5px] font-medium">
              <Paperclip className="size-3" />
              {m.piece}
            </span>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/70 px-3 py-2.5">
            <Bouton variante="contour">{m.annuler}</Bouton>
            <Bouton data-d="envoyer" className="min-w-[8.75rem]">
              <span data-d="envoyer-fond" className="absolute inset-0 bg-succes opacity-0" />
              <span data-d="envoyer-label" className="relative flex items-center gap-1.5">
                <Send className="size-3.5" strokeWidth={2} />
                {m.envoyer}
              </span>
              <span data-d="envoyer-attente" className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0">
                <LoaderCircle data-d="envoyer-roue" className="size-3.5" strokeWidth={2.25} />
                {m.envoi}
              </span>
              <span data-d="envoyer-fait" className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0">
                <Check className="size-3.5" strokeWidth={2.5} />
                {m.envoye}
              </span>
            </Bouton>
          </div>
        </div>
      </div>
    </>
  );
}
