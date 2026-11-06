import { useEffect, useRef, useState, type SubmitEvent } from "react"
import { Button } from "./ui/button";
import { ArrowUp, MessageSquare, X } from "lucide-react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { SAMPLE_CHATS } from "@/sampleData";
import type { Message } from "@/types"; 


export default function ChatPanel() {

    const [open, setOpen] = useState(true);

    const [messages, setMessages] = useState<Message[]>([]);

    const [draft, setDraft] = useState('');


    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight; // scroll down by the list height
        }
    }, [messages]);

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

    if(!open){

        return(

            <Button
                size="icon-lg"
                className="absolute right-4 bottom-10 z-1000 cursor-pointer size-11 rounded-full"
                aria-label="Open chat"
                onClick={() => setOpen(true)}
            >

                <MessageSquare className="size-5" />
            
            </Button>

        )
    }

    return (

        <Card className="absolute right-4 bottom-10 z-1000 flex h-96 w-85 flex-col gap-0 p-0">
            
            <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col">
                
                {/* Chat History tabs + close button */}
                <div className="flex items-center justify-between border-b p-2">
                    
                    <TabsList>
                        
                        <TabsTrigger value="chat">
                            Chat
                        </TabsTrigger>
                        
                        <TabsTrigger value="history">
                            History
                        </TabsTrigger>
                    
                    </TabsList>
                    
                    <Button variant="ghost" size="icon-xs" aria-label="Close chat" onClick={() => setOpen(false)}>
                        <X />
                    </Button>
                
                </div>

                {/* CHAT TAB */}
                <TabsContent value="chat" className="flex min-h-0 flex-1 flex-col">
                    
                    {/* message list */}
                    <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 scrollbar-thin">
                        
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
                    <form onSubmit={handleSend} className="flex gap-2 border-t p-2">
                        
                        <Input
                            placeholder="Type a message..."
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)} // update draft as the user types
                        />

                        <Button type="submit" size="icon" aria-label="Send message">
                            <ArrowUp />
                        </Button>

                    </form>

                </TabsContent>

                {/* HISTORY TAB SAMPLE CHATS FOR NOW, newest first */}
                <TabsContent value="history" className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    
                    {SAMPLE_CHATS.map((chat) => (

                        <button
                            key={chat.id}
                            className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-muted"
                        >
                            <span className="text-sm font-medium">{chat.title}</span>

                            <span className="text-xs text-muted-foreground">
                                {new Date(chat.updated_at).toLocaleString()} {/* readable local date/time */}
                            </span>
                        
                        </button>
                    ))}


                </TabsContent>

            </Tabs>

        </Card>

    );
}
