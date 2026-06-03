import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, Zap, TrendingUp } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

export function HeroSection({ onAuthRedirect }) {
  return (
    <section id="home" className="relative w-full pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-background">
      <div className="mesh-gradient-hero absolute inset-0" />

      <div className="section-container relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            className="flex flex-col items-center space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Now Live — AI-driven clinical logistics & pharmacy platform
              </div>
            </motion.div>

            <motion.div className="space-y-6 max-w-4xl" variants={itemVariants}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-secondary">
                GoMeds AI — Smart clinical logistics,{" "}
                <span className="text-gradient-premium">reimagined.</span>
              </h1>

              <p className="mx-auto max-w-[640px] text-base text-text-tertiary leading-relaxed">
                A unified operating system for healthcare providers and teams — connecting medication planning, automated pharmacy logistics, drug safety analysis, and clinical workflows in one secure platform.
              </p>
            </motion.div>

            <motion.div className="flex flex-col gap-4 sm:flex-row w-full max-w-md mx-auto" variants={itemVariants}>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 transition-all h-12 text-sm rounded-xl px-8 shadow-md flex-1 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => onAuthRedirect('signup')}
              >
                Request a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-sm rounded-xl px-8 border-border bg-white/5 text-text-secondary hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 transition-all flex-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => {
                  document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <svg className="mr-2 h-4 w-4 fill-current text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Overview
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4">
              {[
                { icon: ShieldCheck, text: "HIPAA & GxP compliant" },
                { icon: Zap, text: "99.9% uptime logistics" },
                { icon: TrendingUp, text: "45% reduction in prescription errors" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs font-semibold text-text-tertiary">
                  <Icon className="h-4 w-4 text-primary" />
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <ScrollReveal delay={0.5} className="relative mt-16">
            <div className="relative">
              <div className="premium-card-lg overflow-hidden border border-border/20 rounded-2xl bg-card">
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-10" />
                <img
                  src="/previews/dashboard_desktop.png"
                  alt="GoMeds AI dashboard showing clinical operations, patient flow, and pharmacy logs"
                  className="w-full h-auto object-cover"
                  fetchPriority="high"
                />
              </div>

              <motion.div
                className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 premium-card p-4 md:p-5 bg-card/90 backdrop-blur-md shadow-lg hidden md:block"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-gradient-premium border-2 border-card flex items-center justify-center text-[10px] font-bold text-white">
                        {['JD', 'SK', 'MR'][i-1]}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-text-secondary">Trusted by 500+ clinics</div>
                    <div className="text-[10px] text-text-tertiary">Across 12 countries</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
