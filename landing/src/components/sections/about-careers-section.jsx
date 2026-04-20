import { Award, Users, Heart, Sparkles, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const values = [
  {
    icon: Award,
    title: "Excellence",
    desc: "We set the highest standard for healthcare software globally."
  },
  {
    icon: Users,
    title: "Human-Centric",
    desc: "Technology designed to serve providers and patients alike."
  },
  {
    icon: Heart,
    title: "Integrity",
    desc: "Transparent, secure, and always putting data ethics first."
  }
]

const jobs = [
  { title: "Senior Product Designer", type: "Full-time", location: "Remote" },
  { title: "Backend Engineer (Go/Python)", type: "Full-time", location: "Bangalore / Remote" },
  { title: "Customer Success Manager", type: "Full-time", location: "Mumbai" }
]

export function AboutCareersSection() {
  return (
    <section className="py-32 bg-white relative overflow-hidden" id="about">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32 items-center">
          <ScrollReveal>
            <div className="inline-flex py-2 px-4 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 uppercase tracking-widest">
              Our Story
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black">
              Built by doctors. <br />
              Optimized by experts.
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-10">
              HMS was born out of a simple frustration: legacy software was slowing down life-saving care. We've spent the last decade building a unified operating system that brings hospital management into the 21st century.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {values.map((value, i) => (
                <div key={i}>
                  <div className="h-10 w-10 text-primary mb-4">
                    <value.icon className="h-8 w-8" />
                  </div>
                  <div className="font-bold text-black mb-2">{value.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1000" 
                alt="Hospital environment" 
                className="w-full h-full object-cover grayscale brightness-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
              <div className="absolute bottom-10 left-10 p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white max-w-[280px]">
                <Sparkles className="h-8 w-8 mb-4 text-primary" />
                <div className="text-2xl font-black mb-2 italic">"Empowering those who heal."</div>
                <div className="text-sm font-bold opacity-60">— Our Vision</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div id="careers" className="relative p-12 md:p-20 rounded-[3rem] bg-gray-50 border border-gray-100 overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-20">
            <div className="lg:col-span-1">
              <h3 className="text-4xl font-black mb-6 text-black tracking-tight">Join the evolution.</h3>
              <p className="text-lg text-muted-foreground font-medium mb-8 leading-relaxed">
                We're looking for passionate designers, engineers, and healthcare specialists to help us redefine the global standard of care.
              </p>
              <button className="flex items-center gap-2 font-black text-black hover:text-primary transition-colors group">
                View all departments <ArrowUpRight className="h-5 w-5 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {jobs.map((job, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-white border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-primary/20 transition-all cursor-pointer group">
                  <div>
                    <div className="text-xl font-bold text-black mb-1 group-hover:text-primary transition-colors">{job.title}</div>
                    <div className="flex gap-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{job.type}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>
      </div>
    </section>
  )
}
