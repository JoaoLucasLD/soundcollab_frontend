import { Check, Heart, MailCheck, MapPin, MessageCircle, Trophy, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MusicianCollaborationState } from '../lib/collaboration-state'
import { capitalizeDisplayName } from '../lib/text-format'
import type { Musician } from '../types/musician'
import { Tag } from './ui/Tag'

type MusicianCardProps = {
  musician: Musician
  collaborationState?: MusicianCollaborationState
  isCancelingRequest?: boolean
  isConnecting?: boolean
  onCancelRequest?: (musician: Musician) => void
  onConnect?: (musician: Musician) => void
}

export function MusicianCard({
  musician,
  collaborationState = 'NONE',
  isCancelingRequest = false,
  isConnecting = false,
  onCancelRequest,
  onConnect,
}: MusicianCardProps) {
  const connectButton = getConnectButtonState(collaborationState, isConnecting)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-[#181818] shadow-sm shadow-black/30">
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${musician.photoTone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_28%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.22),transparent_30%)]" />
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div>
          <h2 className="text-xl font-bold text-white">
            {musician.name}
            {musician.age ? `, ${musician.age}` : null}
          </h2>
          {musician.gender ? <p className="text-sm text-zinc-400">{musician.gender}</p> : null}
        </div>

        <div className="space-y-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2">
            <MapPin className="text-[#1DC95A]" size={17} />
            {musician.city}
            {typeof musician.distanceKm === 'number' ? (
              <span className="text-zinc-500">- {musician.distanceKm} km</span>
            ) : null}
          </p>
          <p className="flex items-center gap-2">
            <Trophy className="text-[#1DC95A]" size={17} />
            {musician.experience}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs text-zinc-400">Instrumentos:</p>
          <div className="flex flex-wrap gap-2">
            {musician.instruments.map((instrument) => (
              <Tag key={instrument}>{capitalizeDisplayName(instrument)}</Tag>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-zinc-400">Estilos:</p>
          <div className="flex flex-wrap gap-2">
            {musician.styles.map((style) => (
              <Tag key={style}>{style}</Tag>
            ))}
          </div>
        </div>

        <p className="min-h-12 text-sm leading-relaxed text-zinc-200">{musician.bio}</p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#141414] px-4 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            to={musician.userId ? `/musicos/${musician.userId}` : '/descobrir'}
          >
            <UserRound size={17} />
            Ver perfil
          </Link>
          {collaborationState === 'PENDING_RECEIVED' ? (
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1DC95A]/70 bg-[#1DC95A]/10 px-4 py-3 text-sm font-bold text-[#1DC95A] transition hover:bg-[#1DC95A]/15"
              to="/colaboracoes?tab=received"
            >
              <MessageCircle size={17} />
              Responder
            </Link>
          ) : collaborationState === 'PENDING_SENT' ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                disabled
                type="button"
              >
                <MailCheck size={17} />
                Enviado
              </button>
              <button
                aria-label={`Cancelar solicitação para ${musician.name}`}
                className="inline-flex size-12 items-center justify-center rounded-lg border border-zinc-700 bg-[#141414] text-zinc-100 transition hover:border-red-400/60 hover:bg-red-950/30 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isCancelingRequest}
                onClick={() => onCancelRequest?.(musician)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] shadow-sm transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={connectButton.disabled || !musician.userId}
              onClick={() => onConnect?.(musician)}
              type="button"
            >
              {connectButton.icon}
              {connectButton.label}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function getConnectButtonState(collaborationState: MusicianCollaborationState, isConnecting: boolean) {
  if (isConnecting) {
    return { disabled: true, icon: <Heart size={17} />, label: 'Enviando...' }
  }

  if (collaborationState === 'PENDING_SENT') {
    return { disabled: true, icon: <MailCheck size={17} />, label: 'Enviado' }
  }

  if (collaborationState === 'ACCEPTED') {
    return { disabled: true, icon: <Check size={17} />, label: 'Conectado' }
  }

  return { disabled: false, icon: <Heart size={17} />, label: 'Conectar' }
}

