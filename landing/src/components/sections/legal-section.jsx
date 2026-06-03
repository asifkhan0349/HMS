import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { ExternalLink } from "lucide-react"

const legalPolicies = [
  {
    title: "Privacy Policy",
    id: "privacy",
    summary: "Your privacy is paramount. We only collect the minimum data necessary to provide our services and never sell your personal or clinical information to third parties.",
    bullets: [
      "End-to-end encryption for all health records",
      "No data sharing with third-party pharmaceutical companies",
      "Individual right to be forgotten (where regulatory possible)",
      "Strict data sovereignty compliance with regional controls",
    ]
  },
  {
    title: "Terms of Service",
    id: "terms",
    summary: "By using GoMeds AI, you agree to follow our professional standards of care and data management. Our terms protect both the clinical provider and the patient.",
    bullets: [
      "High-availability production architecture SLA",
      "Professional medical ethics compliance required",
      "Clear data export and portability rights",
      "Fair usage policies for enterprise cloud deployments",
    ]
  }
]

export function LegalSection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container text-left">
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              LEGAL
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Transparent by{" "}
              <span className="text-gradient-premium">design.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed">
              We believe in simple, human-readable legal documents. Our platform is built on trust, starting with clear terms and protected privacy.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {legalPolicies.map((policy, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div
                id={policy.id}
                tabIndex={0}
                className="premium-card p-8 bg-card h-full flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={policy.title}
              >
                <h3 className="text-xl font-bold mb-4 tracking-tight text-text-secondary">{policy.title}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed mb-6">
                  {policy.summary}
                </p>
                <ul className="space-y-3 mb-8 flex-grow p-0 list-none">
                  {policy.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 bg-transparent border-none p-0 cursor-pointer pt-6 border-t border-border/10 group focus-visible:outline-none focus-visible:underline">
                  Read full document
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
