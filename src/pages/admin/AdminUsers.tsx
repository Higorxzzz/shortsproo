import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useState } from "react";
import { Youtube, Check, X, Pencil } from "lucide-react";

const ChannelIdCell = ({ user, onSave }: { user: any; onSave: (id: string, val: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.youtube_channel_id || "");

  const handleSave = () => {
    onSave(user.id, value.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(user.youtube_channel_id || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="UCxxxxxxx"
          className="h-7 w-36 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-3 w-3 text-primary" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
          <X className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {user.youtube_channel_id ? (
        <span className="max-w-[120px] truncate text-xs font-mono" title={user.youtube_channel_id}>
          {user.youtube_channel_id}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
};

const AdminUsers = () => {
  const { t } = useLanguage();
  const isPt = (t as any).language === "pt";
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, plans(name)");
      return data || [];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*");
      return data || [];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(isPt ? "Usuário atualizado!" : "User updated!");
    },
  });

  const handleChannelIdSave = (userId: string, channelId: string) => {
    updateUser.mutate({ userId, updates: { youtube_channel_id: channelId || null } });
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">{t.admin.manageUsers}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.userName}</TableHead>
                <TableHead>{t.admin.userEmail}</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Youtube className="h-3.5 w-3.5" />
                    {isPt ? "Canal" : "Channel"}
                  </div>
                </TableHead>
                <TableHead>Channel ID (API)</TableHead>
                <TableHead>{t.admin.userPlan}</TableHead>
                <TableHead>{t.admin.userStatus}</TableHead>
                <TableHead>{t.admin.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "-"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    {user.youtube_channel ? (
                      <a
                        href={user.youtube_channel.startsWith("http") ? user.youtube_channel : `https://youtube.com/${user.youtube_channel}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[140px] truncate text-xs text-primary hover:underline block"
                        title={user.youtube_channel}
                      >
                        {user.youtube_channel}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChannelIdCell user={user} onSave={handleChannelIdSave} />
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border border-input bg-background px-2 py-1 text-sm"
                      value={user.plan_id || ""}
                      onChange={(e) =>
                        updateUser.mutate({ userId: user.id, updates: { plan_id: e.target.value || null } })
                      }
                    >
                      <option value="">-</option>
                      {plans.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.suspended ? "destructive" : "default"}>
                      {user.suspended
                        ? (isPt ? "Suspenso" : "Suspended")
                        : (isPt ? "Ativo" : "Active")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateUser.mutate({ userId: user.id, updates: { suspended: !user.suspended } })
                      }
                    >
                      {user.suspended ? t.admin.activate : t.admin.suspend}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {isPt ? "Nenhum usuário encontrado" : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
