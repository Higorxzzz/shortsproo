import { useLanguage } from "@/contexts/LanguageContext";
import { Zap } from "lucide-react";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="flex items-center gap-2 font-heading font-bold">
          <Zap className="h-5 w-5 text-primary" />
          ShortsPro
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ShortsPro. {t.footer.rights}
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground">{t.footer.privacy}</span>
          <span className="cursor-pointer hover:text-foreground">{t.footer.terms}</span>
        </div>
      </div>
    </footer>
  );
};
