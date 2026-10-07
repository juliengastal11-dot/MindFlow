import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { LogoStalika } from "@/components/ui/logo-stalika";
import { deconnexion } from "@/lib/actions/admin-demandes";

export const metadata: Metadata = {
  title: "Demandes",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/admin");
  if ((session.user as { role?: string }).role !== "admin") redirect("/");

  return (
    <div className="min-h-dvh bg-background text-foreground" data-src="app/admin/layout.tsx">
      <header className="bg-card border-b border-border">
        <nav
          aria-label="Espace privé"
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3"
        >
          <LogoStalika entree="jamais" priority className="w-[5.1rem]" />
          <Link href="/admin" className="text-sm font-medium hover:underline cursor-pointer">
            Demandes
          </Link>
          <Link href="/" className="text-sm hover:underline cursor-pointer">
            Voir le site
          </Link>
          <form action={deconnexion} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Déconnexion
            </Button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
