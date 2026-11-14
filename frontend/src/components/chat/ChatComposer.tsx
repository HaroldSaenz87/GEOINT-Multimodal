
import { useState, type SubmitEvent } from 'react'
import { ArrowUp, Plus, X } from 'lucide-react'

import ImageThumb from '@/components/shared/ImageThumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ImagePair } from '@/types'

type ChatComposerProps = {
    attached: ImagePair | null           // images waiting to be sent (null = none)
    onAddImages: () => void              // + clicked
    onRemoveBefore: () => void           // drop the before image (single-image analysis)
    onRemovePair: () => void             // drop both images
    onSend: (text: string) => void       // send clicked (text may be empty if images are attached)
}

// small round X in the corner of a thumbnail
const REMOVE_X =
    "absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm hover:text-destructive";

export default function ChatComposer({ attached, onAddImages, onRemoveBefore, onRemovePair, onSend }: ChatComposerProps) {

    // what's typed in the message box
    const [draft, setDraft] = useState('')

    // runs on Enter or the send button
    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {

        event.preventDefault()
        
        const text = draft.trim()
        
        if (!text && !attached) {
            return // nothing to send
        }
        
        onSend(text)
        
        setDraft('')
    }

    return (

        // gray footer
        <div className="flex flex-col gap-2 border-t bg-muted/50 p-3">

            {/* attached before/after images */}
            {attached && (
                
                <div className="flex items-center gap-2">

                    {/* before: X removes just the before image */}
                    <div className="relative">
                        
                        <ImageThumb image={attached.before} label="Before" className="size-16" />
                        
                        {attached.before && (
                            
                            <button type="button" className={REMOVE_X} aria-label="Remove before image" onClick={onRemoveBefore}>
                                <X className="size-3" />
                            </button>
                        
                        )}

                    </div>

                    {/* after: required, so X removes both */}
                    <div className="relative">
                        
                        <ImageThumb image={attached.after} label="After" className="size-16" />
                        
                        <button type="button" className={REMOVE_X} aria-label="Remove images" onClick={onRemovePair}>
                            <X className="size-3" />
                        </button>
                    
                    </div>

                    {/* note when only the after image is attached */}
                    {!attached.before && (
                        
                        <p className="text-xs text-muted-foreground">
                            No before image. Damage will be rated from the after image only.
                        </p>

                    )}

                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                
                {/* type="button" so + doesn't send the message */}
                
                <Button type="button" variant="outline" size="icon-lg" className="size-10 cursor-pointer rounded-xl" aria-label="Add images" onClick={onAddImages}>
                    <Plus />
                </Button>
                
                <Input
                    className="h-10 rounded-xl bg-background px-3"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />
                
                <Button type="submit" size="icon-lg" className="size-10 cursor-pointer rounded-xl" aria-label="Send message">
                    <ArrowUp />
                </Button>
            
            </form>
        
        </div>
    );
    
}