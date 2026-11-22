import { useEffect, useState, type RefObject } from 'react'

/** true, пока элемент виден на экране хотя бы на `threshold` своей площади. */
export function useInView(ref: RefObject<Element | null>, threshold = 0.5): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold])

  return inView
}
