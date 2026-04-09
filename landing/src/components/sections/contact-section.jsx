import { useState } from "react"
import { Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "../ui/button"
import { ScrollReveal } from "../ui/effects/scroll-reveal"

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
    <section id="contact" className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <ScrollReveal>
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight text-black">
                Scale your <br /> <span className="text-black/40">facility.</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-md">
                Ready to modernize? Connect with our experts for a personalized demo and ROI analysis.
              </p>
              
              <div className="space-y-6 pt-4">
                {["Personalized Demo with an Expert", "Complete Security Evaluation", "Custom ROI Analysis"].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-black">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="relative">
            <div className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-2xl">
              <form onSubmit={handleContactSubmit} className="space-y-8">
                {formStatus === "success" && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-black text-white text-sm font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    Message sent successfully!
                  </div>
                )}
                {formStatus === "error" && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500 text-white text-sm font-bold">
                    <AlertCircle className="h-5 w-5" />
                    Failed to send message.
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-black/40 ml-1">Full Name</label>
                    <input name="name" placeholder="John Doe" required className="w-full bg-gray-50 border-0 rounded-2xl h-14 px-6 font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-black/40 ml-1">Work Email</label>
                    <input name="email" type="email" placeholder="john@hospital.com" required className="w-full bg-gray-50 border-0 rounded-2xl h-14 px-6 font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-black/40 ml-1">Message</label>
                    <textarea name="message" placeholder="Tell us about your facility..." required className="w-full bg-gray-50 border-0 rounded-2xl p-6 font-bold focus:ring-2 focus:ring-black outline-none transition-all min-h-[160px]" />
                  </div>
                </div>

                <Button type="submit" className="pill-button w-full bg-black text-white hover:bg-black/90 h-16 text-xl" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Inquiry"}
                </Button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

