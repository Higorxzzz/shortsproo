import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Palette, Type, Gift, CalendarDays, Film, Globe, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

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
    <div className="max-w-2xl">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t.admin.settings}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Personalize a aparência e comportamento da plataforma" : "Customize the platform's appearance and behavior"}
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Branding Card */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{isPt ? "Identidade da Marca" : "Brand Identity"}</CardTitle>
                  <CardDescription className="text-xs">
                    {isPt ? "Nome e cor principal da plataforma" : "Platform name and primary color"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Platform Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">{t.admin.platformName}</Label>
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ShortsPro"
                  className="max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {isPt ? "Exibido na navbar, sidebar e rodapé" : "Shown in navbar, sidebar and footer"}
                </p>
              </div>

              <Separator />

              {/* Primary Color */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">{t.admin.primaryColor}</Label>
                </div>

                {/* Color presets */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                      }}
                    >
                      {color === c && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom color */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl border border-border shadow-sm cursor-pointer relative overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6C3AED"
                    className="max-w-[140px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {isPt ? "Ou escolha uma cor personalizada" : "Or pick a custom color"}
                  </p>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {isPt ? "Pré-visualização" : "Preview"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: color + "1A" }}>
                      <Sparkles className="h-4 w-4" style={{ color }} />
                    </div>
                    <span className="font-heading font-bold">{name || "ShortsPro"}</span>
                    <div className="ml-auto flex gap-2">
                      <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: color }}>
                        {isPt ? "Botão" : "Button"}
                      </button>
                      <button className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ color, borderColor: color + "40" }}>
                        {isPt ? "Secundário" : "Secondary"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center justify-between pt-2">
                {hasGeneralChanges && (
                  <Badge variant="secondary" className="text-xs">
                    {isPt ? "Alterações não salvas" : "Unsaved changes"}
                  </Badge>
                )}
                <Button
                  onClick={handleSaveGeneral}
                  disabled={savingGeneral || !hasGeneralChanges}
                  className="ml-auto"
                >
                  {savingGeneral && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.admin.saveSettings}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Free Trial Card */}
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Gift className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-base">{isPt ? "Plano Gratuito (Trial)" : "Free Trial Plan"}</CardTitle>
                  <CardDescription className="text-xs">
                    {isPt ? "Configure o período de teste para novos usuários" : "Set up the trial period for new users"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingTrial ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isPt ? "Carregando..." : "Loading..."}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">{isPt ? "Duração (dias)" : "Duration (days)"}</Label>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={trialDays}
                        onChange={(e) => setTrialDays(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {isPt ? "Período de acesso gratuito" : "Free access period"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">{isPt ? "Vídeos por dia" : "Videos per day"}</Label>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={trialVideos}
                        onChange={(e) => setTrialVideos(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {isPt ? "Entregas diárias no trial" : "Daily deliveries during trial"}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
                    <Gift className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {isPt
                        ? `Novos usuários receberão ${trialVideos} vídeo${Number(trialVideos) !== 1 ? "s" : ""}/dia durante ${trialDays} dias`
                        : `New users will receive ${trialVideos} video${Number(trialVideos) !== 1 ? "s" : ""}/day for ${trialDays} days`}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveTrial} disabled={savingTrial}>
                      {savingTrial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isPt ? "Salvar Trial" : "Save Trial"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Languages Card */}
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">{isPt ? "Idiomas" : "Languages"}</CardTitle>
                  <CardDescription className="text-xs">
                    {isPt ? "Idiomas disponíveis na plataforma" : "Available languages on the platform"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇧🇷</span>
                    <div>
                      <p className="text-sm font-medium">Português</p>
                      <p className="text-xs text-muted-foreground">{isPt ? "Idioma padrão" : "Default language"}</p>
                    </div>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇺🇸</span>
                    <div>
                      <p className="text-sm font-medium">English</p>
                      <p className="text-xs text-muted-foreground">{isPt ? "Disponível" : "Available"}</p>
                    </div>
                  </div>
                  <Switch checked disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
