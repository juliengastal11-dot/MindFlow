import React, { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IMPORTANCE_MAP, TYPES, fmtDuration, fmtDate, fmtTime } from "@/lib/constants";
import { ImportanceBar, DurationChip } from "@/components/badges";
import { ItemDialog } from "@/components/ItemDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { celebrate } from "@/lib/confetti";
import { MoreVertical, Pencil, Trash2, ParkingCircle, CalendarClock, Clock, Inbox as InboxIcon } from "lucide-react";
import { toast } from "sonner";

export function ItemCard({ item, draggable, onDragStart, compact, mini }) {
  const qc = useQueryClient();
  const { data: buckets = [] } = useQuery({ queryKey: ["buckets"], queryFn: async () => (await api.get("/buckets")).data });
  const bucket = buckets.find((b) => b.id === item.bucket_id);
  const [editOpen, setEditOpen] = useState(false);
  const done = item.status === "done";
  const info = IMPORTANCE_MAP[item.importance] || IMPORTANCE_MAP.aucune;

  const setStatus = async (status) => {
    try {
      await api.patch(`/items/${item.id}`, { status });
      if (status === "done") { celebrate(); toast.success("Terminé ! 🎉"); }
      qc.invalidateQueries();
    } catch (e) { toast.error(apiError(e)); }
  };
  const remove = async () => {
    try { await api.delete(`/items/${item.id}`); toast.success("Supprimé"); qc.invalidateQueries(); }
    catch (e) { toast.error(apiError(e)); }
  };
  const toPark = async () => {
    try { await api.post(`/items/${item.id}/triage`, { action: "parking" }); toast.success("Envoyé au parking 🅿️"); qc.invalidateQueries(); }
    catch (e) { toast.error(apiError(e)); }
  };

  // Variante « mini » (colonnes étroites du planning) : titre + heure, clic = modifier
  if (mini) {
    return (
      <div
        draggable={draggable}
        onDragStart={draggable ? (e) => { e.dataTransfer.setData("text/item", item.id); onDragStart && onDragStart(item); } : undefined}
        className={`relative rounded-lg border border-white/10 bg-[#161D2A] py-1.5 pr-2 pl-3 ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${done ? "opacity-60" : ""}`}
        title={item.title}
        data-testid={`item-${item.id}`}
      >
        <ImportanceBar importance={item.importance} />
        <div className="flex items-start gap-1.5">
          <Checkbox checked={done} onCheckedChange={(v) => setStatus(v ? "done" : "active")}
            data-testid={`item-check-${item.id}`}
            className="mt-0.5 h-3.5 w-3.5 border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
          <button type="button" onClick={() => setEditOpen(true)} data-testid={`item-open-${item.id}`} className="min-w-0 flex-1 text-left">
            <p className={`text-xs font-medium leading-snug line-clamp-2 ${done ? "line-through text-slate-500" : ""}`}>{item.title}</p>
            <p className="mt-0.5 text-[10px] font-mono text-slate-500">
              {fmtTime(item.planned_at)}{item.estimated_minutes ? ` · ${fmtDuration(item.estimated_minutes)}` : ""}
            </p>
          </button>
        </div>
        <ItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.setData("text/item", item.id); onDragStart && onDragStart(item); } : undefined}
      className={`relative rounded-xl border border-white/10 bg-[#161D2A] ${compact ? "p-3" : "p-4"} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      data-testid={`item-${item.id}`}
    >
      <ImportanceBar importance={item.importance} />
      <div className="flex items-start gap-3 pl-2">
        <Checkbox checked={done} onCheckedChange={(v) => setStatus(v ? "done" : "active")}
          data-testid={`item-check-${item.id}`}
          className="mt-0.5 border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug ${done ? "line-through text-slate-500" : ""}`}>{item.title}</p>
          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px] text-slate-500">
            <span>{(TYPES[item.type] || {}).emoji}</span>
            {item.importance && item.importance !== "aucune" && (
              <span style={{ color: info.color }}>{info.emoji} {info.label}</span>
            )}
            {item.estimated_minutes ? <DurationChip minutes={item.estimated_minutes} /> : null}
            {item.planned_at && (
              <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {fmtDate(item.planned_at)} {fmtTime(item.planned_at)}</span>
            )}
            {item.due_at && (
              <span className="inline-flex items-center gap-1 text-amber-400/80"><Clock className="w-3 h-3" /> {fmtDate(item.due_at)}</span>
            )}
            {bucket && <span>{bucket.emoji} {bucket.name}</span>}
            {item.postpone_count > 0 && <span className="text-red-400/70">↻{item.postpone_count}</span>}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid={`item-menu-${item.id}`} className="text-slate-500 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0F141C] border-white/10 text-foreground">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditOpen(true); }} className="gap-2"><Pencil className="w-4 h-4" /> Modifier</DropdownMenuItem>
            {item.status !== "parked" && <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toPark(); }} className="gap-2"><ParkingCircle className="w-4 h-4" /> Parking</DropdownMenuItem>}
            {item.status !== "inbox" && <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setStatus("inbox"); }} className="gap-2"><InboxIcon className="w-4 h-4" /> Renvoyer à l'inbox</DropdownMenuItem>}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); remove(); }} className="gap-2 text-red-400 focus:text-red-400"><Trash2 className="w-4 h-4" /> Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
