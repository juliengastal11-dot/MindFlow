"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { CONVERSATION, QUESTIONS, SEPARATEUR_MULTIPLE } from "@/lib/questionnaire";

export type EtatDemande =
  | { succes: true; prenom: string }
  | { succes: false; message: string }
  | undefined;

/* Débit limité, en mémoire : cinq envois par adresse et par heure. */
const HEURE = 60 * 60 * 1000;
const MAX_PAR_HEURE = 5;
const envois = new Map<string, number[]>();

function debitDepasse(adresse: string): boolean {
  const maintenant = Date.now();
  for (const [cle, dates] of envois) {
    const recentes = dates.filter((d) => maintenant - d < HEURE);
    if (recentes.length === 0) envois.delete(cle);
    else envois.set(cle, recentes);
  }
  const recentes = envois.get(adresse) ?? [];
  if (recentes.length >= MAX_PAR_HEURE) return true;
  recentes.push(maintenant);
  envois.set(adresse, recentes);
  return false;
}

async function adresseDuVisiteur(): Promise<string> {
  const h = await headers();
  const transmise = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return transmise || h.get("x-real-ip")?.trim() || "inconnue";
}

function texte(formData: FormData, cle: string): string {
  const valeur = formData.get(cle);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function choixDe(id: string): readonly string[] {
  const q = QUESTIONS.find((x) => x.id === id);
  return q && "choix" in q ? q.choix : [];
}

const echec = (message: string): EtatDemande => ({ succes: false, message });
const RE_TEL = /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/;
const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function envoyerDemande(_prev: EtatDemande, formData: FormData): Promise<EtatDemande> {
  const prenom = texte(formData, "prenom");

  // Pot-de-miel : on ne renseigne pas un robot.
  if (texte(formData, "site_web") !== "") return { succes: true, prenom };

  const { erreurs } = CONVERSATION;

  if (prenom.length < 2 || prenom.length > 60) return echec(erreurs.prenom);

  const activite = texte(formData, "activite");
  const activiteValide =
    choixDe("activite").includes(activite) || (activite.length >= 2 && activite.length <= 80);
  if (!activiteValide) return echec(erreurs.envoi);

  for (const id of ["situation", "actifs", "budget", "delai"]) {
    if (!choixDe(id).includes(texte(formData, id))) return echec(erreurs.envoi);
  }

  const objectifs = texte(formData, "objectifs")
    .split(SEPARATEUR_MULTIPLE)
    .map((o) => o.trim())
    .filter(Boolean);
  const objectifsPermis = choixDe("objectifs");
  if (objectifs.length === 0 || !objectifs.every((o) => objectifsPermis.includes(o))) {
    return echec(erreurs.envoi);
  }

  const demandeClients = texte(formData, "demandeClients");
  const siteAime = texte(formData, "siteAime");
  if (demandeClients.length > 300 || siteAime.length > 300) return echec(erreurs.envoi);

  const contactMode = texte(formData, "contactMode");
  const contactValeur = texte(formData, "contactValeur");
  if (contactMode !== "whatsapp" && contactMode !== "email") return echec(erreurs.envoi);
  const contactValide = contactMode === "whatsapp" ? RE_TEL.test(contactValeur) : RE_MAIL.test(contactValeur);
  if (!contactValide) return echec(erreurs.contact);

  const consentement = texte(formData, "consentement");
  if (consentement !== "on" && consentement !== "true") return echec(erreurs.consentement);

  if (debitDepasse(await adresseDuVisiteur())) return echec(erreurs.debit);

  try {
    await db.demande.create({
      data: {
        prenom,
        activite,
        situation: texte(formData, "situation"),
        objectifs: objectifs.join(SEPARATEUR_MULTIPLE),
        demandeClients: demandeClients || null,
        actifs: texte(formData, "actifs"),
        siteAime: siteAime || null,
        budget: texte(formData, "budget"),
        delai: texte(formData, "delai"),
        contactMode,
        contactValeur,
        consentement: true,
        page: texte(formData, "page") || "/contact",
      },
    });
  } catch (erreur) {
    console.error("envoyerDemande : enregistrement impossible", erreur);
    return echec(erreurs.envoi);
  }

  return { succes: true, prenom };
}
