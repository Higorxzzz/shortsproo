import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Package, Film } from "lucide-react";
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

  const plan = (profile as any)?.plans;

  if (!user) return null;

  return (
    <div className="container py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          {t.dashboard.welcome}, {profile?.name || user.email?.split("@")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isPt ? "Envie seus vídeos brutos para nossa equipe editar" : "Send your raw videos for our team to edit"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            label: t.dashboard.currentPlan,
            value: plan?.name || (isPt ? "Nenhum" : "None"),
          },
          {
            icon: Package,
            label: isPt ? "Em edição" : "In editing",
            value: rawCount,
          },
          {
            icon: Film,
            label: isPt ? "Vídeos editados" : "Edited videos",
            value: null, // link
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {stat.value !== null ? (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <Button asChild variant="link" className="h-auto p-0 text-sm font-semibold">
                      <Link to="/my-videos">{isPt ? "Ver meus vídeos →" : "View my videos →"}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Upload + sent videos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RawVideoUpload />
        <RawVideosList />
      </div>
    </div>
  );
};

export default Dashboard;
