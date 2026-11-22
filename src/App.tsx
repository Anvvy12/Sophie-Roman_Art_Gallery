import { Header } from './components/Header'
import { ProjectGrid } from './components/ProjectGrid'
import { projects } from './data/projects'

export default function App() {
  return (
    <>
      <Header />
      <ProjectGrid projects={projects} />
    </>
  )
}
