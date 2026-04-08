import { useState } from "react"
import { Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ScrollReveal } from "../ui/effects/scroll-reveal"
import { Card, CardContent } from "../ui/card"

export function ContactSection() {
  const [formStatus, setFormStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormStatus("")

    const formData = new FormData(e.target)
    formData.append("access_key", "59de88fe-4efb-4c54-a450-83a016bc0496")

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      }).then((res) => res.json())

      if (res.success) {
        setFormStatus("success")
        e.target.reset()
      } else {
        setFormStatus("error")
      }
    } catch (err) {
      setFormStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Ready to <span className="text-primary">Modernize</span> your facility?
              </h2>
              <p className="text-lg text-muted-foreground opacity-80 leading-relaxed">
                Connect with our product experts to see how HMS can transform your operations. 
                Whether you're a multi-specialty hospital or a solo practice, we have solutions scaled for you.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Personalized Demo with an Expert</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Complete Security Evaluation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Custom ROI Analysis</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl p-2 rounded-3xl">
              <CardContent className="p-8">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  {formStatus === "success" && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium animate-in fade-in zoom-in duration-300">
                      <CheckCircle2 className="h-5 w-5" />
                      Message sent successfully! We'll get back to you soon.
                    </div>
                  )}
                  {formStatus === "error" && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in zoom-in duration-300">
                      <AlertCircle className="h-5 w-5" />
                      Failed to send message. Please try again.
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                      <Input name="name" placeholder="John Doe" required className="bg-background/50 h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Work Email</label>
                      <Input name="email" type="email" placeholder="john@hospital.com" required className="bg-background/50 h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Message</label>
                      <Textarea name="message" placeholder="Tell us about your facility..." required className="bg-background/50 min-h-[120px]" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Send Inquiry <Send className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
