import React, { useState, useEffect, useRef } from "react";
import { api, apiError } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IMPORTANCE_ORDER, IMPORTANCE_MAP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { celebrate } from "@/lib/confetti";
import { Target, Play, Pause, Check, RotateCcw, Plus } from "lucide-react";
import { toast } from "sonner";

const DURATIONS = [25, 45, 60];

export function FocusDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["items", "active"],
    queryFn: async () => (await api.get("/items?status=active")).data,
    enabled: open,
  });

  const [duration, setDuration] = useState(45);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(45 * 60);
  const [mission, setMission] = useState(null);
  const timer = useRef(null);

  const pickMission = React.useCallback(() => {
    const active = items.filter((i) => i.status === "active");
    active.sort((a, b) => IMPORTANCE_ORDER.indexOf(a.importance || "aucune") - IMPORTANCE_ORDER.indexOf(b.importance || "aucune"));
    setMission(active[0] || null);
  }, [items]);

  useEffect(() => { if (open) { pickMission(); setRunning(false); setRemaining(duration * 60); } }, [open, pickMission]); // eslint-disable-line
  useEffect(() => { if (!running) setRemaining(duration * 60); }, [duration, running]);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { clearInterval(timer.current); setRunning(false); onFinish(); return 0; }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(timer.current);
    }
  }, [running]); // eslint-disable-line

  const onFinish = () => {
    celebrate();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("⏱️ Session focus terminée !", { body: mission ? mission.title : "" });
    toast.success("Session focus terminée !");
  };

  const complete = async () => {
    if (mission) {
      try { await api.patch(`/items/${mission.id}`, { status: "done" }); celebrate(); qc.invalidateQueries(); } catch (e) { toast.error(apiError(e)); }
    }
    setRunning(false); onOpenChange(false);
  };
  const postpone = async () => {
    if (mission) {
      const tomorrow = new Date(Date.now() + 86400000);
      try { await api.post(`/items/${mission.id}/postpone`, { planned_at: tomorrow.toISOString() }); qc.invalidateQueries(); toast("Reporté à demain"); } catch {}
    }
    setRunning(false); onOpenChange(false);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const info = mission ? (IMPORTANCE_MAP[mission.importance] || IMPORTANCE_MAP.aucune) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F141C] border-white/10 text-foreground max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center justify-center gap-2"><Target className="w-5 h-5 text-primary" /> Focus</DialogTitle>
          <DialogDescription className="text-slate-500">Une mission, un minuteur, zéro distraction.</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-6">
          {!running && (
            <div className="flex justify-center gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)} data-testid={`focus-dur-${d}`}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${duration === d ? "border-primary/50 bg-primary/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                  {d} min
                </button>
              ))}
            </div>
          )}

          <div className="font-mono text-6xl font-bold tracking-tight" data-testid="focus-timer" style={{ color: running ? "#6366F1" : "#fff" }}>
            {mm}:{ss}
          </div>

          {mission ? (
            <div className="rounded-xl border p-4" style={{ borderColor: `${info.color}44`, background: `${info.color}12` }} data-testid="focus-mission">
              <p className="text-xs text-slate-500 mb-1">🎯 Mission du focus</p>
              <p className="text-sm font-medium" style={{ color: info.color }}>{info.emoji} {mission.title}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucune tâche active. Ajoutez-en une pour vous concentrer.</p>
          )}

          {!running ? (
            <Button onClick={() => setRunning(true)} disabled={!mission} data-testid="focus-start-btn" className="w-full rounded-full bg-primary hover:bg-primary/90 text-white gap-2 h-11">
              <Play className="w-4 h-4" /> Démarrer
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setRunning(false)} variant="outline" className="bg-white/5 border-white/10 gap-2"><Pause className="w-4 h-4" /> Pause</Button>
              <Button onClick={complete} className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="focus-done-btn"><Check className="w-4 h-4" /> Terminé</Button>
              <Button onClick={postpone} variant="outline" className="bg-white/5 border-white/10 gap-2"><RotateCcw className="w-4 h-4" /> Reporter</Button>
              <Button onClick={() => setRemaining((r) => r + 300)} variant="outline" className="bg-white/5 border-white/10 gap-2"><Plus className="w-4 h-4" /> +5 min</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
