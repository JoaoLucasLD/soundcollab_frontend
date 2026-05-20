import type { CollaborationGoal } from './profile'

export type UserProfile = {
  id: string
  displayName: string
  city: string | null
  experience: number | null
  preferences: string | null
  bio: string | null
  collaborationGoals: CollaborationGoal[]
  instruments: string[]
  styles: string[]
}

export type CurrentUser = {
  id: string
  email: string
  createdAt: string
  profile: UserProfile | null
}
