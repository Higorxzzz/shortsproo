import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Film, DollarSign, TrendingUp, UserCheck, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(250, 84%, 54%)",
  "hsl(170, 80%, 45%)",
  "hsl(280, 80%, 60%)",
  "hsl(30, 90%, 55%)",
];

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

      // Build monthly data for charts (last 6 months)
      const monthlyUsers: { month: string; users: number }[] = [];
      const monthlyVideos: { month: string; videos: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("pt-BR", { month: "short" });
        const count = users.filter((u) => {
          const ud = new Date(u.created_at);
          return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
        }).length;
        const vCount = videos.filter((v) => {
          const vd = new Date(v.uploaded_at);
          return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
        }).length;
        monthlyUsers.push({ month: label, users: count });
        monthlyVideos.push({ month: label, videos: vCount });
      }

      // Plan distribution
      const planDist = plans.map((p) => ({
        name: p.name,
        value: users.filter((u) => u.plan_id === p.id).length,
      })).filter((p) => p.value > 0);

      // Video status
      const videoStatus = [
        { name: t.language === "pt" ? "Novos" : "New", value: videos.filter((v) => v.status === "new").length },
        { name: t.language === "pt" ? "Baixados" : "Downloaded", value: videos.filter((v) => v.status === "downloaded").length },
      ].filter((s) => s.value > 0);

      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalVideos: videos.length,
        videosToday: newVideosToday.length,
        monthlyRevenue: totalRevenue,
        newUsersThisMonth: thisMonth.length,
        conversionRate: users.length > 0 ? Math.round((activeUsers.length / users.length) * 100) : 0,
        monthlyUsers,
        monthlyVideos,
        planDist,
        videoStatus,
      };
    },
  });

  const cards = [
    { title: t.language === "pt" ? "Usuários Totais" : "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: t.language === "pt" ? "Usuários Ativos" : "Active Users", value: stats?.activeUsers || 0, icon: UserCheck, color: "text-accent", bgColor: "bg-accent/10" },
    { title: t.language === "pt" ? "Shorts Publicados" : "Shorts Published", value: stats?.totalVideos || 0, icon: Film, color: "text-primary", bgColor: "bg-primary/10" },
    { title: t.language === "pt" ? "Shorts Hoje" : "Shorts Today", value: stats?.videosToday || 0, icon: TrendingUp, color: "text-accent", bgColor: "bg-accent/10" },
    { title: t.language === "pt" ? "Receita Mensal" : "Monthly Revenue", value: `R$ ${(stats?.monthlyRevenue || 0).toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10" },
    { title: t.language === "pt" ? "Taxa de Conversão" : "Conversion Rate", value: `${stats?.conversionRate || 0}%`, icon: Eye, color: "text-accent", bgColor: "bg-accent/10" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">{t.admin.title}</h1>

      {/* Metric cards */}
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

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* User growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Crescimento de Usuários" : "User Growth"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.monthlyUsers || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="users" fill="hsl(250, 84%, 54%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Video uploads over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Shorts Enviados por Mês" : "Shorts Uploaded per Month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.monthlyVideos || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="videos" stroke="hsl(170, 80%, 45%)" strokeWidth={2} dot={{ fill: "hsl(170, 80%, 45%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Distribuição por Plano" : "Plan Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.planDist?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats?.planDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats?.planDist?.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                {t.language === "pt" ? "Sem dados ainda" : "No data yet"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Video status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Status dos Vídeos" : "Video Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.videoStatus?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats?.videoStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats?.videoStatus?.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                {t.language === "pt" ? "Sem dados ainda" : "No data yet"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
