import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollReveal } from '../ui/effects/scroll-reveal';

const plans = [
  {
    name: "Smart Clinic",
    price: "Demo",
    description: "For independent practices needing EMR, prescription audits, basic inventory, and billing workflows.",
    features: [
      "Clinical Patient Directory",
      "AI Prescription Audits",
      "Standard Invoicing & Cash Receipts",
      "Email & Slack Support",
      "Basic Stock Control Logs",
    ],
    cta: "Request Demo",
    highlighted: false,
  },
  {
    name: "Network Hospital",
    price: "Quote",
    description: "For multi-department networks that need clinical assistance, pharmacy ERP, diagnostics AI, and insurance audits.",
    popular: true,
    features: [
      "Everything in Clinic, plus:",
      "IPD Ward Allocation Logs",
      "Pharmacy ERP & Expiry Monitor",
      "Lab Integration & Pathology AI",
      "Automated Claims Auditing",
      "Priority SLA & Support",
      "GxP Regulatory Checklists",
    ],
    cta: "Book a Demo",
    highlighted: true,
  },
  {
    name: "Global Enterprise",
    price: "Custom",
    description: "For pharmacy chains, distributors, wholesale logistics suppliers, and multi-site groups.",
    features: [
      "Everything in Hospital, plus:",
      "Wholesale Supplier Pipelines",
      "Route Optimizer Telemetry Logs",
      "Dedicated Technical Account Manager",
      "Custom GxP Compliance Profiles",
      "White-labeled Patient Interface",
      "Dedicated API Infrastructure",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection({ onAuthRedirect }) {
  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              PRICING
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Pricing built around{" "}
              <span className="text-gradient-premium">facility scope.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed">
              Transparent pricing based on facility size, modules, deployment model, and support needs.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div
                className={`relative flex flex-col h-full p-8 rounded-sm border-2 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-text-secondary text-background border-text-secondary shadow-xl scale-[1.02] lg:scale-105"
                    : "bg-card text-text-secondary border-border/10 hover:border-primary/30 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-premium text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                    {plan.price === "Quote" && <span className={plan.highlighted ? "text-background/60" : "text-text-tertiary"}>-based</span>}
                  </div>
                  <p className={`text-sm leading-relaxed ${plan.highlighted ? "text-background/65" : "text-text-tertiary"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-grow p-0 list-none">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${
                        plan.highlighted ? "text-background" : "text-primary"
                      }`} />
                      <span className={plan.highlighted ? "text-background/85" : "text-text-secondary"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`h-11 text-xs font-bold rounded-xl w-full flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    plan.highlighted
                      ? "bg-background text-text-secondary hover:bg-background/90"
                      : "bg-text-secondary text-background hover:bg-text-secondary/85"
                  }`}
                  onClick={() => onAuthRedirect('signup')}
                >
                  {plan.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
