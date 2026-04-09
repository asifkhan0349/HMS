import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "../ui/accordion"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const faqItems = [
  {
    question: "Is HMS HIPAA compliant?",
    answer: "Yes, our platform is fully HIPAA compliant. We maintain BAAs with our cloud providers and offer full audit logs for all data access events."
  },
  {
    question: "How secure is patient data?",
    answer: "We use 256-bit AES encryption at rest and TLS 1.3 in transit. We follow SOC 2 Type II best practices for data handling and security."
  },
  {
    question: "Can it integrate with lab machines?",
    answer: "Absolutely. HMS is built to integrate with a wide range of diagnostic equipment via standard protocols, reducing manual data entry."
  },
  {
    question: "Do you offer on-premise deployment?",
    answer: "Yes, while our cloud-native version is most popular, we offer on-premise installations for larger facilities with specific infrastructure requirements."
  }
]

export function FaqSection() {
  return (
    <section id="faq" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container max-w-5xl">
        <div className="grid lg:grid-cols-[1fr,1.5fr] gap-16 items-start">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
              Common <br /> <span className="text-black/40">Questions.</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              Everything you need to know about security, compliance, and our seamless integration process.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-black/5 last:border-0">
                  <AccordionTrigger className="text-left text-xl font-black hover:text-primary transition-colors py-8 no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-8">
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

