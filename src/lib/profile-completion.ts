import type { UserProfile } from '../types/user'

export function isProfileComplete(profile: UserProfile | null | undefined) {
  return Boolean(
    profile?.displayName &&
      profile.city &&
      profile.gender &&
      profile.birthDate &&
      typeof profile.experience === 'number' &&
      profile.instruments.length > 0 &&
      profile.styles.length > 0,
  )
}
