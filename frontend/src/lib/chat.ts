import type { AreaSelection } from '@/lib/imagery'

type Release = { release_num: number; release_date: string }

export type Comparison = {
  source: 'esri-wayback'
  before: Release
  after: Release
  area: AreaSelection['geometry'] | null
}

export type Chat = { id: number; title: string; updated_at: string }

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  attachment_name: string | null
  before_image_name?: string | null
  after_image_name?: string | null
  comparison?: Comparison | null
}

export type MessageDraft = {
  chat_id: number | null
  content: string
  comparison: Comparison | null
}

const SESSION_KEY = 'geoint.chat-session.v1'
const UUID_V4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
let sessionToken: string | undefined

function getSessionToken() {
  if (sessionToken) return sessionToken
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    sessionToken = saved && UUID_V4.test(saved) ? saved : crypto.randomUUID()
    if (sessionToken !== saved) localStorage.setItem(SESSION_KEY, sessionToken)
  } catch {
    // A tab can still send messages if local storage is unavailable.
    sessionToken ??= crypto.randomUUID()
  }
  return sessionToken
}

async function request<T>(path: string, body?: FormData): Promise<T> {
  const unavailable = 'The chat server is unavailable. Try again.'
  const response = await fetch(`/api/chats${path}`, {
    method: body ? 'POST' : 'GET',
    body,
    headers: { Authorization: `Bearer ${getSessionToken()}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(45_000),
  }).catch(() => {
    throw new Error(unavailable)
  })
  const data = await response.json().catch(() => null)
  if (response.ok && data !== null) return data as T
  if (response.status >= 400 && response.status < 500 && typeof data?.detail === 'string') {
    throw new Error(data.detail)
  }
  if (response.status === 422) throw new Error('Check the message and imagery selection, then try again.')
  throw new Error(unavailable)
}

export function getChats() {
  return request<Chat[]>('')
}

export function getChatMessages(chatId: number) {
  return request<ChatMessage[]>(`/${chatId}/messages`)
}

export function sendChatMessage(
  draft: MessageDraft,
  clientMessageId: string,
  images: { before: File; after: File } | null,
) {
  const body = new FormData()
  body.set('payload', JSON.stringify({ ...draft, client_message_id: clientMessageId }))
  if (images) {
    body.set('before_imagery', images.before)
    body.set('after_imagery', images.after)
  }
  return request<{ chat: Chat; message: ChatMessage }>('/messages', body)
}
