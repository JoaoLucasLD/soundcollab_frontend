import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, Edit3, Guitar, MapPin, Music, Target, Trophy, X } from 'lucide-react'
import { z } from 'zod'
import { CityAutocomplete } from '../components/CityAutocomplete'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'
import { useInstruments, useStyles } from '../hooks/useCatalogs'
import { currentUserQueryKey, useCurrentUser } from '../hooks/useCurrentUser'
import {
  availabilityPeriodOptions,
  availabilityTimeOptions,
  formatAvailabilitySummary,
  getAvailabilityPeriodLabel,
  getAvailabilityTimeLabel,
} from '../lib/availability'
import { formatBirthDateForDisplay, formatBirthDateInput, parseBirthDateDisplay, validateBirthDateAge } from '../lib/birth-date'
import { collaborationGoalOptions, getCollaborationGoalLabel } from '../lib/collaboration-goals'
import { genderOptions, getGenderLabel } from '../lib/gender'
import { capitalizeDisplayName } from '../lib/text-format'
import { getMe } from '../services/auth.service'
import { replaceMyInstruments, replaceMyStyles, updateMyProfile } from '../services/profile.service'
import type { CatalogItem, InstrumentCatalogItem } from '../types/catalog'
import type {
  AvailabilityPeriod,
  AvailabilityTime,
  CollaborationGoal,
  Gender,
  UpdateProfilePayload,
} from '../types/profile'
import type { CurrentUser } from '../types/user'

const collaborationGoalValues = [
  'BAND',
  'RECORDING',
  'LIVE_SHOWS',
  'COMPOSITION',
  'PRODUCTION',
  'STUDY',
  'CASUAL_JAM',
] as const
const availabilityPeriodValues = ['WEEKDAYS', 'WEEKENDS'] as const
const availabilityTimeValues = ['MORNING', 'AFTERNOON', 'EVENING'] as const

const displayNameSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(80, 'Use no máximo 80 caracteres.'),
})

const citySchema = z.object({
  city: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
})

const genderSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
})

const birthDateSchema = z.object({
  birthDate: z
    .string()
    .trim()
    .refine(validateBirthDateAge, 'Informe uma data válida para idade entre 18 e 100 anos.'),
})

const experienceSchema = z.object({
  experience: z.coerce
    .number()
    .int('Informe um número inteiro.')
    .min(0, 'A experiência não pode ser negativa.')
    .max(100, 'Informe até 100 anos.'),
})

const aboutSchema = z.object({
  bio: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
})

const goalsSchema = z.object({
  collaborationGoals: z.array(z.enum(collaborationGoalValues)).max(7),
})

const availabilitySchema = z.object({
  availabilityPeriods: z.array(z.enum(availabilityPeriodValues)).max(2),
  availabilityTimes: z.array(z.enum(availabilityTimeValues)).max(3),
  availabilityNotes: z.string().trim().max(300, 'Use no máximo 300 caracteres.').optional(),
})

const instrumentsSchema = z.object({
  instrumentIds: z.array(z.string()).max(20, 'Escolha até 20 instrumentos.'),
})

const stylesSchema = z.object({
  styleIds: z.array(z.string()).max(20, 'Escolha até 20 estilos.'),
})

type InlineEditor = 'displayName' | 'city' | 'gender' | 'birthDate' | 'experience' | 'about' | null
type SelectionModal = 'instruments' | 'styles' | 'goals' | 'availability' | null

type SaveRequest =
  | { type: 'profile'; payload: UpdateProfilePayload }
  | { type: 'instruments'; instrumentIds: string[] }
  | { type: 'styles'; styleIds: string[] }

export function ProfilePage() {
  const { data: currentUser } = useCurrentUser()
  const { data: catalogInstruments = [], isLoading: isLoadingInstruments } = useInstruments()
  const { data: catalogStyles = [], isLoading: isLoadingStyles } = useStyles()
  const queryClient = useQueryClient()
  const [inlineEditor, setInlineEditor] = useState<InlineEditor>(null)
  const [selectionModal, setSelectionModal] = useState<SelectionModal>(null)
  const [displayNameValue, setDisplayNameValue] = useState('')
  const [cityValue, setCityValue] = useState('')
  const [cityLatitudeValue, setCityLatitudeValue] = useState<number | null>(null)
  const [cityLongitudeValue, setCityLongitudeValue] = useState<number | null>(null)
  const [genderValue, setGenderValue] = useState<Gender>('PREFER_NOT_TO_SAY')
  const [birthDateValue, setBirthDateValue] = useState('')
  const [experienceValue, setExperienceValue] = useState(0)
  const [bioValue, setBioValue] = useState('')
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<string[]>([])
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<CollaborationGoal[]>([])
  const [selectedAvailabilityPeriods, setSelectedAvailabilityPeriods] = useState<AvailabilityPeriod[]>([])
  const [selectedAvailabilityTimes, setSelectedAvailabilityTimes] = useState<AvailabilityTime[]>([])
  const [availabilityNotesValue, setAvailabilityNotesValue] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const profile = currentUser?.profile
  const displayName = profile?.displayName || currentUser?.email || 'Você'
  const city = profile?.city || 'Localização não informada'
  const hasCityCoordinates = typeof profile?.latitude === 'number' && typeof profile?.longitude === 'number'
  const gender = getGenderLabel(profile?.gender)
  const age = profile?.age
  const experienceYears = profile?.experience
  const instruments = profile?.instruments ?? []
  const styles = profile?.styles ?? []
  const about = profile?.bio || profile?.preferences || 'Conte um pouco sobre sua trajetória musical.'
  const collaborationGoalLabels = (profile?.collaborationGoals ?? []).map(getCollaborationGoalLabel)
  const availabilitySummary = formatAvailabilitySummary(
    profile?.availabilityPeriods ?? [],
    profile?.availabilityTimes ?? [],
    profile?.availabilityNotes,
  )
  const mainInstrument = instruments[0] ? capitalizeDisplayName(instruments[0]) : 'Música'

  const saveMutation = useMutation({
    mutationFn: async (request: SaveRequest) => {
      if (request.type === 'profile') {
        await updateMyProfile(request.payload)
      }

      if (request.type === 'instruments') {
        await replaceMyInstruments({ instrumentIds: request.instrumentIds })
      }

      if (request.type === 'styles') {
        await replaceMyStyles({ styleIds: request.styleIds })
      }

      return getMe()
    },
    onSuccess: (freshUser) => {
      queryClient.setQueryData<CurrentUser>(currentUserQueryKey, freshUser)
      setInlineEditor(null)
      setSelectionModal(null)
      setFormError(null)
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Não foi possível salvar o perfil.'
        : 'Não foi possível salvar o perfil agora.'

      setFormError(message)
    },
  })

  function openInlineEditor(editor: InlineEditor) {
    setFormError(null)
    setInlineEditor(editor)

    if (editor === 'displayName') {
      setDisplayNameValue(profile?.displayName ?? '')
    }

    if (editor === 'city') {
      setCityValue(profile?.city ?? '')
      setCityLatitudeValue(profile?.latitude ?? null)
      setCityLongitudeValue(profile?.longitude ?? null)
    }

    if (editor === 'gender') {
      setGenderValue(profile?.gender ?? 'PREFER_NOT_TO_SAY')
    }

    if (editor === 'birthDate') {
      setBirthDateValue(formatBirthDateForDisplay(profile?.birthDate))
    }

    if (editor === 'experience') {
      setExperienceValue(profile?.experience ?? 0)
    }

    if (editor === 'about') {
      setBioValue(profile?.bio ?? profile?.preferences ?? '')
    }
  }

  function closeInlineEditor() {
    setInlineEditor(null)
    setFormError(null)
  }

  function openSelectionModal(modal: SelectionModal) {
    setFormError(null)
    setSelectionModal(modal)

    if (modal === 'instruments') {
      setSelectedInstrumentIds(getSelectedCatalogIds(catalogInstruments, profile?.instruments ?? []))
    }

    if (modal === 'styles') {
      setSelectedStyleIds(getSelectedCatalogIds(catalogStyles, profile?.styles ?? []))
    }

    if (modal === 'goals') {
      setSelectedGoals(profile?.collaborationGoals ?? [])
    }

    if (modal === 'availability') {
      setSelectedAvailabilityPeriods(profile?.availabilityPeriods ?? [])
      setSelectedAvailabilityTimes(profile?.availabilityTimes ?? [])
      setAvailabilityNotesValue(profile?.availabilityNotes ?? '')
    }
  }

  function closeSelectionModal() {
    setSelectionModal(null)
    setFormError(null)
  }

  function saveDisplayName() {
    const result = displayNameSchema.safeParse({ displayName: displayNameValue })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise o nome informado.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { displayName: result.data.displayName } })
  }

  function saveCity() {
    const result = citySchema.safeParse({ city: cityValue })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise a cidade informada.')
      return
    }

    saveMutation.mutate({
      type: 'profile',
      payload: {
        city: result.data.city || undefined,
        latitude: cityLatitudeValue,
        longitude: cityLongitudeValue,
      },
    })
  }

  function saveGender() {
    const result = genderSchema.safeParse({ gender: genderValue })

    if (!result.success) {
      setFormError('Selecione um gênero válido.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { gender: result.data.gender } })
  }

  function saveBirthDate() {
    const result = birthDateSchema.safeParse({ birthDate: parseBirthDateDisplay(birthDateValue) })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise a data de nascimento.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { birthDate: result.data.birthDate } })
  }

  function saveExperience() {
    const result = experienceSchema.safeParse({ experience: experienceValue })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise os anos de experiência.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { experience: result.data.experience } })
  }

  function saveAbout() {
    const result = aboutSchema.safeParse({ bio: bioValue })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise o texto informado.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { bio: result.data.bio || undefined } })
  }

  function saveGoals() {
    const result = goalsSchema.safeParse({ collaborationGoals: selectedGoals })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise os objetivos selecionados.')
      return
    }

    saveMutation.mutate({ type: 'profile', payload: { collaborationGoals: result.data.collaborationGoals } })
  }

  function saveAvailability() {
    const result = availabilitySchema.safeParse({
      availabilityPeriods: selectedAvailabilityPeriods,
      availabilityTimes: selectedAvailabilityTimes,
      availabilityNotes: availabilityNotesValue,
    })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise a disponibilidade informada.')
      return
    }

    saveMutation.mutate({
      type: 'profile',
      payload: {
        availabilityPeriods: result.data.availabilityPeriods,
        availabilityTimes: result.data.availabilityTimes,
        availabilityNotes: result.data.availabilityNotes ?? '',
      },
    })
  }

  function saveInstruments() {
    const result = instrumentsSchema.safeParse({ instrumentIds: selectedInstrumentIds })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise os instrumentos selecionados.')
      return
    }

    saveMutation.mutate({ type: 'instruments', instrumentIds: result.data.instrumentIds })
  }

  function saveStyles() {
    const result = stylesSchema.safeParse({ styleIds: selectedStyleIds })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revise os estilos selecionados.')
      return
    }

    saveMutation.mutate({ type: 'styles', styleIds: result.data.styleIds })
  }

  function toggleInstrument(instrumentId: string) {
    setSelectedInstrumentIds((currentIds) => toggleId(currentIds, instrumentId))
  }

  function toggleStyle(styleId: string) {
    setSelectedStyleIds((currentIds) => toggleId(currentIds, styleId))
  }

  function toggleGoal(goal: CollaborationGoal) {
    setSelectedGoals((currentGoals) =>
      currentGoals.includes(goal) ?currentGoals.filter((currentGoal) => currentGoal !== goal) : [...currentGoals, goal],
    )
  }

  function toggleAvailabilityPeriod(period: AvailabilityPeriod) {
    setSelectedAvailabilityPeriods((currentPeriods) =>
      currentPeriods.includes(period)
        ?currentPeriods.filter((currentPeriod) => currentPeriod !== period)
        : [...currentPeriods, period],
    )
  }

  function toggleAvailabilityTime(time: AvailabilityTime) {
    setSelectedAvailabilityTimes((currentTimes) =>
      currentTimes.includes(time) ?currentTimes.filter((currentTime) => currentTime !== time) : [...currentTimes, time],
    )
  }

  const isSaving = saveMutation.isPending

  return (
    <>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações musicais por seção" />

      <section className="grid gap-6 xl:grid-cols-[370px_1fr]">
        <div className="space-y-6">
          <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 text-center shadow-sm shadow-black/30">
            <div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg bg-gradient-to-br from-[#1DC95A] via-[#18592F] to-[#141414] text-white">
              <div className="flex flex-col items-center gap-4 rounded-lg bg-white/15 px-8 py-7 backdrop-blur-sm">
                <Guitar size={56} />
                <span className="text-sm font-bold">{mainInstrument}</span>
              </div>
            </div>

            {inlineEditor === 'displayName'  ? (
              <InlineEditorPanel
                error={formError}
                isSaving={isSaving}
                onCancel={closeInlineEditor}
                onSave={saveDisplayName}
              >
                <FormField label="Nome">
                  <input
                    className={inputClassName}
                    onChange={(event) => setDisplayNameValue(event.target.value)}
                    placeholder="Como você quer aparecer"
                    value={displayNameValue}
                  />
                </FormField>
              </InlineEditorPanel>
            ) : (
              <>
                <div className="mt-5 flex items-start justify-center gap-3">
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <IconButton ariaLabel="Editar nome" onClick={() => openInlineEditor('displayName')} />
                </div>
                <p className="mt-1 text-zinc-400">{currentUser?.email}</p>
              </>
            )}
          </article>

          <ProfileInfoCard
            action={<IconButton ariaLabel="Editar localização" onClick={() => openInlineEditor('city')} />}
            icon={<MapPin className="text-[#1DC95A]" size={22} />}
            title="Localização"
          >
            {inlineEditor === 'city'  ? (
              <InlineEditorPanel error={formError} isSaving={isSaving} onCancel={closeInlineEditor} onSave={saveCity}>
                <FormField label="Cidade">
                  <CityAutocomplete
                    inputClassName={inputClassName}
                    onChange={(value) => {
                      setCityValue(value)
                      setCityLatitudeValue(null)
                      setCityLongitudeValue(null)
                    }}
                    onSelect={(city) => {
                      setCityValue(city.label)
                      setCityLatitudeValue(city.latitude)
                      setCityLongitudeValue(city.longitude)
                    }}
                    placeholder="São Paulo, SP"
                    value={cityValue}
                  />
                  <p className="mt-2 text-sm text-zinc-400">
                    Selecione uma sugestão para atualizar as coordenadas usadas no filtro por distância.
                  </p>
                </FormField>
              </InlineEditorPanel>
            ) : (
              <>
                <p>{city}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {hasCityCoordinates
                    ?'Cidade com coordenadas salva para filtros de distância.'
                    : 'Edite a cidade e selecione uma sugestão para liberar o filtro por quilômetros.'}
                </p>
                {formError && inlineEditor === null  ? (
                  <div className="mt-3 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    {formError}
                  </div>
                ) : null}
              </>
            )}
          </ProfileInfoCard>

          <ProfileInfoCard
            action={<IconButton ariaLabel="Editar gênero" onClick={() => openInlineEditor('gender')} />}
            icon={<Target className="text-[#1DC95A]" size={22} />}
            title="Gênero"
          >
            {inlineEditor === 'gender'  ? (
              <InlineEditorPanel error={formError} isSaving={isSaving} onCancel={closeInlineEditor} onSave={saveGender}>
                <FormField label="Gênero">
                  <select
                    className={inputClassName}
                    onChange={(event) => setGenderValue(event.target.value as Gender)}
                    value={genderValue}
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </InlineEditorPanel>
            ) : (
              <p>{gender}</p>
            )}
          </ProfileInfoCard>

          <ProfileInfoCard
            action={<IconButton ariaLabel="Editar data de nascimento" onClick={() => openInlineEditor('birthDate')} />}
            icon={<CalendarDays className="text-[#1DC95A]" size={22} />}
            title="Idade"
          >
            {inlineEditor === 'birthDate'  ? (
              <InlineEditorPanel
                error={formError}
                isSaving={isSaving}
                onCancel={closeInlineEditor}
                onSave={saveBirthDate}
              >
                <FormField label="Data de nascimento">
                  <input
                    className={inputClassName}
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(event) => setBirthDateValue(formatBirthDateInput(event.target.value))}
                    placeholder="dd/mm/aaaa"
                    type="text"
                    value={birthDateValue}
                  />
                </FormField>
              </InlineEditorPanel>
            ) : typeof age === 'number'  ? (
              <p>{age} anos</p>
            ) : (
              <p className="text-zinc-400">Idade ainda não informada</p>
            )}
          </ProfileInfoCard>

          <ProfileInfoCard
            action={<IconButton ariaLabel="Editar experiência musical" onClick={() => openInlineEditor('experience')} />}
            icon={<Trophy className="text-[#1DC95A]" size={22} />}
            title="Experiência Musical"
          >
            {inlineEditor === 'experience'  ? (
              <InlineEditorPanel
                error={formError}
                isSaving={isSaving}
                onCancel={closeInlineEditor}
                onSave={saveExperience}
              >
                <FormField label="Anos de experiência">
                  <input
                    className={inputClassName}
                    max={100}
                    min={0}
                    onChange={(event) => setExperienceValue(Number(event.target.value))}
                    type="number"
                    value={experienceValue}
                  />
                </FormField>
              </InlineEditorPanel>
            ) : typeof experienceYears === 'number'  ? (
              <>
                <p>{experienceYears} anos</p>
                <p className="mt-2 text-sm text-zinc-400">Tempo de experiência informado no perfil</p>
              </>
            ) : (
              <p className="text-zinc-400">Experiência ainda não informada</p>
            )}
          </ProfileInfoCard>
        </div>

        <div className="space-y-6">
          <ProfileSection
            action={<IconButton ariaLabel="Editar sobre mim" onClick={() => openInlineEditor('about')} />}
            title="Sobre Mim"
            description="Conte um pouco sobre você e sua trajetória musical"
          >
            {inlineEditor === 'about'  ? (
              <InlineEditorPanel error={formError} isSaving={isSaving} onCancel={closeInlineEditor} onSave={saveAbout}>
                <FormField label="Sobre mim">
                  <textarea
                    className="min-h-32 w-full resize-y rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    onChange={(event) => setBioValue(event.target.value)}
                    placeholder="Conte sobre sua trajetória musical"
                    value={bioValue}
                  />
                </FormField>
              </InlineEditorPanel>
            ) : (
              <p className="text-lg leading-relaxed text-zinc-200">{about}</p>
            )}
          </ProfileSection>

          <ProfileSection
            action={<EditButton label="Editar" onClick={() => openSelectionModal('instruments')} />}
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Instrumentos"
            description="Instrumentos que você toca"
          >
            <TagList items={instruments.map(capitalizeDisplayName)} emptyText="Nenhum instrumento informado" />
          </ProfileSection>

          <ProfileSection
            action={<EditButton label="Editar" onClick={() => openSelectionModal('styles')} />}
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Estilos Musicais"
            description="Estilos que você toca"
          >
            <TagList items={styles} emptyText="Nenhum estilo informado" />
          </ProfileSection>

          <ProfileSection
            action={<EditButton label="Editar" onClick={() => openSelectionModal('goals')} />}
            icon={<Target className="text-[#1DC95A]" size={22} />}
            title="Objetivos de Colaboração"
            description="O que você está procurando na plataforma"
          >
            <TagList items={collaborationGoalLabels} emptyText="Nenhum objetivo informado" />
          </ProfileSection>

          <ProfileSection
            action={<EditButton label="Editar" onClick={() => openSelectionModal('availability')} />}
            icon={<CalendarDays className="text-[#1DC95A]" size={22} />}
            title="Disponibilidade"
            description="Quando você costuma estar disponível para colaborar"
          >
            <div className="space-y-2 text-zinc-200">
              {availabilitySummary.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </ProfileSection>
        </div>
      </section>

      {selectionModal === 'instruments'  ? (
        <SelectionDialog
          error={formError}
          isSaving={isSaving}
          onClose={closeSelectionModal}
          onSave={saveInstruments}
          title="Editar instrumentos"
          description="Escolha os instrumentos que fazem parte do seu perfil musical."
        >
          <InstrumentSelection
            emptyText="Nenhum instrumento cadastrado"
            isLoading={isLoadingInstruments}
            items={catalogInstruments}
            onToggleInstrument={toggleInstrument}
            selectedInstrumentIds={selectedInstrumentIds}
          />
        </SelectionDialog>
      ) : null}

      {selectionModal === 'styles'  ? (
        <SelectionDialog
          error={formError}
          isSaving={isSaving}
          onClose={closeSelectionModal}
          onSave={saveStyles}
          title="Editar estilos musicais"
          description="Marque os estilos que melhor representam seu som."
        >
          <ChoiceGrid
            emptyText="Nenhum estilo cadastrado"
            isLoading={isLoadingStyles}
            items={catalogStyles}
            onToggle={toggleStyle}
            selectedIds={selectedStyleIds}
          />
        </SelectionDialog>
      ) : null}

      {selectionModal === 'goals'  ? (
        <SelectionDialog
          error={formError}
          isSaving={isSaving}
          onClose={closeSelectionModal}
          onSave={saveGoals}
          title="Editar objetivos"
          description="Informe quais tipos de colaboração você está procurando."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {collaborationGoalOptions.map((goal) => {
              const isSelected = selectedGoals.includes(goal.value)

              return (
                <button
                  aria-pressed={isSelected}
                  className={selectionButtonClassName(isSelected)}
                  key={goal.value}
                  onClick={() => toggleGoal(goal.value)}
                  type="button"
                >
                  {goal.label}
                </button>
              )
            })}
          </div>
        </SelectionDialog>
      ) : null}

      {selectionModal === 'availability'  ? (
        <SelectionDialog
          error={formError}
          isSaving={isSaving}
          onClose={closeSelectionModal}
          onSave={saveAvailability}
          title="Editar disponibilidade"
          description="Informe os períodos e turnos em que você costuma estar disponível."
        >
          <AvailabilitySelection
            notes={availabilityNotesValue}
            onNotesChange={setAvailabilityNotesValue}
            onTogglePeriod={toggleAvailabilityPeriod}
            onToggleTime={toggleAvailabilityTime}
            selectedPeriods={selectedAvailabilityPeriods}
            selectedTimes={selectedAvailabilityTimes}
          />
        </SelectionDialog>
      ) : null}
    </>
  )
}

const inputClassName =
  'w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20'

type FormFieldProps = {
  label: string
  children: ReactNode
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-sm font-semibold text-zinc-100">{label}</span>
      {children}
    </label>
  )
}

type InlineEditorPanelProps = {
  children: ReactNode
  error: string | null
  isSaving: boolean
  onCancel: () => void
  onSave: () => void
}

function InlineEditorPanel({ children, error, isSaving, onCancel, onSave }: InlineEditorPanelProps) {
  return (
    <div className="mt-5 text-left">
      {children}
      {error  ? (
        <div className="mt-3 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-3 py-2 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          <Check size={16} />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          <X size={16} />
          Cancelar
        </button>
      </div>
    </div>
  )
}

type IconButtonProps = {
  ariaLabel: string
  onClick: () => void
}

function IconButton({ ariaLabel, onClick }: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-200 transition hover:border-[#1DC95A]/60 hover:bg-[#1DC95A]/10 hover:text-white"
      onClick={onClick}
      type="button"
    >
      <Edit3 size={16} />
    </button>
  )
}

type EditButtonProps = {
  label: string
  onClick: () => void
}

function EditButton({ label, onClick }: EditButtonProps) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-100 transition hover:border-[#1DC95A]/60 hover:bg-[#1DC95A]/10"
      onClick={onClick}
      type="button"
    >
      <Edit3 size={16} />
      {label}
    </button>
  )
}

type SelectionDialogProps = {
  children: ReactNode
  description: string
  error: string | null
  isSaving: boolean
  onClose: () => void
  onSave: () => void
  title: string
}

function SelectionDialog({ children, description, error, isSaving, onClose, onSave, title }: SelectionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <section
        aria-label={title}
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-zinc-800 bg-[#181818] shadow-2xl shadow-black/50"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-200 transition hover:bg-zinc-800"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {error  ? (
          <div className="mx-5 mb-4 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <footer className="flex flex-col-reverse gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            onClick={onSave}
            type="button"
          >
            <Check size={16} />
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </footer>
      </section>
    </div>
  )
}

type ChoiceGridProps = {
  emptyText: string
  isLoading: boolean
  items: CatalogItem[]
  onToggle: (itemId: string) => void
  selectedIds: string[]
}

function ChoiceGrid({ emptyText, isLoading, items, onToggle, selectedIds }: ChoiceGridProps) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Carregando...</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-400">{emptyText}</p>
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isSelected = selectedIdSet.has(item.id)

        return (
          <button
            aria-pressed={isSelected}
            className={selectionButtonClassName(isSelected)}
            key={item.id}
            onClick={() => onToggle(item.id)}
            type="button"
          >
            {capitalizeDisplayName(item.name)}
          </button>
        )
      })}
    </div>
  )
}

type AvailabilitySelectionProps = {
  notes: string
  onNotesChange: (value: string) => void
  onTogglePeriod: (period: AvailabilityPeriod) => void
  onToggleTime: (time: AvailabilityTime) => void
  selectedPeriods: AvailabilityPeriod[]
  selectedTimes: AvailabilityTime[]
}

function AvailabilitySelection({
  notes,
  onNotesChange,
  onTogglePeriod,
  onToggleTime,
  selectedPeriods,
  selectedTimes,
}: AvailabilitySelectionProps) {
  return (
    <div className="grid gap-5">
      <section>
        <h3 className="text-sm font-bold text-zinc-100">Períodos</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {availabilityPeriodOptions.map((period) => {
            const isSelected = selectedPeriods.includes(period.value)

            return (
              <button
                aria-pressed={isSelected}
                className={selectionButtonClassName(isSelected)}
                key={period.value}
                onClick={() => onTogglePeriod(period.value)}
                type="button"
              >
                {getAvailabilityPeriodLabel(period.value)}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-zinc-100">Turnos</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {availabilityTimeOptions.map((time) => {
            const isSelected = selectedTimes.includes(time.value)

            return (
              <button
                aria-pressed={isSelected}
                className={selectionButtonClassName(isSelected)}
                key={time.value}
                onClick={() => onToggleTime(time.value)}
                type="button"
              >
                {getAvailabilityTimeLabel(time.value)}
              </button>
            )
          })}
        </div>
      </section>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-zinc-100">Observação</span>
        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Ex.: durante a semana só depois das 19h."
          value={notes}
        />
      </label>
    </div>
  )
}

type InstrumentSelectionProps = {
  emptyText: string
  isLoading: boolean
  items: InstrumentCatalogItem[]
  onToggleInstrument: (instrumentId: string) => void
  selectedInstrumentIds: string[]
}

function InstrumentSelection({
  emptyText,
  isLoading,
  items,
  onToggleInstrument,
  selectedInstrumentIds,
}: InstrumentSelectionProps) {
  const groupedItems = useMemo(() => groupInstrumentsByCategory(items), [items])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const selectedInstrumentSet = useMemo(() => new Set(selectedInstrumentIds), [selectedInstrumentIds])
  const activeGroup =
    groupedItems.find((group) => group.categoryId === activeCategoryId) ?? groupedItems[0] ?? null

  useEffect(() => {
    if (!activeGroup) {
      setActiveCategoryId(null)
      return
    }

    if (activeCategoryId !== activeGroup.categoryId) {
      setActiveCategoryId(activeGroup.categoryId)
    }
  }, [activeCategoryId, activeGroup])

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Carregando...</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-400">{emptyText}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {groupedItems.map((group) => {
          const selectedCount = group.items.filter((item) => selectedInstrumentSet.has(item.id)).length
          const isActive = group.categoryId === activeGroup?.categoryId

          return (
            <button
              className={[
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition',
                isActive
                  ?'border-[#1DC95A] bg-[#1DC95A] text-[#141414]'
                  : 'border-zinc-700 bg-[#141414] text-zinc-200 hover:bg-zinc-800',
              ].join(' ')}
              key={group.categoryId}
              onClick={() => setActiveCategoryId(group.categoryId)}
              type="button"
            >
              {capitalizeDisplayName(group.categoryName)}
              {selectedCount > 0  ? (
                <span
                  className={[
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                    isActive ?'bg-[#141414] text-[#1DC95A]' : 'bg-[#1DC95A] text-[#141414]',
                  ].join(' ')}
                >
                  {selectedCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {activeGroup  ? (
        <div className="rounded-lg border border-zinc-800 bg-[#141414] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-zinc-100">{capitalizeDisplayName(activeGroup.categoryName)}</h3>
            <p className="text-xs text-zinc-500">{activeGroup.items.length} opções</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeGroup.items.map((item) => {
              const isSelected = selectedInstrumentSet.has(item.id)

              return (
                <button
                  aria-pressed={isSelected}
                  className={selectionButtonClassName(isSelected)}
                  key={item.id}
                  onClick={() => onToggleInstrument(item.id)}
                  type="button"
                >
                  {capitalizeDisplayName(item.name)}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
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

type ProfileInfoCardProps = {
  action?: ReactNode
  icon: ReactNode
  title: string
  children: ReactNode
}

function ProfileInfoCard({ action, icon, title, children }: ProfileInfoCardProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-sm shadow-black/30">
      <div className="mb-7 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 font-bold">
          {icon}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="text-zinc-100">{children}</div>
    </article>
  )
}

type ProfileSectionProps = {
  action?: ReactNode
  icon?: ReactNode
  title: string
  description: string
  children: ReactNode
}

function ProfileSection({ action, icon, title, description, children }: ProfileSectionProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-sm shadow-black/30">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 font-bold">
            {icon}
            <h2>{title}</h2>
          </div>
          <p className="mt-2 text-zinc-400">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </article>
  )
}

function selectionButtonClassName(isSelected: boolean) {
  return [
    'min-w-0 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition',
    isSelected
      ?'border-[#1DC95A] bg-[#1DC95A] text-[#141414]'
      : 'border-zinc-800 bg-[#141414] text-zinc-200 hover:bg-zinc-800',
  ].join(' ')
}

function toggleId(currentIds: string[], itemId: string) {
  return currentIds.includes(itemId) ?currentIds.filter((currentId) => currentId !== itemId) : [...currentIds, itemId]
}

function getSelectedCatalogIds(items: CatalogItem[], selectedNames: string[]) {
  return items.filter((item) => selectedNames.includes(item.name)).map((item) => item.id)
}

function groupInstrumentsByCategory(items: InstrumentCatalogItem[]) {
  const grouped = new Map<string, { categoryId: string; categoryName: string; items: InstrumentCatalogItem[] }>()

  for (const item of items) {
    const existingGroup = grouped.get(item.categoryId)

    if (existingGroup) {
      existingGroup.items.push(item)
      continue
    }

    grouped.set(item.categoryId, {
      categoryId: item.categoryId,
      categoryName: item.category.name,
      items: [item],
    })
  }

  return Array.from(grouped.values()).sort((firstGroup, secondGroup) => {
    const firstOrder = getInstrumentCategoryOrder(firstGroup.categoryName)
    const secondOrder = getInstrumentCategoryOrder(secondGroup.categoryName)

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder
    }

    return firstGroup.categoryName.localeCompare(secondGroup.categoryName, 'pt-BR')
  })
}

function getInstrumentCategoryOrder(categoryName: string) {
  const normalizedCategory = normalizeInstrumentCategoryName(categoryName)
  const orderedCategories = ['teclas', 'vocal', 'percussao', 'cordas', 'producao', 'composicao', 'sopro']
  const categoryIndex = orderedCategories.indexOf(normalizedCategory)

  if (categoryIndex >= 0) {
    return categoryIndex
  }

  return normalizedCategory === 'outros' ?orderedCategories.length + 1 : orderedCategories.length
}

function normalizeInstrumentCategoryName(categoryName: string) {
  return categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

