
import { useState } from 'react'
import { X } from 'lucide-react'

import ImageThumb from '@/components/shared/ImageThumb'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { ImagePair, MessageImage } from '@/types'

type MessageImagesProps = {
    pair: ImagePair
}

// what the popup shows: the image and its tag
type Preview = { image: MessageImage; label: string }

export default function MessageImages({ pair }: MessageImagesProps) {

    // the image shown in the popup (if null then popup closed)
    const [preview, setPreview] = useState<Preview | null>(null)

    // the two slots, in order
    const slots = [
        { label: 'Before', image: pair.before },
        { label: 'After', image: pair.after },
    ]

    return (

        <>

            {/* before | after, side by side */}
            <div className="grid w-56 grid-cols-2 gap-1.5">
                
                {slots.map((slot) =>

                    slot.image ? (
                        
                        <button
                            key={slot.label}
                            className="cursor-pointer rounded-md transition-opacity hover:opacity-85"
                            aria-label={`View ${slot.label.toLowerCase()} image`}
                            onClick={() => setPreview({ image: slot.image!, label: slot.label })}
                        >
                            <ImageThumb image={slot.image} label={slot.label} className="aspect-square w-full" />
                        </button>

                    ) : (

                        // missing image: nothing to open
                        <ImageThumb key={slot.label} image={null} label={slot.label} className="aspect-square w-full" />
                    )

                )}

            </div>


            {/* larger view open while preview has an image */}
            <Dialog open={preview !== null} onOpenChange={(isOpen) => { if (!isOpen) setPreview(null) }}>
                
                <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                    
                    <DialogClose asChild>
                        
                        <Button
                            variant="outline"
                            size="icon-sm"
                            className="absolute top-3 right-3 z-10 cursor-pointer rounded-full hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Close preview"
                        >
                            <X className="size-3.5" />
                        </Button>
                    
                    </DialogClose>
                    
                    <DialogTitle>{preview?.label} image</DialogTitle>
                    
                    {preview && <ImageThumb image={preview.image} label={preview.label} className="aspect-square w-full" />}
                
                </DialogContent>

            </Dialog>
        </>

    );
}