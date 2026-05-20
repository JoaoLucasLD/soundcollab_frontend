import { useQueryClient } from '@tanstack/react-query'
import { Heart, Home, LogOut, Music, UserRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { currentUserQueryKey, useCurrentUser } from '../../hooks/useCurrentUser'
import { clearAuthToken } from '../../lib/api'

const navigationItems = [
  { to: '/descobrir', label: 'Descobrir', icon: Home },
  { to: '/colaboracoes', label: 'Colaboracoes', icon: Heart },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export function Sidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  function handleLogout() {
    clearAuthToken()
    queryClient.removeQueries({ queryKey: currentUserQueryKey })
    navigate('/login', { replace: true })
  }

  return (
    <aside className="border-zinc-800 bg-[#181818] lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
        <Music />
        <div>
          <p className="text-lg font-bold leading-tight text-white">SoundCollab</p>
          <p className="text-xs text-zinc-400">Conecte-se com músicos</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] lg:flex-1 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-4 lg:py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-w-fit items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[#1DC95A] text-[#141414] shadow-md shadow-black/30'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="hidden border-t border-zinc-800 px-5 py-4 lg:block">
        <p className="truncate text-xs font-semibold text-zinc-300">
          {currentUser?.profile?.displayName ?? currentUser?.email ?? 'SoundCollab'}
        </p>
        {currentUser?.profile?.displayName ? (
          <p className="mt-1 truncate text-xs text-zinc-500">{currentUser.email}</p>
        ) : null}
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-100 transition hover:bg-zinc-800"
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
