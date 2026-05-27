import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptCollaboration,
  cancelCollaboration,
  createCollaboration,
  listCollaborations,
  rejectCollaboration,
} from '../services/collaboration.service'

export const collaborationsQueryKey = ['collaborations']

export function useCollaborations() {
  return useQuery({
    queryKey: collaborationsQueryKey,
    queryFn: listCollaborations,
    staleTime: 1000 * 60,
  })
}

export function useCreateCollaboration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationsQueryKey })
    },
  })
}

export function useAcceptCollaboration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationsQueryKey })
    },
  })
}

export function useRejectCollaboration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationsQueryKey })
    },
  })
}

export function useCancelCollaboration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationsQueryKey })
    },
  })
}
