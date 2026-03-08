import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RawVideosList = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPt = (t as any).language === "pt";

  const { data: rawVideos = [], isLoading } = useQuery({
    queryKey: ["raw-videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("raw_videos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (rawVideos.length === 0) return null;

  const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
    editing: {
      label: isPt ? "Em edição" : "Editing",
      icon: Clock,
      variant: "secondary",
    },
    completed: {
      label: isPt ? "Concluído" : "Completed",
      icon: CheckCircle2,
      variant: "default",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {isPt ? "Vídeos enviados para edição" : "Videos sent for editing"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {rawVideos.map((video: any, i: number) => {
              const config = statusConfig[video.status] || statusConfig.editing;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="line-clamp-1 text-sm font-semibold">{video.title}</h4>
                    <Badge variant={config.variant} className="ml-2 shrink-0 text-[10px]">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  {video.notes && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{video.notes}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    {video.file_size && (
                      <span>{(video.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    )}
                  </div>
                  {video.status === "editing" && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {isPt ? "Nosso time está editando seu vídeo" : "Our team is editing your video"}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default RawVideosList;
