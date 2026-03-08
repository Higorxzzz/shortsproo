import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Film, Filter, Loader2, MessageSquare, RefreshCw, Upload, AlertCircle } from "lucide-react";
import TaskComments from "@/components/TaskComments";
import AddVideoLinkDialog from "@/components/AddVideoLinkDialog";

type TaskWithUser = {
  id: string;
  user_id: string;
  task_date: string;
  task_number: number;
  status: string;
  video_id: string | null;
  completed_at: string | null;
  notes: string | null;
  user_name: string | null;
  user_email: string | null;
  plan_name: string | null;
  shorts_per_day: number;
  plan_price: number;
  youtube_channel: string | null;
  country: string | null;
  language: string | null;
};

const PRIORITY_ORDER: Record<string, number> = { Pro: 1, Growth: 2, Creator: 3, Starter: 4 };

const AdminProduction = () => {
  const { t } = useLanguage();
  const { user, teamRole } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Upload dialog state
  const [uploadTask, setUploadTask] = useState<TaskWithUser | null>(null);

  // Fetch tasks with user info
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

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const planMap = new Map((plans || []).map((p) => [p.id, p]));

      return taskRows.map((task) => {
        const profile = profileMap.get(task.user_id);
        const plan = profile?.plan_id ? planMap.get(profile.plan_id) : null;
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
        } as TaskWithUser;
      });
    },
  });

  // Generate tasks mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_daily_tasks");
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
      toast({ title: isPt ? "Tarefas geradas" : "Tasks generated", description: `${count} ${isPt ? "tarefas criadas" : "tasks created"}` });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  // Group tasks by user
  const groupedByUser = (() => {
    if (!tasks) return [];
    const map = new Map<string, { user: TaskWithUser; tasks: TaskWithUser[] }>();
    for (const task of tasks) {
      if (!map.has(task.user_id)) map.set(task.user_id, { user: task, tasks: [] });
      map.get(task.user_id)!.tasks.push(task);
    }
    return Array.from(map.values());
  })();

  // Filter
  const filtered = groupedByUser.filter((g) => {
    if (planFilter !== "all" && g.user.plan_name !== planFilter) return false;
    if (countryFilter !== "all" && g.user.country !== countryFilter) return false;
    if (statusFilter === "pending" && g.tasks.every((t) => t.status === "completed")) return false;
    if (statusFilter === "completed" && g.tasks.some((t) => t.status !== "completed")) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(g.user.user_name || "").toLowerCase().includes(q) &&
        !(g.user.user_email || "").toLowerCase().includes(q) &&
        !(g.user.youtube_channel || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Sort by plan priority
  const sorted = [...filtered].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.user.plan_name || ""] || 99;
    const pb = PRIORITY_ORDER[b.user.plan_name || ""] || 99;
    return pa - pb;
  });

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
  const pendingTasks = totalTasks - completedTasks;
  const uniquePlans = [...new Set(groupedByUser.map((g) => g.user.plan_name).filter(Boolean))];
  const uniqueCountries = [...new Set(groupedByUser.map((g) => g.user.country).filter(Boolean))];

  const priorityBadge = (planName: string | null) => {
    switch (planName) {
      case "Pro":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{isPt ? "Alta" : "High"}</Badge>;
      case "Growth":
        return <Badge className="bg-accent text-accent-foreground">{isPt ? "Média" : "Medium"}</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{isPt ? "Normal" : "Normal"}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isPt ? "Fila de Produção" : "Production Queue"}</h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Gerencie as entregas diárias de shorts" : "Manage daily shorts deliveries"}
          </p>
        </div>
        {(teamRole === "admin" || teamRole === "manager") && (
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isPt ? "Gerar Tarefas de Hoje" : "Generate Today's Tasks"}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2"><Film className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">{isPt ? "Total de tarefas" : "Total tasks"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{completedTasks}</p>
              <p className="text-xs text-muted-foreground">{isPt ? "Concluídas" : "Completed"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-accent p-2"><Clock className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">{isPt ? "Pendentes" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder={isPt ? "Buscar usuário..." : "Search user..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isPt ? "Todos" : "All"}</SelectItem>
            <SelectItem value="pending">{isPt ? "Pendentes" : "Pending"}</SelectItem>
            <SelectItem value="completed">{isPt ? "Concluídos" : "Completed"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isPt ? "Todos os planos" : "All plans"}</SelectItem>
            {uniquePlans.map((p) => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {uniqueCountries.length > 0 && (
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isPt ? "Todos os países" : "All countries"}</SelectItem>
              {uniqueCountries.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{isPt ? "Nenhuma tarefa encontrada. Clique em 'Gerar Tarefas de Hoje'." : "No tasks found. Click 'Generate Today's Tasks'."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((group) => {
            const completed = group.tasks.filter((t) => t.status === "completed").length;
            const total = group.tasks.length;
            const allDone = completed === total;
            return (
              <Card key={group.user.user_id} className={allDone ? "border-primary/30 bg-primary/5" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-base">{group.user.user_name || group.user.user_email || "—"}</CardTitle>
                        <p className="text-xs text-muted-foreground">{group.user.youtube_channel || group.user.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {priorityBadge(group.user.plan_name)}
                      <Badge variant="outline">{group.user.plan_name || "—"}</Badge>
                      <Badge variant={allDone ? "default" : "secondary"}>{completed}/{total}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.tasks.map((task) => {
                      const isCommentsOpen = expandedComments.has(task.id);
                      return (
                        <div key={task.id} className="w-full">
                          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            task.status === "completed"
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-card"
                          }`}>
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Short {task.task_number}</span>
                            <div className="ml-auto flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                                const next = new Set(expandedComments);
                                if (isCommentsOpen) next.delete(task.id); else next.add(task.id);
                                setExpandedComments(next);
                              }}>
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                              {task.status !== "completed" && (
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setUploadTask(task)}>
                                  <Upload className="mr-1 h-3 w-3" />
                                  {isPt ? "Enviar" : "Upload"}
                                </Button>
                              )}
                            </div>
                          </div>
                          <TaskComments taskId={task.id} isOpen={isCommentsOpen} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
