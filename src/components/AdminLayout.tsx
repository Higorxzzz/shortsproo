import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Film, CreditCard, Settings, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "dashboard" },
  { to: "/admin/production", icon: ListTodo, labelKey: "production" },
  { to: "/admin/users", icon: Users, labelKey: "users" },
  { to: "/admin/plans", icon: CreditCard, labelKey: "plans" },
  { to: "/admin/videos", icon: Film, labelKey: "videos" },
  { to: "/admin/settings", icon: Settings, labelKey: "settings" },
];

const AdminLayout = () => {
  const { t } = useLanguage();
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const labels: Record<string, string> = {
    dashboard: t.admin.title,
    production: t.language === "pt" ? "Produção" : "Production",
    users: t.admin.users,
    plans: t.admin.plans,
    videos: t.admin.videos,
    settings: t.admin.settings,
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="flex flex-col gap-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
          {adminLinks.map((link) => {
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
          {adminLinks.map((link) => {
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
