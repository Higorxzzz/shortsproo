import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Upload, Film, CreditCard, Settings, LogOut, Zap,
  LayoutDashboard, Users, ListTodo, UsersRound, HardDrive,
  Sun, Moon, Globe,
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

export function AppSidebar() {
  const { t } = useLanguage();
  const { user, isAdmin, isTeamMember, teamRole, signOut } = useAuth();
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const isPt = (t as any).language === "pt";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userLinks = [
    { to: "/dashboard", icon: Upload, label: isPt ? "Enviar Vídeo" : "Upload Video" },
    { to: "/my-videos", icon: Film, label: isPt ? "Meus Vídeos" : "My Videos" },
    { to: "/plans", icon: CreditCard, label: isPt ? "Planos" : "Plans" },
  ];

  const adminLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["admin"] },
    { to: "/admin/production", icon: ListTodo, label: isPt ? "Produção" : "Production", roles: ["admin", "manager", "editor"] },
    { to: "/admin/team", icon: UsersRound, label: isPt ? "Equipe" : "Team", roles: ["admin"] },
    { to: "/admin/users", icon: Users, label: isPt ? "Usuários" : "Users", roles: ["admin"] },
    { to: "/admin/plans", icon: CreditCard, label: isPt ? "Planos" : "Plans", roles: ["admin"] },
    { to: "/admin/videos", icon: Film, label: isPt ? "Vídeos" : "Videos", roles: ["admin", "manager"] },
    { to: "/admin/raw-videos", icon: HardDrive, label: isPt ? "Vídeos Brutos" : "Raw Videos", roles: ["admin", "manager", "editor"] },
    { to: "/admin/settings", icon: Settings, label: isPt ? "Configurações" : "Settings", roles: ["admin"] },
  ];

  const visibleAdminLinks = adminLinks.filter((link) => teamRole && link.roles.includes(teamRole));

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      {/* Header / Logo */}
      <SidebarHeader className="p-3">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-heading text-lg font-bold">ShortsPro</span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {/* User navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
              {isPt ? "Menu" : "Menu"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {userLinks.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={isActive(item.to)}>
                        <NavLink to={item.to}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin navigation */}
        {isTeamMember && visibleAdminLinks.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
                  Admin
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdminLinks.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={isActive(item.to)}>
                            <NavLink to={item.to}>
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <div className="flex flex-col gap-1">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {!collapsed && (theme === "dark" ? "Light" : "Dark")}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{isPt ? "Tema" : "Theme"}</TooltipContent>}
          </Tooltip>

          {/* Language toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(isPt ? "en" : "pt")}
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {!collapsed && (isPt ? "English" : "Português")}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{isPt ? "Idioma" : "Language"}</TooltipContent>}
          </Tooltip>

          <SidebarSeparator />

          {/* User info & logout */}
          {user && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(user.email?.[0] || "U").toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{user.email?.split("@")[0]}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              )}
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-2 text-xs text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && (t.nav.logout)}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{t.nav.logout}</TooltipContent>}
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
