import { CalendarDays, Check, Clock, Send, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'
import {
  useAcceptCollaboration,
  useCollaborations,
  useRejectCollaboration,
} from '../hooks/useCollaborations'
import { capitalizeDisplayName } from '../lib/text-format'
import type { CollaborationStatus } from '../types/collaboration'

const statusLabels: Record<CollaborationStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
}

export function CollaborationsPage() {
  const { data, isError, isLoading, refetch } = useCollaborations()
  const acceptMutation = useAcceptCollaboration()
  const rejectMutation = useRejectCollaboration()
  const collaborations = data?.items ?? []

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
          {collaborations.map((collaboration) => {
            const otherProfile =
              collaboration.direction === 'SENT' ? collaboration.receiver : collaboration.requester
            const canRespond = collaboration.direction === 'RECEIVED' && collaboration.status === 'PENDING'
            const updating = isUpdating(collaboration.id)

            return (
              <article
                key={collaboration.id}
                className="rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-sm shadow-black/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1DC95A]">
                      {collaboration.direction === 'SENT' ? 'Convite enviado' : 'Convite recebido'}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      {otherProfile?.displayName ?? 'Perfil indisponível'}
                    </h2>
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
                      to={`/musicos/${otherProfile.userId}`}
                    >
                      <Send size={16} />
                      Ver perfil
                    </Link>
                  ) : null}

                  {canRespond ? (
                    <>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={updating}
                        onClick={() => acceptMutation.mutate(collaboration.id)}
                        type="button"
                      >
                        <Check size={16} />
                        Aceitar
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={updating}
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
          })}
        </section>
      ) : null}
    </>
  )
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
