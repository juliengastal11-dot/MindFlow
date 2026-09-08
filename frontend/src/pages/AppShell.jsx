import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useReminders } from "@/lib/reminders";
import { CaptureDialog } from "@/components/CaptureDialog";
import { FocusDialog } from "@/components/FocusDialog";
import { Button } from "@/components/ui/button";
import {
  Home, Inbox, CalendarDays, FolderKanban, BarChart3, Settings as SettingsIcon,
  Sparkles, LogOut, Menu, X, Plus, Target,
} from "lucide-react";

const NAV = [
  { to: "/app/aujourdhui", label: "Aujourd'hui", icon: Home, testid: "nav-today" },
  { to: "/app/inbox", label: "Inbox", icon: Inbox, testid: "nav-inbox" },
  { to: "/app/planning", label: "Planning", icon: CalendarDays, testid: "nav-planning" },
  { to: "/app/buckets", label: "Buckets", icon: FolderKanban, testid: "nav-buckets" },
  { to: "/app/apercu", label: "Vue d'ensemble", icon: BarChart3, testid: "nav-overview" },
  { to: "/app/parametres", label: "Paramètres", icon: SettingsIcon, testid: "nav-settings" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [capture, setCapture] = useState(false);
  const [focus, setFocus] = useState(false);

  useReminders(user);

  const { data: overview } = useQuery({ queryKey: ["overview"], queryFn: async () => (await api.get("/overview")).data });
  const inboxCount = overview?.inbox_count || 0;

  const doLogout = async () => { await logout(); navigate("/"); };

  const Side = () => (
    <>
      <div className="flex items-center gap-2 px-2 py-1 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="font-heading font-bold text-lg tracking-tight">MindFlow</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} data-testid={item.testid} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive ? "bg-primary/15 text-white border border-primary/30" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
            <item.icon className="w-[18px] h-[18px]" /> {item.label}
            {item.to === "/app/inbox" && inboxCount > 0 && (
              <span className="ml-auto text-[10px] font-mono bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{inboxCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="px-3 py-2 text-xs text-slate-500 truncate" data-testid="current-user-email">{user?.email}</div>
        <Button onClick={doLogout} data-testid="logout-btn" variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
          <LogOut className="w-[18px] h-[18px]" /> Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/5 bg-[#0F141C] p-4">
        <Side />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F141C] border-r border-white/10 p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <Side />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between">
          <button className="lg:hidden text-slate-300" onClick={() => setOpen(!open)} data-testid="mobile-menu-btn">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="text-sm text-slate-400 hidden sm:block">
            Bonjour, <span className="text-white font-medium">{user?.name || user?.email}</span>
          </div>
          <div className="lg:hidden flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><span className="font-heading font-bold">MindFlow</span></div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setFocus(true)} data-testid="open-focus-btn" variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
              <Target className="w-4 h-4" /> <span className="hidden sm:inline">Focus</span>
            </Button>
            <Button onClick={() => setCapture(true)} data-testid="open-capture-btn" size="sm" className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Capturer</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24">
          <Outlet />
        </main>
      </div>

      {/* Floating capture button (mobile) */}
      <button onClick={() => setCapture(true)} data-testid="fab-capture-btn"
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform">
        <Plus className="w-7 h-7" />
      </button>

      <CaptureDialog open={capture} onOpenChange={setCapture} />
      <FocusDialog open={focus} onOpenChange={setFocus} />
    </div>
  );
}
