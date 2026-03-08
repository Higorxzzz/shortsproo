import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Film, X, FileVideo, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/x-matroska"];
const MAX_SIZE = 500 * 1024 * 1024;

const RawVideoUpload = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPt = (t as any).language === "pt";
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = (f: File): boolean => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error(isPt ? "Formato não aceito. Use MP4, MOV ou MKV." : "Format not accepted. Use MP4, MOV or MKV.");
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast.error(isPt ? "Arquivo muito grande. Máximo 500MB." : "File too large. Maximum 500MB.");
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && validateFile(f)) setFile(f);
  }, [isPt]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleUpload = async () => {
    if (!user || !file) return;

    setUploading(true);
    setProgress(5);

    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      // Simulate smooth progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 85));
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from("raw-videos")
        .upload(filePath, file, { upsert: false });

      clearInterval(progressInterval);
      if (uploadError) throw uploadError;

      setProgress(90);

      const { error: dbError } = await supabase.from("raw_videos").insert({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        notes: notes.trim() || null,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        status: "waiting",
      });

      if (dbError) throw dbError;

      setProgress(100);
      setUploadSuccess(true);
      toast.success(isPt ? "Vídeo enviado com sucesso!" : "Video uploaded successfully!");

      setTimeout(() => {
        setNotes("");
        setFile(null);
        setUploadSuccess(false);
        queryClient.invalidateQueries({ queryKey: ["raw-videos"] });
        queryClient.invalidateQueries({ queryKey: ["raw-videos-count"] });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(isPt ? "Erro ao enviar vídeo." : "Error uploading video.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />

      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Upload className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {isPt ? "Enviar vídeo para edição" : "Send video for editing"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isPt ? "Nossa equipe transforma em Short profissional" : "Our team turns it into a professional Short"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* File drop zone */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isPt ? "Arquivo de vídeo" : "Video file"}</Label>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileVideo className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.label
                key="drop-zone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div className={`rounded-full p-3 transition-colors ${
                  isDragging ? "bg-primary/15" : "bg-muted group-hover:bg-primary/10"
                }`}>
                  <Upload className={`h-6 w-6 transition-colors ${
                    isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  }`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isDragging
                      ? (isPt ? "Solte o arquivo aqui" : "Drop the file here")
                      : (isPt ? "Arraste ou clique para selecionar" : "Drag or click to select")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    MP4, MOV, MKV · {isPt ? "Máximo" : "Max"} 500MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".mp4,.mov,.mkv,video/mp4,video/quicktime,video/x-matroska"
                  onChange={handleFileChange}
                />
              </motion.label>
            )}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isPt ? "Observações (opcional)" : "Notes (optional)"}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isPt ? "Instruções ou detalhes para a equipe..." : "Instructions or details for the team..."}
            disabled={uploading}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{isPt ? "Enviando..." : "Uploading..."}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !title.trim() || !file || uploadSuccess}
          className="w-full gap-2 h-11 text-sm font-semibold"
          size="lg"
        >
          {uploadSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {isPt ? "Enviado!" : "Uploaded!"}
            </>
          ) : uploading ? (
            <>
              <Upload className="h-4 w-4 animate-bounce" />
              {isPt ? "Enviando..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {isPt ? "Enviar vídeo" : "Upload video"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RawVideoUpload;
