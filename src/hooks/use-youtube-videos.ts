import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YouTubeVideoItem {
  video_id: string;
  thumbnail_url: string;
  video_title: string;
  video_description: string;
  published_at: string;
}

interface UseYouTubeVideosOptions {
  channelId?: string | null;
  enabled?: boolean;
}

export function useYouTubeVideos({ channelId, enabled = true }: UseYouTubeVideosOptions) {
  return useQuery({
    queryKey: ["youtube-videos", channelId],
    enabled: enabled && !!channelId,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 2;
    },
    queryFn: async (): Promise<{ videos: YouTubeVideoItem[]; fromCache: boolean; stale: boolean }> => {
      const { data, error } = await supabase.functions.invoke("youtube-videos", {
        body: { channelId },
      });
      if (error) throw error;
      return data;
    },
  });
}
