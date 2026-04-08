import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"

export function MouseGlow({
  color = "rgba(220, 38, 38, 0.15)",
  size = 400,
  blur = 100,
  opacity = 0.5,
  delay = 0,
  followSpeed = 0.15,
  pulseEffect = true,
  pulseSpeed = 3,
  pulseScale = 1.1,
  zIndex = -1,
  disabled = false,
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const controls = useAnimation()
  const glowRef = useRef(null)
  const lastMousePosition = useRef({ x: 0, y: 0 })
  const animationFrameId = useRef(null)

  useEffect(() => {
    if (disabled) {
      setIsVisible(false)
      return
    }

    const updateMousePosition = (e) => {
      lastMousePosition.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const smoothlyUpdatePosition = () => {
      if (!isVisible) return

      setMousePosition(prev => {
        const newX = prev.x + (lastMousePosition.current.x - prev.x) * followSpeed
        const newY = prev.y + (lastMousePosition.current.y - prev.y) * followSpeed
        return { x: newX, y: newY }
      })
      animationFrameId.current = requestAnimationFrame(smoothlyUpdatePosition)
    }

    window.addEventListener("mousemove", updateMousePosition)
    document.documentElement.addEventListener("mouseleave", handleMouseLeave)
    animationFrameId.current = requestAnimationFrame(smoothlyUpdatePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [isVisible, followSpeed, disabled])

  useEffect(() => {
    if (pulseEffect && isVisible) {
      controls.start({
        scale: [1, pulseScale, 1],
        transition: {
          duration: pulseSpeed,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        },
      })
    }
  }, [controls, pulseEffect, pulseScale, pulseSpeed, isVisible])

  return (
    <AnimatePresence>
      {isVisible && !disabled && (
        <motion.div
          ref={glowRef}
          className="fixed pointer-events-none overflow-hidden"
          style={{
            zIndex,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              backgroundColor: color,
              width: size,
              height: size,
              filter: `blur(${blur}px)`,
              opacity,
              x: mousePosition.x - size / 2,
              y: mousePosition.y - size / 2,
            }}
            animate={controls}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 200,
              mass: 0.5,
              delay,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
