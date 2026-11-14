
import { ImageIcon, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MessageImage } from '@/types'

type ImageThumbProps = {
    image: MessageImage | null   // null = missing 
    label?: string               // tag in the corner
    className?: string           // size and shape come from whoever uses it
}

export default function ImageThumb({ image, label, className }: ImageThumbProps) {

    // missing image will be dashed box so it's clear something is not there
    if (!image) {

        return (

            <div className={cn('flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted/30 text-muted-foreground', className)}>
                <ImageOff className="size-4" />
                <span className="text-[10px]">No {label?.toLowerCase() ?? 'image'}</span>
            </div>
        )
    }

    return (

        // the tag can be placed in the corner
        <div className={cn('relative flex items-center justify-center overflow-hidden rounded-md border bg-gray-200', className)}>

            {/* real thumbnail if we have one otherwise an image icon */}
            {image.thumb_url
                ? <img src={image.thumb_url} alt={label ?? 'image'} className="size-full object-cover" />
                : <ImageIcon className="size-5 text-muted-foreground" />}

            {/* "Before" / "After" tag, bottom left */}
            {label && (

                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {label}
                </span>
            
            )}

        </div>
    );
    
}