import React from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollReveal } from '../ui/effects/scroll-reveal';

const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@gomeds.com",
    href: "mailto:hello@gomeds.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Bangalore, India · Remote Global",
    href: "#",
  },
];

export const ContactSection = () => {
  return (
    <section id="contact" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              CONTACT
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Let&apos;s{" "}
              <span className="text-gradient-premium">talk.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed max-w-xl mx-auto">
              Have questions about GoMeds AI? Our team is ready to help you find the right solution for your network.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          {contactMethods.map((method, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <a
                href={method.href}
                className="premium-card p-6 bg-card flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Contact us via ${method.label} at ${method.value}`}
              >
                <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <method.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold text-text-secondary mb-1">{method.label}</div>
                <div className="text-xs text-text-tertiary">{method.value}</div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="text-center">
            <Button className="bg-text-secondary text-background hover:bg-text-secondary/85 h-11 px-6 rounded-xl text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Send us a message
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
