import { TrendingUp, Clock, DollarSign, UserCheck } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const metrics = [
  {
    icon: Clock,
    value: "45%",
    label: "Efficiency Increase",
    desc: "Average reduction in patient wait times and administrative task duration.",
    color: "text-blue-600"
  },
  {
    icon: DollarSign,
    value: "30%",
    label: "Cost Savings",
    desc: "Reduction in operational overhead through unified resource management.",
    color: "text-green-600"
  },
  {
    icon: UserCheck,
    value: "92%",
    label: "Patient Satisfaction",
    desc: "Patient reported improvement in care coordination and response speed.",
    color: "text-red-600"
  },
  {
    icon: TrendingUp,
    value: "20x",
    label: "ROI Probability",
    desc: "Projected return on investment within the first 18 months of deployment.",
    color: "text-purple-600"
  }
]

export function RoiSection() {
  return (
    <section id="roi-guide" className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="section-container">
        <div className="max-w-3xl mb-20">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
              Measure the impact. <br />
              <span className="text-black/40">Maximize the return.</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              HMS isn't just an expense—it's a strategic investment. Our platform is designed to pay for itself through tangible operational improvements.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className={`h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-10 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <div className="text-5xl font-black mb-2 text-black">{metric.value}</div>
                <div className="font-bold text-lg mb-4 text-black">{metric.label}</div>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  {metric.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-20 p-10 rounded-[2.5rem] bg-black text-white flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <h3 className="text-3xl font-black mb-4">Request a personalized ROI Guide</h3>
              <p className="text-white/60 font-medium text-lg">
                Enter your hospital's capacity and current overhead to receive a detailed breakdown of projected savings with HMS.
              </p>
            </div>
            <button className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg hover:scale-[1.02] transition-transform">
              Download PDF Guide
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
