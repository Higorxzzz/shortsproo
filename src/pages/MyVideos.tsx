import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{isPt ? "Meus Vídeos" : "My Videos"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPt ? "Todos os seus vídeos editados" : "All your edited videos"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {filteredVideos.length} {isPt ? "vídeos" : "videos"}
          </Badge>
          {newVideosCount > 0 && (
            <Badge className="text-xs">
              {newVideosCount} {isPt ? "novos" : "new"}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isPt ? "Buscar vídeo..." : "Search video..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isPt ? "Todos" : "All"}</SelectItem>
              <SelectItem value="new">{isPt ? "Novos" : "New"}</SelectItem>
              <SelectItem value="downloaded">{isPt ? "Baixados" : "Downloaded"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-9 w-full sm:w-36 text-sm">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{isPt ? "Mais recentes" : "Newest"}</SelectItem>
              <SelectItem value="oldest">{isPt ? "Mais antigos" : "Oldest"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Film className="mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (isPt ? "Nenhum vídeo encontrado" : "No videos found")
                : (isPt ? "Nenhum vídeo editado ainda" : "No edited videos yet")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
