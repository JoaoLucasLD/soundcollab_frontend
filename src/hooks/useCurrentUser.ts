import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '../lib/api'
import { getMe } from '../services/auth.service'

export const currentUserQueryKey = ['auth', 'me']

export function useCurrentUser() {
  const token = getAuthToken()

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
