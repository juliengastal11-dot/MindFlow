import React, { useState } from "react";
import { api, apiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { TriageRow } from "@/components/TriageRow";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export function CaptureDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const reset = () => { setTitle(""); setCreated(null); setSaving(false); };
  const close = (v) => { if (!v) reset(); onOpenChange(v); };

  const capture = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post("/items", { title, status: "inbox" });
      setCreated(data);
      setTitle("");
      qc.invalidateQueries();
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-[#0F141C] border-white/10 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Capture rapide</DialogTitle>
          <DialogDescription className="text-slate-500">Notez ce qui vous passe par la tête. Vous trierez ensuite.</DialogDescription>
        </DialogHeader>

        {!created ? (
          <div className="flex gap-2 py-2">
            <Input autoFocus data-testid="capture-input" value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && capture()}
              placeholder="Ex : Appeler le comptable" className="bg-white/5 border-white/10" />
            <Button onClick={capture} disabled={saving} data-testid="capture-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Capturer"}
            </Button>
          </div>
        ) : (
          <div className="py-2 space-y-4" data-testid="capture-triage-step">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-sm font-medium">« {created.title} »</p>
              <p className="text-xs text-slate-500 mt-2">Qu'est-ce que vous voulez en faire ?</p>
              <div className="mt-2"><TriageRow item={created} /></div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCreated(null)} data-testid="capture-again-btn" className="text-slate-400 hover:bg-white/5">+ Capturer un autre</Button>
              <Button variant="ghost" onClick={() => close(false)} className="text-slate-400 hover:bg-white/5">Garder dans l'inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
