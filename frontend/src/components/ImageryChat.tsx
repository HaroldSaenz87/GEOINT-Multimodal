import { ArrowUp, ImageIcon, SquareDashed, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AreaSelection } from '@/lib/imagery'
import type { DrawState } from './SanibelMap'

type Props = {
  area: AreaSelection | null
  drawState: DrawState
  onDraw: () => void
  onClear: () => void
}

type Message = { role: 'user'; text: string; imageName?: string }
type Conversation = { id: string; updatedAt: number; messages: Message[] }

const HISTORY_KEY = 'geoint.chat-history.v1'
const HISTORY_DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const TOOL_BADGE = 'h-7 cursor-pointer border-[#485051] px-1.5 text-[11px] text-[#e3e9e6] hover:bg-[#333b3a] disabled:cursor-default disabled:opacity-50 aria-pressed:border-[#69b5a8] aria-pressed:bg-[#293b37]'

function loadHistory(): Conversation[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]') as unknown
    if (Array.isArray(saved)) {
      const history: Conversation[] = []
      for (const item of saved) {
        if (typeof item?.id !== 'string' || !Number.isFinite(item.updatedAt) || !Array.isArray(item.messages)) continue
        const messages = item.messages.filter((message: unknown): message is Message =>
          typeof message === 'object' && message !== null
          && 'role' in message && message.role === 'user'
          && 'text' in message && typeof message.text === 'string'
          && (!('imageName' in message) || typeof message.imageName === 'string'))
        if (messages.length) history.push({ id: item.id, updatedAt: item.updatedAt, messages })
      }
      return history
    }
  } catch {
    // History remains usable in memory when storage is unavailable.
  }
  return []
}

export default function ImageryChat({ area, drawState, onDraw, onClear }: Props) {
  const [tab, setTab] = useState('chat')
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [activeId, setActiveId] = useState<string | null>(() => history[0]?.id ?? null)
  const [image, setImage] = useState<File | null>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const imagePicker = useRef<HTMLInputElement>(null)
  const activeMessages = history.find(({ id }) => id === activeId)?.messages
  const ready = drawState !== 'loading' && drawState !== 'starting'
  const drawing = drawState === 'drawing'

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      // Keep the conversation available in this tab if saving fails.
    }
  }, [history])

  useEffect(() => {
    const element = scrollArea.current
    if (element) element.scrollTop = element.scrollHeight
  }, [activeMessages, tab])

  function openConversation(id: string | null) {
    setActiveId(id)
    setDraft('')
    setImage(null)
    setTab('chat')
  }

  function send(sentAt: number) {
    const message = draft.trim()
    if (!message && !image) return
    const id = activeId ?? crypto.randomUUID()
    const conversation: Conversation = {
      id,
      updatedAt: sentAt,
      messages: [...(activeMessages ?? []), { role: 'user', text: message, imageName: image?.name }],
    }
    setHistory((previous) => [conversation, ...previous.filter((item) => item.id !== id)])
    setActiveId(id)
    setDraft('')
    setImage(null)
  }

  return (
    <aside aria-label="Imagery chat" className="dark z-10 flex min-h-0 min-w-0 flex-col border-r border-[#303436] bg-[#191c1e] text-[#f1f3f3] max-sm:row-start-2 max-sm:border-t max-sm:border-r-0">
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 min-w-0 flex-1 gap-0">
        <TabsList variant="line" aria-label="Chat views" className="w-full shrink-0 border-b border-[#303436] px-4 group-data-horizontal/tabs:h-11">
          <TabsTrigger value="chat" className="text-xs after:bg-[#9ad9cc]">Chat</TabsTrigger>
          <TabsTrigger value="history" className="text-xs after:bg-[#9ad9cc]">History</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex min-h-0 flex-col data-[state=inactive]:hidden">
          <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3" role="log" aria-label="Conversation">
              {activeMessages?.map(({ text, imageName }, index) => (
                <div
                  key={`${activeId}-${index}`}
                  aria-label="You"
                  className="max-w-[92%] self-end rounded-xl rounded-tr-sm bg-[#29433e] px-3.5 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap"
                >
                  {imageName && <span className="mb-1 block truncate text-[11px] text-[#c0ddd5]" title={imageName}>{imageName}</span>}
                  {text}
                </div>
              ))}
            </div>
          </div>
          <form
            className="shrink-0 border-t border-[#303436] px-4 pt-3 pb-4"
            onSubmit={(event) => {
              event.preventDefault()
              send(Date.now())
            }}
          >
            {drawing && <p className="mb-2 text-[11px] text-[#bcd6d0]" role="status">Drag on the map to draw a rectangle.</p>}
            <div className="grid gap-1.5 rounded-xl border border-[#42494a] bg-[#232729] p-2.5 focus-within:border-[#779a91]">
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
                  accept="image/*,.tif,.tiff"
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
              <div className="flex justify-end">
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!draft.trim() && !image}
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#a8dfd2] text-[#172c28] hover:bg-[#c1f3e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-default disabled:opacity-50"
                >
                  <ArrowUp size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="history" className="min-h-0 overflow-y-auto p-4 data-[state=inactive]:hidden">
          {history.length === 0 ? (
            <p className="text-xs leading-relaxed text-[#adb4b3]">Your conversations will appear here.</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openConversation(null)}
                className="mb-3 w-full cursor-pointer rounded-md border border-[#42494a] px-3 py-2 text-xs font-medium hover:bg-[#303638] focus-visible:outline-2 focus-visible:outline-teal-300"
              >
                New chat
              </button>
              <ul className="grid gap-1.5">
                {history.map(({ id, messages, updatedAt }) => (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={id === activeId ? 'true' : undefined}
                      onClick={() => openConversation(id)}
                      className="block w-full cursor-pointer rounded-md px-3 py-2 text-left hover:bg-[#2a3231] focus-visible:outline-2 focus-visible:outline-teal-300 aria-current:bg-[#252e2c]"
                    >
                      <span className="block truncate text-xs font-medium">{messages[0].text || messages[0].imageName}</span>
                      <time dateTime={new Date(updatedAt).toISOString()} className="mt-1 block text-[11px] text-[#adb4b3]">
                        {HISTORY_DATE.format(updatedAt)}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}
