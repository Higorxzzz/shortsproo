import { useState, useEffect, useRef } from "react";
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
import { Loader2, Check, Upload, X, Image } from "lucide-react";

const PRESET_COLORS = [
  "#6C3AED", "#2563EB", "#0891B2", "#059669",
  "#D97706", "#DC2626", "#DB2777", "#7C3AED",
  "#4F46E5", "#0D9488", "#EA580C", "#9333EA",
];

const AdminSettings = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const { platformName, primaryColor, logoUrl, faviconUrl, refetch } = usePlatformSettings();

  const [name, setName] = useState(platformName);
  const [color, setColor] = useState(primaryColor);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [trialDays, setTrialDays] = useState("3");
  const [trialVideos, setTrialVideos] = useState("1");
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [savingTrial, setSavingTrial] = useState(false);

  const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl);
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState(faviconUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(platformName); }, [platformName]);
  useEffect(() => { setColor(primaryColor); }, [primaryColor]);
  useEffect(() => { setCurrentLogoUrl(logoUrl); }, [logoUrl]);
  useEffect(() => { setCurrentFaviconUrl(faviconUrl); }, [faviconUrl]);

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

  const uploadBrandingFile = async (file: File, type: "logo" | "favicon") => {
    const isLogo = type === "logo";
    const setter = isLogo ? setUploadingLogo : setUploadingFavicon;
    setter(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${type}.${ext}`;

      // Upload to branding bucket (overwrite)
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("branding").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now(); // cache bust

      // Save URL to platform_settings
      const now = new Date().toISOString();
      const settingKey = isLogo ? "logo_url" : "favicon_url";
      const { error: settingsError } = await supabase
        .from("platform_settings")
        .upsert({ key: settingKey, value: publicUrl, updated_at: now });

      if (settingsError) throw settingsError;

      if (isLogo) setCurrentLogoUrl(publicUrl);
      else setCurrentFaviconUrl(publicUrl);

      toast.success(isPt ? `${isLogo ? "Logo" : "Favicon"} atualizado!` : `${isLogo ? "Logo" : "Favicon"} updated!`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || (isPt ? "Erro no upload" : "Upload error"));
    } finally {
      setter(false);
    }
  };

  const removeBrandingFile = async (type: "logo" | "favicon") => {
    const isLogo = type === "logo";
    const now = new Date().toISOString();
    const settingKey = isLogo ? "logo_url" : "favicon_url";

    await supabase.from("platform_settings").upsert({ key: settingKey, value: "", updated_at: now });

    if (isLogo) setCurrentLogoUrl(null);
    else setCurrentFaviconUrl(null);

    toast.success(isPt ? `${isLogo ? "Logo" : "Favicon"} removido` : `${isLogo ? "Logo" : "Favicon"} removed`);
    refetch();
  };

  const hasGeneralChanges = name !== platformName || color !== primaryColor;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t.admin.settings}</h1>
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

        {/* Logo & Favicon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{isPt ? "Logo e Favicon" : "Logo & Favicon"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-sm">Logo</Label>
              <p className="text-xs text-muted-foreground">
                {isPt ? "Exibido no menu lateral e navbar. Recomendado: PNG transparente, 200×200px." : "Shown in sidebar and navbar. Recommended: transparent PNG, 200×200px."}
              </p>
              <div className="flex items-center gap-3">
                {currentLogoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={currentLogoUrl} alt="Logo" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center">
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBrandingFile(file, "logo");
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    {isPt ? "Enviar" : "Upload"}
                  </Button>
                  {currentLogoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => removeBrandingFile("logo")}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      {isPt ? "Remover" : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Favicon */}
            <div className="space-y-2">
              <Label className="text-sm">Favicon</Label>
              <p className="text-xs text-muted-foreground">
                {isPt ? "Ícone exibido na aba do navegador. Recomendado: PNG ou ICO, 32×32px ou 64×64px." : "Icon shown in browser tab. Recommended: PNG or ICO, 32×32px or 64×64px."}
              </p>
              <div className="flex items-center gap-3">
                {currentFaviconUrl ? (
                  <div className="relative h-10 w-10 shrink-0 rounded border border-border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={currentFaviconUrl} alt="Favicon" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded border border-dashed border-border bg-muted flex items-center justify-center">
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBrandingFile(file, "favicon");
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                  >
                    {uploadingFavicon ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    {isPt ? "Enviar" : "Upload"}
                  </Button>
                  {currentFaviconUrl && (
                    <Button variant="ghost" size="sm" onClick={() => removeBrandingFile("favicon")}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      {isPt ? "Remover" : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
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
