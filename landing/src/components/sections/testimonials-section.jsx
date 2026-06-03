import { ScrollReveal } from "../ui/effects/scroll-reveal"

const testimonials = [
  {
    quote: "GoMeds AI has transformed how we verify medications and manage clinical logistics. The modular approach meant we could start with pharmacy billing, then scale to full AI-assisted prescribing audits within weeks.",
    author: "Dr. Priya Sharma",
    role: "Clinical Director, Apex Hospitals",
    initials: "PS",
  },
  {
    quote: "The AI Command Center gives us something we've never had before: real-time visibility into medication flows and inventory risks. Our operations team now makes data-driven supply decisions instantly.",
    author: "Rajesh Mehta",
    role: "Chief Pharmacy Officer, MedCare Group",
    initials: "RM",
  },
  {
    quote: "Integration with our existing clinical workflow was seamless. We connected the AI medication hubs to the national health registry in days. The GxP compliance checks are fully automated and audit-ready.",
    author: "Dr. Ananya Patel",
    role: "Chief Medical Informatics Officer",
    initials: "AP",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-surface-muted/50 border-t border-border/10">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              TESTIMONIALS
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Trusted by clinical teams{" "}
              <span className="text-gradient-premium">worldwide.</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div
                tabIndex={0}
                className="premium-card p-8 bg-card h-full flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Testimonial from ${item.author}, ${item.role}`}
              >
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="flex-grow text-left">
                  <p className="text-sm text-text-secondary/85 leading-relaxed mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-border/10">
                  <div className="w-10 h-10 rounded-xs bg-gradient-premium flex items-center justify-center text-xs font-bold text-white">
                    {item.initials}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-text-secondary">{item.author}</div>
                    <div className="text-xs text-text-tertiary">{item.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
