import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";

type Comment = {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
};

interface TaskCommentsProps {
  taskId: string;
  isOpen: boolean;
}

const TaskComments = ({ taskId, isOpen }: TaskCommentsProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      const authorIds = [...new Set(data.map((c) => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", authorIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return data.map((c) => ({
        ...c,
        author_name: profileMap.get(c.author_id)?.name || null,
        author_email: profileMap.get(c.author_id)?.email || null,
      })) as Comment[];
    },
    enabled: isOpen,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({
        task_id: taskId,
        author_id: user!.id,
        content: newComment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      setNewComment("");
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        {isPt ? "Comentários" : "Comments"}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {(comments || []).map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 rounded bg-background p-2 text-sm">
              <div className="flex-1">
                <span className="font-medium">{comment.author_name || comment.author_email || "—"}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleTimeString(isPt ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <p className="mt-0.5 text-muted-foreground">{comment.content}</p>
              </div>
              {comment.author_id === user?.id && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(comment.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isPt ? "Adicionar comentário..." : "Add comment..."}
          rows={1}
          className="min-h-[36px] resize-none text-sm"
        />
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!newComment.trim() || addMutation.isPending}
          className="shrink-0"
        >
          {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
};

export default TaskComments;
