import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/lib/api";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Trash2, ParkingCircle } from "lucide-react";
import { toast } from "sonner";

const SWATCHES = ["#6366F1", "#10B981", "#F59E0B", "#38BDF8", "#A78BFA", "#F472B6", "#EF4444", "#94A3B8"];
const EMOJIS = ["📁", "💡", "🏠", "💼", "✈️", "🛒", "🎬", "🏝️", "📚", "🎯", "🍽️", "🏋️"];

function BucketDialog({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [color, setColor] = useState("#6366F1");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error("Nom requis"); return; }
    setSaving(true);
    try { await api.post("/buckets", { name, emoji, color }); toast.success("Bucket créé"); setOpen(false); setName(""); onSaved && onSaved(); }
    catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="add-bucket-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white gap-2"><Plus className="w-4 h-4" /> Nouveau bucket</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0F141C] border-white/10 text-foreground max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Nouveau bucket</DialogTitle><DialogDescription className="text-slate-500">Un espace pour vos projets, idées ou envies.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Nom</Label><Input data-testid="bucket-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Idées d'app" className="bg-white/5 border-white/10" /></div>
          <div className="space-y-2"><Label className="text-xs">Icône</Label>
            <div className="flex flex-wrap gap-2">{EMOJIS.map((e) => <button key={e} onClick={() => setEmoji(e)} className={`w-9 h-9 rounded-lg border text-lg ${emoji === e ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"}`}>{e}</button>)}</div>
          </div>
          <div className="space-y-2"><Label className="text-xs">Couleur</Label>
            <div className="flex flex-wrap gap-2">{SWATCHES.map((c) => <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />)}</div>
          </div>
        </div>
        <DialogFooter><Button onClick={save} disabled={saving} data-testid="bucket-save-btn" className="rounded-full bg-primary hover:bg-primary/90 text-white">{saving ? "..." : "Créer"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Buckets() {
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries();
  const { data: buckets = [], isLoading } = useQuery({ queryKey: ["buckets"], queryFn: async () => (await api.get("/buckets")).data });
  const { data: items = [] } = useQuery({ queryKey: ["items", "bucketed"], queryFn: async () => (await api.get("/items?status=active,parked")).data });

  const parked = items.filter((i) => i.status === "parked");
  const inBucket = (id) => items.filter((i) => i.status === "active" && i.bucket_id === id);

  const delBucket = async (id) => {
    try { await api.delete(`/buckets/${id}`); toast.success("Bucket supprimé"); refetch(); } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Buckets</h1>
          <p className="text-slate-400 mt-1 text-sm">Vos projets, idées, envies et listes.</p>
        </div>
        <BucketDialog onSaved={refetch} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6" data-testid="buckets-list">
          {/* Parking */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5" data-testid="parking-section">
            <div className="flex items-center gap-2 mb-3">
              <ParkingCircle className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold">Parking</h2>
              <span className="text-xs font-mono text-slate-500">{parked.length}</span>
            </div>
            {parked.length === 0 ? (
              <p className="text-sm text-slate-500">Rien en attente. Mettez ici les idées à ne pas oublier sans vous encombrer.</p>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-3">🅿️ Vous avez {parked.length} élément(s) en parking. Envie d'en faire quelque chose ?</p>
                <div className="space-y-2">{parked.map((it) => <ItemCard key={it.id} item={it} compact />)}</div>
              </>
            )}
          </div>

          {buckets.map((b) => {
            const list = inBucket(b.id);
            return (
              <div key={b.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5" data-testid={`bucket-${b.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.emoji}</span>
                    <h2 className="font-heading font-semibold" style={{ color: b.color }}>{b.name}</h2>
                    <span className="text-xs font-mono text-slate-500">{list.length}</span>
                  </div>
                  {!b.is_default && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><button data-testid={`del-bucket-${b.id}`} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#0F141C] border-white/10 text-foreground">
                        <AlertDialogHeader><AlertDialogTitle>Supprimer ce bucket ?</AlertDialogTitle><AlertDialogDescription className="text-slate-400">Les éléments seront conservés mais retirés du bucket.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10">Annuler</AlertDialogCancel><AlertDialogAction onClick={() => delBucket(b.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-600">Vide. Triez un élément de l'inbox vers ce bucket.</p>
                ) : (
                  <div className="space-y-2">{list.map((it) => <ItemCard key={it.id} item={it} compact />)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
