import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  Bell,
  Edit2,
  ExternalLink,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  show_description: boolean;
  show_button: boolean;
  dismissible: boolean;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  title: "",
  description: "",
  button_text: "",
  button_url: "",
  show_description: true,
  show_button: false,
  dismissible: true,
  active: true,
};

const AdminAnnouncements = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.show_description ? form.description : null,
        button_text: form.show_button ? form.button_text : null,
        button_url: form.show_button ? form.button_url : null,
        show_description: form.show_description,
        show_button: form.show_button,
        dismissible: form.dismissible,
        active: form.active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
      toast({ title: isPt ? "Aviso salvo!" : "Announcement saved!" });
      closeDialog();
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
      toast({ title: isPt ? "Aviso removido" : "Announcement removed" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      description: a.description || "",
      button_text: a.button_text || "",
      button_url: a.button_url || "",
      show_description: a.show_description,
      show_button: a.show_button,
      dismissible: a.dismissible,
      active: a.active,
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
            {isPt ? "Avisos" : "Announcements"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt
              ? "Gerencie avisos exibidos para os usuários"
              : "Manage announcements shown to users"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isPt ? "Novo Aviso" : "New Announcement"}
        </Button>
      </div>

      {/* Preview */}
      {announcements.filter((a) => a.active).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isPt ? "Preview (como o usuário vê)" : "Preview (user view)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements
              .filter((a) => a.active)
              .map((a) => (
                <div
                  key={a.id}
                  className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 mb-2"
                >
                  {a.dismissible && (
                    <div className="absolute right-2 top-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-sm">{a.title}</p>
                      {a.show_description && a.description && (
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      )}
                      {a.show_button && a.button_text && (
                        <Button size="sm" variant="outline" className="h-7 text-xs mt-1 gap-1">
                          {a.button_text}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isPt ? "Nenhum aviso criado" : "No announcements created"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className={!a.active ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{a.title}</span>
                    <Badge variant={a.active ? "default" : "secondary"} className="text-[10px]">
                      {a.active ? (isPt ? "Ativo" : "Active") : (isPt ? "Inativo" : "Inactive")}
                    </Badge>
                    {!a.dismissible && (
                      <Badge variant="outline" className="text-[10px]">
                        {isPt ? "Não fechável" : "Not dismissible"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleDateString()}
                    {a.show_description && " · " + (isPt ? "Com descrição" : "With description")}
                    {a.show_button && " · " + (isPt ? "Com botão" : "With button")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={a.active}
                    onCheckedChange={(active) =>
                      toggleActiveMutation.mutate({ id: a.id, active })
                    }
                  />
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(a.id)}
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
              <Megaphone className="h-5 w-5" />
              {editingId
                ? isPt ? "Editar Aviso" : "Edit Announcement"
                : isPt ? "Novo Aviso" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{isPt ? "Título" : "Title"} *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isPt ? "Ex: Manutenção programada" : "Ex: Scheduled maintenance"}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">{isPt ? "Mostrar descrição" : "Show description"}</Label>
              <Switch
                checked={form.show_description}
                onCheckedChange={(v) => setForm({ ...form, show_description: v })}
              />
            </div>
            {form.show_description && (
              <div>
                <Label>{isPt ? "Descrição" : "Description"}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={isPt ? "Detalhes do aviso..." : "Announcement details..."}
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">{isPt ? "Mostrar botão" : "Show button"}</Label>
              <Switch
                checked={form.show_button}
                onCheckedChange={(v) => setForm({ ...form, show_button: v })}
              />
            </div>
            {form.show_button && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>{isPt ? "Texto do botão" : "Button text"}</Label>
                  <Input
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    placeholder={isPt ? "Saiba mais" : "Learn more"}
                  />
                </div>
                <div>
                  <Label>{isPt ? "URL do botão" : "Button URL"}</Label>
                  <Input
                    value={form.button_url}
                    onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">
                  {isPt ? "Usuário pode fechar" : "User can dismiss"}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {isPt
                    ? "Se desativado, o aviso fica fixo e não pode ser fechado"
                    : "If disabled, the announcement stays fixed and can't be closed"}
                </p>
              </div>
              <Switch
                checked={form.dismissible}
                onCheckedChange={(v) => setForm({ ...form, dismissible: v })}
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
              disabled={!form.title.trim() || saveMutation.isPending}
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

export default AdminAnnouncements;
