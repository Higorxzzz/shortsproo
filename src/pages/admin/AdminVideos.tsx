import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const AdminVideos = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ user_id: "", title: "", drive_link: "" });
  const [filterUser, setFilterUser] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-list"],
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
      toast.success(t.language === "pt" ? "Vídeo enviado!" : "Video uploaded!");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.videos}</h1>

      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />{t.admin.uploadVideo}
          </CardTitle>
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
          <CardTitle className="text-lg">{t.admin.videoHistory}</CardTitle>
          <select
            className="rounded border border-input bg-background px-3 py-1.5 text-sm"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="">{t.admin.allUsers}</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </CardHeader>
        <CardContent className="p-0">
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
                  <TableCell>{v.profiles?.name || v.profiles?.email || "-"}</TableCell>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{new Date(v.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "new" ? "default" : "secondary"}>{v.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {videos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t.language === "pt" ? "Nenhum vídeo encontrado" : "No videos found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVideos;
