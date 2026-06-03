import { ShieldCheck, Lock, Binary, Server, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const securityFeatures = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    desc: "Your data is encrypted at rest and in transit with industry-leading protocols."
  },
  {
    icon: Binary,
    title: "Audit-ready Controls",
    desc: "Comprehensive audit logging and access controls designed to support GxP compliance reviews."
  },
  {
    icon: Server,
    title: "Data Sovereignty",
    desc: "Choice of regional data residency to comply with local privacy regulations and requirements."
  }
]

const certifications = [
  "HIPAA-aligned Architecture",
  "GxP Validation Preparedness",
  "ISO 27001-ready Controls",
  "RBAC & Fine-grained Permissions",
  "Regular Security Audits",
  "Secure Data Backup Architecture",
]

export function TrustComplianceSection() {
  return (
    <section id="security" className="py-24 md:py-32 relative overflow-hidden bg-surface-muted/30 border-t border-border/10">
      <div className="mesh-gradient absolute inset-0 opacity-20" />

      <div className="section-container relative z-10 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              TRUST & COMPLIANCE
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Enterprise-grade{" "}
              <span className="text-gradient-premium">security.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed mb-10">
              Clinical drug inventory and patient prescription data demand rigorous controls, clear access boundaries, and evidence-backed operations. GoMeds AI is architected around secure workflows, role-based access, and compliance-ready implementation practices.
            </p>
            <div className="space-y-6">
              {securityFeatures.map((feature, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text-secondary mb-1">{feature.title}</div>
                    <p className="text-xs text-text-tertiary leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="p-8 md:p-10 rounded-xl bg-card border border-border/10 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold tracking-tight text-text-secondary">Compliance Roadmap</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-sm text-text-secondary/80">{cert}</span>
                  </div>
                ))}
              </div>
              <hr className="my-8 border-border/10" />
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                    <span className="font-bold text-xs text-text-secondary">Production readiness active</span>
                  </div>
                </div>
                <Button className="bg-text-secondary text-background hover:bg-text-secondary/90 rounded-xl px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  Request Security Brief
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
