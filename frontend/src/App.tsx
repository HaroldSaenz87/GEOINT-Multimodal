
import ChatPanel from "./components/ChatPanel";
import HelpPanel from "./components/HelpPanel";
import MapView from "./components/MapView";

export default function App() {


  return(

    <main className="relative h-screen w-screen overflow-hidden">
      
      <MapView />
      <HelpPanel /> 
      <ChatPanel />

    </main>

  )
}
