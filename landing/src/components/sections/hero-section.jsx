import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
}

export function HeroSection({ onAuthRedirect }) {
  return (
    <section id="home" className="relative w-full pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden bg-white">
      {/* Subtle Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <motion.div
            className="flex flex-col space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold bg-black text-white">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                Built for multi-site healthcare teams
              </div>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] text-black">
                Unified <span className="gradient-text">Hospital</span> <br />
                Operations.
              </h1>
              
              <p className="max-w-[540px] text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                The modern operating system for healthcare providers. 
                Manage patients, billing, and pharmacy in one seamless, high-performance workspace.
              </p>
            </motion.div>

            <motion.div className="flex flex-col gap-4 sm:flex-row" variants={itemVariants}>
              <Button 
                size="lg" 
                className="pill-button bg-primary text-white hover:bg-primary/90 text-lg h-14"
                onClick={() => onAuthRedirect('signup')}
              >
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="pill-button text-lg h-14 border-2 border-black/10 hover:bg-black/5 font-bold"
                onClick={() => {
                  document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Watch Demo
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4 flex flex-wrap gap-8">
              {["ABDM-ready workflows", "Security-first architecture", "Operational support model"].map((text) => (
                <div key={text} className="flex items-center text-sm font-bold text-black/60">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <ScrollReveal delay={0.4} className="relative">
            <div className="relative z-20 group">
              {/* Device Frame Simulation */}
              <div className="relative overflow-hidden rounded-[2rem] border-[8px] border-black shadow-[0_40px_100px_rgba(0,0,0,0.2)] bg-card aspect-[16/10]">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
                  <div className="w-full h-full p-8 space-y-6">
                    {/* Skeleton UI for Dashboard */}
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="h-4 w-32 bg-gray-200 rounded-full" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100" />
                        <div className="h-8 w-8 rounded-full bg-gray-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="h-32 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col p-4 justify-between">
                        <div className="h-2 w-12 bg-primary/20 rounded-full" />
                        <div className="h-6 w-16 bg-primary/40 rounded-full" />
                      </div>
                      <div className="h-32 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col p-4 justify-between">
                        <div className="h-2 w-12 bg-gray-200 rounded-full" />
                        <div className="h-6 w-16 bg-gray-300 rounded-full" />
                      </div>
                      <div className="h-32 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col p-4 justify-between">
                        <div className="h-2 w-12 bg-gray-200 rounded-full" />
                        <div className="h-6 w-16 bg-gray-300 rounded-full" />
                      </div>
                    </div>
                    <div className="h-40 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                      <div className="space-y-3">
                        <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
                        <div className="h-3 w-full bg-gray-50 rounded-full" />
                        <div className="h-3 w-4/5 bg-gray-50 rounded-full" />
                        <div className="h-3 w-3/4 bg-gray-50 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                className="absolute -bottom-6 -right-6 bg-white border-2 border-black rounded-2xl p-6 shadow-2xl z-30"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="text-3xl font-black text-black">24/7</div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Operational Visibility</div>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -inset-4 bg-primary/20 rounded-[2.5rem] blur-2xl group-hover:bg-primary/30 transition-colors" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
