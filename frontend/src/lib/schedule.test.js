import { describe, it, expect } from "vitest";
import { layoutDay, gridRange, freeGaps, fittingTasks, eventBounds, fmtH, fmtHM, snapMinutes, snapUp } from "@/lib/schedule";

const day = new Date(2026, 8, 8); // mardi 8 septembre 2026
const at = (h, m = 0) => new Date(2026, 8, 8, h, m).toISOString();
const item = (id, hour, minutes, extra = {}) => ({
  id, title: id, status: "active", type: "task", importance: "aucune", estimated_minutes: minutes,
  planned_at: at(hour), planned_end: new Date(new Date(at(hour)).getTime() + minutes * 60000).toISOString(), ...extra,
});

describe("eventBounds", () => {
  it("convertit un créneau en minutes depuis minuit", () => {
    expect(eventBounds(item("a", 9, 60), day)).toEqual({ start: 540, end: 600 });
  });
  it("impose 15 minutes visibles au minimum", () => {
    expect(eventBounds(item("a", 9, 5), day)).toEqual({ start: 540, end: 555 });
  });
  it("utilise l'estimation quand il n'y a pas d'heure de fin", () => {
    expect(eventBounds({ ...item("a", 9, 45), planned_end: null }, day)).toEqual({ start: 540, end: 585 });
  });
});

describe("layoutDay", () => {
  it("place les blocs disjoints sur une seule colonne", () => {
    const out = layoutDay([item("b", 11, 30), item("a", 9, 60)], day);
    expect(out.map((b) => b.item.id)).toEqual(["a", "b"]);
    expect(out.map((b) => [b.col, b.cols])).toEqual([[0, 1], [0, 1]]);
  });
  it("répartit les chevauchements en colonnes", () => {
    const out = layoutDay([item("a", 9, 60), item("b", 9, 30), item("c", 10, 30)], day);
    const byId = Object.fromEntries(out.map((b) => [b.item.id, b]));
    expect(byId.a.cols).toBe(2);
    expect(byId.a.col).toBe(0);
    expect(byId.b.col).toBe(1);
    expect(byId.c.cols).toBe(1); // commence quand « a » finit : nouveau groupe
  });
});

describe("gridRange", () => {
  it("couvre 6h-22h par défaut", () => {
    expect(gridRange([], day)).toEqual({ start: 360, end: 1320 });
  });
  it("s'élargit quand un élément déborde", () => {
    expect(gridRange([item("tard", 23, 30)], day).end).toBe(1440);
    expect(gridRange([item("tot", 5, 30)], day).start).toBe(300);
  });
});

describe("freeGaps", () => {
  it("trouve les trous entre 8h et 19h en ignorant les tâches terminées", () => {
    const now = new Date(2026, 8, 7, 12); // un autre jour : journée entière
    const gaps = freeGaps([item("a", 10, 60), item("b", 14, 30, { status: "done" })], day, { now });
    expect(gaps).toEqual([
      { start: 480, end: 600, minutes: 120 },
      { start: 660, end: 1140, minutes: 480 },
    ]);
  });
  it("commence au prochain quart d'heure si c'est aujourd'hui", () => {
    const gaps = freeGaps([], day, { now: new Date(2026, 8, 8, 13, 7) });
    expect(gaps).toEqual([{ start: 13 * 60 + 15, end: 19 * 60, minutes: 345 }]);
  });
  it("ne propose rien après la fin de journée", () => {
    expect(freeGaps([], day, { now: new Date(2026, 8, 8, 20) })).toEqual([]);
  });
  it("ignore les trous plus courts que 15 minutes", () => {
    const now = new Date(2026, 8, 7, 12);
    const gaps = freeGaps([item("a", 8, 10), item("b", 8, 20, { planned_at: at(8, 20), planned_end: at(18, 50) })], day, { now });
    expect(gaps.map((g) => g.minutes)).toEqual([]);
  });
});

describe("fittingTasks", () => {
  const tasks = [
    { id: "a", status: "active", type: "task", importance: "aucune", estimated_minutes: 30 },
    { id: "b", status: "active", type: "task", importance: "prioritaire", estimated_minutes: 60 },
    { id: "c", status: "active", type: "task", importance: "important", estimated_minutes: 120 },
    { id: "d", status: "active", type: "idea", importance: "prioritaire", estimated_minutes: 15 },
    { id: "e", status: "active", type: "task", importance: "urgent", estimated_minutes: 15, planned_at: at(9) },
    { id: "f", status: "parked", type: "task", importance: "prioritaire", estimated_minutes: 15 },
    { id: "g", status: "active", type: "task", importance: "important", estimated_minutes: 45, due_at: "2026-09-09" },
    { id: "h", status: "active", type: "task", importance: "important", estimated_minutes: 45 },
  ];
  it("garde les tâches actives non planifiées qui rentrent, par importance puis échéance", () => {
    expect(fittingTasks(tasks, 60).map((t) => t.id)).toEqual(["b", "g", "h"]);
  });
  it("respecte la limite et la durée", () => {
    expect(fittingTasks(tasks, 60, 2)).toHaveLength(2);
    expect(fittingTasks(tasks, 20).map((t) => t.id)).toEqual([]);
    expect(fittingTasks(tasks, 30).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("formats et arrondis", () => {
  it("formate les heures", () => {
    expect(fmtH(600)).toBe("10h");
    expect(fmtH(630)).toBe("10h30");
    expect(fmtHM(65)).toBe("01:05");
    expect(fmtHM(1440)).toBe("24:00");
  });
  it("arrondit au quart d'heure", () => {
    expect(snapMinutes(37)).toBe(30);
    expect(snapMinutes(38)).toBe(45);
    expect(snapUp(31)).toBe(45);
    expect(snapUp(45)).toBe(45);
  });
});
