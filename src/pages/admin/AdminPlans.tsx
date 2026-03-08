import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const AdminPlans = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", shorts_per_day: 1, price: 0, description: "" });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("shorts_per_day");
      return data || [];
    },
  });

  const addPlan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("plans").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setOpen(false);
      setForm({ name: "", shorts_per_day: 1, price: 0, description: "" });
      toast.success(t.language === "pt" ? "Plano criado!" : "Plan created!");
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(t.language === "pt" ? "Plano atualizado!" : "Plan updated!");
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(t.language === "pt" ? "Plano removido!" : "Plan deleted!");
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.admin.managePlans}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" />{t.admin.addPlan}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.admin.addPlan}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div><Label>{t.admin.planName}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>{t.admin.planShorts}</Label><Input type="number" value={form.shorts_per_day} onChange={(e) => setForm({ ...form, shorts_per_day: Number(e.target.value) })} /></div>
              <div><Label>{t.admin.planPrice}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>{t.admin.planDesc}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={() => addPlan.mutate()} disabled={!form.name}>{t.admin.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.planName}</TableHead>
                <TableHead>{t.admin.planShorts}</TableHead>
                <TableHead>{t.admin.planPrice}</TableHead>
                <TableHead>{t.admin.planDesc}</TableHead>
                <TableHead>{t.admin.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Input
                      defaultValue={plan.name}
                      className="h-8 w-32"
                      onBlur={(e) => { if (e.target.value !== plan.name) updatePlan.mutate({ id: plan.id, updates: { name: e.target.value } }); }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={plan.shorts_per_day}
                      className="h-8 w-20"
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== plan.shorts_per_day) updatePlan.mutate({ id: plan.id, updates: { shorts_per_day: v } }); }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={plan.price}
                      className="h-8 w-24"
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== plan.price) updatePlan.mutate({ id: plan.id, updates: { price: v } }); }}
                    />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{plan.description}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan.mutate(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlans;
