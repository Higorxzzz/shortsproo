import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Film, Calendar, CalendarDays, CreditCard,
  LayoutDashboard, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
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

  const navCards = [
    {
      to: "/upload",
      icon: Upload,
      title: isPt ? "Enviar Vídeo" : "Upload Video",
      desc: isPt ? "Envie vídeos brutos para edição" : "Send raw videos for editing",
      stat: rawCount > 0 ? `${rawCount} ${isPt ? "em edição" : "editing"}` : undefined,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      to: "/today",
      icon: Calendar,
      title: isPt ? "Entregas de Hoje" : "Today's Deliveries",
      desc: isPt ? "Veja as entregas do dia" : "See today's deliveries",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      to: "/my-videos",
      icon: Film,
      title: isPt ? "Meus Vídeos" : "My Videos",
      desc: isPt ? "Todos os vídeos editados" : "All edited videos",
      stat: editedCount > 0 ? `${editedCount} ${isPt ? "vídeos" : "videos"}` : undefined,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      to: "/calendar",
      icon: CalendarDays,
      title: isPt ? "Calendário" : "Calendar",
      desc: isPt ? "Visualize entregas no calendário" : "View deliveries on the calendar",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      to: "/plans",
      icon: CreditCard,
      title: isPt ? "Planos" : "Plans",
      desc: plan?.name
        ? `${isPt ? "Plano atual" : "Current plan"}: ${plan.name}`
        : isPt ? "Escolha seu plano" : "Choose your plan",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
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
          {isPt ? "Seu Painel" : "Your Dashboard"}
        </h1>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {navCards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{card.title}</p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.desc}</p>
                  {card.stat && (
                    <Badge variant="secondary" className="mt-2 text-[10px] h-5">
                      {card.stat}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
