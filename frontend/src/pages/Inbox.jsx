import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/api";
import { TriageRow } from "@/components/TriageRow";
import { IMPORTANCE_MAP, TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, Inbox as InboxIcon, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function Inbox() {
  const qc = useQueryClient();
  const [organizing, setOrganizing] = useState(false);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "inbox"],
    queryFn: async () => (await api.get("/items?status=inbox")).data,
  });

  const organize = async () => {
    if (items.length === 0) return;
    setOrganizing(true);
    try {
      const ids = items.map((i) => i.id);
      const { data } = await api.post("/ai/organize", { item_ids: ids });
      for (const s of data.suggestions) {
        await api.patch(`/items/${s.id}`, { importance: s.importance, type: s.type, estimated_minutes: s.estimated_minutes });
        await api.post(`/items/${s.id}/triage`, { action: s.action === "planifier" ? "tache" : s.action });
      }
      toast.success(`${data.suggestions.length} élément(s) organisé(s) par l'IA`);
      qc.invalidateQueries();
    } catch (e) { toast.error(apiError(e)); }
    finally { setOrganizing(false); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Inbox</h1>
          <p className="text-slate-400 mt-1 text-sm">Tout ce qui vous passe par la tête. Capturez d'abord, triez ensuite.</p>
        </div>
        {items.length > 0 && (
          <Button onClick={organize} disabled={organizing} data-testid="ai-organize-btn" className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white gap-2">
            {organizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Organiser (IA)
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 mt-6" data-testid="inbox-empty">
          <InboxIcon className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Inbox vide 🎉</p>
          <p className="text-slate-600 text-sm mt-1">Utilisez « Capturer » pour noter une idée en un instant.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-6" data-testid="inbox-list">
          {items.map((it, i) => {
            const info = IMPORTANCE_MAP[it.importance] || IMPORTANCE_MAP.aucune;
            return (
              <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4" data-testid={`inbox-item-${it.id}`}>
                <div className="flex items-center gap-2">
                  {it.importance && it.importance !== "aucune" && <span style={{ color: info.color }}>{info.emoji}</span>}
                  <p className="text-sm font-medium flex-1">{it.title}</p>
                  <span className="text-[11px] text-slate-500">{(TYPES[it.type] || {}).emoji}</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 mb-2">Qu'est-ce que vous voulez en faire ?</p>
                <TriageRow item={it} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
