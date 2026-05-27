import { AlertTriangle, Check, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { InstrumentCategoryPicker } from '../components/InstrumentCategoryPicker'
import { MusicianCard } from '../components/MusicianCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useInstruments, useStyles } from '../hooks/useCatalogs'
import { useCancelCollaboration, useCollaborations, useCreateCollaboration } from '../hooks/useCollaborations'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useDiscoveryMusicians } from '../hooks/useDiscoveryMusicians'
import { getCollaborationStateForUser, getPendingSentCollaborationForUser } from '../lib/collaboration-state'
import { getGenderLabel } from '../lib/gender'
import type { InstrumentCatalogItem } from '../types/catalog'
import type { DiscoveryMusicianResponse } from '../types/discovery'
import type { Musician } from '../types/musician'
import type { Collaboration } from '../types/collaboration'

type DiscoveryAppliedFilters = {
  search: string
  instruments: string[]
  styles: string[]
  useDistance: boolean
  radiusKm: number
}

type CancelRequestTarget = {
  collaboration: Collaboration
  musician: Musician
}

const defaultDiscoveryFilters: DiscoveryAppliedFilters = {
  search: '',
  instruments: [],
  styles: [],
  useDistance: false,
  radiusKm: 50,
}
const discoveryFiltersStorageKey = 'soundcollab:discovery-filters'

const photoTones = [
  'from-[#1DC95A] via-[#18592F] to-[#141414]',
  'from-[#1CB352] via-zinc-700 to-[#141414]',
  'from-[#1B9C49] via-zinc-800 to-[#141414]',
  'from-emerald-400 via-zinc-700 to-[#141414]',
]

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [cancelRequestTarget, setCancelRequestTarget] = useState<CancelRequestTarget | null>(null)
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null)
  const [collaborationMessage, setCollaborationMessage] = useState<string | null>(null)

  const { data: currentUser } = useCurrentUser()
  const { data: catalogInstruments = [] } = useInstruments()
  const { data: catalogStyles = [] } = useStyles()
  const { data: collaborationsResult } = useCollaborations()
  const cancelCollaborationMutation = useCancelCollaboration()
  const createCollaborationMutation = useCreateCollaboration()
  const collaborations = collaborationsResult?.items ?? []
  const canUseDistanceFilter =
    typeof currentUser?.profile?.latitude === 'number' && typeof currentUser.profile.longitude === 'number'
  const appliedFilters = useMemo(() => parseDiscoveryFilters(searchParams), [searchParams])

  useEffect(() => {
    if (searchParams.toString()) {
      return
    }

    const storedFilters = window.localStorage.getItem(discoveryFiltersStorageKey)

    if (storedFilters) {
      setSearchParams(storedFilters)
    }
  }, [searchParams, setSearchParams])

  const discoveryFilters = useMemo(
    () => ({
      ...(appliedFilters.useDistance && canUseDistanceFilter ?{ radiusKm: appliedFilters.radiusKm } : {}),
    }),
    [appliedFilters.radiusKm, appliedFilters.useDistance, canUseDistanceFilter],
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

  const styleOptions = useMemo(
    () => catalogStyles.map((style) => style.name).sort(compareDisplayText),
    [catalogStyles],
  )

  const filteredMusicians = useMemo(() => {
    const normalizedSearch = appliedFilters.search.trim().toLowerCase()

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
        appliedFilters.instruments.length === 0 ||
        appliedFilters.instruments.some((instrument) => musician.instruments.includes(instrument))
      const matchesStyle =
        appliedFilters.styles.length === 0 ||
        appliedFilters.styles.some((style) => musician.styles.includes(style))

      return matchesSearch && matchesInstrument && matchesStyle
    })
  }, [appliedFilters, musicians])

  const hasFilters =
    appliedFilters.search.trim().length > 0 ||
    appliedFilters.instruments.length > 0 ||
    appliedFilters.styles.length > 0 ||
    (appliedFilters.useDistance && canUseDistanceFilter)
  const activeFilterCount = getAppliedFilterChips(appliedFilters, canUseDistanceFilter).length

  function clearFilters() {
    window.localStorage.removeItem(discoveryFiltersStorageKey)
    setSearchParams(createDiscoverySearchParams(defaultDiscoveryFilters))
  }

  function applyFilters(filters: DiscoveryAppliedFilters) {
    const nextSearchParams = createDiscoverySearchParams(filters)

    if (nextSearchParams.toString()) {
      window.localStorage.setItem(discoveryFiltersStorageKey, nextSearchParams.toString())
    } else {
      window.localStorage.removeItem(discoveryFiltersStorageKey)
    }

    setSearchParams(nextSearchParams)
  }

  function updateSearchTerm(search: string) {
    applyFilters({ ...appliedFilters, search })
  }

  function removeAppliedFilter(chip: AppliedFilterChip) {
    if (chip.type === 'search') {
      applyFilters({ ...appliedFilters, search: '' })
    }

    if (chip.type === 'instrument') {
      applyFilters({
        ...appliedFilters,
        instruments: appliedFilters.instruments.filter((instrument) => instrument !== chip.value),
      })
    }

    if (chip.type === 'style') {
      applyFilters({ ...appliedFilters, styles: appliedFilters.styles.filter((style) => style !== chip.value) })
    }

    if (chip.type === 'distance') {
      applyFilters({ ...appliedFilters, useDistance: false, radiusKm: 50 })
    }
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

  function requestCancelCollaboration(musician: Musician) {
    const collaboration = getPendingSentCollaborationForUser(collaborations, musician.userId)

    if (!collaboration) {
      setCollaborationMessage('Não foi possível encontrar o convite pendente para cancelar.')
      return
    }

    setCancelRequestTarget({ collaboration, musician })
  }

  function confirmCancelCollaboration() {
    if (!cancelRequestTarget) {
      return
    }

    cancelCollaborationMutation.mutate(cancelRequestTarget.collaboration.id, {
      onSuccess: () => {
        setCollaborationMessage(`Solicitação para ${cancelRequestTarget.musician.name} cancelada.`)
        setCancelRequestTarget(null)
      },
      onError: () => {
        setCollaborationMessage('Não foi possível cancelar a solicitação agora.')
      },
    })
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
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_auto_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-sm font-semibold text-zinc-100">Buscar</span>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2.5">
              <Search className="text-zinc-400" size={19} />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                value={appliedFilters.search}
                onChange={(event) => updateSearchTerm(event.target.value)}
                placeholder="Nome, instrumento, estilo ou cidade"
              />
            </div>
          </label>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:border-[#1DC95A]/60 hover:bg-[#1DC95A]/10"
            onClick={() => setIsFilterDialogOpen(true)}
            type="button"
          >
            <SlidersHorizontal size={17} />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#1DC95A] px-1.5 text-xs text-[#141414]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasFilters}
            onClick={clearFilters}
          >
            {hasFilters ? <X size={17} /> : <SlidersHorizontal size={17} />}
            Limpar
          </button>
        </div>

        <AppliedFilters
          canUseDistanceFilter={canUseDistanceFilter}
          filters={appliedFilters}
          onClear={clearFilters}
          onRemove={removeAppliedFilter}
        />
      </section>

      {isFilterDialogOpen ? (
        <FilterDialog
          appliedFilters={appliedFilters}
          canUseDistanceFilter={canUseDistanceFilter}
          instrumentItems={catalogInstruments}
          onApply={(filters) => {
            applyFilters(filters)
            setIsFilterDialogOpen(false)
          }}
          onClose={() => setIsFilterDialogOpen(false)}
          styleOptions={styleOptions}
        />
      ) : null}

      {cancelRequestTarget ? (
        <CancelCollaborationDialog
          isCanceling={cancelCollaborationMutation.isPending}
          musicianName={cancelRequestTarget.musician.name}
          onClose={() => setCancelRequestTarget(null)}
          onConfirm={confirmCancelCollaboration}
        />
      ) : null}

      {collaborationMessage  ? (
        <div className="mb-6 rounded-lg border border-zinc-700 bg-[#181818] px-4 py-3 text-sm text-zinc-100">
          {collaborationMessage}
        </div>
      ) : null}

      {isLoading  ? (
        <FeedbackState title="Carregando músicos" description="Buscando recomendações no SoundCollab..." />
      ) : null}

      {isError  ? (
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

      {!isLoading && !isError && filteredMusicians.length > 0  ? (
        <section className="grid items-stretch gap-6 xl:grid-cols-3">
          {filteredMusicians.map((musician) => (
            <MusicianCard
              collaborationState={getCollaborationStateForUser(collaborations, musician.userId)}
              isCancelingRequest={
                cancelCollaborationMutation.isPending &&
                cancelRequestTarget?.collaboration.id ===
                  getPendingSentCollaborationForUser(collaborations, musician.userId)?.id
              }
              key={musician.id}
              isConnecting={connectingUserId === musician.userId}
              musician={musician}
              onCancelRequest={requestCancelCollaboration}
              onConnect={handleConnect}
            />
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && filteredMusicians.length === 0  ? (
        <FeedbackState
          title="Nenhum músico encontrado"
          description={
            hasFilters
              ?'Tente remover algum filtro ou buscar por outro termo.'
              : 'Ainda não há outros perfis para recomendar.'
          }
        />
      ) : null}

      {isFetching && !isLoading  ? (
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
    age: item.age ?? undefined,
    gender: getGenderLabel(item.gender),
    city: item.city ?? 'Cidade não informada',
    distanceKm: item.distanceKm ?? undefined,
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

type AppliedFilterChip = {
  id: string
  label: string
  type: 'search' | 'instrument' | 'style' | 'distance'
  value?: string
}

type CancelCollaborationDialogProps = {
  isCanceling: boolean
  musicianName: string
  onClose: () => void
  onConfirm: () => void
}

function CancelCollaborationDialog({
  isCanceling,
  musicianName,
  onClose,
  onConfirm,
}: CancelCollaborationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <section
        aria-label="Cancelar solicitação de colaboração"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-2xl shadow-black/50"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-950/50 text-red-200">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cancelar solicitação?</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              A solicitação enviada para {musicianName} será cancelada. Você poderá enviar um novo convite depois.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCanceling}
            onClick={onClose}
            type="button"
          >
            Manter solicitação
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-400 px-4 py-2.5 text-sm font-bold text-[#141414] transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCanceling}
            onClick={onConfirm}
            type="button"
          >
            <X size={16} />
            {isCanceling ? 'Cancelando...' : 'Cancelar solicitação'}
          </button>
        </div>
      </section>
    </div>
  )
}

type AppliedFiltersProps = {
  canUseDistanceFilter: boolean
  filters: DiscoveryAppliedFilters
  onClear: () => void
  onRemove: (chip: AppliedFilterChip) => void
}

function AppliedFilters({ canUseDistanceFilter, filters, onClear, onRemove }: AppliedFiltersProps) {
  const chips = getAppliedFilterChips(filters, canUseDistanceFilter)

  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-zinc-100">Filtros aplicados</h2>
        {chips.length > 0 ? (
          <button
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 transition hover:text-white"
            onClick={onClear}
            type="button"
          >
            <X size={15} />
            Limpar filtros
          </button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:border-[#1DC95A]/60 hover:bg-[#1DC95A]/10"
              key={chip.id}
              onClick={() => onRemove(chip)}
              type="button"
            >
              <span className="truncate">{chip.label}</span>
              <X className="shrink-0 text-zinc-400" size={14} />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Nenhum filtro aplicado.</p>
      )}
    </div>
  )
}

type FilterDialogProps = {
  appliedFilters: DiscoveryAppliedFilters
  canUseDistanceFilter: boolean
  instrumentItems: InstrumentCatalogItem[]
  onApply: (filters: DiscoveryAppliedFilters) => void
  onClose: () => void
  styleOptions: string[]
}

function FilterDialog({
  appliedFilters,
  canUseDistanceFilter,
  instrumentItems,
  onApply,
  onClose,
  styleOptions,
}: FilterDialogProps) {
  const [draftFilters, setDraftFilters] = useState(appliedFilters)
  const hasPendingChanges = !areDiscoveryFiltersEqual(appliedFilters, draftFilters)

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasPendingChanges) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasPendingChanges])

  function closeDialog() {
    if (hasPendingChanges && !window.confirm('Descartar alterações nos filtros?')) {
      return
    }

    onClose()
  }

  function clearDraftFilters() {
    setDraftFilters(defaultDiscoveryFilters)
  }

  function toggleInstrument(instrument: string) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      instruments: toggleString(currentFilters.instruments, instrument),
    }))
  }

  function toggleStyle(style: string) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      styles: toggleString(currentFilters.styles, style),
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <section
        aria-label="Filtros de descoberta"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-zinc-800 bg-[#181818] shadow-2xl shadow-black/50"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Filtros</h2>
            <p className="mt-1 text-sm text-zinc-400">Escolha os atributos e aplique quando estiver pronto.</p>
          </div>
          <button
            aria-label="Fechar filtros"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-200 transition hover:bg-zinc-800"
            onClick={closeDialog}
            type="button"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {hasPendingChanges ? (
            <div className="mb-5 rounded-lg border border-[#1DC95A]/30 bg-[#1DC95A]/10 px-3 py-2 text-sm text-[#A7F3C1]">
              Existem alterações pendentes.
            </div>
          ) : null}

          <div className="grid gap-5">
            <DistanceFilter
              canUseDistanceFilter={canUseDistanceFilter}
              isEnabled={draftFilters.useDistance}
              onEnabledChange={(useDistance) =>
                setDraftFilters((currentFilters) => ({ ...currentFilters, useDistance }))
              }
              onRadiusChange={(radiusKm) =>
                setDraftFilters((currentFilters) => ({ ...currentFilters, radiusKm }))
              }
              radiusKm={draftFilters.radiusKm}
            />

            <InstrumentCategoryPicker
              emptyText="Nenhum instrumento cadastrado"
              getValue={(item) => item.name}
              items={instrumentItems}
              onToggleValue={toggleInstrument}
              selectedValues={draftFilters.instruments}
            />

            <MultiFilterSection
              emptyText="Nenhum estilo cadastrado"
              label="Estilos musicais"
              onToggle={toggleStyle}
              options={styleOptions}
              selectedOptions={draftFilters.styles}
            />

          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            onClick={closeDialog}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            onClick={clearDraftFilters}
            type="button"
          >
            Limpar
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352]"
            onClick={() => onApply(draftFilters)}
            type="button"
          >
            <Check size={16} />
            Aplicar filtros
          </button>
        </footer>
      </section>
    </div>
  )
}

type MultiFilterSectionProps = {
  emptyText: string
  label: string
  onToggle: (option: string) => void
  options: string[]
  selectedOptions: string[]
}

function MultiFilterSection({ emptyText, label, onToggle, options, selectedOptions }: MultiFilterSectionProps) {
  const selectedOptionSet = useMemo(() => new Set(selectedOptions), [selectedOptions])

  return (
    <fieldset className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
      <legend className="px-1 text-sm font-bold text-zinc-100">{label}</legend>
      {options.length === 0 ? <p className="mt-3 text-sm text-zinc-500">{emptyText}</p> : null}
      {options.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => {
            const isSelected = selectedOptionSet.has(option)

            return (
              <button
                aria-pressed={isSelected}
                className={filterChoiceClassName(isSelected)}
                key={option}
                onClick={() => onToggle(option)}
                type="button"
              >
                {isSelected ? <Check className="shrink-0" size={16} /> : null}
                <span className="truncate">{option}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </fieldset>
  )
}

type DistanceFilterProps = {
  canUseDistanceFilter: boolean
  isEnabled: boolean
  radiusKm: number
  onEnabledChange: (value: boolean) => void
  onRadiusChange: (value: number) => void
}

function DistanceFilter({
  canUseDistanceFilter,
  isEnabled,
  radiusKm,
  onEnabledChange,
  onRadiusChange,
}: DistanceFilterProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#141414] px-3 py-2.5">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-100">Distância</span>
        <input
          className="size-4 accent-[#1DC95A]"
          checked={isEnabled}
          disabled={!canUseDistanceFilter}
          onChange={(event) => onEnabledChange(event.target.checked)}
          type="checkbox"
        />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <input
          aria-label="Raio em quilômetros"
          className="w-full accent-[#1DC95A] disabled:opacity-40"
          disabled={!canUseDistanceFilter || !isEnabled}
          max={200}
          min={5}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          step={5}
          type="range"
          value={radiusKm}
        />
        <span className="w-14 text-right text-sm font-bold text-zinc-100">{radiusKm} km</span>
      </div>
      {!canUseDistanceFilter  ? (
        <p className="mt-2 text-xs text-zinc-500">Selecione uma cidade no perfil.</p>
      ) : null}
    </div>
  )
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
      {action ?<div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  )
}

function parseDiscoveryFilters(searchParams: URLSearchParams): DiscoveryAppliedFilters {
  const radiusKm = Number(searchParams.get('radiusKm') ?? defaultDiscoveryFilters.radiusKm)

  return {
    search: searchParams.get('q') ?? '',
    instruments: searchParams.getAll('instrument').filter(Boolean),
    styles: searchParams.getAll('style').filter(Boolean),
    useDistance: searchParams.get('distance') === '1',
    radiusKm: Number.isFinite(radiusKm) ? clampRadiusKm(radiusKm) : defaultDiscoveryFilters.radiusKm,
  }
}

function createDiscoverySearchParams(filters: DiscoveryAppliedFilters) {
  const params = new URLSearchParams()

  if (filters.search.trim()) {
    params.set('q', filters.search.trim())
  }

  for (const instrument of filters.instruments) {
    params.append('instrument', instrument)
  }

  for (const style of filters.styles) {
    params.append('style', style)
  }

  if (filters.useDistance) {
    params.set('distance', '1')
    params.set('radiusKm', String(filters.radiusKm))
  }

  return params
}

function getAppliedFilterChips(filters: DiscoveryAppliedFilters, canUseDistanceFilter: boolean): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = []

  if (filters.search.trim()) {
    chips.push({ id: 'search', label: `Busca: ${filters.search.trim()}`, type: 'search' })
  }

  chips.push(
    ...filters.instruments.map((instrument) => ({
      id: `instrument-${instrument}`,
      label: `Instrumento: ${instrument}`,
      type: 'instrument' as const,
      value: instrument,
    })),
  )

  chips.push(
    ...filters.styles.map((style) => ({
      id: `style-${style}`,
      label: `Estilo: ${style}`,
      type: 'style' as const,
      value: style,
    })),
  )

  if (filters.useDistance && canUseDistanceFilter) {
    chips.push({ id: 'distance', label: `Distância: até ${filters.radiusKm} km`, type: 'distance' })
  }

  return chips
}

function areDiscoveryFiltersEqual(firstFilters: DiscoveryAppliedFilters, secondFilters: DiscoveryAppliedFilters) {
  return (
    firstFilters.search === secondFilters.search &&
    firstFilters.useDistance === secondFilters.useDistance &&
    firstFilters.radiusKm === secondFilters.radiusKm &&
    areStringArraysEqual(firstFilters.instruments, secondFilters.instruments) &&
    areStringArraysEqual(firstFilters.styles, secondFilters.styles)
  )
}

function areStringArraysEqual(firstItems: string[], secondItems: string[]) {
  if (firstItems.length !== secondItems.length) {
    return false
  }

  const firstSet = new Set(firstItems)
  return secondItems.every((item) => firstSet.has(item))
}

function toggleString(items: string[], item: string) {
  return items.includes(item) ?items.filter((currentItem) => currentItem !== item) : [...items, item]
}

function clampRadiusKm(radiusKm: number) {
  return Math.min(200, Math.max(5, radiusKm))
}

function filterChoiceClassName(isSelected: boolean) {
  return [
    'inline-flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition',
    isSelected
      ?'border-[#1DC95A] bg-[#1DC95A] text-[#141414]'
      : 'border-zinc-800 bg-[#181818] text-zinc-200 hover:bg-zinc-800',
  ].join(' ')
}

function compareDisplayText(firstText: string, secondText: string) {
  return firstText.localeCompare(secondText, 'pt-BR')
}

