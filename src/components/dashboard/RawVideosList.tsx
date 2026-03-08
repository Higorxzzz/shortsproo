import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Clock, CheckCircle2, Loader2, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    waiting: {
      label: isPt ? "Aguardando time de edição" : "Waiting for editing team",
      icon: Clock,
      color: "text-yellow-500 bg-yellow-500/10",
    },
    editing: {
      label: isPt ? "Nosso time está editando seu vídeo" : "Our team is editing your video",
      icon: Film,
      color: "text-orange-500 bg-orange-500/10",
    },
    completed: {
      label: isPt ? "Nosso time de edição terminou seu vídeo!" : "Our editing team finished your video!",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Film className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isPt ? "Seus envios" : "Your submissions"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isPt ? "Acompanhe o status" : "Track the status"}
              </p>
            </div>
          </div>
          {rawVideos.length > 0 && (
            <Badge variant="outline" className="text-xs font-medium">
              {rawVideos.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rawVideos.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-4">
              <Inbox className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {isPt ? "Nenhum vídeo enviado" : "No videos sent"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {isPt ? "Envie seu primeiro vídeo ao lado" : "Upload your first video on the left"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {rawVideos.map((video: any, i: number) => {
                const config = statusConfig[video.status] || statusConfig.editing;
                const StatusIcon = config.icon;
                const colorClasses = config.color;

                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-colors hover:border-border"
                  >
                    {/* Status icon */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClasses}`}>
                      {video.status === "editing" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StatusIcon className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-1 text-sm font-semibold">{video.title}</h4>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] border-0 ${colorClasses}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      {video.notes && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{video.notes}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground/70">
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        {video.file_size && (
                          <>
                            <span>·</span>
                            <span>{(video.file_size / 1024 / 1024).toFixed(1)} MB</span>
                          </>
                        )}
                      </div>
                      {video.status === "editing" && (
                        <p className="mt-2 text-[11px] font-medium text-orange-500/80">
                          {isPt ? "Nosso time está editando seu vídeo..." : "Our team is editing your video..."}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RawVideosList;
