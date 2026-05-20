import type { Gender } from './profile'

export type DiscoveryMusicianResponse = {
  id: string
  userId: string
  displayName: string
  city: string | null
  gender: Gender | null
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
  gender?: Gender
  instrument?: string
  style?: string
}
