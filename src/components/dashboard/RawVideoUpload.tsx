import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Film, X } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/x-matroska"];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

const RawVideoUpload = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error(isPt ? "Formato não aceito. Use MP4, MOV ou MKV." : "Format not accepted. Use MP4, MOV or MKV.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error(isPt ? "Arquivo muito grande. Máximo 500MB." : "File too large. Maximum 500MB.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return;

    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("raw-videos")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      setProgress(70);

      const { error: dbError } = await supabase.from("raw_videos").insert({
        user_id: user.id,
        title: title.trim(),
        notes: notes.trim() || null,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        status: "editing",
      });

      if (dbError) throw dbError;

      setProgress(100);
      toast.success(isPt ? "Vídeo enviado com sucesso!" : "Video uploaded successfully!");
      setTitle("");
      setNotes("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["raw-videos"] });
    } catch (err: any) {
      console.error(err);
      toast.error(isPt ? "Erro ao enviar vídeo." : "Error uploading video.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {isPt ? "Enviar vídeo para edição" : "Send video for editing"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{isPt ? "Título do vídeo" : "Video title"}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isPt ? "Ex: Vlog semana 12" : "Ex: Week 12 vlog"}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label>{isPt ? "Arquivo de vídeo" : "Video file"}</Label>
          {file ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <Film className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setFile(null)}
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isPt ? "Clique para selecionar (MP4, MOV, MKV)" : "Click to select (MP4, MOV, MKV)"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isPt ? "Máximo 500MB" : "Maximum 500MB"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".mp4,.mov,.mkv,video/mp4,video/quicktime,video/x-matroska"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label>{isPt ? "Observações (opcional)" : "Notes (optional)"}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isPt ? "Instruções ou detalhes para a equipe..." : "Instructions or details for the team..."}
            disabled={uploading}
            rows={3}
          />
        </div>

        {uploading && <Progress value={progress} className="h-2" />}

        <Button
          onClick={handleUpload}
          disabled={uploading || !title.trim() || !file}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading
            ? (isPt ? "Enviando..." : "Uploading...")
            : (isPt ? "Enviar vídeo" : "Upload video")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RawVideoUpload;
