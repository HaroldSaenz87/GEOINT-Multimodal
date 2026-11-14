// Help button that opens a how to use popup in the middle of the screen

import { History, ImagePlus, Images, Map, MessageSquare, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

// the instructions shown in the popup will be icon, title, and text
const STEP = [
    { icon: Map, title: 'Explore the map', text: 'Drag to move around. Scroll or pinch to zoom in on an area.'},
    { icon: ImagePlus, title: 'Add images', text: 'Click + in the chat to select an area on the map, upload your own images, or pick from your library.'},
    { icon: MessageSquare, title: 'Ask about the damage', text: ' Send your images to the chat and ask questions, like "How many buildings are damaged?"'},
    { icon: History, title: 'History', text: 'Reopen any past chat from the History tab.'},
    { icon: Images, title: 'Library', text: 'Your saved snapshots and uploads. Reuse or delete them anytime.'},
]

export default function HelpPanel() {

    return (

        // dialog handles open and close
        <Dialog>

            {/* dark help pill pinned top right */}
            <DialogTrigger asChild>

                <Button size="lg" className="absolute top-4 right-4 z-10 rounded-full px-4 cursor-pointer">
                    Help
                </Button>

            </DialogTrigger>

            {/* popup in the middle of the screen */}
            <DialogContent className="sm:max-w-md" showCloseButton={false}>

                <DialogClose asChild>

                    <Button variant="outline" size="icon-sm" className="absolute top-3 right-3 rounded-full cursor-pointer hover:border-destructive/40 hover:bg-destructive/20 hover:text-destructive" aria-label="Close help">
                        <X className="size-3.5" />
                    </Button>

                </DialogClose>

                
                <DialogHeader className="pr-8 mb-3">

                    <DialogTitle className="font-semibold">
                        How to use
                    </DialogTitle>
                    
                    <DialogDescription>
                        Check satellite images for building damage and ask questions about them.
                    </DialogDescription>
                
                </DialogHeader>

                {/* row per step will be icon on the left, title, text on the right */}
                <ol className="flex flex-col gap-5">

                    {STEP.map((step) => (

                        <li key={step.text} className="flex gap-3">
                            
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/50">
                                <step.icon className="size-4"/>
                            </span>

                            <div>
                                <p className="font-semibold">
                                    {step.title}
                                </p>

                                <p className="text-muted-foreground">
                                    {step.text}
                                </p>
                            
                            </div>

                        </li>

                    ))}

                </ol>

            </DialogContent>

        </Dialog>
    );
    
}
