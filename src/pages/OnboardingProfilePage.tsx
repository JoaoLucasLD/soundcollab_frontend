import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, ChevronRight, Music } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type FieldPath, type UseFormRegister } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { CityAutocomplete } from '../components/CityAutocomplete'
import { InstrumentCategoryPicker } from '../components/InstrumentCategoryPicker'
import { useInstruments, useStyles } from '../hooks/useCatalogs'
import { currentUserQueryKey, useCurrentUser } from '../hooks/useCurrentUser'
import { availabilityPeriodOptions, availabilityTimeOptions } from '../lib/availability'
import { formatBirthDateForDisplay, formatBirthDateInput, parseBirthDateDisplay, validateBirthDateAge } from '../lib/birth-date'
import { collaborationGoalOptions } from '../lib/collaboration-goals'
import { genderOptions } from '../lib/gender'
import { isProfileComplete } from '../lib/profile-completion'
import { capitalizeDisplayName } from '../lib/text-format'
import { getMe } from '../services/auth.service'
import { replaceMyInstruments, replaceMyStyles, updateMyProfile } from '../services/profile.service'
import type { CatalogItem } from '../types/catalog'

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

const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(80, 'Use no máximo 80 caracteres.'),
  city: z.string().trim().min(2, 'Informe sua cidade.').max(120, 'Use no máximo 120 caracteres.'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
    message: 'Selecione seu gênero.',
  }),
  birthDate: z
    .string()
    .trim()
    .refine(validateBirthDateAge, 'Informe uma data válida para idade entre 18 e 100 anos.'),
  experience: z.coerce
    .number()
    .int('Informe um número inteiro.')
    .min(0, 'A experiência não pode ser negativa.')
    .max(100, 'Informe até 100 anos.'),
  bio: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  collaborationGoals: z.array(z.enum(collaborationGoalValues)).max(7),
  availabilityPeriods: z.array(z.enum(availabilityPeriodValues)).max(2),
  availabilityTimes: z.array(z.enum(availabilityTimeValues)).max(3),
  availabilityNotes: z.string().trim().max(300, 'Use no máximo 300 caracteres.').optional(),
  instrumentIds: z.array(z.string()).min(1, 'Escolha pelo menos um instrumento.').max(20),
  styleIds: z.array(z.string()).min(1, 'Escolha pelo menos um estilo.').max(20),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>
type OnboardingField = keyof OnboardingFormValues
type OnboardingStep = {
  title: string
  description: string
  fields: OnboardingField[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Informações iniciais',
    description: 'Comece com as informações que ajudam outros músicos a reconhecerem você.',
    fields: ['displayName', 'city', 'gender', 'birthDate', 'experience'],
  },
  {
    title: 'Sobre a colaboração',
    description: 'Conte um pouco sobre você, o tipo de projeto que procura e sua disponibilidade.',
    fields: ['bio', 'collaborationGoals', 'availabilityPeriods', 'availabilityTimes', 'availabilityNotes'],
  },
  {
    title: 'Som musical',
    description: 'Escolha seus instrumentos e estilos para melhorar as recomendações.',
    fields: ['instrumentIds', 'styleIds'],
  },
]

export function OnboardingProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const { data: instruments = [], isLoading: isLoadingInstruments } = useInstruments()
  const { data: styles = [], isLoading: isLoadingStyles } = useStyles()
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = onboardingSteps[activeStep]
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === onboardingSteps.length - 1


  
  const {
    clearErrors,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    setError,
    watch,
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      displayName: currentUser?.profile?.displayName ?? '',
      city: currentUser?.profile?.city ?? '',
      latitude: currentUser?.profile?.latitude ?? undefined,
      longitude: currentUser?.profile?.longitude ?? undefined,
      gender: currentUser?.profile?.gender ?? 'PREFER_NOT_TO_SAY',
      birthDate: formatBirthDateForDisplay(currentUser?.profile?.birthDate),
      experience: currentUser?.profile?.experience ?? 0,
      bio: '',
      collaborationGoals: [],
      availabilityPeriods: [],
      availabilityTimes: [],
      availabilityNotes: '',
      instrumentIds: [],
      styleIds: [],
    },
  })
  const selectedInstrumentIds = watch('instrumentIds')

  useEffect(() => {
    const profile = currentUser?.profile

    if (!profile) {
      return
    }

    reset({
      displayName: profile.displayName ?? '',
      city: profile.city ?? '',
      latitude: profile.latitude ?? undefined,
      longitude: profile.longitude ?? undefined,
      gender: profile.gender ?? 'PREFER_NOT_TO_SAY',
      birthDate: formatBirthDateForDisplay(profile.birthDate),
      experience: profile.experience ?? 0,
      bio: profile.bio ?? profile.preferences ?? '',
      collaborationGoals: profile.collaborationGoals ?? [],
      availabilityPeriods: profile.availabilityPeriods ?? [],
      availabilityTimes: profile.availabilityTimes ?? [],
      availabilityNotes: profile.availabilityNotes ?? '',
      instrumentIds: instruments
        .filter((instrument) => profile.instruments.includes(instrument.name))
        .map((instrument) => instrument.id),
      styleIds: styles.filter((style) => profile.styles.includes(style.name)).map((style) => style.id),
    })
  }, [currentUser?.profile, instruments, reset, styles])

  const completeProfileMutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      await updateMyProfile({
        displayName: values.displayName,
        city: values.city,
        ...getLocationPayload(values),
        gender: values.gender,
        birthDate: values.birthDate,
        experience: values.experience,
        bio: values.bio || undefined,
        collaborationGoals: values.collaborationGoals,
        availabilityPeriods: values.availabilityPeriods,
        availabilityTimes: values.availabilityTimes,
        availabilityNotes: values.availabilityNotes || undefined,
      })

      await Promise.all([
        replaceMyInstruments({ instrumentIds: values.instrumentIds }),
        replaceMyStyles({ styleIds: values.styleIds }),
      ])

      return getMe()
    },
    onSuccess: (freshUser) => {
      queryClient.setQueryData(currentUserQueryKey, freshUser)
      navigate('/descobrir', { replace: true })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Não foi possível concluir seu perfil.'
        : 'Não foi possível concluir seu perfil agora.'

      setError('root', { message })
    },
  })

  if (isProfileComplete(currentUser?.profile)) {
    return <Navigate to="/descobrir" replace />
  }

  function applyValidationErrors(result: ReturnType<typeof onboardingSchema.safeParse>) {
    if (result.success) {
      return
    }

    for (const issue of result.error.issues) {
      const field = issue.path[0]

      if (isOnboardingField(field)) {
        setError(field, { message: issue.message })
      }
    }
  }

  function validateCurrentStep() {
    clearErrors()
    const values = normalizeOnboardingBirthDate(getValues())
    const result = onboardingSchema.safeParse(values)

    if (!result.success) {
      const currentStepErrors = result.error.issues.filter((issue) =>
        currentStep.fields.includes(issue.path[0] as OnboardingField),
      )

      for (const issue of currentStepErrors) {
        const field = issue.path[0]

        if (isOnboardingField(field)) {
          setError(field, { message: issue.message })
        }
      }

      return currentStepErrors.length === 0
    }

    return true
  }

  function handleNextStep() {
    if (!validateCurrentStep()) {
      return
    }

    setActiveStep((step) => Math.min(step + 1, onboardingSteps.length - 1))
  }

  function handlePreviousStep() {
    clearErrors()
    setActiveStep((step) => Math.max(step - 1, 0))
  }

  function handleToggleInstrument(instrumentId: string) {
    const nextInstrumentIds = selectedInstrumentIds.includes(instrumentId)
      ? selectedInstrumentIds.filter((selectedId) => selectedId !== instrumentId)
      : [...selectedInstrumentIds, instrumentId]

    setValue('instrumentIds', nextInstrumentIds, { shouldDirty: true })

    if (nextInstrumentIds.length > 0) {
      clearErrors('instrumentIds')
    }
  }

  function handleOnboardingSubmit(values: OnboardingFormValues) {
    clearErrors()

    const result = onboardingSchema.safeParse(normalizeOnboardingBirthDate(values))

    if (!result.success) {
      applyValidationErrors(result)
      const firstInvalidStep = onboardingSteps.findIndex((step) =>
        result.error.issues.some((issue) => step.fields.includes(issue.path[0] as OnboardingField)),
      )

      if (firstInvalidStep >= 0) {
        setActiveStep(firstInvalidStep)
      }

      return
    }

    completeProfileMutation.mutate(result.data)
  }

  return (
    <main className="min-h-screen bg-[#141414] px-5 py-8 text-zinc-50">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center gap-3">
          <Music className="text-[#1DC95A]" size={28} />
          <div>
            <p className="text-xl font-bold leading-tight text-white">SoundCollab</p>
            <p className="text-sm text-zinc-400">Monte seu perfil musical</p>
          </div>
        </header>

        <section className="mb-6">
          <p className="text-sm font-bold text-[#1DC95A]">
            Etapa {activeStep + 1} de {onboardingSteps.length}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">{currentStep.title}</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">{currentStep.description}</p>
        </section>

        <form
          className="rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-lg shadow-black/30"
          noValidate
          onSubmit={handleSubmit(handleOnboardingSubmit)}
        >
          <StepProgress activeStep={activeStep} />

          <div className="mt-6">
            {activeStep === 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <FormField label="Nome" error={errors.displayName?.message}>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    placeholder="Como você quer aparecer"
                    {...register('displayName')}
                  />
                </FormField>

                <FormField label="Cidade" error={errors.city?.message}>
                  <CityAutocomplete
                    inputClassName="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    onChange={(value) => {
                      setValue('city', value, { shouldDirty: true, shouldValidate: true })
                      setValue('latitude', null, { shouldDirty: true })
                      setValue('longitude', null, { shouldDirty: true })
                    }}
                    onSelect={(city) => {
                      setValue('city', city.label, { shouldDirty: true, shouldValidate: true })
                      setValue('latitude', city.latitude, { shouldDirty: true })
                      setValue('longitude', city.longitude, { shouldDirty: true })
                    }}
                    placeholder="Itajubá, MG"
                    value={watch('city')}
                  />
                  <p className="mt-2 text-sm text-zinc-400">
                    Para utilizar o filtro de distância, informe sua localização.
                  </p>
                </FormField>

                <FormField label="Gênero" error={errors.gender?.message}>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    {...register('gender')}
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Data de nascimento" error={errors.birthDate?.message}>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="dd/mm/aaaa"
                    type="text"
                    {...register('birthDate', {
                      onChange: (event) => {
                        event.target.value = formatBirthDateInput(event.target.value)
                      },
                    })}
                  />
                </FormField>

                <FormField label="Anos de experiência" error={errors.experience?.message}>
                  <input
                    className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    min={0}
                    max={100}
                    type="number"
                    {...register('experience')}
                  />
                </FormField>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="grid gap-4">
                <FormField label="Sobre mim" error={errors.bio?.message}>
                  <textarea
                    className="min-h-32 w-full resize-y rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                    placeholder="Conte sobre sua vivência musical, rotina e referências."
                    {...register('bio')}
                  />
                </FormField>

                <GoalChoiceGroup error={errors.collaborationGoals?.message} register={register} />

                <AvailabilityChoiceGroup
                  notesError={errors.availabilityNotes?.message}
                  periodsError={errors.availabilityPeriods?.message}
                  register={register}
                  timesError={errors.availabilityTimes?.message}
                />
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="grid min-w-0 gap-5">
                <InstrumentCategoryPicker
                  emptyText="Nenhum instrumento cadastrado"
                  error={errors.instrumentIds?.message}
                  isLoading={isLoadingInstruments}
                  items={instruments}
                  onToggleValue={handleToggleInstrument}
                  selectedValues={selectedInstrumentIds}
                />
                <ChoiceGroup
                  emptyText="Nenhum estilo cadastrado"
                  error={errors.styleIds?.message}
                  isLoading={isLoadingStyles}
                  items={styles}
                  label="Estilos musicais"
                  register={register}
                  registerName="styleIds"
                />
              </div>
            ) : null}
          </div>

          {errors.root ? (
            <div className="mt-5 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {errors.root.message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isFirstStep || completeProfileMutation.isPending}
              onClick={handlePreviousStep}
              type="button"
            >
              <ChevronLeft size={17} />
              Voltar
            </button>

            {isLastStep ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-5 py-3 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={completeProfileMutation.isPending || isLoadingInstruments || isLoadingStyles}
                type="submit"
              >
                <Check size={17} />
                {completeProfileMutation.isPending ? 'Salvando...' : 'Concluir perfil'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1DC95A] px-5 py-3 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352]"
                onClick={handleNextStep}
                type="button"
              >
                Continuar
                <ChevronRight size={17} />
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

type StepProgressProps = {
  activeStep: number
}

function StepProgress({ activeStep }: StepProgressProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {onboardingSteps.map((step, index) => {
        const isActive = index === activeStep
        const isDone = index < activeStep

        return (
          <li
            className={[
              'rounded-lg border px-3 py-3 text-sm font-semibold transition',
              isActive || isDone
                ? 'border-[#1DC95A]/50 bg-[#1DC95A]/10 text-white'
                : 'border-zinc-800 bg-[#141414] text-zinc-400',
            ].join(' ')}
            key={step.title}
          >
            <span
              className={[
                'mr-2 inline-flex size-6 items-center justify-center rounded-full text-xs',
                isActive || isDone ? 'bg-[#1DC95A] text-[#141414]' : 'bg-zinc-800 text-zinc-400',
              ].join(' ')}
            >
              {index + 1}
            </span>
            {step.title}
          </li>
        )
      })}
    </ol>
  )
}

type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-100">{label}</span>
      {children}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </label>
  )
}

type GoalChoiceGroupProps = {
  error?: string
  register: UseFormRegister<OnboardingFormValues>
}

function GoalChoiceGroup({ error, register }: GoalChoiceGroupProps) {
  return (
    <fieldset className="min-w-0 rounded-lg border border-zinc-800 bg-[#141414] p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-100">Objetivos de colaboração</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {collaborationGoalOptions.map((goal) => (
          <label
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
            key={goal.value}
          >
            <input
              className="size-4 accent-[#1DC95A]"
              type="checkbox"
              value={goal.value}
              {...register('collaborationGoals')}
            />
            {goal.label}
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </fieldset>
  )
}

type AvailabilityChoiceGroupProps = {
  notesError?: string
  periodsError?: string
  register: UseFormRegister<OnboardingFormValues>
  timesError?: string
}

function AvailabilityChoiceGroup({
  notesError,
  periodsError,
  register,
  timesError,
}: AvailabilityChoiceGroupProps) {
  return (
    <fieldset className="min-w-0 rounded-lg border border-zinc-800 bg-[#141414] p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-100">Disponibilidade</legend>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-200">Períodos</p>
          <div className="flex flex-wrap gap-2">
            {availabilityPeriodOptions.map((period) => (
              <label
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                key={period.value}
              >
                <input
                  className="size-4 accent-[#1DC95A]"
                  type="checkbox"
                  value={period.value}
                  {...register('availabilityPeriods')}
                />
                {period.label}
              </label>
            ))}
          </div>
          {periodsError ? <p className="mt-2 text-sm text-red-300">{periodsError}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-200">Turnos</p>
          <div className="flex flex-wrap gap-2">
            {availabilityTimeOptions.map((time) => (
              <label
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                key={time.value}
              >
                <input
                  className="size-4 accent-[#1DC95A]"
                  type="checkbox"
                  value={time.value}
                  {...register('availabilityTimes')}
                />
                {time.label}
              </label>
            ))}
          </div>
          {timesError ? <p className="mt-2 text-sm text-red-300">{timesError}</p> : null}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-semibold text-zinc-100">Observação</span>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-zinc-700 bg-[#181818] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
          placeholder="Ex.: durante a semana só depois das 19h."
          {...register('availabilityNotes')}
        />
      </label>
      {notesError ? <p className="mt-2 text-sm text-red-300">{notesError}</p> : null}
    </fieldset>
  )
}

type ChoiceGroupProps = {
  emptyText: string
  error?: string
  isLoading: boolean
  items: CatalogItem[]
  label: string
  registerName: FieldPath<OnboardingFormValues>
  register: UseFormRegister<OnboardingFormValues>
}

function ChoiceGroup({
  emptyText,
  error,
  isLoading,
  items,
  label,
  registerName,
  register,
}: ChoiceGroupProps) {
  return (
    <fieldset className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-100">{label}</legend>
      {isLoading ? <p className="mt-3 text-sm text-zinc-400">Carregando...</p> : null}
      {!isLoading && items.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{emptyText}</p> : null}
      {items.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label
              className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
              key={item.id}
            >
              <input
                className="size-4 accent-[#1DC95A]"
                type="checkbox"
                value={item.id}
                {...register(registerName)}
              />
              {capitalizeDisplayName(item.name)}
            </label>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </fieldset>
  )
}

function normalizeOnboardingBirthDate(values: OnboardingFormValues) {
  return {
    ...values,
    birthDate: parseBirthDateDisplay(values.birthDate),
  }
}

function getLocationPayload(values: OnboardingFormValues) {
  if (typeof values.latitude === 'number' && typeof values.longitude === 'number') {
    return { latitude: values.latitude, longitude: values.longitude }
  }

  if (values.latitude === null && values.longitude === null) {
    return { latitude: null, longitude: null }
  }

  return {}
}

function isOnboardingField(field: unknown): field is OnboardingField {
  return (
    field === 'displayName' ||
    field === 'city' ||
    field === 'gender' ||
    field === 'birthDate' ||
    field === 'experience' ||
    field === 'bio' ||
    field === 'collaborationGoals' ||
    field === 'availabilityPeriods' ||
    field === 'availabilityTimes' ||
    field === 'availabilityNotes' ||
    field === 'instrumentIds' ||
    field === 'styleIds'
  )
}
