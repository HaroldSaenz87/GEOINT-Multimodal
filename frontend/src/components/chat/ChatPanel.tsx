// chat

import { useState } from "react"
import { MessageSquare, X } from "lucide-react";

import ChatComposer from "./ChatComposer";
import ChatHistory from "./ChatHistory";
import ChatMessages from "./ChatMessages";
import ImageLibrary from "../library-chat/ImageLibrary";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SAMPLE_CHATS, SAMPLE_IMAGES, SAMPLE_MESSAGES } from "@/sampleData";
import type { Chat, ImagePair, Message } from "@/types";

// pill style for tabs
const TAB_PILL =
    "flex-none cursor-pointer rounded-full border-border bg-background px-3.5 text-foreground/70 " +
    "data-[state=active]:border-primary data-[state=active]:bg-primary " +
    "data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

// longest title made from a first message
const MAX_TITLE = 40;

type ChatPanelProps = {
    onAddImages?: () => void // runs when + is clicked (opens the Map Images sidebar)
}

export default function ChatPanel({ onAddImages }: ChatPanelProps) {

    const [open, setOpen] = useState(true);                       // is the panel showing?

    const [tab, setTab] = useState("chat");                       // which tab is showing
    const [chats, setChats] = useState<Chat[]>(SAMPLE_CHATS);     // all chats, newest first
    
    const [messagesByChat, setMessagesByChat] =
        useState<Record<number, Message[]>>(SAMPLE_MESSAGES);     // each chat's messages, by chat id
    const [activeChatId, setActiveChatId] = useState<number | null>(null); // open chat (null = new chat)
        const [attached, setAttached] = useState<ImagePair | null>(null); 

    // messages and title of the open chat
    const messages = activeChatId !== null ? messagesByChat[activeChatId] ?? [] : [];
    
    const activeTitle = chats.find((c) => c.id === activeChatId)?.title ?? "New chat";

    // Composer: send a message (with any attached images)
    function handleSend(text: string) {
    
        const now = new Date().toISOString();
    
        const newMessages: Message[] = [
                        { id: Date.now(), role: 'user', content: text, pair: attached ?? undefined },
            { id: Date.now() + 1, role: 'assistant', content: '(The model is not connected yet.)' },
        ];

        if (activeChatId === null) {
    
            // first message of a new chat: create the chat, titled from the message
            const firstLine = text || "Damage analysis";
            
            const title = firstLine.length > MAX_TITLE ? firstLine.slice(0, MAX_TITLE) + "..." : firstLine;
            
            const newChat: Chat = { id: Date.now(), title, updated_at: now };

            setChats([newChat, ...chats]);
            
            setMessagesByChat({ ...messagesByChat, [newChat.id]: newMessages });
            
            setActiveChatId(newChat.id);
        } 
        else {

            // existing chat: add the messages and move it to the top of History
            setMessagesByChat({ ...messagesByChat, [activeChatId]: [...messages, ...newMessages] });
            
            const updated = chats.find((c) => c.id === activeChatId);
            
            if (updated) {
                setChats([{ ...updated, updated_at: now }, ...chats.filter((c) => c.id !== activeChatId)]);
            }
        }


        setAttached(null);  // the images went with this message
    }

    // Composer: + opens the Map Images sidebar
    function handleAddImages() {
        
         onAddImages?.();
    }

    
        
    function handleRemoveBefore() {
        
        if (attached) {
            setAttached({ ...attached, before: null });
        }
    }

    // History: open a chat and show it in the Chat tab
    function handleSelect(id: number) {
        
        setActiveChatId(id);
        
        setTab("chat");
    }

    // History: start a new, empty chat
    function handleNewChat() {
        
        setActiveChatId(null);
        
        setAttached(null);
        
        setTab("chat");
    }

    // History: delete a chat and its messages
    function handleDelete(id: number) {
        
        setChats(chats.filter((c) => c.id !== id));
        
        const rest = { ...messagesByChat };
        
        delete rest[id];
        
        setMessagesByChat(rest);
        
        if (id === activeChatId) {
            setActiveChatId(null);
        }
    }

    // collapsed: round chat button
    if (!open) {
        
        return (

            <Button
                size="icon-lg"
                className="absolute right-4 bottom-10 z-10 size-11 cursor-pointer rounded-full"
                aria-label="Open chat"
                onClick={() => setOpen(true)}
            >
                <MessageSquare className="size-5" />
            </Button>
        );

    }

    return (
        
        <Card className="absolute right-4 bottom-10 z-10 flex h-96 w-85 flex-col gap-0 overflow-hidden p-0 shadow-md">
            
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">

                {/* gray header: 3 tab pills + round close button */}
                <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                    
                    <TabsList className="gap-2 bg-transparent p-0">
                    
                        <TabsTrigger value="chat" className={TAB_PILL}>Chat</TabsTrigger>
                    
                        <TabsTrigger value="history" className={TAB_PILL}>History</TabsTrigger>
                    
                        <TabsTrigger value="library" className={TAB_PILL}>Library</TabsTrigger>
                    
                    </TabsList>
                    
                    <Button variant="outline" size="icon-sm" className="cursor-pointer rounded-full hover:border-destructive/40 hover:bg-destructive/20 hover:text-destructive" aria-label="Close chat" onClick={() => setOpen(false)}>
                        <X className="size-3.5" />
                    </Button>
                
                </div>

                {/* CHAT TAB (stays on the page while hidden, so it keeps its scroll and typed text) */}
                <TabsContent value="chat" forceMount className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
                    
                    <ChatMessages title={activeTitle} messages={messages} />
                
                    
                    <ChatComposer
                        key={activeChatId ?? "new"}
                        attached={attached}
                        onAddImages={handleAddImages}
                        onRemoveBefore={handleRemoveBefore}
                        onRemovePair={() => setAttached(null)}
                        onSend={handleSend}
                    />

                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                    
                    <ChatHistory
                        chats={chats}
                        activeChatId={activeChatId}
                        onSelect={handleSelect}
                        onDelete={handleDelete}
                        onNewChat={handleNewChat}
                    />

                </TabsContent>

                {/* LIBRARY TAB */}
                <TabsContent value="library" className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                    <ImageLibrary images={SAMPLE_IMAGES} />
                </TabsContent>

            </Tabs>
            
        </Card>
    );
}