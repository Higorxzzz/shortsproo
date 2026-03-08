import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Film, CheckCircle2, Clock, Calendar,
  Search, LayoutGrid, CalendarDays, ArrowUpDown,
  Upload, Scissors, Package, Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCard from "@/components/dashboard/VideoCard";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";
import DeliveryCalendar from "@/components/dashboard/DeliveryCalendar";
import YouTubeShortsCarousel from "@/components/dashboard/YouTubeShortsCarousel";
import { CardHeader, CardTitle } from "@/components/ui/card";

const MyVideos = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";

  const [activeTab, setActiveTab] = useState("videos");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
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
  const newVideosCount = videos.filter((v: any) => v.status === "new").length;

  const filteredVideos = useMemo(() => {
    let result = [...videos];
    if (statusFilter !== "all") result = result.filter((v: any) => v.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v: any) => v.title?.toLowerCase().includes(q));
    }
    if (sortOrder === "oldest") {
      result.sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
    } else {
      result.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    }
    return result;
  }, [videos, statusFilter, searchQuery, sortOrder]);

  const todayStr = new Date().toDateString();
  const todayVideos = videos.filter((v: any) => new Date(v.uploaded_at).toDateString() === todayStr);
  const todayDeliveredCount = todayVideos.length;
  const shortsPerDay = plan?.shorts_per_day || todayDeliveredCount || 1;
  const todayDeliveryProgress = todayDeliveredCount > 0 ? Math.min(100, Math.round((todayDeliveredCount / shortsPerDay) * 100)) : 0;

  if (!user) return null;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          {isPt ? "Meus Vídeos Editados" : "My Edited Videos"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isPt ? "Baixe os Shorts produzidos pela nossa equipe" : "Download the Shorts produced by our team"}
        </p>
      </div>

      {/* Today's delivery indicator */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{isPt ? "Entregas de Hoje" : "Today's Deliveries"}</CardTitle>
              </div>
              {todayDeliveredCount > 0 && (
                <Badge variant={todayDownloadedCount === todayDeliveredCount ? "default" : "secondary"} className="text-xs">
                  {todayDownloadedCount}/{todayDeliveredCount} {isPt ? "baixados" : "downloaded"}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {todayVideos.map((video: any, i: number) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`group rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
                        video.status === "downloaded"
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{video.title?.replace(/^.*- /, '') || `Short ${i + 1}`}</span>
                        {video.status === "downloaded" ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">{video.title}</p>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => setPreviewVideo(video)}
                        >
                          <Film className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : rawVideos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  {isPt ? "Seus vídeos estão sendo processados pela equipe:" : "Your videos are being processed by the team:"}
                </p>
                {rawVideos.map((rv: any) => {
                  const statusConfig: Record<string, { icon: typeof Upload; label: string; labelEn: string; color: string }> = {
                    waiting: { icon: Upload, label: "Enviado", labelEn: "Uploaded", color: "text-muted-foreground" },
                    editing: { icon: Scissors, label: "Em edição", labelEn: "Editing", color: "text-orange-500" },
                    ready: { icon: Package, label: "Pronto", labelEn: "Ready", color: "text-primary" },
                  };
                  const cfg = statusConfig[rv.status] || statusConfig.waiting;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={rv.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rv.created_at).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                        {isPt ? cfg.label : cfg.labelEn}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : !plan ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Film className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-3 text-muted-foreground">{t.dashboard.noPlan}</p>
                <Button asChild><Link to="/plans">{t.dashboard.selectPlan}</Link></Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isPt ? "Nenhum vídeo pendente. Envie vídeos brutos para iniciar!" : "No pending videos. Upload raw videos to get started!"}
                </p>
                <Button asChild className="mt-3"><Link to="/dashboard">{isPt ? "Enviar vídeo" : "Upload video"}</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs: Videos / Calendar */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-9">
            <TabsTrigger value="videos" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              {isPt ? "Meus Vídeos" : "My Videos"}
              {newVideosCount > 0 && (
                <Badge variant="default" className="ml-1 h-4 px-1 text-[10px] leading-none">
                  {newVideosCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {isPt ? "Calendário" : "Calendar"}
            </TabsTrigger>
          </TabsList>

          {activeTab === "videos" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isPt ? "Buscar vídeo..." : "Search video..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-44 pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isPt ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="new">{isPt ? "Novos" : "New"}</SelectItem>
                  <SelectItem value="downloaded">{isPt ? "Baixados" : "Downloaded"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <ArrowUpDown className="mr-1 h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{isPt ? "Mais recentes" : "Newest"}</SelectItem>
                  <SelectItem value="oldest">{isPt ? "Mais antigos" : "Oldest"}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">
                {filteredVideos.length} {isPt ? "vídeos" : "videos"}
              </Badge>
            </div>
          )}
        </div>

        <TabsContent value="videos" className="mt-0">
          {filteredVideos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Film className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? (isPt ? "Nenhum vídeo encontrado" : "No videos found")
                    : t.dashboard.noVideos}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredVideos.map((video: any) => (
                  <VideoCard key={video.id} video={video} onPreview={setPreviewVideo} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <DeliveryCalendar videos={videos} onPreview={setPreviewVideo} />
        </TabsContent>
      </Tabs>

      {/* YouTube Shorts Carousel */}
      <div className="mt-8">
        <YouTubeShortsCarousel channelId={(profile as any)?.youtube_channel_id} />
      </div>

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default MyVideos;
