import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { ExternalLink } from "lucide-react"

const legalPolicies = [
  {
    title: "Privacy Policy",
    id: "privacy",
    summary: "Your privacy is paramount. We only collect the minimum data necessary to provide our services and never sell your personal or clinical information to third parties.",
    bullets: [
      "End-to-End Encryption for all Health Records",
      "No data sharing with 3rd party pharmaceutical companies",
      "Individual Right to be Forgotten (where regulatory possible)",
      "Strict data sovereignty compliance"
    ]
  },
  {
    title: "Terms of Service",
    id: "terms",
    summary: "By using HMS, you agree to follow our professional standards of care and data management. Our terms are designed to protect both the hospital and the patient.",
    bullets: [
      "High-availability production architecture plan",
      "Professional medical ethics compliance required",
      "Clear data export and portability rights",
      "Fair usage policies for enterprise cloud"
    ]
  }
]

export function LegalSection() {
  return (
    <section className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="section-container">
        <div className="max-w-3xl mb-20 text-center mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-black">
              Legal Transparency
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              We believe in simple, human-readable legal documents. Our platform is built on trust, and that starts with clear terms and protected privacy.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {legalPolicies.map((policy, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div id={policy.id} className="h-full flex flex-col justify-between p-12 rounded-[3rem] bg-white border border-gray-200">
                <div>
                  <h3 className="text-3xl font-black mb-8 text-black">{policy.title}</h3>
                  <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-8">
                    {policy.summary}
                  </p>
                  <ul className="space-y-4 mb-10">
                    {policy.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-black font-bold">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="flex items-center gap-2 font-black text-black hover:text-primary transition-colors text-sm uppercase tracking-widest pt-8 border-t border-gray-100">
                  Read Full Document <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
