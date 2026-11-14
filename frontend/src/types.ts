// THIS IS JUST A SAMPLE UNTIL THE REAL ENDPOINT EXISTS!!!!! :)


// one row in the chat list (chats table)
export type Chat = {
  id: number
  title: string
  updated_at: string // "2026-11-06T15:00:00Z"
}

// one chat message (messages table)
export type Message = {
  id: number
  role: 'user' | 'assistant' // only these two values are allowed
  content: string
}

// one saved image in the library (images table)
export type LibraryImage = {
  id: number
  source: 'snapshot' | 'upload' // map snapshot or uploaded from the device
  thumb_url: string | null      // small preview; null = no preview yet (sample data)
  capture_date: string | null   // when the satellite took it, if known
  created_at: string            // when it was saved in the app
}