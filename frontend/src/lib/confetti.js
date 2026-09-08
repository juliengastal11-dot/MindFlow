import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#6366F1", "#10B981", "#F59E0B", "#F8FAFC"];
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors }), 150);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors }), 250);
}
