export type UserProfile = {
  id: string
  displayName: string
  city: string | null
  experience: number | null
  preferences: string | null
  instruments: string[]
  styles: string[]
}

export type CurrentUser = {
  id: string
  email: string
  createdAt: string
  profile: UserProfile | null
}
