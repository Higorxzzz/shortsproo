import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Film,
  Filter,
  Link2,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  AlertCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import TaskComments from "@/components/TaskComments";
import AddVideoLinkDialog from "@/components/AddVideoLinkDialog";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Types ----------
type TaskWithUser = {
  id: string;
  user_id: string;
  task_date: string;
  task_number: number;
  status: string;
  video_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  user_name: string | null;
  user_email: string | null;
  plan_name: string | null;
  shorts_per_day: number;
  plan_price: number;
  youtube_channel: string | null;
  country: string | null;
  language: string | null;
  video_title: string | null;
  video_drive_link: string | null;
};

type UserGroup = {
  user: TaskWithUser;
  tasks: TaskWithUser[];
  completedCount: number;
  totalCount: number;
};

// ---------- Constants ----------
const PRIORITY_ORDER: Record<string, number> = { Pro: 1, Growth: 2, Creator: 3, Starter: 4 };

const STATUS_FLOW = ["pending", "editing", "ready", "completed"] as const;
type TaskStatus = (typeof STATUS_FLOW)[number];

const STATUS_CONFIG: Record<
  TaskStatus,
  { labelPt: string; labelEn: string; icon: typeof Clock; colorClass: string; bgClass: string }
> = {
  pending: {
    labelPt: "Pendente",
    labelEn: "Pending",
    icon: Clock,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/50 border-border",
  },
  editing: {
    labelPt: "Editando",
    labelEn: "Editing",
    icon: Edit3,
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/5 border-orange-500/20",
  },
  ready: {
    labelPt: "Pronto",
    labelEn: "Ready",
    icon: Package,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/5 border-blue-500/20",
  },
  completed: {
    labelPt: "Entregue",
    labelEn: "Delivered",
    icon: CheckCircle2,
    colorClass: "text-primary",
    bgClass: "bg-primary/5 border-primary/20",
  },
};

const PRIORITY_CONFIG: Record<string, { labelPt: string; labelEn: string; colorClass: string }> = {
  Pro: { labelPt: "Alta", labelEn: "High", colorClass: "bg-destructive/10 text-destructive border-destructive/20" },
  Growth: { labelPt: "Média", labelEn: "Medium", colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  Creator: { labelPt: "Normal", labelEn: "Normal", colorClass: "bg-accent text-accent-foreground" },
  Starter: { labelPt: "Normal", labelEn: "Normal", colorClass: "bg-muted text-muted-foreground" },
};

// ---------- Component ----------
const AdminProduction = () => {
  const { t } = useLanguage();
  const { user, teamRole } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [uploadTask, setUploadTask] = useState<TaskWithUser | null>(null);

  // ---------- Query ----------
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["production-tasks"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: taskRows, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_date", today)
        .order("created_at", { ascending: true });
      if (taskError) throw taskError;
      if (!taskRows?.length) return [];

      const userIds = [...new Set(taskRows.map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, plan_id, youtube_channel, country, language")
        .in("id", userIds);
      const { data: plans } = await supabase.from("plans").select("id, name, shorts_per_day, price");

      const videoIds = taskRows.map((t) => t.video_id).filter(Boolean) as string[];
      const videoMap = new Map<string, { title: string; drive_link: string }>();
      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, title, drive_link")
          .in("id", videoIds);
        (videos || []).forEach((v) => videoMap.set(v.id, { title: v.title, drive_link: v.drive_link }));
      }

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const planMap = new Map((plans || []).map((p) => [p.id, p]));

      return taskRows.map((task) => {
        const profile = profileMap.get(task.user_id);
        const plan = profile?.plan_id ? planMap.get(profile.plan_id) : null;
        const video = task.video_id ? videoMap.get(task.video_id) : null;
        return {
          ...task,
          user_name: profile?.name || null,
          user_email: profile?.email || null,
          plan_name: plan?.name || null,
          shorts_per_day: plan?.shorts_per_day || 0,
          plan_price: plan?.price || 0,
          youtube_channel: profile?.youtube_channel || null,
          country: profile?.country || null,
          language: profile?.language || null,
          video_title: video?.title || null,
          video_drive_link: video?.drive_link || null,
        } as TaskWithUser;
      });
    },
  });

  // ---------- Generate tasks ----------
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_daily_tasks");
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
      toast({
        title: isPt ? "Tarefas geradas" : "Tasks generated",
        description: `${count} ${isPt ? "tarefas criadas" : "tasks created"}`,
      });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  // ---------- Update task status ----------
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id;
      }
      const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
    },
    onError: () => toast({ title: isPt ? "Erro ao atualizar" : "Update error", variant: "destructive" }),
  });

  // ---------- Delete delivered video & reset task ----------
  const deleteVideoMutation = useMutation({
    mutationFn: async ({ taskId, videoId }: { taskId: string; videoId: string }) => {
      // Reset task back to ready
      await supabase
        .from("tasks")
        .update({ status: "ready", video_id: null, completed_at: null, completed_by: null })
        .eq("id", taskId);
      // Delete video
      await supabase.from("videos").delete().eq("id", videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: isPt ? "Vídeo removido" : "Video removed" });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  // ---------- Group & filter ----------
  const grouped = useMemo<UserGroup[]>(() => {
    if (!tasks) return [];
    const map = new Map<string, UserGroup>();
    for (const task of tasks) {
      if (!map.has(task.user_id)) {
        map.set(task.user_id, { user: task, tasks: [], completedCount: 0, totalCount: 0 });
      }
      const group = map.get(task.user_id)!;
      group.tasks.push(task);
      group.totalCount++;
      if (task.status === "completed") group.completedCount++;
    }
    return Array.from(map.values());
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = grouped;

    if (planFilter !== "all") result = result.filter((g) => g.user.plan_name === planFilter);
    if (showOnlyPending) result = result.filter((g) => g.completedCount < g.totalCount);
    if (statusFilter !== "all") {
      result = result.filter((g) => g.tasks.some((t) => t.status === statusFilter));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          (g.user.user_name || "").toLowerCase().includes(q) ||
          (g.user.user_email || "").toLowerCase().includes(q) ||
          (g.user.youtube_channel || "").toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "priority") {
        const pa = PRIORITY_ORDER[a.user.plan_name || ""] || 99;
        const pb = PRIORITY_ORDER[b.user.plan_name || ""] || 99;
        if (pa !== pb) return pa - pb;
        return (a.completedCount / a.totalCount) - (b.completedCount / b.totalCount);
      }
      if (sortBy === "pending") {
        const pendA = a.totalCount - a.completedCount;
        const pendB = b.totalCount - b.completedCount;
        return pendB - pendA;
      }
      return 0;
    });

    return result;
  }, [grouped, planFilter, showOnlyPending, statusFilter, searchQuery, sortBy]);

  // Auto-expand all users initially
  useEffect(() => {
    if (grouped.length > 0 && expandedUsers.size === 0) {
      setExpandedUsers(new Set(grouped.map((g) => g.user.user_id)));
    }
  }, [grouped]);

  // ---------- Stats ----------
  const totalTasks = tasks?.length || 0;
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, editing: 0, ready: 0, completed: 0 };
    (tasks || []).forEach((t) => {
      if (t.status in counts) counts[t.status as TaskStatus]++;
      else counts.pending++;
    });
    return counts;
  }, [tasks]);

  const uniquePlans = [...new Set(grouped.map((g) => g.user.plan_name).filter(Boolean))];
  const progressPercent = totalTasks > 0 ? Math.round((statusCounts.completed / totalTasks) * 100) : 0;

  const toggleUser = (userId: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedUsers(next);
  };

  const getNextStatus = (current: string): TaskStatus | null => {
    const idx = STATUS_FLOW.indexOf(current as TaskStatus);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isPt ? "Fila de Produção" : "Production Queue"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Gerencie as entregas diárias de shorts" : "Manage daily shorts deliveries"}
          </p>
        </div>
        {(teamRole === "admin" || teamRole === "manager") && (
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isPt ? "Gerar Tarefas de Hoje" : "Generate Today's Tasks"}
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-[11px] text-muted-foreground">{isPt ? "Total" : "Total"}</p>
            </div>
          </CardContent>
        </Card>
        {/* Status cards */}
        {(["pending", "editing", "ready", "completed"] as TaskStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-colors hover:border-foreground/20 ${statusFilter === status ? "ring-2 ring-primary/30" : ""}`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2.5 ${cfg.bgClass}`}>
                  <Icon className={`h-5 w-5 ${cfg.colorClass}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statusCounts[status]}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isPt ? cfg.labelPt : cfg.labelEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              {isPt ? "Progresso do dia" : "Daily progress"}
            </span>
            <span className="font-bold">
              {statusCounts.completed}/{totalTasks} — {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isPt ? "Buscar cliente..." : "Search client..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={isPt ? "Plano" : "Plan"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isPt ? "Todos os planos" : "All plans"}</SelectItem>
            {uniquePlans.map((p) => (
              <SelectItem key={p} value={p!}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">{isPt ? "Prioridade" : "Priority"}</SelectItem>
            <SelectItem value="pending">{isPt ? "Mais pendentes" : "Most pending"}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showOnlyPending ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyPending(!showOnlyPending)}
          className="gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          {isPt ? "Só pendentes" : "Pending only"}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedUsers(new Set(grouped.map((g) => g.user.user_id)))}
          >
            {isPt ? "Expandir tudo" : "Expand all"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpandedUsers(new Set())}>
            {isPt ? "Recolher tudo" : "Collapse all"}
          </Button>
        </div>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isPt
                ? "Nenhuma tarefa encontrada. Clique em 'Gerar Tarefas de Hoje'."
                : "No tasks found. Click 'Generate Today's Tasks'."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((group) => {
              const isExpanded = expandedUsers.has(group.user.user_id);
              const allDone = group.completedCount === group.totalCount;
              const userProgress = Math.round((group.completedCount / group.totalCount) * 100);
              const priorityCfg = PRIORITY_CONFIG[group.user.plan_name || ""] || PRIORITY_CONFIG.Starter;

              return (
                <motion.div
                  key={group.user.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card className={`overflow-hidden transition-colors ${allDone ? "border-primary/30" : ""}`}>
                    {/* User header - clickable */}
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleUser(group.user.user_id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {group.user.user_name || group.user.user_email || "—"}
                          </span>
                          {group.user.youtube_channel && (
                            <a
                              href={
                                group.user.youtube_channel.startsWith("http")
                                  ? group.user.youtube_channel
                                  : `https://www.youtube.com/channel/${group.user.youtube_channel}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {group.user.plan_name || "—"} · {group.totalCount} shorts/dia
                          </span>
                        </div>
                      </div>

                      {/* Right side badges & progress */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[10px] ${priorityCfg.colorClass}`}>
                          {isPt ? priorityCfg.labelPt : priorityCfg.labelEn}
                        </Badge>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={userProgress} className="h-1.5 flex-1" />
                          <span className={`text-xs font-bold ${allDone ? "text-primary" : "text-muted-foreground"}`}>
                            {group.completedCount}/{group.totalCount}
                          </span>
                        </div>
                        {allDone && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                            <Sparkles className="mr-1 h-3 w-3" />
                            {isPt ? "Completo" : "Done"}
                          </Badge>
                        )}
                      </div>
                    </button>

                    {/* Expanded task cards */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t px-4 py-3 space-y-2">
                            {group.tasks.map((task) => {
                              const statusKey = (STATUS_FLOW.includes(task.status as TaskStatus)
                                ? task.status
                                : "pending") as TaskStatus;
                              const cfg = STATUS_CONFIG[statusKey];
                              const StatusIcon = cfg.icon;
                              const nextStatus = getNextStatus(statusKey);
                              const isCommentsOpen = expandedComments.has(task.id);

                              return (
                                <div key={task.id}>
                                  <div
                                    className={`rounded-lg border p-3 transition-colors ${cfg.bgClass}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Status icon */}
                                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bgClass}`}>
                                        {statusKey === "editing" ? (
                                          <Loader2 className={`h-4 w-4 animate-spin ${cfg.colorClass}`} />
                                        ) : (
                                          <StatusIcon className={`h-4 w-4 ${cfg.colorClass}`} />
                                        )}
                                      </div>

                                      {/* Task info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">
                                            Short {task.task_number}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] border-0 ${cfg.colorClass} ${cfg.bgClass}`}
                                          >
                                            {isPt ? cfg.labelPt : cfg.labelEn}
                                          </Badge>
                                        </div>
                                        {/* Delivered video info */}
                                        {statusKey === "completed" && task.video_drive_link && (
                                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Film className="h-3 w-3 shrink-0" />
                                            <span className="truncate">
                                              {task.video_title || "Video"}
                                            </span>
                                            <a
                                              href={task.video_drive_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline shrink-0"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                            {task.completed_at && (
                                              <span className="text-muted-foreground/60 shrink-0">
                                                {new Date(task.completed_at).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        {/* Comments */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            const next = new Set(expandedComments);
                                            if (isCommentsOpen) next.delete(task.id);
                                            else next.add(task.id);
                                            setExpandedComments(next);
                                          }}
                                        >
                                          <MessageSquare className="h-3.5 w-3.5" />
                                        </Button>

                                        {/* Next status button */}
                                        {nextStatus && nextStatus !== "completed" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1 text-xs"
                                            disabled={updateStatusMutation.isPending}
                                            onClick={() =>
                                              updateStatusMutation.mutate({
                                                taskId: task.id,
                                                newStatus: nextStatus,
                                              })
                                            }
                                          >
                                            {STATUS_CONFIG[nextStatus].icon && (() => {
                                              const NextIcon = STATUS_CONFIG[nextStatus].icon;
                                              return <NextIcon className={`h-3 w-3 ${STATUS_CONFIG[nextStatus].colorClass}`} />;
                                            })()}
                                            {isPt
                                              ? STATUS_CONFIG[nextStatus].labelPt
                                              : STATUS_CONFIG[nextStatus].labelEn}
                                          </Button>
                                        )}

                                        {/* Deliver link button (only when ready or pending/editing) */}
                                        {statusKey !== "completed" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1 text-xs"
                                            onClick={() => setUploadTask(task)}
                                          >
                                            <Link2 className="h-3 w-3" />
                                            {isPt ? "Entregar" : "Deliver"}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <TaskComments taskId={task.id} isOpen={isCommentsOpen} />
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Video Link Dialog */}
      {uploadTask && (
        <AddVideoLinkDialog
          open={!!uploadTask}
          onOpenChange={(open) => !open && setUploadTask(null)}
          clientUserId={uploadTask.user_id}
          clientName={uploadTask.user_name || uploadTask.user_email || "—"}
          taskId={uploadTask.id}
          taskNumber={uploadTask.task_number}
          planName={uploadTask.plan_name || undefined}
        />
      )}
    </div>
  );
};

export default AdminProduction;
