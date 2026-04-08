import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { cn } from "../../lib/utils"

export function SpotlightCard({ className, children, ...props }) {
  const containerRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPosition({ x, y })
  }

  const handleMouseEnter = () => {
    setOpacity(1)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
    setIsHovered(false)
  }

  useEffect(() => {
    if (!isHovered && containerRef.current) {
      const interval = setInterval(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const x = rect.width / 2 + Math.random() * 100 - 50
          const y = rect.height / 2 + Math.random() * 100 - 50
          setPosition({ x, y })
          setOpacity(0.1)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isHovered])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(220, 38, 38, 0.1), transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
}
