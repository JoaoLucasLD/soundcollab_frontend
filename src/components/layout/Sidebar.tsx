import { Heart, Home, Music, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/descobrir', label: 'Descobrir', icon: Home },
  { to: '/colaboracoes', label: 'Colaborações', icon: Heart },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export function Sidebar() {
  return (
    <aside className="border-zinc-800 bg-[#181818] lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
        {/* <div className="flex size-11 items-center justify-center rounded-full bg-[#1DC95A] text-[#141414] shadow-sm">
          <Music2 size={24} />
        </div> */}
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

      <div className="hidden border-t border-zinc-800 px-5 py-4 text-xs text-zinc-500 lg:block">
        © 2026 SoundCollab
      </div>
    </aside>
  )
}
