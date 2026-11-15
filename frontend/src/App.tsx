
import { ImagePlus } from "lucide-react";
import ChatPanel from "./components/chat/ChatPanel";
import HelpPanel from "./components/help/HelpPanel";
import MapImagesPanel from "./components/images/MapImagesPanel";
import MapView from "./components/map/MapView";
import { Button } from "./components/ui/button";
import { useCallback, useState } from "react";
import type { MapArea } from "./types"; 

export default function App() {

  const [imagesOpen, setImagesOpen] = useState(false) 
  const [selecting, setSelecting] = useState(false) 
  const [area, setArea] = useState<MapArea | null>(null) 



  // a box was drawn save it and turn the tool off
  const handleAreaSelected = useCallback((selected: MapArea) => {
    setArea(selected)
    setSelecting(false)
  }, [])

  // Esc turn the tool off without changing the area
  const cancelSelect = useCallback(() => setSelecting(false), [])

  // close the sidebar also stop selecting and forget the area
  function closeImages() {
    setImagesOpen(false)
    setSelecting(false)
    setArea(null)
  }

  // "Remove selection": forget the box and stop selecting
  function clearArea() {
    setArea(null)
    setSelecting(false)
  }


  return(

    <main className="relative h-screen w-screen overflow-hidden">
      
      <MapView 
        selecting={selecting}
        area={imagesOpen ? area : null}                                     // only show the box while the sidebar is open
        onAreaSelected={handleAreaSelected}
        onCancelSelect={cancelSelect}
      />
      <HelpPanel /> 

      {/* hint at the top while the snapshot tool is on */}
      {selecting && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-md">
          Drag on the map to select an area. Press Esc to cancel.
        </div>
      )}
      
      {/* sidebar when open*/}
      {imagesOpen ? (

        <MapImagesPanel 
          area={area}
          selecting={selecting}
          onSelectArea={() => setSelecting(true)}
          onClearArea={clearArea}
          onClose={closeImages}  
        /> 

      ) : (

        <Button
          size="lg"
          className="absolute top-4 left-4 z-10 cursor-pointer rounded-full px-4 shadow-md" 
          onClick={() => setImagesOpen(true)}  
        >
          <ImagePlus /> Map Images
        </Button>

      )}

      <ChatPanel onAddImages={() => setImagesOpen(true)} /> 

    </main>

  );
}
