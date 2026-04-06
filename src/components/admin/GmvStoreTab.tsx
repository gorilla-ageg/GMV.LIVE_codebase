import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Play, Pause, Pencil, Package, ExternalLink, Upload, Search } from "lucide-react";
import { GMV_STORE_BRAND_ID } from "@/lib/gmv-store";
import GmvStoreProductForm from "./GmvStoreProductForm";
import GmvStoreCsvUpload from "./GmvStoreCsvUpload";

const GmvStoreTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editProduct, setEditProduct] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDedupe, setConfirmDedupe] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["gmv-store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", GMV_STORE_BRAND_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmv-store-products"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["gmv-store-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelected(new Set());
      setConfirmBulkDelete(false);
      toast({ title: `${count} product${count !== 1 ? "s" : ""} deleted` });
    },
    onError: (err: Error) => {
      setConfirmBulkDelete(false);
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!products) return;
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  // Find duplicates by title (case-insensitive)
  const duplicateTitles = new Set<string>();
  if (products) {
    const titleCount: Record<string, number> = {};
    products.forEach((p) => {
      const key = p.title.toLowerCase().trim();
      titleCount[key] = (titleCount[key] || 0) + 1;
    });
    Object.entries(titleCount).forEach(([key, count]) => {
      if (count > 1) duplicateTitles.add(key);
    });
  }

  // Compute duplicate IDs to delete (keep newest of each title, delete the rest)
  const duplicateIdsToDelete: string[] = [];
  if (products) {
    const grouped: Record<string, typeof products> = {};
    products.forEach((p) => {
      const key = p.title.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    Object.values(grouped).forEach((group) => {
      if (group.length <= 1) return;
      // Sort by created_at descending — keep first (newest), delete rest
      const sorted = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      sorted.slice(1).forEach((p) => duplicateIdsToDelete.push(p.id));
    });
  }

  // Filter products
  const filtered = products?.filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      const matches = p.title.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s);
      if (!matches) return false;
    }
    return true;
  });

  const editing = editProduct ? products?.find((p) => p.id === editProduct) : null;

  if (showCsv) {
    return (
      <div className="mt-4">
        <GmvStoreCsvUpload onClose={() => setShowCsv(false)} />
      </div>
    );
  }

  if (showForm || editing) {
    return (
      <div className="mt-4">
        <GmvStoreProductForm
          product={editing ? { ...editing, affiliate_link: editing.affiliate_link ?? null, images: editing.images ?? null } : undefined}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered?.length ?? 0} of {products?.length ?? 0} products
          </p>
          {selected.size > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              {selected.size} selected
            </Badge>
          )}
          {duplicateTitles.size > 0 && (
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
              {duplicateTitles.size} duplicate title{duplicateTitles.size !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)} className="gap-2 rounded-full">
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowCsv(true)} className="gap-2 rounded-full" size="sm">
            <Upload className="h-3.5 w-3.5" /> CSV Import
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2 rounded-full" size="sm">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, category, description..."
            className="pl-9 h-10"
          />
        </div>
        {duplicateIdsToDelete.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDedupe(true)}
            className="gap-1.5 shrink-0 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {duplicateIdsToDelete.length} Duplicate{duplicateIdsToDelete.length !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <div className="py-16 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No GMV Store products yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first product or import via CSV</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCsv(true)} className="gap-2 rounded-full" size="sm">
              <Upload className="h-3.5 w-3.5" /> CSV Import
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2 rounded-full" size="sm">
              <Plus className="h-3.5 w-3.5" /> Create Product
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/30">
            <Checkbox
              checked={filtered!.length > 0 && selected.size === filtered!.length}
              onCheckedChange={() => {
                if (!filtered) return;
                if (selected.size === filtered.length) setSelected(new Set());
                else setSelected(new Set(filtered.map((p) => p.id)));
              }}
            />
            <span className="text-xs text-muted-foreground">
              {selected.size === filtered!.length ? "Deselect all" : `Select all ${filtered!.length}`}
            </span>
          </div>

          {filtered!.map((p) => {
            const isDuplicate = duplicateTitles.has(p.title.toLowerCase().trim());
            return (
            <div key={p.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${isDuplicate ? "border-amber-500/30 bg-amber-500/5" : selected.has(p.id) ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <Checkbox
                checked={selected.has(p.id)}
                onCheckedChange={() => toggleSelect(p.id)}
              />
              {/* Thumbnail */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <img src="/images/gmv-logo-mark.svg" alt="GMV" className="h-5 w-5" />
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {p.category && <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>}
                  <Badge variant="outline" className={`text-[10px] capitalize ${p.status === "active" ? "text-emerald-400 border-emerald-500/30" : "text-muted-foreground"}`}>
                    {p.status}
                  </Badge>
                  {(p.budget_min != null || p.budget_max != null) && (
                    <span className="text-[10px] text-muted-foreground">${p.budget_min ?? "?"} – ${p.budget_max ?? "?"}</span>
                  )}
                  {p.images && p.images.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{p.images.length} img</span>
                  )}
                  {p.affiliate_link && (
                    <a href={p.affiliate_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                      <ExternalLink className="h-2.5 w-2.5" /> Link
                    </a>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setEditProduct(p.id)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                {p.status === "active" ? (
                  <Button size="sm" variant="outline" onClick={() => toggleStatus.mutate({ id: p.id, status: "paused" })}>
                    <Pause className="h-3 w-3 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleStatus.mutate({ id: p.id, status: "active" })}>
                    <Play className="h-3 w-3 mr-1" /> Activate
                  </Button>
                )}
              </div>
            </div>
          ); })}
        </>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={(open) => { if (!open) setConfirmBulkDelete(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} product{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selected.size} product{selected.size !== 1 ? "s" : ""} from the GMV Store. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selected))}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selected.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dedupe confirmation */}
      <AlertDialog open={confirmDedupe} onOpenChange={(open) => { if (!open) setConfirmDedupe(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {duplicateIdsToDelete.length} duplicate{duplicateIdsToDelete.length !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will keep the newest version of each duplicate title and delete {duplicateIdsToDelete.length} older cop{duplicateIdsToDelete.length !== 1 ? "ies" : "y"}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 text-background hover:bg-amber-600"
              onClick={() => {
                setConfirmDedupe(false);
                bulkDeleteMutation.mutate(duplicateIdsToDelete);
              }}
            >
              Delete Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GmvStoreTab;
