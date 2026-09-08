import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/api";
import { ItemCard } from "@/components/ItemCard";
import { ItemDialog } from "@/components/ItemDialog";
import { DayGrid } from "@/components/DayGrid";
import { Button } from "@/components/ui/button";
import { fmtTime } from "@/lib/constants";
import { SNAP_MIN } from "@/lib/schedule";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

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
  const [planCtx, setPlanCtx] = useState(null); // { date, time? }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "planned"],
    queryFn: async () => (await api.get("/items?status=active,done&planned=true")).data,
  });
  const { data: unplanned = [] } = useQuery({
    queryKey: ["items", "unplanned"],
    queryFn: async () => (await api.get("/items?status=active&planned=false")).data,
  });

  const patch = async (id, payload, okMessage) => {
    try {
      await api.patch(`/items/${id}`, payload);
      qc.invalidateQueries();
      if (okMessage) toast.success(okMessage);
    } catch (e) { toast.error(apiError(e)); }
  };

  const durationOf = (it) =>
    it.planned_at && it.planned_end
      ? Math.max(SNAP_MIN, Math.round((new Date(it.planned_end) - new Date(it.planned_at)) / 60000))
      : (it.estimated_minutes || 30);

  // Déplacement vers une date + heure précises (vue jour)
  const moveToTime = async (id, start) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const end = new Date(start.getTime() + durationOf(it) * 60000);
    await patch(id, { planned_at: start.toISOString(), planned_end: end.toISOString() });
  };

  // Déplacement vers un autre jour (vue semaine) : conserve l'heure
  const move = async (id, targetDate, targetHour) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const cur = new Date(it.planned_at);
    const start = new Date(targetDate);
    start.setHours(targetHour != null ? targetHour : cur.getHours(), targetHour != null ? 0 : cur.getMinutes(), 0, 0);
    await moveToTime(id, start);
  };

  // Nouvelle heure de fin (poignée du bloc) : met aussi à jour la durée estimée
  const resizeTo = async (id, end) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const minutes = Math.max(SNAP_MIN, Math.round((end - new Date(it.planned_at)) / 60000));
    await patch(id, { planned_end: end.toISOString(), estimated_minutes: minutes });
  };

  // Caser une tâche non planifiée dans un créneau libre
  const scheduleAt = async (item, start) => {
    const end = new Date(start.getTime() + (item.estimated_minutes || 30) * 60000);
    await patch(item.id, { planned_at: start.toISOString(), planned_end: end.toISOString(), status: "active" }, `Planifié à ${fmtTime(start.toISOString())}`);
  };

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const forDate = (d) => items.filter((it) => dstr(new Date(it.planned_at)) === dstr(d)).sort((a, b) => new Date(a.planned_at) - new Date(b.planned_at));
  const todayStr = dstr(new Date());

  const shift = (n) => {
    if (view === "semaine") { const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d); }
    else { const d = new Date(day); d.setDate(d.getDate() + n); setDay(d); }
  };
  const goToday = () => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    setDay(d); setWeekStart(startOfWeek(d));
  };
  const openDay = (d) => { setDay(new Date(d)); setView("jour"); };

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
          <Button variant="ghost" size="sm" onClick={goToday} data-testid="plan-today" className="text-slate-300 hover:bg-white/5">Aujourd'hui</Button>
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
                <button type="button" onClick={() => openDay(d)} className="text-left" title="Ouvrir la vue jour" data-testid={`plan-open-${dstr(d)}`}>
                  <p className="text-xs text-slate-500">{DAYS[i]}</p>
                  <p className={`font-heading font-bold ${dstr(d) === todayStr ? "text-primary" : ""}`}>{d.getDate()}</p>
                </button>
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
        <DayGrid
          day={day}
          items={forDate(day)}
          unplanned={unplanned}
          onMove={moveToTime}
          onResize={resizeTo}
          onCreate={(time) => setPlanCtx({ date: dstr(day), time })}
          onSchedule={scheduleAt}
        />
      )}

      {planCtx && (
        <ItemDialog defaultAction="planifier" defaultDate={planCtx.date} defaultTime={planCtx.time} open={!!planCtx} onOpenChange={(v) => !v && setPlanCtx(null)} />
      )}
    </div>
  );
}
