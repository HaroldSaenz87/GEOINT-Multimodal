// THIS IS JUST A SAMPLE UNTIL THE REAL ENDPOINT EXISTS!!!!! :)


// one row in the chat list (chats table)
export type Chat = {
  id: number
  title: string
  updated_at: string // "2026-11-06T15:00:00Z"
}

// one saved image (links to the images table)
export type MessageImage = {
  id: number
  thumb_url: string | null       // small preview; null = no preview yet (sample data)
}


export type ImagePair = {
  before: MessageImage | null    // null is no before image
  after: MessageImage            // always required
}

// one chat message (messages table)
export type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  pair?: ImagePair               // ? = optional; most messages have no images
}

// one saved image in the library (images table)
export type LibraryImage = {
  id: number
  source: 'snapshot' | 'upload' // map snapshot or uploaded from the device
  thumb_url: string | null      // small preview; null = no preview yet (sample data)
  capture_date: string | null   // when the satellite took it, if known
  created_at: string            // when it was saved in the app
}

// an area selected on the map (a snapshot box), in latitude / longitude
// matches what the back end needs to make the snapshot (images.area + zoom)
export type MapArea = {
  south: number                 // bottom edge (latitude)
  west: number                  // left edge (longitude)
  north: number                 // top edge (latitude)
  east: number                  // right edge (longitude)
  zoom: number                  // map zoom when it was selected (sets the image detail)
}

