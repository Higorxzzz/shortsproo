import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLandingSettings, LandingConfig } from "@/contexts/LandingSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Loader2, Power, Zap, BarChart3, ListChecks, Wrench,
  MessageSquareQuote, HelpCircle, Megaphone, ChevronDown,
  Save, RotateCcw, Eye, EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { translations } from "@/i18n/translations";

type SectionKey = keyof LandingConfig["sections"];

interface SectionDef {
  key: SectionKey;
  icon: React.ElementType;
  labelPt: string;
  labelEn: string;
  fields: { key: string; labelPt: string; labelEn: string; multiline?: boolean }[];
}

const SECTIONS: SectionDef[] = [
  {
    key: "hero",
    icon: Zap,
    labelPt: "Hero (Banner Principal)",
    labelEn: "Hero (Main Banner)",
    fields: [
      { key: "hero.badge", labelPt: "Badge", labelEn: "Badge" },
      { key: "hero.title", labelPt: "Título", labelEn: "Title" },
      { key: "hero.subtitle", labelPt: "Subtítulo", labelEn: "Subtitle" },
      { key: "hero.cta", labelPt: "Botão Principal", labelEn: "Main Button" },
      { key: "hero.ctaSecondary", labelPt: "Botão Secundário", labelEn: "Secondary Button" },
    ],
  },
  {
    key: "stats",
    icon: BarChart3,
    labelPt: "Estatísticas",
    labelEn: "Statistics",
    fields: [
      { key: "stats.creators", labelPt: "Label: Criadores", labelEn: "Label: Creators" },
      { key: "stats.delivered", labelPt: "Label: Entregues", labelEn: "Label: Delivered" },
      { key: "stats.views", labelPt: "Label: Views", labelEn: "Label: Views" },
      { key: "stats.satisfaction", labelPt: "Label: Satisfação", labelEn: "Label: Satisfaction" },
    ],
  },
  {
    key: "howItWorks",
    icon: ListChecks,
    labelPt: "Como Funciona",
    labelEn: "How It Works",
    fields: [
      { key: "features.title", labelPt: "Título da Seção", labelEn: "Section Title" },
      { key: "features.step1Title", labelPt: "Passo 1 - Título", labelEn: "Step 1 - Title" },
      { key: "features.step1Desc", labelPt: "Passo 1 - Descrição", labelEn: "Step 1 - Description" },
      { key: "features.step2Title", labelPt: "Passo 2 - Título", labelEn: "Step 2 - Title" },
      { key: "features.step2Desc", labelPt: "Passo 2 - Descrição", labelEn: "Step 2 - Description" },
      { key: "features.step3Title", labelPt: "Passo 3 - Título", labelEn: "Step 3 - Title" },
      { key: "features.step3Desc", labelPt: "Passo 3 - Descrição", labelEn: "Step 3 - Description" },
    ],
  },
  {
    key: "services",
    icon: Wrench,
    labelPt: "Serviços",
    labelEn: "Services",
    fields: [
      { key: "services.title", labelPt: "Título", labelEn: "Title" },
      { key: "services.subtitle", labelPt: "Subtítulo", labelEn: "Subtitle" },
      { key: "services.item1Title", labelPt: "Serviço 1 - Título", labelEn: "Service 1 - Title" },
      { key: "services.item1Desc", labelPt: "Serviço 1 - Descrição", labelEn: "Service 1 - Description" },
      { key: "services.item2Title", labelPt: "Serviço 2 - Título", labelEn: "Service 2 - Title" },
      { key: "services.item2Desc", labelPt: "Serviço 2 - Descrição", labelEn: "Service 2 - Description" },
      { key: "services.item3Title", labelPt: "Serviço 3 - Título", labelEn: "Service 3 - Title" },
      { key: "services.item3Desc", labelPt: "Serviço 3 - Descrição", labelEn: "Service 3 - Description" },
      { key: "services.item4Title", labelPt: "Serviço 4 - Título", labelEn: "Service 4 - Title" },
      { key: "services.item4Desc", labelPt: "Serviço 4 - Descrição", labelEn: "Service 4 - Description" },
    ],
  },
  {
    key: "testimonials",
    icon: MessageSquareQuote,
    labelPt: "Depoimentos",
    labelEn: "Testimonials",
    fields: [
      { key: "testimonials.title", labelPt: "Título", labelEn: "Title" },
      { key: "testimonials.subtitle", labelPt: "Subtítulo", labelEn: "Subtitle" },
      { key: "testimonials.t1Name", labelPt: "Depoimento 1 - Nome", labelEn: "Testimonial 1 - Name" },
      { key: "testimonials.t1Role", labelPt: "Depoimento 1 - Cargo", labelEn: "Testimonial 1 - Role" },
      { key: "testimonials.t1Text", labelPt: "Depoimento 1 - Texto", labelEn: "Testimonial 1 - Text", multiline: true },
      { key: "testimonials.t2Name", labelPt: "Depoimento 2 - Nome", labelEn: "Testimonial 2 - Name" },
      { key: "testimonials.t2Role", labelPt: "Depoimento 2 - Cargo", labelEn: "Testimonial 2 - Role" },
      { key: "testimonials.t2Text", labelPt: "Depoimento 2 - Texto", labelEn: "Testimonial 2 - Text", multiline: true },
      { key: "testimonials.t3Name", labelPt: "Depoimento 3 - Nome", labelEn: "Testimonial 3 - Name" },
      { key: "testimonials.t3Role", labelPt: "Depoimento 3 - Cargo", labelEn: "Testimonial 3 - Role" },
      { key: "testimonials.t3Text", labelPt: "Depoimento 3 - Texto", labelEn: "Testimonial 3 - Text", multiline: true },
    ],
  },
  {
    key: "faq",
    icon: HelpCircle,
    labelPt: "FAQ",
    labelEn: "FAQ",
    fields: [
      { key: "faq.title", labelPt: "Título", labelEn: "Title" },
      { key: "faq.q1", labelPt: "Pergunta 1", labelEn: "Question 1" },
      { key: "faq.a1", labelPt: "Resposta 1", labelEn: "Answer 1", multiline: true },
      { key: "faq.q2", labelPt: "Pergunta 2", labelEn: "Question 2" },
      { key: "faq.a2", labelPt: "Resposta 2", labelEn: "Answer 2", multiline: true },
      { key: "faq.q3", labelPt: "Pergunta 3", labelEn: "Question 3" },
      { key: "faq.a3", labelPt: "Resposta 3", labelEn: "Answer 3", multiline: true },
      { key: "faq.q4", labelPt: "Pergunta 4", labelEn: "Question 4" },
      { key: "faq.a4", labelPt: "Resposta 4", labelEn: "Answer 4", multiline: true },
      { key: "faq.q5", labelPt: "Pergunta 5", labelEn: "Question 5" },
      { key: "faq.a5", labelPt: "Resposta 5", labelEn: "Answer 5", multiline: true },
    ],
  },
  {
    key: "cta",
    icon: Megaphone,
    labelPt: "CTA Final",
    labelEn: "Final CTA",
    fields: [
      { key: "cta.title", labelPt: "Título", labelEn: "Title" },
      { key: "cta.subtitle", labelPt: "Subtítulo", labelEn: "Subtitle" },
      { key: "cta.button", labelPt: "Texto do Botão", labelEn: "Button Text" },
    ],
  },
];

function getDefaultText(key: string, lang: string): string {
  const [section, field] = key.split(".");
  const t = (translations as any)[lang]?.[section]?.[field];
  return typeof t === "string" ? t : "";
}

const AdminLandingPage = () => {
  const { t, language } = useLanguage();
  const isPt = language === "pt";
  const { landingEnabled, config, refetch } = useLandingSettings();

  const [enabled, setEnabled] = useState(landingEnabled);
  const [sections, setSections] = useState(config.sections);
  const [content, setContent] = useState<Record<string, string>>(config.content);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => { setEnabled(landingEnabled); }, [landingEnabled]);
  useEffect(() => { setSections(config.sections); }, [config.sections]);
  useEffect(() => { setContent(config.content); }, [config.content]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateContent = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const clearField = (key: string) => {
    setContent((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const newConfig: LandingConfig = { sections, content };

    const results = await Promise.all([
      supabase.from("platform_settings").upsert({ key: "landing_enabled", value: String(enabled), updated_at: now }),
      supabase.from("platform_settings").upsert({ key: "landing_config", value: JSON.stringify(newConfig), updated_at: now }),
    ]);

    if (results.some((r) => r.error)) {
      toast.error(isPt ? "Erro ao salvar" : "Error saving");
    } else {
      toast.success(isPt ? "Landing page atualizada!" : "Landing page updated!");
      await refetch();
    }
    setSaving(false);
  };

  const editedFieldsCount = Object.keys(content).filter((k) => content[k]?.trim()).length;

  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {isPt ? "Landing Page" : "Landing Page"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Gerencie a página inicial, ative/desative seções e edite todos os textos" : "Manage the home page, toggle sections and edit all text"}
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className={`overflow-hidden transition-colors ${!enabled ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${enabled ? "bg-primary/10" : "bg-destructive/10"}`}>
                  <Power className={`h-5 w-5 ${enabled ? "text-primary" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {isPt ? "Landing Page" : "Landing Page"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {enabled
                      ? (isPt ? "Ativa — visitantes veem a página inicial" : "Active — visitors see the landing page")
                      : (isPt ? "Desativada — visitantes vão direto para o Login" : "Disabled — visitors go straight to Login")}
                  </p>
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        {enabled && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            {SECTIONS.map((section, idx) => {
              const isOpen = !!openSections[section.key];
              const sectionEnabled = sections[section.key];
              const Icon = section.icon;
              const editedInSection = section.fields.filter((f) => content[f.key]?.trim()).length;

              return (
                <Card key={section.key} className={`overflow-hidden transition-all ${!sectionEnabled ? "opacity-60" : ""}`}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.key)}>
                    <div className="flex items-center justify-between px-5 py-4">
                      <CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{isPt ? section.labelPt : section.labelEn}</p>
                            {editedInSection > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                {editedInSection} {isPt ? "editado(s)" : "edited"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {section.fields.length} {isPt ? "campos" : "fields"}
                          </p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <div className="ml-3 flex items-center gap-2">
                        {sectionEnabled ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={sectionEnabled}
                          onCheckedChange={(v) => setSections((prev) => ({ ...prev, [section.key]: v }))}
                        />
                      </div>
                    </div>

                    <CollapsibleContent>
                      <Separator />
                      <div className="p-5 space-y-4">
                        {section.fields.map((field) => {
                          const defaultVal = getDefaultText(field.key, language);
                          const customVal = content[field.key] || "";
                          const isEdited = !!customVal.trim();

                          return (
                            <div key={field.key} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                  {isPt ? field.labelPt : field.labelEn}
                                </Label>
                                {isEdited && (
                                  <button
                                    onClick={() => clearField(field.key)}
                                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    {isPt ? "Resetar" : "Reset"}
                                  </button>
                                )}
                              </div>
                              {field.multiline ? (
                                <Textarea
                                  value={customVal}
                                  onChange={(e) => updateContent(field.key, e.target.value)}
                                  placeholder={defaultVal}
                                  className="text-sm min-h-[60px]"
                                />
                              ) : (
                                <Input
                                  value={customVal}
                                  onChange={(e) => updateContent(field.key, e.target.value)}
                                  placeholder={defaultVal}
                                  className="text-sm"
                                />
                              )}
                              {!isEdited && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {isPt ? "Padrão:" : "Default:"} {defaultVal}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Save button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div className="text-sm text-muted-foreground">
                {editedFieldsCount > 0 && (
                  <span>{editedFieldsCount} {isPt ? "campo(s) personalizado(s)" : "custom field(s)"}</span>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPt ? "Salvar Landing Page" : "Save Landing Page"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLandingPage;
