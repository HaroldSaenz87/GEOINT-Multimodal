
// the Library tab: saved snapshots and uploads, 2 per row

import { ImageIcon } from 'lucide-react'

import type { LibraryImage } from '@/types'

type ImageLibraryProps = {
    images: LibraryImage[]   // newest first
}

export default function ImageLibrary({ images }: ImageLibraryProps) {

    if (images.length === 0) {
        return <p className="py-6 text-center text-sm text-muted-foreground">No saved images yet.</p>
    }

    return (
        
        <div className="grid grid-cols-2 gap-3">
            
            {images.map((img) => (
                
                <button key={img.id} className="flex cursor-pointer flex-col gap-1.5 rounded-lg p-1 text-left hover:bg-muted">

                    {/* square preview an image icon until real thumbnails exist */}
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted/50">

                        {img.thumb_url
                            ? <img src={img.thumb_url} alt="" className="size-full object-cover" />
                            : <ImageIcon className="size-6 text-muted-foreground" />}
                    </div>

                    {/* "Snapshot" or "Upload", and the date it was saved */}
                    <span className="px-0.5 text-xs font-medium capitalize">{img.source}</span>
                    
                    <span className="px-0.5 text-xs text-muted-foreground">
                        {new Date(img.created_at).toLocaleDateString()}
                    </span>

                </button>

            ))}

        </div>
    );
}