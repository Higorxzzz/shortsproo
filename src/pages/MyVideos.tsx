import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Film, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import VideoCard from "@/components/dashboard/VideoCard";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";

const MyVideos = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewVideo, setPreviewVideo] = useState<any>(null);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user!.id).order("uploaded_at", { ascending: false });
      return data || [];
    },
  });

  const newVideosCount = videos.filter((v: any) => v.status === "new").length;

  const filteredVideos = useMemo(() => {
    let result = [...videos];
    if (statusFilter !== "all") result = result.filter((v: any) => v.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v: any) => v.title?.toLowerCase().includes(q));
    }
    if (sortOrder === "oldest") {
      result.sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
    } else {
      result.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    }
    return result;
  }, [videos, statusFilter, searchQuery, sortOrder]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{isPt ? "Meus Vídeos" : "My Videos"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPt ? "Todos os seus vídeos editados" : "All your edited videos"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isPt ? "Buscar vídeo..." : "Search video..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 pl-8 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isPt ? "Todos" : "All"}</SelectItem>
            <SelectItem value="new">{isPt ? "Novos" : "New"}</SelectItem>
            <SelectItem value="downloaded">{isPt ? "Baixados" : "Downloaded"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <ArrowUpDown className="mr-1 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{isPt ? "Mais recentes" : "Newest"}</SelectItem>
            <SelectItem value="oldest">{isPt ? "Mais antigos" : "Oldest"}</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">
          {filteredVideos.length} {isPt ? "vídeos" : "videos"}
        </Badge>
        {newVideosCount > 0 && (
          <Badge className="text-xs">
            {newVideosCount} {isPt ? "novos" : "new"}
          </Badge>
        )}
      </div>

      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Film className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (isPt ? "Nenhum vídeo encontrado" : "No videos found")
                : t.dashboard.noVideos}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVideos.map((video: any) => (
            <VideoCard key={video.id} video={video} onPreview={setPreviewVideo} />
          ))}
        </div>
      )}

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default MyVideos;
