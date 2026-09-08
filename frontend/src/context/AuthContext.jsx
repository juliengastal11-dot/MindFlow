import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiError, setToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=anon, object=user
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(false);
      return false;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data?.access_token) setToken(data.access_token);
      setUser(data);
      return data;
    } catch (e) { setError(apiError(e)); throw e; }
  };

  const register = async (email, password, name) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      if (data?.access_token) setToken(data.access_token);
      setUser(data);
      return data;
    } catch (e) { setError(apiError(e)); throw e; }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setToken(null);
    setUser(false);
  };

  const patchUser = (partial) => setUser((u) => (u ? { ...u, ...partial } : u));

  return (
    <AuthContext.Provider value={{ user, error, setError, login, register, logout, refresh, patchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
