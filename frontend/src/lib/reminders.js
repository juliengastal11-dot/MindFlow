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
