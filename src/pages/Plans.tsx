import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const Plans = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("shorts_per_day");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("plan_id").eq("id", user!.id).single();
      return data;
    },
  });

  const selectPlan = async (planId: string) => {
    if (!user) {
      navigate("/register");
      return;
    }
    const { error } = await supabase.from("profiles").update({ plan_id: planId }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Plano atualizado!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="container py-16">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold">{t.plans.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.plans.subtitle}</p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan: any, i: number) => {
          const isPopular = i === 1;
          const isCurrent = profile?.plan_id === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`relative flex h-full flex-col ${isPopular ? "border-primary shadow-lg" : ""}`}>
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{t.plans.popular}</Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">R${plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    {plan.shorts_per_day} {t.plans.shortsPerDay}
                  </div>
                  <div className="mt-auto">
                    <Button
                      className="w-full"
                      variant={isCurrent ? "secondary" : "default"}
                      disabled={isCurrent}
                      onClick={() => selectPlan(plan.id)}
                    >
                      {isCurrent ? t.plans.currentPlan : t.plans.selectPlan}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
