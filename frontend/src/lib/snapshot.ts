// turn selected box into real image png 
// box coordinates stay attached to image (snapshot.area)

import type { MapArea } from '../types'

const TILE_SIZE = 256  // every map tile is 256 x 256 pixels
const MAX_ZOOM = 19 
const MAX_SIZE = 2048 

// the image plus where it came from
export type Snapshot = {
    area: MapArea             // the box's coordinates
    zoom: number              // zoom the tiles were taken at (sets the detail)
    width: number             // image width in pixels
    height: number            // image height in pixels
    blob: Blob                // the PNG file itself (this is what gets uploaded later)
    url: string               // a temporary link to the PNG so an <img> can show it
}

// latitude / longitude pixel position on the whole world map at this zoom
function toPixel(lat: number, lng: number, zoom: number) {

    const worldSize = TILE_SIZE * 2 ** zoom   
    const sin = Math.sin((lat * Math.PI) / 180)
    
    return {
        x: ((lng + 180) / 360) * worldSize,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
    }
}

// most detailed zoom where the box still fits in MAX_SIZE pixels
function pickZoom(area: MapArea) {

    for (let zoom = MAX_ZOOM; zoom > 1; zoom--) {
    
        const nw = toPixel(area.north, area.west, zoom) 
    
        const se = toPixel(area.south, area.east, zoom)  
    
        if (Math.max(se.x - nw.x, se.y - nw.y) <= MAX_SIZE) return zoom
    }
    return 1
}

// download one tile
function loadTile(url: string): Promise<HTMLImageElement | null> {

    return new Promise((resolve) => {
    
        const img = new Image()
    
        img.crossOrigin = 'anonymous' 
    
        img.onload = () => resolve(img)
    
        img.onerror = () => resolve(null)
    
        img.src = url
    })

}

// make the snapshot
export async function takeSnapshot(area: MapArea, tileUrl: string): Promise<Snapshot> {
    
    const zoom = pickZoom(area)
    
    const nw = toPixel(area.north, area.west, zoom)
    
    const se = toPixel(area.south, area.east, zoom)
    
    const width = Math.max(1, Math.round(se.x - nw.x)) 
    const height = Math.max(1, Math.round(se.y - nw.y))

    const canvas = document.createElement('canvas')  
    
    canvas.width = width
    
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('Canvas not supported')

    // every tile that touches the box
    const jobs: Promise<void>[] = []
    let loaded = 0 
    
    for (let x = Math.floor(nw.x / TILE_SIZE); x <= Math.floor(se.x / TILE_SIZE); x++) {
    
        for (let y = Math.floor(nw.y / TILE_SIZE); y <= Math.floor(se.y / TILE_SIZE); y++) {
    
            const url = tileUrl.replace('{z}', String(zoom)).replace('{y}', String(y)).replace('{x}', String(x))
    
            jobs.push(loadTile(url).then((img) => {
                if (!img) return
                ctx.drawImage(img, x * TILE_SIZE - nw.x, y * TILE_SIZE - nw.y) // place the tile
                loaded++
            }))
        }
    }
    
    await Promise.all(jobs)    
    
    if (loaded === 0) throw new Error('No tiles loaded')  

    // canvas PNG file (fails if Esri didn't give permission to copy the pixels)
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image'))), 'image/png'),
    )
    return { area, zoom, width, height, blob, url: URL.createObjectURL(blob) }
}