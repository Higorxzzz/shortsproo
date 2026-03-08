import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Zap className="h-6 w-6 text-primary" />
          ShortsPro
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/plans" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.plans}
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.dashboard}
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.admin}
            </Link>
          )}
          <LanguageSwitcher />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>{t.nav.logout}</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">{t.nav.login}</Link></Button>
              <Button size="sm" asChild><Link to="/register">{t.nav.register}</Link></Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/plans" onClick={() => setMobileOpen(false)} className="text-sm">{t.nav.plans}</Link>
            {user && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm">{t.nav.dashboard}</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm">{t.nav.admin}</Link>}
            <LanguageSwitcher />
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>{t.nav.logout}</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild><Link to="/login" onClick={() => setMobileOpen(false)}>{t.nav.login}</Link></Button>
                <Button size="sm" asChild><Link to="/register" onClick={() => setMobileOpen(false)}>{t.nav.register}</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
