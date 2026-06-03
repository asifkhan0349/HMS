import { Award, Users, Heart, Sparkles, ArrowUpRight } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const values = [
  {
    icon: Award,
    title: "Excellence",
    desc: "We set the highest standard for healthcare software globally."
  },
  {
    icon: Users,
    title: "Human-Centric",
    desc: "Technology designed to serve providers and patients alike."
  },
  {
    icon: Heart,
    title: "Integrity",
    desc: "Transparent, secure, and always putting data ethics first."
  }
]

const jobs = [
  { title: "Senior Product Designer", type: "Full-time", location: "Remote" },
  { title: "Backend Engineer (Go/Python)", type: "Full-time", location: "Bangalore / Remote" },
  { title: "Customer Success Manager", type: "Full-time", location: "Mumbai" }
]

export function AboutCareersSection() {
  return (
    <section id="about" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              OUR STORY
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Built by clinicians.{" "}
              <span className="text-gradient-premium">Optimized by engineers.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed mb-8 max-w-xl text-left">
              GoMeds AI was born from a simple mission: legacy clinical software was slowing down pharmaceutical operations and diagnostics workflows. We spent years building a unified operating system that brings AI-driven healthcare intelligence and logistics into the modern era.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {values.map((value, i) => (
                <div key={i} className="text-left">
                  <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-4">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-sm text-text-secondary mb-1">{value.title}</div>
                  <p className="text-xs text-text-tertiary leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden group premium-card border border-border/10">
              <img
                src="/previews/dashboard_desktop.png"
                alt="GoMeds AI Command Center UI Dashboard"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-xl bg-card/60 backdrop-blur-md border border-white/10">
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <div className="text-base font-bold text-text-secondary mb-1">&ldquo;Empowering those who heal.&rdquo;</div>
                <div className="text-xs text-text-tertiary">— Our Mission</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div id="careers" className="relative p-10 md:p-14 rounded-xl bg-surface-muted/50 border border-border/10 overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -mr-36 -mt-36" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-text-secondary">Join the mission.</h3>
              <p className="text-sm text-text-tertiary leading-relaxed mb-6">
                We&apos;re looking for designers, engineers, and healthcare specialists to help redefine the global standard of care.
              </p>
              <Button variant="outline" className="rounded-xl border-border/20 text-text-secondary hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                View all openings <ArrowUpRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
            <div className="lg:col-span-2 space-y-3">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  tabIndex={0}
                  role="button"
                  className="p-6 rounded-xl bg-card border border-border/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/20 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Job opening: ${job.title}, ${job.type}, ${job.location}`}
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-secondary mb-1 group-hover:text-primary transition-colors">{job.title}</div>
                    <div className="flex gap-3 text-xs text-text-tertiary">
                      <span>{job.type}</span>
                      <span>·</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
