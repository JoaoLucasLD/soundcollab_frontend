import type { AvailabilityPeriod, AvailabilityTime, CollaborationGoal, Gender } from './profile'

export type UserProfile = {
  id: string
  displayName: string
  city: string | null
  gender: Gender | null
  birthDate: string | null
  age: number | null
  experience: number | null
  preferences: string | null
  bio: string | null
  collaborationGoals: CollaborationGoal[]
  availabilityPeriods: AvailabilityPeriod[]
  availabilityTimes: AvailabilityTime[]
  availabilityNotes: string | null
  instruments: string[]
  styles: string[]
}

export type CurrentUser = {
  id: string
  email: string
  createdAt: string
  profile: UserProfile | null
}
