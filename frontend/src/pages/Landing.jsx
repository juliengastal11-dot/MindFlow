import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Lightbulb, CalendarClock, ListChecks, CheckCircle2, ArrowRight,
  Timer, Sparkles, Download, LayoutGrid,
} from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1642665358815-310df20dc8dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZWxlZ2FudCUyMG1pbmltYWxpc3QlMjBkZXNrJTIwd29ya3NwYWNlfGVufDB8fHxibGFja3wxNzg4ODkxNjAwfDA&ixlib=rb-4.1.0&q=85";

const features = [
  { icon: Lightbulb, title: "Boîte à idées", desc: "Capturez chaque idée business en quelques secondes, avec catégorie et priorité.", color: "#6366F1" },
  { icon: Timer, title: "Estimation du temps", desc: "Saisissez le temps vous-même ou laissez l'app l'estimer selon la catégorie et la priorité.", color: "#F59E0B" },
  { icon: CalendarClock, title: "Agenda intelligent", desc: "Calez vos tâches directement dans l'agenda et synchronisez avec Google Calendar.", color: "#38BDF8" },
  { icon: CheckCircle2, title: "Validation horodatée", desc: "Suivez chaque idée jusqu'à sa mise en place et validez la date de réalisation.", color: "#10B981" },
];

const steps = [
  { n: "01", title: "À faire", desc: "Vos idées fraîches, prêtes à être planifiées.", color: "#6366F1" },
  { n: "02", title: "En cours", desc: "Les idées calées dans l'agenda, en cours de mise en place.", color: "#F59E0B" },
  { n: "03", title: "Mise en place", desc: "Validées et horodatées. Votre progression est concrète.", color: "#10B981" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goApp = () => navigate(user ? "/app" : "/connexion");

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden grain">
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="brand-logo">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">MindFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/connexion" data-testid="nav-login-link" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2">
              Se connecter
            </Link>
            <Button onClick={goApp} data-testid="nav-start-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white gap-1">
              Commencer <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono uppercase tracking-widest text-slate-400 mb-6">
            <Download className="w-3.5 h-3.5" /> Application PWA installable
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
            Transformez vos idées en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">actions concrètes</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
            Capturez toutes vos idées pour améliorer votre business, estimez le temps de chaque tâche,
            planifiez-les dans votre agenda et validez leur mise en place — le tout au même endroit.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button onClick={goApp} data-testid="hero-cta-btn" size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 px-7 text-base">
              Lancer l'application <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gratuit, sans carte bancaire
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-40" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={HERO_IMG} alt="Espace de travail" className="w-full h-[420px] object-cover" />
            <div className="absolute bottom-4 left-4 right-4 glass rounded-xl border border-white/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Idée validée</p>
                <p className="text-xs text-slate-400">Mise en place le 12 juin • 2h</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Workflow steps */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Le parcours d'une idée</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-10">
          Trois étapes, du flash à la réalisation
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="font-mono text-3xl font-bold" style={{ color: s.color }}>{s.n}</span>
              <h3 className="font-heading text-xl font-semibold mt-4">{s.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-7 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="font-heading text-xl font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-primary/10 to-transparent p-12">
          <ListChecks className="w-10 h-10 text-primary mx-auto mb-5" />
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Prêt à ne plus perdre une seule idée ?
          </h2>
          <p className="text-slate-400 mt-4 max-w-lg mx-auto">
            Créez votre compte et commencez à structurer vos idées business dès maintenant.
          </p>
          <Button onClick={goApp} data-testid="footer-cta-btn" size="lg" className="mt-8 rounded-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 px-8">
            Commencer gratuitement <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span className="font-heading font-semibold text-slate-300">MindFlow Business</span>
          <span>© {new Date().getFullYear()} — Application PWA</span>
        </div>
      </footer>
    </div>
  );
}
