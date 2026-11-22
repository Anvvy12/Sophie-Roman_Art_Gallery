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
}

const url = (id: string, file: string) => {
  const src = files[`../assets/projects/${id}/${file}`]
  if (!src) throw new Error(`Нет файла ${id}/${file} — перезапусти scripts/import_assets.py`)
  return src
}

interface ProjectInfo {
  id: string
  title: string
  subtitle?: string
  /** Задать вручную, если пропорции обложки не подходят (например, у видео другие). */
  aspectRatio?: number
}

function build(info: ProjectInfo): Project {
  const entry = (manifest as Record<string, ManifestEntry>)[info.id]
  if (!entry) throw new Error(`Нет ассетов для проекта «${info.id}»`)

  const media: ProjectMedia[] = entry.images.map((file) => ({
    type: 'image',
    src: url(info.id, file),
    alt: info.title,
  }))
  if (entry.video) media.unshift({ type: 'video', src: url(info.id, entry.video) })

  const natural = entry.width && entry.height ? entry.width / entry.height : 1
  // Слишком вытянутые обложки сжимаем, чтобы сетка оставалась ровной.
  const aspectRatio = info.aspectRatio ?? Math.min(Math.max(natural, 0.65), 1.6)

  return { ...info, aspectRatio, media }
}

export const projects: Project[] = [
  {
    id: 'dont-worry-its-private-here',
    title: 'Don’t Worry. It’s Private Here',
    subtitle: 'Monumental stained-glass work in collaboration with Sub Rosa',
    aspectRatio: 960 / 1268, // пропорции видео
  },
  {
    id: 'sculptural-lighting',
    title: 'Sculptural lighting design',
    subtitle: 'Glass, epoxy resin',
  },
  {
    id: 'the-5th-phase',
    title: 'The 5-th Phase',
    subtitle: 'Video installation, Architecture Festival Zürich 2026',
    aspectRatio: 16 / 9, // пропорции видео
  },
  {
    id: 'office-plankton',
    title: 'Office Plankton’s New Year',
    subtitle: 'Personal art exhibition, TAM art space, Kyiv',
  },
  {
    id: 'vyshnevyi-viter',
    title: 'Vyshnevyi Viter',
    subtitle: 'Feature film, visual identity',
  },
  {
    id: 'self',
    title: 'Self',
    subtitle: 'Group exhibition, OctoTower Galerie, Kyiv',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    subtitle: 'Group exhibition × Harald Alff, Goethe-Institut in Ukraine, Kyiv',
  },
  {
    id: 'my-life',
    title: 'My Life',
    subtitle: 'Personal art exhibition, Sumy',
  },
  {
    id: 'adrum',
    title: 'ADRUM',
    subtitle: 'Group exhibition, Barcelona',
  },
  {
    id: 'sketches',
    title: 'Sketches',
    subtitle: 'Drawings',
  },
].map(build)
