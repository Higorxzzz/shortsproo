import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Stripe price/product mapping
const STRIPE_TIERS: Record<string, { price_id: string; product_id: string }> = {
  Basic: { price_id: "price_1T8oo2Gl9Dro90S68L6UguJr", product_id: "prod_U72tPmImkbfpiF" },
  Medium: { price_id: "price_1T8oo3Gl9Dro90S6MOgthfTE", product_id: "prod_U72tUJo2TTwMHq" },
  Pro: { price_id: "price_1T8oo4Gl9Dro90S6TpLq5EMG", product_id: "prod_U72tvbbVzNOWEJ" },
};

const Plans = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const isPt = t.language === "pt";

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("shorts_per_day");
      if (error) throw error;
      return data;
    },
  });

  const { data: subscription, refetch: refetchSub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as { subscribed: boolean; product_id: string | null; price_id: string | null; subscription_end: string | null };
    },
  });

  // Handle success/cancel redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(isPt ? "Assinatura realizada com sucesso!" : "Subscription successful!");
      refetchSub();
    }
    if (searchParams.get("canceled") === "true") {
      toast.info(isPt ? "Checkout cancelado" : "Checkout canceled");
    }
  }, [searchParams]);

  const handleCheckout = async (planName: string) => {
    if (!user) { navigate("/register"); return; }
    const tier = STRIPE_TIERS[planName];
    if (!tier) return;

    setCheckingOut(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Error creating checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Error opening portal");
    } finally {
      setManagingPortal(false);
    }
  };

  const getActiveTier = () => {
    if (!subscription?.subscribed || !subscription.product_id) return null;
    return Object.entries(STRIPE_TIERS).find(([, v]) => v.product_id === subscription.product_id)?.[0] || null;
  };

  const activeTier = getActiveTier();

  return (
    <div className="container py-16">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold">{t.plans.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.plans.subtitle}</p>
        {activeTier && subscription?.subscription_end && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>
              {isPt ? `Plano ativo: ${activeTier}` : `Active plan: ${activeTier}`}
              {" · "}
              {isPt ? "Renova em " : "Renews "}
              {new Date(subscription.subscription_end).toLocaleDateString()}
            </span>
            <Button variant="link" size="sm" onClick={handleManageSubscription} disabled={managingPortal} className="ml-2 h-auto p-0 text-xs">
              {managingPortal ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3 mr-1" />}
              {isPt ? "Gerenciar" : "Manage"}
            </Button>
          </div>
        )}
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan: any, i: number) => {
          const isPopular = i === 1;
          const isCurrent = activeTier === plan.name;
          const isLoading = checkingOut === plan.name;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`relative flex h-full flex-col ${isCurrent ? "border-primary shadow-lg ring-2 ring-primary/20" : isPopular ? "border-primary shadow-lg" : ""}`}>
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {isPt ? "Seu Plano" : "Your Plan"}
                  </Badge>
                )}
                {isPopular && !isCurrent && (
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
                    {isCurrent ? (
                      <Button className="w-full" variant="secondary" onClick={handleManageSubscription} disabled={managingPortal}>
                        {managingPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isPt ? "Gerenciar Assinatura" : "Manage Subscription"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={isLoading || !!checkingOut}
                        onClick={() => handleCheckout(plan.name)}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {activeTier ? (isPt ? "Trocar Plano" : "Switch Plan") : t.plans.selectPlan}
                      </Button>
                    )}
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
