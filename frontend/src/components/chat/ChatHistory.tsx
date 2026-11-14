
import { EllipsisVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import type { Chat } from '@/types'

type ChatHistoryProps = {
    chats: Chat[]                      // chats to list, newest first
    activeChatId: number | null        // the chat currently open (null = new, unsaved chat)
    onSelect: (id: number) => void     // open a chat
    onDelete: (id: number) => void     // delete a chat
    onNewChat: () => void              // start a new, empty chat
}

export default function ChatHistory({ chats, activeChatId, onSelect, onDelete, onNewChat }: ChatHistoryProps) {
    
    return (

        <div className="flex flex-col gap-2">

            {/* start a new chat */}
            <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={onNewChat}>
                <Plus /> New chat
            </Button>

            {chats.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No chats yet.</p>
            )}

            {chats.map((chat) => {

                const isActive = chat.id === activeChatId

                return (

                    // group lets the button react when the whole row is hovered
                    <div
                        key={chat.id}
                        className={
                            'group flex items-center gap-1 rounded-lg pr-1 ' +
                            (isActive ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/60')
                        }
                    >
                        
                        {/* clicking the row opens the chat */}
                        <button
                            className="flex min-w-0 flex-1 cursor-pointer flex-col px-3 py-2 text-left"
                            onClick={() => onSelect(chat.id)}
                        >
                           
                            <span className="flex items-center gap-2 text-sm font-medium">
                               
                                {/* green dot on the open chat */}
                                {isActive && <span className="size-2 shrink-0 rounded-full bg-green-500 animate-pulse" />}
                                
                                <span className="truncate">
                                    {chat.title}
                                </span>

                            </span>

                            <span className="text-xs text-muted-foreground">
                                {new Date(chat.updated_at).toLocaleString()}
                            </span>

                        </button>

                        {/* menu with Delete */}
                        <DropdownMenu>

                            <DropdownMenuTrigger asChild>
                                
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                    aria-label={`Options for ${chat.title}`}
                                >
                                    <EllipsisVertical />
                                </Button>
                            
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent align="end" className="w-32">
                            
                                <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={() => onDelete(chat.id)}>
                                    <Trash2 /> Delete
                                </DropdownMenuItem>
                            
                            </DropdownMenuContent>
                        
                        </DropdownMenu>
                    
                    </div>

                )
            })}

        </div>

    );

}