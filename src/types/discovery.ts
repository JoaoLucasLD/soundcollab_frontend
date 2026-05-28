import type { AvailabilityPeriod, AvailabilityTime, CollaborationGoal, Gender } from './profile'

export type MatchScoreBreakdown = {
  availability: number
  collaborationGoals: number
  location: number
  style: number
  instrument: number
  experience: number
}

export type DiscoveryMusicianResponse = {
  id: string
  userId: string
  displayName: string
  city: string | null
  gender: Gender | null
  age: number | null
  distanceKm?: number | null
  experience: number | null
  bio: string | null
  preferences: string | null
  collaborationGoals: CollaborationGoal[]
  availabilityPeriods: AvailabilityPeriod[]
  availabilityTimes: AvailabilityTime[]
  instruments: string[]
  styles: string[]
  totalScore?: number
  scoreBreakdown?: MatchScoreBreakdown
}

export type DiscoveryMusiciansResponse = {
  musicians: DiscoveryMusicianResponse[]
  total: number
}

export type MatchmakingRankingResponse = {
  ranking: DiscoveryMusicianResponse[]
  total: number
}

export type DiscoveryMusiciansFilters = {
  city?: string
  gender?: Gender
  instrument?: string
  radiusKm?: number
  style?: string
}
