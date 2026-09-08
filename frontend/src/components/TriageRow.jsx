import React, { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TRIAGE_ACTIONS } from "@/lib/constants";
import { ItemDialog } from "@/components/ItemDialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export function TriageRow({ item, size = "sm" }) {
  const qc = useQueryClient();
  const { data: buckets = [] } = useQuery({ queryKey: ["buckets"], queryFn: async () => (await api.get("/buckets")).data });
  const [planOpen, setPlanOpen] = useState(false);

  const doAction = async (action, extra = {}) => {
    try {
      await api.post(`/items/${item.id}/triage`, { action, ...extra });
      toast.success("Trié");
      qc.invalidateQueries();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="flex flex-wrap gap-1.5" data-testid={`triage-${item.id}`}>
      {TRIAGE_ACTIONS.map((t) => {
        if (t.action === "planifier") {
          return (
            <React.Fragment key="planifier">
              <button data-testid={`triage-planifier-${item.id}`} onClick={() => setPlanOpen(true)}
                className="rounded-full border border-white/10 hover:bg-white/10 transition-colors px-2.5 py-1 text-xs"
                style={{ color: t.color }}>{t.emoji} {t.label}</button>
              <ItemDialog item={item} defaultAction="planifier" open={planOpen} onOpenChange={setPlanOpen} />
            </React.Fragment>
          );
        }
        if (t.action === "bucket") {
          return (
            <Popover key="bucket">
              <PopoverTrigger asChild>
                <button data-testid={`triage-bucket-${item.id}`}
                  className="rounded-full border border-white/10 hover:bg-white/10 transition-colors px-2.5 py-1 text-xs"
                  style={{ color: t.color }}>{t.emoji} {t.label}</button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#0F141C] border-white/10 text-foreground w-52 p-2">
                <p className="text-xs text-slate-500 px-2 py-1">Choisir un bucket</p>
                {buckets.map((b) => (
                  <button key={b.id} onClick={() => doAction("bucket", { bucket_id: b.id })}
                    data-testid={`bucket-opt-${b.id}`}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-sm">{b.emoji} {b.name}</button>
                ))}
                {buckets.length === 0 && <p className="text-xs text-slate-600 px-2 py-2">Aucun bucket</p>}
              </PopoverContent>
            </Popover>
          );
        }
        return (
          <button key={t.action} onClick={() => doAction(t.action)} data-testid={`triage-${t.action}-${item.id}`}
            className="rounded-full border border-white/10 hover:bg-white/10 transition-colors px-2.5 py-1 text-xs"
            style={{ color: t.color }}>{t.emoji} {t.label}</button>
        );
      })}
    </div>
  );
}
