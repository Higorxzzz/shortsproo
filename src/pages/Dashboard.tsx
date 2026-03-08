import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ExternalLink, Film, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const markDownloaded = useMutation({
    mutationFn: async (videoId: string) => {
      await supabase.from("videos").update({ status: "downloaded" }).eq("id", videoId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos"] }),
  });

  const plan = (profile as any)?.plans;
  const newVideos = videos.filter((v: any) => v.status === "new");

  if (!user) return null;

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t.dashboard.title}</h1>

      {/* Plan info */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t.dashboard.currentPlan}</CardTitle>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{plan.name}</span>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">{t.dashboard.noPlan}</p>
                <Button size="sm" asChild className="mt-2"><Link to="/plans">{t.dashboard.selectPlan}</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t.dashboard.shortsPerDay}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{plan?.shorts_per_day || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t.dashboard.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={plan ? "default" : "secondary"}>
              {plan ? t.dashboard.active : t.dashboard.inactive}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Videos */}
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">{t.dashboard.newVideos} ({newVideos.length})</TabsTrigger>
          <TabsTrigger value="all">{t.dashboard.allVideos} ({videos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <VideoTable videos={newVideos} t={t} onDownload={(id) => markDownloaded.mutate(id)} />
        </TabsContent>
        <TabsContent value="all">
          <VideoTable videos={videos} t={t} onDownload={(id) => markDownloaded.mutate(id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const VideoTable = ({ videos, t, onDownload }: { videos: any[]; t: any; onDownload: (id: string) => void }) => {
  if (videos.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{t.dashboard.noVideos}</p>;
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.dashboard.videoTitle}</TableHead>
            <TableHead>{t.dashboard.date}</TableHead>
            <TableHead>{t.dashboard.status}</TableHead>
            <TableHead className="text-right">{t.admin.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video: any) => (
            <TableRow key={video.id}>
              <TableCell className="font-medium">{video.title}</TableCell>
              <TableCell>{new Date(video.uploaded_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={video.status === "new" ? "default" : "secondary"}>
                  {video.status === "new" ? t.dashboard.statusNew : t.dashboard.statusDownloaded}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(video.drive_link, "_blank");
                      onDownload(video.id);
                    }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    {t.dashboard.download}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(video.drive_link, "_blank")}>
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {t.dashboard.openDrive}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default Dashboard;
