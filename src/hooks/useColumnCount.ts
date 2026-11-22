import { useSyncExternalStore } from 'react'

/** Брейкпоинты сетки: телефон — 1 колонка, планшет — 2, ПК — 3. */
const QUERIES: [query: string, columns: number][] = [
  ['(min-width: 1024px)', 3],
  ['(min-width: 600px)', 2],
]

function getColumns(): number {
  for (const [query, columns] of QUERIES) {
    if (window.matchMedia(query).matches) return columns
  }
  return 1
}

function subscribe(onChange: () => void): () => void {
  const lists = QUERIES.map(([query]) => window.matchMedia(query))
  lists.forEach((list) => list.addEventListener('change', onChange))
  return () => lists.forEach((list) => list.removeEventListener('change', onChange))
}

export function useColumnCount(): number {
  return useSyncExternalStore(subscribe, getColumns, () => 3)
}
