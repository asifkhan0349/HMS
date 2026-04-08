import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hospital, Menu, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { useScrollPosition } from "../../hooks/use-scroll-position"

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Interface", href: "#previews" },
  { name: "Solutions", href: "#solutions" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
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
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-background/80 backdrop-blur-lg border-b border-border/40 py-3" : "bg-transparent py-5",
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-2 z-10 no-underline text-foreground" onClick={(e) => scrollToSection(e, "#home")}>
          <Hospital className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl tracking-tight">HMS</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group no-underline"
              onClick={(e) => scrollToSection(e, item.href)}
            >
              {item.name}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200"></span>
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onAuthRedirect('login')}>Sign in</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => onAuthRedirect('signup')}>Book Demo</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded-md bg-background/90 border border-border/40 shadow-sm"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="text-foreground h-5 w-5" /> : <Menu className="text-foreground h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-background shadow-xl border-l border-border md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Hospital className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">HMS</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="py-6 px-4">
                <nav className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-lg font-medium text-foreground no-underline py-2"
                      onClick={(e) => scrollToSection(e, item.href)}
                    >
                      {item.name}
                    </a>
                  ))}
                  <div className="pt-6 border-t border-border flex flex-col gap-3">
                    <Button variant="outline" className="w-full" onClick={() => { onAuthRedirect('login'); closeMobileMenu(); }}>Sign in</Button>
                    <Button className="w-full" onClick={() => { onAuthRedirect('signup'); closeMobileMenu(); }}>Book Demo</Button>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
