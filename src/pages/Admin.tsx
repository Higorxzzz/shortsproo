import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Film, Settings, Plus, Upload } from "lucide-react";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { t } = useLanguage();
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t.admin.title}</h1>
      <Tabs defaultValue="users">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />{t.admin.users}</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><Settings className="h-4 w-4" />{t.admin.plans}</TabsTrigger>
          <TabsTrigger value="videos" className="gap-2"><Film className="h-4 w-4" />{t.admin.videos}</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="plans"><AdminPlans /></TabsContent>
        <TabsContent value="videos"><AdminVideos /></TabsContent>
      </Tabs>
    </div>
  );
};

const AdminUsers = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, plans(name)");
      return data || [];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*");
      return data || [];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário atualizado!");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.manageUsers}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.userName}</TableHead>
              <TableHead>{t.admin.userEmail}</TableHead>
              <TableHead>{t.admin.userPlan}</TableHead>
              <TableHead>{t.admin.userStatus}</TableHead>
              <TableHead>{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>
                  <select
                    className="rounded border border-input bg-background px-2 py-1 text-sm"
                    value={user.plan_id || ""}
                    onChange={(e) => updateUser.mutate({ userId: user.id, updates: { plan_id: e.target.value || null } })}
                  >
                    <option value="">-</option>
                    {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <Badge variant={user.suspended ? "destructive" : "default"}>
                    {user.suspended ? "Suspenso" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateUser.mutate({ userId: user.id, updates: { suspended: !user.suspended } })}
                  >
                    {user.suspended ? t.admin.activate : t.admin.suspend}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AdminPlans = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", shorts_per_day: 1, price: 0, description: "" });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("shorts_per_day");
      return data || [];
    },
  });

  const addPlan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("plans").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setOpen(false);
      setForm({ name: "", shorts_per_day: 1, price: 0, description: "" });
      toast.success("Plano criado!");
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano atualizado!");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t.admin.managePlans}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />{t.admin.addPlan}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.admin.addPlan}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div><Label>{t.admin.planName}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>{t.admin.planShorts}</Label><Input type="number" value={form.shorts_per_day} onChange={(e) => setForm({ ...form, shorts_per_day: Number(e.target.value) })} /></div>
              <div><Label>{t.admin.planPrice}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>{t.admin.planDesc}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={() => addPlan.mutate()}>{t.admin.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.planName}</TableHead>
              <TableHead>{t.admin.planShorts}</TableHead>
              <TableHead>{t.admin.planPrice}</TableHead>
              <TableHead>{t.admin.planDesc}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan: any) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Input
                    defaultValue={plan.name}
                    className="h-8 w-32"
                    onBlur={(e) => { if (e.target.value !== plan.name) updatePlan.mutate({ id: plan.id, updates: { name: e.target.value } }); }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={plan.shorts_per_day}
                    className="h-8 w-20"
                    onBlur={(e) => { const v = Number(e.target.value); if (v !== plan.shorts_per_day) updatePlan.mutate({ id: plan.id, updates: { shorts_per_day: v } }); }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={plan.price}
                    className="h-8 w-24"
                    onBlur={(e) => { const v = Number(e.target.value); if (v !== plan.price) updatePlan.mutate({ id: plan.id, updates: { price: v } }); }}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{plan.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AdminVideos = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");
  const [form, setForm] = useState({ user_id: "", title: "", drive_link: "" });
  const [filterUser, setFilterUser] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name, email");
      return data || [];
    },
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["admin-videos", filterUser],
    queryFn: async () => {
      let q = supabase.from("videos").select("*, profiles(name, email)").order("uploaded_at", { ascending: false });
      if (filterUser) q = q.eq("user_id", filterUser);
      const { data } = await q;
      return data || [];
    },
  });

  const uploadVideo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("videos").insert({
        user_id: form.user_id,
        title: form.title,
        drive_link: form.drive_link,
        status: "new",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      setForm({ user_id: "", title: "", drive_link: "" });
      toast.success("Vídeo enviado!");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />{t.admin.uploadVideo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>{t.admin.selectUser}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              >
                <option value="">--</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div>
              <Label>{t.admin.videoTitleLabel}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{t.admin.driveLink}</Label>
              <Input value={form.drive_link} onChange={(e) => setForm({ ...form, drive_link: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
            <div className="flex items-end">
              <Button onClick={() => uploadVideo.mutate()} disabled={!form.user_id || !form.title || !form.drive_link} className="w-full">
                {t.admin.upload}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.admin.videoHistory}</CardTitle>
          <div>
            <select
              className="rounded border border-input bg-background px-3 py-1.5 text-sm"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="">{t.admin.allUsers}</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.userName}</TableHead>
                <TableHead>{t.dashboard.videoTitle}</TableHead>
                <TableHead>{t.dashboard.date}</TableHead>
                <TableHead>{t.dashboard.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{(v as any).profiles?.name || (v as any).profiles?.email || "-"}</TableCell>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{new Date(v.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "new" ? "default" : "secondary"}>{v.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
