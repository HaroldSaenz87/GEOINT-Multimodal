import '@arcgis/map-components/components/arcgis-map'
import '@arcgis/map-components/components/arcgis-swipe'
import type {} from '@arcgis/map-components/types/react'
import type { ArcgisMap } from '@arcgis/map-components/components/arcgis-map'
import ArcGISMap from '@arcgis/core/Map.js'
import type Graphic from '@arcgis/core/Graphic.js'
import { watch } from '@arcgis/core/core/reactiveUtils.js'
import { webMercatorToGeographic } from '@arcgis/core/geometry/support/webMercatorUtils.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer.js'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import type MapView from '@arcgis/core/views/MapView.js'
import { getWaybackItemsWithLocalChanges, lat2tile, long2tile } from '@esri/wayback-core'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatReleaseDate, INITIAL_IMAGERY } from '@/lib/imagery'
import type { AreaSelection, ImageryRelease, ImagerySide } from '@/lib/imagery'

const CENTER = [-82.097, 26.426]
const INITIAL_ZOOM = 16
function waybackTileUrl(release: number) {
  return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${release}/{level}/{row}/{col}`
}

function waybackLayer(side: ImagerySide) {
  return new WebTileLayer({
    title: side === 'before' ? 'Before imagery' : 'After imagery',
    urlTemplate: waybackTileUrl(INITIAL_IMAGERY[side].releaseNum),
    copyright: 'Esri World Imagery Wayback | Esri, Vantor, Earthstar Geographics, and the GIS User Community',
  })
}

function createMap() {
  const before = waybackLayer('before')
  const after = waybackLayer('after')
  const selection = new GraphicsLayer({ title: 'Area of interest' })
  const map = new ArcGISMap({ layers: [before, after, selection] })
  return {
    map, before, after, selection,
    changeRelease(side: ImagerySide, release: number) {
      const layer = side === 'before' ? before : after
      layer.urlTemplate = waybackTileUrl(release)
      layer.refresh()
    },
  }
}

function groupReleases(catalog: ImageryRelease[]) {
  const releases = new Map(catalog.map((release) => [release.releaseNum, release]))
  const groups = new Map<string, ImageryRelease[]>()
  const sorted = [...releases.values()].sort((a, b) => b.releaseDateLabel.localeCompare(a.releaseDateLabel))
  for (const release of sorted) {
    const year = release.releaseDateLabel.slice(0, 4)
    const group = groups.get(year)
    if (group) group.push(release)
    else groups.set(year, [release])
  }
  return [...groups]
}

type ReleaseGroups = ReturnType<typeof groupReleases>

function watchLocalReleases(view: MapView, onChange: (groups: ReleaseGroups | null) => void) {
  const releaseRequests = new Map<string, Promise<ImageryRelease[]>>()
  const samplePositions = [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]
  let timer: number | undefined
  let revision = 0

  const watcher = watch(
    () => [view.stationary, view.suspended, view.extent, view.zoom, view.width, view.height] as const,
    ([stationary, suspended]) => {
      const requestRevision = ++revision
      window.clearTimeout(timer)
      onChange(null)
      if (!stationary || suspended) return

      timer = window.setTimeout(async () => {
        const zoom = Math.max(0, Math.round(view.zoom))
        const requests = new Set<Promise<ImageryRelease[]>>()

        // Sample the center and the four quadrants to cover both swipe panes.
        for (const [x, y] of samplePositions) {
          const point = view.toMap({ x: x * view.width, y: y * view.height })
          if (point?.longitude == null || point.latitude == null) continue
          const longitude = ((point.longitude + 180) % 360 + 360) % 360 - 180
          const latitude = Math.max(-85.05112878, Math.min(85.05112878, point.latitude))
          const key = `${zoom}/${lat2tile(latitude, zoom)}/${long2tile(longitude, zoom)}`
          let request = releaseRequests.get(key)
          if (!request) {
            request = getWaybackItemsWithLocalChanges({ longitude, latitude }, zoom).catch((error: unknown) => {
              releaseRequests.delete(key)
              throw error
            })
            if (releaseRequests.size >= 64) {
              const oldest = releaseRequests.keys().next()
              if (!oldest.done) releaseRequests.delete(oldest.value)
            }
            releaseRequests.set(key, request)
          }
          requests.add(request)
        }

        const results = await Promise.allSettled(requests)
        if (requestRevision !== revision) return
        onChange(groupReleases(results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])))
      }, 250)
    },
    { initial: true },
  )

  return {
    remove() {
      revision += 1
      window.clearTimeout(timer)
      watcher.remove()
    },
  }
}

function ReleaseSelector({ side, groups, release, onChange }: {
  side: ImagerySide
  groups: ReleaseGroups | null
  release: ImageryRelease
  onChange: (side: ImagerySide, release: ImageryRelease) => void
}) {
  const label = side === 'before' ? 'Before' : 'After'
  const options = groups ?? []
  const dateLabel = groups === null ? 'Loading dates…' : options.length ? formatReleaseDate(release) : 'Dates unavailable'
  const selectedValue = options.some(([, items]) => items.some((item) => item.releaseNum === release.releaseNum))
    ? String(release.releaseNum)
    : ''
  return (
    <Select disabled={!options.length} value={selectedValue} onValueChange={(value) => {
      const selected = options.flatMap(([, items]) => items).find((item) => String(item.releaseNum) === value)
      if (selected) onChange(side, selected)
    }}>
      <SelectTrigger
        aria-label={`${label} imagery release date`}
        className="wayback-select dark h-auto! min-h-12 w-[min(9rem,calc(50cqw-1.5rem))] min-w-0 bg-background! px-2.5 py-1.5 text-foreground shadow-md"
      >
        <span className="grid min-w-0 gap-0.5 text-left">
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          <SelectValue className="truncate text-xs" placeholder={dateLabel}>{dateLabel}</SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="wayback-select dark max-h-72">
        {options.map(([year, releases]) => (
          <SelectGroup key={year}>
            <SelectLabel>{year}</SelectLabel>
            {releases.map((item) => (
              <SelectItem key={item.releaseNum} value={String(item.releaseNum)}>{formatReleaseDate(item)}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

export type DrawState = 'loading' | 'idle' | 'starting' | 'drawing'
export type MapControls = {
  toggleRectangle: () => void
  clearSelection: () => void
}

type Props = {
  ref: Ref<MapControls>
  drawState: DrawState
  onDrawState: (state: DrawState) => void
  onAreaChange: (area: AreaSelection | null) => void
  imagery: Record<ImagerySide, ImageryRelease>
  onImageryChange: (side: ImagerySide, release: ImageryRelease) => void
}

function areaFromGraphic(graphic: Graphic): AreaSelection | null {
  const shape = graphic.geometry
  if (!shape || shape.type !== 'polygon') return null
  const geographic = shape.spatialReference?.isWebMercator ? webMercatorToGeographic(shape) : shape
  if (geographic?.type !== 'polygon' || !geographic.rings[0] || !geographic.extent) return null

  // Reverse the ArcGIS exterior ring to match GeoJSON winding.
  const ring = geographic.rings[0].map(([longitude, latitude]): [number, number] => [longitude, latitude]).reverse()
  const { x, y } = geographic.extent.center
  return {
    geometry: { type: 'Polygon', coordinates: [ring] },
    center: { longitude: x, latitude: y },
  }
}

export default function SanibelMap({ ref, drawState, onDrawState, onAreaChange, imagery, onImageryChange }: Props) {
  const mapRef = useRef<ArcgisMap>(null)
  const afterPickerRef = useRef<HTMLDivElement>(null)
  const sketchRef = useRef<SketchViewModel>(null)
  const [layers] = useState(createMap)
  const [releaseGroups, setReleaseGroups] = useState<ReleaseGroups | null>(null)

  useEffect(() => {
    const element = mapRef.current
    if (!element) return
    let active = true
    let sketch: SketchViewModel | undefined
    let listener: { remove: () => void } | undefined
    let releaseWatcher: ReturnType<typeof watchLocalReleases> | undefined

    void element.viewOnReady().then(() => {
      if (!active) return
      sketch = new SketchViewModel({
        view: element.view,
        layer: layers.selection,
        polygonSymbol: {
          type: 'simple-fill',
          color: [67, 213, 190, 0.14],
          outline: { color: '#7fffe6', width: 2 },
        },
        updateOnGraphicClick: false,
      })
      sketchRef.current = sketch
      releaseWatcher = watchLocalReleases(element.view, setReleaseGroups)
      listener = sketch.on('create', ({ state, graphic }) => {
        if (state === 'complete' && graphic) {
          const area = areaFromGraphic(graphic)
          if (area) {
            const previous = layers.selection.graphics.find((item) => item !== graphic)
            if (previous) layers.selection.remove(previous)
            onAreaChange(area)
          } else {
            layers.selection.remove(graphic)
          }
        }
        if (state === 'complete' || state === 'cancel') onDrawState('idle')
      })
      onDrawState('idle')
    }).catch((error: unknown) => {
      if (active) console.error('Could not initialize the Sanibel map.', error)
    })

    return () => {
      active = false
      listener?.remove()
      releaseWatcher?.remove()
      sketch?.destroy()
      sketchRef.current = null
    }
  }, [layers, onAreaChange, onDrawState])

  async function toggleRectangle() {
    const sketch = sketchRef.current
    if (!sketch) return
    if (drawState === 'drawing') {
      sketch.cancel()
      onDrawState('idle')
      return
    }
    if (drawState !== 'idle') return

    onDrawState('starting')
    try {
      await sketch.create('rectangle')
    } catch (error) {
      console.error('Could not start the rectangle tool.', error)
    } finally {
      if (sketchRef.current === sketch) {
        onDrawState(sketch.activeTool === 'rectangle' ? 'drawing' : 'idle')
      }
    }
  }

  function placeAfterPicker(position: number) {
    afterPickerRef.current?.style.setProperty('--swipe-position', `${position}%`)
  }

  useImperativeHandle(ref, () => ({
    toggleRectangle() {
      void toggleRectangle()
    },
    clearSelection() {
      sketchRef.current?.cancel()
      onDrawState('idle')
      layers.selection.removeAll()
      onAreaChange(null)
    },
  }))

  function selectRelease(side: ImagerySide, release: ImageryRelease) {
    layers.changeRelease(side, release.releaseNum)
    onImageryChange(side, release)
  }

  return (
    <section aria-label="Imagery map" className="calcite-mode-dark @container relative min-h-0 min-w-0 overflow-hidden bg-[#1b3338] max-sm:row-start-1">
      <arcgis-map
        ref={mapRef}
        className="block size-full"
        map={layers.map}
        center={CENTER}
        zoom={INITIAL_ZOOM}
        popupDisabled
        aria-label="Map of Sanibel, Florida"
      >
        <arcgis-swipe
          position={50}
          label="Compare before and after imagery"
          onarcgisSwipeInput={({ currentTarget }) => placeAfterPicker(currentTarget.position)}
          onarcgisSwipeChange={({ currentTarget }) => placeAfterPicker(currentTarget.position)}
          onarcgisPropertyChange={({ currentTarget: swipe, detail }) => {
            if (detail.name === 'state' && swipe.state === 'ready' && !swipe.startLayers.length) {
              swipe.startLayers.add(layers.before)
              swipe.endLayers.add(layers.after)
            }
          }}
        />
      </arcgis-map>
      <div className="absolute top-3 left-3 grid justify-items-start gap-2">
        <ReleaseSelector side="before" groups={releaseGroups} release={imagery.before} onChange={selectRelease} />
      </div>
      <div
        ref={afterPickerRef}
        className="absolute top-3"
        style={{
          left: 'clamp(min(10.5rem, 50%), calc(var(--swipe-position, 50%) + 0.75rem), max(calc(100% - 9.75rem), calc(50% + 0.75rem)))',
        }}
      >
        <ReleaseSelector side="after" groups={releaseGroups} release={imagery.after} onChange={selectRelease} />
      </div>
    </section>
  )
}
