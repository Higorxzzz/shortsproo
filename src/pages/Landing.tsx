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
import { motion } from "framer-motion";
import {
  Zap, Upload, Download, Play, ArrowRight,
  Scissors, CalendarCheck, LayoutDashboard, Headphones,
  Star, Users, Eye, ThumbsUp, Quote,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Landing = () => {
  const { t } = useLanguage();
  const { config } = useLandingSettings();
  const c = config.content;

  // Helper: use custom content or fallback to translation
  const txt = (key: string, fallback: string) => c[key]?.trim() || fallback;

  const show = config.sections;

  const steps = [
    { icon: Zap, title: txt("features.step1Title", t.features.step1Title), desc: txt("features.step1Desc", t.features.step1Desc) },
    { icon: Upload, title: txt("features.step2Title", t.features.step2Title), desc: txt("features.step2Desc", t.features.step2Desc) },
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="container relative flex flex-col items-center gap-8 py-24 text-center md:py-36">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Play className="h-3.5 w-3.5" />
                {txt("hero.badge", t.hero.badge)}
              </div>
              <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                {txt("hero.title", t.hero.title)}
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                {txt("hero.subtitle", t.hero.subtitle)}
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/register">
                    {txt("hero.cta", t.hero.cta)} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/plans">{txt("hero.ctaSecondary", t.hero.ctaSecondary)}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stats */}
      {show.stats && (
        <section className="border-y border-border bg-card/50 py-12">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {show.howItWorks && (
        <section className="py-20">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold">{txt("features.title", t.features.title)}</h2>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="relative flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {show.services && (
        <section className="border-t border-border bg-secondary/30 py-20">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold">{txt("services.title", t.services.title)}</h2>
              <p className="mt-2 text-muted-foreground">{txt("services.subtitle", t.services.subtitle)}</p>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((svc, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                  <Card className="h-full border-border bg-card transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-4 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <svc.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold">{svc.title}</h3>
                      <p className="text-sm text-muted-foreground">{svc.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {show.testimonials && (
        <section className="py-20">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold">{txt("testimonials.title", t.testimonials.title)}</h2>
              <p className="mt-2 text-muted-foreground">{txt("testimonials.subtitle", t.testimonials.subtitle)}</p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                  <Card className="h-full border-border bg-card">
                    <CardContent className="flex flex-col gap-4 p-6">
                      <Quote className="h-8 w-8 text-primary/30" />
                      <p className="flex-1 text-muted-foreground italic">"{item.text}"</p>
                      <div className="flex items-center gap-3 border-t border-border pt-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.role}</p>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {show.faq && (
        <section className="border-t border-border bg-secondary/30 py-20">
          <div className="container max-w-3xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold">{txt("faq.title", t.faq.title)}</h2>
            </motion.div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {show.cta && (
        <section className="py-20">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col items-center gap-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center md:p-16">
              <h2 className="max-w-xl font-heading text-3xl font-bold md:text-4xl">
                {txt("cta.title", t.cta.title)}
              </h2>
              <p className="max-w-md text-muted-foreground">{txt("cta.subtitle", t.cta.subtitle)}</p>
              <Button size="lg" asChild className="gap-2">
                <Link to="/register">
                  {txt("cta.button", t.cta.button)} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Landing;
