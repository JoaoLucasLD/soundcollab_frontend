import { useQuery } from '@tanstack/react-query'
import { listInstruments, listStyles } from '../services/catalog.service'

export const instrumentsQueryKey = ['catalogs', 'instruments']
export const stylesQueryKey = ['catalogs', 'styles']

export function useInstruments() {
  return useQuery({
    queryKey: instrumentsQueryKey,
    queryFn: listInstruments,
    staleTime: 1000 * 60 * 10,
  })
}

export function useStyles() {
  return useQuery({
    queryKey: stylesQueryKey,
    queryFn: listStyles,
    staleTime: 1000 * 60 * 10,
  })
}
