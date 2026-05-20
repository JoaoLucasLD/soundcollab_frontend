export type CollaborationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type CollaborationDirection = 'SENT' | 'RECEIVED'

export type CollaborationProfileSummary = {
  userId: string
  displayName: string
  city: string | null
  instruments: string[]
  styles: string[]
}

export type Collaboration = {
  id: string
  requesterId: string
  receiverId: string
  matchId: string | null
  status: CollaborationStatus
  direction: CollaborationDirection
  requester: CollaborationProfileSummary | null
  receiver: CollaborationProfileSummary | null
  createdAt: string
}

export type ListCollaborationsResponse = {
  items: Collaboration[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreateCollaborationPayload = {
  receiverId: string
}
