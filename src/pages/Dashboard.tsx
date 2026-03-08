import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Package, Film, ArrowRight, Upload, Scissors, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RawVideoUpload from "@/components/dashboard/RawVideoUpload";
import RawVideosList from "@/components/dashboard/RawVideosList";

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
    {
      icon: Upload,
      title: isPt ? "Envie" : "Upload",
      desc: isPt ? "Envie seu vídeo bruto" : "Send your raw video",
    },
    {
      icon: Scissors,
      title: isPt ? "Editamos" : "We edit",
      desc: isPt ? "Nossa equipe edita" : "Our team edits it",
    },
    {
      icon: CheckCircle2,
      title: isPt ? "Receba" : "Receive",
      desc: isPt ? "Baixe o Short pronto" : "Download the Short",
    },
  ];

  return (
    <div className="container max-w-6xl py-8">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-primary">
            {isPt ? "Olá" : "Hello"}, {profile?.name || user.email?.split("@")[0]} 👋
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">
            {isPt ? "Envie seus vídeos para edição" : "Send your videos for editing"}
          </h1>
          <p className="max-w-lg text-muted-foreground">
            {isPt
              ? "Faça upload dos seus vídeos brutos e nossa equipe transforma em Shorts profissionais."
              : "Upload your raw videos and our team turns them into professional Shorts."}
          </p>
        </div>
      </motion.div>

      {/* How it works stepper */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-10"
      >
        <div className="grid gap-4 sm:grid-cols-3 pb-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid gap-4 sm:grid-cols-3"
      >
        <Card className="border-border/60 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t.dashboard.currentPlan}</p>
              <p className="text-lg font-bold">{plan?.name || (isPt ? "Nenhum" : "None")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{isPt ? "Em edição" : "In editing"}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{rawCount}</p>
                {rawCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 animate-pulse">
                    {isPt ? "em andamento" : "in progress"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
          <Link to="/my-videos">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Film className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{isPt ? "Vídeos editados" : "Edited videos"}</p>
                <p className="text-lg font-bold">{editedCount}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </CardContent>
          </Link>
        </Card>
      </motion.div>

      {/* Main content: Upload + Sent videos */}
      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <RawVideoUpload />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <RawVideosList />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
