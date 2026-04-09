import { 
  CalendarCheck, 
  Hospital, 
  FileHeart, 
  Receipt, 
  Pill, 
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const features = [
  {
    icon: Activity,
    title: "Patient Care",
    desc: "Comprehensive patient histories and digital prescriptions.",
    className: "bento-item-2",
    color: "bg-red-50"
  },
  {
    icon: CalendarCheck,
    title: "OPD",
    desc: "Streamline appointments and manage queues.",
    color: "bg-gray-50"
  },
  {
    icon: Hospital,
    title: "IPD / Ward",
    desc: "Optimize bed allocation and track admissions.",
    color: "bg-gray-50"
  },
  {
    icon: Receipt,
    title: "Billing",
    desc: "Automate invoicing and streamline claims processing.",
    className: "bento-item-2",
    color: "bg-red-50 text-red-900"
  },
  {
    icon: Pill,
    title: "Pharmacy",
    desc: "Track inventory and monitor expiry dates.",
    color: "bg-gray-50"
  },
  {
    icon: ShieldCheck,
    title: "Security",
    desc: "Enterprise-grade encryption and ABDM readiness.",
    color: "bg-black text-white",
    iconColor: "text-primary"
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
                Everything you need. <br />
                <span className="text-black/40">Nothing you don't.</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                Our modular architecture allows you to scale your operations without the complexity of traditional legacy systems.
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <div>
                <div className="font-bold text-black">Fast Setup</div>
                <div className="text-sm text-muted-foreground">Go live in days, not months.</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="bento-grid">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.1} className={feature.className}>
              <div className={`h-full p-10 rounded-[2.5rem] flex flex-col justify-between transition-transform duration-500 hover:scale-[0.98] cursor-pointer ${feature.color}`}>
                <div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-10 ${feature.iconColor || 'text-black'} bg-white/10 shadow-sm border border-black/5`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                  <p className="opacity-80 font-medium leading-relaxed max-w-[280px]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

