import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientUserId: string;
  clientName: string;
  taskId?: string;
  taskNumber?: number;
  planName?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_RETRIES = 3;

const VideoUploadDialog = ({
  open,
  onOpenChange,
  clientUserId,
  clientName,
  taskId,
  taskNumber,
  planName,
}: VideoUploadDialogProps) => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoTitle, setVideoTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast({
        title: isPt ? "Arquivo muito grande" : "File too large",
        description: isPt ? "Máximo 500MB" : "Maximum 500MB",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    if (!videoTitle) {
      setVideoTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const doUpload = async (retryCount = 0): Promise<boolean> => {
    if (!file || !videoTitle || !session?.access_token) return false;

    try {
      setStatus("uploading");
      setProgress(10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_user_id", clientUserId);
      formData.append("title", videoTitle);
      if (taskId) formData.append("task_id", taskId);

      setProgress(30);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-drive?action=upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      setProgress(80);

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Upload failed");
      }

      setProgress(100);
      setStatus("success");

      queryClient.invalidateQueries({ queryKey: ["production-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });

      toast({ title: isPt ? "Vídeo enviado com sucesso!" : "Video uploaded successfully!" });

      setTimeout(() => {
        resetAndClose();
      }, 1500);

      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";

      if (retryCount < MAX_RETRIES - 1) {
        setErrorMsg(isPt ? `Tentativa ${retryCount + 2} de ${MAX_RETRIES}...` : `Attempt ${retryCount + 2} of ${MAX_RETRIES}...`);
        await new Promise((r) => setTimeout(r, 2000 * (retryCount + 1)));
        return doUpload(retryCount + 1);
      }

      setStatus("error");
      setErrorMsg(msg);
      toast({
        title: isPt ? "Erro no upload" : "Upload error",
        description: msg,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setErrorMsg("");
    await doUpload();
    setUploading(false);
  };

  const resetAndClose = () => {
    setVideoTitle("");
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setErrorMsg("");
    setUploading(false);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !uploading && resetAndClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isPt ? "Enviar Vídeo" : "Upload Video"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><strong>{isPt ? "Cliente:" : "Client:"}</strong> {clientName}</p>
            {taskNumber && <p><strong>{isPt ? "Tarefa:" : "Task:"}</strong> Short {taskNumber}</p>}
            {planName && <p><strong>{isPt ? "Plano:" : "Plan:"}</strong> {planName}</p>}
          </div>

          {/* Title */}
          <div>
            <Label>{isPt ? "Título do vídeo" : "Video title"}</Label>
            <Input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder={isPt ? "Ex: Top 5 dicas..." : "Ex: Top 5 tips..."}
              disabled={uploading}
            />
          </div>

          {/* File input */}
          <div>
            <Label>{isPt ? "Arquivo de vídeo" : "Video file"}</Label>
            <div
              className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {file ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isPt ? "Clique para selecionar o vídeo" : "Click to select video"}
                  </p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Máx. 500MB" : "Max. 500MB"}</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* Progress */}
          {status !== "idle" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-sm">
                {status === "uploading" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      {errorMsg || (isPt ? "Enviando para o Google Drive..." : "Uploading to Google Drive...")}
                    </span>
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">{isPt ? "Enviado com sucesso!" : "Uploaded successfully!"}</span>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{errorMsg}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetAndClose} disabled={uploading}>
            {isPt ? "Cancelar" : "Cancel"}
          </Button>
          {status === "error" ? (
            <Button onClick={handleUpload} disabled={!file || !videoTitle}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {isPt ? "Tentar Novamente" : "Retry"}
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!file || !videoTitle || uploading || status === "success"}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isPt ? "Enviar" : "Upload"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadDialog;
