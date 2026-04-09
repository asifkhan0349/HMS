import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1">
                <Quote className="h-20 w-20 text-primary/10 mb-8 -ml-6" />
                <blockquote className="relative z-10">
                  <p className="text-4xl md:text-5xl font-black leading-[1.1] text-black mb-12">
                    "HMS transformed our operations. It's the first system that feels designed for <span className="text-black/40">modern healthcare humans."</span>
                  </p>
                  
                  <footer className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center text-white font-black text-2xl">
                      SC
                    </div>
                    <div>
                      <cite className="not-italic font-extrabold text-xl text-black block">Dr. Sarah Chen</cite>
                      <span className="text-lg font-medium text-muted-foreground">Chief of Staff, Metro General</span>
                    </div>
                  </footer>
                </blockquote>
              </div>
              
              <div className="hidden lg:block w-px h-64 bg-black/5" />
              
              <div className="flex flex-col gap-10">
                <div className="flex flex-col">
                  <div className="text-5xl font-black text-black">500+</div>
                  <div className="text-lg font-bold text-muted-foreground mt-1">Hospitals</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-5xl font-black text-black">99.9%</div>
                  <div className="text-lg font-bold text-muted-foreground mt-1">Satisfaction</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-5xl font-black text-black">1M+</div>
                  <div className="text-lg font-bold text-muted-foreground mt-1">Patients</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

