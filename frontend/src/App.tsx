
import ChatPanel from "./components/chat/ChatPanel";
import HelpPanel from "./components/help/HelpPanel";
import MapView from "./components/map/MapView";

export default function App() {


  return(

    <main className="relative h-screen w-screen overflow-hidden">
      
      <MapView />
      <HelpPanel /> 
      <ChatPanel />

    </main>

  )
}
