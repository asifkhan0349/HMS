import { Check, CheckCircle2, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { SpotlightCard } from "../ui/spotlight-card"

const plans = [
  {
    name: "Starter",
    description: "Perfect for independent clinics and small medical practices.",
    price: "₹3,999",
    features: [
      "Up to 2 Doctors",
      "Digital Prescriptions",
      "OPD Management",
      "Essential Billing",
      "Email Support"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    description: "Comprehensive solution for multi-specialty hospitals.",
    price: "₹15,999",
    features: [
      "Unlimited Staff & Doctors",
      "Full IPD / Ward Workflows",
      "Pharmacy & Inventory",
      "Lab Information System",
      "Advanced Analytics",
      "24/7 Priority Support"
    ],
    cta: "Get Started Now",
    popular: true
  },
  {
    name: "Enterprise",
    description: "Tailored infrastructure for hospital networks and chains.",
    price: "Custom",
    features: [
      "Multi-center Sync",
      "Custom ABDM Integrations",
      "On-Premise Deployment Option",
      "Dedicated Account Manager",
      "Custom Security Audit",
      "SLA Guarantees"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export function PricingSection({ onAuthRedirect }) {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground opacity-80">
              Choose the perfect plan for your healthcare facility. No hidden fees, cancel anytime.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={index * 0.1}>
              <SpotlightCard 
                className={`h-full p-8 rounded-3xl border flex flex-col transition-all duration-500 relative ${
                  plan.popular 
                    ? "bg-card/50 border-primary/50 shadow-[0_0_40px_rgba(220,38,38,0.1)] ring-1 ring-primary/20 scale-105 lg:scale-110 z-10" 
                    : "bg-card/20 border-border/50 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8 flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground ml-1">/month</span>
                  )}
                </div>

                <div className="flex-grow space-y-4 mb-10">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/90">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full h-12 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(220,38,38,0.6)]"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                  onClick={() => onAuthRedirect(plan.price === "Custom" ? 'contact' : 'signup')}
                >
                  {plan.cta}
                </Button>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-20 p-8 rounded-2xl border border-dashed border-border/60 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Enterprise Security Guaranteed</h4>
                <p className="text-sm text-muted-foreground">HIPAA & ABDM compliant data processing with 256-bit AES encryption.</p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0" onClick={() => onAuthRedirect('contact')}>
              Request Security Audit
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
