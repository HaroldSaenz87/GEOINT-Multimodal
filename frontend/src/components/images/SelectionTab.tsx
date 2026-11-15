//selction tab

import { useState } from 'react'
import { CalendarDays, ChevronDown, MapPin, MousePointerSquareDashed, Trash2, ZoomIn } from 'lucide-react' 

import { Calendar } from '../ui/calendar'     
import type { MapArea } from '../../types'  
import { Button } from '../ui/button' 

type SelectionTabProps = {
    area: MapArea | null                                           // selected area (null = none yet)
    selecting: boolean                                             // is the snapshot tool on right now
    onSelectArea: () => void                                       // "Select an area on the map" clicked
    beforeDate: Date | undefined                                   // chosen Before date (undefined = none)
    onBeforeDateChange: (date: Date | undefined) => void           // a date was picked or cleared

    onClearArea: () => void
}


function formatCenter(area: MapArea) {
    const lat = (area.south + area.north) / 2                      // middle latitude
    const lng = (area.west + area.east) / 2                        // middle longitude
    return `${Math.abs(lat).toFixed(4)}\u00B0${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`
}


function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SelectionTab({ area, selecting, onSelectArea, beforeDate, onBeforeDateChange, onClearArea, }: SelectionTabProps) {
    const [calendarOpen, setCalendarOpen] = useState(false)       // is the calendar showing

    return (
        <div className="flex flex-col gap-6">       

            {/* heading */}
            <div className="flex flex-col gap-2">
                <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Map selection</p>
                <p className="text-sm text-muted-foreground">Select your current image from the map.</p>
            </div>

            {/* select an area + remove*/}
            <div className="flex flex-col gap-2">

                <button
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted ${selecting ? 'border-primary bg-muted' : 'bg-muted/40'}`}
                    onClick={onSelectArea}
                >
                    <MousePointerSquareDashed className="mt-0.5 size-4 shrink-0" />                     {/* box-select icon */}
                    <span>
                        <span className="block text-sm font-medium">
                            {selecting ? 'Drag a box on the map…' : area ? 'Area selected (click to redo)' : 'Select an area on the map'}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            
                            {area && !selecting ? (
                                
                                <span className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                                    
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-3 shrink-0" />                     {/* location pin */}
                                        {formatCenter(area)}
                                    </span>
                                    
                                    <span className="flex items-center gap-1.5">
                                        <ZoomIn className="size-3 shrink-0" />                     {/* magnifier */}
                                        Zoom {area.zoom}
                                    </span>
                                
                                </span>
                            ) : (

                                <span className="block text-xs text-muted-foreground">This will be your After image.</span>
                            )}
                        </span>
                    </span>
                </button>

                {(area || selecting) && (
                    <Button
                        size="sm"     // small button
                        className="cursor-pointer self-start bg-destructive text-white hover:bg-destructive/75"
                        onClick={onClearArea}
                    >
                        <Trash2 />     {/* trash can icon */}
                        {area ? 'Remove selection' : 'Cancel Selection'}
                    </Button>
                )}


            </div>
            

            {/* Before date */}
            <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Before Image</h3>

                {/* the field: shows the date; clicking opens/closes the calendar */}
                <button
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm hover:bg-muted/50"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    aria-expanded={calendarOpen}                                                    // tells screen readers if it's open
                >
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span className={beforeDate ? '' : 'text-muted-foreground'}>
                        {beforeDate ? formatDate(beforeDate) : 'Pick a date before the event'}
                    </span>
                    <ChevronDown className={`ml-auto size-4 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} /> {/* flips when open */}
                </button>

                {/* the calendar, only while open */}
                {calendarOpen && (
                    <div className="rounded-xl border p-2">
                        <Calendar
                            mode="single"                                                           // pick one day
                            selected={beforeDate}                                                   // highlight the chosen day
                            defaultMonth={beforeDate}                                               // open on the chosen month
                            disabled={{ after: new Date() }}                                        // no future dates
                            onSelect={(date) => {
                                onBeforeDateChange(date)                                            // save the date
                                setCalendarOpen(false)                                              // close the calendar
                            }}
                            className="w-full p-0"
                        />
                    </div>
                )}

                {/* after-only analysis */}
                {beforeDate && (
                    <button
                        className="cursor-pointer self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => onBeforeDateChange(undefined)}
                    >
                        No before image
                    </button>
                )}
            </section>

            {/* After image the current map selection */}
            <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">After Image</h3>
                <div className="flex h-10 items-center rounded-lg border bg-muted/40 px-3 text-sm">
                    {area ? 'Current Selection (today)' : <span className="text-muted-foreground">Select an area first</span>}
                </div>
            </section>
        </div>
    )
}