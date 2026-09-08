import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { INTERESTS, REMINDER_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, Download, LogOut, Mail, CheckCircle2, Link2, Unlink, Loader2, Info,
  Sparkles, Bell, KeyRound, Trash2, BellRing,
} from "lucide-react";
import { toast } from "sonner";

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT-4o mini)", url: "https://platform.openai.com/api-keys" },
  { value: "gemini", label: "Google Gemini (2.5 Flash)", url: "https://aistudio.google.com/app/apikey" },
  { value: "anthropic", label: "Anthropic Claude (Opus 5)", url: "https://platform.claude.com/settings/keys" },
];

export default function Settings() {
  const { user, logout, patchUser, refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);

  const [provider, setProvider] = useState(user?.ai_provider || "openai");
  const [apiKey, setApiKey] = useState("");
  const [delay, setDelay] = useState(String(user?.reminder_delay_minutes ?? 15));
  const [interests, setInterests] = useState(user?.interests || []);
  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  useEffect(() => {
    const st = params.get("calendar");
    if (st === "connected") { toast.success("Google Calendar connecté"); refresh(); }
    else if (st === "error") toast.error("Échec de la connexion Google Calendar");
    if (st) { params.delete("calendar"); setParams(params, { replace: true }); }
    // eslint-disable-next-line
  }, []);

  const saveProfile = async () => {
    try { const { data } = await api.patch("/settings", { name, interests }); patchUser(data); toast.success("Profil mis à jour"); }
    catch (e) { toast.error(apiError(e)); }
  };
  const toggleInterest = (k) => setInterests((s) => s.includes(k) ? s.filter((x) => x !== k) : s.length >= 3 ? s : [...s, k]);

  const saveDelay = async (v) => {
    setDelay(v);
    try { const { data } = await api.patch("/settings", { reminder_delay_minutes: Number(v) }); patchUser(data); toast.success("Rappel enregistré"); }
    catch (e) { toast.error(apiError(e)); }
  };

  const saveKey = async () => {
    if (!apiKey.trim()) { toast.error("Collez votre clé API"); return; }
    setBusy(true);
    try { const { data } = await api.post("/settings/ai-key", { provider, api_key: apiKey.trim() }); patchUser(data); setApiKey(""); toast.success("Clé IA enregistrée"); }
    catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };
  const delKey = async () => {
    try { const { data } = await api.delete("/settings/ai-key"); patchUser(data); toast.success("Clé IA supprimée"); }
    catch (e) { toast.error(apiError(e)); }
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") { toast.error("Notifications non supportées"); return; }
    const p = await Notification.requestPermission();
    if (p === "granted") { new Notification("MindFlow", { body: "Les rappels sont activés ✅" }); toast.success("Notifications activées"); }
    else toast.error("Notifications refusées");
  };

  const connectCal = async () => {
    setBusy(true);
    try { const { data } = await api.get("/oauth/calendar/connect"); window.location.href = data.authorization_url; }
    catch (e) { toast.error(apiError(e)); setBusy(false); }
  };
  const disconnectCal = async () => {
    setBusy(true);
    try { await api.post("/oauth/calendar/disconnect"); await refresh(); toast.success("Google Calendar déconnecté"); }
    catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  const install = async () => {
    if (!installEvent) { toast.info("Utilisez le menu du navigateur → « Installer l'application »."); return; }
    installEvent.prompt(); const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") toast.success("Application installée"); setInstallEvent(null);
  };

  const notifGranted = typeof Notification !== "undefined" && Notification.permission === "granted";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-slate-400 mt-1 text-sm">Profil, IA, rappels, agenda et installation.</p>
      </div>

      {/* Profile + interests */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
        <h2 className="font-heading font-semibold mb-4">Profil</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-slate-500" /><span className="text-slate-400">Email</span><span className="ml-auto font-medium" data-testid="settings-email">{user?.email}</span></div>
          <div className="space-y-2"><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10" data-testid="settings-name-input" /></div>
        </div>
        <Label className="text-xs mt-4 block">Centres d'intérêt (max 3)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {INTERESTS.map((it) => (
            <button key={it.key} onClick={() => toggleInterest(it.key)} data-testid={`settings-interest-${it.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${interests.includes(it.key) ? "border-primary bg-primary/15 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
              {it.emoji} {it.label}
            </button>
          ))}
        </div>
        <Button onClick={saveProfile} data-testid="save-profile-btn" className="mt-5 rounded-full bg-primary hover:bg-primary/90 text-white">Enregistrer</Button>
      </section>

      {/* AI */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-400" /></div>
          <div><h2 className="font-heading font-semibold">Assistant IA</h2><p className="text-xs text-slate-500">Branchez votre propre clé pour « Organiser » et « Suggérer ».</p></div>
          {user?.ai_key_set && <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400" data-testid="ai-key-set-badge"><CheckCircle2 className="w-4 h-4" /> Clé active</span>}
        </div>
        <div className="space-y-3">
          <div className="space-y-2"><Label className="text-xs">Fournisseur</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="ai-provider-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0F141C] border-white/10 text-foreground">{AI_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <a href={AI_PROVIDERS.find((p) => p.value === provider)?.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Obtenir une clé →</a>
          </div>
          <div className="space-y-2"><Label className="text-xs flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Clé API (stockée chiffrée)</Label>
            <div className="flex gap-2">
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-... / AIza... / sk-ant-..." className="bg-white/5 border-white/10" data-testid="ai-key-input" />
              <Button onClick={saveKey} disabled={busy} data-testid="save-ai-key-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}</Button>
            </div>
          </div>
          {user?.ai_key_set && <Button onClick={delKey} variant="ghost" data-testid="del-ai-key-btn" className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="w-4 h-4" /> Supprimer ma clé</Button>}
        </div>
      </section>

      {/* Reminders */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><Bell className="w-5 h-5 text-amber-400" /></div>
          <div><h2 className="font-heading font-semibold">Rappels</h2><p className="text-xs text-slate-500">« Avez-vous fini cette tâche ? » après l'heure de fin.</p></div>
        </div>
        <div className="space-y-3">
          <div className="space-y-2"><Label className="text-xs">Délai après l'heure de fin</Label>
            <Select value={delay} onValueChange={saveDelay}>
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="reminder-delay-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0F141C] border-white/10 text-foreground">{REMINDER_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={enableNotifications} data-testid="enable-notif-btn" variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
            <BellRing className="w-4 h-4" /> {notifGranted ? "Notifications activées" : "Activer les notifications"}
          </Button>
        </div>
      </section>

      {/* Google Calendar */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center"><Calendar className="w-5 h-5 text-sky-400" /></div>
          <div><h2 className="font-heading font-semibold">Google Calendar</h2><p className="text-xs text-slate-500">Synchronisez vos tâches planifiées.</p></div>
          {user?.google_calendar_connected && <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400" data-testid="calendar-connected-badge"><CheckCircle2 className="w-4 h-4" /> Connecté</span>}
        </div>
        {!user?.google_calendar_available ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm" data-testid="calendar-unavailable">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-slate-300">Non configuré. Fournissez <span className="font-mono text-amber-300">GOOGLE_CLIENT_ID</span> et <span className="font-mono text-amber-300">GOOGLE_CLIENT_SECRET</span> pour l'activer.</p>
          </div>
        ) : user?.google_calendar_connected ? (
          <Button onClick={disconnectCal} disabled={busy} data-testid="calendar-disconnect-btn" variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />} Déconnecter</Button>
        ) : (
          <Button onClick={connectCal} disabled={busy} data-testid="calendar-connect-btn" className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-white">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Connecter Google Calendar</Button>
        )}
      </section>

      {/* PWA + logout */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"><Download className="w-5 h-5 text-primary" /></div>
          <div><h2 className="font-heading font-semibold">Application</h2><p className="text-xs text-slate-500">Installez MindFlow sur votre écran d'accueil.</p></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={install} data-testid="pwa-install-btn" variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"><Download className="w-4 h-4" /> Installer</Button>
          <Button onClick={logout} data-testid="settings-logout-btn" variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"><LogOut className="w-4 h-4" /> Se déconnecter</Button>
        </div>
      </section>
    </div>
  );
}
