import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  const downloadUrl = fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : video.drive_link;
  const viewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : video.drive_link;

  const dateStr = new Date(video.uploaded_at).toLocaleDateString(isPt ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
    >
      {/* Video preview iframe */}
      <button
        onClick={() => onPreview(video)}
        className="relative block h-44 w-full bg-muted/50 overflow-hidden"
      >
        {fileId ? (
          <img
            src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`}
            alt={video.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
              const fallback = document.createElement('span');
              fallback.className = 'text-muted-foreground/40 text-sm';
              fallback.textContent = isPt ? 'Sem preview' : 'No preview';
              (e.target as HTMLImageElement).parentElement!.appendChild(fallback);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-sm">
            {isPt ? "Sem preview" : "No preview"}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Film className="h-10 w-10 text-white/80" />
        </div>
        {video.status === "new" && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 font-semibold shadow-sm">
            NEW
          </Badge>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {video.title}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <span>{dateStr}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-1.5">
          <Button
            size="sm"
            variant="default"
            className="h-8 flex-1 text-xs"
            onClick={() => {
              window.open(downloadUrl, "_blank");
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
      </div>
    </motion.div>
  );
};

export default VideoCard;
