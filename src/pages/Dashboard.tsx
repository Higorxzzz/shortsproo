import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Package, Film, ArrowRight, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import YouTubeShortsCarousel from "@/components/dashboard/YouTubeShortsCarousel";

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPt = (t as any).language === "pt";

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, plans(*)").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: rawCount = 0 } = useQuery({
    queryKey: ["raw-videos-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("raw_videos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "editing");
      return count || 0;
    },
  });

  const { data: editedCount = 0 } = useQuery({
    queryKey: ["edited-videos-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
  });

  const plan = (profile as any)?.plans;
  const channelId = (profile as any)?.youtube_channel_id;

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <AnnouncementBanner />

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          {isPt ? "Olá" : "Hello"}, {profile?.name || user.email?.split("@")[0]} 👋
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {isPt ? "Seu Painel" : "Your Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt
            ? "Acompanhe seus vídeos e o desempenho do seu canal."
            : "Track your videos and channel performance."}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t.dashboard.currentPlan}</p>
              <p className="font-semibold">{plan?.name || (isPt ? "Nenhum" : "None")}</p>
            </div>
          </CardContent>
        </Card>

        <Link to="/upload">
          <Card className="transition-colors hover:border-primary/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{isPt ? "Em edição" : "In editing"}</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{rawCount}</p>
                  {rawCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {isPt ? "em andamento" : "in progress"}
                    </Badge>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-videos">
          <Card className="transition-colors hover:border-primary/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Film className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{isPt ? "Vídeos editados" : "Edited videos"}</p>
                <p className="font-semibold">{editedCount}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick action */}
      <Link to="/upload">
        <Card className="mb-8 transition-colors hover:border-primary/30">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{isPt ? "Enviar novo vídeo para edição" : "Upload new video for editing"}</p>
              <p className="text-xs text-muted-foreground">
                {isPt ? "Nossa equipe transforma em Short profissional" : "Our team turns it into a professional Short"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* YouTube Shorts */}
      <YouTubeShortsCarousel channelId={channelId} />
    </div>
  );
};

export default Dashboard;
