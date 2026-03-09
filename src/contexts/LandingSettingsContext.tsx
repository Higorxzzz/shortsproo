import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface LandingConfig {
  sections: {
    hero: boolean;
    stats: boolean;
    howItWorks: boolean;
    services: boolean;
    testimonials: boolean;
    faq: boolean;
    cta: boolean;
  };
  content: Record<string, string>; // e.g. "hero.title" -> "Custom title"
}

interface LandingSettingsContextType {
  landingEnabled: boolean;
  config: LandingConfig;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultConfig: LandingConfig = {
  sections: {
    hero: true,
    stats: true,
    howItWorks: true,
    services: true,
    testimonials: true,
    faq: true,
    cta: true,
  },
  content: {},
};

const LandingSettingsContext = createContext<LandingSettingsContextType>({
  landingEnabled: true,
  config: defaultConfig,
  loading: true,
  refetch: async () => {},
});

export const LandingSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [landingEnabled, setLandingEnabled] = useState(true);
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["landing_enabled", "landing_config"]);

    if (data) {
      for (const row of data) {
        if (row.key === "landing_enabled") setLandingEnabled(row.value === "true");
        if (row.key === "landing_config") {
          try {
            const parsed = JSON.parse(row.value);
            setConfig({ ...defaultConfig, ...parsed, sections: { ...defaultConfig.sections, ...parsed.sections } });
          } catch {}
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <LandingSettingsContext.Provider value={{ landingEnabled, config, loading, refetch: fetchSettings }}>
      {children}
    </LandingSettingsContext.Provider>
  );
};

export const useLandingSettings = () => useContext(LandingSettingsContext);
