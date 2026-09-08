import React, { useState, useEffect } from "react";
import { api, apiError } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IMPORTANCE, TYPES, DURATION_PRESETS, fmtDuration } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

function pad(n) { return String(n).padStart(2, "0"); }
function dstr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function ItemDialog({ trigger, item, defaultAction, defaultDate, open: openProp, onOpenChange, onSaved }) {
  const qc = useQueryClient();
  const [uOpen, setUOpen] = useState(false);
  const open = openProp !== undefined ? openProp : uOpen;
  const setOpen = onOpenChange || setUOpen;

  const { data: buckets = [] } = useQuery({ queryKey: ["buckets"], queryFn: async () => (await api.get("/buckets")).data });

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("task");
  const [importance, setImportance] = useState("aucune");
  const [minutes, setMinutes] = useState(30);
  const [bucketId, setBucketId] = useState("none");
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState(defaultDate || dstr(new Date()));
  const [time, setTime] = useState("09:00");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title || "");
    setNote(item?.note || "");
    setType(item?.type || "task");
    setImportance(item?.importance || "aucune");
    setMinutes(item?.estimated_minutes || 30);
    setBucketId(item?.bucket_id || "none");
    setDue(item?.due_at ? item.due_at.slice(0, 10) : "");
    const planned = item?.planned_at || (defaultAction === "planifier" ? true : null);
    if (item?.planned_at) {
      const d = new Date(item.planned_at);
      setScheduled(true); setDate(dstr(d)); setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setScheduled(defaultAction === "planifier");
      setDate(defaultDate || dstr(new Date())); setTime("09:00");
    }
  }, [open, item, defaultAction, defaultDate]);

  const runAi = async () => {
    if (!title.trim()) { toast.error("Écrivez d'abord un titre"); return; }
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/suggest", { text: title });
      setImportance(data.importance); setMinutes(data.estimated_minutes); setType(data.type);
      toast.success("Suggestion IA appliquée");
    } catch (e) { toast.error(apiError(e)); }
    finally { setAiLoading(false); }
  };

  const save = async () => {
    if (!title.trim()) { toast.error("Le titre est requis"); return; }
    setSaving(true);
    try {
      const payload = {
        title, note, type, importance, estimated_minutes: Number(minutes) || 0,
        status: "active",
        bucket_id: bucketId === "none" ? null : bucketId,
        due_at: due || null,
      };
      if (scheduled) {
        const start = new Date(`${date}T${time}:00`);
        payload.planned_at = start.toISOString();
        payload.planned_end = new Date(start.getTime() + (Number(minutes) || 30) * 60000).toISOString();
      } else if (item?.planned_at) {
        payload.clear_planned = true;
      }
      if (bucketId === "none") payload.clear_bucket = true;
      if (item) await api.patch(`/items/${item.id}`, payload);
      else await api.post("/items", payload);
      toast.success(item ? "Mis à jour" : "Ajouté");
      qc.invalidateQueries();
      setOpen(false);
      onSaved && onSaved();
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-[#0F141C] border-white/10 text-foreground max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{item ? "Modifier" : "Nouvel élément"}</DialogTitle>
          <DialogDescription className="text-slate-500">Importance, durée, planification et échéance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Titre</Label>
              <Button type="button" size="sm" variant="ghost" onClick={runAi} disabled={aiLoading}
                data-testid="ai-suggest-btn" className="h-7 gap-1 text-xs text-primary hover:bg-primary/10">
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Suggérer (IA)
              </Button>
            </div>
            <Input data-testid="item-title-input" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Appeler le comptable" className="bg-white/5 border-white/10" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TYPES).map(([k, t]) => (
              <button key={k} type="button" onClick={() => setType(k)} data-testid={`type-${k}`}
                className={`rounded-lg border py-2 text-xs transition-colors ${type === k ? "border-primary/50 bg-primary/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Importance</Label>
            <div className="grid grid-cols-4 gap-2">
              {IMPORTANCE.map((i) => (
                <button key={i.value} type="button" onClick={() => setImportance(i.value)} data-testid={`importance-${i.value}`}
                  className={`rounded-lg border py-2 text-[11px] transition-all ${importance === i.value ? "text-white" : "text-slate-400 hover:bg-white/5"}`}
                  style={importance === i.value ? { borderColor: i.color, background: `${i.color}22` } : { borderColor: "rgba(255,255,255,0.1)" }}>
                  {i.emoji}<br />{i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Durée estimée — {fmtDuration(minutes)}</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <button key={p.value} type="button" onClick={() => setMinutes(p.value)} data-testid={`dur-${p.value}`}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${Number(minutes) === p.value ? "border-primary/50 bg-primary/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                  {p.label}
                </button>
              ))}
              <Input type="number" min="0" step="5" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                className="w-20 h-8 bg-white/5 border-white/10 text-xs" data-testid="item-minutes-input" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">📅 Planifier</p>
                <p className="text-xs text-slate-500">Quand comptez-vous travailler dessus ?</p>
              </div>
              <Switch checked={scheduled} onCheckedChange={setScheduled} data-testid="schedule-switch" />
            </div>
            {scheduled && (
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/10" data-testid="item-date-input" />
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-white/5 border-white/10" data-testid="item-time-input" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">⏰ Échéance</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="bg-white/5 border-white/10" data-testid="item-due-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">🗂️ Bucket</Label>
              <Select value={bucketId} onValueChange={setBucketId}>
                <SelectTrigger className="bg-white/5 border-white/10" data-testid="item-bucket-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0F141C] border-white/10 text-foreground">
                  <SelectItem value="none">Aucun</SelectItem>
                  {buckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.emoji} {b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="bg-white/5 border-white/10 min-h-[60px]" data-testid="item-note-input" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving} data-testid="item-save-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
