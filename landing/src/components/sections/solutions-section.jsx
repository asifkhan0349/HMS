import { Stethoscope, Building2, FlaskConical } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { SpotlightCard } from "../ui/spotlight-card"

const solutions = [
  {
    icon: Building2,
    title: "Multi-specialty Hospitals",
    desc: "Comprehensive workflows for large scale operations with complex department management.",
    color: "from-blue-500/10 to-blue-500/5",
    textColor: "text-blue-500"
  },
  {
    icon: Stethoscope,
    title: "Clinics",
    desc: "Lightweight and fast setup for independent practitioners and small medical centers.",
    color: "from-red-500/10 to-red-500/5",
    textColor: "text-red-500"
  },
  {
    icon: FlaskConical,
    title: "Diagnostic Labs",
    desc: "Equipment integration, sample tracking, and rapid report generation for pathology labs.",
    color: "from-purple-500/10 to-purple-500/5",
    textColor: "text-purple-500"
  }
]

export function SolutionsSection() {
  return (
    <section id="solutions" className="py-24 bg-muted/20 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Built for every medical practice
            </h2>
            <p className="text-lg text-muted-foreground opacity-80">
              Tailored solutions that scale with your growth, from individual clinics to enterprise networks.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {solutions.map((solution, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <SpotlightCard className="h-full p-10 rounded-3xl border bg-card/40 backdrop-blur-md border-border/50 hover:shadow-xl transition-all">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-8 ${solution.textColor}`}>
                  <solution.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{solution.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {solution.desc}
                </p>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
