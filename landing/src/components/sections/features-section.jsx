import {
  CalendarCheck,
  ShieldCheck,
  Pill,
  Receipt,
  Microscope,
  Truck,
  Brain,
} from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const features = [
  {
    icon: Brain,
    title: "Clinical AI Agent",
    desc: "Unified medical assistant with complete diagnostic logic, drug interaction analysis, and longitudinal tracking.",
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    icon: CalendarCheck,
    title: "Smart Medication Planning",
    desc: "AI-powered prescription validation with dosage checking and automated clinical reminders.",
    gradient: "from-teal-600 to-indigo-500",
  },
  {
    icon: Pill,
    title: "Pharmacy Logistics Control",
    desc: "Real-time inventory tracking, batch expiry detection, and automated stock replenishment.",
    gradient: "from-emerald-500 to-teal-500",
    className: "bento-item-2",
  },
  {
    icon: Truck,
    title: "Autonomous Dispatching",
    desc: "Route optimization, delivery tracking, and courier allocation for patient medical shipments.",
    gradient: "from-amber-500 to-orange-500",
    className: "bento-item-2",
  },
  {
    icon: Microscope,
    title: "Lab Order Integration",
    desc: "Diagnostics processing, specimen tracking, critical value alerts, and integrated pathology logs.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Receipt,
    title: "Smart Financial Cleared",
    desc: "Automated medical billing, pharmacy claims checking, and integrated insurance protocols.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Security",
    desc: "Role-based access controls, GxP-ready audit logging, HIPAA compliance, and secure data storage.",
    gradient: "from-slate-600 to-slate-800",
    dark: true,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="max-w-3xl mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              CLINICAL AI & PHARMACY OPERATING SYSTEM
            </div>
            <h2 className="text-4xl font-bold mb-4 text-text-secondary leading-tight tracking-tight">
              Everything your clinical team needs,{" "}
              <span className="text-gradient-premium">nothing you don&apos;t.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed max-w-2xl">
              Our modular architecture lets you scale operations without the complexity of legacy systems. Each module works independently or together as a unified platform.
            </p>
          </ScrollReveal>
        </div>

        <div className="bento-grid">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.08} className={feature.className}>
              <div
                tabIndex={0}
                className={`h-full min-h-[280px] p-8 rounded-sm flex flex-col justify-between transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  feature.dark
                    ? "bg-text-secondary text-background border border-text-secondary"
                    : "premium-card bg-card"
                }`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xs flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 ${
                    feature.dark
                      ? "bg-background/10 text-background"
                      : "bg-gradient-to-br " + feature.gradient + " text-white shadow-sm"
                  }`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{feature.title}</h3>
                  <p className={`text-sm leading-relaxed max-w-sm ${
                    feature.dark ? "text-background/65" : "text-text-tertiary"
                  }`}>
                    {feature.desc}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-1.5 text-sm font-medium">
                  <span className={feature.dark ? "text-background/50" : "text-primary"}>Learn more</span>
                  <svg className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                    feature.dark ? "text-background/50" : "text-primary"
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
