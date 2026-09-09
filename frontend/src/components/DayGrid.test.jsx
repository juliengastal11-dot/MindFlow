import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiError: (e) => String(e),
}));

import { DayGrid } from "@/components/DayGrid";

const day = new Date(2026, 8, 8);
const at = (h, m = 0) => new Date(2026, 8, 8, h, m).toISOString();
const item = (id, hour, minutes, extra = {}) => ({
  id, title: id, status: "active", type: "task", importance: "aucune", estimated_minutes: minutes,
  planned_at: at(hour), planned_end: new Date(new Date(at(hour)).getTime() + minutes * 60000).toISOString(), ...extra,
});

function renderGrid(props) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DayGrid day={day} items={[]} unplanned={[]} {...props} />
    </QueryClientProvider>
  );
}

describe("DayGrid", () => {
  it("positionne les blocs selon l'heure et la durée", () => {
    renderGrid({ items: [item("a", 9, 60)] });
    const block = screen.getByTestId("day-block-a");
    expect(block.style.top).toBe("192px"); // (9h - 6h) × 64 px
    expect(block.style.height).toBe("64px");
    expect(block.style.width).toBe("calc(100% - 6px)");
    expect(block).toHaveTextContent("09:00 – 10:00 · 1h");
  });

  it("partage la largeur quand deux blocs se chevauchent", () => {
    renderGrid({ items: [item("a", 9, 60), item("b", 9, 30)] });
    expect(screen.getByTestId("day-block-a").style.width).toBe("calc(50% - 6px)");
    expect(screen.getByTestId("day-block-b").style.left).toBe("calc(50% + 2px)");
  });

  it("résume le temps libre d'un jour à venir et propose de caser une tâche", () => {
    const future = new Date(2099, 0, 5);
    const client = new QueryClient();
    const unplanned = [{ id: "t1", title: "Relire le contrat", status: "active", type: "task", importance: "important", estimated_minutes: 30 }];
    render(
      <QueryClientProvider client={client}>
        <DayGrid day={future} items={[]} unplanned={unplanned} onSchedule={vi.fn()} />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("day-free-summary")).toHaveTextContent("11h de libre");
    fireEvent.click(screen.getByTestId("gap-480"));
    expect(screen.getByTestId("gap-suggestions")).toHaveTextContent("Relire le contrat");
  });

  it("ouvre la création à l'heure cliquée", () => {
    const onCreate = vi.fn();
    renderGrid({ onCreate });
    const canvas = screen.getByTestId("day-grid-canvas");
    canvas.getBoundingClientRect = () => ({ top: 0, left: 0, width: 500, height: 1024 });
    fireEvent.click(canvas, { clientY: 4 * 64 + 16 }); // 10h15
    expect(onCreate).toHaveBeenCalledWith("10:15");
  });
});
