import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Shield, ShieldCheck, Pencil, Trash2, Users } from "lucide-react";

type TeamMember = {
  role_id: string;
  user_id: string;
  role: string;
  name: string | null;
  email: string | null;
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  manager: "bg-primary/10 text-primary border-primary/20",
  editor: "bg-accent/10 text-accent-foreground border-accent/20",
};

const AdminTeam = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isPt = t.language === "pt";

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("editor");

  // Fetch team members (users with admin/manager/editor roles)
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("role", ["admin", "manager", "editor"]);

      if (error) throw error;
      if (!roles?.length) return [];

      const userIds = [...new Set(roles.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return roles.map((r) => ({
        role_id: r.id,
        user_id: r.user_id,
        role: r.role,
        name: profileMap.get(r.user_id)?.name || null,
        email: profileMap.get(r.user_id)?.email || null,
      })) as TeamMember[];
    },
  });

  // Fetch all users for adding
  const { data: allUsers } = useQuery({
    queryKey: ["all-users-for-team"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name, email");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setAddDialogOpen(false);
      setSelectedEmail("");
      setSelectedRole("editor");
      toast({ title: isPt ? "Membro adicionado!" : "Member added!" });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate")
        ? (isPt ? "Usuário já tem essa role" : "User already has this role")
        : (isPt ? "Erro ao adicionar" : "Error adding");
      toast({ title: msg, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, newRole }: { roleId: string; newRole: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setEditMember(null);
      toast({ title: isPt ? "Role atualizada!" : "Role updated!" });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: isPt ? "Membro removido" : "Member removed" });
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      manager: isPt ? "Gerente" : "Manager",
      editor: "Editor",
    };
    return labels[role] || role;
  };

  const roleDescription = (role: string) => {
    const desc: Record<string, string> = {
      admin: isPt ? "Acesso total ao sistema" : "Full system access",
      manager: isPt ? "Gerencia produção e equipe" : "Manages production and team",
      editor: isPt ? "Apenas envia vídeos" : "Only delivers videos",
    };
    return desc[role] || "";
  };

  const selectedUser = allUsers?.find((u) => u.email === selectedEmail);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isPt ? "Equipe" : "Team"}</h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Gerencie os membros da equipe e suas permissões" : "Manage team members and their permissions"}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {isPt ? "Adicionar Membro" : "Add Member"}
        </Button>
      </div>

      {/* Role legend */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {["admin", "manager", "editor"].map((role) => (
          <Card key={role}>
            <CardContent className="flex items-start gap-3 pt-6">
              <div className="rounded-lg bg-primary/10 p-2">
                {role === "admin" ? <ShieldCheck className="h-5 w-5 text-primary" /> :
                 role === "manager" ? <Shield className="h-5 w-5 text-primary" /> :
                 <Pencil className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <p className="font-semibold">{roleLabel(role)}</p>
                <p className="text-xs text-muted-foreground">{roleDescription(role)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              {isPt ? "Membros da Equipe" : "Team Members"} ({teamMembers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isPt ? "Nome" : "Name"}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">{isPt ? "Ações" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teamMembers || []).map((member) => (
                  <TableRow key={member.role_id}>
                    <TableCell className="font-medium">{member.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[member.role] || ""}>{roleLabel(member.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditMember(member); setSelectedRole(member.role); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeMutation.mutate(member.role_id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!teamMembers || teamMembers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      {isPt ? "Nenhum membro na equipe" : "No team members"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add member dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isPt ? "Adicionar Membro" : "Add Team Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                placeholder={isPt ? "Digite o email do usuário" : "Enter user email"}
              />
              {selectedEmail && !selectedUser && (
                <p className="mt-1 text-xs text-destructive">{isPt ? "Usuário não encontrado" : "User not found"}</p>
              )}
              {selectedUser && (
                <p className="mt-1 text-xs text-muted-foreground">{selectedUser.name || selectedUser.email}</p>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor — {isPt ? "apenas envia vídeos" : "delivers videos only"}</SelectItem>
                  <SelectItem value="manager">{isPt ? "Gerente" : "Manager"} — {isPt ? "gerencia produção" : "manages production"}</SelectItem>
                  <SelectItem value="admin">Admin — {isPt ? "acesso total" : "full access"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{isPt ? "Cancelar" : "Cancel"}</Button>
            <Button
              onClick={() => selectedUser && addMutation.mutate({ userId: selectedUser.id, role: selectedRole })}
              disabled={!selectedUser || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPt ? "Adicionar" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isPt ? "Alterar Role" : "Change Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p><strong>{editMember?.name || editMember?.email}</strong></p>
              <p className="text-muted-foreground">{editMember?.email}</p>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="manager">{isPt ? "Gerente" : "Manager"}</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>{isPt ? "Cancelar" : "Cancel"}</Button>
            <Button
              onClick={() => editMember && updateRoleMutation.mutate({ roleId: editMember.role_id, newRole: selectedRole })}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPt ? "Salvar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeam;
