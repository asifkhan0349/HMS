import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="relative p-12 md:p-16 rounded-3xl border bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden group">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
              
              <Quote className="h-12 w-12 text-primary/20 mb-8" />
              
              <blockquote className="relative z-10">
                <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-10 text-foreground italic">
                  "Hospital Management System has completely transformed how our ward operates. It's the first system that feels like it was designed for humans, not just databases."
                </p>
                
                <footer className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                    SC
                  </div>
                  <div>
                    <cite className="not-italic font-bold text-lg text-foreground block">Dr. Sarah Chen</cite>
                    <span className="text-muted-foreground">Chief of Staff, Metro General</span>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </ScrollReveal>

        {/* Client Logos / Stats Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="flex flex-col items-center">
             <div className="text-3xl font-bold text-foreground">500+</div>
             <div className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Hospitals</div>
           </div>
           <div className="flex flex-col items-center">
             <div className="text-3xl font-bold text-foreground">1M+</div>
             <div className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Patients</div>
           </div>
           <div className="flex flex-col items-center">
             <div className="text-3xl font-bold text-foreground">2018</div>
             <div className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Founded</div>
           </div>
           <div className="flex flex-col items-center">
             <div className="text-3xl font-bold text-foreground">99%</div>
             <div className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Satisfaction</div>
           </div>
        </div>
      </div>
    </section>
  )
}
