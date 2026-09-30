"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supprimerDemande } from "@/lib/actions/admin-demandes";

/** Suppression derrière une confirmation inline, sans `window.confirm`. */
export function Supprimer({ id }: { id: string }) {
  const [confirme, setConfirme] = useState(false);

  if (!confirme) {
    return (
      <Button type="button" variant="destructive" onClick={() => setConfirme(true)}>
        Supprimer
      </Button>
    );
  }

  return (
    <form
      action={supprimerDemande.bind(null, id)}
      role="alertdialog"
      aria-label="Supprimer cette demande ? C'est définitif."
      className="flex flex-wrap items-center gap-3"
    >
      <p className="text-sm">Supprimer cette demande ? C&apos;est définitif.</p>
      <Button type="submit" variant="destructive">
        Oui, supprimer
      </Button>
      <Button type="button" variant="outline" onClick={() => setConfirme(false)}>
        Annuler
      </Button>
    </form>
  );
}
