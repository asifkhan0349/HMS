import { Pill, Truck, Boxes, ArrowRight } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const solutions = [
  {
    icon: Boxes,
    title: "Hospital Networks",
    desc: "Orchestrate multi-site pharmacy supplies, intelligent clinical drug audits, and centralized EMR drug alerts.",
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    icon: Pill,
    title: "Pharmacy Chains",
    desc: "Centralized multi-store inventories, intelligent batch expiration warnings, automated reordering, and GxP compliance logs.",
    gradient: "from-teal-600 to-indigo-500",
  },
  {
    icon: Truck,
    title: "Wholesale Distributors",
    desc: "Optimize medical logistics routes, automated wholesale order intake, cold chain telemetry logs, and buyer invoice tracking.",
    gradient: "from-emerald-500 to-teal-500",
  },
]

export function SolutionsSection() {
  return (
    <section id="solutions" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              SOLUTIONS
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Built for{" "}
              <span className="text-gradient-premium">every practice.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed">
              Tailored modules that adapt to your facility&apos;s unique requirements, regardless of size or specialty.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {solutions.map((solution, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div
                tabIndex={0}
                role="button"
                className="premium-card p-8 bg-card h-full flex flex-col items-start text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Explore solution: ${solution.title}`}
              >
                <div className={`w-12 h-12 rounded-sm bg-gradient-to-br ${solution.gradient} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <solution.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3 tracking-tight text-text-secondary">{solution.title}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed flex-grow">
                  {solution.desc}
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
