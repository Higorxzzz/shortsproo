import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ExternalLink, Film } from "lucide-react";

function extractFileId(video: any): string | null {
  if (video.drive_file_id) return video.drive_file_id;
  const match = video.drive_link?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface VideoCardProps {
  video: any;
  onPreview: (video: any) => void;
}

const VideoCard = ({ video, onPreview }: VideoCardProps) => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const markDownloaded = useMutation({
    mutationFn: async (videoId: string) => {
      await supabase.from("videos").update({ status: "downloaded" }).eq("id", videoId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos"] }),
  });

  const fileId = extractFileId(video);
  const downloadUrl = fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : video.drive_link;
  const viewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : video.drive_link;

  const dateStr = new Date(video.uploaded_at).toLocaleDateString(isPt ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
  });

  return (
    <Card className="group flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <button
        onClick={() => onPreview(video)}
        className="relative block aspect-[9/16] w-full bg-muted overflow-hidden"
      >
        {fileId ? (
          <img
            src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
            <Film className="h-8 w-8" />
          </div>
        )}
        {video.status === "new" && (
          <Badge className="absolute left-2 top-2 text-[10px] px-1.5 py-0.5">NEW</Badge>
        )}
      </button>

      {/* Info */}
      <CardContent className="flex flex-1 flex-col p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
        <span className="text-xs text-muted-foreground">{dateStr}</span>

        <div className="mt-auto flex gap-1.5 pt-3">
          <Button
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={() => {
              window.location.assign(downloadUrl);
              if (video.status === "new") markDownloaded.mutate(video.id);
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t.dashboard.download}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5"
            onClick={() => window.open(viewUrl, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;
