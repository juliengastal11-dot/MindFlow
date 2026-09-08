import React, { useEffect, useMemo, useRef, useState } from "react";
import { IMPORTANCE_MAP, fmtDuration, fmtDate } from "@/lib/constants";
import {
  HOUR_PX, SNAP_MIN, WORK_START_HOUR, WORK_END_HOUR,
  startOfDay, sameDay, gridRange, layoutDay, freeGaps, fittingTasks,
  snapMinutes, minutesSinceMidnight, minutesToDate, fmtHM, fmtH,
} from "@/lib/schedule";
import { ItemDialog } from "@/components/ItemDialog";
import { ImportanceTag } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Sparkles, Plus } from "lucide-react";

const PPM = HOUR_PX / 60; // pixels par minute
const DAY_MIN = 24 * 60;

/**
 * Grille horaire d'une journée : blocs proportionnels à la durée, glisser pour déplacer,
 * tirer le bas d'un bloc pour ajuster la durée, clic sur un vide pour créer,
 * créneaux libres avec suggestions de tâches qui rentrent dedans.
 */
export function DayGrid({ day, items, unplanned = [], onMove, onResize, onCreate, onSchedule }) {
  const gridRef = useRef(null);
  const dragOffset = useRef(0);
  const resizingRef = useRef(null);
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState(null);
  const [gap, setGap] = useState(null);
  const [resizing, setResizing] = useState(null); // { id, end }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const range = useMemo(() => gridRange(items, day), [items, day]);
  const blocks = useMemo(() => layoutDay(items, day), [items, day]);
  const isToday = sameDay(day, now);
  const isPast = startOfDay(day) < startOfDay(now);
  const gaps = useMemo(() => (isPast ? [] : freeGaps(items, day, { now })), [items, day, now, isPast]);
  const freeTotal = gaps.reduce((sum, g) => sum + g.minutes, 0);
  const suggestions = useMemo(() => (gap ? fittingTasks(unplanned, gap.minutes) : []), [gap, unplanned]);
  const totalPx = (range.end - range.start) * PPM;
  const nowMin = minutesSinceMidnight(now);
  const hours = [];
  for (let m = range.start; m < range.end; m += 60) hours.push(m);

  const toDate = (min) => minutesToDate(day, min);
  const minutesAtY = (clientY, offset = 0) => {
    const rect = gridRef.current.getBoundingClientRect();
    const min = range.start + (clientY - rect.top - offset) / PPM;
    return Math.max(range.start, Math.min(range.end - SNAP_MIN, snapMinutes(min)));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/item");
    if (!id || !onMove) return;
    onMove(id, toDate(minutesAtY(e.clientY, dragOffset.current)));
    dragOffset.current = 0;
  };

  const handleBackgroundClick = (e) => {
    if (e.target.closest("[data-block]") || e.target.closest("[data-gap]")) return;
    onCreate && onCreate(fmtHM(minutesAtY(e.clientY)));
  };

  const startResize = (e, block) => {
    e.stopPropagation();
    e.preventDefault();
    const handle = e.currentTarget;
    const originY = e.clientY;
    const baseEnd = block.end;
    handle.setPointerCapture(e.pointerId);
    const onMoveHandler = (ev) => {
      const end = Math.max(block.start + SNAP_MIN, Math.min(DAY_MIN, snapMinutes(baseEnd + (ev.clientY - originY) / PPM)));
      resizingRef.current = { id: block.item.id, end };
      setResizing({ id: block.item.id, end });
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMoveHandler);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      const result = resizingRef.current;
      resizingRef.current = null;
      setResizing(null);
      if (result && result.end !== baseEnd && onResize) onResize(result.id, toDate(result.end));
    };
    handle.addEventListener("pointermove", onMoveHandler);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" data-testid="day-grid">
      {!isPast && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-slate-400" data-testid="day-free-summary">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          {freeTotal > 0 ? (
            <span>
              Environ <span className="text-white font-medium">{fmtDuration(freeTotal)}</span> de libre{" "}
              {isToday ? `d'ici ${fmtH(WORK_END_HOUR * 60)}` : `entre ${fmtH(WORK_START_HOUR * 60)} et ${fmtH(WORK_END_HOUR * 60)}`}
              {gaps.length > 1 ? ` (${gaps.length} créneaux)` : ""}.
            </span>
          ) : (
            <span>Plus de créneau libre {isToday ? "aujourd'hui" : "ce jour-là"} entre {fmtH(WORK_START_HOUR * 60)} et {fmtH(WORK_END_HOUR * 60)}.</span>
          )}
          <span className="ml-auto hidden md:inline text-slate-600">Clic sur un vide : ajouter · glisser : déplacer · tirer le bas d'un bloc : durée</span>
        </div>
      )}

      <div className="flex py-3 overflow-x-auto">
        <div className="w-14 shrink-0 relative" style={{ height: totalPx }}>
          {hours.map((m) => (
            <div key={m} className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-slate-500" style={{ top: (m - range.start) * PPM }}>
              {fmtHM(m)}
            </div>
          ))}
        </div>

        <div
          ref={gridRef}
          className="relative flex-1 min-w-[260px] border-l border-white/5 mr-3"
          style={{ height: totalPx }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleBackgroundClick}
          data-testid="day-grid-canvas"
        >
          {hours.map((m) => (
            <React.Fragment key={m}>
              <div className="absolute left-0 right-0 border-t border-white/5" style={{ top: (m - range.start) * PPM }} />
              <div className="absolute left-0 right-0 border-t border-dashed border-white/[0.04]" style={{ top: (m + 30 - range.start) * PPM }} />
            </React.Fragment>
          ))}

          {gaps.map((g) => {
            const height = (g.end - g.start) * PPM;
            return (
              <div key={g.start} data-gap className="absolute left-1 right-1 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] flex items-start justify-center pt-1.5 pointer-events-none"
                style={{ top: (g.start - range.start) * PPM, height }}>
                {height >= 30 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setGap(g); }} data-testid={`gap-${g.start}`}
                    className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-primary/30 bg-[#0F141C]/90 px-2.5 py-1 text-[11px] text-primary hover:bg-primary/10 transition-colors">
                    <Sparkles className="w-3 h-3" /> {fmtDuration(g.minutes)} libre · caser une tâche
                  </button>
                )}
              </div>
            );
          })}

          {blocks.map((b) => {
            const item = b.item;
            const info = IMPORTANCE_MAP[item.importance] || IMPORTANCE_MAP.aucune;
            const end = resizing?.id === item.id ? resizing.end : b.end;
            const height = Math.max(22, (end - b.start) * PPM);
            const done = item.status === "done";
            return (
              <div
                key={item.id}
                data-block
                draggable
                onDragStart={(e) => {
                  if (resizingRef.current) { e.preventDefault(); return; }
                  e.dataTransfer.setData("text/item", item.id);
                  dragOffset.current = e.clientY - e.currentTarget.getBoundingClientRect().top;
                }}
                onClick={() => setEditing(item)}
                title={item.title}
                data-testid={`day-block-${item.id}`}
                className={`absolute rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing select-none transition-[height] ${done ? "opacity-50" : ""}`}
                style={{
                  top: (b.start - range.start) * PPM,
                  height,
                  left: `calc(${(100 / b.cols) * b.col}% + 2px)`,
                  width: `calc(${100 / b.cols}% - 6px)`,
                  background: `${info.color}22`,
                  borderColor: `${info.color}66`,
                  borderLeftWidth: 3,
                }}
              >
                <div className="px-2 py-1 leading-tight">
                  <p className={`text-xs font-medium truncate ${done ? "line-through" : ""}`}>
                    {item.importance && item.importance !== "aucune" ? `${info.emoji} ` : ""}{item.title}
                  </p>
                  {height >= 36 && (
                    <p className="text-[10px] font-mono text-slate-400">{fmtHM(b.start)} – {fmtHM(end)} · {fmtDuration(end - b.start)}</p>
                  )}
                </div>
                <div onPointerDown={(e) => startResize(e, b)} draggable={false} data-testid={`day-resize-${item.id}`}
                  className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-white/10" />
              </div>
            );
          })}

          {isToday && nowMin >= range.start && nowMin <= range.end && (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (nowMin - range.start) * PPM }} data-testid="day-now-line">
              <div className="h-px bg-red-500/80" />
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </div>

      <ItemDialog item={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} />

      <Dialog open={!!gap} onOpenChange={(v) => !v && setGap(null)}>
        <DialogContent className="bg-[#0F141C] border-white/10 text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Créneau libre</DialogTitle>
            <DialogDescription className="text-slate-500">
              {gap && `${fmtDuration(gap.minutes)} disponibles entre ${fmtH(gap.start)} et ${fmtH(gap.end)}. Voici ce qui rentre dedans.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1" data-testid="gap-suggestions">
            {suggestions.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <ImportanceTag importance={item.importance} size="xs" />
                    <span className="font-mono">{fmtDuration(item.estimated_minutes || 30)}</span>
                    {item.due_at && <span>⏰ {fmtDate(item.due_at)}</span>}
                  </div>
                </div>
                <Button size="sm" data-testid={`fit-${item.id}`}
                  onClick={() => { const g = gap; setGap(null); onSchedule && onSchedule(item, toDate(g.start)); }}
                  className="rounded-full bg-primary hover:bg-primary/90 text-white shrink-0">
                  Planifier ici
                </Button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-sm text-slate-500 py-2">Aucune tâche non planifiée ne rentre dans ce créneau.</p>
            )}
            <Button variant="ghost" data-testid="gap-new-task"
              onClick={() => { const g = gap; setGap(null); onCreate && onCreate(fmtHM(g.start)); }}
              className="w-full gap-2 text-slate-300 hover:bg-white/5">
              <Plus className="w-4 h-4" /> Nouvelle tâche à {gap && fmtH(gap.start)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
