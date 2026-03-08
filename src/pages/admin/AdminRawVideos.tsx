import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, Film, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const AdminRawVideos = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";

  const { data: rawVideos = [], isLoading } = useQuery({
    queryKey: ["admin-raw-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("raw_videos")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Get profiles for user names
  const userIds = [...new Set(rawVideos.map((v: any) => v.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-raw", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      return data || [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

  const handleDownload = async (video: any) => {
    if (!video.file_path) {
      toast.error(isPt ? "Arquivo não disponível." : "File not available.");
      return;
    }
    const { data } = await supabase.storage
      .from("raw-videos")
      .createSignedUrl(video.file_path, 3600);

    if (data?.signedUrl) {
      window.location.assign(data.signedUrl);
      toast.success(isPt ? "Download iniciado!" : "Download started!");
    } else {
      toast.error(isPt ? "Erro ao gerar link de download." : "Error generating download link.");
    }
  };

  const deleteFile = useMutation({
    mutationFn: async (video: any) => {
      if (video.file_path) {
        const { error: storageError } = await supabase.storage
          .from("raw-videos")
          .remove([video.file_path]);
        if (storageError) throw storageError;
      }
      // Update record to clear file info but keep the record
      const { error: dbError } = await supabase
        .from("raw_videos")
        .update({ file_path: null, file_name: null, file_size: null, status: "completed" })
        .eq("id", video.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-raw-videos"] });
      toast.success(isPt ? "Arquivo removido com sucesso!" : "File removed successfully!");
    },
    onError: () => {
      toast.error(isPt ? "Erro ao remover arquivo." : "Error removing file.");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string; status: string }) => {
      const { error } = await supabase
        .from("raw_videos")
        .update({ status })
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-raw-videos"] });
      toast.success(isPt ? "Status atualizado!" : "Status updated!");
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">
        {isPt ? "Vídeos Brutos dos Clientes" : "Client Raw Videos"}
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {isPt ? "Vídeos enviados para edição" : "Videos sent for editing"}
            </CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">
              {rawVideos.length} {isPt ? "vídeos" : "videos"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rawVideos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Film className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {isPt ? "Nenhum vídeo bruto enviado ainda." : "No raw videos uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isPt ? "Usuário" : "User"}</TableHead>
                    <TableHead>{isPt ? "Título" : "Title"}</TableHead>
                    <TableHead>{isPt ? "Observações" : "Notes"}</TableHead>
                    <TableHead>{isPt ? "Tamanho" : "Size"}</TableHead>
                    <TableHead>{isPt ? "Data" : "Date"}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{isPt ? "Ações" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawVideos.map((video: any) => {
                    const profile = profileMap[video.user_id];
                    const hasFile = !!video.file_path;
                    return (
                      <TableRow key={video.id}>
                        <TableCell className="font-medium">
                          {profile?.name || profile?.email || video.user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{video.title}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {video.notes || "—"}
                        </TableCell>
                        <TableCell>
                          {video.file_size
                            ? `${(video.file_size / 1024 / 1024).toFixed(1)} MB`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={video.status === "completed" ? "default" : "secondary"} 
                            className={`text-xs ${
                              video.status === "waiting" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                              video.status === "editing" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                              ""
                            }`}
                          >
                            {video.status === "waiting"
                              ? (isPt ? "Aguardando" : "Waiting")
                              : video.status === "editing"
                              ? (isPt ? "Em edição" : "Editing")
                              : (isPt ? "Concluído" : "Completed")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {hasFile && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => handleDownload(video)}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  {isPt ? "Baixar" : "Download"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    if (confirm(isPt ? "Remover o arquivo bruto? O registro será mantido." : "Remove raw file? The record will be kept.")) {
                                      deleteFile.mutate(video);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  {isPt ? "Remover" : "Remove"}
                                </Button>
                              </>
                            )}
                            {video.status === "waiting" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-orange-600"
                                onClick={() => updateStatus.mutate({ videoId: video.id, status: "editing" })}
                              >
                                <Film className="mr-1 h-3 w-3" />
                                {isPt ? "Editar" : "Edit"}
                              </Button>
                            )}
                            {video.status === "editing" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-emerald-600"
                                onClick={() => updateStatus.mutate({ videoId: video.id, status: "completed" })}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {isPt ? "Concluir" : "Complete"}
                              </Button>
                            )}
                            {video.status !== "waiting" && video.status !== "completed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-yellow-600"
                                onClick={() => updateStatus.mutate({ videoId: video.id, status: "waiting" })}
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                {isPt ? "Aguardar" : "Wait"}
                              </Button>
                            )}
                            {!hasFile && video.status === "completed" && (
                              <span className="text-xs text-muted-foreground">
                                {isPt ? "Arquivo removido" : "File removed"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRawVideos;
