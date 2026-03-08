import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ExternalLink, Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  show_description: boolean;
  show_button: boolean;
  dismissible: boolean;
};

const AnnouncementBanner = () => {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("dismissed-announcements");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, description, button_text, button_url, show_description, show_button, dismissible")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return (data || []) as Announcement[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed-announcements", JSON.stringify([...next]));
  };

  const visible = announcements.filter(
    (a) => !a.dismissible || !dismissed.has(a.id)
  );

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visible.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-lg border border-primary/20 bg-primary/5 p-4"
          >
            {a.dismissible && (
              <button
                onClick={() => dismiss(a.id)}
                className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-start gap-3 pr-6">
              <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold text-sm">{a.title}</p>
                {a.show_description && a.description && (
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                )}
                {a.show_button && a.button_text && a.button_url && (
                  <a href={a.button_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs mt-1 gap-1">
                      {a.button_text}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
