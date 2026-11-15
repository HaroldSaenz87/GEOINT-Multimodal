// FULL screen satellite map

// Leaflet literally draws the map
// Tiles load straight from Esri in the browser so no need for backend
import { ESRI_ATTRIBUTION, ESRI_WORLD_IMAGERY } from "@/lib/tiles";
import { MapContainer, ScaleControl, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css' // must have or the map wont work. Leaflet owns the styles

import AreaSelector from "@/components/map/AreaSelector";  
import type { MapArea } from "@/types";  

// where the map opens which will be sanibel island 
const START_CENTER: [number, number] = [26.4434, -82.1115]
// higher = closer in
const START_ZOOM = 13

type MapViewProps = {
    selecting: boolean                        // is the snapshot tool on
    area: MapArea | null                      // selected area to draw
    onAreaSelected: (area: MapArea) => void   // a box was drawn
    onCancelSelect: () => void                // Esc pressed
}

export default function MapView({ selecting, area, onAreaSelected, onCancelSelect }: MapViewProps) {

    return (

        <MapContainer
            center={START_CENTER}
            zoom={START_ZOOM}
            zoomControl={false}   // gets rid of the + - buttons
            className="isolate h-full w-full"  // fill whole parent
        >

            {/* satellite imagey layer */}
            <TileLayer
                url={ESRI_WORLD_IMAGERY}
                attribution={ESRI_ATTRIBUTION}
                maxZoom={21}
            />

            {/* snapshot tool: drag a box to select an area */}
            <AreaSelector selecting={selecting} area={area} onSelected={onAreaSelected} onCancel={onCancelSelect} />

            {/* distance scale bottom left */}
            <ScaleControl position="bottomleft" imperial={false} />

        </MapContainer>
    );
}
