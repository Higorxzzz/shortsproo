import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLandingSettings } from "@/contexts/LandingSettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Upload, Download, Play, ArrowRight,
  Scissors, CalendarCheck, LayoutDashboard, Headphones,
  Star, Users, Eye, ThumbsUp, Quote,
} from "lucide-react";

const Landing = () => {
  const { t } = useLanguage();
  const { config } = useLandingSettings();
  const c = config.content;

  const txt = (key: string, fallback: string) => c[key]?.trim() || fallback;

  const show = config.sections;

  const steps = [
    { icon: Upload, title: txt("features.step1Title", t.features.step1Title), desc: txt("features.step1Desc", t.features.step1Desc) },
    { icon: Scissors, title: txt("features.step2Title", t.features.step2Title), desc: txt("features.step2Desc", t.features.step2Desc) },
    { icon: Download, title: txt("features.step3Title", t.features.step3Title), desc: txt("features.step3Desc", t.features.step3Desc) },
  ];

  const services = [
    { icon: Scissors, title: txt("services.item1Title", t.services.item1Title), desc: txt("services.item1Desc", t.services.item1Desc) },
    { icon: CalendarCheck, title: txt("services.item2Title", t.services.item2Title), desc: txt("services.item2Desc", t.services.item2Desc) },
    { icon: LayoutDashboard, title: txt("services.item3Title", t.services.item3Title), desc: txt("services.item3Desc", t.services.item3Desc) },
    { icon: Headphones, title: txt("services.item4Title", t.services.item4Title), desc: txt("services.item4Desc", t.services.item4Desc) },
  ];

  const testimonials = [
    { name: txt("testimonials.t1Name", t.testimonials.t1Name), role: txt("testimonials.t1Role", t.testimonials.t1Role), text: txt("testimonials.t1Text", t.testimonials.t1Text) },
    { name: txt("testimonials.t2Name", t.testimonials.t2Name), role: txt("testimonials.t2Role", t.testimonials.t2Role), text: txt("testimonials.t2Text", t.testimonials.t2Text) },
    { name: txt("testimonials.t3Name", t.testimonials.t3Name), role: txt("testimonials.t3Role", t.testimonials.t3Role), text: txt("testimonials.t3Text", t.testimonials.t3Text) },
  ];

  const stats = [
    { value: "500+", label: txt("stats.creators", t.stats.creators), icon: Users },
    { value: "45K+", label: txt("stats.delivered", t.stats.delivered), icon: Play },
    { value: "120M+", label: txt("stats.views", t.stats.views), icon: Eye },
    { value: "98%", label: txt("stats.satisfaction", t.stats.satisfaction), icon: ThumbsUp },
  ];

  const faqs = [
    { q: txt("faq.q1", t.faq.q1), a: txt("faq.a1", t.faq.a1) },
    { q: txt("faq.q2", t.faq.q2), a: txt("faq.a2", t.faq.a2) },
    { q: txt("faq.q3", t.faq.q3), a: txt("faq.a3", t.faq.a3) },
    { q: txt("faq.q4", t.faq.q4), a: txt("faq.a4", t.faq.a4) },
    { q: txt("faq.q5", t.faq.q5), a: txt("faq.a5", t.faq.a5) },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      {show.hero && (
        <section className="py-20 md:py-28">
          <div className="container flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
              <Play className="h-3.5 w-3.5" />
              {txt("hero.badge", t.hero.badge)}
            </div>
            <h1 className="max-w-2xl font-heading text-3xl font-bold leading-tight md:text-5xl">
              {txt("hero.title", t.hero.title)}
            </h1>
            <p className="max-w-lg text-muted-foreground">
              {txt("hero.subtitle", t.hero.subtitle)}
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  {txt("hero.cta", t.hero.cta)} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/plans">{txt("hero.ctaSecondary", t.hero.ctaSecondary)}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {show.stats && (
        <section className="border-y border-border bg-muted/50 py-10">
          <div className="container">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {show.howItWorks && (
        <section className="py-16">
          <div className="container">
            <h2 className="mb-10 text-center font-heading text-2xl font-bold">{txt("features.title", t.features.title)}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {i + 1}
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {show.services && (
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold">{txt("services.title", t.services.title)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{txt("services.subtitle", t.services.subtitle)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((svc, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svc.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold">{svc.title}</h3>
                    <p className="text-sm text-muted-foreground">{svc.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {show.testimonials && (
        <section className="py-16">
          <div className="container">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold">{txt("testimonials.title", t.testimonials.title)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{txt("testimonials.subtitle", t.testimonials.subtitle)}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <Quote className="h-6 w-6 text-muted-foreground/30" />
                    <p className="flex-1 text-sm text-muted-foreground italic">"{item.text}"</p>
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {show.faq && (
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container max-w-2xl">
            <h2 className="mb-8 text-center font-heading text-2xl font-bold">{txt("faq.title", t.faq.title)}</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {show.cta && (
        <section className="py-16">
          <div className="container">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-10 text-center md:p-14">
              <h2 className="max-w-lg font-heading text-2xl font-bold md:text-3xl">
                {txt("cta.title", t.cta.title)}
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">{txt("cta.subtitle", t.cta.subtitle)}</p>
              <Button size="lg" asChild>
                <Link to="/register">
                  {txt("cta.button", t.cta.button)} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Landing;
