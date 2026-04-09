import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Users, Receipt, Droplets, Monitor, Tablet, Smartphone } from 'lucide-react';
import { ScrollReveal } from '../ui/effects/scroll-reveal';

import { ScrollReveal } from '../ui/effects/scroll-reveal';

const previewRoutes = [
  {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Real-time overview of hospital operations, occupancy, and critical alerts at a glance.',
    icon: Layout,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/dashboard_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/dashboard_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/dashboard_mobile.png' }
    ]
  },
  {
    id: 'patients',
    title: 'Patient Registry',
    description: 'Unified digital records with complete clinical history, ABDM integration, and longitudinal tracking.',
    icon: Users,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/patients_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/patients_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/patients_mobile.png' }
    ]
  },
  {
    id: 'billing',
    title: 'Revenue Cycle',
    description: 'Automated invoicing, insurance claims processing, and integrated digital payments.',
    icon: Receipt,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/billing_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/billing_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/billing_mobile.png' }
    ]
  },
  {
    id: 'bloodbank',
    title: 'Emergency Blood Bank',
    description: 'Critical inventory tracking, donor management, and real-time cross-matching services.',
    icon: Droplets,
    previews: [
      { type: 'Desktop', view: 'desktop', icon: Monitor, image: '/previews/bloodbank_desktop.png' },
      { type: 'Tablet', view: 'tablet', icon: Tablet, image: '/previews/bloodbank_tablet.png' },
      { type: 'Mobile', view: 'mobile', icon: Smartphone, image: '/previews/bloodbank_mobile.png' }
    ]
  }
];

export function AppPreviewSection() {
  const renderScreenshot = (preview, routeTitle) => {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-card transition-all duration-500 group-hover:shadow-primary/10 group-hover:border-primary/20">
        <img 
          src={preview.image} 
          alt={`${routeTitle} ${preview.type} View`} 
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]" 
        />
        {/* Subtle inner shadow/gloss */}
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
      </div>
    );
  };

  return (
    <section id="previews" className="py-24 bg-muted/10 relative overflow-hidden">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Experience the Interface
            </h2>
            <p className="text-lg text-muted-foreground opacity-80">
              A consistent, high-performance experience across every device your team uses.
            </p>
          </ScrollReveal>
        </div>

        <div className="space-y-32">
          {previewRoutes.map((route, routeIdx) => (
            <div key={route.id} className="relative">
              <ScrollReveal>
                <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border/50">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <route.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{route.title}</h3>
                    <p className="text-muted-foreground">{route.description}</p>
                  </div>
                </div>
              </ScrollReveal>

              <div className="grid gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-end">
                {route.previews.map((preview, idx) => (
                  <ScrollReveal key={preview.type} delay={idx * 0.1}>
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="group relative flex flex-col"
                    >
                      {/* Label and Icon */}
                      <div className="flex items-center justify-between mb-6 px-2">
                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 group-hover:text-primary transition-colors">
                          {preview.type}
                        </span>
                        <preview.icon className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>

                      {/* Screenshot Container */}
                      <div className="relative">
                        {renderScreenshot(preview, route.title)}
                      </div>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-red-400/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
