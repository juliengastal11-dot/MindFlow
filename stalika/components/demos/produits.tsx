"use client";

import dynamic from "next/dynamic";
import { ClipboardCheck, Mic, NotebookPen, type LucideIcon } from "lucide-react";
import { PRODUITS } from "@/lib/demos";
import type { AnimationDemo } from "./moteur";
import { CarnetPreview } from "./carnet-preview";
import { ControlePreview } from "./controle-preview";
import type { VtbonEcranProps } from "./vtbon-ecran";
import { animerCarnet } from "./carnet-animation";
import { animerControle } from "./controle-animation";

/* L'écran de VTBON (son moteur, son markup, 58 ko de CSS) se charge à part, après la page : il ne pèse pas sur
   le premier affichage, et le carrousel ne se monte de toute façon que côté navigateur. */
const VtbonEcran = dynamic<VtbonEcranProps>(() => import("./vtbon-ecran").then((m) => m.VtbonEcran), { ssr: false });

/* ---------------------------------------------------------------------------
   Les démos du carrousel de la section 02, dans l'ordre : pour chacune, ses
   textes (`lib/demos.ts`), son thème, sa couleur, son icône, son film et son
   interface. L'écran du téléphone (`SaaSPreviewCard`) et la légende du
   carrousel lisent les mêmes données.

   Chaque logiciel a son design (demande de J du 2026-10-04) : Carnet gris,
   Contrôle sombre, et l'or, d'abord celui de RelancePro. Le 2026-10-07, J a
   remplacé RelancePro par son application, VTBON, noire et or : elle ne
   passe pas par un thème de Stalika, elle a son écran (`VtbonEcran` : les
   deux maquettes animées de son site), et sa durée de face, plus longue que
   celle des autres. Le thème habille l'écran ; la couleur (`accent`, et
   `surAccent` pour l'icône posée dessus) marque le logiciel dans la légende,
   sur le fond sombre de la scène.
--------------------------------------------------------------------------- */

export type Demo = {
  id: string;
  nom: string;
  pourQui: string;
  description: string;
  fonctions: readonly string[];
  statut: string;
  resume: string;
  /** L'heure de la barre d'état du téléphone (les démos dessinées par Stalika ; VTBON porte la sienne). */
  heure?: string;
  /** Le thème de son écran : la classe qui pose ses jetons (app/globals.css). */
  theme?: string;
  /** Sa couleur dans la légende, en général `var(--produit-…)`, et celle de l'icône posée dessus. */
  accent: string;
  surAccent: string;
  icone: LucideIcon;
  /** Le film GSAP de l'interface `Apercu`, joué sur la fenêtre de `SaaSPreviewCard`. */
  animation?: AnimationDemo;
  Apercu?: React.ComponentType;
  /** Un écran qui se joue tout seul, sans `SaaSPreviewCard` (VTBON) : il lit `etat` lui-même. */
  Ecran?: React.ComponentType<VtbonEcranProps>;
  /** Combien de secondes le téléphone reste de face avant que le carrousel passe au suivant (12 par défaut). */
  duree?: number;
  lien?: { href: string; libelle: string };
};

/* VTBON en tête : c'est lui que le carrousel montre en premier (demande de J, 2026-10-07). */
export const DEMOS: readonly Demo[] = [
  {
    id: "vtbon",
    ...PRODUITS.vtbon,
    accent: "var(--produit-vtbon)",
    surAccent: "var(--sur-produit-vtbon)",
    icone: Mic,
    Ecran: VtbonEcran,
    duree: 45,
  },
  {
    id: "carnet",
    ...PRODUITS.carnet,
    theme: "appli-grise",
    accent: "var(--produit-carnet)",
    surAccent: "var(--sur-produit-carnet)",
    icone: NotebookPen,
    animation: animerCarnet,
    Apercu: CarnetPreview,
  },
  {
    id: "controle",
    ...PRODUITS.controle,
    theme: "appli-sombre",
    accent: "var(--produit-controle)",
    surAccent: "var(--sur-produit-controle)",
    icone: ClipboardCheck,
    animation: animerControle,
    Apercu: ControlePreview,
  },
];
