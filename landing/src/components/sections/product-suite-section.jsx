import {
  BarChart3,
  Building2,
  ClipboardList,
  FlaskConical,
  Pill,
  ShoppingBag,
  Stethoscope,
  Truck,
  ArrowRight,
  Cpu,
  Boxes,
} from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const products = [
  {
    title: "AI Medication Hub",
    status: "Core",
    icon: Cpu,
    desc: "AI prescription audits, real-time drug interaction checks, and patient medication schedules.",
  },
  {
    title: "Clinical Copilot",
    status: "Live",
    icon: Building2,
    desc: "Clinical workflow assistant, smart diagnostics checking, and automated consultation summaries.",
  },
  {
    title: "Pharmacy ERP",
    status: "Live",
    icon: Pill,
    desc: "Automated inventory management, intelligent purchase alerts, batch tracking, and GxP logs.",
  },
  {
    title: "Diagnostics AI",
    status: "Live",
    icon: FlaskConical,
    desc: "Integrated lab orders, specimen tracking, critical value alerts, and AI-assisted pathology logs.",
  },
  {
    title: "Practitioner Portal",
    status: "Live",
    icon: Stethoscope,
    desc: "Mobile clinical interface for doctors, calendar scheduling, EMR access, and direct pharmacy notifications.",
  },
  {
    title: "Analytics Engine",
    status: "Live",
    icon: BarChart3,
    desc: "Explainable AI insights on clinical operations, supply risk indicators, and financial collection flows.",
  },
  {
    title: "Wholesale Logistics",
    status: "Planned",
    icon: Truck,
    desc: "Supplier purchasing pipelines, automated replenishment orders, route plans, and receivables.",
  },
  {
    title: "Asset Tracker",
    status: "Planned",
    icon: ClipboardList,
    desc: "Clinical asset registry, warranty alerts, preventive maintenance planning, and IoT device telemetry.",
  },
  {
    title: "Supply Chain ERP",
    status: "Planned",
    icon: Boxes,
    desc: "Vendor catalog synchronizer, procurement pipelines, committed stock, and billing ledger.",
  },
  {
    title: "B2C Dispensing",
    status: "Planned",
    icon: ShoppingBag,
    desc: "Patient app interface, prescription validation queue, shipping status, and dose notifications.",
  },
]

const statusStyles = {
  "Core": "bg-primary/20 text-primary border-primary/30",
  "Live": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Planned": "bg-white/5 text-text-tertiary border-white/10",
}

export function ProductSuiteSection({ appUrl }) {
  return (
    <section id="products" className="py-24 md:py-32 relative overflow-hidden bg-surface-muted/50 border-t border-border/10">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <ScrollReveal>
              <div className="mono-label mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
                PRODUCT SUITE
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
                Ten integrated workspaces.{" "}
                <span className="text-gradient-premium">One platform.</span>
              </h2>
              <p className="text-base text-text-tertiary leading-relaxed">
                Every workspace your clinical team needs — from clinical intelligence to logistics and pharmacy analytics — accessible from a single, unified interface.
              </p>
            </ScrollReveal>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {products.map((product, index) => (
            <ScrollReveal key={product.title} delay={index * 0.04}>
              <div
                tabIndex={0}
                role="button"
                className="premium-card group h-full min-h-[260px] flex flex-col p-6 bg-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Explore workspace: ${product.title}`}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xs bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <product.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider rounded-lg border px-2 py-0.5 ${statusStyles[product.status] || statusStyles.Planned}`}>
                    {product.status}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-2 tracking-tight text-text-secondary">{product.title}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed flex-grow">
                  {product.desc}
                </p>
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore workspace <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
