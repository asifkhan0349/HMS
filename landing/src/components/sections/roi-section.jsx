import { TrendingUp, Clock, DollarSign, UserCheck, ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const metrics = [
  {
    icon: Clock,
    value: "45%",
    label: "Efficiency Increase",
    desc: "Average reduction in patient wait times and administrative task duration.",
  },
  {
    icon: DollarSign,
    value: "30%",
    label: "Cost Savings",
    desc: "Reduction in operational overhead through unified resource management.",
  },
  {
    icon: UserCheck,
    value: "92%",
    label: "Satisfaction Score",
    desc: "Patient-reported improvement in care coordination and response speed.",
  },
  {
    icon: TrendingUp,
    value: "20x",
    label: "ROI Multiple",
    desc: "Projected return on investment within the first 18 months of deployment.",
  },
]

export function RoiSection() {
  return (
    <section id="roi-guide" className="py-24 md:py-32 relative overflow-hidden bg-surface-muted/50 border-t border-border/10">
      <div className="section-container">
        <div className="max-w-3xl mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              ROI
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Measure the impact.{" "}
              <span className="text-gradient-premium">Maximize the return.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed max-w-2xl">
              GoMeds AI is designed as a strategic investment that pays for itself through tangible operational improvements across every department.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div
                tabIndex={0}
                className="premium-card p-8 bg-card text-center group transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Metric: ${metric.label} is ${metric.value}`}
              >
                <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                  <metric.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-secondary mb-2">{metric.value}</div>
                <div className="font-bold text-xs text-text-secondary mb-3">{metric.label}</div>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {metric.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-16 p-10 md:p-12 rounded-xl bg-text-secondary text-background flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="max-w-xl text-left">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-background">Get your personalized ROI Guide</h3>
              <p className="text-background/70 leading-relaxed text-sm">
                Enter your pharmacy network&apos;s capacity and logistics overhead to receive a detailed breakdown of projected savings with GoMeds AI.
              </p>
            </div>
            <Button className="h-11 px-6 rounded-xl bg-background text-text-secondary hover:bg-background/90 font-bold text-xs shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Download PDF Guide
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
