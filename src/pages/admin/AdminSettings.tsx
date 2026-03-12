import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

const PRESET_COLORS = [
  "#6C3AED", "#2563EB", "#0891B2", "#059669",
  "#D97706", "#DC2626", "#DB2777", "#7C3AED",
  "#4F46E5", "#0D9488", "#EA580C", "#9333EA",
];

const AdminSettings = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const { platformName, primaryColor, refetch } = usePlatformSettings();

  const [name, setName] = useState(platformName);
  const [color, setColor] = useState(primaryColor);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [trialDays, setTrialDays] = useState("3");
  const [trialVideos, setTrialVideos] = useState("1");
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [savingTrial, setSavingTrial] = useState(false);

  useEffect(() => { setName(platformName); }, [platformName]);
  useEffect(() => { setColor(primaryColor); }, [primaryColor]);

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

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    const now = new Date().toISOString();
    const results = await Promise.all([
      supabase.from("platform_settings").upsert({ key: "platform_name", value: name, updated_at: now }),
      supabase.from("platform_settings").upsert({ key: "primary_color", value: color, updated_at: now }),
    ]);
    if (results.some((r) => r.error)) {
      toast.error(isPt ? "Erro ao salvar" : "Error saving");
    } else {
      toast.success(isPt ? "Configurações salvas!" : "Settings saved!");
      refetch();
    }
    setSavingGeneral(false);
  };

  const handleSaveTrial = async () => {
    setSavingTrial(true);
    const now = new Date().toISOString();
    const results = await Promise.all([
      supabase.from("platform_settings").upsert({ key: "free_trial_days", value: trialDays, updated_at: now }),
      supabase.from("platform_settings").upsert({ key: "free_trial_videos_per_day", value: trialVideos, updated_at: now }),
    ]);
    if (results.some((r) => r.error)) {
      toast.error(isPt ? "Erro ao salvar" : "Error saving");
    } else {
      toast.success(isPt ? "Configurações do trial salvas!" : "Trial settings saved!");
    }
    setSavingTrial(false);
  };

  const hasGeneralChanges = name !== platformName || color !== primaryColor;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold">{t.admin.settings}</h1>
        <p className="text-sm text-muted-foreground">
          {isPt ? "Personalize a plataforma" : "Customize the platform"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Branding */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{isPt ? "Marca" : "Branding"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t.admin.platformName}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ShortsPro" className="max-w-xs" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm">{t.admin.primaryColor}</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="relative h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: color === c ? "hsl(var(--foreground))" : "transparent" }}
                  >
                    {color === c && <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 shrink-0 rounded-lg border border-border relative overflow-hidden" style={{ backgroundColor: color }}>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                </div>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6C3AED" className="max-w-[120px] font-mono text-xs" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={savingGeneral || !hasGeneralChanges} size="sm">
                {savingGeneral && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {t.admin.saveSettings}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{isPt ? "Plano Gratuito (Trial)" : "Free Trial"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrial ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isPt ? "Carregando..." : "Loading..."}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{isPt ? "Duração (dias)" : "Duration (days)"}</Label>
                    <Input type="number" min="1" max="365" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{isPt ? "Vídeos por dia" : "Videos per day"}</Label>
                    <Input type="number" min="1" max="100" value={trialVideos} onChange={(e) => setTrialVideos(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPt
                    ? `Novos usuários receberão ${trialVideos} vídeo${Number(trialVideos) !== 1 ? "s" : ""}/dia durante ${trialDays} dias`
                    : `New users will receive ${trialVideos} video${Number(trialVideos) !== 1 ? "s" : ""}/day for ${trialDays} days`}
                </p>
                <div className="flex justify-end">
                  <Button onClick={handleSaveTrial} disabled={savingTrial} size="sm">
                    {savingTrial && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {isPt ? "Salvar" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{isPt ? "Idiomas" : "Languages"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span>🇧🇷</span>
                <span className="text-sm">Português</span>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span>🇺🇸</span>
                <span className="text-sm">English</span>
              </div>
              <Switch checked disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
