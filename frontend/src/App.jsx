import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import AppShell from "@/pages/AppShell";
import Today from "@/pages/Today";
import Inbox from "@/pages/Inbox";
import Planning from "@/pages/Planning";
import Buckets from "@/pages/Buckets";
import Overview from "@/pages/Overview";
import Settings from "@/pages/Settings";
import { Loader2 } from "lucide-react";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Protected({ children, requireOnboarded = true }) {
  const { user } = useAuth();
  if (user === null) return <Loading />;
  if (user === false) return <Navigate to="/connexion" replace />;
  if (requireOnboarded && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingRoute() {
  const { user } = useAuth();
  if (user === null) return <Loading />;
  if (user === false) return <Navigate to="/connexion" replace />;
  if (user.onboarded) return <Navigate to="/app/aujourdhui" replace />;
  return <Onboarding />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/connexion" element={<Auth />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/app" element={<Protected><AppShell /></Protected>}>
              <Route index element={<Navigate to="/app/aujourdhui" replace />} />
              <Route path="aujourdhui" element={<Today />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="planning" element={<Planning />} />
              <Route path="buckets" element={<Buckets />} />
              <Route path="apercu" element={<Overview />} />
              <Route path="parametres" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors theme="dark" />
      </AuthProvider>
    </div>
  );
}

export default App;
