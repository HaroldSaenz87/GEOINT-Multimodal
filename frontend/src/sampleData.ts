// FAKE UNTIL ENDPOINTS EXIST!!! :)

import type { Chat, ImagePair, LibraryImage, Message } from '@/types'

// sample chat list, newest first (like list_chats in the back end)
export const SAMPLE_CHATS: Chat[] = [
  { id: 3, title: 'Sanibel damage check', updated_at: '2026-11-06T14:30:00Z' },
  { id: 2, title: 'Fort Myers flooding', updated_at: '2026-11-05T10:15:00Z' },
  { id: 1, title: 'Before/after Hurricane Ian', updated_at: '2026-11-01T09:00:00Z' },
]

// sample before/after pair the + button attaches for now (until the Map Images sidebar exists)
export const SAMPLE_PAIR: ImagePair = {
  before: { id: 2, thumb_url: null },
  after: { id: 4, thumb_url: null },
}

// sample messages for each chat, keyed by chat id (like load_chat)
export const SAMPLE_MESSAGES: Record<number, Message[]> = {
  3: [
    { id: 301, role: 'user', content: 'How much damage is in this area?', pair: { before: null, after: { id: 4, thumb_url: null } } },
    { id: 302, role: 'assistant', content: 'About 35% of the buildings show damage. 3 of 8 have major roof loss, mostly on the east side.' },
    { id: 303, role: 'user', content: 'Which buildings should rescuers check first?' },
    { id: 304, role: 'assistant', content: 'Start with the 3 buildings on the east side near the causeway. They have the most roof loss and debris around them.' },
  ],
  2: [
    { id: 201, role: 'user', content: 'Are any roads flooded here?', pair: { before: null, after: { id: 4, thumb_url: null } }  },
    { id: 202, role: 'assistant', content: 'Yes. Standing water covers parts of two roads in the south half of the image.' },
  ],
  1: [

    { id: 101, role: 'user', content: 'What changed between the before and after images?', pair: {
      before: { id: 2, thumb_url: null },
      after: { id: 4, thumb_url: null },
    } },
    { id: 102, role: 'assistant', content: 'Several roofs are missing in the after image, and debris is scattered along the beach road.' },
  ],
}

// sample image library, newest first
export const SAMPLE_IMAGES: LibraryImage[] = [
  { id: 4, source: 'snapshot', thumb_url: null, capture_date: '2022-10-01T00:00:00Z', created_at: '2026-11-06T14:20:00Z' },
  { id: 3, source: 'upload', thumb_url: null, capture_date: null, created_at: '2026-11-05T09:40:00Z' },
  { id: 2, source: 'snapshot', thumb_url: null, capture_date: '2022-09-20T00:00:00Z', created_at: '2026-11-03T16:05:00Z' },
  { id: 1, source: 'upload', thumb_url: null, capture_date: null, created_at: '2026-11-01T08:55:00Z' },
]

