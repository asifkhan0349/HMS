import { ArrowRight, Timer } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

const posts = [
  {
    category: "Insights",
    title: "Reducing Medication Dispensing Errors by 90% via Clinical AI",
    desc: "A case study on implementing real-time drug interaction checks and smart warning logs in pharmacy networks.",
    author: "Dr. Aris Thorne",
    readTime: "5 min read",
    image: "/previews/patients_desktop.png",
    tag: "Case Study",
  },
  {
    category: "Product",
    title: "GoMeds AI v2.0: Autonomous Wholesale Distribution Logistics",
    desc: "Streamlining wholesale medical purchasing pipelines with automatic route planning and instant invoices.",
    author: "Sarah Jenks",
    readTime: "3 min read",
    image: "/previews/billing_desktop.png",
    tag: "Update",
  },
  {
    category: "Security",
    title: "GxP and HIPAA Standards in Healthcare Software Integration",
    desc: "How GoMeds AI implements strict data privacy controls and sequential audit tracking to guarantee GxP validation.",
    author: "Kevin Miller",
    readTime: "7 min read",
    image: "/previews/dashboard_desktop.png",
    tag: "Engineering",
  },
]

export function BlogSection() {
  return (
    <section id="blog" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="section-container text-left">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <ScrollReveal>
              <div className="mono-label mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-gradient-premium" />
                BLOG
              </div>
              <h2 className="text-4xl font-bold leading-tight tracking-tight text-text-secondary">
                Intelligence,{" "}
                <span className="text-gradient-premium">in real-time.</span>
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <Button variant="outline" className="rounded-xl border-border/20 text-text-secondary hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              View all articles <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div
                tabIndex={0}
                className="premium-card bg-card overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Blog post: ${post.title}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-text-secondary">
                    {post.tag}
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-3">{post.category}</div>
                  <h3 className="text-base font-bold mb-3 leading-tight text-text-secondary group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-text-tertiary leading-relaxed mb-5 line-clamp-2">
                    {post.desc}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xs bg-gradient-premium flex items-center justify-center text-[10px] font-bold text-white">
                        {post.author.charAt(0)}
                      </div>
                      <div className="text-sm font-semibold text-text-secondary">{post.author}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Timer className="h-3.5 w-3.5" /> {post.readTime}
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
