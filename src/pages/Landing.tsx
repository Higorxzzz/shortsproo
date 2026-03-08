import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Zap,
  Upload,
  Download,
  Play,
  ArrowRight,
  Scissors,
  CalendarCheck,
  LayoutDashboard,
  Headphones,
  Star,
  Users,
  Eye,
  ThumbsUp,
  Quote,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Landing = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Zap, title: t.features.step1Title, desc: t.features.step1Desc },
    { icon: Upload, title: t.features.step2Title, desc: t.features.step2Desc },
    { icon: Download, title: t.features.step3Title, desc: t.features.step3Desc },
  ];

  const services = [
    { icon: Scissors, title: t.services.item1Title, desc: t.services.item1Desc },
    { icon: CalendarCheck, title: t.services.item2Title, desc: t.services.item2Desc },
    { icon: LayoutDashboard, title: t.services.item3Title, desc: t.services.item3Desc },
    { icon: Headphones, title: t.services.item4Title, desc: t.services.item4Desc },
  ];

  const testimonials = [
    { name: t.testimonials.t1Name, role: t.testimonials.t1Role, text: t.testimonials.t1Text },
    { name: t.testimonials.t2Name, role: t.testimonials.t2Role, text: t.testimonials.t2Text },
    { name: t.testimonials.t3Name, role: t.testimonials.t3Role, text: t.testimonials.t3Text },
  ];

  const stats = [
    { value: "500+", label: t.stats.creators, icon: Users },
    { value: "45K+", label: t.stats.delivered, icon: Play },
    { value: "120M+", label: t.stats.views, icon: Eye },
    { value: "98%", label: t.stats.satisfaction, icon: ThumbsUp },
  ];

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="container relative flex flex-col items-center gap-8 py-24 text-center md:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col items-center gap-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Play className="h-3.5 w-3.5" />
              {t.hero.badge}
            </div>
            <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              {t.hero.title}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t.hero.subtitle}
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link to="/register">
                  {t.hero.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/plans">{t.hero.ctaSecondary}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex flex-col items-center gap-2 text-center"
              >
                <stat.icon className="h-6 w-6 text-primary" />
                <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold">{t.features.title}</h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="relative flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm"
              >
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

      {/* Services */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold">{t.services.title}</h2>
            <p className="mt-2 text-muted-foreground">{t.services.subtitle}</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((svc, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
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

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold">{t.testimonials.title}</h2>
            <p className="mt-2 text-muted-foreground">{t.testimonials.subtitle}</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
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

      {/* FAQ */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold">{t.faq.title}</h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col items-center gap-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center md:p-16"
          >
            <h2 className="max-w-xl font-heading text-3xl font-bold md:text-4xl">
              {t.cta.title}
            </h2>
            <p className="max-w-md text-muted-foreground">{t.cta.subtitle}</p>
            <Button size="lg" asChild className="gap-2">
              <Link to="/register">
                {t.cta.button} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
