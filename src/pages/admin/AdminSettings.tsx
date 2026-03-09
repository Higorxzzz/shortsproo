import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AdminSettings = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const [settings, setSettings] = useState({
    platformName: "ShortsPro",
    primaryColor: "#6C3AED",
  });
  const [trialDays, setTrialDays] = useState("3");
  const [trialVideos, setTrialVideos] = useState("1");
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [savingTrial, setSavingTrial] = useState(false);

  useEffect(() => {
    const fetchTrialSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["free_trial_days", "free_trial_videos_per_day"]);

      if (data) {
        for (const row of data) {
          if (row.key === "free_trial_days") setTrialDays(row.value);
          if (row.key === "free_trial_videos_per_day") setTrialVideos(row.value);
        }
      }
      setLoadingTrial(false);
    };
    fetchTrialSettings();
  }, []);

  const handleSave = () => {
    localStorage.setItem("platform_settings", JSON.stringify(settings));
    toast.success(isPt ? "Configurações salvas!" : "Settings saved!");
  };

  const handleSaveTrial = async () => {
    setSavingTrial(true);
    const updates = [
      supabase.from("platform_settings").upsert({ key: "free_trial_days", value: trialDays, updated_at: new Date().toISOString() }),
      supabase.from("platform_settings").upsert({ key: "free_trial_videos_per_day", value: trialVideos, updated_at: new Date().toISOString() }),
    ];
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast.error(isPt ? "Erro ao salvar configurações do trial" : "Error saving trial settings");
    } else {
      toast.success(isPt ? "Configurações do plano gratuito salvas!" : "Free trial settings saved!");
    }
    setSavingTrial(false);
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">{t.admin.settings}</h1>

      <div className="grid gap-6 max-w-lg">
        {/* Free Trial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isPt ? "Plano Gratuito (Trial)" : "Free Trial Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loadingTrial ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isPt ? "Carregando..." : "Loading..."}
              </div>
            ) : (
              <>
                <div>
                  <Label>{isPt ? "Duração do trial (dias)" : "Trial duration (days)"}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPt
                      ? "Novos usuários terão acesso gratuito por esse período"
                      : "New users will have free access for this period"}
                  </p>
                </div>
                <div>
                  <Label>{isPt ? "Vídeos por dia (trial)" : "Videos per day (trial)"}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={trialVideos}
                    onChange={(e) => setTrialVideos(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveTrial} disabled={savingTrial}>
                  {savingTrial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPt ? "Salvar Trial" : "Save Trial"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isPt ? "Configurações Gerais" : "General Settings"}
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
              {isPt ? "Idiomas Ativos" : "Active Languages"}
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
