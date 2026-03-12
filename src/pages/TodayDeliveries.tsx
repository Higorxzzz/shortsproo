import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download, Film, CheckCircle2, Clock,
  Upload, Scissors, Package, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";

const TodayDeliveries = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";
  const [previewVideo, setPreviewVideo] = useState<any>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, plans(*)").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user!.id).order("uploaded_at", { ascending: false });
      return data || [];
    },
  });

  const { data: rawVideos = [] } = useQuery({
    queryKey: ["my-raw-videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("raw_videos")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["waiting", "editing", "ready"])
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const markDownloaded = useMutation({
    mutationFn: async (videoId: string) => {
      await supabase.from("videos").update({ status: "downloaded" }).eq("id", videoId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos"] }),
  });

  const plan = (profile as any)?.plans;
  const todayStr = new Date().toDateString();
  const todayVideos = videos.filter((v: any) => new Date(v.uploaded_at).toDateString() === todayStr);
  const todayDeliveredCount = todayVideos.length;
  const shortsPerDay = plan?.shorts_per_day || Math.max(todayDeliveredCount, 1);
  const progress = todayDeliveredCount > 0 ? Math.min(100, Math.round((todayDeliveredCount / shortsPerDay) * 100)) : 0;

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{isPt ? "Entregas de Hoje" : "Today's Deliveries"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Acompanhe as entregas do dia" : "Track today's deliveries"}
        </p>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{isPt ? "Progresso diário" : "Daily progress"}</span>
            <Badge variant="secondary" className="text-xs">
              {todayDeliveredCount}/{shortsPerDay}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {progress >= 100
              ? (isPt ? "Meta do dia atingida! ✓" : "Daily goal reached! ✓")
              : (isPt ? `${shortsPerDay - todayDeliveredCount} restante(s)` : `${shortsPerDay - todayDeliveredCount} remaining`)}
          </p>
        </CardContent>
      </Card>

      {/* Today's videos */}
      {todayDeliveredCount > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isPt ? "Vídeos entregues hoje" : "Videos delivered today"}
          </h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {todayVideos.map((video: any, i: number) => {
              const fileId = video.drive_file_id || video.drive_link?.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
              const downloaded = video.status === "downloaded";
              return (
                <Card key={video.id} className={downloaded ? "bg-muted/30" : ""}>
                  <CardContent className="p-4">
                    {/* Thumbnail */}
                    {fileId && (
                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="relative mb-3 block w-full overflow-hidden rounded-md bg-muted aspect-video"
                      >
                        <img
                          src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`}
                          alt={video.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                          <Film className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium line-clamp-2 flex-1">
                        {video.title?.replace(/^.*- /, "") || `Short ${i + 1}`}
                      </h3>
                      {downloaded ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={downloaded ? "outline" : "default"}
                        className="h-8 flex-1 text-xs"
                        onClick={() => {
                          const dlUrl = fileId
                            ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
                            : video.drive_link;
                          window.location.assign(dlUrl);
                          if (video.status === "new") markDownloaded.mutate(video.id);
                        }}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        {downloaded ? (isPt ? "Baixar novamente" : "Re-download") : t.dashboard.download}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : rawVideos.length > 0 ? (
        /* Pipeline status */
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isPt ? "Em processamento" : "In progress"}
          </h2>
          <div className="space-y-2">
            {rawVideos.map((rv: any) => {
              const statusMap: Record<string, { icon: typeof Upload; label: string; labelEn: string }> = {
                waiting: { icon: Upload, label: "Enviado", labelEn: "Uploaded" },
                editing: { icon: Scissors, label: "Em edição", labelEn: "Editing" },
                ready: { icon: Package, label: "Pronto", labelEn: "Ready" },
              };
              const cfg = statusMap[rv.status] || statusMap.waiting;
              const Icon = cfg.icon;
              return (
                <Card key={rv.id}>
                  <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rv.created_at).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {isPt ? cfg.label : cfg.labelEn}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            {!plan ? (
              <>
                <Film className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="mb-1 text-sm font-medium">{isPt ? "Nenhum plano ativo" : "No active plan"}</p>
                <p className="mb-4 text-xs text-muted-foreground">{t.dashboard.noPlan}</p>
                <Button asChild size="sm">
                  <Link to="/plans">{t.dashboard.selectPlan} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="mb-1 text-sm font-medium">{isPt ? "Tudo em dia!" : "All caught up!"}</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  {isPt ? "Envie vídeos brutos para iniciar a produção." : "Upload raw videos to start production."}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/dashboard">{isPt ? "Enviar vídeo" : "Upload video"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default TodayDeliveries;
