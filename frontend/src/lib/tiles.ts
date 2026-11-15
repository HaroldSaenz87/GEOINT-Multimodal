// Esri World Imagery: today's (newest) imagery After image
export const ESRI_WORLD_IMAGERY =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

// Esri Wayback: an older version of World Imagery, picked by release number Before image
export function waybackTileUrl(release: number) {
    return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${release}/{z}/{y}/{x}`
}

// credit Esri requires wherever its tiles are shown
export const ESRI_ATTRIBUTION = 'Tiles &copy; Esri and its data providers'