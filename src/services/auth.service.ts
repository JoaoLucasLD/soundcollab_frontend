import { api, saveAuthToken } from '../lib/api'
import type { AuthResponse, LoginPayload, SignupPayload } from '../types/auth'
import type { CurrentUser } from '../types/user'

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  saveAuthToken(data.accessToken)
  return data
}

export async function signup(payload: SignupPayload) {
  const { data } = await api.post<AuthResponse>('/auth/signup', payload)
  saveAuthToken(data.accessToken)
  return data
}

export async function getMe() {
  const { data } = await api.get<CurrentUser>('/users/me')
  return data
}
