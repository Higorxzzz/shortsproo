import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const AdminVideos = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [filterUser, setFilterUser] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [notes, setNotes] = useState("");

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
      let q = supabase.from("videos").select("*").order("uploaded_at", { ascending: false });
      if (filterUser) q = q.eq("user_id", filterUser);
      const { data: vids } = await q;
      if (!vids || vids.length === 0) return [];

      const userIds = [...new Set(vids.map((v: any) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return vids.map((v: any) => ({ ...v, profile: profileMap.get(v.user_id) || null }));
    },
  });

  const addVideo = useMutation({
    mutationFn: async () => {
      const fileId = extractDriveFileId(driveLink);
      const { error } = await supabase.from("videos").insert({
        user_id: selectedUserId,
        title: videoTitle,
        drive_link: driveLink,
        drive_file_id: fileId,
        status: "new",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast({ title: isPt ? "Vídeo adicionado com sucesso!" : "Video added successfully!" });
      setVideoTitle("");
      setDriveLink("");
      setNotes("");
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro ao adicionar vídeo" : "Error adding video", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !videoTitle.trim() || !driveLink.trim()) return;
    addVideo.mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.videos}</h1>

      {/* Add video form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            {isPt ? "Adicionar Vídeo via Link" : "Add Video via Link"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t.admin.selectUser}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">--</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{isPt ? "Título do vídeo" : "Video title"}</Label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={isPt ? "Ex: Top 5 dicas..." : "Ex: Top 5 tips..."}
                  required
                />
              </div>
            </div>

            <div>
              <Label>{isPt ? "Link do Google Drive" : "Google Drive Link"}</Label>
              <Input
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                required
              />
              {driveLink && !extractDriveFileId(driveLink) && (
                <p className="mt-1 text-xs text-destructive">
                  {isPt ? "Link inválido. Use o formato: https://drive.google.com/file/d/FILE_ID/view" : "Invalid link. Use format: https://drive.google.com/file/d/FILE_ID/view"}
                </p>
              )}
            </div>

            <div>
              <Label>{isPt ? "Observações (opcional)" : "Notes (optional)"}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isPt ? "Informações adicionais..." : "Additional info..."}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedUserId || !videoTitle.trim() || !driveLink.trim() || !extractDriveFileId(driveLink) || addVideo.isPending}
            >
              {addVideo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {isPt ? "Adicionar Vídeo" : "Add Video"}
            </Button>
          </form>
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
                  <TableCell>{v.profile?.name || v.profile?.email || "-"}</TableCell>
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
                    {isPt ? "Nenhum vídeo encontrado" : "No videos found"}
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
