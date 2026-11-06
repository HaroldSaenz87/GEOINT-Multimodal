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