import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { user, login, register, error, setError } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  useEffect(() => { setError(""); }, [mode, setError]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      toast.success(mode === "login" ? "Connexion réussie" : "Compte créé avec succès");
      navigate("/app", { replace: true });
    } catch {
      /* error shown below */
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode("login");
    setEmail("demo@mindflow.app");
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative grain flex items-center justify-center px-6">
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <button
        onClick={() => navigate("/")} data-testid="back-home-btn"
        className="absolute top-6 left-6 z-10 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Accueil
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">MindFlow</span>
        </div>

        <div className="rounded-2xl border border-white/10 glass p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {mode === "login" ? "Bon retour" : "Créer un compte"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === "login" ? "Connectez-vous pour accéder à vos idées." : "Commencez à organiser vos idées business."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" data-testid="auth-name-input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom" className="bg-white/5 border-white/10" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="auth-email-input" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" data-testid="auth-password-input" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/10" />
            </div>

            {error && (
              <p data-testid="auth-error" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" data-testid="auth-submit-btn" disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-400">
            {mode === "login" ? (
              <>Pas encore de compte ?{" "}
                <button data-testid="switch-register-btn" onClick={() => setMode("register")} className="text-primary hover:underline">Créer un compte</button>
              </>
            ) : (
              <>Déjà inscrit ?{" "}
                <button data-testid="switch-login-btn" onClick={() => setMode("login")} className="text-primary hover:underline">Se connecter</button>
              </>
            )}
          </div>

          <button onClick={fillDemo} data-testid="demo-fill-btn"
            className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono">
            Utiliser le compte démo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
