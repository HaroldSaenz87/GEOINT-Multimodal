// sidebar

import { useState } from 'react'                                              
import { X } from 'lucide-react'                                              
import { Button } from '@/components/ui/button'                               
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' 
import UploadTab, { type UploadedPair } from '@/components/images/UploadTab'  
import ImageLibrary from '../library-chat/ImageLibrary'  
import { SAMPLE_IMAGES } from '@/sampleData'      
import SelectionTab from './SelectionTab'
import type { MapArea } from '@/types'
const TAB =
    'cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-base'


const CLOSE_X =
    'cursor-pointer rounded-full hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'

type MapImagesPanelProps = {
    area: MapArea | null                // area selected on the map (After image)
    selecting: boolean                  // is the snapshot tool on?
    onSelectArea: () => void            // turn the snapshot tool on
    onClearArea: () => void
    onClose: () => void
}

export default function MapImagesPanel({ area, selecting, onSelectArea, onClearArea, onClose }: MapImagesPanelProps) {

    const [tab, setTab] = useState('selection')     
    
    const [uploads, setUploads] = useState<UploadedPair>({ before: null, after: null }) 

    const [beforeDate, setBeforeDate] = useState<Date | undefined>(undefined)

    const ready =
        (tab === 'selection' && area !== null) ||
        (tab === 'upload' && uploads.after !== null)

    return (

        
        <aside className="absolute top-4 bottom-10 left-4 z-10 flex w-80 flex-col overflow-hidden rounded-xl bg-card shadow-md ring-1 ring-foreground/10">

            {/* title, description, close */}
            <div className="flex items-start justify-between gap-2 p-4 pb-3">

                <div>
                    <h2 className="font-semibold text-lg">Map Images</h2> 

                    <p className="text-sm text-muted-foreground mt-2">   
                        Select an area of the map to analyze. Or upload your own images.
                    </p>
                </div>
                
                <Button variant="outline" size="icon-sm" className={CLOSE_X} aria-label="Close map images" onClick={onClose}>
                    <X className="size-3.5" />
                </Button>
            
            </div>

            {/* control which one shows */}
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
                
                <div className="px-4">

                    <TabsList className="w-full">       
                    
                        <TabsTrigger value="selection" className={TAB}>Selection</TabsTrigger>
                    
                        <TabsTrigger value="upload" className={TAB}>Upload</TabsTrigger>
                        <TabsTrigger value="library" className={TAB}>Library</TabsTrigger>
                    
                    </TabsList>
                </div>

                {/* content scrolls if it gets long */}
                <TabsContent value="selection" className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    
                    <SelectionTab
                        area={area}
                        selecting={selecting}
                        onSelectArea={onSelectArea}
                        beforeDate={beforeDate}
                        onBeforeDateChange={setBeforeDate}
                        onClearArea={onClearArea}
                    />
                </TabsContent>

                <TabsContent value="upload" className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    <UploadTab files={uploads} onChange={setUploads} /> 
                </TabsContent>
                
                <TabsContent value="library" className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    <ImageLibrary images={SAMPLE_IMAGES} />               
                </TabsContent>
            
            </Tabs>

            {/* footer buttons*/}
            <div className="flex flex-col gap-2 border-t p-4">

                <Button variant="outline" className="w-full text-base cursor-pointer border-foreground/40" disabled={!ready}>  
                    Save to library
                </Button>
                
                <Button className="w-full text-base cursor-pointer" disabled={!ready}> 
                    Send to chat
                </Button>
                
                <button className="cursor-pointer text-sm text-destructive hover:underline" onClick={onClose}> 
                    Cancel / Discard
                </button>
            
            </div>

        </aside>
    );
}