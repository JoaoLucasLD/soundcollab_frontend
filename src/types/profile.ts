export type CollaborationGoal =
  | 'BAND'
  | 'RECORDING'
  | 'LIVE_SHOWS'
  | 'COMPOSITION'
  | 'PRODUCTION'
  | 'STUDY'
  | 'CASUAL_JAM'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

export type AvailabilityPeriod = 'WEEKDAYS' | 'WEEKENDS'

export type AvailabilityTime = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type ProfileResponse = {
  id: string
  userId: string
  displayName: string
  city: string | null
  latitude?: number | null
  longitude?: number | null
  gender: Gender | null
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
  createdAt: string
  updatedAt: string
}

export type UpdateProfilePayload = {
  displayName?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  gender?: Gender
  birthDate?: string
  experience?: number
  preferences?: string
  bio?: string
  collaborationGoals?: CollaborationGoal[]
  availabilityPeriods?: AvailabilityPeriod[]
  availabilityTimes?: AvailabilityTime[]
  availabilityNotes?: string
}

export type UpdateProfileInstrumentsPayload = {
  instrumentIds: string[]
}

export type UpdateProfileStylesPayload = {
  styleIds: string[]
}
