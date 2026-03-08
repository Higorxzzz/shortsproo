import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Youtube, Zap } from "lucide-react";

const Register = () => {
  const { t } = useLanguage();
  const isPt = t.language === "pt";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    youtube_handle: "",
  });
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedChannel, setResolvedChannel] = useState<{
    channelId: string;
    channelTitle: string;
    channelThumbnail: string | null;
    handle: string;
  } | null>(null);
  const [resolveError, setResolveError] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "youtube_handle") {
      setResolvedChannel(null);
      setResolveError("");
    }
  };

  const resolveChannel = async () => {
    if (!form.youtube_handle.trim()) return;
    setResolving(true);
    setResolveError("");
    setResolvedChannel(null);

    try {
      const { data, error } = await supabase.functions.invoke("resolve-youtube-channel", {
        body: { handle: form.youtube_handle },
      });

      if (error) throw new Error(error.message);

      if (data?.error === "channel_not_found") {
        setResolveError(isPt ? "Canal não encontrado. Verifique o @ do canal." : "Channel not found. Check the handle.");
        return;
      }

      if (data?.error) {
        setResolveError(data.error);
        return;
      }

      if (data?.channelId) {
        setResolvedChannel(data);
      }
    } catch (err: any) {
      setResolveError(isPt ? "Erro ao buscar canal. Tente novamente." : "Error finding channel. Try again.");
    } finally {
      setResolving(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedChannel) {
      toast.error(isPt ? "Verifique seu canal do YouTube primeiro" : "Verify your YouTube channel first");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: form.name,
          youtube_channel: resolvedChannel.handle,
          youtube_channel_id: resolvedChannel.channelId,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isPt ? "Conta criada com sucesso!" : "Account created successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl">{t.auth.registerTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <Label>{t.auth.name}</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div>
              <Label>{t.auth.email}</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div>
              <Label>{t.auth.password}</Label>
              <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
            </div>

            {/* YouTube Handle Field */}
            <div>
              <Label>{isPt ? "Canal do YouTube" : "YouTube Channel"}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={form.youtube_handle}
                  onChange={(e) => update("youtube_handle", e.target.value)}
                  placeholder="@secanal"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-10 gap-1.5"
                  disabled={!form.youtube_handle.trim() || resolving}
                  onClick={resolveChannel}
                >
                  {resolving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                  {isPt ? "Verificar" : "Verify"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isPt
                  ? "Cole o @ do seu canal (ex: @MeuCanal) ou o link completo"
                  : "Paste your channel @ (e.g. @MyChannel) or the full link"}
              </p>

              {resolveError && (
                <p className="text-xs text-destructive mt-1.5">{resolveError}</p>
              )}

              {resolvedChannel && (
                <div className="flex items-center gap-3 mt-2 rounded-lg border bg-muted/50 p-2.5">
                  {resolvedChannel.channelThumbnail && (
                    <img
                      src={resolvedChannel.channelThumbnail}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{resolvedChannel.channelTitle}</p>
                    <p className="text-[11px] text-muted-foreground">{resolvedChannel.handle}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading || !resolvedChannel} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.auth.register}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t.auth.hasAccount}{" "}
              <Link to="/login" className="text-primary hover:underline">{t.nav.login}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
