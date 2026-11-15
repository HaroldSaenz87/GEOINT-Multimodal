// the upload tab that has a before and afte box

import ImageDropZone from "./ImageDropZone"



export type UploadedPair = {
    before: File | null
    after: File | null
}

type UploadTabProps = {
    files: UploadedPair
    onChange: (files: UploadedPair) => void
}

export default function UploadTab({ files, onChange }: UploadTabProps) {
    
    return (

        <div className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">

                <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Upload images</p> 
                <p className="text-sm text-muted-foreground">Add your own Before and After images.</p>  
            </div>

            {/* Before section */}
            <section className="flex flex-col gap-3">
            
                <h3 className="text-sm font-semibold">Before Image</h3>
                <ImageDropZone label="Before" file={files.before} onChange={(f) => onChange({ ...files, before: f })} /> 
            
            </section>

            {/* After section */}
            <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">After Image</h3>
                <ImageDropZone label="After" file={files.after} onChange={(f) => onChange({ ...files, after: f })} /> 
            </section>

            {/* tip at the bottom */}
            <p className="text-xs text-muted-foreground">
                Use images of the same area for the best results. PNG, JPEG, or TIFF, up to 20 MB each.
            </p>

        </div>
    );
}