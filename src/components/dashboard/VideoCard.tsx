import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Film, Play } from "lucide-react";

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

  const downloadUrl = video.drive_file_id
    ? `https://drive.google.com/uc?export=download&id=${video.drive_file_id}`
    : video.drive_link;
  const viewUrl = video.drive_file_id
    ? `https://drive.google.com/file/d/${video.drive_file_id}/view`
    : video.drive_link;

  const fileSize = video.file_size
    ? video.file_size < 1024 * 1024
      ? `${(video.file_size / 1024).toFixed(1)} KB`
      : `${(video.file_size / (1024 * 1024)).toFixed(1)} MB`
    : null;

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
      {/* Thumbnail / Preview area */}
      <button
        onClick={() => onPreview(video)}
        className="relative flex h-36 items-center justify-center bg-muted/50 transition-colors group-hover:bg-muted"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <Film className="h-10 w-10 text-muted-foreground/40 transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
            <Play className="h-4 w-4 ml-0.5" />
          </div>
        </div>
        {/* NEW badge */}
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
          {fileSize && (
            <>
              <span className="text-border">•</span>
              <span>{fileSize}</span>
            </>
          )}
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
