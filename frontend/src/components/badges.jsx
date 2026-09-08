import React from "react";
import { IMPORTANCE_MAP, TYPES, fmtDuration } from "@/lib/constants";

export function ImportanceTag({ importance, size = "sm" }) {
  const info = IMPORTANCE_MAP[importance] || IMPORTANCE_MAP.aucune;
  if (!importance || importance === "aucune")
    return <span className="text-[10px] text-slate-500">⚪</span>;
  return (
    <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border ${size === "xs" ? "text-[9px]" : "text-[10px]"}`}
      style={{ color: info.color, borderColor: `${info.color}55`, background: `${info.color}1a` }}>
      {info.emoji} {info.label}
    </span>
  );
}

export function ImportanceBar({ importance }) {
  const info = IMPORTANCE_MAP[importance] || IMPORTANCE_MAP.aucune;
  return <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: info.color }} />;
}

export function TypeTag({ type }) {
  const t = TYPES[type];
  if (!t) return null;
  return <span className="text-[10px] text-slate-500">{t.emoji} {t.label}</span>;
}

export function DurationChip({ minutes }) {
  if (!minutes) return null;
  return <span className="text-[11px] font-mono text-slate-400">{fmtDuration(minutes)}</span>;
}
