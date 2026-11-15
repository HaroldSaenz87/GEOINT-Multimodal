
import { ImagePlus } from "lucide-react";
import ChatPanel from "./components/chat/ChatPanel";
import HelpPanel from "./components/help/HelpPanel";
import MapImagesPanel from "./components/images/MapImagesPanel";
import MapView from "./components/map/MapView";
import { Button } from "./components/ui/button";
import { useState } from "react";

export default function App() {

  const [imagesOpen, setImagesOpen] = useState(false) 

  return(

    <main className="relative h-screen w-screen overflow-hidden">
      
      <MapView />
      <HelpPanel /> 
      
      {/* sidebar when open*/}
      {imagesOpen ? (

        <MapImagesPanel onClose={() => setImagesOpen(false)} /> 

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
