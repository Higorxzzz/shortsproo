import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ExternalLink, Gift } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const STRIPE_TIERS: Record<string, { price_id: string; product_id: string; coupon_id: string }> = {
  Basic: { price_id: "price_1T8oziGl9Dro90S65eTOEztc", product_id: "prod_U735ZwU7iNkekI", coupon_id: "9WabNny8" },
  Medium: { price_id: "price_1T8ozjGl9Dro90S66BVXU8pc", product_id: "prod_U735dHxMLFG8yb", coupon_id: "VPFy5fKH" },
  Pro: { price_id: "price_1T8ozkGl9Dro90S6czSCyosm", product_id: "prod_U7359CmAc4D32R", coupon_id: "qAnupTXk" },
};

const Plans = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const isPt = t.language === "pt";
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("shorts_per_day");
      if (error) throw error;
      return data;
    },
  });

  const { data: trialSettings } = useQuery({
    queryKey: ["trial-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["free_trial_days", "free_trial_videos_per_day"]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return { days: parseInt(map.free_trial_days || "3"), videos: parseInt(map.free_trial_videos_per_day || "1") };
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-trial", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("trial_start, plan_id").eq("id", user!.id).single();
      return data;
    },
  });

  const trialActive = !!profile?.trial_start;
  const trialExpired = trialActive && trialSettings
    ? new Date(profile.trial_start).getTime() + trialSettings.days * 86400000 < Date.now()
    : false;

  const handleActivateTrial = async () => {
    if (!user) { navigate("/register"); return; }
    setActivatingTrial(true);
    const { error } = await supabase.from("profiles").update({ trial_start: new Date().toISOString() }).eq("id", user.id);
    if (error) {
      toast.error(isPt ? "Erro ao ativar trial" : "Error activating trial");
    } else {
      toast.success(isPt ? "Teste gratuito ativado!" : "Free trial activated!");
      queryClient.invalidateQueries({ queryKey: ["profile-trial"] });
    }
    setActivatingTrial(false);
  };

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
        body: { priceId: tier.price_id, couponId: tier.coupon_id },
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
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold">{t.plans.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.plans.subtitle}</p>
        {activeTier && subscription?.subscription_end && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>
              {isPt ? `Plano ativo: ${activeTier}` : `Active plan: ${activeTier}`}
              {" · "}
              {isPt ? "Renova em " : "Renews "}
              {new Date(subscription.subscription_end).toLocaleDateString()}
            </span>
            <Button variant="link" size="sm" onClick={handleManageSubscription} disabled={managingPortal} className="ml-1 h-auto p-0 text-xs">
              {managingPortal ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3 mr-1" />}
              {isPt ? "Gerenciar" : "Manage"}
            </Button>
          </div>
        )}
      </div>

      {/* Free Trial Card */}
      {trialSettings && (
        <div className="mx-auto max-w-sm mb-8">
          <Card className="border-dashed border-2 border-border">
            <CardHeader className="text-center pb-2">
              <Badge variant="secondary" className="mx-auto mb-2 w-fit">
                <Gift className="h-3 w-3 mr-1" />
                {isPt ? "Grátis" : "Free"}
              </Badge>
              <CardTitle className="font-heading text-lg">{isPt ? "Plano Gratuito" : "Free Plan"}</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-bold">$0</span>
                <span className="text-sm text-muted-foreground"> / {trialSettings.days} {isPt ? "dias" : "days"}</span>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="space-y-1.5 text-sm text-left inline-block">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{trialSettings.videos} {trialSettings.videos === 1 ? "short" : "shorts"} {isPt ? "por dia" : "per day"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{isPt ? `Acesso por ${trialSettings.days} dias` : `${trialSettings.days}-day access`}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{isPt ? "Sem cartão de crédito" : "No credit card required"}</span>
                </li>
              </ul>
              {!user ? (
                <Button className="w-full mt-4" size="sm" onClick={() => navigate("/register")}>
                  {isPt ? "Começar Grátis" : "Start Free"}
                </Button>
              ) : trialActive && !trialExpired ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  ✅ {isPt ? "Trial ativo" : "Trial active"} — {isPt ? "expira em" : "expires"}{" "}
                  {new Date(new Date(profile.trial_start).getTime() + trialSettings!.days * 86400000).toLocaleDateString()}
                </p>
              ) : trialExpired ? (
                <p className="mt-3 text-xs text-destructive">{isPt ? "Seu trial expirou" : "Your trial expired"}</p>
              ) : !activeTier ? (
                <Button className="w-full mt-4" size="sm" onClick={handleActivateTrial} disabled={activatingTrial}>
                  {activatingTrial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPt ? "Usar Teste Grátis" : "Start Free Trial"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
        {plans.map((plan: any, i: number) => {
          const isPopular = i === 1;
          const isCurrent = activeTier === plan.name;
          const isLoading = checkingOut === plan.name;
          return (
            <Card key={plan.id} className={`relative flex h-full flex-col ${isCurrent ? "border-primary ring-1 ring-primary/20" : isPopular ? "border-primary" : ""}`}>
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-xs">
                  {isPt ? "Seu Plano" : "Your Plan"}
                </Badge>
              )}
              {isPopular && !isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">{t.plans.popular}</Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                <div className="mt-1">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground"> /{isPt ? "1º mês" : "1st mo"}</span>
                </div>
                {plan.price_second_month > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isPt ? "A partir do 2º mês:" : "From 2nd month:"} ${plan.price_second_month}/{isPt ? "mês" : "mo"}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <ul className="space-y-1.5 text-sm">
                  {(plan.description || "").split("|").filter(Boolean).map((line: string, li: number) => (
                    <li key={li} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button className="w-full" variant="secondary" size="sm" onClick={handleManageSubscription} disabled={managingPortal}>
                      {managingPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isPt ? "Gerenciar Assinatura" : "Manage Subscription"}
                    </Button>
                  ) : (
                    <Button className="w-full" size="sm" disabled={isLoading || !!checkingOut} onClick={() => handleCheckout(plan.name)}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {activeTier ? (isPt ? "Trocar Plano" : "Switch Plan") : t.plans.selectPlan}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
