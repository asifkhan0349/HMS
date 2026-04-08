import { 
  CalendarCheck, 
  Hospital, 
  FileHeart, 
  Receipt, 
  Pill, 
  ShieldCheck 
} from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { SpotlightCard } from "../ui/spotlight-card"

const features = [
  {
    icon: CalendarCheck,
    title: "OPD Management",
    desc: "Streamline appointments, manage queues efficiently, and empower doctors with intuitive dashboards."
  },
  {
    icon: Hospital,
    title: "IPD / Ward workflows",
    desc: "Optimize bed allocation, track admissions and discharges, and enhance nursing workflows."
  },
  {
    icon: FileHeart,
    title: "Electronic Medical Records (EMR)",
    desc: "Maintain comprehensive patient histories, digital prescriptions, and integrated lab reports."
  },
  {
    icon: Receipt,
    title: "Billing & Insurance",
    desc: "Automate invoicing, streamline claims processing, and accept diverse payment options seamlessly."
  },
  {
    icon: Pill,
    title: "Pharmacy & Inventory",
    desc: "Track drug inventory, monitor expiry dates, and manage POS seamlessly across your network."
  },
  {
    icon: ShieldCheck,
    title: "Security & Compliance",
    desc: "Enterprise-grade data encryption, role-based access controls, and ABDM / NDHM readiness."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Everything you need to run your healthcare facility
            </h2>
            <p className="text-lg text-muted-foreground opacity-80">
              Modular components that work together harmoniously, giving you complete control over your operations.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <SpotlightCard className="h-full p-8 rounded-2xl border bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
