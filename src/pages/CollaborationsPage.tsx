import { CalendarDays, Check, Clock, X } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'

const collaborations = [
  {
    name: 'Marina Costa',
    title: 'Projeto autoral de indie rock',
    status: 'Pendente',
    date: 'Enviado hoje',
    tags: ['Vocal', 'Rock', 'Composicao'],
  },
  {
    name: 'Rafael Lima',
    title: 'Sessao de gravacao para EP',
    status: 'Aceita',
    date: 'Ontem',
    tags: ['Guitarra', 'Blues'],
  },
]

export function CollaborationsPage() {
  return (
    <>
      <PageHeader title="Colaborações" description="Acompanhe convites, conexões e projetos musicais" />

      <section className="space-y-4">
        {collaborations.map((collaboration) => (
          <article key={collaboration.title} className="rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-sm shadow-black/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1DC95A]">{collaboration.name}</p>
                <h2 className="mt-1 text-xl font-bold text-white">{collaboration.title}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <CalendarDays size={16} />
                  {collaboration.date}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-100">
                <Clock size={15} />
                {collaboration.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {collaboration.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414]">
                <Check size={16} />
                Aceitar
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100">
                <X size={16} />
                Recusar
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
