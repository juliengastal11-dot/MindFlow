import Link from "next/link";
import { LogoStalika } from "@/components/ui/logo-stalika";
import { Button } from "@/components/ui/button";
import { lienWhatsApp } from "@/lib/site";

/* Posée par-dessus le haut de page, sans être fixe : le fond est clair partout. */
export function Nav() {
  return (
    <header data-src="components/sections/nav.tsx" className="absolute inset-x-0 top-0 z-20">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-on-primary"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {/* Le logo se compose lettre à lettre la première fois de la visite ; ensuite, une lettre au hasard se rebrouille de temps en temps. */}
          <LogoStalika entree="une-fois-par-visite" priority className="w-[6.6rem] md:w-32" />
        </Link>
        <nav aria-label="Contact" className="flex items-center gap-4 sm:gap-6">
          <a
            href={lienWhatsApp()}
            target="_blank"
            rel="noopener"
            className="cursor-pointer text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            WhatsApp
          </a>
          <Button asChild variant="default" shape="pill" size="sm">
            <Link href="/contact">Contact</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
