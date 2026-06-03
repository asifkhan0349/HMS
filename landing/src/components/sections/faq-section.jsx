import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const faqItems = [
  {
    question: "Is GoMeds AI compliance-ready?",
    answer: "The platform is designed with compliance-ready controls including role-based access, secure authentication, GxP validation support, and production audit logging. We support HIPAA-aligned architecture. Formal compliance validation is tailored to each deployment."
  },
  {
    question: "How secure is patient and inventory data?",
    answer: "Security is foundational to GoMeds AI. We use AES-256 encryption at rest and in transit, role-based access controls, environment-specific configuration, and follow a production hardening roadmap. Regular security audits and penetration testing are part of our release cycle."
  },
  {
    question: "Can it integrate with existing ERPs and clinical systems?",
    answer: "Yes. Our integration layer supports standard clinical device protocols (HL7, FHIR) and custom API integrations for third-party ERPs like SAP and Oracle, ensuring seamless stock and prescription data synchronization."
  },
  {
    question: "Do you offer on-premise deployment?",
    answer: "Yes. While our cloud-native version is most popular for its automatic updates and zero infrastructure overhead, we offer on-premise installations for larger facilities with specific data residency or infrastructure requirements."
  },
  {
    question: "How long does implementation take?",
    answer: "Most independent clinics and pharmacies go live within 2-4 weeks. Larger networks with custom ERP synchronization typically require 4-8 weeks including data migration, staff training, and workflow customization."
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container max-w-5xl text-left">
        <div className="grid lg:grid-cols-[1fr,1.5fr] gap-16 items-start">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              FAQ
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Common{" "}
              <span className="text-gradient-premium">questions.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed">
              Everything you need to know about security, compliance, integration, and deployment.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/10 last:border-0">
                  <AccordionTrigger className="text-left text-base font-bold text-text-secondary hover:text-primary transition-colors py-5 no-underline [&[data-state=open]]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-text-tertiary leading-relaxed pb-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
