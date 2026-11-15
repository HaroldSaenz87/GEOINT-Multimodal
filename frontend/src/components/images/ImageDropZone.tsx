// upload box used for before and after

import { FileImage, ArrowUp, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Button } from "../ui/button"
import { cn } from "cn"


// allowed file types
const ACCEPT_TYPES = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/tiff': ['.tif', '.tiff'],

}

// 20 MB size limit
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

type ImageDropZoneProps = {
    
    // before or after
    label: string
    
    // the chosen file 
    file: File | null

    // tells if file was chosen or removed
    onChange: (file: File | null) => void

}


// turn bytes into 3.4MB
function formatSize(bytes: number){

    // bytes to megabytes
    const mb = bytes / (1024 * 1024)

    return mb >= 1 ? `${mb.toFixed(1)} MB` :`${Math.max(1, Math.round(bytes / 1024))} KB`
}


// turn a rejected file into a clear message
function rejectionMessage(rejection: FileRejection){

    const code = rejection.errors[0]?.code

    if (code === 'file-too-large'){
        return 'File is too large. The limit is 20 MB.'
    }

    if(code === 'file-invalid-type'){
        return 'Use a PNG, JPEG, or TIFF file.'
    }

    return 'This file could not be used.'
}


export default function ImageDropZone({ label, file, onChange }: ImageDropZoneProps) {
    

    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)



    // whenever the file changes make the preview link
    useEffect(() => {

        if (!file || file.type === 'image/tiff'){
            setPreviewUrl(null)
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)

    }, [file])

    // set up the click drag file picker
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ACCEPT_TYPES,
        maxSize: MAX_UPLOAD_BYTES,
        multiple: false,
        onDropAccepted: (files) => {
            setError(null)
            onChange(files[0])
        },
        onDropRejected: (rejections) => setError(rejectionMessage(rejections[0])),
    })

    // a file is chosen
    if (file) {

        return (

            <div className="relative h-36 overflow-hidden rounded-xl border bg-muted">      

                {previewUrl
                    ? <img src={previewUrl} alt={`${label} preview`} className="size-full object-cover" />
                    : <div className="flex size-full items-center justify-center"><FileImage className="size-8 text-muted-foreground" /></div>}

                {/* dark strip at the bottom with the file name and size */}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-1.5 text-white">
                    <p className="truncate text-xs font-medium">{file.name}</p>          
                    <p className="text-[11px] text-white/80">{formatSize(file.size)}</p> 
                </div>

                {/* round X in the top-right corner */}
                <Button
                    variant="outline"
                    size="icon-xs"
                    className="absolute top-2 right-2 cursor-pointer rounded-full bg-background/90 hover:border-destructive hover:bg-destructive hover:text-white"
                    aria-label={`Remove ${label.toLowerCase()} image`}
                    onClick={() => onChange(null)}
                >
                    <X className="size-3" />
                </Button>
            </div>
        )
    }

    // dashed box to click or drop a file onto
    return (
        <div>
            <div {...getRootProps()} className={cn(
                    'flex h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-foreground/20 bg-muted/30 text-center transition-colors hover:bg-muted/60',
                    isDragActive && 'border-primary bg-muted',
                )}
            >
                <input {...getInputProps()} aria-label={`Choose ${label.toLowerCase()} image`} /> {/* hidden file input */}
                <ArrowUp className="mb-1 size-5" />
                
                <p className="text-sm font-semibold">Choose {label.toLowerCase()} image</p> {/* main text */}
                
                <p className="text-xs text-muted-foreground">or drag and drop here</p> {/* hint */}
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}  
                
        </div>
    )
}
