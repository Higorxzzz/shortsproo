import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, Upload, Download, Play, ArrowRight } from "lucide-react";

const Landing = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Zap, title: t.features.step1Title, desc: t.features.step1Desc },
    { icon: Upload, title: t.features.step2Title, desc: t.features.step2Desc },
    { icon: Download, title: t.features.step3Title, desc: t.features.step3Desc },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container relative flex flex-col items-center gap-8 py-24 text-center md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Play className="h-3.5 w-3.5" />
              YouTube Shorts Production
            </div>
            <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              {t.hero.title}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t.hero.subtitle}
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link to="/register">{t.hero.cta} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/plans">{t.hero.ctaSecondary}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-heading text-3xl font-bold">{t.features.title}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm"
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
    </div>
  );
};

export default Landing;
