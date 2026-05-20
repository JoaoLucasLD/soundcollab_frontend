import { useQuery } from '@tanstack/react-query'
import { listDiscoveryMusicians } from '../services/discovery.service'
import type { DiscoveryMusiciansFilters } from '../types/discovery'

export const discoveryMusiciansQueryKey = ['discovery', 'musicians']

export function useDiscoveryMusicians(filters: DiscoveryMusiciansFilters) {
  return useQuery({
    queryKey: [...discoveryMusiciansQueryKey, filters],
    queryFn: () => listDiscoveryMusicians(filters),
    staleTime: 1000 * 60 * 2,
  })
}
