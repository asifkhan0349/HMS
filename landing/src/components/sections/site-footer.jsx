import { Hospital, Globe, Mail, ExternalLink } from "lucide-react"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center space-x-2 no-underline text-foreground">
              <Hospital className="h-7 w-7 text-primary" />
              <span className="font-bold text-xl tracking-tight">HMS</span>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-xs">
              Empowering healthcare facilities with modern, reliable, and secure digital infrastructure.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground list-none p-0">
              <li><a href="#features" className="hover:text-primary transition-colors no-underline">Features</a></li>
              <li><a href="#solutions" className="hover:text-primary transition-colors no-underline">Solutions</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors no-underline">Pricing</a></li>
              <li><a href="#roi" className="hover:text-primary transition-colors no-underline">ROI Calculator</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground list-none p-0">
              <li><a href="#about" className="hover:text-primary transition-colors no-underline">About Us</a></li>
              <li><a href="#careers" className="hover:text-primary transition-colors no-underline">Careers</a></li>
              <li><a href="#casestudies" className="hover:text-primary transition-colors no-underline">Case Studies</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors no-underline">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground list-none p-0">
              <li><a href="#faq" className="hover:text-primary transition-colors no-underline">Privacy Policy</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors no-underline">Terms of Service</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors no-underline">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-muted-foreground">
            &copy; {currentYear} Hospital Management System. All rights reserved.
          </div>
          <div className="flex gap-6 items-center">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Globe className="h-5 w-5" /></a>
            <a href="mailto:info@hms.com" className="text-muted-foreground hover:text-primary transition-colors"><Mail className="h-5 w-5" /></a>
            <a href="https://github.com/your-repo/hms" className="text-muted-foreground hover:text-primary transition-colors"><ExternalLink className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
