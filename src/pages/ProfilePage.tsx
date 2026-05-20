import type { ReactNode } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Edit3, Guitar, MapPin, Music, Target, Trophy } from 'lucide-react'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import { PageHeader } from '../components/ui/PageHeader'
import { Tag } from '../components/ui/Tag'
import { useInstruments, useStyles } from '../hooks/useCatalogs'
import { currentUserQueryKey, useCurrentUser } from '../hooks/useCurrentUser'
import { collaborationGoalOptions, getCollaborationGoalLabel } from '../lib/collaboration-goals'
import { genderOptions, getGenderLabel } from '../lib/gender'
import { capitalizeDisplayName } from '../lib/text-format'
import { getMe } from '../services/auth.service'
import { replaceMyInstruments, replaceMyStyles, updateMyProfile } from '../services/profile.service'
import type { CatalogItem } from '../types/catalog'
import type { CurrentUser } from '../types/user'

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(80, 'Use no máximo 80 caracteres.'),
  city: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  experience: z.coerce
    .number()
    .int('Informe um número inteiro.')
    .min(0, 'A experiência não pode ser negativa.')
    .max(100, 'Informe até 100 anos.'),
  preferences: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  bio: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  collaborationGoals: z
    .array(z.enum(['BAND', 'RECORDING', 'LIVE_SHOWS', 'COMPOSITION', 'PRODUCTION', 'STUDY', 'CASUAL_JAM']))
    .max(7),
  instrumentIds: z.array(z.string()).max(20, 'Escolha até 20 instrumentos.'),
  styleIds: z.array(z.string()).max(20, 'Escolha até 20 estilos.'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { data: currentUser } = useCurrentUser()
  const { data: catalogInstruments = [], isLoading: isLoadingInstruments } = useInstruments()
  const { data: catalogStyles = [], isLoading: isLoadingStyles } = useStyles()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const profile = currentUser?.profile
  const displayName = profile?.displayName || currentUser?.email || 'Você'
  const city = profile?.city || 'Localização não informada'
  const gender = getGenderLabel(profile?.gender)
  const experienceYears = profile?.experience
  const instruments = profile?.instruments ?? []
  const styles = profile?.styles ?? []
  const about = profile?.bio || profile?.preferences || 'Conte um pouco sobre sua trajetória musical.'
  const collaborationGoalLabels = (profile?.collaborationGoals ?? []).map(getCollaborationGoalLabel)
  const mainInstrument = instruments[0] ? capitalizeDisplayName(instruments[0]) : 'Música'

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: profile?.displayName ?? '',
      city: profile?.city ?? '',
      gender: profile?.gender ?? 'PREFER_NOT_TO_SAY',
      experience: profile?.experience ?? 0,
      preferences: profile?.preferences ?? '',
      bio: profile?.bio ?? '',
      collaborationGoals: profile?.collaborationGoals ?? [],
      instrumentIds: [],
      styleIds: [],
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const [updatedProfile] = await Promise.all([
        updateMyProfile({
          displayName: values.displayName,
          city: values.city || undefined,
          gender: values.gender,
          experience: values.experience,
          preferences: values.preferences || undefined,
          bio: values.bio || undefined,
          collaborationGoals: values.collaborationGoals,
        }),
        replaceMyInstruments({ instrumentIds: values.instrumentIds }),
        replaceMyStyles({ styleIds: values.styleIds }),
      ])

      return updatedProfile
    },
    onSuccess: async () => {
      const freshUser = await queryClient.fetchQuery({
        queryKey: currentUserQueryKey,
        queryFn: getMe,
      })

      queryClient.setQueryData<CurrentUser>(currentUserQueryKey, (oldUser) => {
        return freshUser ?? oldUser
      })

      setIsEditing(false)
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Não foi possível salvar o perfil.'
        : 'Não foi possível salvar o perfil agora.'

      setError('root', { message })
    },
  })

  function openEditor() {
    const selectedInstrumentIds = catalogInstruments
      .filter((instrument) => profile?.instruments.includes(instrument.name))
      .map((instrument) => instrument.id)
    const selectedStyleIds = catalogStyles
      .filter((style) => profile?.styles.includes(style.name))
      .map((style) => style.id)

    reset({
      displayName: profile?.displayName ?? '',
      city: profile?.city ?? '',
      gender: profile?.gender ?? 'PREFER_NOT_TO_SAY',
      experience: profile?.experience ?? 0,
      preferences: profile?.preferences ?? '',
      bio: profile?.bio ?? profile?.preferences ?? '',
      collaborationGoals: profile?.collaborationGoals ?? [],
      instrumentIds: selectedInstrumentIds,
      styleIds: selectedStyleIds,
    })
    clearErrors()
    setIsEditing(true)
  }

  function closeEditor() {
    clearErrors()
    setIsEditing(false)
  }

  function handleProfileSubmit(values: ProfileFormValues) {
    clearErrors()

    const result = profileSchema.safeParse(values)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (
          field === 'displayName' ||
          field === 'city' ||
          field === 'gender' ||
          field === 'experience' ||
          field === 'preferences' ||
          field === 'bio' ||
          field === 'collaborationGoals'
        ) {
          setError(field, { message: issue.message })
        }
      }

      return
    }

    updateProfileMutation.mutate(result.data)
  }

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações musicais"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414]"
            onClick={openEditor}
            type="button"
          >
            <Edit3 size={17} />
            Editar Perfil
          </button>
        }
      />

      {isEditing ? (
        <form
          className="mb-6 rounded-lg border border-zinc-800 bg-[#181818] p-5 shadow-sm shadow-black/30"
          noValidate
          onSubmit={handleSubmit(handleProfileSubmit)}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Nome artistico" error={errors.displayName?.message}>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="Seu nome na plataforma"
                {...register('displayName')}
              />
            </FormField>

            <FormField label="Cidade" error={errors.city?.message}>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="São Paulo, SP"
                {...register('city')}
              />
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

            <FormField label="Anos de experiência" error={errors.experience?.message}>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                min={0}
                max={100}
                type="number"
                {...register('experience')}
              />
            </FormField>

            <FormField label="Sobre mim" error={errors.bio?.message}>
              <textarea
                className="min-h-28 w-full resize-y rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="Conte sobre sua trajetória musical"
                {...register('bio')}
              />
            </FormField>
          </div>

          <div className="mt-5">
            <GoalChoiceGroup error={errors.collaborationGoals?.message} register={register} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ChoiceGroup
              emptyText="Nenhum instrumento cadastrado"
              error={errors.instrumentIds?.message}
              isLoading={isLoadingInstruments}
              items={catalogInstruments}
              label="Instrumentos"
              registerName="instrumentIds"
              register={register}
            />

            <ChoiceGroup
              emptyText="Nenhum estilo cadastrado"
              error={errors.styleIds?.message}
              isLoading={isLoadingStyles}
              items={catalogStyles}
              label="Estilos musicais"
              registerName="styleIds"
              register={register}
            />
          </div>

          {errors.root ? (
            <div className="mt-4 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {errors.root.message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-[#1DC95A] px-4 py-2.5 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={updateProfileMutation.isPending}
              type="submit"
            >
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar perfil'}
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
              onClick={closeEditor}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[370px_1fr]">
        <div className="space-y-6">
          <article className="rounded-lg border border-zinc-800 bg-[#181818] p-6 text-center shadow-sm shadow-black/30">
            <div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg bg-gradient-to-br from-[#1DC95A] via-[#18592F] to-[#141414] text-white">
              <div className="flex flex-col items-center gap-4 rounded-lg bg-white/15 px-8 py-7 backdrop-blur-sm">
                <Guitar size={56} />
                <span className="text-sm font-bold">{mainInstrument}</span>
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-bold">{displayName}</h2>
            <p className="mt-1 text-zinc-400">{currentUser?.email}</p>
          </article>

          <ProfileInfoCard icon={<MapPin className="text-[#1DC95A]" size={22} />} title="Localização">
            <p>{city}</p>
          </ProfileInfoCard>

          <ProfileInfoCard icon={<Target className="text-[#1DC95A]" size={22} />} title="Gênero">
            <p>{gender}</p>
          </ProfileInfoCard>

          <ProfileInfoCard icon={<Trophy className="text-[#1DC95A]" size={22} />} title="Experiência Musical">
            {typeof experienceYears === 'number' ? (
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
          <ProfileSection title="Sobre Mim" description="Conte um pouco sobre você e sua trajetória musical">
            <p className="text-lg leading-relaxed text-zinc-200">{about}</p>
          </ProfileSection>

          <ProfileSection
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Instrumentos"
            description="Instrumentos que você toca"
          >
            <TagList items={instruments.map(capitalizeDisplayName)} emptyText="Nenhum instrumento informado" />
          </ProfileSection>

          <ProfileSection
            icon={<Music className="text-[#1DC95A]" size={22} />}
            title="Estilos Musicais"
            description="Estilos que você toca"
          >
            <TagList items={styles} emptyText="Nenhum estilo informado" />
          </ProfileSection>

          <ProfileSection
            icon={<Target className="text-[#1DC95A]" size={22} />}
            title="Objetivos de Colaboração"
            description="O que você está procurando na plataforma"
          >
            <TagList items={collaborationGoalLabels} emptyText="Nenhum objetivo informado" />
          </ProfileSection>

          <ProfileSection
            icon={<CalendarDays className="text-[#1DC95A]" size={22} />}
            title="Disponibilidade"
            description="Quando você costuma estar disponível"
          >
            <p className="text-zinc-400">Disponibilidade ainda não informada</p>
          </ProfileSection>
        </div>
      </section>
    </>
  )
}

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
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
  register: UseFormRegister<ProfileFormValues>
}

function GoalChoiceGroup({ error, register }: GoalChoiceGroupProps) {
  return (
    <fieldset className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
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

type ChoiceGroupProps = {
  emptyText: string
  error?: string
  isLoading: boolean
  items: CatalogItem[]
  label: string
  registerName: 'instrumentIds' | 'styleIds'
  register: UseFormRegister<ProfileFormValues>
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
  icon: ReactNode
  title: string
  children: ReactNode
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
  icon?: ReactNode
  title: string
  description: string
  children: ReactNode
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
