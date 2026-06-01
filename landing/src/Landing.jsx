import React, { Suspense, lazy } from 'react';
import { MouseGlow } from './components/ui/effects/mouse-glow';
import { SiteHeader } from './components/sections/site-header';
import { HeroSection } from './components/sections/hero-section';
import { FeaturesSection } from './components/sections/features-section';
import { SolutionsSection } from './components/sections/solutions-section';
import { SiteFooter } from './components/sections/site-footer';

const TestimonialsSection = lazy(() => import('./components/sections/testimonials-section').then((m) => ({ default: m.TestimonialsSection })));
const FaqSection = lazy(() => import('./components/sections/faq-section').then((m) => ({ default: m.FaqSection })));
const ContactSection = lazy(() => import('./components/sections/contact-section').then((m) => ({ default: m.ContactSection })));
const PricingSection = lazy(() => import('./components/sections/pricing-section').then((m) => ({ default: m.PricingSection })));
const AppPreviewSection = lazy(() => import('./components/sections/app-preview-section').then((m) => ({ default: m.AppPreviewSection })));
const RoiSection = lazy(() => import('./components/sections/roi-section').then((m) => ({ default: m.RoiSection })));
const AboutCareersSection = lazy(() => import('./components/sections/about-careers-section').then((m) => ({ default: m.AboutCareersSection })));
const BlogSection = lazy(() => import('./components/sections/blog-section').then((m) => ({ default: m.BlogSection })));
const TrustComplianceSection = lazy(() => import('./components/sections/trust-compliance-section').then((m) => ({ default: m.TrustComplianceSection })));
const LegalSection = lazy(() => import('./components/sections/legal-section').then((m) => ({ default: m.LegalSection })));

// Styles
import './Landing.css';

const Landing = () => {
  // Use VITE_APP_URL environment variable to redirect to main app.
  // In development, the Main Application runs on port 5173.
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
        <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Loading sections...</div>}>
          <AppPreviewSection />
          <SolutionsSection />
          <PricingSection onAuthRedirect={handleAuthRedirect} />
          <RoiSection />
          <TestimonialsSection />
          <AboutCareersSection />
          <BlogSection />
          <FaqSection />
          <TrustComplianceSection />
          <LegalSection />
          <ContactSection />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Landing;
