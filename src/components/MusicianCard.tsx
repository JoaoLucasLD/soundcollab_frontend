import { Heart, MapPin, Trophy, X } from 'lucide-react'
import type { Musician } from '../types/musician'
import { Tag } from './ui/Tag'

type MusicianCardProps = {
  musician: Musician
}

export function MusicianCard({ musician }: MusicianCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-[#181818] shadow-sm shadow-black/30">
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${musician.photoTone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_28%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.22),transparent_30%)]" />

      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div>
          <h2 className="text-xl font-bold text-white">
            {musician.name}, {musician.age}
          </h2>
          <p className="text-sm text-zinc-400">{musician.gender}</p>
        </div>

        <div className="space-y-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2">
            <MapPin className="text-[#1DC95A]" size={17} />
            {musician.city}
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
              <Tag key={instrument}>{instrument}</Tag>
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
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#141414] px-4 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800">
            <X size={17} />
            Ignorar
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] shadow-sm transition hover:bg-[#1CB352]">
            <Heart size={17} />
            Conectar
          </button>
        </div>
      </div>
    </article>
  )
}
