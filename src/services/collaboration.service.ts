import { api } from '../lib/api'
import type {
  Collaboration,
  CreateCollaborationPayload,
  ListCollaborationsResponse,
} from '../types/collaboration'

export async function listCollaborations() {
  const { data } = await api.get<ListCollaborationsResponse>('/collaborations')
  return data
}

export async function createCollaboration(payload: CreateCollaborationPayload) {
  const { data } = await api.post<Collaboration>('/collaborations', payload)
  return data
}

export async function acceptCollaboration(collaborationId: string) {
  const { data } = await api.patch<Collaboration>(`/collaborations/${collaborationId}/accept`)
  return data
}

export async function rejectCollaboration(collaborationId: string) {
  const { data } = await api.patch<Collaboration>(`/collaborations/${collaborationId}/reject`)
  return data
}
