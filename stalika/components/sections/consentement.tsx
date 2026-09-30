"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";

const COOKIE = "stalika-consentement";
const DUREE = 15552000; // 6 mois
const EVENEMENT = "stalika:cookies";

type Choix = "oui" | "non";

function lireChoix(): Choix | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(oui|non)`));
    return m ? (m[1] as Choix) : null;
  } catch {
    return null;
  }
}

function ecrireChoix(choix: Choix) {
  try {
    document.cookie = `${COOKIE}=${choix}; max-age=${DUREE}; path=/; SameSite=Lax`;
  } catch {
    /* le choix ne sera pas gardé, le site reste utilisable */
  }
}

/** Bouton du pied de page : rouvre le bandeau. */
export function BoutonCookies() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENEMENT))}
      className="cursor-pointer text-xs opacity-70 outline-none transition-opacity hover:underline hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
    >
      Cookies
    </button>
  );
}

export function Consentement() {
  const [pret, setPret] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    const existant = lireChoix();
    setChoix(existant);
    setOuvert(existant === null);
    setPret(true);
    const rouvrir = () => setOuvert(true);
    window.addEventListener(EVENEMENT, rouvrir);
    return () => window.removeEventListener(EVENEMENT, rouvrir);
  }, []);

  const repondre = useCallback((c: Choix) => {
    ecrireChoix(c);
    setChoix(c);
    setOuvert(false);
  }, []);

  if (!pret) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {choix === "oui" && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="stalika-ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {ouvert ? (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Statistiques de visite"
          data-src="components/sections/consentement.tsx"
          className="fixed inset-x-0 bottom-0 z-50 border border-border bg-card p-5 text-card-foreground shadow-lg md:bottom-6 md:left-6 md:right-auto md:max-w-md md:rounded-card"
        >
          <p className="text-sm">
            Des statistiques de visite, avec votre accord. Elles m&apos;aident à savoir ce qui vous a
            été utile. Rien n&apos;est déposé tant que vous n&apos;avez pas répondu.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="default" size="sm" onClick={() => repondre("oui")}>
              D&apos;accord
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => repondre("non")}>
              Non merci
            </Button>
            <Link
              href="/confidentialite#cookies"
              className="cursor-pointer text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
