import React from 'react';
import { MouseGlow } from './components/ui/effects/mouse-glow';
import { SiteHeader } from './components/sections/site-header';
import { HeroSection } from './components/sections/hero-section';
import { FeaturesSection } from './components/sections/features-section';
import { SolutionsSection } from './components/sections/solutions-section';
import { TestimonialsSection } from './components/sections/testimonials-section';
import { FaqSection } from './components/sections/faq-section';
import { ContactSection } from './components/sections/contact-section';
import { PricingSection } from './components/sections/pricing-section';
import { AppPreviewSection } from './components/sections/app-preview-section';
import { SiteFooter } from './components/sections/site-footer';

// Styles
import './Landing.css';

const Landing = () => {
  // Use VITE_APP_URL environment variable to redirect to main app.
  const defaultAppUrl = import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin;
  const appUrl = import.meta.env.VITE_APP_URL || defaultAppUrl;

  const handleAuthRedirect = (mode) => {
    // Redirect to the main app's login/signup page
    window.location.href = `${appUrl}/login?mode=${mode}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
      {/* Enhanced global cursor effect */}
      <MouseGlow
        color="rgba(220, 38, 38, 0.12)"
        size={600}
        blur={150}
        opacity={0.6}
        followSpeed={0.05}
        pulseEffect={true}
        pulseSpeed={4}
        pulseScale={1.05}
      />

      <SiteHeader onAuthRedirect={handleAuthRedirect} />

      <main className="flex flex-col items-center relative">
        <HeroSection onAuthRedirect={handleAuthRedirect} />
        <FeaturesSection />
        <AppPreviewSection />
        <SolutionsSection />
        <PricingSection onAuthRedirect={handleAuthRedirect} />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Landing;
