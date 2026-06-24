import { useEffect, useState, useRef } from 'react'

export default function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!target || isNaN(target)) return

    const start     = 0
    const end       = parseFloat(target)
    const startTime = performance.now()

    function tick(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(start + (end - start) * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}