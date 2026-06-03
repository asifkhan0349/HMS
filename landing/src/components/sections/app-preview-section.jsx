import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Users, Receipt, Droplets, Monitor, Tablet, Smartphone } from 'lucide-react';
import { ScrollReveal } from '../ui/effects/scroll-reveal';

const previewRoutes = [
  {
    id: 'dashboard',
    title: 'AI Command Center',
    description: 'Real-time overview of clinical operations, patient flow, and critical alerts at a glance.',
    icon: Layout,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/dashboard_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/dashboard_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/dashboard_mobile.png' },
    ]
  },
  {
    id: 'patients',
    title: 'Clinical Assistant',
    description: 'Unified digital health records with full clinical history, medication checks, and longitudinal charts.',
    icon: Users,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/patients_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/patients_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/patients_mobile.png' },
    ]
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy Hub',
    description: 'Real-time stock tracking, drug batch alerts, pricing, and reorder controls for pharmacy teams.',
    icon: Receipt,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/pharmacy_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/pharmacy_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/pharmacy_mobile.png' },
    ]
  },
  {
    id: 'billing',
    title: 'Revenue Manager',
    description: 'Automated billing, drug cost estimation, insurance claims auditing, and payment processing.',
    icon: Receipt,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/billing_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/billing_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/billing_mobile.png' },
    ]
  },
  {
    id: 'bloodbank',
    title: 'Supply Analytics',
    description: 'Critical inventory tracing, temperature-sensitive shipment logs, and donor tracking details.',
    icon: Droplets,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/bloodbank_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/bloodbank_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/bloodbank_mobile.png' },
    ]
  }
];

export function AppPreviewSection() {
  return (
    <section id="previews" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollReveal>
            <div className="mono-label mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
              PRODUCT PREVIEWS
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight text-text-secondary">
              Experience theDescriptor{" "}
              <span className="text-gradient-premium">interface.</span>
            </h2>
            <p className="text-base text-text-tertiary leading-relaxed">
              A consistent, high-performance experience across every device your team uses.
            </p>
          </ScrollReveal>
        </div>

        <div className="space-y-16">
          {previewRoutes.map((route) => (
            <div key={route.id}>
              <ScrollReveal>
                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border/10">
                  <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    <route.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-secondary">{route.title}</h3>
                    <p className="text-sm text-text-tertiary">{route.description}</p>
                  </div>
                </div>
              </ScrollReveal>

              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {route.previews.map((preview, idx) => (
                  <ScrollReveal key={preview.type} delay={idx * 0.1}>
                    <motion.div whileHover={{ y: -4 }} className="group">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-semibold text-text-tertiary group-hover:text-text-secondary transition-colors uppercase tracking-wider">
                          {preview.type}
                        </span>
                        <preview.icon className="h-3.5 w-3.5 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                      </div>

                      <div className={`premium-card-lg overflow-hidden bg-card border border-border/10 rounded-xl transition-all duration-300 ${
                        preview.view === 'mobile' ? 'max-w-[280px] mx-auto' : ''
                      }`}>
                        <img
                          src={preview.image}
                          alt={`${route.title} ${preview.type} View`}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
