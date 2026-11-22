import { INSTAGRAM_URL } from '../data/projects'

export function Header() {
  return (
    <header className="header">
      <a className="header__logo" href="/" aria-label="Sophie Roman — home">
        Sophie Roman
      </a>
      <a className="header__link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        Instagram
      </a>
    </header>
  )
}
