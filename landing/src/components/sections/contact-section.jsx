import React from 'react';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
      <p className="text-muted-foreground mb-8">Have questions? We're here to help.</p>
      <div className="flex justify-center gap-4">
        <a href="mailto:support@hms.com" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
          Email Support
        </a>
        <a href="tel:+1234567890" className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors">
          Call Sales
        </a>
      </div>
    </section>
  );
};
