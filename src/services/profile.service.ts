import { api } from '../lib/api'
import type {
  ProfileResponse,
  UpdateProfileInstrumentsPayload,
  UpdateProfilePayload,
  UpdateProfileStylesPayload,
} from '../types/profile'

export async function getProfileByUserId(userId: string) {
  const { data } = await api.get<ProfileResponse>(`/profiles/users/${userId}`)
  return data
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const { data } = await api.patch<ProfileResponse>('/profiles/me', payload)
  return data
}

export async function replaceMyInstruments(payload: UpdateProfileInstrumentsPayload) {
  const { data } = await api.put<ProfileResponse>('/profiles/me/instruments', payload)
  return data
}

export async function replaceMyStyles(payload: UpdateProfileStylesPayload) {
  const { data } = await api.put<ProfileResponse>('/profiles/me/styles', payload)
  return data
}
