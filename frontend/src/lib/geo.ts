
import { latLng } from 'leaflet'
import type { MapArea } from '@/types'        

// this right here \u00B0 is the degree sign

export function formatLat(lat: number) {
    return `${Math.abs(lat).toFixed(4)}\u00B0${lat >= 0 ? 'N' : 'S'}`
}


export function formatLng(lng: number) {
    return `${Math.abs(lng).toFixed(4)}\u00B0${lng >= 0 ? 'E' : 'W'}`
}

// width x height of the area in km (This right here \u00D7 is the x sign)
export function formatAreaSize(area: MapArea) {

    const midLat = (area.south + area.north) / 2                   // measure across the middle
    const midLng = (area.west + area.east) / 2
    const widthM = latLng(midLat, area.west).distanceTo(latLng(midLat, area.east))     // left to right
    const heightM = latLng(area.south, midLng).distanceTo(latLng(area.north, midLng))  // bottom to top

    
    if (widthM < 1000 && heightM < 1000) {
        const m = (value: number) => Math.round(value / 10) * 10
        return `${m(widthM)} \u00D7 ${m(heightM)} m`
    }

    
    return `${(widthM / 1000).toFixed(1)} \u00D7 ${(heightM / 1000).toFixed(1)} km`
}