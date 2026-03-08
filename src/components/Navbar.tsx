import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
          <Link to="/plans" className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg hover:bg-muted/50">
            {t.nav.plans}
          </Link>
          <div className="ml-2 flex items-center gap-1 border-l border-border/50 pl-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link to="/dashboard">{t.nav.dashboard}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs">
                  {t.nav.logout}
                </Button>
              </>
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
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 hover:bg-muted/50">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/plans" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm">
              {t.nav.plans}
            </Link>
            <LanguageSwitcher />
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>{t.nav.dashboard}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  {t.nav.logout}
                </Button>
              </>
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
      )}
    </nav>
  );
};
