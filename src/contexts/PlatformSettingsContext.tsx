import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformSettings {
  platformName: string;
  primaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  loading: boolean;
  refetch: () => void;
}

const PlatformSettingsContext = createContext<PlatformSettings>({
  platformName: "ShortsPro",
  primaryColor: "#6C3AED",
  logoUrl: null,
  faviconUrl: null,
  loading: true,
  refetch: () => {},
});

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformName, setPlatformName] = useState("ShortsPro");
  const [primaryColor, setPrimaryColor] = useState("#6C3AED");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["platform_name", "primary_color", "logo_url", "favicon_url"]);

    if (data) {
      for (const row of data) {
        if (row.key === "platform_name") setPlatformName(row.value);
        if (row.key === "primary_color") setPrimaryColor(row.value);
        if (row.key === "logo_url") setLogoUrl(row.value || null);
        if (row.key === "favicon_url") setFaviconUrl(row.value || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply primary color as CSS variable
  useEffect(() => {
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      const hsl = hexToHSL(primaryColor);
      document.documentElement.style.setProperty("--primary", hsl);
      document.documentElement.style.setProperty("--ring", hsl);
      document.documentElement.style.setProperty("--sidebar-primary", hsl);
    }
  }, [primaryColor]);

  // Apply platform name as document title
  useEffect(() => {
    document.title = platformName;
  }, [platformName]);

  // Apply favicon dynamically
  useEffect(() => {
    if (faviconUrl) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  return (
    <PlatformSettingsContext.Provider value={{ platformName, primaryColor, logoUrl, faviconUrl, loading, refetch: fetchSettings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
