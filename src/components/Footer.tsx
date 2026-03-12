import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";

export const Footer = () => {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 px-4 md:flex-row">
        <span className="text-sm font-medium">{platformName}</span>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {platformName}. {t.footer.rights}
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground">{t.footer.privacy}</span>
          <span className="cursor-pointer hover:text-foreground">{t.footer.terms}</span>
        </div>
      </div>
    </footer>
  );
};
