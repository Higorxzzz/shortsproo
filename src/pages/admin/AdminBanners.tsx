import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Edit2, Image, Loader2, Plus, Trash2, GripVertical, ExternalLink,
} from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const emptyForm = {
  title: "",
  image_url: "",
  link_url: "",
  active: true,
  sort_order: 0,
};

const AdminBanners = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title || null,
        image_url: form.image_url,
        link_url: form.link_url || null,
        active: form.active,
        sort_order: form.sort_order,
      };

      if (editingId) {
        const { error } = await supabase
          .from("dashboard_banners")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dashboard_banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-banners"] });
      toast({ title: isPt ? "Banner salvo!" : "Banner saved!" });
      closeDialog();
    },
    onError: () => toast({ title: isPt ? "Erro ao salvar" : "Error saving", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dashboard_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-banners"] });
      toast({ title: isPt ? "Banner removido" : "Banner removed" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("dashboard_banners").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-banners"] });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: banners.length });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title || "",
      image_url: b.image_url,
      link_url: b.link_url || "",
      active: b.active,
      sort_order: b.sort_order,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isPt ? "Banners do Dashboard" : "Dashboard Banners"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt
              ? "Gerencie imagens que aparecem no painel dos usuários"
              : "Manage images displayed on the user dashboard"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isPt ? "Novo Banner" : "New Banner"}
        </Button>
      </div>

      {/* Preview */}
      {banners.filter((b) => b.active).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isPt ? "Preview (como o usuário vê)" : "Preview (user view)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {banners
                .filter((b) => b.active)
                .map((b) => (
                  <div key={b.id} className="relative overflow-hidden rounded-xl border border-border">
                    <img
                      src={b.image_url}
                      alt={b.title || "Banner"}
                      className="w-full h-auto max-h-48 object-cover"
                    />
                    {b.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-sm font-semibold text-white">{b.title}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Image className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isPt ? "Nenhum banner criado" : "No banners created"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id} className={!b.active ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={b.image_url}
                    alt={b.title || "Banner"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {b.title || (isPt ? "Sem título" : "No title")}
                    </span>
                    <Badge variant={b.active ? "default" : "secondary"} className="text-[10px]">
                      {b.active ? (isPt ? "Ativo" : "Active") : (isPt ? "Inativo" : "Inactive")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {isPt ? "Ordem" : "Order"}: {b.sort_order}
                    {b.link_url && ` · ${b.link_url}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={b.active}
                    onCheckedChange={(active) =>
                      toggleActiveMutation.mutate({ id: b.id, active })
                    }
                  />
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(b)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(b.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {editingId
                ? isPt ? "Editar Banner" : "Edit Banner"
                : isPt ? "Novo Banner" : "New Banner"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{isPt ? "Título (opcional)" : "Title (optional)"}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isPt ? "Ex: Promoção especial" : "Ex: Special promotion"}
              />
            </div>

            <div>
              <Label>{isPt ? "URL da imagem" : "Image URL"} *</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
              {form.image_url && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-auto max-h-40 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>{isPt ? "Link ao clicar (opcional)" : "Click link (optional)"}</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>{isPt ? "Ordem de exibição" : "Display order"}</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">{isPt ? "Ativo" : "Active"}</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              {isPt ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.image_url.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {isPt ? "Salvar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
