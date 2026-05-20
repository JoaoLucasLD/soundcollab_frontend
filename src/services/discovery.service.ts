import { api } from '../lib/api'
import type {
  DiscoveryMusiciansFilters,
  DiscoveryMusiciansResponse,
} from '../types/discovery'

export async function listDiscoveryMusicians(filters: DiscoveryMusiciansFilters) {
  const { data } = await api.get<DiscoveryMusiciansResponse>('/explore/musicians', {
    params: filters,
  })

  return data
}
