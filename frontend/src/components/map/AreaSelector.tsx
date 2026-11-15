// snaptool

import { useEffect, useState } from 'react'                               
import { Rectangle, Tooltip, useMap, useMapEvents } from 'react-leaflet' 
import { LatLngBounds, type LatLng } from 'leaflet'  

import type { MapArea } from '@/types'                                      
import { formatAreaSize, formatLat, formatLng } from '@/lib/geo'

type AreaSelectorProps = {
    selecting: boolean     
    area: MapArea | null              
    onSelected: (area: MapArea) => void     
    onCancel: () => void             
}

// smallest box (in screen pixels) that counts; smaller aka just a click
const MIN_SIZE_PX = 10

// dashed blue outline for the box
const BOX_STYLE = { color: '#2563eb', weight: 2, dashArray: '6 4', fillOpacity: 0.12 }

function toArea(box: LatLngBounds, zoom: number): MapArea {
    return { south: box.getSouth(), west: box.getWest(), north: box.getNorth(), east: box.getEast(), zoom }
}

// label on the right side of the box: top-left corner, bottom-right corner, size
function CoordinatesLabel({ area }: { area: MapArea }) {
    
    return (

        <Tooltip
            permanent                                                            
            direction="right"     
            position={[(area.south + area.north) / 2, area.east]}   
            offset={[10, 0]}                                                     
            className="rounded-lg! border-0! bg-primary! px-3! py-2! text-primary-foreground! shadow-lg! before:hidden!" 
        >
            {/* heading */}
            <div className="mb-1 text-[10px] font-medium tracking-wide text-primary-foreground/60 uppercase">Selected area</div>

            {/*label | value */}
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono text-[11px] tabular-nums">

                <span className="text-primary-foreground/60">NW</span>
                
                <span>{formatLat(area.north)}, {formatLng(area.west)}</span>
                
                <span className="text-primary-foreground/60">SE</span>
                
                <span>{formatLat(area.south)}, {formatLng(area.east)}</span>
                
                <span className="text-primary-foreground/60">Size</span>
                
                <span>{formatAreaSize(area)}</span>
            
            
            
            </div>
        </Tooltip>
    )
}

export default function AreaSelector({ selecting, area, onSelected, onCancel }: AreaSelectorProps) {

    const map = useMap()                                                     
    const [start, setStart] = useState<LatLng | null>(null)                  
    const [current, setCurrent] = useState<LatLng | null>(null)              

    // turn panning off and show a crosshair while selecting
    useEffect(() => {

        if (!selecting) return
        
        map.dragging.disable()   // dragging draws a box instead of moving the map
        
        map.getContainer().style.cursor = 'crosshair'   // crosshair cursor
        
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() } // Esc cancels
        
        window.addEventListener('keydown', onKey)
        
        return () => {                                                       // when selecting turns off then just undo all of that
            map.dragging.enable()
            map.getContainer().style.cursor = ''
            window.removeEventListener('keydown', onKey)
            setStart(null)
            setCurrent(null)
        }







    }, [selecting, map, onCancel])

    // mouse events on the map (only do something while selecting)
    useMapEvents({
        mousedown(e) {

            if (!selecting) return
            setStart(e.latlng)    // first corner
            setCurrent(e.latlng)
        },
        mousemove(e) {
            if (selecting && start) setCurrent(e.latlng)     // stretch the box
        },
        mouseup(e) {

            if (!selecting || !start) return

            const a = map.latLngToContainerPoint(start)     // corners in screen pixels
            const b = map.latLngToContainerPoint(e.latlng)
            const big = Math.abs(a.x - b.x) >= MIN_SIZE_PX && Math.abs(a.y - b.y) >= MIN_SIZE_PX 
            
            if (big) {
            
                const box = new LatLngBounds(start, e.latlng) // works whichever way you dragged
                onSelected({
                    south: box.getSouth(),
                    west: box.getWest(),
                    north: box.getNorth(),
                    east: box.getEast(),
                    zoom: map.getZoom(),
                })
            }
            setStart(null)  // ready for another try
            setCurrent(null)
        },
    })

    // the box being drawn right now
    if (start && current) {

        const box = new LatLngBounds(start, current)

        return (
            <Rectangle bounds={box} pathOptions={BOX_STYLE}>
                <CoordinatesLabel area={toArea(box, map.getZoom())} />
            </Rectangle>
        )
    }
    // the finished selection
    if (area) {

        return (

            <Rectangle bounds={[[area.south, area.west], [area.north, area.east]]} pathOptions={BOX_STYLE}>
                <CoordinatesLabel area={area} />
            </Rectangle>
        )

    }

    return null     // nothing to draw
}