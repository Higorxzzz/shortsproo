import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Film, CreditCard, Settings, ListTodo, UsersRound, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminLink = {
  to: string;
  icon: React.ElementType;
  labelKey: string;
  requiredRoles: string[];
};

const adminLinks: AdminLink[] = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "dashboard", requiredRoles: ["admin"] },
  { to: "/admin/production", icon: ListTodo, labelKey: "production", requiredRoles: ["admin", "manager", "editor"] },
  { to: "/admin/team", icon: UsersRound, labelKey: "team", requiredRoles: ["admin"] },
  { to: "/admin/users", icon: Users, labelKey: "users", requiredRoles: ["admin"] },
  { to: "/admin/plans", icon: CreditCard, labelKey: "plans", requiredRoles: ["admin"] },
  { to: "/admin/videos", icon: Film, labelKey: "videos", requiredRoles: ["admin", "manager"] },
  { to: "/admin/raw-videos", icon: Upload, labelKey: "rawVideos", requiredRoles: ["admin", "manager", "editor"] },
  { to: "/admin/settings", icon: Settings, labelKey: "settings", requiredRoles: ["admin"] },
];

const AdminLayout = () => {
  const { t } = useLanguage();
  const { isTeamMember, teamRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (!isTeamMember) return <Navigate to="/dashboard" />;

  const labels: Record<string, string> = {
    dashboard: t.admin.title,
    production: t.language === "pt" ? "Produção" : "Production",
    team: t.language === "pt" ? "Equipe" : "Team",
    users: t.admin.users,
    plans: t.admin.plans,
    videos: t.admin.videos,
    rawVideos: t.language === "pt" ? "Vídeos Brutos" : "Raw Videos",
    settings: t.admin.settings,
  };

  const visibleLinks = adminLinks.filter((link) => teamRole && link.requiredRoles.includes(teamRole));

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="flex flex-col gap-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {labels[link.labelKey]}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="flex w-full flex-col">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {labels[link.labelKey]}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
