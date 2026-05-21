import axios from 'axios'
import { Music } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login } from '../services/auth.service'
import { clearAuthToken, getAuthToken } from '../lib/api'
import { currentUserQueryKey, useCurrentUser } from '../hooks/useCurrentUser'

const loginSchema = z.object({
  email: z.string().email('Informe um email válido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const token = getAuthToken()
  const currentUserQuery = useCurrentUser()
  const state = location.state as LoginLocationState | null
  const redirectTo = state?.from?.pathname ?? '/descobrir'

  const {
    formState: { errors },
    clearErrors,
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: currentUserQueryKey })
      navigate(redirectTo, { replace: true })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Não foi possível entrar com essas credenciais.'
        : 'Não foi possível entrar agora.'

      setError('root', { message })
    },
  })

  useEffect(() => {
    if (token && currentUserQuery.isError) {
      clearAuthToken()
      queryClient.removeQueries({ queryKey: currentUserQueryKey })
    }
  }, [currentUserQuery.isError, queryClient, token])

  if (token && currentUserQuery.isSuccess) {
    return <Navigate to="/descobrir" replace />
  }

  function handleLoginSubmit(values: LoginFormValues) {
    clearErrors()

    const result = loginSchema.safeParse(values)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (field === 'email' || field === 'password') {
          setError(field, { message: issue.message })
        }
      }

      return
    }

    loginMutation.mutate(result.data)
  }

  return (
    <main className="min-h-screen bg-[#141414] px-5 py-8 text-zinc-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          {/* <div className="flex size-11 items-center justify-center rounded-full bg-[#1DC95A] text-[#141414]"> */}
          <Music size={23} />
          {/* </div> */}
          <div>
            <p className="text-xl font-bold leading-tight text-white">SoundCollab</p>
            <p className="text-sm text-zinc-400">Conecte-se com músicos</p>
          </div>
        </div>

        <section className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-lg shadow-black/30">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Entrar</h1>
            <p className="mt-2 text-sm text-zinc-400">Acesse sua conta para encontrar colaboradores.</p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit(handleLoginSubmit)}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-100">Email</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="email@email.com"
                type="email"
                {...register('email')}
              />
              {errors.email ? <p className="mt-2 text-sm text-red-300">{errors.email.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-100">Senha</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="Sua senha"
                type="password"
                {...register('password')}
              />
              {errors.password ? (
                <p className="mt-2 text-sm text-red-300">{errors.password.message}</p>
              ) : null}
            </label>

            {errors.root ? (
              <div className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {errors.root.message}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Ainda não tem conta?{' '}
            <Link className="font-bold text-[#1DC95A] transition hover:text-[#1CB352]" to="/cadastro">
              Criar conta
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
