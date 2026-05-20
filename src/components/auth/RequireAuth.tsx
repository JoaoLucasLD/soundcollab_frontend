import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { clearAuthToken, getAuthToken } from '../../lib/api'
import { isProfileComplete } from '../../lib/profile-completion'

export function RequireAuth() {
  const location = useLocation()
  const token = getAuthToken()
  const currentUserQuery = useCurrentUser()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (currentUserQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#141414] px-5 text-zinc-100">
        <div className="rounded-lg border border-zinc-800 bg-[#181818] px-5 py-4 text-sm font-semibold shadow-lg shadow-black/30">
          Carregando sua sessão...
        </div>
      </main>
    )
  }

  if (currentUserQuery.isError) {
    clearAuthToken()
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')

  if (!isOnboardingRoute && !isProfileComplete(currentUserQuery.data?.profile)) {
    return <Navigate to="/onboarding/perfil" replace />
  }

  return <Outlet />
}
