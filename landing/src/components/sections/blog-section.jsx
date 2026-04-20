import { ArrowRight, MessageSquare, Timer } from "lucide-react"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const posts = [
  {
    category: "Insights",
    title: "How to reduce Patient Wait Times by 60% in Tier 1 Hospitals",
    desc: "A case study on the implementation of intelligent queuing systems.",
    author: "Dr. Aris Thorne",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"
  },
  {
    category: "Product Update",
    title: "HMS v2.0: Unified Billing and Insurance Claim Automation",
    desc: "Streamlining the administrative burden of modern healthcare.",
    author: "Sarah Jenks",
    readTime: "3 min",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"
  },
  {
    category: "Security",
    title: "ABDM Roadmap: Integrating Unified Health Interfaces",
    desc: "How HMS is leading the way in the global health digitalization.",
    author: "Kevin Miller",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800"
  }
]

export function BlogSection() {
  return (
    <section id="blog" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <ScrollReveal>
              <div className="inline-flex py-1 px-3 rounded bg-black text-white font-bold text-xs mb-6 uppercase tracking-[0.2em]">
                The HMS Journal
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-black leading-[0.95]">
                Intelligence <br />
                <span className="text-black/40">In real-time.</span>
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <button className="flex items-center gap-2 font-black text-black pb-2 border-b-2 border-black hover:text-primary hover:border-primary transition-all">
              Go to all articles <ArrowRight className="h-5 w-5" />
            </button>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="group cursor-pointer">
                <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-8 shadow-sm">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
                  />
                  <div className="absolute top-6 left-6 py-2 px-4 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-black shadow-sm">
                    {post.category}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground font-medium mb-8 line-clamp-2">
                    {post.desc}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full w-full bg-primary/20 flex items-center justify-center font-black text-[10px] text-primary">
                          {post.author.charAt(0)}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-black">{post.author}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black text-muted-foreground uppercase">
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {post.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
