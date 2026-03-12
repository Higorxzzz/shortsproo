import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SupportChat } from "@/components/SupportChat";
import { ArrowLeft, LogOut, Sun, Moon, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const UserLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isPublicRoute = ["/", "/login", "/register"].includes(location.pathname);

  // Public routes use Navbar
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Protected routes: redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedLayout />;
};

const AuthenticatedLayout = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { platformName, logoUrl } = usePlatformSettings();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isPt = language === "pt";
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex h-12 items-center justify-between px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {!isDashboard && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{isPt ? "Voltar" : "Back"}</span>
              </Link>
            )}
            <Link to="/dashboard" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={platformName} className="h-6 w-6 object-contain" />
              ) : null}
              <span className="text-sm font-semibold">{platformName}</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setLanguage(isPt ? "en" : "pt")}
            >
              <Globe className="h-4 w-4" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs text-muted-foreground gap-1.5 h-8"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isPt ? "Sair" : "Logout"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>

      <SupportChat />
    </div>
  );
};

export default UserLayout;
