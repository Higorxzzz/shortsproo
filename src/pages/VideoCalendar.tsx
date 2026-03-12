import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Film, Download, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";

const VideoCalendar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPt = (t as any).language === "pt";
  const [previewVideo, setPreviewVideo] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user!.id).order("uploaded_at", { ascending: false });
      return data || [];
    },
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const videosByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const v of videos) {
      const dateKey = new Date(v.uploaded_at).toISOString().split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(v);
    }
    return map;
  }, [videos]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const monthName = currentDate.toLocaleDateString(isPt ? "pt-BR" : "en-US", { month: "long", year: "numeric" });
  const dayNames = isPt
    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedVideos = selectedDay ? videosByDate.get(selectedDay) || [] : [];

  // Stats for current month
  const monthTotal = useMemo(() => {
    let count = 0;
    videosByDate.forEach((vids, key) => {
      if (key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) count += vids.length;
    });
    return count;
  }, [videosByDate, year, month]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{isPt ? "Calendário de Entregas" : "Delivery Calendar"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPt ? "Histórico de entregas por data" : "Delivery history by date"}
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs">
          {monthTotal} {isPt ? "vídeos neste mês" : "videos this month"}
        </Badge>
      </div>

      {/* Main layout: stacks on mobile, side by side on desktop */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Calendar */}
        <Card className="w-full lg:w-80 shrink-0">
          <CardContent className="p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium capitalize">{monthName}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="aspect-square" />;
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const count = videosByDate.get(dateKey)?.length || 0;
                const isToday = new Date().toISOString().split("T")[0] === dateKey;
                const isSelected = selectedDay === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-colors
                      ${isSelected ? "bg-foreground text-background font-semibold" : ""}
                      ${!isSelected && isToday ? "bg-muted font-semibold" : ""}
                      ${!isSelected && !isToday ? "hover:bg-muted" : ""}
                    `}
                  >
                    <span>{day}</span>
                    {count > 0 && (
                      <span className={`mt-0.5 text-[9px] leading-none ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                    )}
                    {count > 0 && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-foreground/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day videos */}
        <div className="flex-1 min-w-0">
          {selectedDay ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString(isPt ? "pt-BR" : "en-US", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {selectedVideos.length} {selectedVideos.length === 1 ? "video" : "videos"}
                </Badge>
              </div>

              {selectedVideos.length > 0 ? (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedVideos.map((video: any) => {
                    const fileId = video.drive_file_id || video.drive_link?.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                    return (
                      <Card key={video.id}>
                        <CardContent className="p-3">
                          {fileId && (
                            <button
                              onClick={() => setPreviewVideo(video)}
                              className="relative mb-2 block w-full overflow-hidden rounded bg-muted aspect-video"
                            >
                              <img
                                src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`}
                                alt={video.title}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </button>
                          )}
                          <p className="text-sm font-medium line-clamp-2 mb-2">{video.title}</p>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 flex-1 text-xs"
                              onClick={() => {
                                const dlUrl = fileId
                                  ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
                                  : video.drive_link;
                                window.location.assign(dlUrl);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" /> Download
                            </Button>
                            {fileId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() => window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank")}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Film className="mb-2 h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">
                      {isPt ? "Nenhum vídeo neste dia" : "No videos on this day"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full min-h-[200px]">
              <CardContent className="flex h-full items-center justify-center py-12">
                <div className="text-center">
                  <Film className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {isPt ? "Selecione um dia no calendário" : "Select a day on the calendar"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <VideoPreviewModal
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </div>
  );
};

export default VideoCalendar;
