import type { WaybackItem } from '@esri/wayback-core'

export type ImagerySide = 'before' | 'after'
export type ImageryRelease = Pick<WaybackItem, 'releaseNum' | 'releaseDateLabel'>
export type ImageryPair = Record<ImagerySide, ImageryRelease>

export const FALLBACK_IMAGERY: ImageryPair = {
  before: { releaseNum: 47471, releaseDateLabel: '2022-09-21' },
  after: { releaseNum: 25982, releaseDateLabel: '2023-06-13' },
}

export type AreaSelection = {
  geometry: { type: 'Polygon'; coordinates: [[number, number][]] }
  center: { longitude: number; latitude: number }
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export function formatReleaseDate(releaseDate: string) {
  return dateFormat.format(new Date(releaseDate))
}
