import { ShieldCheck, Lock, Binary, Server, FileCheck, CheckCircle2 } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const securityFeatures = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    desc: "Your data is encrypted at rest and in transit with industry-leading protocols."
  },
  {
    icon: Binary,
    title: "SOC2 Compliance",
    desc: "Adherence to highest standards for security, availability, and processing integrity."
  },
  {
    icon: Server,
    title: "Cloud Sovereignty",
    desc: "Choice of regional data residency to comply with local privacy regulations."
  }
]

const certifications = [
  "HIPAA Compliant Infrastructure",
  "GDPR Readiness",
  "ISO 27001 Certified Data Centers",
  "ABDM (M1, M2, M3) Integrated",
  "Regular Third-party Pen Tests",
  "Role-based Access Controls (RBAC)"
]

export function TrustComplianceSection() {
  return (
    <section id="security" className="py-32 bg-black text-white relative overflow-hidden">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32 items-center">
          <ScrollReveal>
            <div className="inline-flex py-2 px-4 rounded-full bg-white/10 text-white font-bold text-sm mb-6 uppercase tracking-widest border border-white/10">
              Trust & Stability
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 leading-[0.95]">
              Hospital-grade <br />
              <span className="text-primary italic">Cybersecurity.</span>
            </h2>
            <p className="text-xl text-white/50 font-medium leading-relaxed mb-10">
              Healthcare data is the most sensitive information in the world. We don't just secure it—we bulletproof it. HMS is built on a Zero-Trust architecture ensuring HIPAA and global compliance from day one.
            </p>
            <div className="space-y-6">
              {securityFeatures.map((feature, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-1">{feature.title}</div>
                    <p className="text-white/40 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div id="hipaa" className="p-12 md:p-16 rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-10">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <h3 className="text-3xl font-black tracking-tight">Compliance Roadmap</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-bold text-sm text-white/80">{cert}</span>
                  </div>
                ))}
              </div>
              <hr className="my-12 border-white/10" />
              <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="font-bold">All Systems Operational</span>
                  </div>
                </div>
                <button className="py-4 px-8 rounded-2xl bg-white text-black font-black text-sm hover:bg-primary hover:text-white transition-all">
                  Download Security Whitepaper
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-primary/20 rounded-full blur-[180px] -mb-64 -mr-32"></div>
    </section>
  )
}
