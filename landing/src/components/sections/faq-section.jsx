import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "../ui/accordion"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const faqItems = [
  {
    question: "Is Hospital Management System HIPAA compliant?",
    answer: "Yes, our platform is fully HIPAA compliant. We maintain BAAs with our cloud providers and offer full audit logs for all data access events within the system."
  },
  {
    question: "What security measures do you take to protect patient data?",
    answer: "We take patient and staff data privacy seriously. Our systems use 256-bit AES encryption at rest and TLS 1.3 in transit. We follow SOC 2 Type II best practices for data handling."
  },
  {
    question: "Can HMS integrate with existing lab machines?",
    answer: "Absolutely. HMS is built to integrate with a wide range of diagnostic equipment, reducing manual data entry and minimizing reporting errors."
  },
  {
    question: "What are the terms of service for hospitals?",
    answer: "By using HMS, hospitals agree to our operational guidelines ensuring data integrity and user accountability across all clinical and administrative modules."
  },
  {
    question: "Do you offer on-premise deployment?",
    answer: "Yes, while our cloud-native version is most popular, we offer on-premise installations for larger facilities with specific regulatory or infrastructure requirements."
  }
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-6 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Common Questions
            </h2>
            <p className="text-lg text-muted-foreground opacity-80">
              Everything you need to know about security, compliance, and integration.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.2}>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  )
}
