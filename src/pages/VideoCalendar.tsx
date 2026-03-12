import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DeliveryCalendar from "@/components/dashboard/DeliveryCalendar";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";

const VideoCalendar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPt = (t as any).language === "pt";
  const [previewVideo, setPreviewVideo] = useState<any>(null);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user!.id).order("uploaded_at", { ascending: false });
      return data || [];
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{isPt ? "Calendário" : "Calendar"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Histórico de entregas por data" : "Delivery history by date"}
        </p>
      </div>

      <DeliveryCalendar videos={videos} onPreview={setPreviewVideo} />

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default VideoCalendar;
