// Logique pure de la grille horaire (vue jour) : bornes, chevauchements, créneaux libres, tâches qui rentrent.
import { IMPORTANCE_ORDER } from "@/lib/constants";

export const DAY_START_HOUR = 6; // début de grille par défaut
export const DAY_END_HOUR = 22; // fin de grille par défaut
export const HOUR_PX = 64; // hauteur d'une heure en pixels
export const SNAP_MIN = 15; // pas de déplacement / redimensionnement
export const WORK_START_HOUR = 8; // plage « travail » pour les créneaux libres
export const WORK_END_HOUR = 19;
const DAY_MIN = 24 * 60;

const pad = (n) => String(n).padStart(2, "0");

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function minutesSinceMidnight(date) {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}

export function snapMinutes(min, step = SNAP_MIN) {
  return Math.round(min / step) * step;
}

export function snapUp(min, step = SNAP_MIN) {
  return Math.ceil(min / step) * step;
}

/** Minutes depuis minuit -> Date du jour donné (gère les changements d'heure). */
export function minutesToDate(day, min) {
  const d = startOfDay(day);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

/** 14:05 */
export function fmtHM(min) {
  const m = Math.max(0, Math.min(DAY_MIN, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** 14h / 14h30 (pour les phrases) */
export function fmtH(min) {
  const m = Math.max(0, Math.min(DAY_MIN, Math.round(min)));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${pad(r)}` : `${h}h`;
}

/** Bornes (minutes depuis minuit) d'un élément planifié sur un jour donné. */
export function eventBounds(item, day) {
  const start = new Date(item.planned_at);
  const s = sameDay(start, day) ? minutesSinceMidnight(start) : start < startOfDay(day) ? 0 : DAY_MIN;
  let e;
  if (item.planned_end) {
    const end = new Date(item.planned_end);
    e = sameDay(end, day) ? minutesSinceMidnight(end) : end < startOfDay(day) ? 0 : DAY_MIN;
  } else {
    e = s + (item.estimated_minutes || 30);
  }
  e = Math.min(DAY_MIN, Math.max(s + SNAP_MIN, e)); // au moins 15 min visibles
  return { start: s, end: e };
}

/** Bornes de la grille : 6h-22h, élargies si des éléments débordent. */
export function gridRange(items, day) {
  let start = DAY_START_HOUR * 60;
  let end = DAY_END_HOUR * 60;
  for (const item of items) {
    const b = eventBounds(item, day);
    start = Math.min(start, Math.floor(b.start / 60) * 60);
    end = Math.max(end, Math.ceil(b.end / 60) * 60);
  }
  return { start: Math.max(0, start), end: Math.min(DAY_MIN, end) };
}

/**
 * Place les éléments d'une journée : les chevauchements sont répartis en colonnes.
 * Retourne [{ item, start, end, col, cols }] trié par heure de début.
 */
export function layoutDay(items, day) {
  const events = items
    .map((item) => ({ item, ...eventBounds(item, day) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out = [];
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const columnEnds = [];
    for (const ev of cluster) {
      let col = columnEnds.findIndex((end) => end <= ev.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(ev.end);
      } else {
        columnEnds[col] = ev.end;
      }
      ev.col = col;
    }
    for (const ev of cluster) {
      ev.cols = columnEnds.length;
      out.push(ev);
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const ev of events) {
    if (cluster.length && ev.start >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  flush();
  return out;
}

/**
 * Créneaux libres dans la plage de travail (à partir de maintenant si c'est aujourd'hui).
 * Retourne [{ start, end, minutes }] en minutes depuis minuit.
 */
export function freeGaps(items, day, options = {}) {
  const {
    now = new Date(),
    workStart = WORK_START_HOUR * 60,
    workEnd = WORK_END_HOUR * 60,
    minGap = SNAP_MIN,
  } = options;
  let from = workStart;
  if (sameDay(day, now)) from = Math.max(from, snapUp(minutesSinceMidnight(now)));
  if (from >= workEnd) return [];

  const busy = items
    .filter((item) => item.status !== "done" && item.planned_at)
    .map((item) => eventBounds(item, day))
    .sort((a, b) => a.start - b.start);

  const gaps = [];
  let cursor = from;
  for (const block of busy) {
    if (block.end <= cursor) continue;
    if (block.start > cursor) gaps.push({ start: cursor, end: Math.min(block.start, workEnd) });
    cursor = Math.max(cursor, block.end);
    if (cursor >= workEnd) break;
  }
  if (cursor < workEnd) gaps.push({ start: cursor, end: workEnd });
  return gaps.filter((g) => g.end - g.start >= minGap).map((g) => ({ ...g, minutes: g.end - g.start }));
}

/** Tâches actives non planifiées qui tiennent dans un créneau, les plus importantes d'abord. */
export function fittingTasks(items, gapMinutes, limit = 3) {
  const rank = (item) => {
    const i = IMPORTANCE_ORDER.indexOf(item.importance || "aucune");
    return i === -1 ? IMPORTANCE_ORDER.length : i;
  };
  const duration = (item) => item.estimated_minutes || 30;
  return items
    .filter((item) => item.status === "active" && !item.planned_at && item.type === "task" && duration(item) <= gapMinutes)
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        String(a.due_at || "9999-12-31").localeCompare(String(b.due_at || "9999-12-31")) ||
        duration(b) - duration(a)
    )
    .slice(0, limit);
}
