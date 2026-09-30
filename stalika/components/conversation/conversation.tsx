"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { envoyerDemande, type EtatDemande } from "@/lib/actions/demandes";
import { CONVERSATION, QUESTIONS, SEPARATEUR_MULTIPLE } from "@/lib/questionnaire";
import { Apparait, BulleJulien, BulleReponse } from "./bulles";
import { EtapeContact } from "./etape-contact";
import { QuestionCourante } from "./question";

const TOTAL = QUESTIONS.length;

type Reponse = { id: string; valeur: string };

function Progression({ n }: { n: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow text-muted-foreground">{`${n} / ${TOTAL}`}</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TOTAL}
        aria-valuenow={n}
        aria-valuetext={`${n} / ${TOTAL}`}
        className="grid grid-cols-10 gap-1"
      >
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={i < n ? "h-1 rounded-full bg-primary" : "h-1 rounded-full bg-muted"} />
        ))}
      </div>
    </div>
  );
}

function affichage(valeur: string): string {
  if (valeur === "") return CONVERSATION.passer;
  return valeur.split(SEPARATEUR_MULTIPLE).join(", ");
}

export function Conversation() {
  const [demarre, setDemarre] = useState(false);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [brouillon, setBrouillon] = useState<string | undefined>(undefined);
  const [etat, formAction, enCours] = useActionState<EtatDemande, FormData>(envoyerDemande, undefined);

  const succes = etat?.succes === true;
  const n = succes ? TOTAL : reponses.length;
  const courante = QUESTIONS[reponses.length];

  function repondre(id: string, valeur: string) {
    setBrouillon(undefined);
    setReponses((actuelles) => [...actuelles, { id, valeur }]);
  }

  function revenir() {
    const derniere = reponses[reponses.length - 1];
    if (!derniere) return;
    setBrouillon(derniere.valeur);
    setReponses((actuelles) => actuelles.slice(0, -1));
  }

  const retour =
    reponses.length > 0 && !succes ? (
      <div>
        <Button type="button" variant="link" className="h-auto px-0 text-sm text-foreground" onClick={revenir}>
          {CONVERSATION.retour}
        </Button>
      </div>
    ) : null;

  const parId: Record<string, string> = Object.fromEntries(reponses.map((r) => [r.id, r.valeur]));

  return (
    <div data-src="components/conversation/conversation.tsx" className="mx-auto max-w-2xl px-6 pb-24">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Parlons de votre site</h1>

      <div className="mt-8 flex flex-col gap-6">
        <Progression n={n} />

        <Reveal className="flex flex-col gap-4">
          <BulleJulien>
            <p>{CONVERSATION.accueil}</p>
          </BulleJulien>
          {!demarre && (
            <div className="pl-11">
              <Button type="button" variant="accent" onClick={() => setDemarre(true)}>
                {CONVERSATION.boutonAccueil}
              </Button>
            </div>
          )}
        </Reveal>

        {demarre && (
          <div className="flex flex-col gap-6" aria-live="polite">
            {reponses.map((r, i) => (
              <Apparait key={`${r.id}-${i}`} className="flex flex-col gap-3">
                <BulleJulien>
                  <p>{QUESTIONS[i].question}</p>
                </BulleJulien>
                <BulleReponse>
                  <p>{r.id === "contact" ? r.valeur : affichage(r.valeur)}</p>
                </BulleReponse>
              </Apparait>
            ))}
          </div>
        )}

        {demarre && courante && courante.type !== "contact" && (
          <Apparait key={courante.id}>
            <QuestionCourante
              question={courante}
              brouillon={brouillon}
              onRepondre={(valeur) => repondre(courante.id, valeur)}
              retour={retour}
            />
          </Apparait>
        )}

        {demarre && courante?.type === "contact" && (
          <EtapeContact
            key="contact"
            reponses={parId}
            etat={etat}
            enCours={enCours}
            formAction={formAction}
            retour={retour}
          />
        )}
      </div>
    </div>
  );
}
