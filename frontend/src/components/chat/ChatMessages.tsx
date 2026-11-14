
// open chat's title and its messages

import { useEffect, useRef } from 'react'

import MessageImages from './MessageImages'
import type { Message } from '@/types'

type ChatMessagesProps = {
    title: string          // title of the open chat
    messages: Message[]    // its messages, oldest first
}

export default function ChatMessages({ title, messages }: ChatMessagesProps) {

    // points to the message list so we can scroll it
    const listRef = useRef<HTMLDivElement>(null)

    // every time messages change, scroll to the newest one
    useEffect(() => {

        const list = listRef.current
        
        if (list) {
            list.scrollTop = list.scrollHeight
        }

    }, [messages])

    return (
        <>
            {/* title of the open chat */}
            <p className="truncate border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                {title}
            </p>

            {/* message list */}
            <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 scrollbar-thin">

                {/* hint shown only while the chat is empty */}
                {messages.length === 0 && (
                    
                    <p className="m-auto max-w-56 text-center text-sm text-muted-foreground">
                        Click + to add images, then ask a question about them.
                    </p>
                )}
                

                {messages.map((m) => (
                    
                    // one message and images (if any) above its text bubble
                    <div
                        key={m.id}
                        className={
                            m.role === 'user'
                                ? 'flex max-w-[85%] flex-col items-end gap-1.5 self-end'
                                : 'flex max-w-[85%] flex-col items-start gap-1.5 self-start'
                        }
                    >
                        {m.pair && <MessageImages pair={m.pair} />}

                        {m.content && (

                            <div
                                // user messages on the right (dark), assistant on the left (light)
                                className={
                                    m.role === 'user'
                                        ? 'wrap-anywhere rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                                        : 'wrap-anywhere rounded-lg bg-muted px-3 py-2 text-sm'
                                }
                            >
                                {m.content}
                            </div>

                        )}

                    </div>

                ))}

            </div>

        </>

    );
    
}