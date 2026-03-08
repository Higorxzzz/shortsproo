import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
      className="gap-1 text-xs"
    >
      <Globe className="h-4 w-4" />
      {language === "pt" ? "EN" : "PT"}
    </Button>
  );
};
