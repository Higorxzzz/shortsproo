import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import VideoCard from "./VideoCard";

interface DeliveryCalendarProps {
  videos: any[];
  onPreview: (video: any) => void;
}

const DeliveryCalendar = ({ videos, onPreview }: DeliveryCalendarProps) => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Videos grouped by date string (YYYY-MM-DD)
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
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const monthName = currentDate.toLocaleDateString(isPt ? "pt-BR" : "en-US", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dayNames = isPt
    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedVideos = selectedDay ? videosByDate.get(selectedDay) || [] : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Calendar - left side */}
      <Card className="w-full lg:w-80 shrink-0">
        <CardHeader className="pb-1 px-4 pt-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm capitalize">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-1">
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {dayNames.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const count = videosByDate.get(dateKey)?.length || 0;
              const isToday = new Date().toISOString().split("T")[0] === dateKey;
              const isSelected = selectedDay === dateKey;
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-all duration-150
                    ${isSelected ? "bg-primary text-primary-foreground shadow-sm" : ""}
                    ${!isSelected && isToday ? "bg-primary/10 text-primary font-semibold" : ""}
                    ${!isSelected && !isToday ? "hover:bg-muted" : ""}
                    ${count > 0 && !isSelected ? "font-medium" : ""}
                  `}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <div className={`mt-0.5 flex items-center gap-0.5 text-[10px] leading-none ${isSelected ? "text-primary-foreground/80" : "text-primary"}`}>
                      <Film className="h-2.5 w-2.5" />
                      {count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Videos carousel - right side */}
      <div className="flex-1 min-w-0">
        {selectedDay ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString(isPt ? "pt-BR" : "en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {selectedVideos.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selectedVideos.length} {selectedVideos.length === 1 ? "video" : "videos"}
                </Badge>
              )}
            </h3>
            {selectedVideos.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                {selectedVideos.map((v: any) => (
                  <div key={v.id} className="w-44 shrink-0 snap-start">
                    <VideoCard video={v} onPreview={onPreview} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {isPt ? "Nenhum vídeo neste dia" : "No videos on this day"}
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              {isPt ? "Selecione um dia no calendário" : "Select a day on the calendar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryCalendar;
