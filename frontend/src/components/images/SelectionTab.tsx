

import { useEffect, useState } from 'react'  
import { CalendarDays, ChevronDown, MapPin, MousePointerSquareDashed, Trash2, ZoomIn } from 'lucide-react' 

import { Calendar } from '../ui/calendar'       
import { formatLat, formatLng } from '../../lib/geo'       
import { ESRI_WORLD_IMAGERY } from '../../lib/tiles'       
import { takeSnapshot, type Snapshot } from '../../lib/snapshot' 
import type { MapArea } from '../../types'   

type SelectionTabProps = {
    area: MapArea | null                                           // selected area (null is none yet)
    selecting: boolean                                             // is the snapshot tool on right now
    onSelectArea: () => void                                       // "Select an area on the map" clicked
    onClearArea: () => void                                        // "Remove selection" clicked
    beforeDate: Date | undefined                                   // chosen Before date (undefined is none)
    onBeforeDateChange: (date: Date | undefined) => void           // a date was picked or cleared
}


function formatCenter(area: MapArea) {
    return `${formatLat((area.south + area.north) / 2)}, ${formatLng((area.west + area.east) / 2)}`
}

function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SelectionTab({ area, selecting, onSelectArea, onClearArea, beforeDate, onBeforeDateChange }: SelectionTabProps) {

    const [calendarOpen, setCalendarOpen] = useState(false)       // is the calendar showing
    
    // the latest snapshot result
    const [result, setResult] = useState<{ area: MapArea; snapshot: Snapshot | null } | null>(null)

    // take a new snapshot whenever the box changes
    useEffect(() => {

        if (!area) return
        
        let stale = false   
        
        takeSnapshot(area, ESRI_WORLD_IMAGERY)
            .then((snapshot) => {
                if (stale) URL.revokeObjectURL(snapshot.url)
                else setResult({ area, snapshot })
            })
            .catch(() => { if (!stale) setResult({ area, snapshot: null }) }) 
        
        return () => { stale = true }

    }, [area])

    // free the old image memory when a new one replaces it
    useEffect(() => () => { if (result?.snapshot) URL.revokeObjectURL(result.snapshot.url) }, [result])

    const current = area && result?.area === area ? result : null 
    const loading = area !== null && current === null     

    return (

        <div className="flex flex-col gap-6"> 

            {/* heading */}
            <div className="flex flex-col gap-2">

                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Map selection</p>
                <p className="text-xs text-muted-foreground">Select your current image from the map.</p>
            
            </div>

            {/* becomes the After image */}
            <button
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted ${selecting ? 'border-primary bg-muted' : 'bg-muted/40'}`}
                onClick={onSelectArea}
            >
                <MousePointerSquareDashed className="mt-0.5 size-4 shrink-0" />  
                <span>
                    
                    <span className="block text-sm font-medium">
                        {selecting ? 'Drag a box on the map…' : area ? 'Area selected (click to redo)' : 'Select an area on the map'}
                    </span>
                    
                    <span className="block text-xs text-muted-foreground">
                        {area && !selecting ? (
                           
                            <span className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                                
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5 shrink-0" /> {formatCenter(area)}
                                </span>
                                
                                <span className="flex items-center gap-1.5">
                                    <ZoomIn className="size-3.5 shrink-0" /> Zoom {area.zoom}
                                </span>
                            
                            </span>
                        ) : (
                            <span className="block text-xs text-muted-foreground">This will be your After image.</span>
                        )}
                    </span>
                
                </span>
            
            </button>

            {/* remove the box (only when there is one) */}
            {area && !selecting && (
                <button
                    className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-destructive text-sm font-medium text-white hover:bg-destructive/90"
                    onClick={onClearArea}
                >
                    <Trash2 className="size-4" /> Remove selection
                </button>
            )}

            {/* Before date */}
            <section className="flex flex-col gap-3">

                <h3 className="text-sm font-semibold">Before Image</h3>

                {/*shows the date clicking opens/closes the calendar */}
                <button
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm hover:bg-muted/50"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    aria-expanded={calendarOpen}       
                >
                    <CalendarDays className="size-4 text-muted-foreground" />

                    <span className={beforeDate ? '' : 'text-muted-foreground'}>
                        {beforeDate ? formatDate(beforeDate) : 'Pick a date before the event'}
                    </span>
                    
                    <ChevronDown className={`ml-auto size-4 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} /> 
                
                </button>

                {/* the calendar only while open */}
                {calendarOpen && (
                    
                    <div className="rounded-xl border p-2">
                        
                        <Calendar
                            mode="single"   
                            selected={beforeDate} 
                            defaultMonth={beforeDate}   
                            disabled={{ after: new Date() }}   
                            onSelect={(date) => {
                                onBeforeDateChange(date)    
                                setCalendarOpen(false)    
                            }}
                            className="w-full p-0"
                        />

                    </div>
                )}

                {/* clear the date */}
                {beforeDate && (
                    <button
                        className="cursor-pointer self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => onBeforeDateChange(undefined)}
                    >
                        No before image
                    </button>
                )}

            </section>

            {/*snapshot of the selected box (today's imagery) */}
            <section className="flex flex-col gap-3">

                <h3 className="text-sm font-semibold">After Image</h3>
                
                {!area ? (
                    <div className="flex h-10 items-center rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground">Select an area first</div>
                ) : loading ? (
                    <div className="flex h-36 animate-pulse items-center justify-center rounded-xl border bg-muted/40 text-sm text-muted-foreground">Taking snapshot…</div>
                ) : current?.snapshot ? (

                    <div className="flex flex-col gap-1">

                        <img
                            src={current.snapshot.url}
                            alt="Snapshot of the selected area"
                            className="max-h-64 w-full rounded-xl border bg-muted/40 object-contain"  
                        />
                        
                        <p className="flex justify-between text-xs text-muted-foreground">

                            <span>Current imagery {'\u00B7'} {current.snapshot.width} &times; {current.snapshot.height} px</span>
                            <span>&copy; Esri</span>    
                        
                        </p>

                    </div>
                    
                ) : (
                    <div className="flex h-10 items-center rounded-lg border border-destructive/40 px-3 text-sm text-destructive">Couldn&apos;t take the snapshot. Try selecting again.</div>
                )}

            </section>
        </div>
    )
}