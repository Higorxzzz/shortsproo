import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ExternalLink, Film, Zap, CheckCircle2, Clock, Package, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";
  const [historyFilter, setHistoryFilter] = useState<string>("all");

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

  // Fetch today's tasks for this user
  const { data: todayTasks = [] } = useQuery({
    queryKey: ["my-tasks-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .eq("task_date", today)
        .order("task_number", { ascending: true });
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
  const todayCompleted = todayTasks.filter((t: any) => t.status === "completed").length;
  const todayTotal = todayTasks.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Today's videos (uploaded today)
  const todayStr = new Date().toDateString();
  const todayVideos = videos.filter((v: any) => new Date(v.uploaded_at).toDateString() === todayStr);

  // History filtering
  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return videos;
    return videos.filter((v: any) => v.status === historyFilter);
  }, [videos, historyFilter]);

  // Stats
  const totalVideos = videos.length;
  const totalDownloaded = videos.filter((v: any) => v.status === "downloaded").length;
  const thisWeekVideos = videos.filter((v: any) => {
    const d = new Date(v.uploaded_at);
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return d >= weekAgo;
  }).length;

  if (!user) return null;

  return (
    <div className="container py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          {t.dashboard.welcome}, {profile?.name || user.email?.split("@")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isPt ? "Acompanhe a produção dos seus Shorts" : "Track your Shorts production"}
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.currentPlan}</p>
              <p className="text-xl font-bold">{plan?.name || (isPt ? "Nenhum" : "None")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.shortsPerDay}</p>
              <p className="text-xl font-bold">{plan?.shorts_per_day || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isPt ? "Total entregue" : "Total delivered"}</p>
              <p className="text-xl font-bold">{totalVideos}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isPt ? "Esta semana" : "This week"}</p>
              <p className="text-xl font-bold">{thisWeekVideos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's delivery section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{isPt ? "Entregas de Hoje" : "Today's Deliveries"}</CardTitle>
            </div>
            {todayTotal > 0 && (
              <Badge variant={todayCompleted === todayTotal ? "default" : "secondary"}>
                {todayCompleted}/{todayTotal} {isPt ? "concluídas" : "completed"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayTotal > 0 ? (
            <>
              <Progress value={todayProgress} className="mb-4 h-2" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayTasks.map((task: any) => {
                  const video = task.video_id ? todayVideos.find((v: any) => v.id === task.video_id) || videos.find((v: any) => v.id === task.video_id) : null;
                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        task.status === "completed"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Short {task.task_number}</span>
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {video ? (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">{video.title}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => {
                                window.open(video.drive_link, "_blank");
                                if (video.status === "new") markDownloaded.mutate(video.id);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              {t.dashboard.download}
                            </Button>
                            {video.status === "downloaded" && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {t.dashboard.statusDownloaded}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {task.status === "completed"
                            ? (isPt ? "Entregue" : "Delivered")
                            : (isPt ? "Aguardando produção..." : "Awaiting production...")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : !plan ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Film className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-3 text-muted-foreground">{t.dashboard.noPlan}</p>
              <Button asChild><Link to="/plans">{t.dashboard.selectPlan}</Link></Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isPt ? "Nenhuma tarefa gerada hoje. Sua equipe está preparando seus shorts!" : "No tasks generated today. Your team is preparing your shorts!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video history */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">{isPt ? "Histórico Completo" : "Full History"}</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={historyFilter} onValueChange={setHistoryFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isPt ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="new">{isPt ? "Novos" : "New"}</SelectItem>
                  <SelectItem value="downloaded">{isPt ? "Baixados" : "Downloaded"}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredHistory.length} {isPt ? "vídeos" : "videos"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t.dashboard.noVideos}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.dashboard.videoTitle}</TableHead>
                    <TableHead>{t.dashboard.date}</TableHead>
                    <TableHead>{t.dashboard.status}</TableHead>
                    <TableHead className="text-right">{isPt ? "Ações" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((video: any) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(video.uploaded_at).toLocaleDateString(isPt ? "pt-BR" : "en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={video.status === "new" ? "default" : "secondary"}
                          className={video.status === "downloaded" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : ""}
                        >
                          {video.status === "new" ? (
                            <><Film className="mr-1 h-3 w-3" />{t.dashboard.statusNew}</>
                          ) : (
                            <><CheckCircle2 className="mr-1 h-3 w-3" />{t.dashboard.statusDownloaded}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => {
                              window.open(video.drive_link, "_blank");
                              if (video.status === "new") markDownloaded.mutate(video.id);
                            }}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            {t.dashboard.download}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => window.open(video.drive_link, "_blank")}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
