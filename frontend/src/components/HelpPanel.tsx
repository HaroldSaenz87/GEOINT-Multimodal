
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

                <Card className="w-full" size="sm">

                

                    <CardHeader>

                        <CardTitle>
                            Help
                        </CardTitle>

                        <CardAction>
                            
                            <Button variant="ghost" size="icon-xs" aria-label="Close help" onClick={() => setOpen(false)} >
                                <X />
                            </Button>
                        
                        </CardAction>

                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">

                        <p className="text-sm text-muted-foreground">
                            Quick and useful information here. Use the "Full Guide" button to view more.
                        </p>

                        <Button variant="outline" className="w-full">
                            Full Guide
                        </Button>
                    
                    </CardContent>

                </Card>


            )}
        
        </div>
    );
}
