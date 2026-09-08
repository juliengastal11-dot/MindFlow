export const CATEGORIES = ["Marketing", "Ventes", "Produit", "Opérations", "Finance", "RH", "Autre"];

export const IMPORTANCE = [
  { value: "prioritaire", label: "Prioritaire", emoji: "🔴", color: "#EF4444", quadrant: "Urgent et important", rule: "Je dois le faire" },
  { value: "important", label: "Important", emoji: "🟠", color: "#F97316", quadrant: "Important mais pas urgent", rule: "Je dois le planifier" },
  { value: "urgent", label: "Urgent", emoji: "🟡", color: "#EAB308", quadrant: "Urgent mais pas important", rule: "Je dois le traiter sans y passer trop de temps" },
  { value: "aucune", label: "Normale", emoji: "⚪", color: "#64748B", quadrant: "Ni urgent ni important", rule: "Le reste attend" },
];
export const IMPORTANCE_MAP = IMPORTANCE.reduce((a, i) => ((a[i.value] = i), a), {});
export const IMPORTANCE_ORDER = ["prioritaire", "important", "urgent", "aucune"];

export const TYPES = {
  task: { label: "Tâche", emoji: "✅" },
  idea: { label: "Idée", emoji: "💡" },
  note: { label: "Note", emoji: "📝" },
};

export const TRIAGE_ACTIONS = [
  { action: "planifier", label: "Planifier", emoji: "📅", color: "#38BDF8" },
  { action: "tache", label: "Tâche", emoji: "✅", color: "#10B981" },
  { action: "idee", label: "Idée", emoji: "💡", color: "#F59E0B" },
  { action: "bucket", label: "Bucket", emoji: "🗂️", color: "#A78BFA" },
  { action: "note", label: "Note", emoji: "📝", color: "#94A3B8" },
  { action: "parking", label: "Parking", emoji: "🅿️", color: "#6366F1" },
  { action: "ignorer", label: "Ignorer", emoji: "🗑️", color: "#EF4444" },
];

export const DURATION_PRESETS = [
  { value: 5, label: "⚡ 5 min" },
  { value: 15, label: "🕐 15 min" },
  { value: 30, label: "🕑 30 min" },
  { value: 60, label: "🕓 1 h" },
  { value: 120, label: "🧱 +2 h" },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: "À l'heure de fin" },
  { value: 15, label: "15 min après" },
  { value: 30, label: "30 min après" },
  { value: 60, label: "1 heure après" },
  { value: -1, label: "Désactivé" },
];

export const INTERESTS = [
  { key: "entrepreneuriat", label: "Entrepreneuriat", emoji: "💼", image: "https://images.unsplash.com/photo-1529119368496-2dfda6ec2804?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxlbnRyZXByZW5ldXIlMjBidXNpbmVzcyUyMHN0cmF0ZWd5JTIwZGFya3xlbnwwfHx8fDE3ODg4OTUyNTB8MA&ixlib=rb-4.1.0&q=85" },
  { key: "marketing", label: "Marketing", emoji: "📣", image: "https://images.unsplash.com/photo-1683721003111-070bcc053d8b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nJTIwc29jaWFsJTIwbWVkaWF8ZW58MHx8fHwxNzg4ODk1MjUwfDA&ixlib=rb-4.1.0&q=85" },
  { key: "tech", label: "Développement / Tech", emoji: "💻", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRldmVsb3BlciUyMGNvZGluZyUyMHNjcmVlbnxlbnwwfHx8fDE3ODg4OTUyNTB8MA&ixlib=rb-4.1.0&q=85" },
  { key: "design", label: "Design", emoji: "🎨", image: "https://images.unsplash.com/photo-1621111848501-8d3634f82336?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwY3JlYXRpdmUlMjB3b3Jrc3BhY2V8ZW58MHx8fHwxNzg4ODk1MjUwfDA&ixlib=rb-4.1.0&q=85" },
  { key: "ventes", label: "Ventes", emoji: "🤝", image: "https://images.unsplash.com/photo-1672380135241-c024f7fbfa13?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwxfHxzYWxlcyUyMGhhbmRzaGFrZSUyMG1lZXRpbmd8ZW58MHx8fHwxNzg4ODk1MjUwfDA&ixlib=rb-4.1.0&q=85" },
  { key: "finance", label: "Finance", emoji: "💰", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxmaW5hbmNlJTIwaW52ZXN0aW5nJTIwY2hhcnRzfGVufDB8fHx8MTc4ODg5NTI1MHww&ixlib=rb-4.1.0&q=85" },
  { key: "immobilier", label: "Immobilier", emoji: "🏠", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwbW9kZXJuJTIwaG91c2V8ZW58MHx8fHwxNzg4ODk1MjUwfDA&ixlib=rb-4.1.0&q=85" },
  { key: "contenu", label: "Contenu / Réseaux", emoji: "🎬", image: "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb250ZW50JTIwY3JlYXRpb24lMjBjYW1lcmElMjBzdHVkaW98ZW58MHx8fHwxNzg4ODk1MjUwfDA&ixlib=rb-4.1.0&q=85" },
  { key: "bienetre", label: "Bien-être / Productivité", emoji: "🧘", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHx3ZWxsbmVzcyUyMHByb2R1Y3Rpdml0eSUyMGNhbG0lMjBtaW5pbWFsfGVufDB8fHx8MTc4ODg5NTI1MHww&ixlib=rb-4.1.0&q=85" },
];

export function fmtDuration(mins) {
  const m = Number(mins) || 0;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h}h${String(r).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${r} min`;
}
export function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
export function fmtTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}
