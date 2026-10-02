import Image from "next/image";
import Link from "next/link";
import { LiensLegaux } from "@/components/sections/liens-legaux";
import { BoutonCookies } from "@/components/sections/consentement";
import { SITE, lienWhatsApp } from "@/lib/site";

export function PiedDePage() {
  return (
    <footer
      data-src="components/sections/pied-de-page.tsx"
      className="border-t border-border bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <Image src="/logo-nuit.png" alt="Stalika" width={880} height={289} className="h-8 w-auto" />
          <p className="mt-4 font-medium">Stalika · Julien Gastal</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Sites, logiciels et applications sur mesure pour ceux qui font tourner leur boutique. Toute la France, à distance.
          </p>
        </div>

        <div>
          <a
            href={lienWhatsApp()}
            target="_blank"
            rel="noopener"
            className="cursor-pointer font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SITE.whatsappAffiche}
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <LiensLegaux />
            <BoutonCookies />
          </div>
          <Link
            href="/connexion"
            className="w-fit cursor-pointer text-xs opacity-70 transition-opacity hover:underline hover:opacity-100"
          >
            Espace privé
          </Link>
        </div>
      </div>
    </footer>
  );
}
