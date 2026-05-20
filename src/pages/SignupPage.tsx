import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Music } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getAuthToken } from '../lib/api'
import { signup } from '../services/auth.service'

const signupSchema = z
  .object({
    email: z.string().email('Informe um email válido.'),
    password: z
      .string()
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .max(72, 'A senha deve ter no máximo 72 caracteres.')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
      .regex(/\d/, 'Inclua pelo menos um número.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
  const navigate = useNavigate()
  const token = getAuthToken()

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<SignupFormValues>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      navigate('/onboarding/perfil', { replace: true })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Não foi possível criar sua conta.'
        : 'Não foi possível criar sua conta agora.'

      setError('root', { message })
    },
  })

  if (token) {
    return <Navigate to="/descobrir" replace />
  }

  function handleSignupSubmit(values: SignupFormValues) {
    clearErrors()

    const result = signupSchema.safeParse(values)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (field === 'email' || field === 'password' || field === 'confirmPassword') {
          setError(field, { message: issue.message })
        }
      }

      return
    }

    signupMutation.mutate({
      email: result.data.email,
      password: result.data.password,
    })
  }

  return (
    <main className="min-h-screen bg-[#141414] px-5 py-8 text-zinc-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <Music size={23} />
          <div>
            <p className="text-xl font-bold leading-tight text-white">SoundCollab</p>
            <p className="text-sm text-zinc-400">Crie sua conta de músico</p>
          </div>
        </div>

        <section className="rounded-lg border border-zinc-800 bg-[#181818] p-6 shadow-lg shadow-black/30">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Criar conta</h1>
            <p className="mt-2 text-sm text-zinc-400">Entre na rede para encontrar parceiros musicais.</p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit(handleSignupSubmit)}>
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
                placeholder="Mínimo 8 caracteres"
                type="password"
                {...register('password')}
              />
              {errors.password ? <p className="mt-2 text-sm text-red-300">{errors.password.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-100">Confirmar senha</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#1DC95A] focus:ring-2 focus:ring-[#1DC95A]/20"
                placeholder="Repita sua senha"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <p className="mt-2 text-sm text-red-300">{errors.confirmPassword.message}</p>
              ) : null}
            </label>

            {errors.root ? (
              <div className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {errors.root.message}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1DC95A] px-4 py-3 text-sm font-bold text-[#141414] transition hover:bg-[#1CB352] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={signupMutation.isPending}
              type="submit"
            >
              {signupMutation.isPending ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Já tem uma conta?{' '}
            <Link className="font-bold text-[#1DC95A] transition hover:text-[#1CB352]" to="/login">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
