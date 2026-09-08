import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtDuration } from "@/lib/constants";
import { ItemCard } from "@/components/ItemCard";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Flame, Clock, Inbox, RotateCcw, AlertTriangle, CalendarCheck, BarChart3 } from "lucide-react";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

function Stat({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="font-heading text-3xl font-bold">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </motion.div>
  );
}

function plural(n, one, many) { return n > 1 ? many : one; }

export function weekHeadline(week, offset) {
  if (!week) return "";
  const n = week.done_count;
  if (n === 0) return offset === 0 ? "Rien de terminé pour l'instant. La semaine ne fait que commencer ?" : "Aucune tâche terminée cette semaine-là.";
  const parts = [`${n} ${plural(n, "tâche terminée", "tâches terminées")}`];
  if (week.prio_done_count) parts.push(`dont ${week.prio_done_count} ${plural(week.prio_done_count, "priorité", "priorités")}`);
  const intro = week.prio_done_count >= 3 || n >= 10 ? "Belle semaine" : offset === 0 ? "Ta semaine" : "Semaine dernière";
  const time = week.minutes_done ? `, ${fmtDuration(week.minutes_done)} de travail` : "";
  return `${intro} : ${parts.join(" ")}${time}.`;
}

function WeekBars({ days, todayIso }) {
  const max = Math.max(1, ...days.map((d) => d.done));
  return (
    <div className="flex items-end gap-2 h-24" data-testid="week-bars">
      {days.map((d, i) => {
        const h = d.done ? Math.max(8, (d.done / max) * 100) : 4;
        const isToday = d.date === todayIso;
        const label = new Date(`${d.date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" });
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" title={`${label} : ${d.done} ${plural(d.done, "tâche terminée", "tâches terminées")}${d.minutes ? ` · ${fmtDuration(d.minutes)}` : ""}`}>
            {d.done > 0 && <span className="text-[10px] font-mono text-slate-400">{d.done}</span>}
            <div className={`w-full rounded-md transition-all ${d.done ? (isToday ? "bg-primary" : "bg-primary/50") : "bg-white/5"}`} style={{ height: `${h}%` }} />
            <span className={`text-[10px] font-mono ${isToday ? "text-primary font-bold" : "text-slate-500"}`}>{DAY_LETTERS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Overview() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: async () => (await api.get("/overview")).data });
  const { data: week } = useQuery({
    queryKey: ["overview", "week", offset],
    queryFn: async () => (await api.get(`/overview/week?offset=${offset}`)).data,
  });

  if (isLoading || !data)
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const rangeLabel = week
    ? `${new Date(`${week.week_start}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${new Date(`${week.week_end}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
    : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-slate-400 mt-1 text-sm">Votre semaine, vos retards et ce que vous repoussez souvent.</p>
      </div>

      {/* Bilan de la semaine */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-6 mb-6" data-testid="week-recap">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Bilan de la semaine</h2>
            <span className="text-xs font-mono text-slate-500">{rangeLabel}</span>
          </div>
          <div className="flex rounded-full border border-white/10 p-0.5 self-start">
            {[{ v: 0, l: "Cette semaine" }, { v: -1, l: "Semaine dernière" }].map((o) => (
              <button key={o.v} onClick={() => setOffset(o.v)} data-testid={`week-offset-${o.v}`}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${offset === o.v ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>{o.l}</button>
            ))}
          </div>
        </div>

        {!week ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <p className="text-lg font-medium mb-5" data-testid="week-headline">{weekHeadline(week, offset)}</p>
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
              <WeekBars days={week.days} todayIso={todayIso} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="font-heading font-bold">{week.done_count}</span><span className="text-slate-400">terminées</span></div>
                <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" /><span className="font-heading font-bold">{week.prio_done_count}</span><span className="text-slate-400">priorités</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><span className="font-heading font-bold">{fmtDuration(week.minutes_done)}</span><span className="text-slate-400">de travail</span></div>
                <div className="flex items-center gap-2"><Inbox className="w-4 h-4 text-primary" /><span className="font-heading font-bold">{week.captured_count}</span><span className="text-slate-400">capturées</span></div>
                <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-sky-400" /><span className="font-heading font-bold">{week.planned_done_count}/{week.planned_count}</span><span className="text-slate-400">créneaux honorés</span></div>
                <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-red-400" /><span className="font-heading font-bold">{week.postponed_count}</span><span className="text-slate-400">{plural(week.postponed_count, "report", "reports")}</span></div>
              </div>
            </div>
          </>
        )}
      </section>

      <h2 className="font-heading font-semibold mb-3">Cette semaine en chiffres</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={CheckCircle2} label="Tâches terminées" value={data.done_count} color="#10B981" delay={0} />
        <Stat icon={Flame} label="Priorités terminées" value={data.prio_done_count} color="#EF4444" delay={0.05} />
        <Stat icon={Clock} label="Temps de travail" value={fmtDuration(data.minutes_done)} color="#F59E0B" delay={0.1} />
        <Stat icon={Inbox} label="Idées capturées" value={data.captured_count} color="#6366F1" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4 text-amber-400" /><h2 className="font-heading font-semibold">En retard</h2><span className="text-xs font-mono text-slate-500">{data.overdue.length}</span></div>
          {data.overdue.length === 0 ? <p className="text-sm text-slate-600 py-4 text-center">Rien en retard 🎉</p> : (
            <div className="space-y-2" data-testid="overdue-list">{data.overdue.map((it) => <ItemCard key={it.id} item={it} compact />)}</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4"><RotateCcw className="w-4 h-4 text-red-400" /><h2 className="font-heading font-semibold">Ce que tu repousses souvent</h2></div>
          {data.often_postponed.length === 0 ? <p className="text-sm text-slate-600 py-4 text-center">Rien à signaler.</p> : (
            <div className="space-y-2" data-testid="postponed-list">
              {data.often_postponed.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <span className="text-red-400 font-mono text-sm shrink-0">↻{it.postpone_count}</span>
                  <p className="text-sm flex-1 truncate">{it.title}</p>
                  <span className="text-xs text-slate-500">reporté {it.postpone_count} fois</span>
                </div>
              ))}
            </div>
          )}
          {data.parking_count > 0 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-slate-300" data-testid="parking-prompt">
              🅿️ Vous avez {data.parking_count} élément(s) en parking. Pensez à les traiter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
