import { Stethoscope, Building2, FlaskConical } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const solutions = [
  {
    icon: Building2,
    title: "Large Hospitals",
    desc: "Enterprise workflows for complex department and ward management.",
  },
  {
    icon: Stethoscope,
    title: "Small Clinics",
    desc: "Lightweight and fast setup for independent practices and clinics.",
  },
  {
    icon: FlaskConical,
    title: "Diagnostic Labs",
    desc: "Integrated sample tracking and pathology report generation.",
  }
]

export function SolutionsSection() {
  return (
    <section id="solutions" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
              Built for <span className="text-black/40">every practice.</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              Tailored modules that adapt to your facility's unique requirements, no matter the size.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {solutions.map((solution, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-black/5 flex items-center justify-center mb-8 text-black group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <solution.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black mb-4">{solution.title}</h3>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-[280px]">
                  {solution.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

