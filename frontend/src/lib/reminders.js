import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ASKED_KEY = "mindflow_reminded";

function getAsked() {
  try { return new Set(JSON.parse(localStorage.getItem(ASKED_KEY) || "[]")); } catch { return new Set(); }
}
function saveAsked(set) {
  localStorage.setItem(ASKED_KEY, JSON.stringify([...set].slice(-200)));
}

// Poll active items; after an item's planned_end + delay, ask "Avez-vous fini cette tâche ?"
export function useReminders(user) {
  const qc = useQueryClient();
  const ref = useRef(null);

  useEffect(() => {
    if (!user || user === false) return;
    const delay = user.reminder_delay_minutes;
    if (delay === -1 || delay === undefined || delay === null) return;

    const check = async () => {
      let items = [];
      try { items = (await api.get("/items?status=active")).data; } catch { return; }
      const asked = getAsked();
      const now = Date.now();
      for (const it of items) {
        if (!it.planned_end || it.status === "done") continue;
        const trigger = new Date(it.planned_end).getTime() + delay * 60000;
        if (now >= trigger && !asked.has(it.id)) {
          asked.add(it.id);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = new Notification("Avez-vous fini cette tâche ?", { body: it.title, tag: it.id });
            n.onclick = () => window.focus();
          }
          toast(`Avez-vous fini « ${it.title} » ?`, {
            duration: 15000,
            action: {
              label: "✅ Oui",
              onClick: async () => { try { await api.patch(`/items/${it.id}`, { status: "done" }); qc.invalidateQueries(); toast.success("Bien joué !"); } catch {} },
            },
            cancel: {
              label: "Reporter",
              onClick: async () => { try { await api.post(`/items/${it.id}/postpone`, { planned_at: new Date(now + 3600000).toISOString(), planned_end: new Date(now + 3600000 + (it.estimated_minutes || 30) * 60000).toISOString() }); qc.invalidateQueries(); } catch {} },
            },
          });
        }
      }
      saveAsked(asked);
    };

    check();
    ref.current = setInterval(check, 45000);
    return () => clearInterval(ref.current);
  }, [user, qc]);
}

const RECAP_KEY = "mindflow_recap_shown";

/** Identifiant de semaine ISO (AAAA-Wnn) : lundi → dimanche. */
export function isoWeekId(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Le bilan est « dû » à partir du vendredi 17h et tout le week-end. */
export function isRecapDue(now = new Date()) {
  const day = now.getDay(); // 0 = dimanche
  return (day === 5 && now.getHours() >= 17) || day === 6 || day === 0;
}

// Une fois par semaine : « Ton bilan de la semaine est prêt » (toast + notification si autorisée)
export function useWeeklyRecap(user, onOpen) {
  useEffect(() => {
    if (!user || user === false) return;
    const check = () => {
      const now = new Date();
      if (!isRecapDue(now)) return;
      const id = isoWeekId(now);
      let shown = null;
      try { shown = localStorage.getItem(RECAP_KEY); } catch { /* ignoré */ }
      if (shown === id) return;
      try { localStorage.setItem(RECAP_KEY, id); } catch { /* ignoré */ }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification("📊 Ton bilan de la semaine est prêt", { body: "Tâches terminées, priorités, temps de travail et ce que tu repousses.", tag: "recap-" + id });
        n.onclick = () => { window.focus(); onOpen && onOpen(); };
      }
      toast("📊 Ton bilan de la semaine est prêt", {
        duration: 15000,
        action: { label: "Voir le bilan", onClick: () => onOpen && onOpen() },
      });
    };
    check();
    const timer = setInterval(check, 30 * 60000);
    return () => clearInterval(timer);
  }, [user, onOpen]);
}
