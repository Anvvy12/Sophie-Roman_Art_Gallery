import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import type { Project } from '../types/project'

/** Как часто перелистываются фото при ховере, мс. */
const SLIDE_INTERVAL = 800

const canHover = () => window.matchMedia('(hover: hover)').matches
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  project: Project
}

export function ProjectCard({ project }: Props) {
  const ref = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref)
  const [hovered, setHovered] = useState(false)
  const [step, setStep] = useState(0)

  const video = project.media.find((m) => m.type === 'video')
  const images = project.media.filter((m) => m.type === 'image')

  // На устройствах без ховера (телефоны) листаем фото, пока карточка на экране.
  const active = canHover() ? hovered : inView
  const cycling = !video && active && images.length > 1 && !reducedMotion()

  useEffect(() => {
    if (!cycling) return
    const id = window.setInterval(() => setStep((s) => s + 1), SLIDE_INTERVAL)
    return () => {
      window.clearInterval(id)
      setStep(0)
    }
  }, [cycling])

  // +1: второе фото появляется сразу при наведении, чтобы ховер ощущался отзывчивым.
  const index = cycling ? (step + 1) % images.length : 0
  // Фото грузим по мере листания: обложку сразу, следующие — на шаг вперёд.
  const loaded = cycling ? Math.min(step + 3, images.length) : 1

  // Видео играет само, когда карточка на экране.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView])

  const showVideo = Boolean(video) && !(hovered && images.length > 0)

  return (
    <article
      ref={ref}
      className="card"
      style={{ aspectRatio: project.aspectRatio }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {images.slice(0, Math.max(loaded, video ? 1 : 0)).map((media, i) => (
        <img
          key={media.src}
          className="card__media"
          style={{ opacity: !showVideo && i === index ? 1 : 0 }}
          src={media.src}
          alt={i === 0 ? (media.alt ?? '') : ''}
          loading="lazy"
          decoding="async"
        />
      ))}
      {video && (
        <video
          ref={videoRef}
          className="card__media"
          style={{ opacity: showVideo ? 1 : 0 }}
          src={video.src}
          poster={images[0]?.src}
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div className="card__caption">
        <h2 className="card__title">{project.title}</h2>
        {project.subtitle && <p className="card__subtitle">{project.subtitle}</p>}
      </div>
    </article>
  )
}
