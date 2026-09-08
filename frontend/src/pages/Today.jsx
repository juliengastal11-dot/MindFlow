import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IMPORTANCE, IMPORTANCE_ORDER, fmtDuration } from "@/lib/constants";
import { ItemCard } from "@/components/ItemCard";
import { motion } from "framer-motion";
import { Loader2, Sun, Clock } from "lucide-react";

export default function Today() {
  const { data, isLoading } = useQuery({ queryKey: ["today"], queryFn: async () => (await api.get("/today")).data });

  if (isLoading || !data)
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const items = data.items || [];
  const grouped = IMPORTANCE_ORDER.map((imp) => ({
    info: IMPORTANCE.find((i) => i.value === imp),
    items: items.filter((it) => (it.importance || "aucune") === imp),
  })).filter((g) => g.items.length > 0);

  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div className="flex items-center gap-2 text-primary mb-1"><Sun className="w-5 h-5" /><span className="text-xs font-mono uppercase tracking-widest">{dateLabel}</span></div>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Aujourd'hui</h1>
      <p className="text-slate-400 mt-1 text-sm">Ce que vous devez faire maintenant.</p>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 mt-8" data-testid="today-empty">
          <Sun className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Rien de prévu aujourd'hui.</p>
          <p className="text-slate-600 text-sm mt-1">Planifiez une tâche ou capturez une idée avec le bouton « Capturer ».</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map((g) => (
            <div key={g.info.value} data-testid={`today-group-${g.info.value}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.info.color }} />
                <h2 className="font-heading font-semibold" style={{ color: g.info.value === "aucune" ? undefined : g.info.color }}>
                  {g.info.emoji} {g.info.value === "prioritaire" ? "À faire absolument" : g.info.value === "urgent" ? "Rapide" : g.info.label}
                </h2>
                <span className="text-xs font-mono text-slate-500">{g.items.length}</span>
              </div>
              <div className="space-y-2">
                {g.items.map((it, i) => (
                  <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}>
                    <ItemCard item={it} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-3" data-testid="today-total">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-sm">Vous avez environ <span className="font-heading font-bold text-lg">{fmtDuration(data.total_minutes)}</span> de travail planifié aujourd'hui.</p>
          </div>
        </div>
      )}
    </div>
  );
}
