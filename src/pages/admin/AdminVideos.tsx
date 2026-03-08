import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload } from "lucide-react";
import VideoUploadDialog from "@/components/VideoUploadDialog";

const AdminVideos = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [filterUser, setFilterUser] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string }>({ id: "", name: "" });

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

  const isPt = t.language === "pt";

  const handleOpenUpload = () => {
    if (!selectedUser.id) return;
    setUploadOpen(true);
  };

  const handleUploadClose = (open: boolean) => {
    setUploadOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.videos}</h1>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />{t.admin.uploadVideo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>{t.admin.selectUser}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedUser.id}
                onChange={(e) => {
                  const user = users.find((u: any) => u.id === e.target.value);
                  setSelectedUser({
                    id: e.target.value,
                    name: user ? (user as any).name || (user as any).email || "" : "",
                  });
                }}
              >
                <option value="">--</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleOpenUpload} disabled={!selectedUser.id}>
              <Upload className="mr-2 h-4 w-4" />
              {isPt ? "Enviar Vídeo" : "Upload Video"}
            </Button>
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
                <TableHead>{isPt ? "Tamanho" : "Size"}</TableHead>
                <TableHead>{t.dashboard.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{v.profiles?.name || v.profiles?.email || "-"}</TableCell>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{new Date(v.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell>{formatFileSize(v.file_size)}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "new" ? "default" : "secondary"}>{v.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {videos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {isPt ? "Nenhum vídeo encontrado" : "No videos found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <VideoUploadDialog
        open={uploadOpen}
        onOpenChange={handleUploadClose}
        clientUserId={selectedUser.id}
        clientName={selectedUser.name}
      />
    </div>
  );
};

export default AdminVideos;
