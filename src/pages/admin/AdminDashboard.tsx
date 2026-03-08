import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Film, DollarSign, TrendingUp, UserCheck, Eye } from "lucide-react";

const AdminDashboard = () => {
  const { t } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, videosRes, plansRes] = await Promise.all([
        supabase.from("profiles").select("id, plan_id, suspended, created_at"),
        supabase.from("videos").select("id, status, uploaded_at"),
        supabase.from("plans").select("id, name, price"),
      ]);

      const users = usersRes.data || [];
      const videos = videosRes.data || [];
      const plans = plansRes.data || [];

      const activeUsers = users.filter((u) => !u.suspended && u.plan_id);
      const totalRevenue = activeUsers.reduce((sum, u) => {
        const plan = plans.find((p) => p.id === u.plan_id);
        return sum + (plan?.price || 0);
      }, 0);

      const now = new Date();
      const thisMonth = users.filter((u) => {
        const d = new Date(u.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const newVideosToday = videos.filter((v) => {
        const d = new Date(v.uploaded_at);
        return d.toDateString() === now.toDateString();
      });

      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalVideos: videos.length,
        videosToday: newVideosToday.length,
        monthlyRevenue: totalRevenue,
        newUsersThisMonth: thisMonth.length,
        conversionRate: users.length > 0 ? Math.round((activeUsers.length / users.length) * 100) : 0,
        downloadedVideos: videos.filter((v) => v.status === "downloaded").length,
      };
    },
  });

  const cards = [
    {
      title: t.language === "pt" ? "Usuários Totais" : "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t.language === "pt" ? "Usuários Ativos" : "Active Users",
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: t.language === "pt" ? "Shorts Publicados" : "Shorts Published",
      value: stats?.totalVideos || 0,
      icon: Film,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t.language === "pt" ? "Shorts Hoje" : "Shorts Today",
      value: stats?.videosToday || 0,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: t.language === "pt" ? "Receita Mensal" : "Monthly Revenue",
      value: `R$ ${(stats?.monthlyRevenue || 0).toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t.language === "pt" ? "Taxa de Conversão" : "Conversion Rate",
      value: `${stats?.conversionRate || 0}%`,
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">{t.admin.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentUsers />
        <RecentVideos />
      </div>
    </div>
  );
};

const RecentUsers = () => {
  const { t } = useLanguage();
  const { data: users = [] } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t.language === "pt" ? "Usuários Recentes" : "Recent Users"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{u.name || "-"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t.language === "pt" ? "Nenhum usuário ainda" : "No users yet"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RecentVideos = () => {
  const { t } = useLanguage();
  const { data: videos = [] } = useQuery({
    queryKey: ["admin-recent-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, title, status, uploaded_at")
        .order("uploaded_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t.language === "pt" ? "Vídeos Recentes" : "Recent Videos"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {videos.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.status}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(v.uploaded_at).toLocaleDateString()}
              </span>
            </div>
          ))}
          {videos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t.language === "pt" ? "Nenhum vídeo ainda" : "No videos yet"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
