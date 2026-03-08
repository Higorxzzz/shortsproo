import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    platformName: "ShortsPro",
    primaryColor: "#6C3AED",
  });

  const handleSave = () => {
    localStorage.setItem("platform_settings", JSON.stringify(settings));
    toast.success(t.language === "pt" ? "Configurações salvas!" : "Settings saved!");
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">{t.admin.settings}</h1>

      <div className="grid gap-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Configurações Gerais" : "General Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>{t.admin.platformName}</Label>
              <Input
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>
            <div>
              <Label>{t.admin.primaryColor}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={handleSave}>{t.admin.saveSettings}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.language === "pt" ? "Idiomas Ativos" : "Active Languages"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="rounded" /> Português
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="rounded" /> English
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
