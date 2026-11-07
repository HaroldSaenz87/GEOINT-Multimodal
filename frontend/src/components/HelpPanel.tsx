
import { useState } from 'react'
import { Button } from './ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';

export default function HelpPanel() {

    const [open, setOpen] = useState(false);


    return (

        <div className="absolute top-4 right-4 z-1000 flex w-72 flex-col items-end gap-2">
            
            <Button size="lg" className="cursor-pointer rounded-full px-4" onClick={() => setOpen(!open)} >
                Help
            </Button>

            {open && (

                <Card className="w-full gap-0 py-0 shadow-md">


                    {/* gray strip with a line under it */}
                    <CardHeader className="items-center border-b bg-muted/50 py-3">

                        <CardTitle className="text-sm">
                            Help
                        </CardTitle>

                        <CardAction className="self-center">
                            {/* round white close button with a thin border */}
                            <Button
                                variant="outline"
                                size="icon-xs"
                                className="cursor-pointer rounded-full"
                                aria-label="Close help"
                                onClick={() => setOpen(false)}
                            >
                                <X className="size-3.5" />
                            </Button>

                        </CardAction>

                    </CardHeader>

                    
                    <CardContent className="flex flex-col gap-3 py-4">

                        <p className="text-sm leading-snug text-muted-foreground">
                            Quick and useful information here. Use the "Full Guide" button to view more.
                        </p>

                        {/* the light gray button */}
                        <Button variant="outline" size="lg" className="w-full cursor-pointer bg-muted/50 hover:bg-foreground/10">
                            Full Guide
                        </Button>

                    </CardContent>

                </Card>


            )}
        
        </div>
    );
}
