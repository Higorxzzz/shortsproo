import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Link2, Loader2, Plus } from "lucide-react";

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface AddVideoLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientUserId: string;
  clientName: string;
  taskId?: string;
  taskNumber?: number;
  planName?: string;
}

const AddVideoLinkDialog = ({
  open,
  onOpenChange,
  clientUserId,
  clientName,
  taskId,
  taskNumber,
  planName,
}: AddVideoLinkDialogProps) => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const [driveLink, setDriveLink] = useState("");

  const addVideo = useMutation({
    mutationFn: async () => {
      const fileId = extractDriveFileId(driveLink);
      const { error } = await supabase.from("videos").insert({
        user_id: clientUserId,
        title: `Short ${taskNumber || 1}`,
        drive_link: driveLink,
        drive_file_id: fileId,
        status: "new",
      });
      if (error) throw error;

      // If there's a task, mark it completed and link video
      if (taskId) {
        const { data: vid } = await supabase
          .from("videos")
          .select("id")
          .eq("user_id", clientUserId)
          .eq("drive_link", driveLink)
          .single();

        if (vid) {
          await supabase
            .from("tasks")
            .update({ status: "completed", completed_at: new Date().toISOString(), video_id: vid.id })
            .eq("id", taskId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: isPt ? "Vídeo adicionado com sucesso!" : "Video added successfully!" });
      resetAndClose();
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetAndClose = () => {
    setVideoTitle("");
    setDriveLink("");
    onOpenChange(false);
  };

  const fileId = extractDriveFileId(driveLink);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {isPt ? "Adicionar Vídeo" : "Add Video"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><strong>{isPt ? "Cliente:" : "Client:"}</strong> {clientName}</p>
            {taskNumber && <p><strong>{isPt ? "Tarefa:" : "Task:"}</strong> Short {taskNumber}</p>}
            {planName && <p><strong>{isPt ? "Plano:" : "Plan:"}</strong> {planName}</p>}
          </div>

          <div>
            <Label>{isPt ? "Título do vídeo" : "Video title"}</Label>
            <Input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder={isPt ? "Ex: Top 5 dicas..." : "Ex: Top 5 tips..."}
            />
          </div>

          <div>
            <Label>{isPt ? "Link do Google Drive" : "Google Drive Link"}</Label>
            <Input
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view"
            />
            {driveLink && !fileId && (
              <p className="mt-1 text-xs text-destructive">
                {isPt ? "Link inválido. Use: https://drive.google.com/file/d/FILE_ID/view" : "Invalid link. Use: https://drive.google.com/file/d/FILE_ID/view"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetAndClose}>
            {isPt ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={() => addVideo.mutate()}
            disabled={!videoTitle.trim() || !driveLink.trim() || !fileId || addVideo.isPending}
          >
            {addVideo.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isPt ? "Adicionar" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVideoLinkDialog;
