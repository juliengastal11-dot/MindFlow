import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/api";
import { ItemCard } from "@/components/ItemCard";
import { ItemDialog } from "@/components/ItemDialog";
import { IMPORTANCE_MAP, fmtTime } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h..21h

function pad(n) { return String(n).padStart(2, "0"); }
function dstr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function startOfWeek(d) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
}

export default function Planning() {
  const qc = useQueryClient();
  const [view, setView] = useState("semaine");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [day, setDay] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [dragId, setDragId] = useState(null);
  const [planCtx, setPlanCtx] = useState(null); // {date, hour}

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "planned"],
    queryFn: async () => (await api.get("/items?status=active,done&planned=true")).data,
  });

  const move = async (id, targetDate, targetHour) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const cur = new Date(it.planned_at);
    const dur = it.planned_end ? (new Date(it.planned_end) - cur) / 60000 : (it.estimated_minutes || 30);
    const start = new Date(targetDate);
    start.setHours(targetHour != null ? targetHour : cur.getHours(), targetHour != null ? 0 : cur.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + dur * 60000);
    try {
      await api.patch(`/items/${id}`, { planned_at: start.toISOString(), planned_end: end.toISOString() });
      qc.invalidateQueries();
    } catch (e) { toast.error(apiError(e)); }
  };

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const forDate = (d) => items.filter((it) => dstr(new Date(it.planned_at)) === dstr(d)).sort((a, b) => new Date(a.planned_at) - new Date(b.planned_at));
  const todayStr = dstr(new Date());

  const shift = (n) => {
    if (view === "semaine") { const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d); }
    else { const d = new Date(day); d.setDate(d.getDate() + n); setDay(d); }
  };

  const rangeLabel = view === "semaine"
    ? `${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
    : day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Planning</h1>
          <p className="text-slate-400 mt-1 text-sm">Glissez-déposez vos tâches pour les replanifier.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-white/10 p-0.5">
            {["semaine", "jour"].map((v) => (
              <button key={v} onClick={() => setView(v)} data-testid={`view-${v}`}
                className={`px-4 py-1.5 rounded-full text-xs capitalize transition-colors ${view === v ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => shift(-1)} data-testid="plan-prev" className="gap-1 text-slate-300 hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></Button>
        <div className="flex items-center gap-2 text-sm font-medium capitalize"><CalendarDays className="w-4 h-4 text-primary" /> {rangeLabel}</div>
        <Button variant="ghost" size="sm" onClick={() => shift(1)} data-testid="plan-next" className="gap-1 text-slate-300 hover:bg-white/5"><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : view === "semaine" ? (
        <div className="grid gap-3 lg:grid-cols-7" data-testid="plan-week">
          {days.map((d, i) => (
            <div key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && move(dragId, d, null)}
              className={`rounded-2xl border p-3 min-h-[140px] ${dstr(d) === todayStr ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.02]"}`}
              data-testid={`plan-day-${dstr(d)}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <div><p className="text-xs text-slate-500">{DAYS[i]}</p><p className={`font-heading font-bold ${dstr(d) === todayStr ? "text-primary" : ""}`}>{d.getDate()}</p></div>
                <button onClick={() => setPlanCtx({ date: dstr(d) })} data-testid={`plan-add-${dstr(d)}`} className="text-slate-500 hover:text-white"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {forDate(d).map((it) => (
                  <ItemCard key={it.id} item={it} mini draggable onDragStart={(x) => setDragId(x.id)} />
                ))}
                {forDate(d).length === 0 && <p className="text-[11px] text-slate-600 text-center py-2">—</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" data-testid="plan-day-view">
          {HOURS.map((h) => {
            const slot = items.filter((it) => dstr(new Date(it.planned_at)) === dstr(day) && new Date(it.planned_at).getHours() === h);
            return (
              <div key={h} onDragOver={(e) => e.preventDefault()} onDrop={() => dragId && move(dragId, day, h)}
                className="flex border-b border-white/5 last:border-0 min-h-[64px]" data-testid={`hour-${h}`}>
                <div className="w-16 shrink-0 text-right pr-3 pt-2 text-xs font-mono text-slate-500">{pad(h)}:00</div>
                <div className="flex-1 p-2 space-y-2 border-l border-white/5">
                  {slot.map((it) => <ItemCard key={it.id} item={it} compact draggable onDragStart={(x) => setDragId(x.id)} />)}
                  <button onClick={() => setPlanCtx({ date: dstr(day) })} className="text-[11px] text-slate-600 hover:text-slate-400">+ ajouter</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {planCtx && (
        <ItemDialog defaultAction="planifier" defaultDate={planCtx.date} open={!!planCtx} onOpenChange={(v) => !v && setPlanCtx(null)} />
      )}
    </div>
  );
}
