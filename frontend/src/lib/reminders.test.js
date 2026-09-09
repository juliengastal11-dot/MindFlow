import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }, apiError: (e) => String(e) }));

import { isoWeekId, isRecapDue } from "@/lib/reminders";
import { fmtDuration } from "@/lib/constants";
import { weekHeadline } from "@/pages/Overview";

describe("isoWeekId", () => {
  it("numérote les semaines ISO (lundi → dimanche)", () => {
    expect(isoWeekId(new Date(2026, 8, 7))).toBe("2026-W37"); // lundi
    expect(isoWeekId(new Date(2026, 8, 13))).toBe("2026-W37"); // dimanche de la même semaine
    expect(isoWeekId(new Date(2026, 8, 14))).toBe("2026-W38");
    expect(isoWeekId(new Date(2026, 0, 1))).toBe("2026-W01");
  });
});

describe("isRecapDue", () => {
  it("à partir du vendredi 17h et tout le week-end", () => {
    expect(isRecapDue(new Date(2026, 8, 11, 16, 59))).toBe(false); // vendredi 16h59
    expect(isRecapDue(new Date(2026, 8, 11, 17, 0))).toBe(true); // vendredi 17h
    expect(isRecapDue(new Date(2026, 8, 12, 9))).toBe(true); // samedi
    expect(isRecapDue(new Date(2026, 8, 13, 23))).toBe(true); // dimanche
    expect(isRecapDue(new Date(2026, 8, 14, 9))).toBe(false); // lundi
  });
});

describe("fmtDuration", () => {
  it("affiche des durées lisibles", () => {
    expect(fmtDuration(45)).toBe("45 min");
    expect(fmtDuration(60)).toBe("1h");
    expect(fmtDuration(90)).toBe("1h30");
    expect(fmtDuration(0)).toBe("0 min");
  });
});

describe("weekHeadline", () => {
  it("adapte la phrase au bilan", () => {
    expect(weekHeadline({ done_count: 0 }, 0)).toContain("Rien de terminé");
    expect(weekHeadline({ done_count: 0 }, -1)).toContain("Aucune tâche terminée");
    expect(weekHeadline({ done_count: 1, prio_done_count: 0, minutes_done: 30 }, 0)).toBe("Ta semaine : 1 tâche terminée, 30 min de travail.");
    expect(weekHeadline({ done_count: 23, prio_done_count: 7, minutes_done: 700 }, 0)).toBe("Belle semaine : 23 tâches terminées dont 7 priorités, 11h40 de travail.");
  });
});
