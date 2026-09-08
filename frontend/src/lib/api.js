import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "mindflow_token";

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Fuseau horaire du navigateur : le backend calcule « aujourd'hui » et la semaine avec.
try {
  api.defaults.headers.common["X-Timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
} catch {
  /* ignoré */
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Une erreur est survenue.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((d) => (d && typeof d.msg === "string" ? d.msg : JSON.stringify(d))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
