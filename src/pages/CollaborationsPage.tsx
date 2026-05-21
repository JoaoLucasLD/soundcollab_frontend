import { CalendarDays, Check, Clock, MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'
import {
  useAcceptCollaboration,
  useCollaborations,
  useRejectCollaboration,
} from '../hooks/useCollaborations'
import { capitalizeDisplayName } from '../lib/text-format'
import type { Collaboration, CollaborationStatus } from '../types/collaboration'

const statusLabels: Record<CollaborationStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
}

const collaborationTabs = [
  { id: 'accepted', label: 'Aceitas' },
  { id: 'received', label: 'Recebidas' },
  { id: 'sent', label: 'Enviadas' },
  { id: 'rejected', label: 'Recusadas' },
] as const

type CollaborationTab = (typeof collaborationTabs)[number]['id']
type CollaborationGroups = Record<CollaborationTab, Collaboration[]>

export function CollaborationsPage() {
  const { data, isError, isLoading, refetch } = useCollaborations()
  const acceptMutation = useAcceptCollaboration()
  const rejectMutation = useRejectCollaboration()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<CollaborationTab>('accepted')
  const collaborations = data?.items ?? []
  const collaborationGroups = useMemo(() => groupCollaborations(collaborations), [collaborations])
  const activeCollaborations = collaborationGroups[activeTab]

  useEffect(() => {
    const tab = searchParams.get('tab')

    if (isCollaborationTab(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  function isUpdating(collaborationId: string) {
    return (
      (acceptMutation.isPending && acceptMutation.variables === collaborationId) ||
      (rejectMutation.isPending && rejectMutation.variables === collaborationId)
    )
  }

  return (
    <>
      <PageHeader title="Colaborações" description="Acompanhe convites, conexões e projetos musicais" />

      {isLoading ? (
        <FeedbackState title="Carregando colaborações" description="Buscando seus convites musicais..." />
      ) : null}

      {isError ? (
        <FeedbackState
          title="Não foi possível carregar as colaborações"
          description="Verifique se o backend está rodando e tente novamente."
          action={
            <button
              className="rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414]"
              onClick={() => refetch()}
              type="button"
            >
              Tentar de novo
            </button>
          }
        />
      ) : null}

      {!isLoading && !isError && collaborations.length === 0 ? (
        <FeedbackState
          title="Nenhuma colaboração por enquanto"
          description="Quando você enviar ou receber convites, eles aparecerão aqui."
        />
      ) : null}

      {!isLoading && !isError && collaborations.length > 0 ? (
        <section className="space-y-4">
          <div className="grid gap-2 rounded-lg border border-zinc-800 bg-[#181818] p-2 shadow-sm shadow-black/30 sm:grid-cols-4">
            {collaborationTabs.map((tab) => {
              const isActive = activeTab === tab.id
              const count = collaborationGroups[tab.id].length

              return (
                <button
                  className={[
                    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition',
                    isActive
                      ? 'bg-[#1DC95A] text-[#141414]'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
                  ].join(' ')}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSearchParams(tab.id === 'accepted' ? {} : { tab: tab.id })
                  }}
                  type="button"
                >
                  {tab.label}
                  <span
                    className={[
                      'inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs',
                      isActive ? 'bg-[#141414] text-[#1DC95A]' : 'bg-zinc-800 text-zinc-300',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {activeCollaborations.length > 0 ? (
            <div className="space-y-4">
              {activeCollaborations.map((collaboration) => (
                <CollaborationCard
                  acceptMutation={acceptMutation}
                  collaboration={collaboration}
                  isUpdating={isUpdating(collaboration.id)}
                  key={collaboration.id}
                  rejectMutation={rejectMutation}
                />
              ))}
            </div>
          ) : (
            <FeedbackState
              title={emptyStateByTab[activeTab].title}
              description={emptyStateByTab[activeTab].description}
            />
          )}
        </section>
      ) : null}
    </>
  )
}

function isCollaborationTab(value: string | null): value is CollaborationTab {
  return collaborationTabs.some((tab) => tab.id === value)
}

const emptyStateByTab: Record<CollaborationTab, { title: string; description: string }> = {
  accepted: {
    title: 'Nenhuma colaboração aceita',
    description: 'Quando um convite for aceito, a conexão aparecerá aqui para facilitar o acesso.',
  },
  received: {
    title: 'Nenhum convite recebido',
    description: 'Convites que precisam da sua resposta aparecerão nesta aba.',
  },
  sent: {
    title: 'Nenhum convite enviado',
    description: 'Quando você convidar alguém para colaborar, acompanhe a resposta por aqui.',
  },
  rejected: {
    title: 'Nenhum convite recusado',
    description: 'Convites recusados ficam separados para não misturar com conexões ativas.',
  },
}

function groupCollaborations(collaborations: Collaboration[]): CollaborationGroups {
  return collaborations.reduce<CollaborationGroups>(
    (groups, collaboration) => {
      if (collaboration.status === 'ACCEPTED') {
        groups.accepted.push(collaboration)
        return groups
      }

      if (collaboration.status === 'REJECTED') {
        groups.rejected.push(collaboration)
        return groups
      }

      if (collaboration.direction === 'RECEIVED') {
        groups.received.push(collaboration)
        return groups
      }

      groups.sent.push(collaboration)
      return groups
    },
    { accepted: [], received: [], sent: [], rejected: [] },
  )
}

type CollaborationCardProps = {
  acceptMutation: ReturnType<typeof useAcceptCollaboration>
  collaboration: Collaboration
  isUpdating: boolean
  rejectMutation: ReturnType<typeof useRejectCollaboration>
}

function CollaborationCard({ acceptMutation, collaboration, isUpdating, rejectMutation }: CollaborationCardProps) {
  const otherProfile = collaboration.direction === 'SENT' ? collaboration.receiver : collaboration.requester
  const canRespond = collaboration.direction === 'RECEIVED' && collaboration.status === 'PENDING'

  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-sm shadow-black/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1DC95A]">{getCollaborationLabel(collaboration)}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{otherProfile?.displayName ?? 'Perfil indisponível'}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <CalendarDays size={16} />
            {formatDate(collaboration.createdAt)}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-100">
          <Clock size={15} />
          {statusLabels[collaboration.status]}
        </span>
      </div>

      {otherProfile ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {otherProfile.instruments.map((instrument) => (
            <Tag key={instrument}>{capitalizeDisplayName(instrument)}</Tag>
          ))}
          {otherProfile.styles.map((style) => (
            <Tag key={style}>{style}</Tag>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {otherProfile ? (
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            to={`/musicos/${otherProfile.userId}?from=collaborations&tab=${getTabForCollaboration(collaboration)}`}
          >
            <Send size={16} />
            Ver perfil
          </Link>
        ) : null}

        {collaboration.status === 'ACCEPTED' ? (
          <button
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[#1DC95A]/50 bg-[#1DC95A]/10 px-4 py-2.5 text-sm font-bold text-[#1DC95A]"
            disabled
            type="button"
          >
            <MessageCircle size={16} />
            Chat em breve
          </button>
        ) : null}

        {canRespond ? (
          <>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isUpdating}
              onClick={() => acceptMutation.mutate(collaboration.id)}
              type="button"
            >
              <Check size={16} />
              Aceitar
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isUpdating}
              onClick={() => rejectMutation.mutate(collaboration.id)}
              type="button"
            >
              <X size={16} />
              Recusar
            </button>
          </>
        ) : null}
      </div>
    </article>
  )
}

function getTabForCollaboration(collaboration: Collaboration): CollaborationTab {
  if (collaboration.status === 'ACCEPTED') {
    return 'accepted'
  }

  if (collaboration.status === 'REJECTED') {
    return 'rejected'
  }

  return collaboration.direction === 'RECEIVED' ? 'received' : 'sent'
}

function getCollaborationLabel(collaboration: Collaboration) {
  if (collaboration.status === 'ACCEPTED') {
    return 'Colaboração aceita'
  }

  if (collaboration.status === 'REJECTED') {
    return collaboration.direction === 'SENT' ? 'Convite enviado recusado' : 'Convite recebido recusado'
  }

  return collaboration.direction === 'SENT' ? 'Convite enviado' : 'Convite recebido'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

type FeedbackStateProps = {
  title: string
  description: string
  action?: ReactNode
}

function FeedbackState({ title, description, action }: FeedbackStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-zinc-700 bg-[#181818] p-8 text-center">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-zinc-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  )
}
