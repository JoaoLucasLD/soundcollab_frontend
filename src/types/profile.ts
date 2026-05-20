export type CollaborationGoal =
  | 'BAND'
  | 'RECORDING'
  | 'LIVE_SHOWS'
  | 'COMPOSITION'
  | 'PRODUCTION'
  | 'STUDY'
  | 'CASUAL_JAM'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

export type ProfileResponse = {
  id: string
  userId: string
  displayName: string
  city: string | null
  gender: Gender | null
  experience: number | null
  preferences: string | null
  bio: string | null
  collaborationGoals: CollaborationGoal[]
  instruments: string[]
  styles: string[]
  createdAt: string
  updatedAt: string
}

export type UpdateProfilePayload = {
  displayName?: string
  city?: string
  gender?: Gender
  experience?: number
  preferences?: string
  bio?: string
  collaborationGoals?: CollaborationGoal[]
}

export type UpdateProfileInstrumentsPayload = {
  instrumentIds: string[]
}

export type UpdateProfileStylesPayload = {
  styleIds: string[]
}
