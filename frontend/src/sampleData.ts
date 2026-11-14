// FAKE UNTIL ENDPOINTS EXIST!!! :)

import type { Chat, LibraryImage } from '@/types'

// sample chat list, newest first (like list_chats in the back end)
export const SAMPLE_CHATS: Chat[] = [
  { id: 3, title: 'Sanibel damage check', updated_at: '2026-11-06T14:30:00Z' },
  { id: 2, title: 'Fort Myers flooding', updated_at: '2026-11-05T10:15:00Z' },
  { id: 1, title: 'Before/after Hurricane Ian', updated_at: '2026-11-01T09:00:00Z' },
]

// sample image library, newest first
export const SAMPLE_IMAGES: LibraryImage[] = [
  { id: 4, source: 'snapshot', thumb_url: null, capture_date: '2022-10-01T00:00:00Z', created_at: '2026-11-06T14:20:00Z' },
  { id: 3, source: 'upload', thumb_url: null, capture_date: null, created_at: '2026-11-05T09:40:00Z' },
  { id: 2, source: 'snapshot', thumb_url: null, capture_date: '2022-09-20T00:00:00Z', created_at: '2026-11-03T16:05:00Z' },
  { id: 1, source: 'upload', thumb_url: null, capture_date: null, created_at: '2026-11-01T08:55:00Z' },
]