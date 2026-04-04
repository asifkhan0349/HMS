import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Login from './Login';
import './Landing.css';

const Landing = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  useEffect(() => {
    // If user is already logged in, they should not see the landing page
    if (user) {
      const target = location.state?.from?.pathname || '/dashboard';
      navigate(target, { replace: true });
    }
  }, [user, navigate, location]);

  // Read state from ProtectedRoute redirect
  useEffect(() => {
    if (location.state?.requireLogin) {
      setAuthMode('login');
      setShowLoginModal(true);
      // Clean up the state so it doesn't reopen if they close it and navigate back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: "bi-calendar-check",
      title: "OPD Management",
      desc: "Streamline appointments, manage queues efficiently, and empower doctors with intuitive dashboards."
    },
    {
      icon: "bi-hospital",
      title: "IPD / Ward workflows",
      desc: "Optimize bed allocation, track admissions and discharges, and enhance nursing workflows."
    },
    {
      icon: "bi-file-medical",
      title: "Electronic Medical Records (EMR)",
      desc: "Maintain comprehensive patient histories, digital prescriptions, and integrated lab reports."
    },
    {
      icon: "bi-receipt",
      title: "Billing & Insurance",
      desc: "Automate invoicing, streamline claims processing, and accept diverse payment options seamlessly."
    },
    {
      icon: "bi-capsule",
      title: "Pharmacy & Inventory",
      desc: "Track drug inventory, monitor expiry dates, and manage POS seamlessly across your network."
    },
    {
      icon: "bi-shield-check",
      title: "Security & Compliance",
      desc: "Enterprise-grade data encryption, role-based access controls, and ABDM / NDHM readiness."
    }
  ];

  const solutions = [
    { title: "Multi-specialty Hospitals", desc: "Comprehensive workflows for large scale operations." },
    { title: "Clinics", desc: "Lightweight and fast setup for independent practitioners." },
    { title: "Diagnostic Labs", desc: "Equipment integration and rapid report generation." }
  ];

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="landing-logo">
          Hospital Management System
        </Link>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#solutions" className="landing-nav-link">Solutions</a>
          <a href="#pricing" className="landing-nav-link">Pricing</a>
        </div>
        <div className="landing-nav-actions">
          <button onClick={() => { setAuthMode('login'); setShowLoginModal(true); }} className="btn-landing-secondary bg-transparent border-0" style={{ cursor: 'pointer' }}>Log In</button>
          <button onClick={() => { setAuthMode('signup'); setShowLoginModal(true); }} className="btn-landing-primary border-0" style={{ cursor: 'pointer' }}>Book Demo</button>
        </div>
      </nav>

      {showLoginModal && <Login isModal onClose={() => setShowLoginModal(false)} initialMode={authMode} />}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-up">
          <h1 className="hero-title">
            The next-generation <br />
            Hospital Management System
          </h1>
          <p className="hero-subtitle delay-200">
            A comprehensive, unified platform designed for hospitals, clinics, and labs. <br />
            Unify your OPD, IPD, Billing, Pharmacy, and EMR in one beautiful workspace.
          </p>
          <div className="hero-cta delay-300">
            <button onClick={() => { setAuthMode('signup'); setShowLoginModal(true); }} className="btn-landing-primary border-0" style={{ cursor: 'pointer' }}>
              Start Free Trial <i className="bi bi-arrow-right"></i>
            </button>
            <a href="#features" className="btn-landing-secondary">
              Explore Modules
            </a>
          </div>
        </div>
      </section>

      {/* Integrations Marquee */}
      <div className="integrations-marquee">
        <div className="marquee-content">
          <div className="integration-item"><i className="bi bi-credit-card"></i> Payment Gateways</div>
          <div className="integration-item"><i className="bi bi-whatsapp"></i> WhatsApp API</div>
          <div className="integration-item"><i className="bi bi-device-hdd"></i> Lab Machines</div>
          <div className="integration-item"><i className="bi bi-envelope"></i> SMS Alerts</div>
          <div className="integration-item"><i className="bi bi-building"></i> Government Systems</div>
          {/* Duplicate for infinite loop illusion */}
          <div className="integration-item"><i className="bi bi-credit-card"></i> Payment Gateways</div>
          <div className="integration-item"><i className="bi bi-whatsapp"></i> WhatsApp API</div>
          <div className="integration-item"><i className="bi bi-device-hdd"></i> Lab Machines</div>
          <div className="integration-item"><i className="bi bi-envelope"></i> SMS Alerts</div>
          <div className="integration-item"><i className="bi bi-building"></i> Government Systems</div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <div className="container">
          <h2 className="section-title">Everything you need to run your healthcare facility</h2>
          <p className="section-subtitle">Modular components that work together harmoniously, giving you complete control over your operations.</p>
          
          <div className="feature-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon-wrapper">
                  <i className={`bi ${feature.icon}`}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="section-padding" style={{ background: 'var(--accents-1)' }}>
        <div className="container">
          <h2 className="section-title">Built for every medical practice</h2>
          <p className="section-subtitle">Tailored solutions that scale with your growth.</p>
          
          <div className="row g-4 justify-content-center" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {solutions.map((solution, index) => (
              <div className="col-md-4" key={index}>
                <div className="glass-card p-4 h-100 text-center">
                  <div className="mb-4">
                    <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h4 className="fw-semibold mb-3">{solution.title}</h4>
                  <p className="text-muted mb-0">{solution.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi" className="section-padding" style={{ background: 'var(--accents-1)' }}>
        <div className="container">
          <h2 className="section-title">Calculate your ROI</h2>
          <p className="section-subtitle">See how much you can save by switching to Hospital Management System.</p>
          <div className="roi-card">
            <div className="row">
              <div className="col-md-4">
                <div className="roi-stat">
                  <div className="roi-number">35%</div>
                  <div className="roi-label">Efficiency Increase</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="roi-stat">
                  <div className="roi-number">20%</div>
                  <div className="roi-label">Revenue Growth</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="roi-stat">
                  <div className="roi-number">50%</div>
                  <div className="roi-label">Error Reduction</div>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-muted mb-4">Based on average data from 50+ partner hospitals in their first year.</p>
              <button className="btn-landing-primary">Get Your Detailed Report</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="section-padding">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="section-title text-start">Built by healthcare experts, for experts.</h2>
              <p className="lead mb-4" style={{ color: 'var(--accents-6)' }}>Hospital Management System was born out of a simple observation: doctors spend too much time on screens and not enough with patients.</p>
              <p className="text-muted mb-4">Our mission is to build the digital infrastructure that healthcare deserves—secure, lightning-fast, and obsessively designed for the clinic floor.</p>
              <div className="d-flex gap-4">
                <div>
                  <h4 className="fw-bold">2018</h4>
                  <small className="text-muted">Founded</small>
                </div>
                <div>
                  <h4 className="fw-bold">500+</h4>
                  <small className="text-muted">Hospitals</small>
                </div>
                <div>
                  <h4 className="fw-bold">1M+</h4>
                  <small className="text-muted">Patients</small>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="glass-card p-5 bg-accents-1">
                <i className="bi bi-quote fs-1 text-primary mb-4"></i>
                <p className="fs-5 italic mb-4">"Hospital Management System has completely transformed how our ward operates. It's the first system that feels like it was designed for humans, not just databases."</p>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-accents-2 rounded-circle" style={{ width: 48, height: 48 }}></div>
                  <div>
                    <h6 className="mb-0 fw-bold">Dr. Sarah Chen</h6>
                    <small className="text-muted">Chief of Staff, Metro General</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="section-padding" style={{ background: 'var(--accents-8)', color: 'var(--geist-background)' }}>
        <div className="container text-center">
          <h2 className="section-title" style={{ color: 'var(--geist-background)' }}>Join the HMS Revolution</h2>
          <p className="section-subtitle mb-5" style={{ color: 'var(--accents-3)' }}>We're looking for world-class engineers, designers, and medical professionals to join our remote-first team.</p>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-4 border border-secondary rounded-4">
                <h4 className="fw-bold mb-2" style={{ color: '#00dfd8' }}>Engineering</h4>
                <p className="small text-secondary">React, Python, & distributed systems.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 border border-secondary rounded-4">
                <h4 className="fw-bold mb-2" style={{ color: '#00dfd8' }}>Product Design</h4>
                <p className="small text-secondary">Obsessive about healthcare UI/UX.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 border border-secondary rounded-4">
                <h4 className="fw-bold mb-2" style={{ color: '#00dfd8' }}>Clinical Ops</h4>
                <p className="small text-secondary">Bridging tech and patient care.</p>
              </div>
            </div>
          </div>
          <button className="btn-landing-primary mt-5" style={{ background: '#0070f3', color: 'white', border: 'none' }}>View Open Roles</button>
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="casestudies" className="section-padding">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <p className="section-subtitle">Real results from hospitals using Hospital Management System.</p>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="glass-card p-4 h-100">
                <span className="badge bg-primary mb-3">Multi-specialty</span>
                <h4 className="fw-bold">City Hospital Transformation</h4>
                <p className="text-muted">Reduced average patient wait times by 45% within three months of deployment.</p>
                <a href="#" className="text-primary text-decoration-none fw-bold">Read Case Study <i className="bi bi-arrow-right small"></i></a>
              </div>
            </div>
            <div className="col-md-6">
              <div className="glass-card p-4 h-100">
                <span className="badge bg-success mb-3">Diagnostic Lab</span>
                <h4 className="fw-bold">Prestige Labs Automation</h4>
                <p className="text-muted">Implemented end-to-end device integration, reducing reporting errors to near zero.</p>
                <a href="#" className="text-primary text-decoration-none fw-bold">Read Case Study <i className="bi bi-arrow-right small"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding" style={{ background: 'var(--accents-1)' }}>
        <div className="container">
          <div className="contact-container">
            <h2 className="section-title">Get in touch</h2>
            <p className="section-subtitle">Ready to modernize your facility? Our sales team is here to help.</p>
            <div className="glass-card p-5">
              <form onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                <div className="form-group mb-3">
                  <label className="form-label small fw-bold">FULL NAME</label>
                  <input type="text" className="form-control" placeholder="John Doe" required />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label small fw-bold">WORK EMAIL</label>
                  <input type="email" className="form-control" placeholder="john@hospital.com" required />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label small fw-bold">MESSAGE</label>
                  <textarea className="form-control" rows="4" placeholder="Tell us about your facility..."></textarea>
                </div>
                <button type="submit" className="btn-landing-primary w-100">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Sections */}
      <section className="section-padding">
        <div className="container">
          <div id="privacy" className="legal-block">
            <h3 className="legal-title">Privacy Policy</h3>
            <p className="legal-text">We take patient and staff data privacy seriously. Our systems are designed to handle PHI (Protected Health Information) with the highest level of security and encryption at rest and in transit.</p>
          </div>
          <div id="terms" className="legal-block">
            <h3 className="legal-title">Terms of Service</h3>
            <p className="legal-text">By using Hospital Management System, hospitals agree to our operational guidelines ensuring data integrity and user accountability across all clinical and administrative modules.</p>
          </div>
          <div id="hipaa" className="legal-block">
            <h3 className="legal-title">HIPAA Compliance</h3>
            <p className="legal-text">Hospital Management System is fully HIPAA compliant. We maintain BAAs with our cloud providers and offer full audit logs for all data access events within the system.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="landing-logo">
              Hospital Management System
            </Link>
            <p>Empowering healthcare facilities with modern, reliable, and secure digital infrastructure.</p>
          </div>
          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#solutions">Solutions</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#roi">ROI Calculator</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#casestudies">Case Studies</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#hipaa">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} Hospital Management System. All rights reserved.</div>
          <div className="d-flex gap-3">
            <a href="#" className="text-muted"><i className="bi bi-twitter-x"></i></a>
            <a href="#" className="text-muted"><i className="bi bi-linkedin"></i></a>
            <a href="#" className="text-muted"><i className="bi bi-github"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
