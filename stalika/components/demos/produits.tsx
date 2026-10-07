"use client";

import dynamic from "next/dynamic";
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
   textes (`lib/demos.ts`), son thème, sa couleur, son film et son interface.
   L'écran du téléphone (`SaaSPreviewCard`) et la légende du carrousel lisent
   les mêmes données.

   Chaque logiciel a son design (demande de J du 2026-10-04) : Carnet gris,
   Contrôle sombre, et l'or, d'abord celui de RelancePro. Le 2026-10-07, J a
   remplacé RelancePro par son application, VTBON, noire et or : elle ne
   passe pas par un thème de Stalika, elle a son écran (`VtbonEcran` : les
   deux maquettes animées de son site), et sa durée de face, plus longue que
   celle des autres. Le thème habille l'écran ; la couleur (`accent`) marque le
   logiciel dans la légende, sur le fond sombre de la scène. Le 2026-10-07, J a
   aussi retiré de la légende l'icône, le nom en titre, le statut et la ligne
   « pour qui » : il n'en reste que les trois noms au-dessus, la description et
   le lien.
--------------------------------------------------------------------------- */

export type Demo = {
  id: string;
  nom: string;
  description: string;
  statut: string;
  resume: string;
  /** L'heure de la barre d'état du téléphone (les démos dessinées par Stalika ; VTBON porte la sienne). */
  heure?: string;
  /** Le thème de son écran : la classe qui pose ses jetons (app/globals.css). */
  theme?: string;
  /** Sa couleur dans la légende (le point devant son nom), en général `var(--produit-…)`. */
  accent: string;
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
    Ecran: VtbonEcran,
    duree: 45,
  },
  {
    id: "carnet",
    ...PRODUITS.carnet,
    theme: "appli-grise",
    accent: "var(--produit-carnet)",
    animation: animerCarnet,
    Apercu: CarnetPreview,
  },
  {
    id: "controle",
    ...PRODUITS.controle,
    theme: "appli-sombre",
    accent: "var(--produit-controle)",
    animation: animerControle,
    Apercu: ControlePreview,
  },
];
