import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pill, Sparkles, Menu, X, ArrowRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { useScrollPosition } from "../../hooks/use-scroll-position"

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Products", href: "#products" },
  { name: "Solutions", href: "#solutions" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "#about" },
]

export function SiteHeader({ onAuthRedirect }) {
  const scrollPosition = useScrollPosition()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isScrolled = scrollPosition > 50

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
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <motion.div
        className={cn(
          "floating-nav pointer-events-auto",
          isScrolled && "scrolled"
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-8">
          <a
            href="/"
            className="flex items-center gap-2.5 no-underline group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={(e) => scrollToSection(e, "#home")}
            aria-label="GoMeds AI Home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-premium text-white">
              <Pill className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground flex items-center gap-1.5">
              GoMeds AI
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-text-tertiary hover:text-foreground transition-colors rounded-lg hover:bg-white/5 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={(e) => scrollToSection(e, item.href)}
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-text-tertiary hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => onAuthRedirect('login')}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition-all rounded-lg font-medium h-9 px-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => onAuthRedirect('signup')}
              >
                Request Demo
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>

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
              className="fixed top-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-6 md:hidden pointer-events-auto shadow-xl"
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
            >
              <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-base font-medium text-text-secondary no-underline px-3 py-3 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={(e) => scrollToSection(e, item.href)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 mt-4 border-t border-border flex flex-col gap-3">
                  <Button variant="outline" className="w-full rounded-xl focus-visible:ring-2" onClick={() => { onAuthRedirect('login'); closeMobileMenu(); }}>Sign in</Button>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl focus-visible:ring-2" onClick={() => { onAuthRedirect('signup'); closeMobileMenu(); }}>Request Demo</Button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
