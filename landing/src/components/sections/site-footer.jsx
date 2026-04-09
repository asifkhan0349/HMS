import { Hospital, Globe, Mail, ExternalLink } from "lucide-react"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-white py-12 md:py-16">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-16 mb-24">
          <div className="col-span-2 space-y-8">
            <div className="flex items-center space-x-2 no-underline text-white">
              <Hospital className="h-8 w-8 text-primary" />
              <span className="font-black text-2xl tracking-tight">HMS</span>
            </div>
            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-sm">
              The modern operating system for healthcare providers. Unified, secure, and built for humans.
            </p>
            <div className="flex gap-6 items-center">
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Globe className="h-6 w-6" /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Mail className="h-6 w-6" /></a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-black mb-8 text-white uppercase tracking-widest text-sm">Product</h4>
            <ul className="space-y-4 font-bold text-white/40 list-none p-0">
              <li><a href="#features" className="hover:text-white transition-colors no-underline">Features</a></li>
              <li><a href="#solutions" className="hover:text-black transition-colors no-underline">Solutions</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors no-underline">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">ROI Guide</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-black mb-8 text-white uppercase tracking-widest text-sm">Company</h4>
            <ul className="space-y-4 font-bold text-white/40 list-none p-0">
              <li><a href="#" className="hover:text-white transition-colors no-underline">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">Blog</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors no-underline">Contact</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-black mb-8 text-white uppercase tracking-widest text-sm">Legal</h4>
            <ul className="space-y-4 font-bold text-white/40 list-none p-0">
              <li><a href="#" className="hover:text-white transition-colors no-underline">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">HIPAA</a></li>
              <li><a href="#" className="hover:text-white transition-colors no-underline">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-lg font-bold text-white/20">
            &copy; {currentYear} HMS OS. All rights reserved.
          </div>
          <div className="flex gap-8 items-center font-bold text-white/20">
            <a href="#" className="hover:text-white transition-colors no-underline">Status</a>
            <a href="#" className="hover:text-white transition-colors no-underline">Security</a>
            <a href="#" className="hover:text-white transition-colors no-underline">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  )
}




