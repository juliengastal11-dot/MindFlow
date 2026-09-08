import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { INTERESTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, patchUser } = useAuth();
  const [selected, setSelected] = useState(user?.interests || []);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected((s) => s.includes(key) ? s.filter((k) => k !== key) : s.length >= 3 ? s : [...s, key]);
  };

  const finish = async () => {
    if (selected.length === 0) { toast.error("Choisissez au moins un centre d'intérêt"); return; }
    setSaving(true);
    try {
      const { data } = await api.patch("/settings", { onboarded: true, interests: selected });
      patchUser(data);
      navigate("/app/aujourdhui", { replace: true });
    } catch (e) { toast.error(apiError(e)); setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative grain">
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div>
          <span className="font-heading font-bold text-xl">MindFlow</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Quels sont vos centres d'intérêt prioritaires ?</h1>
          <p className="text-slate-400 mt-2">Choisissez jusqu'à 3 domaines. Vous pourrez les modifier plus tard dans votre profil.</p>
          <p className="text-xs font-mono text-primary mt-1" data-testid="onboarding-count">{selected.length}/3 sélectionnés</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
          {INTERESTS.map((it, i) => {
            const active = selected.includes(it.key);
            return (
              <motion.button
                key={it.key} onClick={() => toggle(it.key)} data-testid={`interest-${it.key}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`relative rounded-2xl overflow-hidden border text-left group ${active ? "border-primary ring-2 ring-primary/40" : "border-white/10 hover:border-white/25"}`}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={it.image} alt={it.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold">{it.emoji} {it.label}</p>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-end">
          <Button onClick={finish} disabled={saving} data-testid="onboarding-finish-btn" size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 px-8">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
