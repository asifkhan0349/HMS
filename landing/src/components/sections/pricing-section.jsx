import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollReveal } from '../ui/effects/scroll-reveal';

const plans = [
  {
    name: "Clinic",
    price: "1,999",
    description: "Perfect for single-doctor clinics and small practices.",
    features: [
      "Patient Registration",
      "OPD Management",
      "Digital Prescriptions",
      "Basic Billing",
      "Email Support",
      { name: "Inventory Management", included: false },
      { name: "IPD / Ward Management", included: false },
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Hospital",
    price: "7,999",
    description: "Advanced features for medium to large hospitals.",
    features: [
      "Everything in Clinic",
      "IPD & Ward Control",
      "Pharmacy & Inventory",
      "Lab Integration",
      "Insurance Claims",
      "Priority Support",
      "ABDM Certification",
    ],
    cta: "Book a Demo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for medical chains and networks.",
    features: [
      "Multiple Locations",
      "Centralized Dashboard",
      "Data Migration",
      "Dedicated AM",
      "Custom SLA",
      "On-Premise Option",
      "White-labeling",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection({ onAuthRedirect }) {
  return (
    <section id="pricing" className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
              Simple, <span className="text-black/40">transparent pricing.</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              Choose the plan that fits your facility. No hidden fees, cancel anytime.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div 
                className={`flex flex-col h-full p-10 rounded-[2.5rem] border-2 transition-all duration-300 ${
                  plan.highlighted 
                  ? "bg-black text-white border-black shadow-2xl scale-105" 
                  : "bg-white text-black border-black/5 hover:border-black/10"
                }`}
              >
                <div className="mb-10">
                  <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight">
                      {plan.price !== "Custom" && "₹"}
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground font-bold">/mo</span>}
                  </div>
                  <p className={`mt-6 font-medium ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-10 flex-grow p-0 list-none">
                  {plan.features.map((feature, fIndex) => {
                    const isIncluded = typeof feature === 'string' || feature.included !== false;
                    const name = typeof feature === 'string' ? feature : feature.name;
                    
                    return (
                      <li key={fIndex} className={`flex items-start gap-3 text-sm font-bold ${!isIncluded && "opacity-40"}`}>
                        {isIncluded ? (
                          <Check className={`h-5 w-5 ${plan.highlighted ? "text-primary" : "text-primary"}`} />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                        <span>{name}</span>
                      </li>
                    )
                  })}
                </ul>

                <Button 
                  className={`pill-button h-14 text-lg w-full ${
                    plan.highlighted 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "bg-black text-white hover:bg-black/90"
                  }`}
                  onClick={() => onAuthRedirect('signup')}
                >
                  {plan.cta}
                </Button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
