import type { Collaboration } from '../types/collaboration'

export type MusicianCollaborationState = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED'

export function getCollaborationStateForUser(
  collaborations: Collaboration[],
  musicianUserId: string | null | undefined,
): MusicianCollaborationState {
  if (!musicianUserId) {
    return 'NONE'
  }

  const relevantCollaborations = collaborations.filter(
    (collaboration) =>
      collaboration.requesterId === musicianUserId ||
      collaboration.receiverId === musicianUserId ||
      collaboration.requester?.userId === musicianUserId ||
      collaboration.receiver?.userId === musicianUserId,
  )

  if (relevantCollaborations.some((collaboration) => collaboration.status === 'ACCEPTED')) {
    return 'ACCEPTED'
  }

  const pendingCollaboration = relevantCollaborations.find((collaboration) => collaboration.status === 'PENDING')

  if (!pendingCollaboration) {
    return 'NONE'
  }

  return pendingCollaboration.direction === 'RECEIVED' ? 'PENDING_RECEIVED' : 'PENDING_SENT'
}

export function getPendingSentCollaborationForUser(
  collaborations: Collaboration[],
  musicianUserId: string | null | undefined,
) {
  if (!musicianUserId) {
    return null
  }

  return (
    collaborations.find(
      (collaboration) =>
        collaboration.status === 'PENDING' &&
        collaboration.direction === 'SENT' &&
        (collaboration.receiverId === musicianUserId || collaboration.receiver?.userId === musicianUserId),
    ) ?? null
  )
}
