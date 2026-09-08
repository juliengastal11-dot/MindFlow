import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtDuration } from "@/lib/constants";
import { ItemCard } from "@/components/ItemCard";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Flame, Clock, Inbox, RotateCcw, AlertTriangle } from "lucide-react";

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

export default function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: async () => (await api.get("/overview")).data });
  if (isLoading || !data)
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-slate-400 mt-1 text-sm">Votre semaine, vos retards et ce que vous repoussez souvent.</p>
      </div>

      <h2 className="font-heading font-semibold mb-3">Ta semaine</h2>
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
