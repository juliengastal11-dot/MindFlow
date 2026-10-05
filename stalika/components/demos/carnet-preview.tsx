import {
  Bath,
  CalendarDays,
  Camera,
  Check,
  Fence,
  FileText,
  FolderOpen,
  HardHat,
  LoaderCircle,
  NotebookPen,
  Plus,
  Send,
  Store,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CARNET } from "@/lib/demos";
import { Avatar, Barre, Bouton, Case, Fenetre, Notification, Pastille } from "./interface";

/* ---------------------------------------------------------------------------
   Carnet, le logiciel de gestion de chantiers : l'interface de la démo. Le
   film est dans `carnet-animation.ts`, les textes dans `lib/demos.ts`.

   Deux plans : la liste des chantiers, et la fiche d'un chantier qui glisse
   par-dessus (tâches, photos, compte-rendu, en onglets).

   Son design est le gris (`.appli-grise`, app/globals.css) : des cartes
   blanches à l'ombre légère sur un gris clair.
--------------------------------------------------------------------------- */

const ICONES_NAV = [HardHat, CalendarDays, Users, FolderOpen];
const ICONES_CHANTIER = [Bath, Fence, Store];

export function CarnetPreview() {
  return (
    <Fenetre
      nom="Carnet"
      marque={NotebookPen}
      entreprise={CARNET.entreprise}
      utilisateur={CARNET.utilisateur}
      nav={CARNET.nav}
      icones={ICONES_NAV}
      vue={CARNET.vue}
      suite={CARNET.chantiers[0].client}
    >
      <Liste />
      <Fiche />
      <Notification>{CARNET.notification}</Notification>
    </Fenetre>
  );
}

function Liste() {
  const d = CARNET;
  return (
    <div data-d="liste" className="absolute inset-0 flex flex-col p-3 @lg:p-4">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold tracking-tight @lg:text-[15px]">{d.vue}</span>
        <Pastille>{d.enCours}</Pastille>
        <Bouton icone={Plus} className="ml-auto px-2 @lg:px-2.5">
          <span className="hidden @lg:inline">{d.nouveau}</span>
        </Bouton>
      </div>
      <div className="mt-3 hidden items-center gap-1 @lg:flex">
        {d.filtres.map((f, i) => (
          <span
            key={f}
            className={cn("rounded-md px-2 py-0.5 text-[11px]", i === 0 ? "bg-muted font-medium text-foreground" : "text-muted-foreground")}
          >
            {f}
          </span>
        ))}
      </div>
      <div className="mt-3 hidden grid-cols-[1fr_7rem_5.25rem_4.25rem] gap-3 border-b border-border/80 px-2 pb-1.5 text-[10.5px] text-muted-foreground @lg:grid">
        {d.colonnes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 @lg:mt-0 @lg:gap-0">
        {d.chantiers.map((c, i) => {
          const Icone = ICONES_CHANTIER[i];
          return (
            <li
              key={c.client}
              data-d="chantier"
              className="relative grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-background px-2 py-2 shadow-[0_1px_2px_rgb(17_18_20/0.06)] ring-1 ring-inset ring-border/50 @lg:grid-cols-[1fr_7rem_5.25rem_4.25rem] @lg:rounded-none @lg:border-b @lg:border-border/60 @lg:bg-transparent @lg:py-2.5 @lg:shadow-none @lg:ring-0"
            >
              <span
                data-d="chantier-survol"
                className="absolute inset-0 rounded-lg bg-produit/[0.06] opacity-0 ring-1 ring-inset ring-produit/25 @lg:rounded-md"
              />
              <span className="relative flex min-w-0 items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-produit/10 text-produit">
                  <Icone className="size-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.client}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{c.travaux}</span>
                </span>
              </span>
              <span className="relative flex items-center gap-2">
                <Barre valeur={c.progression} className="w-11 @lg:w-14" />
                <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">{c.progression}&nbsp;%</span>
              </span>
              <span className="relative hidden @lg:block">
                <Pastille ton={c.statut === "Démarrage" ? "attente" : "produit"}>{c.statut}</Pastille>
              </span>
              <span className="relative hidden items-center justify-between gap-1 text-[11px] text-muted-foreground @lg:flex">
                {c.fin}
                <span className="flex -space-x-1.5">
                  {c.equipe.slice(0, 2).map((e) => (
                    <Avatar key={e} initiales={e} ton="doux" className="size-4 text-[7px]" />
                  ))}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Fiche() {
  const d = CARNET.detail;
  return (
    <div
      data-d="panneau"
      className="absolute inset-y-0 right-0 z-10 flex w-full flex-col border-l border-border/80 bg-card opacity-0 shadow-panneau @lg:w-[64%]"
    >
      <div className="flex items-start gap-2 px-3 pt-3 @lg:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold tracking-tight">{d.titre}</span>
            <Pastille ton="produit">{d.statut}</Pastille>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{d.adresse}</p>
        </div>
        <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-3 px-3 @lg:px-4">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">{d.progression}</span>
          <span className="font-medium tabular-nums">{d.valeur}</span>
        </div>
        <span className="relative mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span data-d="fiche-barre" className="absolute inset-0 origin-left rounded-full bg-produit" style={{ transform: "scaleX(0.62)" }} />
        </span>
      </div>
      <div className="relative mt-3 flex gap-3.5 border-b border-border/80 px-3 text-[11.5px] font-medium @lg:px-4">
        {d.onglets.map((o, i) => (
          <span
            key={o}
            data-d="onglet"
            className={cn("flex items-center gap-1 pb-2", i === 0 ? "text-foreground" : "text-muted-foreground", i === 3 && "hidden @lg:flex")}
          >
            {o}
            {i === 4 && <span className="rounded-full bg-attente/15 px-1 text-[9.5px] font-semibold text-attente">{d.reserves}</span>}
          </span>
        ))}
        <span data-d="onglet-trait" className="absolute -bottom-px left-0 h-0.5 w-px origin-left bg-produit" />
      </div>
      <div className="relative min-h-0 flex-1">
        <VoletTaches />
        <VoletPhotos />
        <VoletCompteRendu />
      </div>
    </div>
  );
}

function VoletTaches() {
  return (
    <ul data-d="volet-taches" className="absolute inset-0 flex flex-col px-3 pt-1.5 @lg:px-4">
      {CARNET.taches.map((t) => (
        <li key={t.label} data-d="tache" className="flex items-center gap-2.5 border-b border-border/60 py-2">
          <Case fait={t.fait} />
          <span className="min-w-0 flex-1">
            <span className="relative inline-block max-w-full truncate align-middle">
              <span data-d="tache-label" className={cn(t.fait && "text-muted-foreground")}>
                {t.label}
              </span>
              <span
                data-d="tache-rature"
                className="absolute inset-x-0 top-1/2 h-px origin-left bg-muted-foreground/70"
                style={{ transform: `scaleX(${t.fait ? 1 : 0})` }}
              />
            </span>
          </span>
          <Avatar initiales={t.qui} ton="doux" className="hidden @lg:grid" />
          <span className="grid">
            <Pastille data-d="tache-afaire" className={cn("col-start-1 row-start-1 justify-self-end", t.fait && "opacity-0")}>
              {CARNET.aFaire}
            </Pastille>
            <Pastille
              data-d="tache-fait"
              ton="succes"
              icone={Check}
              className={cn("col-start-1 row-start-1 justify-self-end", !t.fait && "opacity-0")}
            >
              {CARNET.termine}
            </Pastille>
          </span>
        </li>
      ))}
    </ul>
  );
}

function VoletPhotos() {
  const p = CARNET.photos;
  const derniere = p.liste.length - 1;
  return (
    <div data-d="volet-photos" className="invisible absolute inset-0 flex flex-col px-3 pt-2.5 @lg:px-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{p.titre}</span>
        <Bouton data-d="photo-ajouter" variante="contour" icone={Camera} className="h-6 px-2 text-[11px]">
          {p.ajouter}
        </Bouton>
      </div>
      <ul className="mt-2 grid grid-cols-3 gap-2 @lg:grid-cols-4">
        {p.liste.map((ph, i) => (
          <li key={ph.legende} data-d={i === derniere ? "photo-neuve" : "photo"} className="min-w-0">
            <span className="relative block overflow-hidden rounded-md ring-1 ring-inset ring-foreground/10">
              <span data-d={i === derniere ? "photo-image" : undefined} className={cn("cliche block aspect-[4/3]", `cliche-${ph.matiere}`)} />
              {i === derniere && (
                <span data-d="photo-envoi" className="absolute inset-0 grid place-items-center bg-card/80">
                  <span className="flex w-2/3 flex-col items-center gap-1">
                    <span className="text-[9.5px] font-medium text-muted-foreground">{p.envoi}</span>
                    <span className="relative block h-1 w-full overflow-hidden rounded-full bg-muted">
                      <span data-d="photo-envoi-barre" className="absolute inset-0 origin-left bg-produit" style={{ transform: "scaleX(0)" }} />
                    </span>
                  </span>
                </span>
              )}
            </span>
            <span className="mt-1 flex justify-between gap-1 text-[10px] text-muted-foreground">
              <span className="truncate">{ph.legende}</span>
              <span className="tabular-nums">{ph.date}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoletCompteRendu() {
  const c = CARNET.compteRendu;
  return (
    <div data-d="volet-cr" className="invisible absolute inset-0 overflow-hidden px-3 pt-2.5 @lg:px-4">
      <div data-d="cr-vide" className="flex h-full flex-col items-center justify-center gap-1.5 pb-5 text-center">
        <span className="grid size-8 place-items-center rounded-lg bg-produit/10 text-produit">
          <FileText className="size-4" strokeWidth={1.75} />
        </span>
        <p className="mt-1 font-medium">{c.vide}</p>
        <p className="max-w-[16rem] text-[11px] text-muted-foreground">{c.aide}</p>
        <Bouton data-d="cr-bouton" className="mt-2">
          <span data-d="cr-bouton-label" className="flex items-center gap-1.5">
            <FileText className="size-3.5" strokeWidth={2} />
            {c.bouton}
          </span>
          <span data-d="cr-bouton-attente" className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0">
            <LoaderCircle data-d="cr-roue" className="size-3.5" strokeWidth={2.25} />
            {c.enCours}
          </span>
        </Bouton>
      </div>
      <div data-d="cr-doc" className="invisible absolute inset-x-3 top-2.5 rounded-lg bg-background p-3 shadow-flottant @lg:inset-x-4">
        <div data-d="cr-ligne" className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold">{c.titre}</p>
            <p className="truncate text-[10.5px] text-muted-foreground">{c.meta}</p>
          </div>
          <Pastille ton="succes" icone={Check}>
            PDF
          </Pastille>
        </div>
        <p data-d="cr-ligne" className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {c.rubrique}
        </p>
        <ul className="mt-1 space-y-0.5">
          {c.travaux.map((t) => (
            <li key={t} data-d="cr-ligne" className="flex items-center gap-1.5 text-[11.5px]">
              <span className="size-1 shrink-0 rounded-full bg-produit" />
              {t}
            </li>
          ))}
        </ul>
        <p data-d="cr-ligne" className="mt-2 text-[11px] text-attente">
          {c.reserve}
        </p>
        <p data-d="cr-ligne" className="text-[11px] text-muted-foreground">
          {c.suite}
        </p>
        <div data-d="cr-ligne" className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2">
          <span className="text-[10.5px] text-muted-foreground">{c.format}</span>
          <Bouton variante="contour" icone={Send} className="h-6 px-2 text-[11px]">
            {c.envoyer}
          </Bouton>
        </div>
      </div>
    </div>
  );
}
