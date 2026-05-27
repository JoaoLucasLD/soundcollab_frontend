type ProfileAvatarProps = {
  name: string
  seed?: string
  label?: string
  variant?: 'card' | 'profile'
}

const avatarPalettes = [
  'from-[#1DC95A] via-[#18592F] to-[#141414]',
  'from-[#54E38E] via-[#1B7A3D] to-[#141414]',
  'from-[#38BDF8] via-[#176B87] to-[#141414]',
  'from-[#FACC15] via-[#755C12] to-[#141414]',
  'from-[#F97316] via-[#7C2D12] to-[#141414]',
  'from-[#A78BFA] via-[#4C1D95] to-[#141414]',
]

export function ProfileAvatar({ name, seed = name, label, variant = 'card' }: ProfileAvatarProps) {
  const initials = getInitials(name)
  const palette = avatarPalettes[getHashIndex(seed || name, avatarPalettes.length)]
  const isProfile = variant === 'profile'

  return (
    <div
      aria-label={`Avatar de ${name}`}
      className={[
        'relative flex overflow-hidden rounded-lg bg-gradient-to-br text-white',
        palette,
        isProfile ? 'aspect-square items-center justify-center' : 'aspect-[4/3] items-center justify-center',
      ].join(' ')}
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.36),transparent_28%),radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.18),transparent_30%)]" />
      <div
        className={[
          'relative flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 text-center shadow-2xl shadow-black/30 backdrop-blur-sm',
          isProfile ? 'size-32 gap-3' : 'size-24 gap-2',
        ].join(' ')}
      >
        <span className={isProfile ? 'text-5xl font-black' : 'text-4xl font-black'}>{initials}</span>
        {label ? (
          <span className="max-w-28 truncate px-2 text-xs font-bold text-zinc-100">{label}</span>
        ) : null}
      </div>
    </div>
  )
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'SC'
  }

  const firstInitial = words[0]?.[0] ?? ''
  const secondInitial = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : words[0]?.[1] ?? ''

  return `${firstInitial}${secondInitial}`.toUpperCase()
}

function getHashIndex(value: string, length: number) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash % length
}
