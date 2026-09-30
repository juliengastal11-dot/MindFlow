"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lienWhatsApp } from "@/lib/site";
import { CONVERSATION, QUESTIONS, type Question } from "@/lib/questionnaire";
import type { EtatDemande } from "@/lib/actions/demandes";
import { cn } from "@/lib/utils";
import { Apparait, BulleJulien, Courante } from "./bulles";
import { styleCarte } from "./question";

const QUESTION_CONTACT = QUESTIONS.find((q) => q.id === "contact") as Extract<Question, { type: "contact" }>;
const RE_TEL = /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/;
const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  /** Toutes les réponses déjà données, par identifiant de question. */
  reponses: Record<string, string>;
  etat: EtatDemande;
  enCours: boolean;
  formAction: (formData: FormData) => void;
  retour?: React.ReactNode;
};

export function EtapeContact({ reponses, etat, enCours, formAction, retour }: Props) {
  const [mode, setMode] = useState<"whatsapp" | "email" | null>(null);
  const [valeur, setValeur] = useState("");
  const [consent, setConsent] = useState(false);
  const [erreurContact, setErreurContact] = useState("");
  const [erreurCase, setErreurCase] = useState("");
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode) champ.current?.focus({ preventScroll: true });
  }, [mode]);

  if (etat?.succes) {
    return (
      <Apparait className="flex flex-col gap-4">
        <BulleJulien>
          <p>{CONVERSATION.succes(etat.prenom)}</p>
        </BulleJulien>
        <div className="flex flex-wrap items-center gap-3 pl-11">
          <Button asChild variant="accent">
            <a
              href={lienWhatsApp("Bonjour Julien, je viens de répondre à vos questions sur Stalika.")}
              target="_blank"
              rel="noopener"
            >
              {CONVERSATION.boutonSucces}
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">{CONVERSATION.lienSucces}</Link>
          </Button>
        </div>
      </Apparait>
    );
  }

  function verifier(e: React.FormEvent<HTMLFormElement>) {
    const propre = valeur.trim();
    const contactOk = mode === "whatsapp" ? RE_TEL.test(propre) : mode === "email" ? RE_MAIL.test(propre) : false;
    setErreurContact(contactOk ? "" : CONVERSATION.erreurs.contact);
    setErreurCase(consent ? "" : CONVERSATION.erreurs.consentement);
    if (!contactOk || !consent) e.preventDefault();
  }

  const whatsapp = mode === "whatsapp";
  const indication = whatsapp ? QUESTION_CONTACT.indications.whatsapp : QUESTION_CONTACT.indications.email;

  return (
    <Courante>
      <BulleJulien>
        <p id="q-contact">{QUESTION_CONTACT.question}</p>
      </BulleJulien>

      <form action={formAction} onSubmit={verifier} aria-busy={enCours} className="flex flex-col gap-3 pl-11" noValidate>
        <input type="hidden" name="prenom" value={reponses.prenom ?? ""} />
        <input type="hidden" name="activite" value={reponses.activite ?? ""} />
        <input type="hidden" name="situation" value={reponses.situation ?? ""} />
        <input type="hidden" name="objectifs" value={reponses.objectifs ?? ""} />
        <input type="hidden" name="demandeClients" value={reponses.demandeClients ?? ""} />
        <input type="hidden" name="actifs" value={reponses.actifs ?? ""} />
        <input type="hidden" name="siteAime" value={reponses.siteAime ?? ""} />
        <input type="hidden" name="budget" value={reponses.budget ?? ""} />
        <input type="hidden" name="delai" value={reponses.delai ?? ""} />
        <input type="hidden" name="contactMode" value={mode ?? ""} />
        <input type="hidden" name="page" value="/contact" />
        <input name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />

        <div className="grid gap-2 sm:grid-cols-2">
          {QUESTION_CONTACT.choix.map((choix) => {
            const valeurMode = choix === "Sur WhatsApp" ? "whatsapp" : "email";
            const actif = mode === valeurMode;
            return (
              <button
                key={choix}
                type="button"
                aria-pressed={actif}
                className={cn(styleCarte, actif && "border-primary bg-muted")}
                onClick={() => {
                  setMode(valeurMode);
                  setValeur("");
                  setErreurContact("");
                }}
              >
                {choix}
              </button>
            );
          })}
        </div>

        {mode && (
          <>
            <Input
              ref={champ}
              key={mode}
              name="contactValeur"
              type={whatsapp ? "tel" : "email"}
              inputMode={whatsapp ? "tel" : "email"}
              autoComplete={whatsapp ? "tel" : "email"}
              value={valeur}
              onChange={(e) => {
                setValeur(e.target.value);
                setErreurContact("");
              }}
              placeholder={indication}
              aria-label={indication}
              aria-invalid={erreurContact ? true : undefined}
              aria-describedby={erreurContact ? "erreur-contact" : undefined}
            />
            {erreurContact && (
              <p id="erreur-contact" role="alert" className="text-sm text-destructive">
                {erreurContact}
              </p>
            )}

            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                name="consentement"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErreurCase("");
                }}
                aria-invalid={erreurCase ? true : undefined}
                aria-describedby={erreurCase ? "erreur-consentement" : undefined}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <span>{QUESTION_CONTACT.consentement}</span>
            </label>
            {erreurCase && (
              <p id="erreur-consentement" role="alert" className="text-sm text-destructive">
                {erreurCase}
              </p>
            )}

            <div>
              <Button type="submit" variant="accent" disabled={enCours}>
                {QUESTION_CONTACT.bouton}
              </Button>
            </div>
          </>
        )}

        {etat && !etat.succes && (
          <div className="-ml-11" aria-live="polite">
            <BulleJulien erreur role="alert">
              <p>{etat.message}</p>
            </BulleJulien>
          </div>
        )}

        {retour}
      </form>
    </Courante>
  );
}
