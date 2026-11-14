// Chat button

import { useEffect, useRef, useState, type SubmitEvent } from "react"
import { Button } from "./ui/button";
import { ArrowUp, ImageIcon, MessageSquare, Plus, X } from "lucide-react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { SAMPLE_CHATS, SAMPLE_IMAGES } from "@/sampleData";
import type { Message } from "@/types"; 

// pill style for tabs
const TAB_PILL =
    "flex-none cursor-pointer rounded-full border-border bg-background px-3.5 text-foreground/70 " +
    "data-[state=active]:border-primary data-[state=active]:bg-primary " +
    "data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";


type ChatPanelProps = {
    onAddImages?: () => void
}

export default function ChatPanel({ onAddImages }: ChatPanelProps) {

    // panel showing
    const [open, setOpen] = useState(true);

    // messages in current chat
    const [messages, setMessages] = useState<Message[]>([]);

    // typed in the message box
    const [draft, setDraft] = useState('');


    // points to the message list so you can scroll it
    const listRef = useRef<HTMLDivElement>(null);

    // every time messages change scroll to the newest one
    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight; // scroll down by the list height
        }
    }, [messages]);

    // runs on enter or the send button
    function handleSend(event: SubmitEvent<HTMLFormElement>){


        event.preventDefault();
        
        const text = draft.trim();
        
        if (!text){
            return;
        }

        setMessages([
            ...messages,
            {id: Date.now(), role: 'user', content: text},
            {id: Date.now() + 1, role: 'assistant', content: '(The model is not connected yet.)' },

        ])
        setDraft('');
    }

    // collapsed 
    if(!open){

        return(

            <Button
                size="icon-lg"
                className="absolute right-4 bottom-10 z-10 cursor-pointer size-11 rounded-full"
                aria-label="Open chat"
                onClick={() => setOpen(true)}
            >

                <MessageSquare className="size-5" />
            
            </Button>

        )
    }

    return (

        <Card className="absolute right-4 bottom-10 z-10 flex h-96 w-85 flex-col gap-0 overflow-hidden p-0 shadow-md">
            
            <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col gap-0">
                
                {/* Chat History tabs + close button */}
                <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                    
                    <TabsList className="gap-2 bg-transparent p-0">
                        
                        <TabsTrigger value="chat" className={TAB_PILL}>
                            Chat
                        </TabsTrigger>
                        
                        <TabsTrigger value="history" className={TAB_PILL}>
                            History
                        </TabsTrigger>

                        <TabsTrigger value="library" className={TAB_PILL}>
                            Library
                        </TabsTrigger>
                    
                    </TabsList>
                    
                    <Button variant="outline" size="icon-sm" className="cursor-pointer rounded-full hover:border-destructive/40 hover:bg-destructive/20 hover:text-destructive" aria-label="Close chat" onClick={() => setOpen(false)}>
                        <X className="size-3.5"/>
                    </Button>
                
                </div>

                {/* CHAT TAB */}
                <TabsContent value="chat" className="flex min-h-0 flex-1 flex-col">
                    
                    {/* message list */}
                    <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 scrollbar-thin">
                        
                        {/* hint shown only while the chat is empty */}
                        {messages.length === 0 && (

                            <p className="m-auto max-w-56 text-center text-sm text-muted-foreground">
                                Click + to add images, then ask a question about them.
                            </p>
                        )}
                        {messages.map((m) => (

                            <div

                                key={m.id}
                                // user messages on the right (dark), assistant on the left (light)
                                className={
                                m.role === 'user'
                                    ? 'max-w-[85%] wrap-anywhere self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                                    : 'max-w-[85%] wrap-anywhere self-start rounded-lg bg-muted px-3 py-2 text-sm'
                                }
                            >
                                {m.content}
                            </div>

                        ))}

                    </div>

                    {/* message box + send button */}
                    <form onSubmit={handleSend} className="flex gap-2 border-t bg-muted/50 p-3">
                        

                        <Button type="button" variant="outline" size="icon-lg" className="size-10 cursor-pointer rounded-xl" aria-label="Add images" onClick={onAddImages}>
                            <Plus />
                        </Button>


                        <Input
                            className="h-10 rounded-xl bg-background px-3"
                            placeholder="Type a message..."
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)} // update draft as the user types
                        />

                        <Button type="submit" size="icon-lg" className="size-10 cursor-pointer rounded-xl" aria-label="Send message">
                            <ArrowUp />
                        </Button>

                    </form>

                </TabsContent>

                {/* HISTORY TAB SAMPLE CHATS FOR NOW, newest first */}
                <TabsContent value="history" className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    
                    {SAMPLE_CHATS.map((chat) => (

                        <button
                            key={chat.id}
                            className="flex w-full cursor-pointer flex-col rounded-md px-3 py-2 text-left hover:bg-muted"
                        >
                            <span className="text-sm font-medium">{chat.title}</span>

                            <span className="text-xs text-muted-foreground">
                                {new Date(chat.updated_at).toLocaleString()} {/* readable local date/time */}
                            </span>
                        
                        </button>
                    ))}


                </TabsContent>

                <TabsContent value="library" className="flex-1 overflow-y-auto p-3 scrollbar-thin">

                    {/* grid 2 */}
                    <div className="grid grid-cols-2 gap-3">

                        {SAMPLE_IMAGES.map((img) => (

                            <button key={img.id} className="flex cursor-pointer flex-col gap-1.5 rounded-lg p-1 text-left hover:bg-muted">

                                {/* square preview; an image icon until real thumbnails exist */}
                                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted/50">
                                    {img.thumb_url
                                        ? <img src={img.thumb_url} alt="" className="size-full object-cover" />
                                        : <ImageIcon className="size-6 text-muted-foreground" />}
                                </div>

                                {/* "Snapshot" or "Upload", and the date it was saved */}
                                <span className="px-0.5 text-xs font-medium capitalize">
                                    {img.source}
                                </span>

                                <span className="px-0.5 text-xs text-muted-foreground">
                                    {new Date(img.created_at).toLocaleDateString()}
                                </span>

                            </button>
                        ))}

                    </div>

                </TabsContent>

            </Tabs>

        </Card>

    );
}
