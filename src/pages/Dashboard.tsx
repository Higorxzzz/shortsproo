import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Package, Film, ArrowRight, Upload, Scissors, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import RawVideoUpload from "@/components/dashboard/RawVideoUpload";
import RawVideosList from "@/components/dashboard/RawVideosList";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";

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

  if (!user) return null;

  const steps = [
    { icon: Upload, title: isPt ? "Envie" : "Upload", desc: isPt ? "Envie seu vídeo bruto" : "Send your raw video" },
    { icon: Scissors, title: isPt ? "Editamos" : "We edit", desc: isPt ? "Nossa equipe edita" : "Our team edits it" },
    { icon: CheckCircle2, title: isPt ? "Receba" : "Receive", desc: isPt ? "Baixe o Short pronto" : "Download the Short" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <AnnouncementBanner />

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          {isPt ? "Olá" : "Hello"}, {profile?.name || user.email?.split("@")[0]} 👋
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {isPt ? "Envie seus vídeos para edição" : "Send your videos for editing"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt
            ? "Faça upload dos seus vídeos brutos e nossa equipe transforma em Shorts profissionais."
            : "Upload your raw videos and our team turns them into professional Shorts."}
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <step.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t.dashboard.currentPlan}</p>
              <p className="font-semibold">{plan?.name || (isPt ? "Nenhum" : "None")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
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
          </CardContent>
        </Card>

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

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RawVideoUpload />
        </div>
        <div className="lg:col-span-2">
          <RawVideosList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
