import { CalendarDays, Edit3, Guitar, MapPin, Music, Target, Trophy } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'

export function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações musicais"
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414]">
            <Edit3 size={17} />
            Editar Perfil
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[370px_1fr]">
        <div className="space-y-6">
          <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 text-center shadow-sm shadow-black/30">
            <div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg bg-gradient-to-br from-[#1DC95A] via-[#18592F] to-[#141414] text-white">
              <div className="flex flex-col items-center gap-4 rounded-lg bg-white/15 px-8 py-7 backdrop-blur-sm">
                <Guitar size={56} />
                <span className="text-sm font-bold">Guitarra</span>
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-bold">Voce</h2>
            <p className="mt-1 text-zinc-400">28 anos · Masculino</p>
          </article>

          <ProfileInfoCard icon={<MapPin className="text-[#1DC95A]" size={22} />} title="Localização">
            <p>Sao Paulo, SP</p>
          </ProfileInfoCard>

          <ProfileInfoCard icon={<Trophy className="text-[#1DC95A]" size={22} />} title="Experiência Musical">
            <p>Intermediário</p>
            <p className="mt-2 text-sm text-zinc-400">10 anos tocando</p>
          </ProfileInfoCard>
        </div>

        <div className="space-y-6">
          <ProfileSection title="Sobre Mim" description="Conte um pouco sobre você e sua trajetória musical">
            <p className="text-lg leading-relaxed text-zinc-200">
              Guitarrista buscando formar banda de rock alternativo. Toco ha 10 anos e estou aberto a novos projetos.
            </p>
          </ProfileSection>

          <ProfileSection
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Instrumentos"
            description="Instrumentos que você toca"
          >
            <div className="flex flex-wrap gap-2">
              <Tag>Guitarra</Tag>
              <Tag>Violao</Tag>
            </div>
          </ProfileSection>

          <ProfileSection
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Estilos Musicais"
            description="Estilos que você toca"
          >
            <div className="flex flex-wrap gap-2">
              <Tag>Rock</Tag>
              <Tag>Blues</Tag>
              <Tag>Jazz</Tag>
            </div>
          </ProfileSection>

          <ProfileSection
            icon={<Target className="text-[#1DC95A]" size={22} />}
            title="Objetivos de Colaboração"
            description="O que você está procurando na plataforma"
          >
            <div className="flex flex-wrap gap-2">
              <Tag>Formar banda</Tag>
              <Tag>Gravar musicas</Tag>
            </div>
          </ProfileSection>

          <ProfileSection
            icon={<CalendarDays className="text-[#1DC95A]" size={22} />}
            title="Disponibilidade"
            description="Quando você costuma estar disponível"
          >
            <div className="flex flex-wrap gap-2">
              <Tag>Noites</Tag>
              <Tag>Fins de semana</Tag>
            </div>
          </ProfileSection>
        </div>
      </section>
    </>
  )
}

type ProfileInfoCardProps = {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function ProfileInfoCard({ icon, title, children }: ProfileInfoCardProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-sm shadow-black/30">
      <div className="mb-7 flex items-center gap-3 font-bold">
        {icon}
        <h2>{title}</h2>
      </div>
      <div className="text-zinc-100">{children}</div>
    </article>
  )
}

type ProfileSectionProps = {
  icon?: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

function ProfileSection({ icon, title, description, children }: ProfileSectionProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-sm shadow-black/30">
      <div className="mb-7">
        <div className="flex items-center gap-3 font-bold">
          {icon}
          <h2>{title}</h2>
        </div>
        <p className="mt-2 text-zinc-400">{description}</p>
      </div>
      {children}
    </article>
  )
}
