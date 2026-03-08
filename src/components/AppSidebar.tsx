import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Upload, Film, CreditCard, Settings, LogOut, Zap,
  LayoutDashboard, Users, ListTodo, UsersRound, HardDrive,
  Sun, Moon, Globe, Home, UserPlus, LogIn, MessageCircle,
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

  const publicLinks = [
    { to: "/", icon: Home, label: isPt ? "Início" : "Home" },
    { to: "/plans", icon: CreditCard, label: isPt ? "Planos" : "Plans" },
  ];

  const authLinks = [
    { to: "/login", icon: LogIn, label: isPt ? "Entrar" : "Sign in" },
    { to: "/register", icon: UserPlus, label: isPt ? "Cadastrar" : "Sign up" },
  ];

  const userLinks = [
    { to: "/dashboard", icon: Upload, label: isPt ? "Enviar Vídeo" : "Upload Video" },
    { to: "/my-videos", icon: Film, label: isPt ? "Meus Vídeos" : "My Videos" },
  ];

  const adminLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["admin"] },
    { to: "/admin/production", icon: ListTodo, label: isPt ? "Produção" : "Production", roles: ["admin", "manager", "editor"] },
    { to: "/admin/team", icon: UsersRound, label: isPt ? "Equipe" : "Team", roles: ["admin"] },
    { to: "/admin/users", icon: Users, label: isPt ? "Usuários" : "Users", roles: ["admin"] },
    { to: "/admin/plans", icon: CreditCard, label: isPt ? "Planos" : "Plans", roles: ["admin"] },
    { to: "/admin/videos", icon: Film, label: isPt ? "Vídeos" : "Videos", roles: ["admin", "manager"] },
    { to: "/admin/raw-videos", icon: HardDrive, label: isPt ? "Vídeos Brutos" : "Raw Videos", roles: ["admin", "manager", "editor"] },
    { to: "/admin/chats", icon: MessageCircle, label: "Chats", roles: ["admin", "manager"] },
    { to: "/admin/settings", icon: Settings, label: isPt ? "Config." : "Settings", roles: ["admin"] },
  ];

  const visibleAdminLinks = adminLinks.filter((link) => teamRole && link.roles.includes(teamRole));

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
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
        {/* Public links */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
              {isPt ? "Navegação" : "Navigation"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {publicLinks.map((item) => (
                <SidebarLink key={item.to} collapsed={collapsed} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Auth links (only when not logged in) */}
        {!user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
                  {isPt ? "Conta" : "Account"}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {authLinks.map((item) => (
                    <SidebarLink key={item.to} collapsed={collapsed} {...item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* User links (only when logged in) */}
        {user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
                  {isPt ? "Meu Painel" : "My Panel"}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {userLinks.map((item) => (
                    <SidebarLink key={item.to} collapsed={collapsed} {...item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Admin links */}
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
                    <SidebarLink key={item.to} collapsed={collapsed} {...item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <div className="flex flex-col gap-0.5">
          {/* Theme */}
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

          {/* Language */}
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

          {/* User section */}
          {user && (
            <>
              <SidebarSeparator className="my-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 cursor-default">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {(user.email?.[0] || "U").toUpperCase()}
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium">{user.email?.split("@")[0]}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{user.email}</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive h-8"
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
