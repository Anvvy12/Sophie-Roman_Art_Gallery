import type { Project, ProjectMedia } from '../types/project'
import manifest from '../assets/projects/manifest.json'

export const INSTAGRAM_URL = 'https://www.instagram.com/sofyromann/'

/**
 * Файлы лежат в src/assets/projects/<id>/ и генерируются скриптом
 * scripts/import_assets.py из выгрузки Google Drive (одна папка = одна карточка).
 */
const files = import.meta.glob<string>('../assets/projects/*/*.{webp,mp4}', {
  eager: true,
  query: '?url',
  import: 'default',
})

interface ManifestEntry {
  images: string[]
  video: string | null
  width?: number
  height?: number
  videoWidth?: number
  videoHeight?: number
}

const url = (id: string, file: string) => {
  const src = files[`../assets/projects/${id}/${file}`]
  if (!src) throw new Error(`Нет файла ${id}/${file} — перезапусти scripts/import_assets.py`)
  return src
}

interface ProjectInfo {
  id: string
  title: string
  /** Где проходил проект — показывается второй строкой под заголовком. */
  location?: string
  subtitle?: string
}

function build(info: ProjectInfo): Project {
  const entry = (manifest as Record<string, ManifestEntry>)[info.id]
  if (!entry) throw new Error(`Нет ассетов для проекта «${info.id}»`)

  const title = info.title

  const media: ProjectMedia[] = entry.images.map((file) => ({
    type: 'image',
    src: url(info.id, file),
    alt: title,
  }))
  if (entry.video) media.unshift({ type: 'video', src: url(info.id, entry.video) })

  // Карточка с видео берёт пропорции видео, остальные — обложки.
  const [w, h] = entry.video
    ? [entry.videoWidth, entry.videoHeight]
    : [entry.width, entry.height]
  const natural = w && h ? w / h : 1
  // Слишком вытянутые обложки сжимаем, чтобы сетка оставалась ровной.
  const aspectRatio = Math.min(Math.max(natural, 0.65), 1.6)

  return { ...info, aspectRatio, media }
}

export const projects: Project[] = [
  {
    id: 'dont-worry-its-private-here',
    title: 'Don’t Worry. It’s Private Here',
    subtitle: 'Monumental stained-glass work in collaboration with Sub Rosa',
  },
  {
    id: 'sculptural-lighting',
    title: 'Sculptural lighting design',
    subtitle: 'Glass, epoxy resin',
  },
  {
    id: 'the-5th-phase',
    title: 'The 5-th Phase',
    location: 'Zürich, Switzerland',
    subtitle: 'Video installation, Architecture Festival Zürich 2026',
  },
  {
    id: 'office-plankton',
    title: 'Office Plankton’s New Year',
    location: 'Kyiv, Ukraine',
    subtitle: 'Personal art exhibition, TAM art space',
  },
  {
    id: 'men',
    title: 'Men',
    subtitle: 'Watercolors',
  },
  {
    id: 'vyshnevyi-viter',
    title: 'Vyshnevyi Viter',
    subtitle: 'Feature film, visual identity',
  },
  {
    id: 'self',
    title: 'Self',
    location: 'Kyiv, Ukraine',
    subtitle: 'Group exhibition, OctoTower Galerie',
  },
  {
    id: 'women',
    title: 'Women',
    subtitle: 'Ink drawings',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    location: 'Kyiv, Ukraine',
    subtitle: 'Group exhibition × Harald Alff, Goethe-Institut in Ukraine',
  },
  {
    id: 'my-life',
    title: 'My Life',
    location: 'Sumy, Ukraine',
    subtitle: 'Personal art exhibition',
  },
  {
    id: 'photo-scans',
    title: 'Photo scans',
  },
  {
    id: 'adrum',
    title: 'ADRUM',
    location: 'Barcelona, Spain',
    subtitle: 'Group exhibition',
  },
  {
    id: 'mixed-media',
    title: 'Mixed media on paper',
  },
  {
    id: 'sketches',
    title: 'Sketches',
    subtitle: 'Drawings',
  },
].map(build)
