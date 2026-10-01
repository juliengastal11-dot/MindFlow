import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

const QUESTIONS = [
  {
    q: "Combien ça coûte, vraiment ?",
    r: "À partir de 300 € pour un site vitrine simple, payable en plusieurs fois sans frais. Le prix est écrit avant de commencer et il ne bouge pas en route. Une fonction en plus, une réservation ou un espace client, se chiffre à part, avant, jamais après.",
  },
  {
    q: "C'est un modèle ou une page blanche ?",
    r: "Une page blanche. Je pars de votre activité et de vos clients, pas d'un gabarit à remplir. Deux sites Stalika ne se ressemblent pas.",
  },
  {
    q: "Je pourrai modifier mon site moi-même ?",
    r: "Vous relisez et vous corrigez directement sur la page, avec le lien de relecture. J'applique et je publie : vous n'avez rien à casser. Plus tard, pour un changement, un message suffit.",
  },
  {
    q: "Le site m'appartient ?",
    r: "Oui. Le code, les textes, les images que vous m'avez confiées : tout est à vous. Vous pouvez partir avec.",
  },
  {
    q: "Et l'hébergement, le nom de domaine ?",
    r: "Je peux m'en occuper, ou vous laisser la main. On décide ensemble, et c'est écrit dans le devis.",
  },
  {
    q: "En combien de temps ?",
    r: "Une première ébauche sous 72 heures. Ensuite, le rythme dépend de vos retours : plus ils arrivent vite, plus le site sort vite.",
  },
];

export function Faq() {
  return (
    <Section
      fond="background"
      largeur="prose"
      src="components/sections/faq.tsx"
      eyebrow="Avant de signer"
      titre="Vos questions, mes réponses"
    >
      <Reveal>
        <div className="border-t border-border">
          {QUESTIONS.map(({ q, r }) => (
            <details key={q} className="group border-b border-border py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg font-display text-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:text-xl [&::-webkit-details-marker]:hidden">
                {q}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-3 text-muted-foreground">{r}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
