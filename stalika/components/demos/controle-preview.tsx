import {
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  History,
  ListChecks,
  Thermometer,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTROLE } from "@/lib/demos";
import { Avatar, Barre, Case, Fenetre, Notification, Pastille } from "./interface";

/* ---------------------------------------------------------------------------
   Contrôle, le logiciel de contrôle opérationnel : l'interface de la démo.
   Le film est dans `controle-animation.ts`, les textes dans `lib/demos.ts`.

   Deux plans : la checklist de fermeture, et la fiche d'incident qui glisse
   par-dessus (photo, commentaire, responsable, historique).

   Son design est le sombre (`.appli-sombre`, app/globals.css) : les blocs se
   détachent d'un cran de surface et d'un filet de lumière sur leur bord haut,
   plutôt que d'une ombre.
--------------------------------------------------------------------------- */

/** Un bloc relevé d'un cran : la surface suivante, et un filet de lumière en haut. */
const RELEVE = "bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]";

const ICONES_NAV = [CalendarCheck, ListChecks, TriangleAlert, Users, History];

export function ControlePreview() {
  return (
    <Fenetre
      nom="Contrôle"
      marque={ClipboardCheck}
      entreprise={CONTROLE.entreprise}
      utilisateur={CONTROLE.utilisateur}
      nav={CONTROLE.nav}
      icones={ICONES_NAV}
      vue={CONTROLE.vue}
      suite={`Incident ${CONTROLE.incident.numero}`}
    >
      <Checklist />
      <Incident />
      <Notification>{CONTROLE.notification}</Notification>
    </Fenetre>
  );
}

function Checklist() {
  const l = CONTROLE.liste;
  const r = l.releve;
  return (
    <div data-d="liste" className="absolute inset-0 flex flex-col p-3 @lg:p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-tight @lg:text-[15px]">{l.titre}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <CalendarClock className="size-3 shrink-0" strokeWidth={1.75} />
            {l.meta}
          </p>
        </div>
        <span className="mt-1 flex shrink-0 items-center gap-2 text-[11px] font-medium tabular-nums">
          <Barre valeur={80} className="w-10 @lg:w-16" />
          {l.avancement}
        </span>
      </div>
      <ul className={cn("mt-3 flex flex-col rounded-lg ring-1 ring-inset ring-border/80", RELEVE)}>
        {l.points.map((p) => (
          <li key={p.label} className="flex items-center gap-2.5 border-b border-border/60 px-2.5 py-[7px]">
            <Case fait />
            <span className="flex-1">{p.label}</span>
            <span className="text-[10.5px] tabular-nums text-muted-foreground">{p.heure}</span>
            <Avatar initiales={p.qui} ton="doux" className="hidden size-4 text-[7px] @lg:grid" />
          </li>
        ))}
        <li data-d="releve" className="relative flex items-center gap-2.5 px-2.5 py-2">
          <span data-d="releve-fond" className="absolute inset-0 rounded-b-lg bg-destructive/[0.06] opacity-0 ring-1 ring-inset ring-destructive/25" />
          <span data-d="releve-actif" className="absolute inset-0 rounded-b-lg opacity-0 ring-1 ring-inset ring-produit/50" />
          <Case className="relative" />
          <span className="relative min-w-0 flex-1">
            <span className="block truncate font-medium">{r.label}</span>
            <span className="mt-0.5 grid text-[10.5px]">
              <span data-d="releve-seuil" className="col-start-1 row-start-1 text-muted-foreground">
                {r.seuil}
              </span>
              <span data-d="releve-hors" className="col-start-1 row-start-1 flex items-center gap-1.5 opacity-0">
                <span className="flex items-center gap-1 font-medium text-destructive">
                  <TriangleAlert className="size-3 shrink-0" strokeWidth={2.25} />
                  <span className="truncate">{r.horsSeuil}</span>
                </span>
                <span
                  data-d="signaler"
                  className="shrink-0 rounded-[5px] bg-destructive px-1.5 py-px text-[10px] font-medium text-on-destructive"
                >
                  {l.signaler}
                </span>
              </span>
            </span>
          </span>
          <span
            data-d="releve-champ"
            className="relative flex h-7 w-[4.5rem] shrink-0 items-center justify-end rounded-md bg-card px-2 text-[12px] tabular-nums ring-1 ring-inset ring-border"
          >
            <span data-d="releve-vide" className="text-muted-foreground">
              {r.vide}
            </span>
            <span data-d="releve-valeur" className="absolute inset-y-0 right-2 flex items-center font-medium">
              {r.chiffres.map((c, i) => (
                <span key={i} data-d="releve-car" className="opacity-0">
                  {c}
                </span>
              ))}
              <span data-d="releve-unite" className="opacity-0">
                {r.unite}
              </span>
            </span>
          </span>
        </li>
      </ul>
    </div>
  );
}

function Incident() {
  const i = CONTROLE.incident;
  const h = CONTROLE.historique;
  return (
    <div
      data-d="panneau"
      className="absolute inset-y-0 right-0 z-10 w-full overflow-hidden border-l border-border/80 bg-card opacity-0 shadow-panneau @lg:w-[64%]"
    >
      <div data-d="incident-contenu" className="flex flex-col gap-2.5 px-3 pb-3 pt-3 @lg:px-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-muted-foreground">{i.titre}</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold tracking-tight">Incident {i.numero}</span>
              <span className="grid">
                <Pastille data-d="incident-ouvert" ton="retard" className="col-start-1 row-start-1">
                  {i.ouvert}
                </Pastille>
                <Pastille data-d="incident-encours" ton="attente" className="col-start-1 row-start-1 opacity-0">
                  {i.enCours}
                </Pastille>
              </span>
            </div>
          </div>
          <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        </div>

        <div className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 ring-1 ring-inset ring-border/80", RELEVE)}>
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
            <Thermometer className="size-3.5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">{i.equipement}</span>
            <span className="block text-[11px] font-medium text-destructive">{i.releve}</span>
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <span data-d="incident-photo" className="relative size-12 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-foreground/10">
            <span data-d="incident-image" className="cliche cliche-frigo absolute inset-0" />
            <span data-d="incident-envoi" className="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full bg-card/80">
              <span data-d="incident-envoi-barre" className="absolute inset-0 origin-left bg-produit" style={{ transform: "scaleX(0)" }} />
            </span>
          </span>
          <div data-d="incident-commentaire" className="min-w-0 flex-1 rounded-lg bg-background px-2.5 py-1.5 ring-1 ring-inset ring-border/70">
            <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <Avatar initiales={i.auteur[0]} ton="doux" className="size-4 text-[7px]" />
              <span className="font-medium text-foreground">{i.auteur}</span>· {i.heure}
            </p>
            <p className="mt-0.5 text-[11.5px]">{i.commentaire}</p>
          </div>
        </div>

        <dl className="grid grid-cols-[5.25rem_1fr] items-center gap-x-2 gap-y-1.5 text-[11px]">
          <dt className="text-muted-foreground">{i.champs[0].label}</dt>
          <dd className="relative">
            <span data-d="incident-select" className="flex h-7 items-center gap-1.5 rounded-md bg-card px-2 ring-1 ring-inset ring-border">
              <span className="grid min-w-0 flex-1">
                <span data-d="incident-choisir" className="col-start-1 row-start-1 text-muted-foreground">
                  {i.choisir}
                </span>
                <span data-d="incident-thomas" className="col-start-1 row-start-1 flex items-center gap-1.5 font-medium opacity-0">
                  <Avatar initiales="T" ton="doux" className="size-4 text-[7px]" />
                  {i.champs[0].valeur}
                </span>
              </span>
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            </span>
            <span data-d="incident-menu" className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col rounded-md bg-card p-1 opacity-0 shadow-flottant">
              {i.equipe.map((p, k) => (
                <span key={p} data-d={k === 0 ? "incident-option" : undefined} className="flex items-center gap-1.5 rounded px-1.5 py-1">
                  <Avatar initiales={p[0]} ton="doux" className="size-4 text-[7px]" />
                  {p}
                </span>
              ))}
            </span>
          </dd>
          <dt className="text-muted-foreground">{i.champs[1].label}</dt>
          <dd className="flex h-7 items-center rounded-md px-2 ring-1 ring-inset ring-border">
            <span data-d="incident-valeur" className="truncate font-medium opacity-0">
              {i.champs[1].valeur}
            </span>
          </dd>
          <dt className="text-muted-foreground">{i.champs[2].label}</dt>
          <dd className="flex h-7 items-center gap-1.5 rounded-md px-2 ring-1 ring-inset ring-border">
            <CalendarClock className="size-3 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <span data-d="incident-valeur" className="truncate font-medium opacity-0">
              {i.champs[2].valeur}
            </span>
          </dd>
        </dl>

        <div className="border-t border-border/70 pt-2">
          <p className="text-[11.5px] font-semibold">{h.titre}</p>
          <ol className="mt-1">
            {h.lignes.map((l, k) => (
              <li key={l.texte} data-d={k === 0 ? undefined : "histo-ligne"} className="flex items-center gap-2.5 py-[3px] text-[11px]">
                <span className="size-1.5 shrink-0 rounded-full bg-produit" />
                <span className="min-w-0 flex-1 truncate">{l.texte}</span>
                <span className="tabular-nums text-muted-foreground">{l.heure}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
