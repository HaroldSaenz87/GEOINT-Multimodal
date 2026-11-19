import { useRef, useState } from 'react'
import ImageryChat from '@/components/ImageryChat'
import SanibelMap from '@/components/SanibelMap'
import type { DrawState, MapControls } from '@/components/SanibelMap'
import type { AreaSelection } from '@/lib/imagery'

export default function App() {
  const map = useRef<MapControls>(null)
  const [area, setArea] = useState<AreaSelection | null>(null)
  const [drawState, setDrawState] = useState<DrawState>('loading')

  return (
    <main className="grid h-dvh grid-cols-[17rem_minmax(0,1fr)] overflow-hidden max-sm:grid-cols-1 max-sm:grid-rows-[40dvh_minmax(0,1fr)]">
      <ImageryChat
        area={area}
        drawState={drawState}
        onDraw={() => map.current?.toggleRectangle()}
        onClear={() => map.current?.clearSelection()}
      />
      <SanibelMap
        ref={map}
        drawState={drawState}
        onDrawState={setDrawState}
        onAreaChange={setArea}
      />
    </main>
  )
}
