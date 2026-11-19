import { ArrowUp, ImageIcon, SquareDashed, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getChatMessages, getChats, sendChatMessage } from '@/lib/chat'
import type { Chat, ChatMessage, MessageDraft } from '@/lib/chat'
import { formatReleaseDate } from '@/lib/imagery'
import type { AreaSelection, ImageryPair } from '@/lib/imagery'
import type { DrawState } from './SanibelMap'

type Props = {
  area: AreaSelection | null
  drawState: DrawState
  onDraw: () => void
  onClear: () => void
  getImagery: () => ImageryPair | null
}

type LocalMessage = { role: 'user'; text: string; imageName?: string }
type DisplayMessage = Pick<ChatMessage, 'id' | 'role' | 'content' | 'attachment_name' | 'comparison'>
type LocalConversation = { id: string; updatedAt: number; messages: DisplayMessage[] }

const HISTORY_KEY = 'geoint.chat-history.v1'
const HISTORY_DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const TOOL_BADGE = 'h-7 cursor-pointer border-[#485051] px-1.5 text-[11px] text-[#e3e9e6] hover:bg-[#333b3a] disabled:cursor-default disabled:opacity-50 aria-pressed:border-[#69b5a8] aria-pressed:bg-[#293b37]'

function loadLocalHistory(): LocalConversation[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]') as unknown
    if (Array.isArray(saved)) {
      const history: LocalConversation[] = []
      for (const item of saved) {
        if (typeof item?.id !== 'string' || !Number.isFinite(item.updatedAt)
          || !Number.isFinite(new Date(item.updatedAt).getTime()) || !Array.isArray(item.messages)) continue
        const messages = item.messages
          .filter((message: unknown): message is LocalMessage =>
            typeof message === 'object' && message !== null
            && 'role' in message && message.role === 'user'
            && 'text' in message && typeof message.text === 'string'
            && (!('imageName' in message) || typeof message.imageName === 'string'))
          .map((message: LocalMessage, index: number) => ({
            id: index, role: message.role, content: message.text, attachment_name: message.imageName ?? null, comparison: null,
          }))
        if (messages.length) history.push({ id: item.id, updatedAt: item.updatedAt, messages })
      }
      return history
    }
  } catch {
    // Earlier demo history may be unavailable in this browser.
  }
  return []
}

export default function ImageryChat({ area, drawState, onDraw, onClear, getImagery }: Props) {
  const [tab, setTab] = useState('chat')
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<Chat[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [localHistory] = useState(loadLocalHistory)
  const [localConversation, setLocalConversation] = useState<LocalConversation | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [pending, setPending] = useState<'send' | 'history' | 'open' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastAttempt = useRef<{ id: string; payload: string; image: File | null } | null>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const imagePicker = useRef<HTMLInputElement>(null)
  const activeMessages = localConversation?.messages ?? messages
  const ready = drawState !== 'loading' && drawState !== 'starting'
  const drawing = drawState === 'drawing'
  const busy = pending !== null

  useEffect(() => {
    const element = scrollArea.current
    if (element) element.scrollTop = element.scrollHeight
  }, [activeMessages, tab])

  function resetComposer() {
    lastAttempt.current = null
    setDraft('')
    setImage(null)
    setError(null)
    setTab('chat')
  }

  async function loadHistory() {
    setPending('history')
    setError(null)
    try {
      setHistory(await getChats())
    } catch {
      setError('Could not load chat history. Try again.')
    } finally {
      setPending(null)
    }
  }

  function selectTab(next: string) {
    setTab(next)
    setError(null)
    if (next === 'history') void loadHistory()
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setLocalConversation(null)
    resetComposer()
  }

  async function openConversation(id: number) {
    setPending('open')
    setError(null)
    try {
      setMessages(await getChatMessages(id))
      setActiveId(id)
      setLocalConversation(null)
      resetComposer()
    } catch {
      setError('Could not open this chat. Try again.')
    } finally {
      setPending(null)
    }
  }

  function openLocalConversation(conversation: LocalConversation) {
    setActiveId(null)
    setMessages([])
    setLocalConversation(conversation)
    resetComposer()
  }

  async function send() {
    const content = draft.trim()
    if (busy || drawing || (!content && !image && !area)) return
    const imagery = getImagery()
    if (area && !imagery) {
      setError('Wait for the map release dates to load, then send again.')
      return
    }
    const message: MessageDraft = {
      chat_id: activeId,
      content,
      comparison: imagery && {
        source: 'esri-wayback',
        before: { release_num: imagery.before.releaseNum, release_date: imagery.before.releaseDateLabel },
        after: { release_num: imagery.after.releaseNum, release_date: imagery.after.releaseDateLabel },
        area: area?.geometry ?? null,
      },
    }
    setError(null)
    setPending('send')
    try {
      const payload = JSON.stringify(message)
      if (lastAttempt.current?.payload !== payload || lastAttempt.current.image !== image) {
        lastAttempt.current = { id: crypto.randomUUID(), payload, image }
      }
      const saved = await sendChatMessage(message, lastAttempt.current.id, image)
      setActiveId(saved.chat.id)
      setMessages((current) => [...current, saved.message])
      resetComposer()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not send the message. Try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <aside aria-label="Imagery chat" className="dark z-10 flex min-h-0 min-w-0 flex-col border-r border-[#303436] bg-[#191c1e] text-[#f1f3f3] max-sm:row-start-2 max-sm:border-t max-sm:border-r-0">
      <Tabs value={tab} onValueChange={selectTab} className="min-h-0 min-w-0 flex-1 gap-0">
        <TabsList variant="line" aria-label="Chat views" className="w-full shrink-0 border-b border-[#303436] px-4 group-data-horizontal/tabs:h-11">
          <TabsTrigger value="chat" disabled={busy} className="text-xs after:bg-[#9ad9cc]">Chat</TabsTrigger>
          <TabsTrigger value="history" disabled={pending === 'send' || pending === 'open'} className="text-xs after:bg-[#9ad9cc]">History</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex min-h-0 flex-col data-[state=inactive]:hidden">
          <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3" role="log" aria-label="Conversation">
              {activeMessages.map(({ id, role, content, attachment_name, comparison }) => (
                <div
                  key={id}
                  aria-label={role === 'user' ? 'You' : 'Assistant'}
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap ${role === 'user' ? 'self-end rounded-tr-sm bg-[#29433e]' : 'self-start rounded-tl-sm bg-[#303638]'}`}
                >
                  {attachment_name && <span className="mb-1 block truncate text-[11px] text-[#c0ddd5]" title={attachment_name}>{attachment_name}</span>}
                  {content}
                  {comparison && (
                    <p className="mt-1.5 text-[11px] text-[#c0ddd5]">
                      {comparison.area ? 'Selected area · ' : ''}Wayback releases<br />
                      {formatReleaseDate(comparison.before.release_date)} → {formatReleaseDate(comparison.after.release_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {localConversation ? (
            <div className="border-t border-[#303436] p-4 text-xs text-[#adb4b3]">
              <p>This earlier chat is saved in this browser.</p>
              <button type="button" onClick={newChat} className="mt-2 cursor-pointer text-[#a8dfd2] underline">New chat</button>
            </div>
          ) : <form
            className="shrink-0 border-t border-[#303436] px-4 pt-3 pb-4"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            {drawing && <p className="mb-2 text-[11px] text-[#bcd6d0]" role="status">Drag on the map to draw a rectangle.</p>}
            {error && <p className="mb-2 text-xs text-[#f7b9b9]" role="alert">{error}</p>}
            <fieldset disabled={busy} className="grid min-w-0 gap-1.5 rounded-xl border border-[#42494a] bg-[#232729] p-2.5 focus-within:border-[#779a91]">
              <div className="flex flex-wrap gap-1.5">
                {area ? (
                  <Badge asChild variant="outline" className={`${TOOL_BADGE} border-[#45625c] bg-[#293b37] text-[#d5ede7]`}>
                    <button type="button" aria-label="Area set, clear selected area" title="Clear selected area" onClick={onClear}>
                      <SquareDashed aria-hidden="true" />
                      Area set
                      <X aria-hidden="true" />
                    </button>
                  </Badge>
                ) : (
                  <Badge asChild variant="outline" className={TOOL_BADGE}>
                    <button type="button" aria-pressed={drawing} title={drawing ? 'Cancel drawing' : undefined} disabled={!ready} onClick={onDraw}>
                      <SquareDashed aria-hidden="true" />
                      Select area
                    </button>
                  </Badge>
                )}
                <Badge asChild variant="outline" className={TOOL_BADGE}>
                  <button type="button" onClick={() => imagePicker.current?.click()}>
                    <Upload aria-hidden="true" />
                    Upload imagery
                  </button>
                </Badge>
                <input
                  ref={imagePicker}
                  type="file"
                  aria-label="Choose imagery"
                  accept="image/png,image/jpeg,image/tiff,.png,.jpg,.jpeg,.tif,.tiff"
                  hidden
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) setImage(file)
                    event.currentTarget.value = ''
                  }}
                />
              </div>
              {image && (
                <div className="flex w-fit max-w-full items-center gap-1.5 rounded-md border border-[#45625c] bg-[#293b37] px-2 py-1 text-[11px] text-[#d5ede7]">
                  <ImageIcon size={13} className="shrink-0" aria-hidden="true" />
                  <span className="truncate" role="status" title={image.name}>{image.name}</span>
                  <button
                    type="button"
                    aria-label="Remove attached image"
                    onClick={() => setImage(null)}
                    className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-sm hover:bg-[#45625c] focus-visible:outline-2 focus-visible:outline-teal-300"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
              )}
              <textarea
                rows={2}
                maxLength={2000}
                aria-label="Message"
                placeholder="Type a message…"
                className="w-full min-w-0 resize-none bg-transparent px-1 pt-1 text-[13px] leading-5 outline-none placeholder:text-[#999f9e]"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <div className="flex items-center justify-end gap-2">
                {pending === 'send' && <span role="status" className="text-[11px] text-[#adb4b3]">Sending…</span>}
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={drawing || (!draft.trim() && !image && !area)}
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#a8dfd2] text-[#172c28] hover:bg-[#c1f3e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-default disabled:opacity-50"
                >
                  <ArrowUp size={17} aria-hidden="true" />
                </button>
              </div>
            </fieldset>
          </form>}
        </TabsContent>
        <TabsContent value="history" className="min-h-0 overflow-y-auto p-4 data-[state=inactive]:hidden">
          <button
            type="button"
            disabled={busy}
            onClick={newChat}
            className="mb-3 w-full cursor-pointer rounded-md border border-[#42494a] px-3 py-2 text-xs font-medium hover:bg-[#303638] focus-visible:outline-2 focus-visible:outline-teal-300 disabled:opacity-50"
          >
            New chat
          </button>
          {busy && <p role="status" className="mb-2 text-xs text-[#adb4b3]">{pending === 'open' ? 'Opening chat…' : 'Loading history…'}</p>}
          {error && (
            <p className="mb-2 text-xs text-[#f7b9b9]" role="alert">
              {error} <button type="button" className="cursor-pointer underline" onClick={() => void loadHistory()}>Reload history</button>
            </p>
          )}
          {!busy && !error && history.length === 0 && localHistory.length === 0
            && <p className="text-xs leading-relaxed text-[#adb4b3]">Your conversations will appear here.</p>}
          <ul className="grid gap-1.5">
            {history.map(({ id, title, updated_at }) => (
              <li key={id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-current={id === activeId ? 'true' : undefined}
                  onClick={() => void openConversation(id)}
                  className="block w-full cursor-pointer rounded-md px-3 py-2 text-left hover:bg-[#2a3231] focus-visible:outline-2 focus-visible:outline-teal-300 aria-current:bg-[#252e2c] disabled:opacity-50"
                >
                  <span className="block truncate text-xs font-medium">{title}</span>
                  <time dateTime={updated_at} className="mt-1 block text-[11px] text-[#adb4b3]">
                    {HISTORY_DATE.format(new Date(updated_at))}
                  </time>
                </button>
              </li>
            ))}
          </ul>
          {localHistory.length > 0 && (
            <div className="mt-4 border-t border-[#303436] pt-3">
              <p className="mb-1 text-xs text-[#adb4b3]">Earlier chats on this browser</p>
              <ul className="grid gap-1.5">
                {localHistory.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openLocalConversation(conversation)}
                      className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs hover:bg-[#2a3231] focus-visible:outline-2 focus-visible:outline-teal-300 disabled:opacity-50"
                    >
                      <span className="block truncate">{conversation.messages[0].content || conversation.messages[0].attachment_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}
