export type DiscoveryMusicianResponse = {
  id: string
  userId: string
  displayName: string
  city: string | null
  experience: number | null
  preferences: string | null
  instruments: string[]
  styles: string[]
}

export type DiscoveryMusiciansResponse = {
  musicians: DiscoveryMusicianResponse[]
  total: number
}

export type DiscoveryMusiciansFilters = {
  city?: string
  instrument?: string
  style?: string
}
