import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { MusicianCard } from '../components/MusicianCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useInstruments, useStyles } from '../hooks/useCatalogs'
import { useCreateCollaboration } from '../hooks/useCollaborations'
import { useDiscoveryMusicians } from '../hooks/useDiscoveryMusicians'
import { genderOptions, getGenderLabel } from '../lib/gender'
import type { DiscoveryMusicianResponse } from '../types/discovery'
import type { Musician } from '../types/musician'
import type { Gender } from '../types/profile'

const allInstrumentsOption = 'Todos'
const allStylesOption = 'Todos'
const allCitiesOption = 'Todas'
const allGendersOption = 'Todos' as const
type GenderFilter = Gender | typeof allGendersOption

const photoTones = [
  'from-[#1DC95A] via-[#18592F] to-[#141414]',
  'from-[#1CB352] via-zinc-700 to-[#141414]',
  'from-[#1B9C49] via-zinc-800 to-[#141414]',
  'from-emerald-400 via-zinc-700 to-[#141414]',
]

export function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState(allInstrumentsOption)
  const [styleFilter, setStyleFilter] = useState(allStylesOption)
  const [cityFilter, setCityFilter] = useState(allCitiesOption)
  const [genderFilter, setGenderFilter] = useState<GenderFilter>(allGendersOption)
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null)
  const [collaborationMessage, setCollaborationMessage] = useState<string | null>(null)

  const { data: catalogInstruments = [] } = useInstruments()
  const { data: catalogStyles = [] } = useStyles()
  const createCollaborationMutation = useCreateCollaboration()

  const discoveryFilters = useMemo(
    () => ({
      ...(instrumentFilter !== allInstrumentsOption ? { instrument: instrumentFilter } : {}),
      ...(styleFilter !== allStylesOption ? { style: styleFilter } : {}),
      ...(cityFilter !== allCitiesOption ? { city: cityFilter } : {}),
      ...(genderFilter !== allGendersOption ? { gender: genderFilter } : {}),
    }),
    [cityFilter, genderFilter, instrumentFilter, styleFilter],
  )

  const {
    data: discoveryResult,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useDiscoveryMusicians(discoveryFilters)

  const musicians = useMemo(
    () => (discoveryResult?.musicians ?? []).map(mapDiscoveryItemToMusician),
    [discoveryResult?.musicians],
  )

  const instrumentOptions = useMemo(
    () => [allInstrumentsOption, ...catalogInstruments.map((instrument) => instrument.name)],
    [catalogInstruments],
  )

  const styleOptions = useMemo(
    () => [allStylesOption, ...catalogStyles.map((style) => style.name)],
    [catalogStyles],
  )

  const cityOptions = useMemo(() => {
    const cities = new Set(
      musicians.map((musician) => musician.city).filter((city) => city !== 'Cidade não informada'),
    )

    if (cityFilter !== allCitiesOption) {
      cities.add(cityFilter)
    }

    return [allCitiesOption, ...Array.from(cities).sort((left, right) => left.localeCompare(right))]
  }, [cityFilter, musicians])

  const genderSelectOptions = useMemo(
    () => [allGendersOption, ...genderOptions.map((option) => option.value)],
    [],
  )

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
        instrumentFilter === allInstrumentsOption || musician.instruments.includes(instrumentFilter)
      const matchesStyle = styleFilter === allStylesOption || musician.styles.includes(styleFilter)
      const matchesCity = cityFilter === allCitiesOption || musician.city === cityFilter
      const matchesGender =
        genderFilter === allGendersOption || musician.gender === getGenderLabel(genderFilter as Gender)

      return matchesSearch && matchesInstrument && matchesStyle && matchesCity && matchesGender
    })
  }, [cityFilter, genderFilter, instrumentFilter, musicians, searchTerm, styleFilter])

  const hasFilters =
    searchTerm.trim().length > 0 ||
    instrumentFilter !== allInstrumentsOption ||
    styleFilter !== allStylesOption ||
    cityFilter !== allCitiesOption ||
    genderFilter !== allGendersOption

  function clearFilters() {
    setSearchTerm('')
    setInstrumentFilter(allInstrumentsOption)
    setStyleFilter(allStylesOption)
    setCityFilter(allCitiesOption)
    setGenderFilter(allGendersOption)
  }

  function handleConnect(musician: Musician) {
    if (!musician.userId) {
      return
    }

    setConnectingUserId(musician.userId)
    setCollaborationMessage(null)

    createCollaborationMutation.mutate(
      { receiverId: musician.userId },
      {
        onSuccess: () => {
          setCollaborationMessage(`Convite enviado para ${musician.name}.`)
        },
        onError: () => {
          setCollaborationMessage('Não foi possível enviar o convite. Talvez já exista uma colaboração pendente.')
        },
        onSettled: () => {
          setConnectingUserId(null)
        },
      },
    )
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
            options={instrumentOptions}
            onChange={setInstrumentFilter}
          />
          <FilterSelect label="Estilo" value={styleFilter} options={styleOptions} onChange={setStyleFilter} />
          <FilterSelect label="Cidade" value={cityFilter} options={cityOptions} onChange={setCityFilter} />
          <FilterSelect
            label="Gênero"
            value={genderFilter}
            options={genderSelectOptions}
            formatOption={(option) => (option === allGendersOption ? option : getGenderLabel(option as Gender))}
            onChange={(value) => setGenderFilter(value as GenderFilter)}
          />

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

      {collaborationMessage ? (
        <div className="mb-6 rounded-lg border border-zinc-700 bg-[#181818] px-4 py-3 text-sm text-zinc-100">
          {collaborationMessage}
        </div>
      ) : null}

      {isLoading ? (
        <FeedbackState title="Carregando músicos" description="Buscando recomendações no SoundCollab..." />
      ) : null}

      {isError ? (
        <FeedbackState
          title="Não foi possível carregar a descoberta"
          description="Verifique se o backend está rodando e tente novamente."
          action={
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352]"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCw size={17} />
              Tentar de novo
            </button>
          }
        />
      ) : null}

      {!isLoading && !isError && filteredMusicians.length > 0 ? (
        <section className="grid items-stretch gap-6 xl:grid-cols-3">
          {filteredMusicians.map((musician) => (
            <MusicianCard
              key={musician.id}
              isConnecting={connectingUserId === musician.userId}
              musician={musician}
              onConnect={handleConnect}
            />
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && filteredMusicians.length === 0 ? (
        <FeedbackState
          title="Nenhum músico encontrado"
          description={
            hasFilters
              ? 'Tente remover algum filtro ou buscar por outro termo.'
              : 'Ainda não há outros perfis para recomendar.'
          }
        />
      ) : null}

      {isFetching && !isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Atualizando recomendações...</p>
      ) : null}
    </>
  )
}

function mapDiscoveryItemToMusician(item: DiscoveryMusicianResponse, index: number): Musician {
  const mainInstrument = item.instruments[0] ?? 'Música'

  return {
    id: item.id,
    userId: item.userId,
    name: item.displayName,
    gender: getGenderLabel(item.gender),
    city: item.city ?? 'Cidade não informada',
    experience: formatExperience(item.experience),
    instruments: item.instruments,
    styles: item.styles,
    bio: item.preferences || 'Perfil musical em construção.',
    photoTone: photoTones[index % photoTones.length],
    photoLabel: mainInstrument,
  }
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

type FilterSelectProps = {
  label: string
  value: string
  options: string[]
  formatOption?: (option: string) => string
  onChange: (value: string) => void
}

function FilterSelect({ label, value, options, formatOption = (option) => option, onChange }: FilterSelectProps) {
  return (
    <label className="min-w-40">
      <span className="mb-2 block text-sm font-semibold text-zinc-100">{label}</span>
      <select
        className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  )
}
