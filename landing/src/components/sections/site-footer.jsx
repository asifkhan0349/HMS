import { Pill } from "lucide-react"

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Products", href: "#products" },
    { name: "Solutions", href: "#solutions" },
    { name: "Pricing", href: "#pricing" },
    { name: "ROI Guide", href: "#roi-guide" },
  ],
  Company: [
    { name: "About", href: "#about" },
    { name: "Careers", href: "#careers" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ],
  Legal: [
    { name: "Privacy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
    { name: "Compliance", href: "#compliance" },
    { name: "Security", href: "#security" },
  ],
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface-muted border-t border-border/10 text-text-secondary pt-20 pb-10">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 mb-16">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-premium text-white">
                <Pill className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-text-secondary">GoMeds AI</span>
            </div>
            <p className="text-text-tertiary text-sm leading-relaxed max-w-xs">
              A unified AI-powered healthcare logistics, smart medication planning, and clinical assistant platform for teams and decision-makers.
            </p>
            <div className="flex gap-4">
              {["TW", "LI", "GH", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-tertiary hover:text-text-secondary hover:bg-white/10 transition-all text-xs font-semibold no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`GoMeds AI on ${s}`}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-5">{title}</h4>
              <ul className="space-y-3 p-0 list-none">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-text-tertiary hover:text-text-secondary transition-colors no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-text-tertiary">
            &copy; {currentYear} GoMeds AI. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-text-tertiary">
            <a href="#" className="hover:text-text-secondary transition-colors no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Status</a>
            <a href="#" className="hover:text-text-secondary transition-colors no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Security</a>
            <a href="#" className="hover:text-text-secondary transition-colors no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Compliance</a>
            <a href="#" className="hover:text-text-secondary transition-colors no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
