import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MusicianCard } from '../components/MusicianCard'
import { PageHeader } from '../components/ui/PageHeader'
import { musicians } from '../lib/mock-musicians'

const instruments = ['Todos', 'Violino', 'Piano', 'Teclado', 'Synth', 'Saxofone', 'Flauta']
const styles = ['Todos', 'Classica', 'Jazz', 'Folk', 'Jazz Fusion', 'Blues', 'Bossa Nova', 'MPB']
const cities = ['Todas', 'Curitiba, PR', 'Rio de Janeiro, RJ']

export function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('Todos')
  const [styleFilter, setStyleFilter] = useState('Todos')
  const [cityFilter, setCityFilter] = useState('Todas')

  const filteredMusicians = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return musicians.filter((musician) => {
      const searchableText = [
        musician.name,
        musician.city,
        musician.experience,
        musician.bio,
        ...musician.instruments,
        ...musician.styles,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)
      const matchesInstrument =
        instrumentFilter === 'Todos' || musician.instruments.includes(instrumentFilter)
      const matchesStyle = styleFilter === 'Todos' || musician.styles.includes(styleFilter)
      const matchesCity = cityFilter === 'Todas' || musician.city === cityFilter

      return matchesSearch && matchesInstrument && matchesStyle && matchesCity
    })
  }, [cityFilter, instrumentFilter, searchTerm, styleFilter])

  const hasFilters =
    searchTerm.trim().length > 0 ||
    instrumentFilter !== 'Todos' ||
    styleFilter !== 'Todos' ||
    cityFilter !== 'Todas'

  function clearFilters() {
    setSearchTerm('')
    setInstrumentFilter('Todos')
    setStyleFilter('Todos')
    setCityFilter('Todas')
  }

  return (
    <>
      <PageHeader
        title="Descubra músicos"
        description={
          hasFilters
            ? `${filteredMusicians.length} resultado(s) encontrados`
            : `${musicians.length} músicos recomendados para você`
        }
      />

      <section className="mb-6 rounded-lg border border-zinc-800 bg-[#181818] p-4 shadow-sm shadow-black/30">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <label className="flex-1">
            <span className="mb-2 block text-sm font-semibold text-zinc-100">Buscar</span>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2.5">
              <Search className="text-zinc-400" size={19} />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, instrumento, estilo ou cidade"
              />
            </div>
          </label>

          <FilterSelect
            label="Instrumento"
            value={instrumentFilter}
            options={instruments}
            onChange={setInstrumentFilter}
          />
          <FilterSelect label="Estilo" value={styleFilter} options={styles} onChange={setStyleFilter} />
          <FilterSelect label="Cidade" value={cityFilter} options={cities} onChange={setCityFilter} />

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasFilters}
            onClick={clearFilters}
          >
            {hasFilters ? <X size={17} /> : <SlidersHorizontal size={17} />}
            Limpar
          </button>
        </div>
      </section>

      {filteredMusicians.length > 0 ? (
        <section className="grid items-stretch gap-6 xl:grid-cols-3">
          {filteredMusicians.map((musician) => (
            <MusicianCard key={musician.id} musician={musician} />
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-700 bg-[#181818] p-8 text-center">
          <h2 className="text-xl font-bold text-white">Nenhum músico encontrado</h2>
          <p className="mt-2 text-zinc-400">Tente remover algum filtro ou buscar por outro termo.</p>
        </section>
      )}
    </>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="min-w-40">
      <span className="mb-2 block text-sm font-semibold text-zinc-100">{label}</span>
      <select
        className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
