import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, ListTodo, UsersRound, HardDrive,
  Sun, Moon, Globe, LogOut, MessageCircle, Megaphone, Layout,
  CreditCard, Settings, Film, Home,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SidebarLink({ to, icon: Icon, label, collapsed }: { to: string; icon: React.ElementType; label: string; collapsed: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton asChild isActive={isActive}>
            <NavLink to={to}>
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          </SidebarMenuButton>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { t, language, setLanguage } = useLanguage();
  const { platformName, logoUrl } = usePlatformSettings();
  const { user, isTeamMember, teamRole, signOut } = useAuth();
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const isPt = language === "pt";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Admin links only
  const adminLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["admin"] },
    { to: "/admin/production", icon: ListTodo, label: isPt ? "Produção" : "Production", roles: ["admin", "manager", "editor"] },
    { to: "/admin/team", icon: UsersRound, label: isPt ? "Equipe" : "Team", roles: ["admin"] },
    { to: "/admin/users", icon: Users, label: isPt ? "Usuários" : "Users", roles: ["admin"] },
    { to: "/admin/plans", icon: CreditCard, label: isPt ? "Planos" : "Plans", roles: ["admin"] },
    { to: "/admin/videos", icon: Film, label: isPt ? "Vídeos" : "Videos", roles: ["admin", "manager"] },
    { to: "/admin/raw-videos", icon: HardDrive, label: isPt ? "Vídeos Brutos" : "Raw Videos", roles: ["admin", "manager", "editor"] },
    { to: "/admin/chats", icon: MessageCircle, label: "Chats", roles: ["admin", "manager"] },
    { to: "/admin/announcements", icon: Megaphone, label: isPt ? "Avisos" : "Announcements", roles: ["admin"] },
    { to: "/admin/landing", icon: Layout, label: "Landing Page", roles: ["admin"] },
    { to: "/admin/settings", icon: Settings, label: isPt ? "Config." : "Settings", roles: ["admin"] },
  ];

  const visibleAdminLinks = adminLinks.filter((link) => teamRole && link.roles.includes(teamRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <NavLink to="/" className="flex items-center gap-2.5 px-2 py-1.5">
          {logoUrl ? (
            <img src={logoUrl} alt={platformName} className="h-7 w-7 shrink-0 object-contain" />
          ) : null}
          {!collapsed && (
            <span className="text-base font-semibold">{platformName}</span>
          )}
          {collapsed && !logoUrl && (
            <span className="text-base font-semibold">{platformName.charAt(0)}</span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {/* Admin links only for team members */}
        {isTeamMember && visibleAdminLinks.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Admin
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminLinks.map((item) => (
                  <SidebarLink key={item.to} collapsed={collapsed} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="flex flex-col gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground h-8"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{isPt ? "Tema" : "Theme"}</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(isPt ? "en" : "pt")}
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <Globe className="h-4 w-4 shrink-0" />
                {!collapsed && (isPt ? "English" : "Português")}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{isPt ? "Idioma" : "Language"}</TooltipContent>}
          </Tooltip>

          {user && (
            <>
              <SidebarSeparator className="my-1" />
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                  {(user.email?.[0] || "U").toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{user.email?.split("@")[0]}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && (t.nav.logout)}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{t.nav.logout}</TooltipContent>}
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
