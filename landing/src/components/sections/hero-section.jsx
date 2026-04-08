import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { SpotlightCard } from "../ui/spotlight-card"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export function HeroSection({ onAuthRedirect }) {
  return (
    <section id="home" className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_500px] items-center">
          <ScrollReveal>
            <motion.div
              className="flex flex-col justify-center space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="space-y-6" variants={itemVariants}>
                <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  v2.0 Now Live
                </div>
                
                <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none">
                  <span className="gradient-text">Hospital Management</span>
                  <br />
                  <span className="text-foreground">Redefined for 2026</span>
                </h1>
                
                <p className="max-w-[600px] text-muted-foreground md:text-xl opacity-80 leading-relaxed">
                  A comprehensive, unified platform designed for modern hospitals, clinics, and labs. 
                  Unify your workflows in one secure, beautiful workspace.
                </p>
              </motion.div>

              <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center" variants={itemVariants}>
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground h-12 px-8 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all"
                  onClick={() => onAuthRedirect('signup')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-12 px-8 rounded-full border-border hover:bg-muted font-medium"
                  onClick={() => {
                    document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Explore Modules
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4 flex flex-wrap gap-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  ABDM / NDHM Ready
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Cloud & On-Premise
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  256-bit AES Encryption
                </div>
              </motion.div>
            </motion.div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
              <SpotlightCard className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-xl border-border/50 p-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="h-2 w-24 bg-red-500/20 rounded-full" />
                  <div className="h-2 w-32 bg-muted rounded-full" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="aspect-video rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                      <div className="text-xs font-medium text-red-500/50 uppercase tracking-wider">Patient Care</div>
                    </div>
                    <div className="aspect-video rounded-xl bg-muted/20 border border-border flex items-center justify-center">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventory</div>
                    </div>
                    <div className="col-span-2 h-32 rounded-xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 flex flex-col items-center justify-center p-4">
                      <div className="text-2xl font-bold gradient-text">99.9%</div>
                      <div className="text-xs text-muted-foreground">System Uptime</div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
