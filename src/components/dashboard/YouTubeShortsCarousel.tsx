import { useYouTubeVideos, YouTubeVideoItem } from "@/hooks/use-youtube-videos";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Youtube, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface YouTubeShortsCarouselProps {
  channelId?: string | null;
}

const YouTubeShortsCarousel = ({ channelId }: YouTubeShortsCarouselProps) => {
  const { t } = useLanguage();
  const isPt = (t as any).language === "pt";

  const { data, isLoading, error, refetch, isFetching } = useYouTubeVideos({
    channelId,
    enabled: !!channelId,
  });

  if (!channelId) {
    return (
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Youtube className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isPt
              ? "Adicione seu canal do YouTube no perfil para ver seus Shorts aqui."
              : "Add your YouTube channel in your profile to see your Shorts here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">YouTube Shorts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[180px]">
                <Skeleton className="aspect-[9/16] w-full rounded-xl" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.videos?.length) {
    return (
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Youtube className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {error
              ? (isPt ? "Erro ao carregar vídeos do YouTube." : "Error loading YouTube videos.")
              : (isPt ? "Nenhum vídeo encontrado no canal." : "No videos found on channel.")}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {isPt ? "Tentar novamente" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const videos = data.videos;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">YouTube Shorts</CardTitle>
              {data.stale && (
                <Badge variant="outline" className="text-[10px]">
                  {isPt ? "cache antigo" : "stale cache"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {videos.map((video: YouTubeVideoItem) => (
                <CarouselItem
                  key={video.video_id}
                  className="basis-[160px] pl-3 sm:basis-[180px] md:basis-[200px]"
                >
                  <a
                    href={`https://www.youtube.com/shorts/${video.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-border bg-muted transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md">
                      <div className="aspect-[9/16] w-full">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.video_title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Youtube className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <ExternalLink className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-tight text-foreground">
                      {video.video_title}
                    </p>
                    {video.published_at && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(video.published_at).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                      </p>
                    )}
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 hidden md:flex" />
            <CarouselNext className="-right-3 hidden md:flex" />
          </Carousel>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YouTubeShortsCarousel;
