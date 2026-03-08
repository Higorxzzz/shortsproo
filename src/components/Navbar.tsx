import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, Zap, Upload, Film } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { t } = useLanguage();
  const { user, isAdmin, isTeamMember, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPt = (t as any).language === "pt";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: React.ElementType }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg",
        isActive(to)
          ? "text-primary bg-primary/8"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          ShortsPro
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/plans">{t.nav.plans}</NavItem>
          {user && (
            <>
              <NavItem to="/dashboard" icon={Upload}>
                {isPt ? "Enviar" : "Upload"}
              </NavItem>
              <NavItem to="/my-videos" icon={Film}>
                {isPt ? "Meus Vídeos" : "My Videos"}
              </NavItem>
            </>
          )}
          {isTeamMember && (
            <NavItem to={isAdmin ? "/admin" : "/admin/production"}>
              {t.nav.admin}
            </NavItem>
          )}
          <div className="ml-2 flex items-center gap-1 border-l border-border/50 pl-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs">
                {t.nav.logout}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link to="/login">{t.nav.login}</Link>
                </Button>
                <Button size="sm" asChild className="text-xs">
                  <Link to="/register">{t.nav.register}</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 hover:bg-muted/50"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              to="/plans"
              onClick={() => setMobileOpen(false)}
              className={cn("rounded-lg px-3 py-2.5 text-sm font-medium", isActive("/plans") ? "bg-primary/8 text-primary" : "text-muted-foreground")}
            >
              {t.nav.plans}
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium", isActive("/dashboard") ? "bg-primary/8 text-primary" : "text-muted-foreground")}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {isPt ? "Enviar" : "Upload"}
                </Link>
                <Link
                  to="/my-videos"
                  onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium", isActive("/my-videos") ? "bg-primary/8 text-primary" : "text-muted-foreground")}
                >
                  <Film className="h-3.5 w-3.5" />
                  {isPt ? "Meus Vídeos" : "My Videos"}
                </Link>
              </>
            )}
            {isTeamMember && (
              <Link
                to={isAdmin ? "/admin" : "/admin/production"}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                {t.nav.admin}
              </Link>
            )}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
              <LanguageSwitcher />
              {user ? (
                <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }} className="text-xs">
                  {t.nav.logout}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>{t.nav.login}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>{t.nav.register}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
