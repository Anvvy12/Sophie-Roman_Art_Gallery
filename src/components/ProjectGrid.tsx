import { useMemo } from 'react'
import { useColumnCount } from '../hooks/useColumnCount'
import type { Project } from '../types/project'
import { ProjectCard } from './ProjectCard'

/**
 * Pinterest-сетка: каждая следующая карточка уходит в самую короткую колонку,
 * поэтому порядок читается слева направо, а колонки остаются ровными по высоте.
 */
function distribute(projects: Project[], columns: number): Project[][] {
  const result: Project[][] = Array.from({ length: columns }, () => [])
  const heights = new Array<number>(columns).fill(0)
  for (const project of projects) {
    const shortest = heights.indexOf(Math.min(...heights))
    result[shortest].push(project)
    heights[shortest] += 1 / project.aspectRatio
  }
  return result
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const columns = useColumnCount()
  const layout = useMemo(() => distribute(projects, columns), [projects, columns])

  return (
    <main className="grid">
      {layout.map((column, i) => (
        <div className="grid__column" key={i}>
          {column.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ))}
    </main>
  )
}
