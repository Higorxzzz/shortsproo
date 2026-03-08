import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  // joined
  user_name: string | null;
  user_email: string | null;
  plan_name: string | null;
  youtube_channel: string | null;
  // delivery info
  delivered_video_id: string | null;
  delivered_drive_link: string | null;
  delivered_at: string | null;
};

type KanbanColumn = "waiting" | "editing" | "ready" | "delivered";

const COLUMNS: { key: KanbanColumn; labelPt: string; labelEn: string; icon: typeof Clock; colorClass: string; bgClass: string }[] = [
  { key: "waiting", labelPt: "Novos Vídeos", labelEn: "New Videos", icon: Inbox, colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10 border-yellow-500/20" },
  { key: "editing", labelPt: "Editando", labelEn: "Editing", icon: Edit3, colorClass: "text-orange-500", bgClass: "bg-orange-500/10 border-orange-500/20" },
  { key: "ready", labelPt: "Pronto p/ Entrega", labelEn: "Ready to Deliver", icon: Package, colorClass: "text-blue-500", bgClass: "bg-blue-500/10 border-blue-500/20" },
  { key: "delivered", labelPt: "Entregue", labelEn: "Delivered", icon: CheckCircle2, colorClass: "text-primary", bgClass: "bg-primary/10 border-primary/20" },
];

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ---------- Component ----------
const AdminProduction = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [searchQuery, setSearchQuery] = useState("");
  const [deliverDialog, setDeliverDialog] = useState<RawVideo | null>(null);
  const [driveLink, setDriveLink] = useState("");

  // ---------- Fetch all raw videos with user info ----------
  const { data: rawVideos = [], isLoading } = useQuery({
    queryKey: ["kanban-raw-videos"],
    queryFn: async () => {
      const { data: videos, error } = await supabase
        .from("raw_videos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!videos?.length) return [];

      const userIds = [...new Set(videos.map((v) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, plan_id, youtube_channel")
        .in("id", userIds);
      const { data: plans } = await supabase.from("plans").select("id, name");

      // Check which raw_videos have been delivered (have a matching video entry)
      // We match by user_id and look for videos created after the raw video
      const { data: deliveredVideos } = await supabase
        .from("videos")
        .select("id, user_id, drive_link, uploaded_at")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const planMap = new Map((plans || []).map((p) => [p.id, p]));

      return videos.map((v) => {
        const profile = profileMap.get(v.user_id);
        const plan = profile?.plan_id ? planMap.get(profile.plan_id) : null;
        // Find delivered video for this raw video (matched by notes containing raw video id or by status)
        const delivered = v.status === "completed"
          ? (deliveredVideos || []).find(
              (dv) => dv.user_id === v.user_id && new Date(dv.uploaded_at) >= new Date(v.created_at)
            )
          : null;

        return {
          ...v,
          user_name: profile?.name || null,
          user_email: profile?.email || null,
          plan_name: plan?.name || null,
          youtube_channel: profile?.youtube_channel || null,
          delivered_video_id: delivered?.id || null,
          delivered_drive_link: delivered?.drive_link || null,
          delivered_at: delivered?.uploaded_at || null,
        } as RawVideo;
      });
    },
  });

  // ---------- Mutations ----------
  const updateStatusMutation = useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string; status: string }) => {
      const { error } = await supabase
        .from("raw_videos")
        .update({ status })
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-raw-videos"] });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ rawVideo, link }: { rawVideo: RawVideo; link: string }) => {
      const fileId = extractDriveFileId(link);
      // Insert final video
      const { error: videoErr } = await supabase.from("videos").insert({
        user_id: rawVideo.user_id,
        title: rawVideo.title,
        drive_link: link,
        drive_file_id: fileId,
        status: "new",
      });
      if (videoErr) throw videoErr;

      // Mark raw video as completed
      const { error: rawErr } = await supabase
        .from("raw_videos")
        .update({ status: "completed" })
        .eq("id", rawVideo.id);
      if (rawErr) throw rawErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-raw-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: isPt ? "Vídeo entregue!" : "Video delivered!" });
      setDeliverDialog(null);
      setDriveLink("");
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deleteRawFileMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["kanban-raw-videos"] });
      toast({ title: isPt ? "Arquivo bruto removido" : "Raw file removed" });
    },
  });

  const handleDownload = async (video: RawVideo) => {
    if (!video.file_path) return;
    const { data } = await supabase.storage
      .from("raw-videos")
      .createSignedUrl(video.file_path, 3600);
    if (data?.signedUrl) {
      window.location.assign(data.signedUrl);
    }
  };

  // ---------- Organize into columns ----------
  const columns = useMemo(() => {
    const result: Record<KanbanColumn, RawVideo[]> = {
      waiting: [],
      editing: [],
      ready: [],
      delivered: [],
    };

    const q = searchQuery.toLowerCase();

    for (const v of rawVideos) {
      // Search filter
      if (q) {
        const match =
          (v.user_name || "").toLowerCase().includes(q) ||
          (v.user_email || "").toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q);
        if (!match) continue;
      }

      if (v.status === "completed") {
        result.delivered.push(v);
      } else if (v.status === "editing") {
        result.editing.push(v);
      } else if (v.status === "ready") {
        result.ready.push(v);
      } else {
        result.waiting.push(v);
      }
    }

    return result;
  }, [rawVideos, searchQuery]);

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const deliveredToday = columns.delivered.filter(
    (v) => v.delivered_at?.startsWith(todayStr) || v.created_at.startsWith(todayStr)
  ).length;
  const totalPending = columns.waiting.length + columns.editing.length + columns.ready.length;

  const fileId = extractDriveFileId(driveLink);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isPt ? "Painel de Produção" : "Production Board"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Kanban de edição de shorts" : "Shorts editing kanban"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <Send className="h-4 w-4 text-primary" />
            <span className="font-bold">{deliveredToday}</span>
            <span className="text-muted-foreground">{isPt ? "entregues hoje" : "delivered today"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="font-bold">{totalPending}</span>
            <span className="text-muted-foreground">{isPt ? "pendentes" : "pending"}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isPt ? "Buscar por cliente ou título..." : "Search by client or title..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = columns[col.key];
            const Icon = col.icon;

            return (
              <div key={col.key} className="flex flex-col">
                {/* Column header */}
                <div className={`flex items-center gap-2 rounded-t-xl border px-4 py-3 ${col.bgClass}`}>
                  <Icon className={`h-4 w-4 ${col.colorClass}`} />
                  <span className="font-semibold text-sm">
                    {isPt ? col.labelPt : col.labelEn}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length}
                  </Badge>
                </div>

                {/* Column body */}
                <div className="flex-1 rounded-b-xl border border-t-0 bg-muted/20 p-2 min-h-[300px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="mb-2 rounded-full bg-muted p-3">
                            <Icon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isPt ? "Nenhum vídeo" : "No videos"}
                          </p>
                        </div>
                      ) : (
                        items.map((video) => (
                          <KanbanCard
                            key={video.id}
                            video={video}
                            column={col.key}
                            isPt={isPt}
                            onStartEditing={() =>
                              updateStatusMutation.mutate({ videoId: video.id, status: "editing" })
                            }
                            onMarkReady={() =>
                              updateStatusMutation.mutate({ videoId: video.id, status: "ready" })
                            }
                            onDeliver={() => {
                              setDeliverDialog(video);
                              setDriveLink("");
                            }}
                            onDownload={() => handleDownload(video)}
                            onDeleteRawFile={() => {
                              if (confirm(isPt ? "Remover arquivo bruto?" : "Remove raw file?")) {
                                deleteRawFileMutation.mutate(video);
                              }
                            }}
                            isUpdating={updateStatusMutation.isPending}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deliver Dialog */}
      <Dialog open={!!deliverDialog} onOpenChange={(o) => !o && setDeliverDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {isPt ? "Publicar para cliente" : "Publish to client"}
            </DialogTitle>
          </DialogHeader>
          {deliverDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p><strong>{isPt ? "Cliente:" : "Client:"}</strong> {deliverDialog.user_name || deliverDialog.user_email}</p>
                <p><strong>{isPt ? "Vídeo bruto:" : "Raw video:"}</strong> {deliverDialog.title}</p>
                {deliverDialog.plan_name && <p><strong>{isPt ? "Plano:" : "Plan:"}</strong> {deliverDialog.plan_name}</p>}
              </div>

              <div>
                <Label>{isPt ? "Link do vídeo final (Google Drive)" : "Final video link (Google Drive)"}</Label>
                <Input
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="mt-1"
                />
                {driveLink && !fileId && (
                  <p className="mt-1 text-xs text-destructive">
                    {isPt ? "Link inválido" : "Invalid link"}
                  </p>
                )}
                {fileId && (
                  <div className="mt-3 rounded-lg border overflow-hidden">
                    <iframe
                      src={`https://drive.google.com/file/d/${fileId}/preview`}
                      className="w-full aspect-[9/16] max-h-[200px]"
                      allow="autoplay"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeliverDialog(null)}>
              {isPt ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              disabled={!fileId || deliverMutation.isPending}
              onClick={() => deliverDialog && deliverMutation.mutate({ rawVideo: deliverDialog, link: driveLink })}
            >
              {deliverMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isPt ? "Publicar" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Kanban Card ----------
function KanbanCard({
  video,
  column,
  isPt,
  onStartEditing,
  onMarkReady,
  onDeliver,
  onDownload,
  onDeleteRawFile,
  isUpdating,
}: {
  video: RawVideo;
  column: KanbanColumn;
  isPt: boolean;
  onStartEditing: () => void;
  onMarkReady: () => void;
  onDeliver: () => void;
  onDownload: () => void;
  onDeleteRawFile: () => void;
  isUpdating: boolean;
}) {
  const timeAgo = getTimeAgo(video.created_at, isPt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Client info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {video.user_name || video.user_email?.split("@")[0] || "—"}
          </p>
          <div className="flex items-center gap-1.5">
            {video.plan_name && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                {video.plan_name}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
        {video.youtube_channel && (
          <a
            href={video.youtube_channel.startsWith("http") ? video.youtube_channel : `https://youtube.com/channel/${video.youtube_channel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Video title */}
      <p className="text-xs font-medium mb-1.5 line-clamp-2">{video.title}</p>
      {video.notes && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{video.notes}</p>
      )}

      {/* File info */}
      {video.file_path && (
        <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground">
          <Film className="h-3 w-3 shrink-0" />
          <span className="truncate">{video.file_name || "video"}</span>
          {video.file_size && (
            <span className="shrink-0">{(video.file_size / 1024 / 1024).toFixed(1)} MB</span>
          )}
        </div>
      )}

      {/* Delivered video iframe */}
      {column === "delivered" && video.delivered_drive_link && (() => {
        const fId = extractDriveFileId(video.delivered_drive_link);
        return fId ? (
          <div className="mb-2 rounded-lg border overflow-hidden">
            <iframe
              src={`https://drive.google.com/file/d/${fId}/preview`}
              className="w-full aspect-[9/16] max-h-[180px]"
              allow="autoplay"
            />
          </div>
        ) : null;
      })()}

      {/* Actions per column */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
        {column === "waiting" && (
          <>
            {video.file_path && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onDownload}>
                <Download className="h-3 w-3" />
                {isPt ? "Baixar" : "Download"}
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 gap-1 text-xs ml-auto"
              disabled={isUpdating}
              onClick={onStartEditing}
            >
              <Play className="h-3 w-3" />
              {isPt ? "Começar edição" : "Start editing"}
            </Button>
          </>
        )}

        {column === "editing" && (
          <>
            {video.file_path && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onDownload}>
                <Download className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 gap-1 text-xs ml-auto"
              disabled={isUpdating}
              onClick={onMarkReady}
            >
              <Package className="h-3 w-3" />
              {isPt ? "Marcar pronto" : "Mark ready"}
            </Button>
          </>
        )}

        {column === "ready" && (
          <>
            {video.file_path && (
              <>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onDownload}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={onDeleteRawFile}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              className="h-7 gap-1 text-xs ml-auto"
              onClick={onDeliver}
            >
              <Send className="h-3 w-3" />
              {isPt ? "Publicar" : "Publish"}
            </Button>
          </>
        )}

        {column === "delivered" && (
          <>
            {video.file_path && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={onDeleteRawFile}
              >
                <Trash2 className="h-3 w-3" />
                {isPt ? "Apagar bruto" : "Delete raw"}
              </Button>
            )}
            {video.delivered_drive_link && (
              <a
                href={video.delivered_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <ExternalLink className="h-3 w-3" />
                  Drive
                </Button>
              </a>
            )}
            {video.delivered_at && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(video.delivered_at).toLocaleDateString()}
              </span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Helpers ----------
function getTimeAgo(dateStr: string, isPt: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isPt ? "agora" : "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default AdminProduction;
