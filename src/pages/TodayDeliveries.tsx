import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download, Film, CheckCircle2, Clock, Calendar,
  Upload, Scissors, Package,
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
  const shortsPerDay = plan?.shorts_per_day || todayDeliveredCount || 1;
  const todayDeliveryProgress = todayDeliveredCount > 0 ? Math.min(100, Math.round((todayDeliveredCount / shortsPerDay) * 100)) : 0;

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{isPt ? "Entregas de Hoje" : "Today's Deliveries"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Acompanhe as entregas do dia" : "Track today's deliveries"}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{isPt ? "Progresso" : "Progress"}</CardTitle>
            </div>
            {todayDeliveredCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {todayDeliveredCount}/{shortsPerDay} {isPt ? "entregues" : "delivered"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayDeliveredCount > 0 ? (
            <>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{isPt ? "Entregues" : "Delivered"}: {todayDeliveredCount}/{shortsPerDay}</span>
                <span>{todayDeliveryProgress}%</span>
              </div>
              <Progress value={todayDeliveryProgress} className="mb-5 h-2" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayVideos.map((video: any, i: number) => (
                  <div
                    key={video.id}
                    className={`rounded-lg border p-4 ${
                      video.status === "downloaded" ? "border-foreground/20 bg-muted/50" : "border-border bg-card"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{video.title?.replace(/^.*- /, '') || `Short ${i + 1}`}</span>
                      {video.status === "downloaded" ? (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{video.title}</p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs"
                        onClick={() => {
                          const dlUrl = video.drive_file_id
                            ? `https://drive.usercontent.google.com/download?id=${video.drive_file_id}&export=download&confirm=t`
                            : video.drive_link;
                          window.location.assign(dlUrl);
                          if (video.status === "new") markDownloaded.mutate(video.id);
                        }}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t.dashboard.download}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewVideo(video)}>
                        <Film className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : rawVideos.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                {isPt ? "Seus vídeos estão sendo processados pela equipe:" : "Your videos are being processed by the team:"}
              </p>
              {rawVideos.map((rv: any) => {
                const statusConfig: Record<string, { icon: typeof Upload; label: string; labelEn: string }> = {
                  waiting: { icon: Upload, label: "Enviado", labelEn: "Uploaded" },
                  editing: { icon: Scissors, label: "Em edição", labelEn: "Editing" },
                  ready: { icon: Package, label: "Pronto", labelEn: "Ready" },
                };
                const cfg = statusConfig[rv.status] || statusConfig.waiting;
                const Icon = cfg.icon;
                return (
                  <div key={rv.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rv.created_at).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isPt ? cfg.label : cfg.labelEn}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : !plan ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Film className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-3 text-sm text-muted-foreground">{t.dashboard.noPlan}</p>
              <Button asChild size="sm"><Link to="/plans">{t.dashboard.selectPlan}</Link></Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isPt ? "Nenhum vídeo pendente. Envie vídeos brutos para iniciar!" : "No pending videos. Upload raw videos to get started!"}
              </p>
              <Button asChild size="sm" className="mt-3"><Link to="/dashboard">{isPt ? "Enviar vídeo" : "Upload video"}</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default TodayDeliveries;
