// FULL screen satellite map

// Leaflet literally draws the map
// Tiles load straight from Esri in the browser so no need for backend

import { MapContainer, ScaleControl, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css' // must have or the map wont work. Leaflet owns the styles


// satellite imagery 
// z y x = zoom row column
const ESRI_WORLD_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// where the map opens which will be sanibel island 
const START_CENTER: [number, number] = [26.4434, -82.1115]
// higher = closer in
const START_ZOOM = 13

export default function MapView() {

    return (

        <MapContainer
            center={START_CENTER}
            zoom={START_ZOOM}
            zoomControl={false}   // gets rid of the + - buttons
            className="h-full w-full"  // fill whole parent
        >

            {/* satellite imagey layer */}
            <TileLayer
                url={ESRI_WORLD_IMAGERY}
                attribution="Tiles &copy; Esri and its data providers"
                maxZoom={19}
            />

            {/* distance scale bottom left */}
            <ScaleControl position="bottomleft" imperial={false} />

        </MapContainer>
    );
}
