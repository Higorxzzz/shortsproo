import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Film,
  Inbox,
  Link2,
  Loader2,
  Package,
  Play,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";

// ---------- Types ----------
type RawVideo = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  plan_name: string | null;
  youtube_channel: string | null;
  shorts_per_day: number;
};

type TabKey = "waiting" | "editing" | "ready" | "delivered";

const TAB_CONFIG: Record<TabKey, { labelPt: string; labelEn: string; icon: typeof Clock }> = {
  waiting: { labelPt: "Novos", labelEn: "New", icon: Inbox },
  editing: { labelPt: "Editando", labelEn: "Editing", icon: Edit3 },
  ready: { labelPt: "Prontos", labelEn: "Ready", icon: Package },
  delivered: { labelPt: "Entregues", labelEn: "Delivered", icon: CheckCircle2 },
};

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function timeAgo(dateStr: string, isPt: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isPt ? "agora" : "now";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ---------- Component ----------
const AdminProduction = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [activeTab, setActiveTab] = useState<TabKey>("waiting");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliverVideo, setDeliverVideo] = useState<RawVideo | null>(null);
  const [driveLinks, setDriveLinks] = useState<string[]>([]);

  // ---------- Fetch ----------
  const { data: rawVideos = [], isLoading } = useQuery({
    queryKey: ["production-raw-videos"],
    queryFn: async () => {
      const { data: videos, error } = await supabase
        .from("raw_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!videos?.length) return [];

      const userIds = [...new Set(videos.map((v) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, plan_id, youtube_channel")
        .in("id", userIds);
      const { data: plans } = await supabase.from("plans").select("id, name, shorts_per_day");

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const planMap = new Map((plans || []).map((p) => [p.id, p]));

      return videos.map((v) => {
        const profile = profileMap.get(v.user_id);
        const plan = profile?.plan_id ? planMap.get(profile.plan_id) : null;
        return {
          ...v,
          user_name: profile?.name || null,
          user_email: profile?.email || null,
          plan_name: plan?.name || null,
          youtube_channel: profile?.youtube_channel || null,
          shorts_per_day: plan?.shorts_per_day || 1,
        } as RawVideo;
      });
    },
  });

  // ---------- Mutations ----------
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("raw_videos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-raw-videos"] }),
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ rawVideo, links }: { rawVideo: RawVideo; links: string[] }) => {
      const validLinks = links.filter((l) => extractDriveFileId(l.trim()));
      for (let i = 0; i < validLinks.length; i++) {
        const link = validLinks[i].trim();
        const fileId = extractDriveFileId(link);
        const { error: vErr } = await supabase.from("videos").insert({
          user_id: rawVideo.user_id,
          title: `${rawVideo.title} - Short ${i + 1}`,
          drive_link: link,
          drive_file_id: fileId,
          status: "new",
        });
        if (vErr) throw vErr;
      }
      const { error: rErr } = await supabase
        .from("raw_videos")
        .update({ status: "completed" })
        .eq("id", rawVideo.id);
      if (rErr) throw rErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-raw-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: isPt ? "Vídeos entregues!" : "Videos delivered!" });
      setDeliverVideo(null);
      setDriveLinks([]);
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deleteRawFile = useMutation({
    mutationFn: async (video: RawVideo) => {
      if (video.file_path) {
        await supabase.storage.from("raw-videos").remove([video.file_path]);
      }
      await supabase
        .from("raw_videos")
        .update({ file_path: null, file_name: null, file_size: null })
        .eq("id", video.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-raw-videos"] });
      toast({ title: isPt ? "Arquivo removido" : "File removed" });
    },
  });

  const handleDownload = async (video: RawVideo) => {
    if (!video.file_path) return;
    const { data } = await supabase.storage.from("raw-videos").createSignedUrl(video.file_path, 3600);
    if (data?.signedUrl) window.location.assign(data.signedUrl);
  };

  // ---------- Organize by tab ----------
  const counts = useMemo(() => {
    const c = { waiting: 0, editing: 0, ready: 0, delivered: 0 };
    rawVideos.forEach((v) => {
      if (v.status === "completed") c.delivered++;
      else if (v.status === "editing") c.editing++;
      else if (v.status === "ready") c.ready++;
      else c.waiting++;
    });
    return c;
  }, [rawVideos]);

  const filteredVideos = useMemo(() => {
    const statusMap: Record<TabKey, string[]> = {
      waiting: ["waiting"],
      editing: ["editing"],
      ready: ["ready"],
      delivered: ["completed"],
    };
    const validStatuses = statusMap[activeTab];
    const q = searchQuery.toLowerCase();

    return rawVideos.filter((v) => {
      if (!validStatuses.includes(v.status)) return false;
      if (q) {
        return (
          (v.user_name || "").toLowerCase().includes(q) ||
          (v.user_email || "").toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rawVideos, activeTab, searchQuery]);

  const pendingTotal = counts.waiting + counts.editing + counts.ready;
  const allLinksValid = driveLinks.length > 0 && driveLinks.some((l) => extractDriveFileId(l.trim()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isPt ? "Painel de Produção" : "Production Board"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Gerencie a edição e entrega de shorts" : "Manage shorts editing and delivery"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="font-bold">{pendingTotal}</span>
            <span className="text-muted-foreground">{isPt ? "pendentes" : "pending"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-bold">{counts.delivered}</span>
            <span className="text-muted-foreground">{isPt ? "entregues" : "delivered"}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList className="h-10">
            {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => {
              const cfg = TAB_CONFIG[key];
              const Icon = cfg.icon;
              const count = counts[key];
              return (
                <TabsTrigger key={key} value={key} className="gap-2 px-4">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{isPt ? cfg.labelPt : cfg.labelEn}</span>
                  <Badge
                    variant={count > 0 && key !== "delivered" ? "default" : "secondary"}
                    className="h-5 min-w-[20px] justify-center text-[10px]"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isPt ? "Buscar cliente ou título..." : "Search client or title..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Content */}
        {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="mb-3 rounded-full bg-muted p-4">
                    {(() => { const I = TAB_CONFIG[key].icon; return <I className="h-6 w-6 text-muted-foreground/40" />; })()}
                  </div>
                  <p className="font-medium text-muted-foreground">
                    {isPt ? "Nenhum vídeo nesta etapa" : "No videos in this stage"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {key === "waiting"
                      ? isPt ? "Quando um cliente enviar um vídeo, ele aparece aqui" : "When a client uploads a video, it appears here"
                      : isPt ? "Mova vídeos para esta etapa pelo fluxo" : "Move videos to this stage through the flow"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-3">{isPt ? "Cliente" : "Client"}</div>
                  <div className="col-span-3">{isPt ? "Vídeo" : "Video"}</div>
                  <div className="col-span-2">{isPt ? "Plano" : "Plan"}</div>
                  <div className="col-span-1">{isPt ? "Tempo" : "Time"}</div>
                  <div className="col-span-3 text-right">{isPt ? "Ações" : "Actions"}</div>
                </div>

                {filteredVideos.map((video) => (
                  <Card key={video.id} className="transition-colors hover:border-foreground/10">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-4 py-3">
                        {/* Client */}
                        <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {video.user_name || video.user_email?.split("@")[0] || "—"}
                            </p>
                            {video.youtube_channel && (
                              <a
                                href={video.youtube_channel.startsWith("http") ? video.youtube_channel : `https://youtube.com/channel/${video.youtube_channel}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                Canal
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Video info */}
                        <div className="col-span-3 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {video.file_size && (
                              <span>{(video.file_size / 1024 / 1024).toFixed(1)} MB</span>
                            )}
                            {video.notes && (
                              <span className="truncate max-w-[120px]">{video.notes}</span>
                            )}
                            {!video.file_path && video.status !== "waiting" && (
                              <span className="text-muted-foreground/50">{isPt ? "Sem arquivo" : "No file"}</span>
                            )}
                          </div>
                        </div>

                        {/* Plan */}
                        <div className="col-span-2">
                          <Badge variant="outline" className="text-xs">
                            {video.plan_name || "—"}
                          </Badge>
                        </div>

                        {/* Time */}
                        <div className="col-span-1">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(video.created_at, isPt)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Download raw file */}
                          {video.file_path && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => handleDownload(video)}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">{isPt ? "Baixar" : "Download"}</span>
                            </Button>
                          )}

                          {/* Delete raw file */}
                          {video.file_path && (key === "ready" || key === "delivered") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (confirm(isPt ? "Apagar arquivo bruto?" : "Delete raw file?")) {
                                  deleteRawFile.mutate(video);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Status actions */}
                          {key === "waiting" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: video.id, status: "editing" })}
                            >
                              <Play className="h-3.5 w-3.5" />
                              {isPt ? "Começar edição" : "Start editing"}
                            </Button>
                          )}

                          {key === "editing" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: video.id, status: "ready" })}
                            >
                              <Package className="h-3.5 w-3.5" />
                              {isPt ? "Marcar pronto" : "Mark ready"}
                            </Button>
                          )}

                          {key === "ready" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => {
                                setDeliverVideo(video);
                                setDriveLinks(Array(video.shorts_per_day).fill(""));
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                              {isPt ? "Entregar" : "Deliver"}
                            </Button>
                          )}

                          {key === "delivered" && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {isPt ? "Entregue" : "Delivered"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Deliver Dialog */}
      <Dialog open={!!deliverVideo} onOpenChange={(o) => !o && setDeliverVideo(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {isPt ? "Entregar vídeos finais" : "Deliver final videos"}
            </DialogTitle>
          </DialogHeader>
          {deliverVideo && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>
                  <strong>{isPt ? "Cliente:" : "Client:"}</strong>{" "}
                  {deliverVideo.user_name || deliverVideo.user_email}
                </p>
                <p>
                  <strong>{isPt ? "Vídeo bruto:" : "Raw video:"}</strong> {deliverVideo.title}
                </p>
                <p>
                  <strong>{isPt ? "Plano:" : "Plan:"}</strong> {deliverVideo.plan_name || "—"} ({deliverVideo.shorts_per_day} shorts/dia)
                </p>
              </div>

              <div className="space-y-3">
                {driveLinks.map((link, idx) => {
                  const linkFileId = extractDriveFileId(link.trim());
                  return (
                    <div key={idx} className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Short {idx + 1} {isPt ? "de" : "of"} {driveLinks.length}
                      </Label>
                      <Input
                        value={link}
                        onChange={(e) => {
                          const updated = [...driveLinks];
                          updated[idx] = e.target.value;
                          setDriveLinks(updated);
                        }}
                        placeholder="https://drive.google.com/file/d/.../view"
                      />
                      {link.trim() && !linkFileId && (
                        <p className="text-[11px] text-destructive">
                          {isPt ? "Link inválido" : "Invalid link"}
                        </p>
                      )}
                      {linkFileId && (
                        <div className="rounded-lg border overflow-hidden">
                          <iframe
                            src={`https://drive.google.com/file/d/${linkFileId}/preview`}
                            className="w-full aspect-video"
                            allow="autoplay"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {isPt
                  ? `Preencha pelo menos 1 link. Links vazios serão ignorados.`
                  : `Fill at least 1 link. Empty links will be ignored.`}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeliverVideo(null)}>
              {isPt ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              disabled={!allLinksValid || deliverMutation.isPending}
              onClick={() => deliverVideo && deliverMutation.mutate({ rawVideo: deliverVideo, links: driveLinks })}
            >
              {deliverMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isPt ? "Entregar" : "Deliver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProduction;
