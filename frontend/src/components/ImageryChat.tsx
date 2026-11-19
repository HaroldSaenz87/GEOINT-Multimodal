import { ArrowUp, ImageIcon, SquareDashed, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getChatMessages, getChats, sendChatMessage } from '@/lib/chat'
import type { Chat, ChatMessage, MessageDraft } from '@/lib/chat'
import { formatReleaseDate } from '@/lib/imagery'
import type { AreaSelection, ImageryPair, ImagerySide } from '@/lib/imagery'
import type { DrawState } from './SanibelMap'

type Props = {
  area: AreaSelection | null
  drawState: DrawState
  onDraw: () => void
  onClear: () => void
  getImagery: () => ImageryPair | null
}

type LocalChat = { id: string; title: string; messages: ChatMessage[] }
type Conversation = { id: number | string | null; messages: ChatMessage[] }
type UploadSelection = Record<ImagerySide, File | null>
type ChatAction = 'history' | 'open' | 'send'

const HISTORY_KEY = 'geoint.chat-history.v1'
const MAX_UPLOAD = 20 * 1024 * 1024
const HISTORY_DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const TOOL_BADGE = 'h-7 cursor-pointer border-[#485051] px-1.5 text-[11px] text-[#e3e9e6] hover:bg-[#333b3a] disabled:cursor-default disabled:opacity-50 aria-pressed:border-[#69b5a8] aria-pressed:bg-[#293b37]'

function loadLocalHistory(): LocalChat[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.flatMap((chat) => {
      if (typeof chat?.id !== 'string' || !Array.isArray(chat.messages)) return []
      const savedMessages: unknown[] = chat.messages
      const messages = savedMessages.flatMap((message, index): ChatMessage[] => {
        if (!message || typeof message !== 'object' || !('role' in message) || message.role !== 'user'
          || !('text' in message) || typeof message.text !== 'string') return []
        return [{
          id: index,
          role: 'user',
          content: message.text,
          attachment_name: 'imageName' in message && typeof message.imageName === 'string' ? message.imageName : null,
        }]
      })
      if (!messages.length) return []
      const first = messages[0]
      return [{ id: chat.id, title: first.content || first.attachment_name || 'Earlier chat', messages }]
    })
  } catch {
    return []
  }
}

function UploadSlot({ label, file, onChange }: {
  label: 'Before image' | 'After image'
  file: File | null
  onChange: (file: File | null) => void
}) {
  const picker = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLImageElement>(null)
  const [failedPreview, setFailedPreview] = useState<File | null>(null)
  const showPreview = file && file !== failedPreview && file.type !== 'image/tiff' && !/\.tiff?$/i.test(file.name)

  useEffect(() => {
    const image = preview.current
    if (!file || !image) return
    const url = URL.createObjectURL(file)
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, showPreview])

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#485051] p-1.5 text-left text-[11px]">
      {showPreview ? (
        <img ref={preview} alt="" className="size-8 shrink-0 rounded-sm object-cover" onError={() => setFailedPreview(file)} />
      ) : (
        <ImageIcon size={16} aria-hidden="true" className="mx-2 shrink-0 text-[#a8beb8]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        {file && <p className="truncate text-[#c0ddd5]" title={file.name}>{file.name}</p>}
      </div>
      <button
        type="button"
        aria-label={`${file ? 'Remove' : 'Choose'} ${label}`}
        onClick={() => file ? onChange(null) : picker.current?.click()}
        className="grid h-8 shrink-0 cursor-pointer place-items-center rounded-sm px-2 text-[#a8dfd2] hover:bg-[#333b3a] focus-visible:outline-2 focus-visible:outline-teal-300"
      >
        {file ? <X size={14} aria-hidden="true" /> : 'Choose'}
      </button>
      <input
        ref={picker}
        type="file"
        accept="image/png,image/jpeg,image/tiff,.png,.jpg,.jpeg,.tif,.tiff"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onChange(file)
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}

export default function ImageryChat({ area, drawState, onDraw, onClear, getImagery }: Props) {
  const [tab, setTab] = useState('chat')
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<Chat[]>([])
  const [conversation, setConversation] = useState<Conversation>({ id: null, messages: [] })
  const [localHistory] = useState(loadLocalHistory)
  const [uploads, setUploads] = useState<UploadSelection | null>(null)
  const [pending, setPending] = useState<ChatAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastAttempt = useRef<{ id: string; payload: string; uploads: UploadSelection | null } | null>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const { id: chatId, messages } = conversation
  const archived = typeof chatId === 'string'
  const ready = drawState !== 'loading' && drawState !== 'starting'
  const drawing = drawState === 'drawing'
  const busy = pending !== null
  const images = uploads?.before && uploads.after ? { before: uploads.before, after: uploads.after } : null
  const canSend = !drawing && (uploads ? images !== null && !area : Boolean(draft.trim() || area))

  useEffect(() => {
    const element = scrollArea.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, tab])

  function switchConversation(next: Conversation) {
    setConversation(next)
    lastAttempt.current = null
    setDraft('')
    setUploads(null)
    setError(null)
    setTab('chat')
  }

  async function runRequest(
    action: ChatAction,
    work: () => Promise<void>,
    errorMessage?: string,
  ) {
    setPending(action)
    setError(null)
    try {
      await work()
    } catch (error) {
      setError(errorMessage ?? (error instanceof Error ? error.message : 'Could not send the message. Try again.'))
    } finally {
      setPending(null)
    }
  }

  function loadHistory() {
    return runRequest('history', async () => setHistory(await getChats()), 'Could not load chat history. Try again.')
  }

  function selectTab(next: string) {
    setTab(next)
    setError(null)
    if (next === 'history') void loadHistory()
  }

  function newChat() {
    switchConversation({ id: null, messages: [] })
  }

  function openChat(chat: Chat | LocalChat) {
    if ('messages' in chat) {
      switchConversation(chat)
      return
    }
    void runRequest('open', async () => {
      switchConversation({ id: chat.id, messages: await getChatMessages(chat.id) })
    }, 'Could not open this chat. Try again.')
  }

  function historyList(chats: (Chat | LocalChat)[]) {
    return (
      <ul className="grid gap-1.5">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              type="button"
              disabled={busy}
              aria-current={chat.id === chatId ? 'true' : undefined}
              onClick={() => openChat(chat)}
              className="block w-full cursor-pointer rounded-md px-3 py-2 text-left hover:bg-[#2a3231] focus-visible:outline-2 focus-visible:outline-teal-300 aria-current:bg-[#252e2c] disabled:opacity-50"
            >
              <span className="block truncate text-xs font-medium">{chat.title}</span>
              {'updated_at' in chat && (
                <time dateTime={chat.updated_at} className="mt-1 block text-[11px] text-[#adb4b3]">
                  {HISTORY_DATE.format(new Date(chat.updated_at))}
                </time>
              )}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  function selectUpload(side: ImagerySide, file: File | null) {
    if (file && file.size > MAX_UPLOAD) {
      setError(`${side === 'before' ? 'Before' : 'After'} image must be 20 MiB or smaller.`)
      return
    }
    setError(null)
    setUploads((current) => current && { ...current, [side]: file })
  }

  async function send() {
    if (busy || archived || !canSend) return
    const content = draft.trim()
    const imagery = area ? getImagery() : null
    if (area && !imagery) {
      setError('Wait for the map release dates to load, then send again.')
      return
    }
    const message: MessageDraft = {
      chat_id: chatId,
      content,
      comparison: area && imagery && {
        source: 'esri-wayback',
        before: { release_num: imagery.before.releaseNum, release_date: imagery.before.releaseDateLabel },
        after: { release_num: imagery.after.releaseNum, release_date: imagery.after.releaseDateLabel },
        area: area.geometry,
      },
    }
    await runRequest('send', async () => {
      const payload = JSON.stringify(message)
      if (lastAttempt.current?.payload !== payload || lastAttempt.current.uploads !== uploads) {
        lastAttempt.current = { id: crypto.randomUUID(), payload, uploads }
      }
      const saved = await sendChatMessage(message, lastAttempt.current.id, images)
      switchConversation({ id: saved.chat.id, messages: [...messages, saved.message] })
    })
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
              {messages.map(({ id, role, content, attachment_name, before_image_name, after_image_name, comparison }) => (
                <div
                  key={id}
                  aria-label={role === 'user' ? 'You' : 'Assistant'}
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap ${role === 'user' ? 'self-end rounded-tr-sm bg-[#29433e]' : 'self-start rounded-tl-sm bg-[#303638]'}`}
                >
                  {attachment_name && <span className="mb-1 block truncate text-[11px] text-[#c0ddd5]" title={attachment_name}>{attachment_name}</span>}
                  {before_image_name && after_image_name && (
                    <div className="mb-1 min-w-0 text-[11px] text-[#c0ddd5]">
                      <p className="truncate" title={before_image_name}>Before · {before_image_name}</p>
                      <p className="truncate" title={after_image_name}>After · {after_image_name}</p>
                    </div>
                  )}
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
          {archived ? (
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
              {uploads ? (
                <div className="grid min-w-0 gap-1.5">
                  <UploadSlot label="Before image" file={uploads.before} onChange={(file) => selectUpload('before', file)} />
                  <UploadSlot label="After image" file={uploads.after} onChange={(file) => selectUpload('after', file)} />
                  <p className="px-0.5 text-[10px] text-[#adb4b3]">PNG, JPEG, or TIFF · 20 MiB each</p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploads(null)
                      setError(null)
                    }}
                    className="justify-self-start px-0.5 text-[11px] text-[#a8dfd2] underline hover:text-[#c1f3e8]"
                  >
                    Cancel image pair
                  </button>
                </div>
              ) : (
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
                    <>
                      <Badge asChild variant="outline" className={TOOL_BADGE}>
                        <button type="button" aria-pressed={drawing} title={drawing ? 'Cancel drawing' : undefined} disabled={!ready} onClick={onDraw}>
                          <SquareDashed aria-hidden="true" />
                          Select area
                        </button>
                      </Badge>
                      <Badge asChild variant="outline" className={TOOL_BADGE}>
                        <button type="button" disabled={drawing || drawState === 'starting'} onClick={() => {
                          setError(null)
                          setUploads({ before: null, after: null })
                        }}>
                          <Upload aria-hidden="true" />
                          Upload image pair
                        </button>
                      </Badge>
                    </>
                  )}
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
                  disabled={!canSend}
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
          {historyList(history)}
          {localHistory.length > 0 && (
            <div className="mt-4 border-t border-[#303436] pt-3">
              <p className="mb-1 text-xs text-[#adb4b3]">Earlier chats on this browser</p>
              {historyList(localHistory)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}
