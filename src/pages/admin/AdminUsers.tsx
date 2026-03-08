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

const AdminUsers = () => {
  const { t } = useLanguage();
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
      toast.success(t.language === "pt" ? "Usuário atualizado!" : "User updated!");
    },
  });

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
                        ? (t.language === "pt" ? "Suspenso" : "Suspended")
                        : (t.language === "pt" ? "Ativo" : "Active")}
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t.language === "pt" ? "Nenhum usuário encontrado" : "No users found"}
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
