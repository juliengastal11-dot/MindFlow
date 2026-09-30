import type { Metadata } from "next";
import { lireReglages } from "@/lib/reglages";
import { Nav } from "@/components/sections/nav";
import { PiedDePage } from "@/components/sections/pied-de-page";
import { Section } from "@/components/ui/section";

/* ---------------------------------------------------------------------------
   Politique de confidentialité : dès qu'une donnée est collectée, même un
   simple formulaire de contact.

   Adapte les rubriques au traitement RÉEL du site. Décrire une collecte qui
   n'existe pas est aussi faux que d'en taire une.
--------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Ce que le site Stalika collecte, pourquoi, et comment exercer vos droits.",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false },
};

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl sm:text-2xl">{titre}</h2>
      <div className="mt-3 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default async function Confidentialite() {
  const reglages = await lireReglages();
  const contact = reglages.email || "[[À CONFIRMER PAR L'UTILISATEUR : adresse e-mail de contact]]";

  return (
    <>
    <Nav />
    <main id="contenu" className="pt-24">
    <Section largeur="prose" rythme="serre" src="app/confidentialite/page.tsx">
      <p className="eyebrow text-encre">Vos données</p>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">
        Politique de confidentialité
      </h1>

      <Bloc titre="Responsable du traitement">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : raison sociale et adresse du responsable de traitement]]</p>
        <p>Contact : {contact}</p>
      </Bloc>

      <Bloc titre="Données collectées et finalités">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : lister ce que le site collecte réellement, par exemple nom,
          e-mail, téléphone et adresse de livraison via le formulaire de commande]]
        </p>
        <p>
          Ces données servent uniquement à traiter votre demande. Elles ne sont ni vendues
          ni cédées à des tiers à des fins commerciales.
        </p>
      </Bloc>

      <Bloc titre="Base légale">
        <p>
          Exécution du contrat pour une commande, intérêt légitime pour une demande de
          contact, consentement pour toute communication commerciale.
        </p>
      </Bloc>

      <Bloc titre="Durée de conservation">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : durée réelle, par exemple 3 ans après le dernier contact,
          10 ans pour les pièces comptables]]</p>
      </Bloc>

      <Bloc titre="Destinataires">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : lister les sous-traitants réels (hébergeur, prestataire de
          paiement, transporteur, service d&apos;envoi d&apos;e-mails)]]
        </p>
      </Bloc>

      <Bloc titre="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
          de limitation, d&apos;opposition et de portabilité sur vos données. Pour
          l&apos;exercer, écrivez à {contact}.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL :{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-encre underline underline-offset-4 hover:no-underline"
          >
            cnil.fr
          </a>
          .
        </p>
      </Bloc>

      <Bloc titre="Cookies">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : décrire les traceurs réellement utilisés. Si le site n&apos;utilise
          ni mesure d&apos;audience ni publicité, l&apos;écrire : c&apos;est une information
          en soi, et il n&apos;y a alors pas de bandeau à afficher]]
        </p>
      </Bloc>

      <Bloc titre="Le questionnaire de contact">
        <p>
          En répondant aux questions du site, vous me confiez votre prénom, votre activité, vos
          réponses et un moyen de vous joindre. Je m&apos;en sers pour vous répondre, et pour rien
          d&apos;autre. Base légale : votre consentement, coché avant l&apos;envoi. Ces réponses sont
          gardées douze mois, puis supprimées, ou plus tôt si vous me le demandez. Personne d&apos;autre
          que moi ne les lit.
        </p>
      </Bloc>

      <div id="cookies" className="scroll-mt-24">
        <Bloc titre="Cookies et statistiques">
          <p>
            Ce site mesure ses visites avec Google Analytics, uniquement si vous avez cliqué sur
            « D&apos;accord » dans le bandeau. Tant que vous n&apos;avez pas répondu, ou si vous avez
            refusé, aucun cookie de mesure n&apos;est déposé. Vous pouvez changer d&apos;avis à tout
            moment : le lien « Cookies » en bas de page rouvre le bandeau. Le seul autre cookie est
            celui de session de l&apos;espace privé, réservé à l&apos;éditeur.
          </p>
        </Bloc>
      </div>
    </Section>
    </main>
    <PiedDePage />
    </>
  );
}
