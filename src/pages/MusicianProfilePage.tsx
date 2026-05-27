import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Heart,
  MailCheck,
  MapPin,
  MessageCircle,
  Music,
  Target,
  Trophy,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ProfileAvatar } from '../components/ui/ProfileAvatar'
import { Tag } from '../components/ui/Tag'
import { useCollaborations, useCreateCollaboration } from '../hooks/useCollaborations'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { formatAvailabilitySummary } from '../lib/availability'
import { getCollaborationGoalLabel } from '../lib/collaboration-goals'
import { getCollaborationStateForUser, type MusicianCollaborationState } from '../lib/collaboration-state'
import { getGenderLabel } from '../lib/gender'
import { capitalizeDisplayName } from '../lib/text-format'
import { getProfileByIdentifier } from '../services/profile.service'

export function MusicianProfilePage() {
  const { userId: profileIdentifier } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()
  const { data: collaborationsResult } = useCollaborations()
  const collaborations = collaborationsResult?.items ?? []

  const {
    data: profile,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profiles', 'identifier', profileIdentifier],
    queryFn: () => getProfileByIdentifier(profileIdentifier ?? ''),
    enabled: Boolean(profileIdentifier),
    staleTime: 1000 * 60 * 2,
  })
  const isOwnProfile = Boolean(profile?.userId && currentUser?.id === profile.userId)

  const createCollaborationMutation = useCreateCollaboration()

  function handleConnect() {
    if (!profile?.userId) {
      return
    }

    createCollaborationMutation.mutate({ receiverId: profile.userId })
  }

  const about = profile?.bio || profile?.preferences || 'Perfil musical em construção.'
  const mainInstrument = profile?.instruments[0] ?? 'Música'
  const gender = getGenderLabel(profile?.gender)
  const collaborationGoalLabels = (profile?.collaborationGoals ?? []).map(getCollaborationGoalLabel)
  const availabilitySummary = formatAvailabilitySummary(
    profile?.availabilityPeriods ?? [],
    profile?.availabilityTimes ?? [],
    profile?.availabilityNotes,
  )
  const collaborationState = getCollaborationStateForUser(collaborations, profile?.userId)
  const connectButton = getConnectButtonState(collaborationState, createCollaborationMutation.isPending)
  const backTarget = getBackTarget(searchParams)

  return (
    <>
      <PageHeader
        title={profile?.displayName ?? 'Perfil do músico'}
        description="Confira as informações do perfil e conecte-se para começar uma colaboração."
        action={
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            to={backTarget}
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        }
      />

      {isLoading ? (
        <FeedbackState title="Carregando perfil" description="Buscando informações do músico..." />
      ) : null}

      {isError ? (
        <FeedbackState
          title="Perfil não encontrado"
          description="Esse músico pode ter removido o perfil ou não estar mais disponível."
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

      {profile ? (
        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <article className="rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-sm shadow-black/30">
              <ProfileAvatar
                label={capitalizeDisplayName(mainInstrument)}
                name={profile.displayName}
                seed={profile.userId}
                variant="profile"
              />
              <h2 className="mt-5 text-2xl font-bold text-white">{profile.displayName}</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p className="flex items-center gap-2">
                  <MapPin className="text-[#1DC95A]" size={17} />
                  {profile.city ?? 'Cidade não informada'}
                </p>
                <p className="flex items-center gap-2">
                  <Trophy className="text-[#1DC95A]" size={17} />
                  {formatExperience(profile.experience)}
                </p>
                <p className="text-zinc-400">{gender}</p>
                {typeof profile.age === 'number' ? <p className="text-zinc-400">{profile.age} anos</p> : null}
              </div>

              {collaborationState === 'PENDING_RECEIVED' ? (
                <Link
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#1DC95A]/70 bg-[#1DC95A]/10 px-4 py-3 text-sm font-bold text-[#1DC95A] transition hover:bg-[#1DC95A]/15"
                  to="/colaboracoes?tab=received"
                >
                  <MessageCircle size={17} />
                  Responder convite
                </Link>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isOwnProfile || connectButton.disabled}
                  onClick={handleConnect}
                  type="button"
                >
                  {connectButton.icon}
                  {connectButton.label}
                </button>
              )}

              {isOwnProfile ? <p className="mt-3 text-sm text-zinc-400">Este é o seu perfil.</p> : null}
              {createCollaborationMutation.isSuccess ? (
                <p className="mt-3 text-sm text-[#1DC95A]">Convite de colaboração enviado.</p>
              ) : null}
              {createCollaborationMutation.isError ? (
                <p className="mt-3 text-sm text-red-300">
                  Não foi possível enviar o convite. Talvez já exista uma colaboração pendente.
                </p>
              ) : null}
            </article>
          </aside>

          <div className="space-y-6">
            <ProfileSection title="Sobre" icon={<Target className="text-[#1DC95A]" size={22} />}>
              <p className="text-lg leading-relaxed text-zinc-200">{about}</p>
            </ProfileSection>

            <ProfileSection title="Objetivos" icon={<Target className="text-[#1DC95A]" size={22} />}>
              <TagList items={collaborationGoalLabels} emptyText="Nenhum objetivo informado" />
            </ProfileSection>

            <ProfileSection title="Instrumentos" icon={<Music className="text-[#1DC95A]" size={22} />}>
              <TagList items={profile.instruments.map(capitalizeDisplayName)} emptyText="Nenhum instrumento informado" />
            </ProfileSection>

            <ProfileSection title="Estilos musicais" icon={<Music className="text-[#1DC95A]" size={22} />}>
              <TagList items={profile.styles} emptyText="Nenhum estilo informado" />
            </ProfileSection>

            <ProfileSection title="Disponibilidade" icon={<CalendarDays className="text-[#1DC95A]" size={22} />}>
              <div className="space-y-2 text-zinc-200">
                {availabilitySummary.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </ProfileSection>
          </div>
        </section>
      ) : null}
    </>
  )
}

function getConnectButtonState(collaborationState: MusicianCollaborationState, isConnecting: boolean) {
  if (isConnecting) {
    return { disabled: true, icon: <Heart size={17} />, label: 'Enviando...' }
  }

  if (collaborationState === 'PENDING_SENT') {
    return { disabled: true, icon: <MailCheck size={17} />, label: 'Convite enviado' }
  }

  if (collaborationState === 'ACCEPTED') {
    return { disabled: true, icon: <Check size={17} />, label: 'Conectado' }
  }

  return { disabled: false, icon: <Heart size={17} />, label: 'Conectar' }
}

function getBackTarget(searchParams: URLSearchParams) {
  if (searchParams.get('from') !== 'collaborations') {
    return '/descobrir'
  }

  const tab = searchParams.get('tab')
  return tab ? `/colaboracoes?tab=${tab}` : '/colaboracoes'
}

function formatExperience(experience: number | null) {
  if (experience === null) {
    return 'Experiência não informada'
  }

  if (experience === 1) {
    return '1 ano de experiência'
  }

  return `${experience} anos de experiência`
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

type ProfileSectionProps = {
  title: string
  icon: ReactNode
  children: ReactNode
}

function ProfileSection({ title, icon, children }: ProfileSectionProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-sm shadow-black/30">
      <div className="mb-5 flex items-center gap-3 font-bold">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  )
}

type TagListProps = {
  items: string[]
  emptyText: string
}

function TagList({ items, emptyText }: TagListProps) {
  if (items.length === 0) {
    return <p className="text-zinc-400">{emptyText}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </div>
  )
}
