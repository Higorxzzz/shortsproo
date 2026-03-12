import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Film, CreditCard, Settings, ListTodo, UsersRound, Upload, MessageCircle, Layout, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
  { to: "/admin/chats", icon: MessageCircle, labelKey: "chats", requiredRoles: ["admin", "manager"] },
  { to: "/admin/announcements", icon: MessageCircle, labelKey: "announcements", requiredRoles: ["admin"] },
  { to: "/admin/banners", icon: Image, labelKey: "banners", requiredRoles: ["admin"] },
  { to: "/admin/landing", icon: Layout, labelKey: "landing", requiredRoles: ["admin"] },
  { to: "/admin/settings", icon: Settings, labelKey: "settings", requiredRoles: ["admin"] },
];

const AdminLayout = () => {
  const { t } = useLanguage();
  const { user, isTeamMember, teamRole, loading, rolesLoaded } = useAuth();
  const location = useLocation();

  // Wait for auth AND roles to fully load
  if (loading || !rolesLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isTeamMember) return <Navigate to="/dashboard" replace />;

  const labels: Record<string, string> = {
    dashboard: t.admin.title,
    production: t.language === "pt" ? "Produção" : "Production",
    team: t.language === "pt" ? "Equipe" : "Team",
    users: t.admin.users,
    plans: t.admin.plans,
    videos: t.admin.videos,
    rawVideos: t.language === "pt" ? "Vídeos Brutos" : "Raw Videos",
    chats: t.language === "pt" ? "Chats" : "Chats",
    announcements: t.language === "pt" ? "Avisos" : "Announcements",
    banners: "Banners",
    landing: "Landing Page",
    settings: t.admin.settings,
  };

  const visibleLinks = adminLinks.filter((link) => teamRole && link.requiredRoles.includes(teamRole));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 mb-6 md:hidden">
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

      {/* Desktop tabs */}
      <div className="hidden md:flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 mb-6">
        {visibleLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {labels[link.labelKey]}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
};

export default AdminLayout;
