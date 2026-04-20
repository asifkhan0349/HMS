import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hospital, Menu, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { useScrollPosition } from "../../hooks/use-scroll-position"

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Solutions", href: "#solutions" },
  { name: "ROI Guide", href: "#roi-guide" },
  { name: "About", href: "#about" },
  { name: "Blog", href: "#blog" },
  { name: "Contact", href: "#contact" },
]

export function SiteHeader({ onAuthRedirect }) {
  const scrollPosition = useScrollPosition()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  const scrollToSection = (e, href) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
    closeMobileMenu()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none p-6">
      <motion.div 
        className={cn(
          "floating-nav pointer-events-auto",
          scrollPosition > 50 ? "py-2 px-4 bg-black/90 scale-95" : "py-3 px-6 bg-black"
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="flex items-center gap-8">
          <a 
            href="/" 
            className="flex items-center space-x-2 no-underline text-white group" 
            onClick={(e) => scrollToSection(e, "#home")}
          >
            <Hospital className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">HMS</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors no-underline"
                onClick={(e) => scrollToSection(e, item.href)}
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <button 
                className="text-sm font-medium text-white hover:text-white/80 transition-colors"
                onClick={() => onAuthRedirect('login')}
              >
                Sign in
              </button>
              <Button 
                size="sm" 
                className="bg-white text-black hover:bg-white/90 rounded-full font-semibold px-5" 
                onClick={() => onAuthRedirect('signup')}
              >
                Book Demo
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex items-center justify-center p-1 rounded-full text-white hover:bg-white/10"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />
            <motion.div
              className="fixed top-24 left-6 right-6 z-50 bg-black border border-white/10 rounded-2xl shadow-2xl p-6 md:hidden pointer-events-auto"
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
            >
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-white no-underline py-2 border-b border-white/5"
                    onClick={(e) => scrollToSection(e, item.href)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 flex flex-col gap-3">
                  <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10" onClick={() => { onAuthRedirect('login'); closeMobileMenu(); }}>Sign in</Button>
                  <Button className="w-full bg-white text-black" onClick={() => { onAuthRedirect('signup'); closeMobileMenu(); }}>Book Demo</Button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

