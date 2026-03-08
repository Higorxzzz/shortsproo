import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Calendar, Film } from "lucide-react";

function extractFileId(video: any): string | null {
  if (video.drive_file_id) return video.drive_file_id;
  const match = video.drive_link?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface VideoPreviewModalProps {
  video: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VideoPreviewModal = ({ video, open, onOpenChange }: VideoPreviewModalProps) => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const markDownloaded = useMutation({
    mutationFn: async (videoId: string) => {
      await supabase.from("videos").update({ status: "downloaded" }).eq("id", videoId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos"] }),
  });

  if (!video) return null;

  const fileId = extractFileId(video);
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  const downloadUrl = fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : video.drive_link;
  const viewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : video.drive_link;

  const dateStr = new Date(video.uploaded_at).toLocaleDateString(isPt ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{video.title}</DialogTitle>
        <div className="relative aspect-video w-full bg-muted">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="h-full w-full"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{video.title}</h2>
            {video.status === "new" && (
              <Badge className="bg-primary text-primary-foreground shrink-0">NEW</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{dateStr}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                window.location.assign(downloadUrl);
                if (video.status === "new") markDownloaded.mutate(video.id);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {t.dashboard.download}
            </Button>
            <Button variant="outline" onClick={() => window.open(viewUrl, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t.dashboard.openDrive}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPreviewModal;
