"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONVERSATION, SEPARATEUR_MULTIPLE, type Question } from "@/lib/questionnaire";
import { cn } from "@/lib/utils";
import { BulleJulien, Courante } from "./bulles";

export const styleCarte =
  "carte-reactive cursor-pointer text-left rounded-card border border-border bg-card px-4 py-3 text-sm text-card-foreground hover:border-encre outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Props = {
  question: Exclude<Question, { type: "contact" }>;
  /** Ce que la personne avait répondu avant de revenir en arrière. */
  brouillon?: string;
  onRepondre: (valeur: string) => void;
  retour?: React.ReactNode;
};

export function QuestionCourante({ question, brouillon, onRepondre, retour }: Props) {
  return (
    <Courante>
      <BulleJulien>
        <p id={`q-${question.id}`}>{question.question}</p>
      </BulleJulien>
      <div className="flex flex-col gap-3 pl-11">
        {question.type === "texte" && <QuestionTexte question={question} brouillon={brouillon} onRepondre={onRepondre} />}
        {question.type === "choix" && <QuestionChoix question={question} onRepondre={onRepondre} />}
        {question.type === "choixMultiple" && <QuestionMultiple question={question} onRepondre={onRepondre} />}
        {retour}
      </div>
    </Courante>
  );
}

function QuestionTexte({
  question,
  brouillon,
  onRepondre,
}: {
  question: Extract<Question, { type: "texte" }>;
  brouillon?: string;
  onRepondre: (valeur: string) => void;
}) {
  const [valeur, setValeur] = useState(brouillon ?? "");
  const [erreur, setErreur] = useState("");
  const idErreur = `erreur-${question.id}`;

  function valider() {
    const propre = valeur.trim();
    if (question.id === "prenom" && propre.length < 2) {
      setErreur(CONVERSATION.erreurs.prenom);
      return;
    }
    onRepondre(propre);
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        valider();
      }}
    >
      <Input
        value={valeur}
        onChange={(e) => {
          setValeur(e.target.value);
          setErreur("");
        }}
        placeholder={question.indication}
        aria-labelledby={`q-${question.id}`}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? idErreur : undefined}
        maxLength={question.id === "prenom" ? 60 : 300}
        autoComplete={question.id === "prenom" ? "given-name" : "off"}
      />
      {erreur && (
        <p id={idErreur} role="alert" className="text-sm text-destructive">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{CONVERSATION.valider}</Button>
        {question.facultatif && (
          <Button type="button" variant="ghost" onClick={() => onRepondre("")}>
            {CONVERSATION.passer}
          </Button>
        )}
      </div>
    </form>
  );
}

function QuestionChoix({
  question,
  onRepondre,
}: {
  question: Extract<Question, { type: "choix" }>;
  onRepondre: (valeur: string) => void;
}) {
  const [autreOuvert, setAutreOuvert] = useState(false);
  const [libre, setLibre] = useState("");

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {question.choix.map((choix) => {
          const estAutre = question.autre?.choix === choix;
          return (
            <button
              key={choix}
              type="button"
              aria-expanded={estAutre ? autreOuvert : undefined}
              className={cn(styleCarte, estAutre && autreOuvert && "border-encre bg-muted")}
              onClick={() => (estAutre ? setAutreOuvert(true) : onRepondre(choix))}
            >
              {choix}
            </button>
          );
        })}
      </div>
      {question.autre && autreOuvert && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (libre.trim().length >= 2) onRepondre(libre.trim());
          }}
        >
          <Input
            autoFocus
            value={libre}
            onChange={(e) => setLibre(e.target.value)}
            placeholder={question.autre.indication}
            aria-label={question.autre.indication}
            maxLength={80}
          />
          <div>
            <Button type="submit" disabled={libre.trim().length < 2}>
              {CONVERSATION.valider}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

function QuestionMultiple({
  question,
  onRepondre,
}: {
  question: Extract<Question, { type: "choixMultiple" }>;
  onRepondre: (valeur: string) => void;
}) {
  const [choisis, setChoisis] = useState<string[]>([]);

  function basculer(choix: string) {
    setChoisis((actuels) => (actuels.includes(choix) ? actuels.filter((c) => c !== choix) : [...actuels, choix]));
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">{question.mention}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {question.choix.map((choix) => {
          const actif = choisis.includes(choix);
          return (
            <button
              key={choix}
              type="button"
              aria-pressed={actif}
              className={cn(styleCarte, actif && "border-encre bg-muted")}
              onClick={() => basculer(choix)}
            >
              {choix}
            </button>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          disabled={choisis.length === 0}
          onClick={() =>
            onRepondre(question.choix.filter((c) => choisis.includes(c)).join(SEPARATEUR_MULTIPLE))
          }
        >
          {question.bouton}
        </Button>
      </div>
    </>
  );
}
